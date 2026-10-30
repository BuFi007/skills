import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  CATALOG_REPO,
  CATALOG_TREE_URL,
  type CatalogSkill,
  FAMILY_ENTRY,
  fetchCatalogTree,
  isSkillFile,
  LEGACY_CATALOG_REPOS,
  parseCatalogTree,
  SKILL_FAMILIES,
  type SkillFamily,
} from './skill-catalog.ts';

const CHECK_TTL_MS = 20 * 60 * 60 * 1000;
const NOTICE_TTL_MS = 12 * 60 * 60 * 1000;
const RETRY_TTL_MS = 60 * 60 * 1000;
const LOCK_STALE_MS = 30 * 1000;
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHANGES_URL = `https://github.com/${CATALOG_REPO}/commits/main/`;
const SOURCES = new Set<string>([CATALOG_REPO, ...LEGACY_CATALOG_REPOS]);

export interface NoticeCache {
  installation?: string;
  checkedAt?: number;
  retryAt?: number;
  tree?: unknown;
  baseline?: string[];
  pendingAdditions?: string[];
  lastShownAt?: number;
}

export interface SkillUpdateNoticeOptions {
  home?: string;
  now?: Date;
  catalogTreeUrl?: string;
  stderr?: Pick<NodeJS.WriteStream, 'write' | 'isTTY'>;
}

type InstalledFiles = Record<string, string[]>;

export function gitBlobHash(content: Buffer): string {
  return createHash('sha1')
    .update(`blob ${content.length}\0`)
    .update(content)
    .digest('hex');
}

async function readJson(file: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return undefined;
  }
}

export async function readInstalledSkills(
  home: string
): Promise<Record<string, { source?: string } | null>> {
  const paths = [path.join(home, '.agents', '.skill-lock.json')];
  if (process.env.XDG_STATE_HOME) {
    paths.push(path.join(process.env.XDG_STATE_HOME, 'skills', '.skill-lock.json'));
  }
  const skills: Record<string, { source?: string } | null> = {};
  for (const file of paths) {
    const lock = (await readJson(file)) as { skills?: typeof skills } | undefined;
    if (lock?.skills && typeof lock.skills === 'object' && !Array.isArray(lock.skills)) {
      Object.assign(skills, lock.skills);
    }
  }
  return skills;
}

function cachePathFor(home: string): string {
  return path.join(home, '.bufi', 'skill-update-check.json');
}

async function acquireLock(file: string): Promise<(() => Promise<void>) | undefined> {
  const lockPath = `${file}.lock`;
  const release = () => fs.rm(lockPath, { recursive: true, force: true });
  try {
    await fs.mkdir(lockPath);
    return release;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  const stat = await fs.stat(lockPath).catch(() => undefined);
  if (!stat || Date.now() - stat.mtimeMs < LOCK_STALE_MS) return undefined;
  await fs.rm(lockPath, { recursive: true, force: true });
  await fs.mkdir(lockPath);
  return release;
}

async function installedFiles(directory: string): Promise<InstalledFiles> {
  const files: InstalledFiles = {};
  async function walk(relative: string): Promise<void> {
    for (const entry of await fs.readdir(path.join(directory, relative), {
      withFileTypes: true,
    })) {
      const file = relative ? `${relative}/${entry.name}` : entry.name;
      if (!isSkillFile(file)) continue;
      if (entry.isDirectory()) {
        await walk(file);
      } else if (entry.isFile()) {
        const content = await fs.readFile(path.join(directory, file));
        files[file] = [gitBlobHash(content)];
        if (!content.includes(0) && content.includes('\r\n')) {
          files[file].push(
            gitBlobHash(Buffer.from(content.toString('utf8').replace(/\r\n/g, '\n')))
          );
        }
      }
    }
  }
  await walk('');
  return files;
}

export function sameSkillFiles(local: InstalledFiles, remote: Record<string, string>): boolean {
  return (
    Object.keys(local).length === Object.keys(remote).length &&
    Object.entries(remote).every(([file, hash]) => local[file]?.includes(hash))
  );
}

export function formatUpdateBox(lines: string[]): string {
  const width = Math.max(...lines.map(l => l.length), 42);
  const top = `╭─${'─'.repeat(width)}─╮`;
  const bottom = `╰─${'─'.repeat(width)}─╯`;
  const body = lines.map(line => `│ ${line.padEnd(width, ' ')} │`);
  return [top, ...body, bottom].join('\n');
}

export async function maybeShowSkillUpdateNotice(
  options: SkillUpdateNoticeOptions = {}
): Promise<CatalogSkill[]> {
  const stderr = options.stderr ?? process.stderr;
  if (!stderr.isTTY || ['1', 'true'].includes(process.env.BUFI_NO_UPDATE_CHECK ?? '')) {
    return [];
  }

  let releaseLock: (() => Promise<void>) | undefined;
  try {
    const home = options.home ?? os.homedir();
    const skills = await readInstalledSkills(home);
    const installed = new Map<string, InstalledFiles>();
    for (const [name, entry] of Object.entries(skills)) {
      if (!SKILL_NAME_RE.test(name) || !entry || !SOURCES.has(entry.source ?? '')) continue;
      try {
        const files = await installedFiles(path.join(home, '.agents', 'skills', name));
        if (Object.hasOwn(files, 'SKILL.md')) installed.set(name, files);
      } catch {
        // Ignore removed or unreadable skill directories.
      }
    }
    if (!installed.size) return [];

    const now = (options.now ?? new Date()).getTime();
    const cachePath = cachePathFor(home);
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    releaseLock = await acquireLock(cachePath);
    if (!releaseLock) return [];

    const rawCache = await readJson(cachePath);
    const cache: NoticeCache =
      rawCache && typeof rawCache === 'object' && !Array.isArray(rawCache)
        ? (rawCache as NoticeCache)
        : {};

    let catalog: CatalogSkill[] | undefined;
    try {
      catalog = parseCatalogTree(cache.tree);
    } catch {
      cache.checkedAt = undefined;
    }

    if (
      (!cache.checkedAt || now - cache.checkedAt > CHECK_TTL_MS) &&
      (!cache.retryAt || now >= cache.retryAt)
    ) {
      try {
        const tree = await fetchCatalogTree(options.catalogTreeUrl ?? CATALOG_TREE_URL, 1500);
        catalog = parseCatalogTree(tree);
        cache.tree = tree;
        cache.checkedAt = now;
        delete cache.retryAt;
      } catch {
        cache.retryAt = now + RETRY_TTL_MS;
      }
    }

    const previousNames = new Set(Array.isArray(cache.baseline) ? cache.baseline : []);
    const changes = (catalog ?? []).filter(skill => {
      const local = installed.get(skill.name);
      return local
        ? !sameSkillFiles(local, skill.files)
        : !previousNames.has(skill.name) && installed.has(FAMILY_ENTRY[skill.family]);
    });

    if (catalog) {
      cache.baseline = [
        ...new Set([...previousNames, ...catalog.map(skill => skill.name)]),
      ].sort();
    }

    if (changes.length && (!cache.lastShownAt || now - cache.lastShownAt > NOTICE_TTL_MS)) {
      const lines = ['✨ BUFI Skill updates available!'];
      for (const family of SKILL_FAMILIES) {
        if (!changes.some(s => s.family === family)) continue;
        lines.push(`Run: bufi skills install --collection ${family}`);
      }
      lines.push(`Or:  npx skills add ${CATALOG_REPO}`);
      lines.push('', `Changelog: ${CHANGES_URL}`);
      stderr.write(`${formatUpdateBox(lines)}\n\n`);
      cache.lastShownAt = now;
    }

    const temp = `${cachePath}.${process.pid}.tmp`;
    await fs.writeFile(temp, `${JSON.stringify(cache)}\n`, 'utf8');
    await fs.rename(temp, cachePath);
    return changes;
  } catch {
    return [];
  } finally {
    await releaseLock?.().catch(() => {});
  }
}
