import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BufiAgentClient, parseCliScope } from '../agent-tools-client.ts';
import {
  discoverLocalCatalogSkills,
  parseCatalogTree,
  SKILL_FAMILIES,
} from '../skill-catalog.ts';
import { gitBlobHash, sameSkillFiles } from '../skill-update-notice.ts';
import { installSkillsNative } from '../skills-native.ts';

const REPO_ROOT = path.resolve(import.meta.dir, '../..');
const TEAM_A = '11111111-1111-4111-8111-111111111111';
const TEAM_B = '22222222-2222-4222-8222-222222222222';

describe('bufi/skills multi-collection catalog', () => {
  it('discovers all 4 skill collections and 20 skills with valid SKILL.md files', () => {
    const skills = discoverLocalCatalogSkills(REPO_ROOT);
    expect(skills.length).toBe(20);
    for (const family of SKILL_FAMILIES) {
      const familySkills = skills.filter(s => s.family === family);
      expect(familySkills.length).toBeGreaterThanOrEqual(4);
    }
    expect(skills.some(s => s.name === 'bufi-router' && s.family === 'agentic_collaboration')).toBe(
      true
    );
    expect(
      skills.some(s => s.name === 'personal-to-team-bridge' && s.family === 'personal_finance')
    ).toBe(true);
    expect(skills.some(s => s.name === 'treasury-proposals' && s.family === 'team_treasury')).toBe(
      true
    );
    expect(
      skills.some(s => s.name === 'agent-wallet-x402' && s.family === 'agent_commerce_x402')
    ).toBe(true);
  });

  it('parses a Git tree across multiple collection folders and detects SHA-1 updates', () => {
    const mdBytes = Buffer.from('---\nname: bufi-router\ndescription: Router\n---\n');
    const sha = gitBlobHash(mdBytes);
    const parsed = parseCatalogTree({
      truncated: false,
      tree: [
        {
          type: 'blob',
          path: 'skills/agentic_collaboration/bufi-router/SKILL.md',
          sha,
        },
        {
          type: 'blob',
          path: 'skills/team_treasury/treasury-proposals/SKILL.md',
          sha,
        },
      ],
    });
    expect(parsed).toHaveLength(2);
    expect(sameSkillFiles({ 'SKILL.md': [sha] }, parsed[0]!.files)).toBe(true);
    expect(
      sameSkillFiles({ 'SKILL.md': ['0000000000000000000000000000000000000000'] }, parsed[0]!.files)
    ).toBe(false);
  });

  it('installs a single collection or all collections natively into ~/.agents/skills and .skill-lock.json', async () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'bufi-home-'));
    fs.mkdirSync(path.join(fakeHome, '.claude'), { recursive: true });
    try {
      const res = await installSkillsNative('BuFi007/skills', {
        collection: 'agentic_collaboration',
        home: fakeHome,
        sourceDir: REPO_ROOT,
        quiet: true,
      });
      expect(res.skillCount).toBe(7);
      expect(res.linkedAgents).toContain('claude-code');
      const lock = JSON.parse(
        fs.readFileSync(path.join(fakeHome, '.agents', '.skill-lock.json'), 'utf8')
      );
      expect(lock.skills['bufi-router'].source).toBe('BuFi007/skills');
      expect(lock.skills['bufi-router'].skillPath).toBe(
        'skills/agentic_collaboration/bufi-router/SKILL.md'
      );
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });
});

describe('thin TypeScript CLI client for Shiva /agent-tools', () => {
  it('enforces explicit personal, team, and w2w scopes and rejects ambiguous combinations', () => {
    expect(parseCliScope({ scope: 'personal' })).toEqual({ kind: 'personal' });
    expect(() => parseCliScope({ scope: 'personal', teamId: TEAM_A })).toThrow(
      'AGENT_SCOPE_MISMATCH'
    );
    expect(() => parseCliScope({ scope: 'team' })).toThrow('AGENT_SCOPE_REQUIRED');
    expect(parseCliScope({ scope: 'team', teamId: TEAM_A })).toEqual({
      kind: 'team',
      teamId: TEAM_A,
    });
    expect(parseCliScope({ scope: 'w2w', teamId: TEAM_A, peerTeamId: TEAM_B })).toEqual({
      kind: 'w2w',
      teamId: TEAM_A,
      peerTeamId: TEAM_B,
    });
  });

  it('sends the shared OAuth 2.1 Bearer token and explicit scope to Shiva /agent-tools/catalog and /execute', async () => {
    const calls: Array<{ url: string; method: string; auth: string | null; body: string | null }> =
      [];
    const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        auth: headers.get('Authorization'),
        body: typeof init?.body === 'string' ? init.body : null,
      });
      return Response.json({ ok: true, content: [{ type: 'text', text: '{"staged":true}' }] });
    }) as unknown as typeof fetch;

    const client = new BufiAgentClient({
      agentToolsUrl: 'https://shiva-dev.bu.finance/agent-tools',
      accessToken: 'oauth-jwt-bufi-mcp-agent',
      scope: { kind: 'team', teamId: TEAM_A },
      fetchFn: fakeFetch,
    });

    await client.getCatalog();
    await client.callTool('reimbursement.preview_payment_run', { chain: 'ARC-TESTNET' });

    expect(calls[0]).toEqual({
      url: `https://shiva-dev.bu.finance/agent-tools/catalog?scope=team&teamId=${TEAM_A}`,
      method: 'GET',
      auth: 'Bearer oauth-jwt-bufi-mcp-agent',
      body: null,
    });
    expect(calls[1]).toEqual({
      url: `https://shiva-dev.bu.finance/agent-tools/execute?scope=team&teamId=${TEAM_A}`,
      method: 'POST',
      auth: 'Bearer oauth-jwt-bufi-mcp-agent',
      body: JSON.stringify({
        kind: 'tool',
        name: 'reimbursement.preview_payment_run',
        input: { chain: 'ARC-TESTNET' },
      }),
    });
  });
});
