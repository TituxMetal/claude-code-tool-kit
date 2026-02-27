---
description: Post-implementation shipping pipeline — scans conventions, plans commits, verifies checks, updates progress, then executes on approval
alwaysApply: false
version: 1.0
---

# Ship Command

Post-implementation shipping pipeline. Automates the entire flow from code review through PR creation: convention scanning, commit planning, test verification, progress tracking — all in parallel, with a single approval gate before execution.

## MODE OVERRIDE

When this command is active, the following behaviors are **SUSPENDED**:

- **"Never ask to continue"** — DO present the ship approval prompt and WAIT for user confirmation.
- **Mission/Trajectory workflow** — Do NOT run the full planning workflow. Follow the ship pipeline below.

The following behaviors **REMAIN active**:

- **Consistency** — Follow existing codebase patterns
- **EmpiricalRigor** — Verify before assuming
- **Perceptivity** — Be aware of change impact
- **Autonomy** — Execute Phases 0-2 autonomously without asking

---

<process_flow>

<agent_usage>
- ship-scanner is **spawned as a subagent** via the Task tool (Phase 1 — convention scanning)
- ship-planner is **spawned as a subagent** via the Task tool (Phase 1 — commit planning)
- ship-verifier is **spawned as a subagent** via the Task tool (Phase 1 — test verification)
- ship-progress is **spawned as a subagent** via the Task tool (Phase 1 — progress tracking)
- Steps with subagent="X" spawn that agent via the Task tool
- All 4 sub-agents are spawned **simultaneously** in Phase 1
</agent_usage>

<pipeline>

### The 4-Phase Pipeline

Every ship invocation flows through this pipeline:

```text
Phase 0: PRE-FLIGHT ──→ detect context (no sub-agent)
                         ↓ pre-flight context block
Phase 1: ANALYSIS ────→ spawn 4 sub-agents simultaneously
                         ↓ collected results
Phase 2: COORDINATION → apply gates, build approval prompt
                         ↓ user approves
Phase 3: EXECUTION ───→ commits, push, PR
                         ↓ PR URL
```

</pipeline>

<phase number="0" name="pre_flight">

### Phase 0: Pre-flight

Build context and validate prerequisites. No sub-agents — the command itself handles this.

<instructions>
  1. Run `git branch --show-current` to detect the current branch
  2. GATE: If on `main` or `develop` → ABORT with "Create a feature/fix branch first"
  3. GATE: If detached HEAD (empty branch name) → ABORT with "Checkout a branch first"
  4. Run `git status --porcelain` to detect changes and merge conflicts
  5. GATE: If no changes (clean status) → ABORT with "Nothing to ship"
  6. GATE: If merge conflicts detected (UU prefix) → ABORT with "Resolve merge conflicts first"
  7. Run `git diff --stat` to get changed file summary
  8. Run `git diff --name-only HEAD` combined with `git ls-files --others --exclude-standard` for full file list
  9. Infer target base branch: `feature/*` or `fix/*` → `develop`, other → `develop`
  10. Check if `apps/` directory exists → set MONOREPO flag
  11. If monorepo: list app directories under `apps/`
  12. Build the PRE-FLIGHT CONTEXT block (see output format below)
</instructions>

<output_format>
```text
=== PRE-FLIGHT CONTEXT ===

BRANCH: {current branch name}
TARGET: {target base branch}
MONOREPO: {true | false}
APPS: {comma-separated app names, or "N/A" if not monorepo}

CHANGED FILES:
  {file path} ({status: added/modified/deleted})
  {file path} ({status: added/modified/deleted})
  ...

DIFF STAT:
  {git diff --stat output}

=== END PRE-FLIGHT CONTEXT ===
```
</output_format>

</phase>

<phase number="1" subagent="ship-scanner,ship-planner,ship-verifier,ship-progress" name="parallel_analysis">

### Phase 1: Parallel Analysis

Spawn all 4 sub-agents simultaneously to analyze the codebase.

<instructions>
  SPAWN: 4 sub-agents via the Task tool — ALL simultaneously in a single message with 4 parallel Task tool calls
  EACH AGENT RECEIVES: The complete PRE-FLIGHT CONTEXT block from Phase 0

  Sub-agents to spawn:
  1. ship-scanner → convention scanning
  2. ship-planner → commit planning
  3. ship-verifier → test verification
  4. ship-progress → progress tracking

  COLLECT: All 4 results before proceeding to Phase 2
</instructions>

</phase>

<phase number="2" name="coordination">

### Phase 2: Coordination

Collect results, apply gates, and present the approval prompt.

<instructions>
  1. Parse results from all 4 sub-agents

  2. Apply BLOCKING gates (any block → abort):
     - ship-verifier STATUS: FAIL → output SHIP BLOCKED with failure details, STOP
     - ship-scanner STATUS: BLOCKER → output SHIP BLOCKED with violation details, STOP

  3. Apply INFORMATIONAL gates:
     - ship-scanner STATUS: WARN → include warnings in approval prompt
     - ship-progress STATUS: NOT_FOUND → omit progress section from summary

  3.5. If ship-progress STATUS: FOUND and proposed updates exist:
       a. Apply the proposed checkbox changes to docs/PROGRESS.md NOW (edit the file in the working tree)
       b. Verify ship-planner's commit plan includes a final docs() commit for PROGRESS.md
       c. If ship-planner did NOT include a PROGRESS.md commit, append one to the plan:
          `docs({scope}): update PROGRESS.md` with docs/PROGRESS.md as the only file

  4. Build SHIP SUMMARY (see output format below)
     - The commit plan MUST show FULL commit messages with file lists — not just type/scope and file counts
     - The user needs to review and approve the EXACT commits before any git command runs

  5. Present the summary and WAIT for user confirmation
     - User approves → proceed to Phase 3
     - User rejects → ABORT with "Ship cancelled"
</instructions>

<blocked_format>
```text
=== SHIP BLOCKED ===

{If verifier failed}
VERIFICATION FAILURES:
  {check results and failure details from ship-verifier}
{End if}

{If scanner blocked}
CONVENTION VIOLATIONS:
  {blocker details from ship-scanner}
{End if}

Fix the issues above and run /ship again.

=== END SHIP BLOCKED ===
```
</blocked_format>

<output_format>
```text
=== SHIP SUMMARY ===

Branch: {branch} → {target}

Verification: ALL PASS ✓

{If scanner warnings}
Convention Warnings:
  {warning details — not blocking, for awareness}
{End if}

{If scanner clean}
Conventions: PASS ✓
{End if}

Commit Plan ({N} commits):

  1. {type}({scope}): {description}
     - {filename}: {change description}
     - {filename}: {change description}
     Files: {path/to/file1}, {path/to/file2}

  2. {type}({scope}): {description}
     - {filename}: {change description}
     Files: {path/to/file1}

  ...

{If progress updates found}
Progress Updates:
  - [x] {item description}
  - [x] {item description}
{End if}

Ship? (y/N)

=== END SHIP SUMMARY ===
```
</output_format>

</phase>

<phase number="3" name="execution">

### Phase 3: Execution

On user approval, execute the shipping sequence.

<instructions>
  1. For each commit in ship-planner's sequence:
     a. Run `git add {files}` for this commit's files only
     b. Run `git commit` with the planner's message (use HEREDOC for multi-line messages)
     c. Verify commit succeeded before proceeding to next

  2. PROGRESS.md: Already updated in Phase 2 (step 3.5). The docs() commit is part of the
     commit plan — no additional file modification needed here. It will be committed as part
     of the sequence above.

  3. Push to remote:
     a. Run `git push -u origin {branch}`

  4. Handle PR:
     a. Run `gh pr list --head {branch} --json url --jq '.[0].url'`
     b. If PR exists: output the existing PR URL (push already updated it)
     c. If no PR: create one with `gh pr create --base {target} --assignee @me`
        - Title: derived from the primary commit type and scope
        - Body: summary of all commits in the plan

  5. Output the final PR URL
</instructions>

</phase>

<error_handling>

### Error Handling

| Scenario | Phase | Action |
|----------|-------|--------|
| No changes | 0 | Abort: "Nothing to ship" |
| On main/develop | 0 | Abort: "Create a feature/fix branch first" |
| Detached HEAD | 0 | Abort: "Checkout a branch first" |
| Merge conflicts | 0 | Abort: "Resolve merge conflicts first" |
| Test failures | 2 | Block: show failures, suggest fix + re-run `/ship` |
| Convention BLOCKER | 2 | Block: show violations, suggest fix + re-run `/ship` |
| Convention WARNING | 2 | Show in approval prompt, user decides |
| User rejects | 2 | Abort: "Ship cancelled" |
| PR already exists | 3 | Show existing PR URL — push already updated it |
| PROGRESS.md missing | 1 | Skip progress section in summary |
| Commit fails | 3 | Stop execution, report error, do NOT continue |
| Push fails | 3 | Report error, suggest checking remote access |

</error_handling>

</process_flow>

## Anti-Patterns (NEVER DO)

- Skipping Phase 0 gates — always validate before analysis
- Running sub-agents sequentially — all 4 must be parallel
- Proceeding past a BLOCKED gate — always stop and report
- Committing without user approval — always wait for confirmation
- Using `cd` for monorepo — always use `--cwd`
- Adding AI attribution to commits — never, per git-workflow skill
- Modifying files during analysis phases — only Phase 3 modifies
- Creating a PR without `--assignee @me`
