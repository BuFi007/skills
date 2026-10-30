---
name: personal-arca-tax
description: >-
  Check status, start, resume, or cancel a personal ARCA tax connection
  (`personal:<userId>`) and prepare Factura C fiscal workflows in Personal scope
  (`scope=personal`) via MCP or the `bufi` CLI.
---

# Personal ARCA Tax & Factura C (`personal-arca-tax`)

- **Collection**: `personal_finance`
- **Scope**: `{ "kind": "personal" }` (`?scope=personal`)
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), In-Page WebMCP

## Shiva `/agent-tools` Operations (`arca_connection.*`)

- `arca_connection.status` — Read the current ARCA connection status for `personal:<userId>`.
- `arca_connection.start` — Start a new ARCA onboarding/connection session.
- `arca_connection.resume` — Resume an in-progress ARCA connection flow.
- `arca_connection.cancel` — Cancel a pending ARCA connection attempt.

## CLI Examples

```bash
bufi call arca_connection.status --scope personal --input '{}'
bufi call arca_connection.start --scope personal --input '{"cuit":"20123456789"}'
```

## Fiscal Boundary

- Starting, resuming, or cancelling the connection completes via the tool, while final credential authorization and fiscal invoice emission remain human-confirmed in BUFI Desk.
- If a counterparty requests a fiscal amendment (`request_fiscal_amendment`), read the signal via [`settlement-channel-signals`](../../agent_commerce_x402/settlement-channel-signals/SKILL.md).
