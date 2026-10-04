// Pure tool logic for the in-app Ken agent (app/api/ken-agent/route.ts).
// Mirrors the mock behavior of app/api/mcp/route.ts and app/api/gnani-mcp/route.ts
// but is kept separate so those already-registered Pine Labs MCP connectors are
// never touched by this experiment.

// This file uses zod/v4 specifically (not the top-level "zod" v3 export used by
// the MCP route handlers) because @anthropic-ai/sdk's betaZodTool() requires a
// zod v4 schema. Both live in the same installed zod package (3.25.x ships both
// APIs via separate entry points) — no extra dependency or version bump needed.
import { z } from "zod/v4";
import { resolveScenario, maybeDelay, errorPayload } from "@/lib/scenarios";

export const createShipmentSchema = z.object({
  order_id: z.string(),
  consignee_name: z.string(),
  consignee_address: z.string(),
  consignee_pincode: z.string(),
  consignee_phone: z.string(),
  payment_mode: z.enum(["Prepaid", "COD"]).default("Prepaid"),
  weight_grams: z.number().default(150),
  products_desc: z.string().default("Insurance policy document"),
});

export async function createShipment(args: z.infer<typeof createShipmentSchema>) {
  const pincodeScenario = resolveScenario(args.consignee_pincode);
  const scenario = pincodeScenario !== "success" ? pincodeScenario : resolveScenario(args.order_id);
  await maybeDelay(scenario);
  if (scenario !== "success") return errorPayload(scenario, "create_shipment");
  const waybill = `DLV${Math.floor(10000000 + Math.random() * 89999999)}`;
  return {
    waybill,
    status: "Manifested",
    pickup_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    courier_partner: "Delhivery",
    label_url: `https://mock-delhivery.example/labels/${waybill}.pdf`,
  };
}

export const getRenewalQuoteSchema = z.object({ policy_number: z.string() });

export async function getRenewalQuote(args: z.infer<typeof getRenewalQuoteSchema>) {
  const scenario = resolveScenario(args.policy_number);
  await maybeDelay(scenario);
  if (scenario !== "success") return errorPayload(scenario, "get_renewal_quote");
  return {
    policy_number: args.policy_number,
    insurer: "Apex Health Insurance",
    current_premium: 18500,
    renewal_premium: 24200,
    room_rent_limit_pct: 1.0,
    co_pay_percent: 20,
    waiting_period_notes: "Pre-existing disease waiting period: 2 years remaining",
    no_claim_bonus_percent: 10,
  };
}

export const negotiatePremiumSchema = z.object({
  policy_number: z.string(),
  target_premium: z.number(),
  requested_benefit_changes: z.array(z.string()).default([]),
});

export async function negotiatePremium(args: z.infer<typeof negotiatePremiumSchema>) {
  const scenario = resolveScenario(args.policy_number);
  await maybeDelay(scenario);
  if (scenario !== "success") return errorPayload(scenario, "negotiate_premium");
  return {
    policy_number: args.policy_number,
    negotiation_status: "countered",
    counter_offer: {
      premium: Math.round(args.target_premium * 1.04),
      benefits_granted: args.requested_benefit_changes.slice(0, 1),
      benefits_denied: args.requested_benefit_changes.slice(1),
    },
  };
}

export const getHospitalNetworkSchema = z.object({
  city: z.string(),
  policy_number: z.string(),
});

export async function getHospitalNetwork(args: z.infer<typeof getHospitalNetworkSchema>) {
  const scenario = resolveScenario(args.policy_number);
  await maybeDelay(scenario);
  if (scenario !== "success") return errorPayload(scenario, "get_hospital_network");
  return {
    city: args.city,
    network_hospitals: [
      { name: "Apex City Hospital", room_category_eligible: "Single Private", cashless: true },
      { name: "Sunrise Multispecialty", room_category_eligible: "Twin Sharing", cashless: true },
    ],
  };
}

export const textToSpeechSchema = z.object({
  text: z.string(),
  language: z.string().default("en-IN"),
  voice: z.string().default("default"),
});

export async function textToSpeech(args: z.infer<typeof textToSpeechSchema>) {
  if (!process.env.GNANI_API_KEY) {
    return { error: "GNANI_API_KEY is not configured on this deployment." };
  }
  const scenario = resolveScenario(args.text);
  await maybeDelay(scenario);
  if (scenario !== "success") return errorPayload(scenario, "text_to_speech");
  return {
    audio_url: `https://mock-gnani.example/tts/${Date.now()}.wav`,
    duration_seconds: Math.max(1, Math.round(args.text.length / 14)),
    language: args.language,
    voice: args.voice,
  };
}

export const speechToTextSchema = z.object({
  audio_url: z.string(),
  language: z.string().default("en-IN"),
});

export async function speechToText(args: z.infer<typeof speechToTextSchema>) {
  if (!process.env.GNANI_API_KEY) {
    return { error: "GNANI_API_KEY is not configured on this deployment." };
  }
  const scenario = resolveScenario(args.audio_url);
  await maybeDelay(scenario);
  if (scenario !== "success") return errorPayload(scenario, "speech_to_text");
  return {
    transcript: "[mock transcript — real Gnani ASR pending token/accesskey/cert.pem]",
    confidence: 0.94,
    language: args.language,
  };
}
