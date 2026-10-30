---
name: webmcp-cursors
description: Read realtime cursors on an open BUFI workspace-to-workspace channel through WebMCP. Use when an agent needs to see where the other workspace is pointing.
---

# WebMCP cursors

The open W2W channel publishes cursor packets on surface `w2w`. The page registers one WebMCP tool, `read_w2w_cursors`.

## Read

Call `read_w2w_cursors` with no arguments. It returns `{ surface: "w2w", scopeKey, cursors }`. Each cursor has an identity, a name, and `x`/`y` from 0 to 1 inside the channel.

Use that view to see where the other human or agent is pointing. Do not treat a cursor as a click, a signature, or an approval.

If the tool is absent, the channel is not the mounted surface. Do not guess coordinates.
