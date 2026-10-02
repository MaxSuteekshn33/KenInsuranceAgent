"use client";

import { useState } from "react";
import Link from "next/link";

type Step =
  | { kind: "system"; text: string }
  | { kind: "user"; text: string }
  | {
      kind: "ken";
      text: string;
      toolCall?: { name: string; via: string; result?: string };
      draft?: { to: string; subject: string; body: string };
      actions?: boolean;
    };

const SCRIPT: Step[] = [
  { kind: "system", text: "20 Oct 2026 — Priya opens Ken to review her father Ramesh's health policy. Renewal due in 9 days." },
  {
    kind: "ken",
    text:
      "I reviewed Ramesh's policy (POL-8842-HDFCERGO), renewing 29 Oct 2026. One flag: the room-rent cap is 1% of sum insured — ₹5,000/day on a ₹5L cover. A real hospital stay at most city hospitals would cost well above that, leaving the rest out of pocket.\n\nSource: policy schedule p.3, clause 4.2, confirmed via the insurer's renewal quote.",
    toolCall: { name: "get_renewal_quote", via: "Insurer PAS connector", result: "room_rent_cap: 1% of SI · current_premium: ₹13,000/yr" },
  },
  { kind: "user", text: "Can we fix this without changing insurers?" },
  {
    kind: "ken",
    text:
      "Yes — I can ask the insurer to remove the room-rent cap for a ₹1,200/yr premium increase. Here's the exact email I'd send. Nothing goes out until you approve it.",
    draft: {
      to: "retention-desk@hdfcergo-demo.in",
      subject: "Room-rent cap removal request — POL-8842-HDFCERGO",
      body:
        "Requesting removal of the 1% room-rent sub-limit on the above policy ahead of its 29 Oct renewal, in exchange for an increased annual premium. Policyholder is aware this may raise the premium and has approved submitting this request.",
    },
    actions: true,
  },
  {
    kind: "ken",
    text: "Sent via Gmail. I'll let you know the moment the insurer replies.",
    toolCall: { name: "send_email", via: "Gmail connector", result: "Thread started · awaiting reply" },
  },
  { kind: "system", text: "22 Oct 2026 — two days later" },
  {
    kind: "ken",
    text:
      "The insurer agreed: room-rent cap removed, premium increases by ₹1,200/yr (new total ₹14,200). Want me to collect the payment and arrange the updated physical document?",
    toolCall: { name: "negotiate_premium", via: "Insurer retention desk connector", result: "ACCEPTED · new_premium: ₹14,200/yr" },
    actions: true,
  },
  {
    kind: "ken",
    text: "Payment link sent — ₹14,200, due before the 29 Oct renewal.",
    toolCall: { name: "create_payment_link", via: "Pine Labs connector", result: "order_id: PL-88421 · status: pending" },
  },
  { kind: "system", text: "Priya completes the payment" },
  {
    kind: "ken",
    text: "Payment confirmed. I've booked a courier for the updated policy document — it should arrive within 3–5 days. No further action needed unless something changes before the 29th.",
    toolCall: { name: "create_shipment", via: "Delhivery connector (mock)", result: "waybill: DHL-KEN-00231 · eta: 3–5 days" },
  },
];

function ToolCallBadge({ name, via, result }: { name: string; via: string; result?: string }) {
  return (
    <div
      style={{
        marginTop: 10,
        fontSize: 12.5,
        background: "#f3f8f7",
        border: "1px solid #d8e8e4",
        borderRadius: 8,
        padding: "8px 12px",
        color: "#0a5c52",
      }}
    >
      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{name}</span>
      <span style={{ color: "#5c7d78" }}> → {via}</span>
      {result && <div style={{ marginTop: 4, color: "#375753" }}>{result}</div>}
    </div>
  );
}

function DraftCard({ to, subject, body }: { to: string; subject: string; body: string }) {
  return (
    <div
      style={{
        marginTop: 10,
        background: "#fff",
        border: "1px solid #e3e3e3",
        borderRadius: 10,
        padding: 14,
        fontSize: 13.5,
      }}
    >
      <div style={{ color: "#888" }}>
        To: <span style={{ color: "#222" }}>{to}</span>
      </div>
      <div style={{ color: "#888", marginTop: 2 }}>
        Subject: <span style={{ color: "#222" }}>{subject}</span>
      </div>
      <div style={{ marginTop: 10, color: "#333", lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

export default function Home() {
  const [visible, setVisible] = useState(1);
  const [decided, setDecided] = useState<Record<number, "approved" | "skipped">>({});

  const advance = (i: number, decision?: "approved" | "skipped") => {
    if (decision) setDecided((d) => ({ ...d, [i]: decision }));
    setVisible((v) => Math.min(v + 1, SCRIPT.length));
  };

  const reset = () => {
    setVisible(1);
    setDecided({});
  };

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 80px", fontFamily: "system-ui, sans-serif", color: "#0a2540" }}>
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Ken</h1>
          <Link href="/connectors" style={{ fontSize: 13, color: "#0a7a6d" }}>
            View connectors →
          </Link>
        </div>
        <p style={{ color: "#667", fontSize: 13.5, marginTop: 6 }}>
          Scripted front-end preview of the agent&apos;s renewal-negotiation flow — &quot;The Ken x Pine Labs&quot; Round 3. No live
          connectors are called here; Gmail, Pine Labs, insurer and Delhivery calls shown below are illustrative,
          matching what will be wired natively on the Pine Labs platform.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {SCRIPT.slice(0, visible).map((step, i) => {
          if (step.kind === "system") {
            return (
              <div key={i} style={{ textAlign: "center", fontSize: 12, color: "#999", margin: "4px 0" }}>
                {step.text}
              </div>
            );
          }
          if (step.kind === "user") {
            return (
              <div key={i} style={{ alignSelf: "flex-end", maxWidth: "80%", marginLeft: "20%" }}>
                <div style={{ background: "#0a2540", color: "#fff", borderRadius: "14px 14px 2px 14px", padding: "10px 14px", fontSize: 14 }}>
                  {step.text}
                </div>
              </div>
            );
          }
          const waitingOnDecision = step.actions && decided[i] === undefined;
          return (
            <div key={i} style={{ maxWidth: "88%" }}>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 4, fontWeight: 600, letterSpacing: 0.3 }}>KEN</div>
              <div
                style={{
                  background: "#f6f7f9",
                  borderRadius: "2px 14px 14px 14px",
                  padding: "12px 14px",
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                }}
              >
                {step.text}
                {step.draft && <DraftCard {...step.draft} />}
                {step.toolCall && <ToolCallBadge {...step.toolCall} />}
              </div>
              {step.actions && (
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  {waitingOnDecision ? (
                    <>
                      <button onClick={() => advance(i, "approved")} style={btnPrimary}>
                        Approve
                      </button>
                      <button style={btnSecondary} disabled>
                        Edit
                      </button>
                      <button onClick={() => advance(i, "skipped")} style={btnSecondary}>
                        Skip
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: decided[i] === "approved" ? "#0a7a6d" : "#a33", fontWeight: 600 }}>
                      {decided[i] === "approved" ? "✓ Approved" : "✕ Skipped"}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(() => {
        const lastStep = SCRIPT[visible - 1];
        const blockedOnDecision = lastStep?.kind === "ken" && lastStep.actions && decided[visible - 1] === undefined;
        if (visible < SCRIPT.length && !blockedOnDecision) {
          return (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button onClick={() => advance(visible)} style={btnPrimary}>
                Continue
              </button>
            </div>
          );
        }
        return null;
      })()}

      {visible >= SCRIPT.length && (
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#0a7a6d", fontWeight: 600, marginBottom: 10 }}>End of scripted preview</div>
          <button onClick={reset} style={btnSecondary}>
            Replay
          </button>
        </div>
      )}
    </main>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "#0a2540",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13.5,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "#fff",
  color: "#0a2540",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13.5,
  cursor: "pointer",
};
