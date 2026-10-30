---
name: bufi-router
description: >-
  CRITICAL: Master router for BUFI agent tasks across Personal and Team workspaces.
  Use first when deciding between Personal vs Team scope, or choosing the right
  transport: Team LiveKit Room, W2W Walkie-Talkie Channel, Official MCP, Thin
  TypeScript CLI (bufi), In-Page WebMCP, or A2A. Enforces that money proposals
  always land in the BuIsland miniplayer and Decisions Inbox.
---

# BUFI Master Skill Router (`bufi-router`)

Before executing any BUFI tool or CLI command, trace through the **Scope Layer**, **Transport Layer**, and **Money & Approval Boundary**.

```
User / Agent Task
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ Layer 1: Scope Boundary (Personal vs. Team vs. W2W)      │
│ • Personal (`scope=personal`): user's UCW, personal docs │
│ • Team (`scope=team&teamId=<uuid>`): treasury, payables  │
│ • W2W (`{ kind: "w2w", teamId, peerTeamId }`): external  │
└──────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ Layer 2: Transport Selection                             │
│ • Team Room (`team-collaboration`): teammates + Duet     │
│ • W2W Channel (`walkie-talkie`): external peer workspace │
│ • MCP (`bufi-desk`): interactive tool calls & streams    │
│ • Thin TS CLI (`bufi`): scripted/terminal catalog calls  │
│ • WebMCP (`navigator.modelContext`): open browser UI     │
└──────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ Layer 3: Money & Approval Boundary                       │
│ • Money NEVER moves unilaterally from an agent call.     │
│ • Every proposal lands in the BuIsland Miniplayer and    │
│   the Pending Decisions Inbox (`pending_decisions`).     │
└──────────────────────────────────────────────────────────┘
```

## 1. When to Use Which Transport

| Transport | Best For | Auth / Connection | Skill to Load |
| --- | --- | --- | --- |
| **Team Room (`LiveKit`)** | Talking with teammates inside one workspace, proposing Document AI candidates (`collaboration_propose_document`), and co-editing draft notes (`collaboration_document_duet_*`). | `collaboration_connect` with `{ kind: "team", teamId }` (`team:<teamId>`) | [`team-collaboration`](../team-collaboration/SKILL.md) |
| **W2W Channel (`LiveKit` / `A2A`)** | Talking across two different workspaces that accepted a short-code invite with **BUFI Connect for AI collaboration** checked. | `collaboration_connect` with `{ kind: "w2w", teamId, peerTeamId }` (`w2w:<teamA>:<teamB>`) | [`walkie-talkie`](../walkie-talkie/SKILL.md), [`a2a-handoff`](../a2a-handoff/SKILL.md), [`w2w-invite`](../w2w-invite/SKILL.md) |
| **Official MCP** | Interactive agent sessions calling Shiva `/agent-tools` or subscribing to live review streams (`bufi://reviews/pending`). | OAuth 2.1 Bearer JWT (`role = "bufi_mcp_agent"`) scoped to `personal` or `team` | [`bufi-desk`](../bufi-desk/SKILL.md) |
| **Thin TypeScript CLI (`bufi`)** | Terminal/scripted workflows, batch receipt ingestion, catalog inspection (`bufi catalog`), and repeatable tool execution (`bufi call`) from coding agents. | Same OAuth 2.1 Bearer JWT (`bufi_mcp_agent`) and Shiva `/agent-tools` catalog as MCP | [`bufi-desk`](../bufi-desk/SKILL.md) |
| **In-Page WebMCP** | Driving the open browser screen (`navigator.modelContext`), filling forms, and reading live cursors (`read_team_cursors`, `read_w2w_cursors`). | Active signed-in browser session | [`webmcp-cursors`](../webmcp-cursors/SKILL.md) |

## 2. Personal vs. Team Routing Matrix

| Task Intent | Scope | Collection / Candidate Skill | Where Money / Action Lands |
| --- | --- | --- | --- |
| Send or swap from personal wallet | `personal` | [`personal-wallet-transfers`](../../personal_finance/personal-wallet-transfers/SKILL.md) | BuIsland miniplayer → `sign_on_your_device` (passkey/device wallet prompt) |
| Scan personal receipts or read personal inbox | `personal` | [`personal-documents-and-inbox`](../../personal_finance/personal-documents-and-inbox/SKILL.md) | Draft reimbursement / personal invoice (no money moved) |
| Connect personal ARCA tax / Factura C | `personal` | [`personal-arca-tax`](../../personal_finance/personal-arca-tax/SKILL.md) | Personal tax credential state |
| Prepare personal expenses to submit to a Team | `personal` → `team` | [`personal-to-team-bridge`](../../personal_finance/personal-to-team-bridge/SKILL.md) | Personal draft + `settlement_channel.send_signal`, then Team room review |
| Propose team treasury transfer or wallet-face send | `team` | [`treasury-proposals`](../../team_treasury/treasury-proposals/SKILL.md) | BuIsland miniplayer + Pending Decisions Inbox (`confirm_action` passkey + Treasury Sign ceremony) |
| Quote treasury swap, batch payout, or fund Agent Wallet | `team` | [`treasury-swaps-and-allocations`](../../team_treasury/treasury-swaps-and-allocations/SKILL.md) | BuIsland miniplayer + Treasury Sign / Allocation ceremony |
| Draft, review, or batch-pay team reimbursements | `team` | [`reimbursements-and-payables`](../../team_treasury/reimbursements-and-payables/SKILL.md) | Two-factor human approval card / payment run preview |
| Create/send team invoices or pay bills | `team` | [`invoices-and-receivables`](../../team_treasury/invoices-and-receivables/SKILL.md) | Draft version check (`expectedDraftVersion`) + Decisions Inbox |
| Prepare payroll or inspect burn rate & runway | `team` | [`payroll-and-runway`](../../team_treasury/payroll-and-runway/SKILL.md) | Read-only analytics or staged payroll draft |
| Discover & pay x402 API/MCP services from Agent Grant | `team` | [`agent-wallet-x402`](../../agent_commerce_x402/agent-wallet-x402/SKILL.md) | Spends bounded Agent Grant (never treasury) after HITL approval in miniplayer / Decisions Inbox |
| Request/propose marketplace quotes or project updates | `team` | [`marketplace-deals-and-quotes`](../../agent_commerce_x402/marketplace-deals-and-quotes/SKILL.md) | CRM deal / shared project portal proposal awaiting human approval |
| Propose or verify ERC-8183 W2W escrow jobs on Arc | `team` | [`w2w-erc8183-escrow-jobs`](../../agent_commerce_x402/w2w-erc8183-escrow-jobs/SKILL.md) | Arc Testnet ERC-8183 escrow proposal in Decisions Inbox |
| Exchange pre-settlement signals with counterparty agent | `personal` or `team` | [`settlement-channel-signals`](../../agent_commerce_x402/settlement-channel-signals/SKILL.md) | Append-only ERC-8004 signal thread (zero fund movement) |

## 3. Non-Negotiable Rules

1. **Never infer a scope**: Every MCP call and every `bufi` CLI command requires an explicit `personal` or `team` (`teamId`) scope.
2. **Never cross-contaminate**: Do not use `walkie-talkie` for teammates in the same workspace (use `team-collaboration`), and never copy private Personal data into a Team or W2W room without explicit user direction.
3. **Money always lands in the miniplayer and Decisions Inbox**: Neither MCP nor the `bufi` CLI can unilaterally sign or broadcast a transfer. Always tell the user that the proposal is staged and waiting in their **BuIsland miniplayer** or **Pending Decisions Inbox**.
