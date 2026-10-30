# BUFI Skills & Thin TypeScript CLI (`bufi/skills`)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./VERSION)
[![Skills](https://img.shields.io/badge/skills-20%20across%204%20collections-emerald.svg)](./index/candidate-skills.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Multi-collection **Agent Skills Catalog** (`skills/<collection>/<skill-name>/SKILL.md`) and **Thin TypeScript CLI (`bufi`)** for **BUFI Desk**.

Structured following the multi-collection conventions of [`actionbook/rust-skills`](https://github.com/actionbook/rust-skills) and the Git-tree SHA-1 update architecture of [`firecrawl/skills`](https://github.com/firecrawl/skills) (`firecrawl/cli`).

---

## Install Skills

Install the entire multi-collection catalog into Claude Code, Codex, Cursor, Windsurf, or Antigravity:

```bash
npx skills add BuFi007/skills --full-depth --global --all --yes
```

Or install via the built-in CLI wrapper:

```bash
bunx bufi/skills skills install
```

---

## Architecture: Three Layers, Two Scopes, One Settlement Gate

| Layer | Role | Transport / Entry Point |
| :--- | :--- | :--- |
| **1. Skills (`skills/<collection>/<skill>`)** | High-level orchestration layer. Teaches the agent **which scope** (`personal` vs `team` vs `w2w`) and **which channel** (`Team LiveKit Room`, `W2W Walkie-Talkie`, `MCP`, `CLI`, or `In-Page WebMCP`) to use. | `SKILL.md` loaded by the agent harness |
| **2. Official MCP & Thin CLI (`bufi`)** | Server-side execution layer. Both call Shiva's `/agent-tools/catalog` and `/agent-tools/execute` endpoints using the **exact same OAuth 2.1 Bearer token** (`role === 'bufi_mcp_agent'`). | `https://api.bufi.finance/functions/v1/mcp` or `bufi catalog` / `bufi call` |
| **3. Realtime Rooms & In-Page WebMCP** | Live coordination & visual inspection layer: **Team LiveKit Room** (`{ kind: "team", teamId }`) for teammates in one workspace, **W2W Walkie-Talkie** (`w2w:<teamA>:<teamB>`) for external workspaces that accepted **BUFI Connect**, and **WebMCP** (`document.modelContext`) for live page tools and `read_w2w_cursors`. | LiveKit DataChannel + Browser `document.modelContext` |

> **Money Invariant**: Money **never** moves unilaterally from an MCP or CLI call. Every transfer (`initiateTransfer`), swap (`prepareSwap`), batch payout (`prepareBatch`), treasury allocation (`prepareTreasuryAllocation`), bill settlement (`post_bills_pay`), agent wallet x402 payment (`agent_wallet_pay_x402`), or W2W escrow funding (`fund_w2w_job`) lands in the **BuIsland Miniplayer** and the **Pending Decisions Inbox** (`/decisions`) for human review and signature.

---

## Skill Collections (`skills/`)

```text
skills/
├── agentic_collaboration/          # Collection 1: Routing, Desk Context, Team Room, W2W Walkie-Talkie, A2A, WebMCP
│   ├── bufi-router/                # Master router across Personal | Team | W2W and MCP | CLI | LiveKit | WebMCP
│   ├── bufi-desk/                  # OAuth 2.1 context, scope switching, and presence
│   ├── team-collaboration/         # In-workspace Team LiveKit room, Document AI candidates, Document Duet
│   ├── walkie-talkie/              # Cross-workspace W2W channel replies (requires BUFI Connect)
│   ├── w2w-invite/                 # Short-code workspace invite + BUFI Connect consent gate
│   ├── a2a-handoff/                # Inbound POST /a2a/:agentId handoff into walkie-talkie
│   └── webmcp-cursors/             # Realtime peer/teammate cursor inspection via read_w2w_cursors
│
├── personal_finance/               # Collection 2: Personal Scope (scope=personal) & Personal-to-Team Bridge
│   ├── personal-wallet-transfers/  # Personal transfers, swaps, batches -> BuIsland Miniplayer & Decisions Inbox
│   ├── personal-documents-and-inbox/# Personal document vault, OCR extraction, and personal inbox triage
│   ├── personal-arca-tax/          # Personal ARCA tax connection and fiscal receipt sync
│   └── personal-to-team-bridge/    # Bridge a personal receipt/expense into a Team reimbursement + Team Room notice
│
├── team_treasury/                  # Collection 3: Team Treasury Scope (scope=team&teamId=<uuid>)
│   ├── treasury-proposals/         # Safe multisig, Squads V4, and single-sig treasury proposals
│   ├── treasury-swaps-and-allocations/ # Li.Fi cross-chain swaps and Morpho/Aave yield allocations
│   ├── reimbursements-and-payables/# Team reimbursements, vendor bills, and post_bills_pay staging
│   ├── invoices-and-receivables/   # Customer invoice lifecycle + optional W2W Walkie-Talkie notice
│   └── payroll-and-runway/         # Burn rate, runway, spending analytics, and batch payroll preparation
│
└── agent_commerce_x402/            # Collection 4: Agent Wallets, HTTP 402 (x402), Marketplace, ERC-8183 & Nitrolite
    ├── agent-wallet-x402/          # Agent wallet policy checks, transfers, and x402 API payment settlements
    ├── marketplace-deals-and-quotes/# BUFI Marketplace search, quote requests/responses, and deal acceptance
    ├── w2w-erc8183-escrow-jobs/    # On-chain ERC-8183 escrow job creation, funding, deliverable, and attestation
    └── settlement-channel-signals/ # Yellow Network Nitrolite state channel open/signal/close workflows
```

See the full matrix in [`index/candidate-skills.md`](./index/candidate-skills.md).

---

## Thin TypeScript CLI (`bufi`)

The `bufi` CLI (`src/cli.ts`) calls the existing Shiva `/agent-tools/catalog` and `/agent-tools/execute` endpoints using the same OAuth 2.1 Bearer token (`BUFI_OAUTH_TOKEN` or `~/.config/bufi/credentials.json`) as the Official MCP:

```bash
# 1. Save your OAuth 2.1 Bearer token (same token issued to bufi_mcp_agent)
bufi auth login --token "$BUFI_OAUTH_TOKEN"

# 2. Inspect the Personal or Team tool/resource/prompt catalog from Shiva
bufi catalog --scope personal
bufi catalog --scope team --team-id <team-uuid>

# 3. Execute a tool in Personal or Team scope
bufi call document.list --scope personal --input '{"limit":10}'
bufi call reimbursement.list --scope team --team-id <team-uuid> --input '{"status":"pending"}'

# 4. Read a resource or render a prompt
bufi resource bufi://reimbursements/recent --scope team --team-id <team-uuid>
bufi prompt monthly_close_checklist --scope team --team-id <team-uuid> --args '{"month":"2026-10"}'

# 5. Manage & check skill updates
bufi skills list
bufi skills status
bufi skills refresh
```

---

## How Skill Updates Work (Git Tree SHA-1 + 20h Cache)

Modeled after `firecrawl/cli` (`src/skill-catalog.ts` & `src/skill-update-notice.ts`):

1. **Remote Tree Discovery (`src/skill-catalog.ts`)**:
   - Queries `https://api.github.com/repos/BuFi007/skills/git/trees/main?recursive=1` to discover every `skills/<collection>/<skill-name>/SKILL.md` and its file blob SHA-1 hashes without cloning the repo.
2. **Git Blob SHA-1 Content Comparison (`src/skill-update-notice.ts`)**:
   - Computes `sha1("blob " + byteLength + "\0" + content)` for every installed skill file in `~/.agents/skills/<skill-name>` and compares against the remote tree and `~/.agents/.skill-lock.json`.
3. **20-Hour Non-Blocking Cache**:
   - Caches the check in `~/.cache/bufi/skill-update.json` (TTL: 20 hours) with an atomic lockfile (`skill-update.lock`) so CLI commands never block on network calls. When an update is detected, the CLI prints a one-line notice:
     `npx skills add BuFi007/skills --full-depth --global --all --yes`

---

## Development & Quality Gate

```bash
bun test
bun run quality-check
```
