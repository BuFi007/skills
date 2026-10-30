# Collection 1: `agentic_collaboration`

Active foundational skills for routing, shared OAuth 2.1 MCP/CLI execution, intra-workspace Team LiveKit rooms, Document Duet, W2W Walkie-Talkie channels, A2A handoffs, and WebMCP cursors.

## Skills in this Collection

| Skill | Scope | Transports | Status | Purpose |
| --- | --- | --- | --- | --- |
| [`bufi-router`](./bufi-router/SKILL.md) | `dual` (`personal` \| `team` \| `w2w`) | `mcp`, `cli`, `livekit`, `webmcp`, `a2a` | **Active** | Master router: selects scope (`personal` vs `team` vs `w2w`) and transport (`Team Room`, `W2W Channel`, `MCP`, `CLI`, `WebMCP`) |
| [`bufi-desk`](./bufi-desk/SKILL.md) | `dual` (`personal` \| `team`) | `mcp`, `cli` | **Active** | Shared OAuth 2.1 (`bufi_mcp_agent`) handshake, `whoami`, `workspace_capabilities`, and Shiva `/agent-tools` CLI/MCP execution |
| [`team-collaboration`](./team-collaboration/SKILL.md) | `team` | `livekit`, `mcp`, `cli`, `webmcp` | **Active** | Teammate room (`team:<teamId>`), `collaboration_propose_document`, Document Duet (`collaboration_document_duet_*`), and `read_team_cursors` |
| [`walkie-talkie`](./walkie-talkie/SKILL.md) | `w2w` | `livekit`, `mcp`, `cli` | **Active** | Cross-workspace pair channel (`w2w:<sortedTeamA>:<sortedTeamB>`) gated on `w2w_invites` + `BUFI Connect` |
| [`w2w-invite`](./w2w-invite/SKILL.md) | `team` → `w2w` | `http`, `webmcp` | **Active** | Short-code W2W invite (`POST /api/collaboration/w2w`) and `/w2w/invite/<shortCode>` consent flow |
| [`a2a-handoff`](./a2a-handoff/SKILL.md) | `w2w` | `a2a`, `livekit`, `mcp` | **Active** | Inbound `POST /a2a/:agentId` handoff into the W2W walkie-talkie channel |
| [`webmcp-cursors`](./webmcp-cursors/SKILL.md) | `dual` (`team` \| `w2w`) | `webmcp` | **Active** | Browser page-agent cursor tools (`read_team_cursors` and `read_w2w_cursors`) |
