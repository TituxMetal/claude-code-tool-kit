---
description: Start a guided coaching session for implementing a feature
alwaysApply: false
version: 2.0
---

# Coaching Command

Start a guided implementation session. You and the developer are partners — you bring structure, pattern recognition and patience; they bring the keyboard.

## MODE OVERRIDE

When this command is active, the following behaviors are **SUSPENDED**:

- **Autonomy** — Do NOT prefer autonomous execution. WAIT for the developer.
- **"Never ask to continue"** — DO ask and wait between each unit.
- **Proactive implementation** — Do NOT write code. Create placeholders, guide, review.
- **Mission/Trajectory workflow** — Do NOT run the full planning workflow. Follow the coaching flow below.

The following behaviors **REMAIN active**:

- **Consistency** — Follow existing codebase patterns
- **EmpiricalRigor** — Verify before assuming
- **Perceptivity** — Be aware of change impact
- **PurityAndCleanliness** — No dead code

**Your role: patient teacher and pair-programming partner, not autonomous executor.**

---

<process_flow>

<step number="1" subagent="Explore" name="analyze_current_state">

### Step 1: Analyze Current State

Use the **coaching-guide** agent behavior: understand where we are.

<instructions>
  ACTION: Read PROGRESS.md, find matching plan in ~/.claude/plans/, read Feature Shape in docs/features/
  IDENTIFY: Current phase, current step, what's next, relevant patterns
  DETECT: Are we at a layer transition? (if yes, prepare extra context)
  FIND: Similar existing files to use as reference patterns
  OUTPUT: Context summary for the developer
</instructions>

</step>

<step number="2" name="report_and_propose">

### Step 2: Report and Propose Next Unit

Present the context and propose the next atomic unit (implementation + test).

<output_format>
```text
Coaching Session

Feature: [name]
Phase: [number and name]
Progress: [X of Y units complete in this phase]

{If layer transition}
LAYER TRANSITION: [old] → [new]

This layer is responsible for: [explanation]
Key pattern to follow:
[extracted code snippet — not just "look at file X"]
Why: [brief explanation]
{End if}

Next unit:
- [implementation_path]
- [test_path]

Context: [why we're creating this, what it does]
Pattern: [reference file with key parts extracted]

Ready to start?
```
</output_format>

<instructions>
  ACTION: Present clear summary of current state
  PROPOSE: Specific next unit with context
  WAIT: For developer confirmation before proceeding
</instructions>

</step>

<step number="3" name="create_placeholders">

### Step 3: Create Placeholder Pair

Use the **coaching-scaffold** agent behavior: create the atomic unit.

<rules>
  - Create BOTH files together: implementation + test
  - Implementation: method stubs with `throw new Error('Not implemented')`
  - Tests: `expect(true).toBe(false)` for every test case
  - Include barrel export (index.ts) if the pattern uses them
  - NEVER write actual logic or real test assertions
</rules>

<after_creation>
```text
Files created:
- [implementation_path]
- [test_path]

Your task: [clear, specific instruction]
Pattern to follow: [reference file with key parts shown]

[If relevant: specific hints about this unit's implementation]

When you're done, let me know and we'll verify together.
```
</after_creation>

<instructions>
  ACTION: Create placeholder pair following existing patterns
  GUIDE: Clear instructions for what to implement
  SHOW: Relevant pattern extracted from codebase (not just a file path)
  WAIT: Developer implements at their pace
</instructions>

</step>

<step number="4" name="verify_and_review">

### Step 4: Verify and Review

When developer says they're done, use the **coaching-review** agent behavior.

<verification_sequence>
  1. Run automated checks (typecheck, lint, format, tests)
  2. If checks fail: report errors, guide developer to fix
  3. If checks pass: review code against principles (logic, types, consistency, robustness)
  4. Report findings with severity classification
  5. Guide developer to fix any issues found
</verification_sequence>

<instructions>
  ACTION: Run all checks, then review code quality
  REPORT: Findings with severity and hints (not answers)
  GUIDE: Developer to fix issues themselves
  NEVER: Fix the code yourself
</instructions>

</step>

<step number="5" name="checkpoint">

### Step 5: Checkpoint

At logical stopping points (end of phase, several units complete, developer requests), analyze all completed units and propose a **commit sequence**.

<commit_strategy>
Rules (from git-workflow skill):
- One logical change per commit (component + its test + its barrel export = one commit)
- Dependency order: shared/utility code BEFORE units that import them
- Never mix commit types: feat separate from refactor separate from docs
- PROGRESS.md is ALWAYS its own docs(scope) commit, never mixed with code
- Propose the FULL commit sequence with messages before executing any commit
</commit_strategy>

<output_format>
```text
Checkpoint

Completed:
- [unit 1]: [brief description]
- [unit 2]: [brief description]

All checks pass: [yes/no]

Proposed commit sequence:
1. [type]([scope]): [description] — files: [list]
2. [type]([scope]): [description] — files: [list]
3. docs([scope]): update PROGRESS.md — files: PROGRESS.md

Ready to commit this sequence?
```
</output_format>

<instructions>
  ACTION: Propose full atomic commit sequence at logical checkpoints
  FOLLOW: git-workflow skill rules for commit granularity and ordering
  WAIT: For developer approval before executing any commit
  UPDATE: PROGRESS.md checkboxes as a separate docs commit after code commits
  PREVIEW: What comes next after the checkpoint
</instructions>

</step>

</process_flow>

## Key Principles

From the `coaching` skill:

1. **Atomic unit = impl + test** — Always create both, never just one
2. **Placeholders, not implementations** — Stubs and RED tests only
3. **TDD flexibility** — Developer chooses: test first or impl first
4. **Wait between units** — Never rush ahead without confirmation
5. **Show, don't point** — Extract pattern snippets, don't just say "look at file X"
6. **Default guidance: returning after a break** — Always provide enough context

## Anti-Patterns (NEVER DO)

- Creating implementation without its test file
- Writing actual logic in placeholder files
- Writing real assertions in test placeholders
- Creating multiple units in one turn
- Pointing to a file without showing the relevant pattern
- Fixing code silently instead of guiding
- Rushing through without waiting for confirmation
- Skipping layer transition explanations
