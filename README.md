# Agentic collaboration

Skills for agents that use BUFI Desk, workspace-to-workspace collaboration, and the official BUFI MCP.

```bash
npx skills add BuFi007/agentic-collaboration
```

Install these next to the BUFI MCP. When a message arrives on a `w2w` scope, follow `walkie-talkie` and answer with `collaboration_message` on that same scope.

| Skill | Use it when |
| --- | --- |
| `walkie-talkie` | A collaboration message or A2A text arrives for an accepted pair |
| `bufi-desk` | You are signed into BUFI through the MCP |
| `w2w-invite` | You invite a workspace or accept BUFI Connect |
| `a2a-handoff` | Shiva receives text for another workspace's agent |
| `webmcp-cursors` | The open channel should show the other side's cursor |
