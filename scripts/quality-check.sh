#!/usr/bin/env bash
# Quality check script for bufi/skills (BuFi007/skills)
# Modeled after actionbook/rust-skills quality-check.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ERRORS=0
WARNINGS=0

echo "=== BUFI Skills Quality Check (bufi/skills) ==="
echo ""

# 1. Check SKILL.md files and YAML frontmatter
echo "1. Checking SKILL.md files across collections..."
SKILL_COUNT=0
for skill_md in skills/*/*/SKILL.md; do
  if [ ! -f "$skill_md" ]; then
    continue
  fi
  SKILL_COUNT=$((SKILL_COUNT + 1))
  skill_dir="$(dirname "$skill_md")"
  skill_name="$(basename "$skill_dir")"
  collection_name="$(basename "$(dirname "$skill_dir")")"

  first_line="$(head -n 1 "$skill_md")"
  if [ "$first_line" != "---" ]; then
    echo "  ERROR: Missing YAML frontmatter in $skill_md"
    ERRORS=$((ERRORS + 1))
  fi

  fm_name="$(awk '/^---$/{c++; next} c==1 && /^name:/{sub(/^name:[[:space:]]*/, ""); print; exit}' "$skill_md")"
  fm_desc="$(awk '/^---$/{c++; next} c==1 && /^description:/{sub(/^description:[[:space:]]*/, ""); print; exit}' "$skill_md")"

  if [ "$fm_name" != "$skill_name" ]; then
    echo "  ERROR: Frontmatter name '$fm_name' does not match folder '$skill_name' in $skill_md"
    ERRORS=$((ERRORS + 1))
  fi

  if [ -z "$fm_desc" ]; then
    echo "  ERROR: Missing description in frontmatter of $skill_md"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "   Verified $SKILL_COUNT skills across collections."

if [ "$SKILL_COUNT" -lt 20 ]; then
  echo "  ERROR: Expected at least 20 skills, found $SKILL_COUNT"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check collection README files
echo ""
echo "2. Checking collection README.md files..."
for collection_dir in skills/*/; do
  if [ ! -f "${collection_dir}README.md" ]; then
    echo "  ERROR: Missing README.md in $collection_dir"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "   All collection README.md files present."

# 3. Check version consistency
echo ""
echo "3. Checking version consistency..."
VERSION_FILE="$(tr -d '[:space:]' < VERSION)"
PKG_VERSION="$(bun -e 'import pkg from "./package.json"; console.log(pkg.version)')"
META_VERSION="$(bun -e 'import m from "./metadata.json"; console.log(m.version)')"
CLAUDE_VERSION="$(bun -e 'import p from "./.claude-plugin/plugin.json"; console.log(p.version)')"
CODEX_VERSION="$(bun -e 'import p from "./.codex-plugin/plugin.json"; console.log(p.version)')"
CURSOR_VERSION="$(bun -e 'import p from "./.cursor-plugin/plugin.json"; console.log(p.version)')"

for pair in "package.json:$PKG_VERSION" "metadata.json:$META_VERSION" ".claude-plugin/plugin.json:$CLAUDE_VERSION" ".codex-plugin/plugin.json:$CODEX_VERSION" ".cursor-plugin/plugin.json:$CURSOR_VERSION"; do
  label="${pair%%:*}"
  val="${pair#*:}"
  if [ "$val" != "$VERSION_FILE" ]; then
    echo "  ERROR: Version mismatch in $label ($val != $VERSION_FILE)"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "   Version $VERSION_FILE matches across VERSION, package.json, metadata.json, and plugin manifests."

# 4. Verify .claude-plugin/plugin.json skill paths exist
echo ""
echo "4. Checking .claude-plugin/plugin.json skill paths..."
MISSING_PATHS="$(bun -e '
import fs from "node:fs";
import plugin from "./.claude-plugin/plugin.json";
let missing = 0;
for (const rel of plugin.skills) {
  if (!fs.existsSync(`${rel}/SKILL.md`)) {
    console.error(`  ERROR: Missing ${rel}/SKILL.md referenced in .claude-plugin/plugin.json`);
    missing++;
  }
}
console.log(missing);
')"
if [ "$MISSING_PATHS" != "0" ]; then
  ERRORS=$((ERRORS + MISSING_PATHS))
fi
echo "   All skill paths in .claude-plugin/plugin.json resolve to valid SKILL.md files."

echo ""
echo "=== Summary ==="
echo "Total skills: $SKILL_COUNT"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "FAILED: Fix $ERRORS error(s) above."
  exit 1
fi

echo ""
echo "PASSED: All quality checks succeeded!"
