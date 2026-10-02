# Ken — mock connector server (Round 3, The Ken x Pine Labs)

MCP server exposing:
- A **Delhivery-shaped mock** (4 tools, endpoint names/fields mirror Delhivery's published logistics API)
- **3 custom capabilities** that Gnani, Pine Labs and Delhivery don't offer today (insurer-side systems)

Single endpoint: `POST /api/mcp` (standard MCP Streamable HTTP transport, stateless).

## Register on the Pine Labs platform

Connectors → Register Connector →
- Connector Name: `delhivery_ken` (pattern: unique across the org)
- Check **MCP**
- Base URL: `https://<your-vercel-url>/api/mcp`
- Category: `Custom` (or `Logistics` if offered)
- Auth Type: `None` (no auth on this mock; add an API key check later if needed)

The platform auto-discovers all 7 tools below from this one registration.

## Tools

### Delhivery mock (real connector doesn't exist on the platform — mocked per brief)

| Tool | Mirrors | Used for |
|---|---|---|
| `create_shipment` | `POST /api/cmu/create.json` | Courier the renewed policy document to the user |
| `track_shipment` | `GET /api/v1/packages/json/?waybill=` | Track that shipment |
| `request_pickup` | `POST /fm/request/new/` | Schedule a pickup (e.g. home sample collection) |
| `cancel_shipment` | `POST /api/p/edit` | Cancel/edit a shipment |

### Custom capabilities (up to 3, per brief)

| # | Tool | Partner | Endpoint | Why the partner can offer this |
|---|---|---|---|---|
| 1 | `get_renewal_quote` | Health insurer's Policy Admin System (PAS) | `POST /insurer/renewal/quote` | The PAS already stores the full policy master + premium tables per policy; this just exposes a read |
| 2 | `negotiate_premium` | Insurer's retention/underwriting desk | `POST /insurer/renewal/negotiate` | Retention desks already run manual discount workflows off claims-ratio + discount-slab data; this exposes that decision as an API |
| 3 | `get_hospital_network` | Insurer's TPA (third-party administrator) | `GET /insurer/network/hospitals` | The TPA already maintains the empanelled-hospital directory to answer cashless-eligibility queries today |

## Forcing failure modes

Real Delhivery/insurer systems don't take a `test_scenario` flag, so instead the mock keys off values
that would plausibly appear in real inputs — include one of these substrings in the relevant
`waybill` / `pickup_location` / `policy_number` argument:

| Substring | Simulates |
|---|---|
| `ERR-NOSLOT` | No pickup/delivery slot available (the logistics equivalent of "no rider available") |
| `ERR-LOWBALANCE` | Insurer's retention-discount budget exhausted this cycle (the "balance too low" case) |
| `ERR-TIMEOUT` | Upstream hangs for 20s then the tool call should time out on the agent side |
| `ERR-MALFORMED` | Returns an intentionally broken response shape |
| `ERR-UNSERVICEABLE` | Destination pincode outside serviceable network |
| `ERR-REJECTED` | Counterparty flatly rejects the request |

Example: calling `negotiate_premium` with `policy_number: "POL-ERR-LOWBALANCE-9001"` returns
`RETENTION_BUDGET_EXHAUSTED` instead of a counter-offer.

## Local dev

```bash
npm install
npm run dev   # http://localhost:3000/api/mcp
```

## Deploy

```bash
vercel --prod
```
