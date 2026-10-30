/**
 * Thin TypeScript CLI client for BUFI Shiva `/agent-tools` and `/api/collaboration/agent`.
 *
 * Uses the exact same OAuth 2.1 Bearer JWT (`role: "bufi_mcp_agent"`) and explicit
 * `scope` (`personal` | `team` | `w2w`) that the official BUFI MCP server uses.
 * Money proposals never execute directly from an agent call — they land in the
 * BuIsland miniplayer and Pending Decisions Inbox.
 */

export type BufiCliScope =
  | { kind: 'personal' }
  | { kind: 'team'; teamId: string }
  | { kind: 'w2w'; teamId: string; peerTeamId: string };

export interface BufiAgentToolsConfig {
  /** Base URL for Shiva `/agent-tools`, e.g. `https://shiva-dev.bu.finance/agent-tools` */
  agentToolsUrl: string;
  /** Base URL for Desk collaboration endpoint, e.g. `https://app.bufi.localhost/api/collaboration/agent` */
  collaborationUrl?: string;
  /** OAuth 2.1 Bearer token (`role = "bufi_mcp_agent"`) shared with the MCP server */
  accessToken: string;
  /** Explicit scope (`personal`, `team`, or `w2w`). Never inferred. */
  scope: BufiCliScope;
  /** Custom fetch implementation for testing */
  fetchFn?: typeof fetch;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCliScope(options: {
  scope?: string;
  teamId?: string;
  peerTeamId?: string;
}): BufiCliScope {
  const kind = options.scope?.trim();
  if (kind === 'personal') {
    if (options.teamId || options.peerTeamId) {
      throw new Error('AGENT_SCOPE_MISMATCH: personal scope must not include teamId or peerTeamId.');
    }
    return { kind: 'personal' };
  }
  if (kind === 'team') {
    if (!options.teamId || !UUID_RE.test(options.teamId)) {
      throw new Error('AGENT_SCOPE_REQUIRED: team scope requires a valid UUID --team-id.');
    }
    if (options.peerTeamId) {
      throw new Error('AGENT_SCOPE_MISMATCH: team scope must not include --peer-team-id.');
    }
    return { kind: 'team', teamId: options.teamId };
  }
  if (kind === 'w2w') {
    if (
      !options.teamId ||
      !UUID_RE.test(options.teamId) ||
      !options.peerTeamId ||
      !UUID_RE.test(options.peerTeamId)
    ) {
      throw new Error(
        'AGENT_SCOPE_REQUIRED: w2w scope requires valid UUIDs for both --team-id and --peer-team-id.'
      );
    }
    return { kind: 'w2w', teamId: options.teamId, peerTeamId: options.peerTeamId };
  }
  throw new Error(
    'AGENT_SCOPE_REQUIRED: pass --scope personal, --scope team --team-id <uuid>, or --scope w2w --team-id <uuid> --peer-team-id <uuid>.'
  );
}

function buildScopedAgentToolsUrl(
  baseUrl: string,
  part: 'catalog' | 'execute',
  scope: BufiCliScope
): URL {
  if (scope.kind === 'w2w') {
    throw new Error(
      'AGENT_SCOPE_MISMATCH: Shiva /agent-tools operates on personal or team scope. Use collaboration commands for w2w scope.'
    );
  }
  const normalized = baseUrl.replace(/\/+$/, '');
  const target = new URL(`${normalized}/${part}`);
  target.searchParams.set('scope', scope.kind);
  if (scope.kind === 'team') {
    target.searchParams.set('teamId', scope.teamId);
  }
  return target;
}

export class BufiAgentClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: BufiAgentToolsConfig) {
    if (!config.accessToken || !config.accessToken.trim()) {
      throw new Error('AGENT_OAUTH_REQUIRED: missing BUFI_MCP_ACCESS_TOKEN (bufi_mcp_agent JWT).');
    }
    this.fetchImpl = config.fetchFn ?? fetch;
  }

  /** Read the effective Shiva `/agent-tools/catalog` for the active Personal or Team scope. */
  async getCatalog(): Promise<unknown> {
    const url = buildScopedAgentToolsUrl(this.config.agentToolsUrl, 'catalog', this.config.scope);
    const response = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const code =
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : 'AGENT_REQUEST_REFUSED';
      throw new Error(`${code} (HTTP ${response.status})`);
    }
    return body;
  }

  /** Execute a Shiva `/agent-tools/execute` tool command in the active Personal or Team scope. */
  async callTool(name: string, input: Record<string, unknown> = {}): Promise<unknown> {
    if (
      'teamId' in input &&
      (this.config.scope.kind !== 'team' || input.teamId !== this.config.scope.teamId)
    ) {
      throw new Error('AGENT_SCOPE_MISMATCH: input.teamId must match the active team scope.');
    }
    return this.execute({ kind: 'tool', name, input });
  }

  /** Read a Shiva `/agent-tools/execute` resource URI in the active scope. */
  async readResource(uri: string): Promise<unknown> {
    return this.execute({ kind: 'resource', uri });
  }

  /** Render a Shiva `/agent-tools/execute` prompt in the active scope. */
  async getPrompt(name: string, args: Record<string, string> = {}): Promise<unknown> {
    return this.execute({ kind: 'prompt', name, arguments: args });
  }

  /** Execute a collaboration action (`connect`, `message`, `propose_document`, `document_duet_*`). */
  async collaborate(command: Record<string, unknown>): Promise<unknown> {
    if (!this.config.collaborationUrl) {
      throw new Error('COLLABORATION_UNAVAILABLE: missing BUFI_COLLABORATION_API endpoint.');
    }
    const response = await this.fetchImpl(this.config.collaborationUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scope: this.config.scope, ...command }),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const code =
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : 'collaboration_unavailable';
      throw new Error(`${code} (HTTP ${response.status})`);
    }
    return body;
  }

  private async execute(
    command:
      | { kind: 'tool'; name: string; input: Record<string, unknown> }
      | { kind: 'resource'; uri: string }
      | { kind: 'prompt'; name: string; arguments: Record<string, string> }
  ): Promise<unknown> {
    const url = buildScopedAgentToolsUrl(this.config.agentToolsUrl, 'execute', this.config.scope);
    const response = await this.fetchImpl(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const code =
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : 'AGENT_REQUEST_REFUSED';
      throw new Error(`${code} (HTTP ${response.status})`);
    }
    return body;
  }
}
