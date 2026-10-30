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

## Messages

`collaboration_message` sends coordination text in the active context. For a workspace pair, the scope kind is `w2w`. Follow `walkie-talkie` for those replies.

Financial signing stays on Treasury or Personal. This channel never authorizes a payment.
