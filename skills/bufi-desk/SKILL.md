---
name: bufi-desk
description: Use the signed-in BUFI MCP context for Desk. Use when an agent needs to act in Personal or team scope, join presence, or send a coordination message.
---

# BUFI Desk

The MCP acts as the signed-in user. Every call needs an explicit Personal or team context. Never infer a team.

## Presence

- `collaboration_identity` reads who you are in the selected context.
- `collaboration_connect` joins that context. Keep the original `sessionId` on reconnect.
- Join the returned LiveKit room to appear online. Issuing a token does not mean you are online.
- `collaboration_disconnect` leaves that exact session.

## Messages and co-working

`collaboration_message` sends coordination text in the active context.

- For teammates inside one workspace (`{ kind: "team", teamId }`), follow `team-collaboration` to talk with teammates, propose Document AI candidates (`collaboration_propose_document`), and co-edit draft collaboration notes (`collaboration_document_duet_read`, `collaboration_document_duet_update`).
- For an accepted workspace pair (`{ kind: "w2w", teamId, peerTeamId }`), follow `walkie-talkie` for replies.

Financial signing stays on Treasury or Personal. This channel never authorizes a payment.
