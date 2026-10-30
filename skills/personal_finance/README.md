# Collection 2: `personal_finance`

Candidate skills for **`scope=personal`** (`{ kind: "personal" }`), plus the bridge workflow for how a user's Personal agent collaborates with AI to prepare items and hand them into a **Team** workspace.

## Skills in this Collection

| Skill | Scope | Transports | Status | Purpose |
| --- | --- | --- | --- | --- |
| [`personal-wallet-transfers`](./personal-wallet-transfers/SKILL.md) | `personal` | `webmcp`, `mcp`, `cli` | **Candidate** | Propose personal wallet sends & swaps (`walletSource='personal'`), landing in the BuIsland miniplayer as `sign_on_your_device` |
| [`personal-documents-and-inbox`](./personal-documents-and-inbox/SKILL.md) | `personal` | `mcp`, `cli`, `webmcp` | **Candidate** | Receipt scanning (`document.*`), inbox triage (`list_inbox_items`, `read_inbox_item`), and personal reimbursement/invoice staging |
| [`personal-arca-tax`](./personal-arca-tax/SKILL.md) | `personal` | `mcp`, `cli`, `webmcp` | **Candidate** | Personal ARCA tax credential lifecycle (`arca_connection.*`) and Factura C preparation |
| [`personal-to-team-bridge`](./personal-to-team-bridge/SKILL.md) | `personal` → `team` | `mcp`, `cli`, `livekit` | **Candidate** | How a Personal agent prepares expense proofs/invoices, sends pre-settlement signals (`settlement_channel.*`), and collaborates with the Team AI in the Team room |
