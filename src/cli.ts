#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BufiAgentClient, parseCliScope } from './agent-tools-client.ts';
import {
  CATALOG_REPO,
  discoverLocalCatalogSkills,
  isSkillFamily,
  SKILL_FAMILIES,
  type SkillFamily,
} from './skill-catalog.ts';
import { maybeShowSkillUpdateNotice } from './skill-update-notice.ts';
import { installSkillsNative } from './skills-native.ts';

function readFlag(args: readonly string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function printHelp(): void {
  console.log(`bufi — Thin TypeScript CLI & Multi-Collection Agent Skills Manager for BUFI Desk

Usage:
  bufi skills list [--collection <${SKILL_FAMILIES.join('|')}>]
  bufi skills install [--collection <family>] [--skill <name>] [--agent <harness>]
  bufi skills check-updates

  bufi catalog --scope <personal|team> [--team-id <uuid>]
  bufi call <tool-name> --scope <personal|team> [--team-id <uuid>] [--input '<json>']
  bufi resource <uri> --scope team --team-id <uuid>
  bufi prompt <name> --scope team --team-id <uuid> [--args '<json>']
  bufi collaborate <connect|message|propose-document|duet-read|duet-update> --scope <team|w2w> --team-id <uuid> [--peer-team-id <uuid>] [--payload '<json>']

Environment:
  BUFI_MCP_ACCESS_TOKEN    OAuth 2.1 Bearer token (role=bufi_mcp_agent), shared with BUFI MCP
  BUFI_AGENT_TOOLS_API     Shiva /agent-tools base URL (default: https://shiva-dev.bu.finance/agent-tools)
  BUFI_COLLABORATION_API   Desk collaboration endpoint (default: https://desk.bu.finance/api/collaboration/agent)
`);
}

export async function runCli(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return 0;
  }

  void maybeShowSkillUpdateNotice();

  const [cmd, sub] = argv;

  if (cmd === 'skills') {
    const action = sub ?? 'list';
    const collectionArg = readFlag(argv, '--collection');
    if (collectionArg && !isSkillFamily(collectionArg)) {
      console.error(`Unknown collection "${collectionArg}". Expected one of: ${SKILL_FAMILIES.join(', ')}`);
      return 1;
    }
    const collection = collectionArg as SkillFamily | undefined;

    if (action === 'list') {
      const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
      const local = discoverLocalCatalogSkills(repoRoot).filter(
        s => !collection || s.family === collection
      );
      console.log(JSON.stringify({ repository: CATALOG_REPO, count: local.length, skills: local }, null, 2));
      return 0;
    }

    if (action === 'install') {
      const skillFlag = readFlag(argv, '--skill');
      const agentFlag = readFlag(argv, '--agent');
      const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
      const result = await installSkillsNative(CATALOG_REPO, {
        collection,
        skills: skillFlag ? [skillFlag] : undefined,
        agent: agentFlag,
        sourceDir: repoRoot,
      });
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (action === 'check-updates') {
      const updates = await maybeShowSkillUpdateNotice({
        stderr: { isTTY: true, write: chunk => process.stderr.write(chunk) },
      });
      console.log(JSON.stringify({ updatesAvailable: updates.map(u => ({ name: u.name, family: u.family })) }, null, 2));
      return 0;
    }
  }

  const scope = parseCliScope({
    scope: readFlag(argv, '--scope'),
    teamId: readFlag(argv, '--team-id'),
    peerTeamId: readFlag(argv, '--peer-team-id'),
  });

  const accessToken = readFlag(argv, '--token') ?? process.env.BUFI_MCP_ACCESS_TOKEN ?? '';
  const agentToolsUrl =
    readFlag(argv, '--api-url') ??
    process.env.BUFI_AGENT_TOOLS_API ??
    'https://shiva-dev.bu.finance/agent-tools';
  const collaborationUrl =
    readFlag(argv, '--collaboration-url') ??
    process.env.BUFI_COLLABORATION_API ??
    'https://desk.bu.finance/api/collaboration/agent';

  const client = new BufiAgentClient({
    agentToolsUrl,
    collaborationUrl,
    accessToken,
    scope,
  });

  if (cmd === 'catalog') {
    const data = await client.getCatalog();
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  if (cmd === 'call') {
    if (!sub) throw new Error('Missing tool name: bufi call <tool-name> --scope ...');
    const rawInput = readFlag(argv, '--input') ?? '{}';
    const input = JSON.parse(rawInput) as Record<string, unknown>;
    const data = await client.callTool(sub, input);
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  if (cmd === 'resource') {
    if (!sub) throw new Error('Missing resource URI: bufi resource <uri> --scope ...');
    const data = await client.readResource(sub);
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  if (cmd === 'prompt') {
    if (!sub) throw new Error('Missing prompt name: bufi prompt <name> --scope ...');
    const rawArgs = readFlag(argv, '--args') ?? '{}';
    const promptArgs = JSON.parse(rawArgs) as Record<string, string>;
    const data = await client.getPrompt(sub, promptArgs);
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  if (cmd === 'collaborate') {
    if (!sub) throw new Error('Missing collaboration action: connect | message | propose-document | duet-read | duet-update');
    const rawPayload = readFlag(argv, '--payload') ?? '{}';
    const payload = JSON.parse(rawPayload) as Record<string, unknown>;
    const data = await client.collaborate({ action: sub.replace(/-/g, '_'), ...payload });
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  printHelp();
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().then(
    code => process.exit(code),
    err => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  );
}
