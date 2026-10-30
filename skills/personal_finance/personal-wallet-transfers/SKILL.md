---
name: personal-wallet-transfers
description: >-
  Propose a send or token swap from the user's personal wallet in Personal scope
  (`scope=personal`). Use when preparing a personal transfer or swap so the
  proposal lands in the BuIsland miniplayer for device-side signing (`sign_on_your_device`).
---

# Personal Wallet Transfers & Swaps (`personal-wallet-transfers`)

- **Collection**: `personal_finance`
- **Scope**: `{ "kind": "personal" }` (`?scope=personal`)
- **Transports**: WebMCP / Chat (`initiateTransfer`, `prepareSwap`), Official MCP, Thin TypeScript CLI (`bufi`)

## Core Doctrine

1. **You never hold the user's key, and the server never does.** A user's personal wallet (a Circle User-Controlled Wallet or a connected external wallet) signs on their own device.
2. **Check live balances first**:
   - Read live chain balances (`getWalletBalances` in chat/WebMCP). Failed reads are reported as unknown, never cached zeros.
   - In `personal` scope, contacts list only people billed from this Personal workspace and carry no wallet addresses — ask the user for the recipient address when not provided.
3. **Proposals land in the BuIsland miniplayer**:
   - `initiateTransfer` (`walletSource='personal'`) and `prepareSwap` (`walletSource='personal'`) create a proposal record in the **BuIsland miniplayer** and **Pending Decisions Inbox**.
   - Every approval ends as `sign_on_your_device` — a PIN, passkey biometric, or wallet prompt on the user's device, never a server-side execution.
4. **How to report the outcome**:
   - Say: *"Ready — approve and sign it from your wallet in the BuIsland miniplayer."*
   - Never route a personal send through the Team Treasury Sign ceremony or the Agent Grant (`x402`).
