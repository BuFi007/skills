---
name: treasury-proposals
description: >-
  Prepare team treasury transactions and wallet-face transfer proposals in Team
  scope (`scope=team`). Teaches AddressBook allowlist checks, wallet-face
  inspection (`get_agent_wallet_faces`), and how proposals land in the BuIsland
  miniplayer and Pending Decisions Inbox for passkey + Treasury Sign execution.
---

# Team Treasury Transfer Proposals (`treasury-proposals`)

- **Collection**: `team_treasury`
- **Scope**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
- **Transports**: In-Page WebMCP / Chat (`initiateTransfer`), Official MCP, Thin TypeScript CLI (`bufi`)

## Core Doctrine

1. **Agents do not hold treasury funds — the team's `SingleOwnerMSCA` treasury does.** Never invent Circle CLI commands, raw RPC transactions, or private keys.
2. **Check balances and wallet faces first**:
   - **MCP / CLI**: Call `get_wallets`, `get_wallet_balance`, or `get_agent_wallet_faces` (`includeBalances: "1"`).
   - **WebMCP / Chat**: Call `getWalletBalances` first.
   - Verify `get_contacts` (`type: "contractor" | "customer" | "team_member"`) for known recipient addresses.
3. **AddressBook (Allowlist) Gate**:
   - Only allowlisted recipients on the team's on-chain `AddressBook` succeed for treasury sends.
   - If the destination address is not allowlisted, **do not** propose the transfer yet. Instruct the user to add it via the Allowlist ceremony (`?allowlist=add&wallet=treasury`), sign that on-chain addition, and then retry.
4. **Proposing the Transfer**:
   - **In-Page WebMCP / Chat**: Call `initiateTransfer` with `walletSource: "treasury"` and exact decimal string amount.
   - **Wallet-Faces Intent Lane**: `propose_agent_wallet_transfer` (`kind: "wallet"`, `walletId`, `teamId`, exact decimal `amount`, `currency: "USDC" | "EURC"`, `sourceChain`, `destinationAddress`) stages a `pending_decisions` row (`mcp_write`) with a 10-minute `approvalToken`.
5. **Where Money Lands**:
   - Every proposal lands in the **BuIsland miniplayer** and the **Pending Decisions Inbox**.
   - A human admin/owner must confirm with a WebAuthn passkey assertion (`get_approval_challenge` → `confirm_action`) and complete the **Treasury Sign ceremony** in the BUFI app.
   - `prepared` is not sent; `submitted` is not confirmed. State clearly that the proposal is waiting in their miniplayer / Decisions Inbox.
