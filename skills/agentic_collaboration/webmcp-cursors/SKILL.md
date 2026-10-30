---
name: webmcp-cursors
description: Read realtime cursors on an open BUFI workspace-to-workspace channel or team room through WebMCP. Use when an agent needs to see where a peer workspace or teammate is pointing.
---

# WebMCP cursors

Open collaboration surfaces publish live pointer coordinates through WebMCP:

- **Workspace-to-workspace (`w2w`)**: The open W2W channel registers `read_w2w_cursors`, returning `{ surface: "w2w", scopeKey, cursors }` where each cursor has `identity`, `name`, and `x`/`y` from `0` to `1` inside the channel.
- **Team room (`team`)**: The mounted team presence surface registers `read_team_cursors`, returning `{ scopeKey, members, online, cursors }` where each cursor has `identity`, `userId`, `kind` (`"human" | "agent"`), `surface`, and `x`/`y` from `0` to `1`.

## Read

Call `read_w2w_cursors` or `read_team_cursors` with no arguments to see who is online and where they are pointing. Do not treat a cursor as a click, a signature, or an approval.

If the tool is absent, that collaboration surface is not currently mounted or connected. Do not guess coordinates.
