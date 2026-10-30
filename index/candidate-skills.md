# BUFI Skills Catalog & Candidate Matrix (`bufi/skills`)

This index maps every collection and skill in [`BuFi007/skills`](https://github.com/BuFi007/skills) across **Scope** (`personal` | `team` | `w2w` | `dual`), **Transport** (`CLI` | `MCP` | `WebMCP` | `Team LiveKit Room` | `W2W Walkie-Talkie` | `A2A`), and **Settlement Gate**.

---

## Core Architectural Invariants

1. **Shared OAuth 2.1 (`bufi_mcp_agent`) Across MCP and CLI**:
   - The Official BUFI MCP (`https://api.bufi.finance/functions/v1/mcp`) and the thin TypeScript CLI (`bufi`) share the exact same OAuth 2.1 Bearer JWT (`role === 'bufi_mcp_agent'`) and talk to Shiva's `/agent-tools/catalog` and `/agent-tools/execute` endpoints.
2. **Scope Isolation (`personal` vs `team` vs `w2w`)**:
   - **Personal (`scope=personal`)**: Operates strictly on the signed-in human's personal files, inbox, ARCA tax connection, personal wallets, and personal Nitrolite settlement channels.
   - **Team (`scope=team&teamId=<uuid>`)**: Operates on the workspace's treasury wallets (Safe multisig, Squads V4, single-sig), reimbursements, bills, invoices, marketplace listings/deals, agent wallets (x402), and ERC-8183 W2W jobs.
   - **Personal → Team Bridge**: When a user works in Personal scope (`personal-to-team-bridge`) to prepare a reimbursement or vendor bill for their team, they extract/classify in `scope=personal`, switch to `scope=team&teamId=<uuid>` to submit the candidate, and announce it in the **Team LiveKit Room** (`team-collaboration`).
   - **Workspace-to-Workspace (`w2w:<sortedTeamA>:<sortedTeamB>`)**: Used **exclusively** between two different workspaces that have accepted **BUFI Connect for AI Collaboration**. Uses `walkie-talkie` and `a2a-handoff`. Never used for teammates inside the same workspace.
3. **Money Always Lands in the BuIsland Miniplayer & Pending Decisions Inbox**:
   - Neither MCP nor the `bufi` CLI nor WebMCP ever broadcasts a unilateral money transfer. Every prepared transfer, swap, batch payout, reimbursement settlement (`post_bills_pay`), agent wallet x402 payment (`agent_wallet_pay_x402`), or W2W escrow funding (`fund_w2w_job`) surfaces in the **BuIsland Miniplayer** (bottom-right of Desk) and the **Pending Decisions Inbox** (`/decisions`) for human review and signature.

---

## 1. Collection: `agentic_collaboration` (7 Skills)

| Skill | Folder | Scope | Primary Transports | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`bufi-router`** | `skills/agentic_collaboration/bufi-router` | `dual` / `w2w` | All (Router) | Master decision matrix: selects Scope (`personal` vs `team` vs `w2w`) and Transport (`Team Room` vs `W2W Walkie-Talkie` vs `MCP` vs `CLI` vs `WebMCP`). |
| **`bufi-desk`** | `skills/agentic_collaboration/bufi-desk` | `dual` | MCP, CLI (`bufi`), LiveKit | Authenticates with OAuth 2.1 (`bufi_mcp_agent`), resolves `context_whoami`, switches between Personal and Team scope, and joins presence. |
| **`team-collaboration`** | `skills/agentic_collaboration/team-collaboration` | `team` | Team LiveKit Room, MCP, WebMCP | Collaborates with teammates and their agents inside a single workspace (`{ kind: "team", teamId }`), proposes Document AI candidates, and co-edits notes with Document Duet. |
| **`walkie-talkie`** | `skills/agentic_collaboration/walkie-talkie` | `w2w` | W2W LiveKit (`w2w:*`), MCP | Replies on an accepted workspace-to-workspace channel (`collaboration_message`) using the `WALKIE-TALKIE // <PEER>` protocol. |
| **`w2w-invite`** | `skills/agentic_collaboration/w2w-invite` | `team` → `w2w` | Desk UI, WebMCP, MCP | Sends a short-code workspace invite (`POST /api/collaboration/w2w`), verifies email delivery, and gates the channel on **BUFI Connect for AI collaboration**. |
| **`a2a-handoff`** | `skills/agentic_collaboration/a2a-handoff` | `w2w` | A2A (`POST /a2a/:agentId`), W2W LiveKit | Bridges inbound A2A JSON-RPC messages between connected workspaces directly into the `walkie-talkie` workflow. |
| **`webmcp-cursors`** | `skills/agentic_collaboration/webmcp-cursors` | `team` / `w2w` | In-Page WebMCP | Calls `read_w2w_cursors` in the open browser tab to inspect where a peer workspace or teammate is pointing on screen. |

---

## 2. Collection: `personal_finance` (4 Candidate Skills)

| Skill | Folder | Scope | Shiva / MCP / WebMCP Tools | Money & Approval Gate |
| :--- | :--- | :--- | :--- | :--- |
| **`personal-wallet-transfers`** | `skills/personal_finance/personal-wallet-transfers` | `personal` | `initiateTransfer`, `prepareSwap`, `prepareBatch`, `settlement_channel.*` | Opens in **BuIsland Miniplayer** + **Pending Decisions Inbox** (`/decisions`) for personal wallet signature. |
| **`personal-documents-and-inbox`** | `skills/personal_finance/personal-documents-and-inbox` | `personal` | `document.list`, `document.get`, `document.classify`, `document.extract`, `list_inbox_items`, `read_inbox_item` | Read/extract only; prepares structured receipt/invoice payloads for personal archive or team reimbursement. |
| **`personal-arca-tax`** | `skills/personal_finance/personal-arca-tax` | `personal` | `arca_connection.status`, `arca_connection.connect`, `arca_connection.sync` | Syncs fiscal comprobantes and tax status in Personal scope before routing deductible items. |
| **`personal-to-team-bridge`** | `skills/personal_finance/personal-to-team-bridge` | `personal` → `team` | Personal `document.extract` → Team `reimbursement.submit` / `document_ai_candidates_propose` + Team LiveKit Room | Bridges a teammate's personal receipt/invoice into a Team reimbursement or Document AI candidate and notifies the Team Room. |

---

## 3. Collection: `team_treasury` (5 Candidate Skills)

| Skill | Folder | Scope | Shiva / MCP / WebMCP Tools | Money & Approval Gate |
| :--- | :--- | :--- | :--- | :--- |
| **`treasury-proposals`** | `skills/team_treasury/treasury-proposals` | `team` | `get_wallets`, `get_transactions`, `initiateTransfer`, `prepareBatch`, `propose_agent_wallet_transfer` | Queues Safe multisig, Squads V4, or single-sig proposals in **BuIsland Miniplayer** & **Pending Decisions Inbox**; announces in Team Room. |
| **`treasury-swaps-and-allocations`** | `skills/team_treasury/treasury-swaps-and-allocations` | `team` | `prepareSwap` (Li.Fi), `prepareTreasuryAllocation` (Morpho / Aave), `get_wallets` | Stages slippage-bounded swap or vault allocation in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |
| **`reimbursements-and-payables`** | `skills/team_treasury/reimbursements-and-payables` | `team` | `reimbursement.list`, `reimbursement.get`, `reimbursement.submit`, `reimbursement.approve`, `reimbursement.reject`, `get_bills`, `post_bills_pay` | Approval updates status; payout (`post_bills_pay`) lands in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |
| **`invoices-and-receivables`** | `skills/team_treasury/invoices-and-receivables` | `team` | `invoice.list`, `invoice.get`, `invoice.create`, `invoice.send`, `invoice.mark_paid`, `invoice.void` | Drafts and sends customer invoices; optionally notifies the customer workspace over W2W `walkie-talkie`. |
| **`payroll-and-runway`** | `skills/team_treasury/payroll-and-runway` | `team` | `get_burn_rate`, `get_runway`, `get_spending`, `get_transactions`, `prepareBatch` | Computes burn rate & runway; stages batch payroll in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |

---

## 4. Collection: `agent_commerce_x402` (4 Candidate Skills)

| Skill | Folder | Scope | Shiva / MCP / WebMCP Tools | Money & Approval Gate |
| :--- | :--- | :--- | :--- | :--- |
| **`agent-wallet-x402`** | `skills/agent_commerce_x402/agent-wallet-x402` | `team` | `get_agent_wallets`, `get_agent_wallet_balance`, `propose_agent_wallet_transfer`, `agent_wallet_pay_x402` | Enforces per-call and daily policy caps; stages transfers and x402 payments in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |
| **`marketplace-deals-and-quotes`** | `skills/agent_commerce_x402/marketplace-deals-and-quotes` | `team` / `w2w` | `marketplace.listings.search`, `marketplace.quotes.request`, `marketplace.quotes.respond`, `marketplace.deals.accept`, `get_workspace_reputation` | Negotiates quotes (optionally paired with W2W `walkie-talkie`); deal settlement lands in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |
| **`w2w-erc8183-escrow-jobs`** | `skills/agent_commerce_x402/w2w-erc8183-escrow-jobs` | `team` / `w2w` | `create_w2w_job`, `fund_w2w_job`, `submit_w2w_deliverable`, `attest_w2w_job`, `get_w2w_job_receipt` | Coordinates on-chain ERC-8183 escrow jobs across peer workspaces; `fund_w2w_job` lands in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |
| **`settlement-channel-signals`** | `skills/agent_commerce_x402/settlement-channel-signals` | `dual` (`personal` \| `team`) | `settlement_channel.list`, `settlement_channel.get`, `settlement_channel.open`, `settlement_channel.signal`, `settlement_channel.close` | Manages Yellow Network Nitrolite state channels; on-chain open/close/top-up lands in **BuIsland Miniplayer** & **Pending Decisions Inbox**. |
