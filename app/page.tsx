const TOOLS = [
  { name: "create_shipment", kind: "Delhivery mock", desc: "Courier the renewed policy document to the family's address." },
  { name: "track_shipment", kind: "Delhivery mock", desc: "Track that shipment by waybill." },
  { name: "request_pickup", kind: "Delhivery mock", desc: "Schedule a pickup (e.g. home sample collection)." },
  { name: "cancel_shipment", kind: "Delhivery mock", desc: "Cancel/edit a shipment." },
  { name: "get_renewal_quote", kind: "Custom capability 1/3", desc: "Insurer PAS: current + renewal premium, room-rent limit, co-pay." },
  { name: "negotiate_premium", kind: "Custom capability 2/3", desc: "Insurer retention desk: submit a counter-offer, get a response." },
  { name: "get_hospital_network", kind: "Custom capability 3/3", desc: "Insurer TPA: cashless network hospitals for a city." },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", color: "#0a2540" }}>
      <h1 style={{ fontSize: 24 }}>Ken — mock connector server</h1>
      <p style={{ color: "#555" }}>
        MCP endpoint: <code>/api/mcp</code> — register this as a Custom / MCP connector on the Pine Labs AgenticOrg platform.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #0a2540" }}>
            <th style={{ padding: 8 }}>Tool</th>
            <th style={{ padding: 8 }}>Type</th>
            <th style={{ padding: 8 }}>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {TOOLS.map((t) => (
            <tr key={t.name} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8, fontFamily: "monospace" }}>{t.name}</td>
              <td style={{ padding: 8 }}>{t.kind}</td>
              <td style={{ padding: 8 }}>{t.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 24, fontSize: 14, color: "#777" }}>
        Trigger failure modes by including ERR-TIMEOUT / ERR-NOSLOT / ERR-LOWBALANCE / ERR-MALFORMED /
        ERR-UNSERVICEABLE / ERR-REJECTED in the relevant waybill or policy_number argument. See README.md.
      </p>
    </main>
  );
}
