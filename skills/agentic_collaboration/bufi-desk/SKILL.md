---
name: bufi-desk
description: >-
  Use the signed-in BUFI MCP server or thin TypeScript CLI (`bufi`) for Desk.
  Use when an agent needs to inspect capabilities, execute Shiva agent-tools in
  Personal or Team scope using the shared OAuth 2.1 token, join LiveKit
  presence, or send a collaboration message.
---

# BUFI Desk Context (MCP + Thin TypeScript CLI)

Both the **Official BUFI MCP server** and the **Thin TypeScript CLI (`bufi`)** authenticate with the **exact same OAuth 2.1 Bearer token** (`role: "bufi_mcp_agent"`) and call the **same Shiva `/agent-tools` catalog and `/api/collaboration/agent` endpoints**.

## 1. Shared OAuth & Scope Contract

1. Call `whoami` (MCP) or `bufi whoami` (CLI) first to confirm the signed-in user and the scope stamped on the OAuth grant.
2. Choose the explicit scope the user asked for:
   - **Personal**: `{ "kind": "personal" }` (`?scope=personal`)
   - **Team**: `{ "kind": "team", "teamId": "<team-uuid>" }` (`?scope=team&teamId=<team-uuid>`)
   - **Workspace-to-workspace**: `{ "kind": "w2w", "teamId": "<your-team-uuid>", "peerTeamId": "<peer-team-uuid>" }`
3. Call `workspace_capabilities` (MCP) or `bufi catalog --scope <personal|team> [--team-id <uuid>]` (CLI) to read the effective Shiva `/agent-tools/catalog` for that scope (`tools`, `resources`, `prompts`, and `unavailable` reasons).

## 2. When to Use MCP vs. Thin TypeScript CLI (`bufi`)

| Surface | When to Use | Command / Tool Pattern |
| --- | --- | --- |
| **MCP** | Interactive chat/voice turns, live SSE review streams (`bufi://reviews/pending`), or when the host already mounted the MCP connector. | `whoami`, `workspace_capabilities`, `<tool.name>({ scope, input })` |
| **Thin TypeScript CLI (`bufi`)** | Terminal-driven coding agents (Claude Code, Codex, Cursor, Gemini CLI), scripted batch workflows, or local shell pipelines. | `bufi catalog --scope team --team-id <id>`<br>`bufi call <tool-name> --scope team --team-id <id> --input '<json>'`<br>`bufi collaborate message --scope team --team-id <id> --text "..."` |

## 3. Collaboration Routing by Scope

- **Intra-workspace (`team` scope)**: Follow [`team-collaboration`](../team-collaboration/SKILL.md) to talk with teammates (`collaboration_message`), propose Document AI candidates (`collaboration_propose_document`), and co-edit draft notes (`collaboration_document_duet_read`, `collaboration_document_duet_update`).
- **Cross-workspace (`w2w` scope)**: Follow [`walkie-talkie`](../walkie-talkie/SKILL.md) (`collaboration_connect` + `collaboration_message`). Both workspaces must have an accepted `w2w_invites` row with `ai_collaboration = true`.

## 4. Safety & Money Boundary

- Never infer a team, copy private data between contexts, or claim that a tool call moved funds.
- Every money-proposing action lands in the **BuIsland miniplayer** and **Pending Decisions Inbox** (`pending_decisions`) for human passkey/wallet confirmation.
- Issuing a LiveKit token does not mean online; stay connected to the LiveKit room while collaborating.
