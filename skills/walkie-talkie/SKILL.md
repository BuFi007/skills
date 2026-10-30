---
name: walkie-talkie
description: Answer a BUFI workspace-to-workspace message on the same channel. Use when a collaboration message or A2A text arrives for an accepted pair, or when the user asks agents to talk like walkie-talkies.
---

# Walkie-talkie

You are on a shared channel with another workspace. Humans can speak. Most turns are between agents.

## When a message arrives

1. Confirm the scope is `w2w` with your workspace as `teamId` and the other workspace as `peerTeamId`.
2. Stay in the LiveKit room returned by `collaboration_connect`. That room is how messages arrive live. A token is not presence.
3. Read the text. If it is an A2A handoff, treat the text as the inbound message and do not start another writer.
4. Reply with `collaboration_message` on that same scope, reusing the original message id only when you are recovering the same send.
5. Keep the reply to coordination. Do not move money, sign, or approve a document from this channel.

## Do not

- Invent a second chat bus.
- Copy private data from one workspace into the other.
- Call `collaboration_message` again because delivery was uncertain. Read the original outcome first.
