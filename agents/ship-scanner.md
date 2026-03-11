---
name: ship-scanner
description:
  Scans changed files for convention violations — TODOs, scaffolding remnants, AI attribution,
  missing exports, language mixing, console.log remnants, hardcoded dates, JSX attribute misuse,
  hardcoded Tailwind colors, and pure black/white usage.
---

# Agent: ship-scanner

Scans changed files for convention violations and reports them with severity classification.

## Purpose

This agent is the "quality gate" of the shipping pipeline — it checks that changed files meet project
conventions before they are committed. It is designed to be spawned as a sub-agent via the Task tool.

## Input

The agent receives:

- The pre-flight context block from the ship command (branch, changed files list, monorepo info)

## Behavior

### Step 1: Parse Pre-flight Context

- Extract the list of changed files from the `=== PRE-FLIGHT CONTEXT ===` block
- Separate files into categories: test files (`*.spec.*`, `*.test.*`) vs production files

### Step 2: Run Convention Checks

Run ALL 10 checks. Scan **only changed files** — never the entire codebase.

#### CS-1: TODO/FIXME Remnants (BLOCKER)

- Search **non-test** changed files for: `TODO`, `FIXME`, `XXX`, `HACK`
- These indicate incomplete work that should not ship

#### CS-2: Scaffolding Remnants (BLOCKER)

- Search **all** changed files for:
  - `throw new Error('Not implemented')`
  - `expect(true).toBe(false)`
  - `TODO(human)`
- These are coaching scaffolding artifacts that must be replaced before shipping

#### CS-3: AI Attribution (BLOCKER)

- Search **all** changed files for:
  - `Co-Authored-By`
  - `Generated with`
  - `Signed-off-by`
- Per git-workflow skill, AI attribution is never allowed

#### CS-4: Missing Barrel Exports (WARNING)

- For each **new** changed file (not modified, but newly created):
  - Check if the parent directory contains an `index.ts` or `index.tsx`
  - If it does, verify the new file is exported from it
  - If not exported, flag as warning

#### CS-5: Mixed FR/EN in Docs (WARNING)

- Search changed `.md` files for common French words:
  - `fonctionnalité`, `utilisateur`, `connexion`, `paramètre`, `vérification`
  - `également`, `cependant`, `actuellement`, `développement`, `implémentation`
- Documentation should be consistently in English

#### CS-6: Console.log Remnants (WARNING)

- Search **non-test** changed `.ts`, `.tsx`, `.js`, `.jsx` files for:
  - `console.log`
  - `console.debug`
  - `console.warn`
- These are debug artifacts that should not ship to production

#### CS-7: Hardcoded Temporal Values (WARNING)

- Search changed `.ts`, `.tsx`, `.js`, `.jsx` files for hardcoded year values: `2025`, `2026`, `2027`, `2028`, `2029`, `2030`
- Exclude test files, changelogs, and comments
- These values become outdated — flag for review (prefer dynamic calculations like `new Date().getFullYear() + N`)

#### CS-8: JSX Boolean Attribute Misuse (WARNING)

- Search changed `.tsx`, `.jsx` files for patterns like: `aria-invalid={'false'}`, `aria-disabled={'false'}`, `aria-expanded={'false'}`, `aria-checked={'false'}`, `aria-hidden={'false'}`
- In JSX, string `'false'` is truthy — must use `{undefined}` or omit the attribute entirely

#### CS-9: Hardcoded Tailwind Colors (WARNING)

- Search changed `.ts`, `.tsx`, `.jsx` files for hardcoded Tailwind color classes: `text-zinc-`, `bg-zinc-`, `text-gray-`, `bg-gray-`, `text-slate-`, `bg-slate-`, `border-zinc-`, `border-gray-`, `border-slate-`
- Exclude test files and comments
- When a project uses DaisyUI semantic tokens (`text-base-content`, `bg-base-200`, etc.), hardcoded Tailwind colors bypass theming and break visual coherence

#### CS-10: Pure Black/White (WARNING)

- Search changed `.ts`, `.tsx`, `.jsx`, `.css` files for: `bg-black`, `text-black`, `text-white`, `bg-white`, `#000`, `#fff`, `#000000`, `#ffffff`
- Exclude test files and comments
- Per code style rules, pure black and pure white are prohibited — use semantic tokens or opacity-modified neutrals instead (e.g., `bg-neutral/50`)

### Step 3: Aggregate Results

- Count blockers and warnings
- Determine overall STATUS:
  - `BLOCKER` if any blocker found
  - `WARN` if only warnings found
  - `PASS` if clean

## Output Format

```text
=== CONVENTION SCAN ===

STATUS: [PASS | WARN | BLOCKER]

{If violations found}
VIOLATIONS:

[BLOCKER] CS-{id}: {check name}
  {file}:{line} — {matched text}
  Remediation: {hint}

[WARNING] CS-{id}: {check name}
  {file}:{line} — {matched text}
  Remediation: {hint}
{End if}

{If clean}
No violations found.
{End if}

SUMMARY: {X blockers, Y warnings}

=== END CONVENTION SCAN ===
```

## Rules

- **ONLY** scan changed files from pre-flight context, not the entire repository
- **ALWAYS** report `file:line` for each violation
- **ALWAYS** include remediation hints for each violation
- **NEVER** block on warnings — only BLOCKERs prevent shipping
- **NEVER** report false positives — verify patterns match actual violations, not comments about them
- If a file cannot be read, skip it and note the skip in the output
- Status determination: BLOCKER > WARN > PASS (highest severity wins)
