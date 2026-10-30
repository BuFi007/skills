---
name: personal-documents-and-inbox
description: >-
  Triage personal inbox items, scan receipts, and stage personal reimbursement
  or invoice drafts in Personal scope (`scope=personal`) via the thin TypeScript
  CLI (`bufi`) or Official MCP.
---

# Personal Documents & Inbox (`personal-documents-and-inbox`)

- **Collection**: `personal_finance`
- **Scope**: `{ "kind": "personal" }` (`?scope=personal`)
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), In-Page WebMCP

## Allowed Personal Tools in Shiva `/agent-tools`

In `scope=personal`, Shiva exposes only personal-safe document and inbox tools:
- `list_inbox_items` / `read_inbox_item`
- `document.*` (`documentAgentOperationsForScope('personal')`, such as `document.ingest_dump`, `document.list`, `document.get`)

## CLI & MCP Workflow

1. **Inspect Personal Inbox**:
   - **CLI**: `bufi call list_inbox_items --scope personal --input '{}'`
   - **CLI**: `bufi call read_inbox_item --scope personal --input '{"itemId":"<uuid>"}'`
   - **MCP**: Call `list_inbox_items` and `read_inbox_item` with `scope: { kind: "personal" }`.
2. **Ingest & Extract Receipts**:
   - Run `document.ingest_dump` in `personal` scope to extract dated FX evidence, line items, and totals without creating placeholder expenses on failure.
3. **Prepare Only**:
   - Staging a personal reimbursement or personal invoice never sends an email or moves money until the human confirms in the Desk UI / miniplayer.
