---
name: reimbursements-and-payables
description: >-
  Draft, itemize, attach receipt proofs, preview blockers, and prepare payment
  runs for team reimbursements (`reimbursement.*`) in Team scope (`scope=team`)
  via the thin TypeScript CLI (`bufi`), Official MCP, or Team LiveKit room.
---

# Team Reimbursements & Payables (`reimbursements-and-payables`)

- **Collection**: `team_treasury`
- **Scope**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), Team LiveKit Room (`team:<teamId>`), WebMCP

## 1. End-to-End Reimbursement Drafting (`reimbursement.*`)

All `reimbursement.*` tools are available in `scope=team` over both MCP and the `bufi` CLI:

1. **Discover assets & destinations**:
   - `reimbursement.list_settlement_assets` — Supported StableFX settlement assets and peg currencies.
   - `reimbursement.list_destinations` — Receiving wallets holding the draft asset, recommending the payer-preferred chain.
2. **Create or populate a draft**:
   - `reimbursement.create_draft` — Create a clean reimbursement draft (default `USDC`).
   - `reimbursement.draft_from_dump` — Create drafts from `document.ingest_dump` candidates with dated reference FX and idempotent replay (`idempotencyKey`).
   - `reimbursement.scan_receipt` / `reimbursement.add_line_items` / `reimbursement.update_lines` (version-fenced with `expectedVersion`) / `reimbursement.attach_proofs`.
3. **Bind payer & receiving wallet**:
   - `reimbursement.set_payer` / `reimbursement.set_counterparty` — Bind a workspace, customer, or email (never a raw address).
   - `reimbursement.set_destination` — Persist the receiving wallet so sending never defaults silently.
4. **Preview blockers before human send/review**:
   - `reimbursement.preview` — Inspect blockers (`no_destination`, `destination_chain_differs_from_payer_preference`, `payer_unresolved`, `fx_missing`).
   - `reimbursement.save_draft` — Persist and return the stable share URL without sending.

## 2. Human Review, Live Event Stream & Payment Runs

- **Live Pending Reviews Resource (MCP)**:
  - Subscribe to `bufi://reviews/pending` on MCP (`scope=team`) to receive real-time notifications when payable reimbursements enter `pending` review.
- **Human-in-the-Loop Gates**:
  - `reimbursement.prepare_send` and `reimbursement.prepare_review` return `requires_human` and surface an approval card in the **BuIsland miniplayer** / **Decisions Inbox** for a human with two-factor authentication.
  - `reimbursement.preview_payment_run` (owner/admin) checks which approved reimbursements can join a treasury payment run on a target chain before any funds are held or signed.

## 3. CLI Examples

```bash
bufi call reimbursement.list --scope team --team-id <team-uuid> --input '{"role":"payable","approvalStatus":"pending","limit":25}'
bufi call reimbursement.preview_payment_run --scope team --team-id <team-uuid> --input '{"chain":"ARC-TESTNET"}'
```
