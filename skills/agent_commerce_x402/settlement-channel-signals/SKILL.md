---
name: settlement-channel-signals
description: >-
  Resolve counterparty ERC-8004 identities and exchange typed, version-fenced
  pre-settlement signals (`settlement_channel.*`) for shared reimbursements,
  invoices, or personal invoices in Personal or Team scope (`scope=personal` or `scope=team`).
---

# ERC-8004 Pre-Settlement Channel Signals (`settlement-channel-signals`)

- **Collection**: `agent_commerce_x402`
- **Scope**: `{ "kind": "personal" }` or `{ "kind": "team", "teamId": "<team-uuid>" }`
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), A2A (`settlement_duet`)

## 1. Operations (`settlement_channel.*`)

All four tools are enabled in both `personal` and `team` scopes and **never move funds**:

1. `settlement_channel.resolve_counterparty` (`documentKind: "reimbursement" | "invoice" | "personal_invoice"`, `documentId`)
   - Resolves the counterparty's `agentRegistry`, `agentId` (ERC-8004), `walletAddress`, `a2aEndpoint`, and `supportedTrust`.
2. `settlement_channel.list_open_signals` (`documentKind?`, `limit?`)
   - Lists open pre-settlement signals awaiting action from the current Personal or Team agent.
3. `settlement_channel.get_thread` (`documentKind`, `documentId`, `limit?`)
   - Reads the append-only ERC-8004-anchored signal thread for the shared document.
4. `settlement_channel.send_signal` (`documentKind`, `documentId`, `expectedVersion`, `payload`, `idempotencyKey`, `note?`)
   - Sends a version-fenced signal and wakes the counterparty's outbox.

## 2. Typed Signal Payloads (`payload.kind`)

| `payload.kind` | Fields | When to Send |
| --- | --- | --- |
| `request_evidence` | `blockerCode` (`line_without_proof`, `amount_differs_from_receipt`, `receipt_reused`, `fx_missing`, `missing_attachment`), `lineItemId?`, `expectedAmount?`, `currency?` | Payer agent flags a proof or FX discrepancy before human review |
| `evidence_ready` | `resolvedBlockerCode`, `lineItemId?`, `attachmentSourceId?` | Payee agent attaches missing proof or resolves the blocker |
| `request_fiscal_amendment` | `customerTaxId`, `fiscalDocumentType?` (`factura_a`, `factura_b`, `factura_c`, `factura_e`) | Request tax ID or fiscal invoice type correction |
| `propose_settlement_rail` | `receiveChain` (`ARC-TESTNET`, `BASE`, `ETH`, `ARB`, `OP`, `AVAX`, `MATIC`, etc.), `receiveTokenSymbol` (`USDC`, `EURC`, `USDT`) | Coordinate preferred chain and token before staging payout |
| `terms_revised` | `updatedFields` (`lines`, `fiscalDocumentType`, `customerTaxId`, `receiveChain`, `receiveTokenSymbol`) | Notify counterparty that draft fields were updated |
| `declare_payment_intent` | `rail` (`ghost`, `stablefx`, `conduit`, `direct_device`, `bridge_route`), `scheduledDate?` (`YYYY-MM-DD`) | Declare how and when the human payer intends to settle |

## 3. CLI Examples

```bash
bufi call settlement_channel.list_open_signals --scope team --team-id <team-uuid> --input '{"limit":25}'
bufi call settlement_channel.send_signal --scope personal --input '{
  "documentKind": "reimbursement",
  "documentId": "<doc-uuid>",
  "expectedVersion": 2,
  "idempotencyKey": "sig-ev-ready-002",
  "payload": {
    "kind": "evidence_ready",
    "resolvedBlockerCode": "line_without_proof"
  }
}'
```
