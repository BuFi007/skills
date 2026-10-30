---
name: payroll-and-runway
description: >-
  Inspect scheduled, draft, and executed payroll runs (`get_payroll`, `payroll.*`),
  contractors (`get_contractors`), monthly operating burn (`get_burn_rate`),
  runway (`get_runway`), and category spend (`get_spending`) in Team scope (`scope=team`).
---

# Team Payroll, Burn Rate & Runway (`payroll-and-runway`)

- **Collection**: `team_treasury`
- **Scope**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), In-Page WebMCP

## 1. Operating Analytics (`get_burn_rate`, `get_runway`, `get_spending`)

- **Native currency / asset discipline**:
  - Pass `period` (`"1m" | "3m" | "12m"`, default `"3m"`) and `currency` (e.g. `"USD"`, `"USDC"`, `"EURC"`).
  - Never imply FX conversion across currencies unless the tool payload explicitly reports it.
- **Absence is an answer**:
  - Each tool returns exact calculation basis, window, and availability. If cash or burn evidence is unavailable, report it as unavailable — **never** report unavailable comparisons as `$0` or `0 months`.

## 2. Payroll & Contractors (`get_payroll`, `get_contractors`, `payroll.*`)

- Inspect contractors with `get_contractors` (`status: "active" | "inactive"`) and payroll runs with `get_payroll` (`status: "scheduled" | "executed" | "draft"`).
- Any payroll run creation or modification stages a draft (`payroll.*`). Executing a payroll payout requires the human owner/admin's Treasury Sign ceremony in the **BuIsland miniplayer** / **Decisions Inbox**.

## 3. CLI Examples

```bash
bufi call get_runway --scope team --team-id <team-uuid> --input '{"period":"3m","currency":"USDC"}'
bufi call get_spending --scope team --team-id <team-uuid> --input '{"period":"3m","currency":"USDC","groupBy":"category"}'
bufi call get_payroll --scope team --team-id <team-uuid> --input '{"status":"draft"}'
```
