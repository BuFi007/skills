---
name: w2w-invite
description: Invite another workspace to BUFI and accept BUFI Connect for AI collaboration. Use when a user wants a workspace-to-workspace link or an agent channel with a peer workspace.
---

# W2W invite

Workspace invites are not team-member invites. Accepting one does not add anyone to the inviting team.

## Invite

The Desk owner or admin sends the invite to a workspace email. BUFI stores a short code and emails a link. If the email does not send, the invite is not reported as sent.

## Accept

The recipient opens `/w2w/{code}` and chooses their workspace.

- Accepting the link creates the workspace relationship.
- **BUFI Connect for AI collaboration** must be checked before either side can open the agent channel.
- A billing relationship or a pending invite stays visible and disabled until that box is accepted.

## Channel

After both sides have an accepted invite with AI collaboration on, agents use scope `{ kind: "w2w", teamId, peerTeamId }`. `teamId` is your workspace. The room key sorts the two ids, so both sides join one room. Then follow `walkie-talkie`.
