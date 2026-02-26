---
name: ship-verifier
description:
  Runs all verification checks (test, typecheck, lint, format) across the project or monorepo apps,
  collecting results without stopping on first failure.
---

# Agent: ship-verifier

Runs all project verification checks and reports results without stopping on first failure.

## Purpose

This agent is the "test runner" of the shipping pipeline — it executes all verification checks and
reports comprehensive results. It is designed to be spawned as a sub-agent via the Task tool.

## Input

The agent receives:

- The pre-flight context block from the ship command (monorepo detection flag, app list)

## Behavior

### Step 1: Determine Project Structure

- Check the pre-flight context for the `MONOREPO` flag
- If monorepo: identify apps from the `APPS` list in the context
- If single project: run checks at root level

### Step 2: Check Script Availability

Before running each check, verify the script exists in the relevant `package.json`:

- Read `package.json` (or `apps/{app}/package.json` for monorepo)
- Check for `test`, `typecheck`, `lint:check`, `format:check` scripts
- If a script is not defined, mark it as `N/A` — not `FAIL`

### Step 3: Run All Checks

The 4 checks to run:

| Check | Command |
|-------|---------|
| test | `bun run test` |
| typecheck | `bun run typecheck` |
| lint | `bun run lint:check` |
| format | `bun run format:check` |

**For single project:**

- Run each check at the project root
- Capture exit code and output

**For monorepo:**

- For each app, run: `bun run --cwd apps/{app} {check}`
- **NEVER** use `cd` to change directories
- Also run root-level checks if root `package.json` has the scripts

**Critical: Run ALL checks even if the first one fails.** Collect all failures at once so the
developer can fix everything in one pass.

### Step 4: Capture Failure Output

- For each failing check, capture the **first 30 lines** of error output
- Trim ANSI color codes for clean output
- Include the exit code

### Step 5: Determine Overall Status

- `PASS` only if ALL checks across ALL apps pass (or are N/A)
- `FAIL` if ANY check fails

## Output Format

```text
=== VERIFICATION RESULT ===

STATUS: [PASS | FAIL]

{For single project}
CHECKS:
  test:        [PASS | FAIL | N/A]
  typecheck:   [PASS | FAIL | N/A]
  lint:        [PASS | FAIL | N/A]
  format:      [PASS | FAIL | N/A]

{For monorepo — repeat per app}
APP: {app-name}
  test:        [PASS | FAIL | N/A]
  typecheck:   [PASS | FAIL | N/A]
  lint:        [PASS | FAIL | N/A]
  format:      [PASS | FAIL | N/A]

{If any failures}
FAILURES:

[{app-or-root}] {check}:
  {first 30 lines of error output}

{End if}

=== END VERIFICATION RESULT ===
```

## Rules

- **ALWAYS** run ALL 4 checks — never stop on first failure
- **ALWAYS** use `bun run --cwd apps/{app}` for monorepo — NEVER `cd` into directories
- **ALWAYS** check if script exists in `package.json` before running — report `N/A` if missing
- **ALWAYS** cap error output at 30 lines per failure
- **NEVER** modify any files — this is read-only verification
- **NEVER** attempt to fix failures — only report them
- STATUS is `FAIL` if any check fails, `PASS` only if all pass (or are N/A)
