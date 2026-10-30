---
name: w2w-erc8183-escrow-jobs
description: >-
  Check counterparty on-chain ERC-8004 reputation (`get_workspace_reputation`),
  propose and manage Arc Testnet ERC-8183 workspace-to-workspace escrow jobs
  (`create_w2w_job`, `fund_w2w_job`, `submit_w2w_job`, `complete_w2w_job`), and
  verify job receipts (`get_w2w_job_receipt`) in Team scope (`scope=team`).
---

# W2W ERC-8183 Escrow Jobs & ERC-8004 Reputation (`w2w-erc8183-escrow-jobs`)

- **Collection**: `agent_commerce_x402`
- **Scope**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
- **Transports**: Official MCP, Thin TypeScript CLI (`bufi`), In-Page WebMCP

## 1. Pre-Job Counterparty Reputation Check (`get_workspace_reputation`)

Before proposing any W2W job or escrow lock, always check the counterparty workspace's on-chain standing on the BUFI Arc subgraph:
- **Tool**: `get_workspace_reputation` (`teamId`, optional `verified: true` to count only ratings backed by a settled ERC-8183 job).
- Returns: ERC-8004 identity counters, attested payment score, recent ratings, and historical engagement between your workspace and the counterparty.

## 2. ERC-8183 Job Lifecycle

| Step | Tool | Actor | Tier | Where It Lands |
| --- | --- | --- | --- | --- |
| 1. Create Job | `create_w2w_job` (`sellerTeamId`, `budgetUsdc`, `brief`) | Buyer (`admin`) | `financial` | Stages proposal in **BuIsland miniplayer** & **Decisions Inbox** |
| 2. Fund Escrow | `fund_w2w_job` (`id`) | Buyer (`admin`) | `financial` | Locks USDC in Arc ERC-8183 escrow after human passkey + Treasury Sign |
| 3. Submit Deliverable | `submit_w2w_job` (`id`, `deliverableHash`) | Seller (`admin`) | `write` | Records `bytes32` deliverable hash on the job |
| 4. Complete & Release | `complete_w2w_job` (`id`, `reasonHash`) | Buyer (`admin`) | `financial` | Releases escrow to seller after human passkey confirmation |
| 5. Verify Receipt | `get_w2w_job_receipt` (`id`) | Buyer or Seller (`viewer`) | `read` | Cross-checks Shiva status + tx hashes against the Arc subgraph event timeline |

## 3. CLI Examples

```bash
bufi call get_workspace_reputation --scope team --team-id <team-uuid> --input '{"teamId":"<counterparty-team-uuid>","verified":true}'
bufi call get_w2w_job_receipt --scope team --team-id <team-uuid> --input '{"id":"<job-uuid>"}'
```
