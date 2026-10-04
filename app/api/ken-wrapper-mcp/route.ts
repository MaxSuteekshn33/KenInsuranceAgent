// Wraps the entire unified Ken agent (lib/kenAgentRunner.ts — insurer PAS, Delhivery,
// real Gmail send, Gnani voice, all 7 tools) behind a SINGLE MCP tool, so Pine Labs can
// register it as one connector with one tool. This sidesteps the authorized_tools
// platform bug that rejects a connector exposing 4+ tools directly (documented against
// mcp_delhivery_ken on two separate logins — see docs/system-prompt-v4.md) — from Pine
// Labs' perspective there's only ever one tool call here, ask_ken, and all the real
// multi-tool orchestration happens inside our own Claude API call, invisible to their
// authorized_tools validation.
//
// Conversation continuity: MCP tools are stateless per call, so the caller (Pine Labs'
// outer agent) is expected to pass prior turns back as `history` (a JSON-encoded array
// of {role, content}) on every call if it wants multi-turn context preserved. Omitting
// `history` starts a fresh conversation.

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { runKenAgent } from "@/lib/kenAgentRunner";

export const maxDuration = 60;

function textResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

const historyTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "ask_ken",
      "Ken: the full unified insurance-renewal agent (insurer PAS read/negotiate, Delhivery courier, real Gmail send, Gnani voice) behind one call. Pass the user's latest message as `message`. To continue a prior conversation, pass `history` as a JSON-stringified array of {role, content} turns from earlier calls in this thread — omit it to start fresh. Returns Ken's natural-language reply plus a log of which internal tools it called this turn.",
      {
        message: z.string(),
        history: z
          .string()
          .optional()
          .describe(
            'JSON-stringified array of prior {role: "user"|"assistant", content: string} turns, oldest first. Omit to start a new conversation.'
          ),
      },
      async (args) => {
        let priorMessages: Anthropic.Beta.Messages.BetaMessageParam[] = [];
        if (args.history) {
          try {
            const parsed = JSON.parse(args.history);
            const validated = z.array(historyTurnSchema).safeParse(parsed);
            if (validated.success) {
              priorMessages = validated.data as Anthropic.Beta.Messages.BetaMessageParam[];
            } else {
              return textResult({
                error: "`history` did not match the expected [{role, content}] shape.",
                details: validated.error.issues,
              });
            }
          } catch {
            return textResult({ error: "`history` was not valid JSON." });
          }
        }

        const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
          ...priorMessages,
          { role: "user", content: args.message },
        ];

        try {
          const result = await runKenAgent(messages, { fast: true });
          return textResult({
            reply: result.reply,
            tool_calls: result.toolLog.map((t) => ({ name: t.name, input: t.input, result: t.result })),
            // Convenience: the caller can append this turn + Ken's reply to its own
            // stored history and pass the updated array back as `history` next call.
            updated_history: [
              ...priorMessages,
              { role: "user", content: args.message },
              { role: "assistant", content: result.reply },
            ],
          });
        } catch (err) {
          return textResult({
            error: "ask_ken failed",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    );
  },
  {},
  {
    streamableHttpEndpoint: "/api/ken-wrapper-mcp",
    sseEndpoint: "/api/ken-wrapper-mcp/sse",
    sseMessageEndpoint: "/api/ken-wrapper-mcp/message",
  }
);

export { handler as GET, handler as POST, handler as DELETE };
