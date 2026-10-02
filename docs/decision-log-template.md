# Part 1, Q2 — Decision log template

Fill one block per decision Ken makes during the recorded run, in order. Copy this block
for each decision.

```
### Decision N

- **When:** <date and time>
- **What Ken received:** <the input that triggered this decision>
- **Where it came from:** <connector name> — <the real source behind it>
  (e.g. "Gmail — insurer's reply email", "get_renewal_quote — insurer PAS mock",
  "user — WhatsApp/chat message")
- **What it decided:** <one sentence>
- **Why:** <the exact rule from the system prompt it followed, quote it>
- **What it did or said, and to whom:** <the actual message/action, word for word>
- **Through what:** <connector name used to act>
```

## Connector / real-vs-mock table (Part 1, Q3)

| Connector | Real or mock | Used for |
|---|---|---|
| Gnani | Real (pending credentials — see setup-gnani.md) | Speech-to-text / text-to-speech for all voice turns |
| Gmail | Real (OAuth — see setup-gmail-oauth.md) | Negotiation emails with the insurer; confirmation to the user |
| Pine Labs (Plural) | Real — already active on the platform as `pinelabs_plural` | `create_payment_link` to collect the approved renewal premium |
| Delhivery (mock) | Mock — our MCP server, `ken-insurance-agent` | `create_shipment` / `track_shipment` / `request_pickup` / `cancel_shipment` for the physical policy document |
| Insurer PAS / retention desk / TPA | Custom capability (mock) — our MCP server | `get_renewal_quote`, `negotiate_premium`, `get_hospital_network` |

## Up to 3 custom capabilities (Part 1, Q4)

See `README.md` in the project root — table already has partner, endpoint, and why the
partner already holds that data for all three: `get_renewal_quote`, `negotiate_premium`,
`get_hospital_network`.
