---
name: personal-to-team-bridge
description: >-
  Collaborate between a user's Personal scope (`scope=personal`) and a Team
  workspace (`scope=team`) without leaking private context. Use when a user
  prepares personal receipts, reimbursements, or contractor invoices in Personal
  scope and coordinates with the Team AI and teammates.
---

# Personal-to-Team AI Collaboration Bridge (`personal-to-team-bridge`)

- **Collection**: `personal_finance`
- **Scope Transition**: `{ "kind": "personal" }` → explicit `{ "kind": "team", "teamId": "<uuid>" }`
- **Transports**: Thin TypeScript CLI (`bufi`), Official MCP, Settlement Channel (`settlement_channel.*`), Team LiveKit Room (`team:<teamId>`)

## How Personal Collaborates with AI for a Team

A person often captures receipts, travel expenses, or personal contractor invoices in their **Personal** context first, and then submits or coordinates them with a **Team** workspace.

```
[Personal Scope: scope=personal]
  1. Scan receipts / inbox (`document.ingest_dump`, `list_inbox_items`)
  2. Resolve counterparty (`settlement_channel.resolve_counterparty`)
  3. Send pre-settlement signal (`settlement_channel.send_signal`: evidence_ready / propose_settlement_rail)
          │
          ▼  (Explicit scope switch — never inferred)
[Team Scope: scope=team&teamId=<uuid>]
  4. Join Team LiveKit room (`collaboration_connect` → `team:<teamId>`)
  5. Propose Document AI candidate (`collaboration_propose_document`) or co-edit note (`collaboration_document_duet_update`)
  6. Owner/Admin reviews in Pending Decisions Inbox / BuIsland miniplayer
```

## Step-by-Step Protocol

1. **Stage in `personal` scope first**:
   - Use `bufi` CLI or MCP with `--scope personal` to read personal inbox items (`list_inbox_items`) and extract receipt proofs (`document.ingest_dump`).
   - Never copy raw personal inbox items into a Team room unless the user explicitly selects them for submission.
2. **Coordinate via the Settlement Channel (`settlement_channel.*`)**:
   - Both `personal` and `team` scopes can call:
     - `settlement_channel.resolve_counterparty`
     - `settlement_channel.list_open_signals`
     - `settlement_channel.get_thread`
     - `settlement_channel.send_signal` (`evidence_ready`, `propose_settlement_rail`, `request_fiscal_amendment`, `terms_revised`)
   - When the team's AI flags a missing receipt (`request_evidence` with `line_without_proof` or `amount_differs_from_receipt`), the Personal agent attaches the proof and sends `evidence_ready` with `expectedVersion`.
3. **Handoff to the Team Room (`team:<teamId>`)**:
   - When switching to the team workspace, pass `--scope team --team-id <teamId>` explicitly.
   - Follow [`team-collaboration`](../../agentic_collaboration/team-collaboration/SKILL.md) to notify teammates (`collaboration_message`) or propose a structured candidate (`collaboration_propose_document`).
   - Final payout approval always lands in the Team's **BuIsland miniplayer** and **Pending Decisions Inbox** for an owner/admin with 2FA.
