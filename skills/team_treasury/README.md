# Collection 3: `team_treasury`

Candidate skills for **`scope=team`** (`{ kind: "team", teamId: "<uuid>" }`): preparing team treasury transfers, allowlist checks, swaps, agent-wallet allocations, reimbursements, invoices, bills, payroll, and runway analytics. Every money-moving proposal lands in the **BuIsland miniplayer** and **Pending Decisions Inbox**.

## Skills in this Collection

| Skill | Scope | Transports | Status | Purpose |
| --- | --- | --- | --- | --- |
| [`treasury-proposals`](./treasury-proposals/SKILL.md) | `team` | `webmcp`, `mcp`, `cli` | **Candidate** | Prepare treasury transfers (`walletSource='treasury'`, `propose_agent_wallet_transfer`), AddressBook checks, and Decisions Inbox + Treasury Sign ceremony |
| [`treasury-swaps-and-allocations`](./treasury-swaps-and-allocations/SKILL.md) | `team` | `webmcp`, `mcp`, `cli` | **Candidate** | Quote treasury token swaps (`getSwapQuote`, `prepareSwap`), batch payouts (`prepareBatch`), and Agent Wallet funding (`prepareTreasuryAllocation`) |
| [`reimbursements-and-payables`](./reimbursements-and-payables/SKILL.md) | `team` | `mcp`, `cli`, `webmcp`, `livekit` | **Candidate** | Full `reimbursement.*` lifecycle (`create_draft`, `draft_from_dump`, `scan_receipt`, `preview`, `prepare_review`, `preview_payment_run`) & `bufi://reviews/pending` |
| [`invoices-and-receivables`](./invoices-and-receivables/SKILL.md) | `team` | `mcp`, `cli`, `webmcp` | **Candidate** | Team invoicing (`invoice.*`, `create_invoice`, `send_invoice` with `expectedDraftVersion`), `chase-receivables`, and `post_bills_pay` |
| [`payroll-and-runway`](./payroll-and-runway/SKILL.md) | `team` | `mcp`, `cli`, `webmcp` | **Candidate** | Payroll preparation (`get_payroll`, `payroll.*`), operating burn (`get_burn_rate`), runway (`get_runway`), and category spend (`get_spending`) |
