---
name: invoices-and-receivables
description: >-
  Create, update, preview, and send team invoices (`invoice.*`, `create_invoice`,
  `send_invoice`), prioritize receivables (`chase-receivables`), and stage bill
  payments (`get_bills`, `post_bills_pay`) in Team scope (`scope=team`).
---

# Team Invoices, Bills & Receivables (`invoices-and-receivables`)

- **Collection**: `team_treasury`
- **Scope**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), In-Page WebMCP

## 1. Team Invoices (`invoice.*`, `get_invoices`, `get_invoice_detail`)

1. **Read before mutating**:
   - Use `get_invoices` and `get_invoice_detail` (or `invoice.*` read operations) to inspect line items, customer details, and `draft_version`.
2. **Version-fenced sending (`expectedDraftVersion`)**:
   - Before calling `send_invoice`, always read `get_invoice_detail` and pass its `draft_version` as `expectedDraftVersion`. If the draft changed since it was reviewed, the server refuses with `409` so unreviewed edits are never emailed.
3. **Co-authoring with teammates**:
   - In the Team LiveKit room (`team:<teamId>`), use `collaboration_propose_document` (`documentType: "invoice"`) to share invoice candidates with teammates before finalizing.

## 2. Chasing Receivables (No Invented Rankings)

- `read_payment_score` (WebMCP) is **one aggregate workspace score** (counting the workspace as both payer and biller), **never** a per-customer score.
- Never attribute a workspace payment score to an individual customer or invent aging totals not present in the tool payload.

## 3. Accounts Payable (`get_bills`, `post_bills_pay`)

- Read open vendor bills with `get_bills` (`status`, `vendorName`).
- `post_bills_pay` is a `financial`-tier operation: all amounts must be exact decimal **strings** (never floats), and any proposal lands in the **BuIsland miniplayer** and **Pending Decisions Inbox** for human passkey confirmation.
