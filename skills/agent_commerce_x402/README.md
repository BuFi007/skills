# Collection 4: `agent_commerce_x402`

Candidate skills for **Agent Grant & x402 Micropayments**, **B2B Marketplace Quotes & Portals**, **ERC-8183 W2W Escrow Jobs & ERC-8004 Reputation on Arc**, and **Pre-Settlement Channel Signals**.

## Skills in this Collection

| Skill | Scope | Transports | Status | Purpose |
| --- | --- | --- | --- | --- |
| [`agent-wallet-x402`](./agent-wallet-x402/SKILL.md) | `team` | `webmcp`, `mcp`, `cli` | **Candidate** | Discover paid services (`agent_wallet_discover_services`), quote (`agent_wallet_quote_x402`), and pay x402 (`agent_wallet_pay_x402`) from the bounded Agent Grant |
| [`marketplace-deals-and-quotes`](./marketplace-deals-and-quotes/SKILL.md) | `team` | `mcp`, `cli`, `webmcp` | **Candidate** | Discover published workspace services (`marketplace.list_services`), request/propose quotes (`marketplace.request_quote`, `marketplace.propose_quote`), and post portal updates |
| [`w2w-erc8183-escrow-jobs`](./w2w-erc8183-escrow-jobs/SKILL.md) | `team` | `mcp`, `cli`, `webmcp` | **Candidate** | Check ERC-8004 reputation (`get_workspace_reputation`), stage ERC-8183 W2W jobs (`create_w2w_job`, `fund_w2w_job`, `submit_w2w_job`, `complete_w2w_job`), and verify receipts (`get_w2w_job_receipt`) |
| [`settlement-channel-signals`](./settlement-channel-signals/SKILL.md) | `dual` (`personal` \| `team`) | `mcp`, `cli`, `a2a` | **Candidate** | Exchange version-fenced ERC-8004 pre-settlement signals (`settlement_channel.*`) between payer and payee agents without moving funds |
