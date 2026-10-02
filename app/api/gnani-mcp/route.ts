import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { resolveScenario, maybeDelay, errorPayload } from "@/lib/scenarios";

function textResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

// Gnani's real API (asr.gnani.ai) is gRPC, authenticated with a token + access
// key + cert.pem emailed after signup — not a drop-in REST call. Until the
// full cert pair is available, this mirrors the Delhivery connector's
// approach: realistic shapes, gated on the real credential actually being
// configured, with the same ERR- failure-injection convention.
function requireCredential() {
  if (!process.env.GNANI_API_KEY) {
    throw new Error("GNANI_API_KEY is not configured on this deployment.");
  }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "text_to_speech",
      "Gnani: synthesize speech from text (voice agent output channel). Send text containing ERR-TIMEOUT / ERR-MALFORMED to force that failure mode.",
      {
        text: z.string(),
        language: z.string().default("en-IN"),
        voice: z.string().default("default"),
      },
      async (args) => {
        requireCredential();
        const scenario = resolveScenario(args.text);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "text_to_speech"));
        return textResult({
          audio_url: `https://mock-gnani.example/tts/${Date.now()}.wav`,
          duration_seconds: Math.max(1, Math.round(args.text.length / 14)),
          language: args.language,
          voice: args.voice,
        });
      }
    );

    server.tool(
      "speech_to_text",
      "Gnani: transcribe a voice input (voice agent input channel). Send audio_url containing ERR-TIMEOUT / ERR-MALFORMED to force that failure mode.",
      {
        audio_url: z.string(),
        language: z.string().default("en-IN"),
      },
      async (args) => {
        requireCredential();
        const scenario = resolveScenario(args.audio_url);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "speech_to_text"));
        return textResult({
          transcript: "[mock transcript — real Gnani ASR pending token/accesskey/cert.pem]",
          confidence: 0.94,
          language: args.language,
        });
      }
    );
  },
  {},
  { streamableHttpEndpoint: "/api/gnani-mcp", sseEndpoint: "/api/gnani-mcp/sse", sseMessageEndpoint: "/api/gnani-mcp/message" }
);

export { handler as GET, handler as POST, handler as DELETE };
