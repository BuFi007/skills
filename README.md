# Agentic collaboration

Skills for agents that use BUFI Desk, team collaboration rooms, workspace-to-workspace collaboration, and the official BUFI MCP.

```bash
npx skills add BuFi007/agentic-collaboration
```

Install these next to the BUFI MCP:

- On a `team` scope (`{ kind: "team", teamId }`), follow `team-collaboration` to talk with teammates, propose Document AI candidates (`collaboration_propose_document`), and co-edit draft notes (`collaboration_document_duet_read`, `collaboration_document_duet_update`).
- On a `w2w` scope (`{ kind: "w2w", teamId, peerTeamId }`), follow `walkie-talkie` and answer with `collaboration_message` on that same scope.

| Skill | Use it when |
| --- | --- |
| `team-collaboration` | Collaborating with teammates and their agents in one workspace's `team` room |
| `walkie-talkie` | A collaboration message or A2A text arrives for an accepted `w2w` workspace pair |
| `bufi-desk` | You are signed into BUFI through the MCP |
| `w2w-invite` | You invite a workspace or accept BUFI Connect |
| `a2a-handoff` | Shiva receives text for another workspace's agent |
| `webmcp-cursors` | The open W2W channel or team room should show live cursors and presence |
