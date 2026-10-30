---
name: treasury-swaps-and-allocations
description: >-
  Prepare team treasury token conversions (`getSwapQuote`, `prepareSwap`), batch
  transfers (`prepareBatch`), and Agent Wallet funding allocations
  (`prepareTreasuryAllocation`) in Team scope (`scope=team`).
---

# Treasury Swaps, Batches & Agent Allocations (`treasury-swaps-and-allocations`)

- **Collection**: `team_treasury`
- **Scope**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
- **Transports**: In-Page WebMCP / Chat, Official MCP, Thin TypeScript CLI (`bufi`)

## 1. Treasury Token Conversions (`getSwapQuote` → `prepareSwap`)

- **`getSwapQuote` is the sole pricing authority**:
  - Pass the active treasury chain, exact input decimal string, and token pair (`USDC`, `EURC`, `cirBTC`, etc.).
  - Quote the exact expected output, minimum output, fees, and expiry returned by `getSwapQuote`, even when balances are insufficient.
  - **Never** substitute `getFxRate`, CoinGecko, web search, or a remembered rate as a swap estimate. If `getSwapQuote` cannot quote the pair, state that pricing is unavailable.
- **Stage with `prepareSwap`**:
  - Calling `prepareSwap` stages the swap proposal in the **BuIsland miniplayer** and **Decisions Inbox**. Human approval re-quotes and opens the Treasury Sign ceremony.

## 2. Funding the Agent Wallet (`prepareTreasuryAllocation`)

- To move USDC/EURC from the Team Treasury into the workspace's **Agent Wallet** (so the agent can pay for x402 services within its grant), always use `prepareTreasuryAllocation`.
- **Never** use a generic transfer tool to fund the Agent Wallet; `prepareTreasuryAllocation` opens the dedicated Treasury Allocation ceremony in the miniplayer.

## 3. Batch Payouts (`prepareBatch`)

- Use `prepareBatch` to stage multi-recipient treasury transfers in one proposal card in the miniplayer / Decisions Inbox. Every recipient in the batch must be on the team's `AddressBook`.
