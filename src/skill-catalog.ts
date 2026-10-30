import fs from 'node:fs';
import path from 'node:path';

export const SKILL_FAMILIES = [
  'agentic_collaboration',
  'personal_finance',
  'team_treasury',
  'agent_commerce_x402',
] as const;

export type SkillFamily = (typeof SKILL_FAMILIES)[number];

export interface CatalogSkill {
  name: string;
  family: SkillFamily;
  files: Record<string, string>;
}

export const CATALOG_REPO = 'BuFi007/skills';
export const LEGACY_CATALOG_REPOS = ['BuFi007/agentic-collaboration', 'bufi/skills'] as const;
export const CATALOG_TREE_URL = `https://api.github.com/repos/${CATALOG_REPO}/git/trees/main?recursive=1`;

export const FAMILY_ENTRY: Record<SkillFamily, string> = {
  agentic_collaboration: 'bufi-router',
  personal_finance: 'personal-wallet-transfers',
  team_treasury: 'treasury-proposals',
  agent_commerce_x402: 'agent-wallet-x402',
};

export function isSkillFamily(value: string): value is SkillFamily {
  return (SKILL_FAMILIES as readonly string[]).includes(value);
}

/** Match the files installed by the native skill installer. */
export function isSkillFile(file: string): boolean {
  return file
    .split('/')
    .every(
      part =>
        part.length > 0 &&
        !part.startsWith('.') &&
        part !== 'metadata.json' &&
        part !== '__pycache__' &&
        !part.includes('\\')
    );
}

const CATALOG_PATH_RE =
  /^skills\/(agentic_collaboration|personal_finance|team_treasury|agent_commerce_x402)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(.+)$/;

/** Parse a complete GitHub Git tree into multi-collection CatalogSkill entries. */
export function parseCatalogTree(value: unknown): CatalogSkill[] {
  const data = value as { truncated?: boolean; tree?: unknown[] } | null;
  if (!data || data.truncated !== false || !Array.isArray(data.tree)) {
    throw new Error('The BUFI skill catalog returned an incomplete tree.');
  }
  const skills = new Map<string, CatalogSkill>();
  for (const entry of data.tree) {
    const file = entry as { path?: string; type?: string; sha?: string };
    if (!file || file.type !== 'blob' || typeof file.path !== 'string') continue;
    const match = file.path.match(CATALOG_PATH_RE);
    if (!match || !isSkillFile(match[3]!)) continue;
    if (typeof file.sha !== 'string' || !/^[a-f0-9]{40}$/.test(file.sha)) {
      throw new Error('The BUFI skill catalog returned an invalid file hash.');
    }
    const [, family, name, relativePath] = match;
    const key = `${family}/${name}`;
    const skill = skills.get(key) ?? {
      name: name!,
      family: family as SkillFamily,
      files: {},
    };
    skill.files[relativePath!] = file.sha;
    skills.set(key, skill);
  }
  const result = [...skills.values()]
    .filter(skill => Object.hasOwn(skill.files, 'SKILL.md'))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!result.length || new Set(result.map(skill => skill.name)).size !== result.length) {
    throw new Error('The BUFI skill catalog returned missing or duplicate skills.');
  }
  return result;
}

export async function fetchCatalogTree(
  url = CATALOG_TREE_URL,
  timeoutMs = 5000
): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(
      `Could not read the BUFI skill catalog (HTTP ${response.status}). Retry later.`
    );
  }
  return response.json();
}

export async function getCatalogSkills(url = CATALOG_TREE_URL): Promise<CatalogSkill[]> {
  return parseCatalogTree(await fetchCatalogTree(url));
}

/** Discover skills directly from a local `skills/<family>/<name>/SKILL.md` checkout. */
export function discoverLocalCatalogSkills(rootDir: string): Array<{
  name: string;
  family: SkillFamily;
  description: string;
  skillPath: string;
}> {
  const results: Array<{
    name: string;
    family: SkillFamily;
    description: string;
    skillPath: string;
  }> = [];
  const skillsRoot = path.join(rootDir, 'skills');
  if (!fs.existsSync(skillsRoot)) return results;

  for (const family of SKILL_FAMILIES) {
    const familyDir = path.join(skillsRoot, family);
    if (!fs.existsSync(familyDir)) continue;
    for (const entry of fs.readdirSync(familyDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const skillMd = path.join(familyDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      const raw = fs.readFileSync(skillMd, 'utf8');
      const nameMatch = raw.match(/^name:\s*(.+)$/m);
      const descMatch = raw.match(/^description:\s*(?:>-\s*\n((?:  .+\n?)+)|(.+))$/m);
      const name = (nameMatch?.[1] ?? entry.name).trim();
      const description = (descMatch?.[1] ?? descMatch?.[2] ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      results.push({
        name,
        family,
        description,
        skillPath: path.relative(rootDir, skillMd).replace(/\\/g, '/'),
      });
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name));
}
