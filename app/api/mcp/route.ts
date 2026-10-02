import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { resolveScenario, maybeDelay, errorPayload } from "@/lib/scenarios";

function textResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

const handler = createMcpHandler(
  (server) => {
    // ---------------------------------------------------------------------
    // Delhivery-shaped connector (mocked). Endpoint names and fields mirror
    // Delhivery's published logistics API so the shapes are drop-in
    // compatible with the real thing later.
    // ---------------------------------------------------------------------

    server.tool(
      "create_shipment",
      "Delhivery: create a forward shipment (mirrors /api/cmu/create.json). Used by Ken to courier the renewed physical policy document / welcome kit to the family's address. Send a waybill containing ERR-TIMEOUT / ERR-UNSERVICEABLE / ERR-MALFORMED to force that failure mode.",
      {
        order_id: z.string(),
        consignee_name: z.string(),
        consignee_address: z.string(),
        consignee_pincode: z.string(),
        consignee_phone: z.string(),
        payment_mode: z.enum(["Prepaid", "COD"]).default("Prepaid"),
        weight_grams: z.number().default(150),
        products_desc: z.string().default("Insurance policy document"),
      },
      async (args) => {
        const scenario = resolveScenario(args.consignee_pincode) !== "success"
          ? resolveScenario(args.consignee_pincode)
          : resolveScenario(args.order_id);
        await maybeDelay(scenario);
        if (scenario === "malformed") return textResult(errorPayload(scenario, "create_shipment"));
        if (scenario !== "success") return textResult(errorPayload(scenario, "create_shipment"));
        const waybill = `DLV${Math.floor(10000000 + Math.random() * 89999999)}`;
        return textResult({
          waybill,
          status: "Manifested",
          pickup_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          courier_partner: "Delhivery",
          label_url: `https://mock-delhivery.example/labels/${waybill}.pdf`,
        });
      }
    );

    server.tool(
      "track_shipment",
      "Delhivery: track a shipment by waybill (mirrors /api/v1/packages/json/?waybill=). Send a waybill containing ERR-TIMEOUT / ERR-MALFORMED to force that failure mode.",
      { waybill: z.string() },
      async (args) => {
        const scenario = resolveScenario(args.waybill);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "track_shipment"));
        return textResult({
          waybill: args.waybill,
          status: "In Transit",
          scans: [
            { location: "Mumbai Hub", status: "Manifested", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
            { location: "Mumbai Hub", status: "In Transit", timestamp: new Date(Date.now() - 86400000).toISOString() },
          ],
        });
      }
    );

    server.tool(
      "request_pickup",
      "Delhivery: schedule a pickup (mirrors /fm/request/new/). Used for home sample-collection / document pickup. Send pickup_location containing ERR-NOSLOT to simulate 'no slot available' (the logistics equivalent of 'no rider available'), ERR-TIMEOUT for a hung request.",
      {
        pickup_location: z.string(),
        pickup_date: z.string(),
        pickup_time: z.string(),
        expected_package_count: z.number().default(1),
      },
      async (args) => {
        const scenario = resolveScenario(args.pickup_location);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "request_pickup"));
        return textResult({
          pickup_id: `PKP${Math.floor(100000 + Math.random() * 899999)}`,
          status: "Scheduled",
          pickup_date: args.pickup_date,
          pickup_time: args.pickup_time,
        });
      }
    );

    server.tool(
      "cancel_shipment",
      "Delhivery: cancel/edit a shipment (mirrors /api/p/edit). Send a waybill containing ERR-REJECTED to simulate a cancellation that the hub refuses because it's already out for delivery.",
      { waybill: z.string(), reason: z.string() },
      async (args) => {
        const scenario = resolveScenario(args.waybill);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "cancel_shipment"));
        return textResult({ waybill: args.waybill, status: "Cancelled" });
      }
    );

    // ---------------------------------------------------------------------
    // Custom capabilities (up to 3) — things Gnani / Pine Labs / Delhivery
    // don't offer today. These model the insurer's own backend systems.
    // ---------------------------------------------------------------------

    server.tool(
      "get_renewal_quote",
      "Custom capability 1/3. Partner: the health insurer's policy administration system (PAS). Returns the current and renewal premium, room-rent limit, co-pay and waiting-period notes for a policy. The insurer's PAS already stores this per-policy; this just exposes a read. Send a policy_number containing ERR-TIMEOUT / ERR-MALFORMED to force that failure mode.",
      { policy_number: z.string() },
      async (args) => {
        const scenario = resolveScenario(args.policy_number);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "get_renewal_quote"));
        return textResult({
          policy_number: args.policy_number,
          insurer: "Apex Health Insurance",
          current_premium: 18500,
          renewal_premium: 24200,
          room_rent_limit_pct: 1.0,
          co_pay_percent: 20,
          waiting_period_notes: "Pre-existing disease waiting period: 2 years remaining",
          no_claim_bonus_percent: 10,
        });
      }
    );

    server.tool(
      "negotiate_premium",
      "Custom capability 2/3. Partner: the insurer's retention/underwriting desk system. Submits a counter-offer (target premium + requested benefit changes, e.g. removing a room-rent cap) and returns the insurer's response. The retention desk already runs this discount workflow manually today; this exposes it as an API. Send a policy_number containing ERR-LOWBALANCE to simulate the insurer's retention-discount budget being exhausted, ERR-REJECTED for a flat rejection, ERR-TIMEOUT / ERR-MALFORMED for those failure modes.",
      {
        policy_number: z.string(),
        target_premium: z.number(),
        requested_benefit_changes: z.array(z.string()).default([]),
      },
      async (args) => {
        const scenario = resolveScenario(args.policy_number);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "negotiate_premium"));
        return textResult({
          policy_number: args.policy_number,
          negotiation_status: "countered",
          counter_offer: {
            premium: Math.round(args.target_premium * 1.04),
            benefits_granted: args.requested_benefit_changes.slice(0, 1),
            benefits_denied: args.requested_benefit_changes.slice(1),
          },
        });
      }
    );

    server.tool(
      "get_hospital_network",
      "Custom capability 3/3. Partner: the insurer's TPA (third-party administrator) provider-network system. Returns cashless-network hospitals for a city under a given policy. The TPA already maintains this empanelled-hospital directory to answer cashless-eligibility queries; this exposes it as an API. Send a policy_number containing ERR-TIMEOUT / ERR-MALFORMED to force that failure mode.",
      { city: z.string(), policy_number: z.string() },
      async (args) => {
        const scenario = resolveScenario(args.policy_number);
        await maybeDelay(scenario);
        if (scenario !== "success") return textResult(errorPayload(scenario, "get_hospital_network"));
        return textResult({
          city: args.city,
          network_hospitals: [
            { name: "Apex City Hospital", room_category_eligible: "Single Private", cashless: true },
            { name: "Sunrise Multispecialty", room_category_eligible: "Twin Sharing", cashless: true },
          ],
        });
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };
