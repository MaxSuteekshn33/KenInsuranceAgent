// Deterministic mock-response logic shared by every tool.
//
// Real Delhivery / insurer systems don't take a "test_scenario" flag, so instead
// we key off values that would plausibly show up in real eval inputs: a waybill
// or policy number prefix, or an explicit pincode. This lets the Round 3 eval
// cases trigger each failure mode just by choosing which identifier to send,
// the same way a real bad response would be triggered by a real bad input.

export type ScenarioKey =
  | "success"
  | "no_slot_available"
  | "balance_exhausted"
  | "timeout"
  | "malformed"
  | "unserviceable"
  | "rejected";

export function resolveScenario(identifier: string | undefined): ScenarioKey {
  const v = (identifier ?? "").toUpperCase();
  if (v.includes("ERR-TIMEOUT")) return "timeout";
  if (v.includes("ERR-NOSLOT")) return "no_slot_available";
  if (v.includes("ERR-LOWBALANCE")) return "balance_exhausted";
  if (v.includes("ERR-MALFORMED")) return "malformed";
  if (v.includes("ERR-UNSERVICEABLE")) return "unserviceable";
  if (v.includes("ERR-REJECTED")) return "rejected";
  return "success";
}

export async function maybeDelay(scenario: ScenarioKey) {
  if (scenario === "timeout") {
    // Simulate a hung upstream call. The MCP tool call will itself time out
    // on the agent side if its client timeout is shorter than this.
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }
}

export function errorPayload(scenario: ScenarioKey, context: string) {
  switch (scenario) {
    case "no_slot_available":
      return { error_code: "NO_SLOT_AVAILABLE", message: `${context}: no pickup/delivery slot available for the requested window.` };
    case "balance_exhausted":
      return { error_code: "RETENTION_BUDGET_EXHAUSTED", message: `${context}: insurer's approval budget for this request is exhausted this cycle.` };
    case "unserviceable":
      return { error_code: "PINCODE_NOT_SERVICEABLE", message: `${context}: destination pincode is outside the serviceable network.` };
    case "rejected":
      return { error_code: "REQUEST_REJECTED", message: `${context}: the counterparty rejected this request.` };
    case "malformed":
      // Intentionally broken shape: wrong type, missing required field, extra noise.
      return { status: 1, data: null, unexpected_field: [undefined, "??"] } as unknown;
    default:
      return null;
  }
}
