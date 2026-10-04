// Thin REST wrapper around the shared Ken agent brain (lib/kenAgentRunner.ts), used
// by our own /ken-agent UI. The same brain is also exposed as a single Pine Labs
// connector tool in app/api/ken-wrapper-mcp/route.ts — see that file for why.

import Anthropic from "@anthropic-ai/sdk";
import { runKenAgent } from "@/lib/kenAgentRunner";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages } = body as { messages?: Anthropic.Beta.Messages.BetaMessageParam[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages[] is required" }, { status: 400 });
  }

  const result = await runKenAgent(messages);
  return Response.json(result);
}
