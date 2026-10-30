import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  CATALOG_REPO,
  isSkillFamily,
  SKILL_FAMILIES,
  type SkillFamily,
} from './skill-catalog.ts';

interface AgentConfig {
  name: string;
  globalSkillsDir: string;
  detectDir: string;
}

export interface NativeSkillsInstallOptions {
  collection?: SkillFamily;
  skills?: readonly string[];
  agent?: string;
  home?: string;
  sourceDir?: string;
  quiet?: boolean;
}

export interface NativeSkillsInstallResult {
  skillCount: number;
  installedSkills: string[];
  linkedAgents: string[];
}

const AGENTS: readonly AgentConfig[] = [
  { name: 'claude-code', globalSkillsDir: '.claude/skills', detectDir: '.claude' },
  { name: 'cursor', globalSkillsDir: '.cursor/skills', detectDir: '.cursor' },
  { name: 'windsurf', globalSkillsDir: '.codeium/windsurf/skills', detectDir: '.codeium/windsurf' },
  { name: 'codex', globalSkillsDir: '.codex/skills', detectDir: '.codex' },
  { name: 'gemini-cli', globalSkillsDir: '.gemini/skills', detectDir: '.gemini' },
  { name: 'github-copilot', globalSkillsDir: '.copilot/skills', detectDir: '.copilot' },
  { name: 'opencode', globalSkillsDir: '.config/opencode/skills', detectDir: '.config/opencode' },
  { name: 'openclaw', globalSkillsDir: '.openclaw/skills', detectDir: '.openclaw' },
  { name: 'openhands', globalSkillsDir: '.openhands/skills', detectDir: '.openhands' },
  { name: 'hermes-agent', globalSkillsDir: '.hermes/skills', detectDir: '.hermes' },
];

const CANONICAL_DIR = '.agents/skills';
const LOCK_FILE = '.agents/.skill-lock.json';

interface DiscoveredSkill {
  name: string;
  family: SkillFamily;
  srcDir: string;
  skillPath: string;
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') ||
      entry.name === 'metadata.json' ||
      entry.name === '__pycache__'
    ) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function hashDir(dir: string): string {
  const hash = createHash('sha1');
  function walk(d: string): void {
    for (const entry of fs
      .readdirSync(d, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) continue;
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else {
        hash.update(entry.name);
        hash.update(fs.readFileSync(p));
      }
    }
  }
  walk(dir);
  return hash.digest('hex');
}

function discoverMultiCollectionSkills(repoRoot: string): DiscoveredSkill[] {
  const skillsRoot = path.join(repoRoot, 'skills');
  const results: DiscoveredSkill[] = [];
  for (const family of SKILL_FAMILIES) {
    const familyDir = path.join(skillsRoot, family);
    if (!fs.existsSync(familyDir)) continue;
    for (const entry of fs.readdirSync(familyDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const skillMd = path.join(familyDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      results.push({
        name: entry.name,
        family,
        srcDir: path.join(familyDir, entry.name),
        skillPath: path.relative(repoRoot, skillMd).replace(/\\/g, '/'),
      });
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export async function installSkillsNative(
  repo: string = CATALOG_REPO,
  options: NativeSkillsInstallOptions = {}
): Promise<NativeSkillsInstallResult> {
  const home = options.home ?? os.homedir();
  const canonicalBase = path.join(home, CANONICAL_DIR);
  const lockFilePath = path.join(home, LOCK_FILE);
  const repoUrl = `https://github.com/${repo}.git`;

  let cleanupTmp: string | null = null;
  let rootDir = options.sourceDir;
  if (!rootDir) {
    cleanupTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bufi-skills-'));
    execSync(`git clone --depth 1 "${repoUrl}" "${cleanupTmp}"`, { stdio: 'pipe' });
    rootDir = cleanupTmp;
  }

  try {
    let skills = discoverMultiCollectionSkills(rootDir);
    if (options.collection) {
      if (!isSkillFamily(options.collection)) {
        throw new Error(`Unknown skill collection: ${options.collection}`);
      }
      skills = skills.filter(s => s.family === options.collection);
    }
    if (options.skills && options.skills.length > 0) {
      const wanted = new Set(options.skills);
      skills = skills.filter(s => wanted.has(s.name));
    }
    if (skills.length === 0) {
      throw new Error('No matching skills found in catalog.');
    }

    fs.mkdirSync(canonicalBase, { recursive: true });
    for (const skill of skills) {
      const destDir = path.join(canonicalBase, skill.name);
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
      copyDir(skill.srcDir, destDir);
    }

    const detectedAgents = options.agent
      ? [
          AGENTS.find(a => a.name === options.agent) ?? {
            name: options.agent,
            globalSkillsDir: `.${options.agent}/skills`,
            detectDir: `.${options.agent}`,
          },
        ]
      : AGENTS.filter(a => {
          try {
            return fs.statSync(path.join(home, a.detectDir)).isDirectory();
          } catch {
            return false;
          }
        });

    const linkedAgents: string[] = [];
    for (const agent of detectedAgents) {
      const agentSkillsDir = path.join(home, agent.globalSkillsDir);
      fs.mkdirSync(agentSkillsDir, { recursive: true });
      for (const skill of skills) {
        const linkPath = path.join(agentSkillsDir, skill.name);
        const canonicalPath = path.join(canonicalBase, skill.name);
        try {
          fs.rmSync(linkPath, { recursive: true, force: true });
        } catch {
          // ignore
        }
        const relTarget = path.relative(agentSkillsDir, canonicalPath);
        try {
          fs.symlinkSync(relTarget, linkPath);
        } catch {
          copyDir(canonicalPath, linkPath);
        }
      }
      linkedAgents.push(agent.name);
    }

    let lock: {
      version: number;
      skills: Record<string, Record<string, string>>;
    } = { version: 3, skills: {} };
    try {
      if (fs.existsSync(lockFilePath)) {
        lock = JSON.parse(fs.readFileSync(lockFilePath, 'utf8'));
      }
    } catch {
      lock = { version: 3, skills: {} };
    }

    const now = new Date().toISOString();
    for (const skill of skills) {
      const destDir = path.join(canonicalBase, skill.name);
      lock.skills[skill.name] = {
        source: repo,
        sourceType: 'github',
        sourceUrl: repoUrl,
        skillPath: skill.skillPath,
        skillFolderHash: hashDir(destDir),
        installedAt: lock.skills[skill.name]?.installedAt ?? now,
        updatedAt: now,
      };
    }
    fs.mkdirSync(path.dirname(lockFilePath), { recursive: true });
    fs.writeFileSync(lockFilePath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');

    return {
      skillCount: skills.length,
      installedSkills: skills.map(s => s.name),
      linkedAgents,
    };
  } finally {
    if (cleanupTmp) {
      fs.rmSync(cleanupTmp, { recursive: true, force: true });
    }
  }
}
