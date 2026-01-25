---
description: Start a guided coaching session for implementing a feature
alwaysApply: false
version: 1.0
---

# Coaching Command

Start a guided implementation session using the Learn By Doing methodology.

## Overview

This command loads the coaching skill, analyzes the current progress, and guides the developer through implementation step by step. The developer writes the code, you guide and review.

<process_flow>

<step number="1" subagent="Explore" name="analyze_current_state">

### Step 1: Analyze Current State

Understand where we are in the implementation.

<analysis_areas>
  <progress>
    - Read docs/PROGRESS.md
    - Identify current phase and step
    - What checkboxes are done vs pending?
  </progress>
  <plan>
    - Find the Implementation Plan in ~/.claude/plans/
    - Plans are named: {project-name}-{feature-number}-{feature-name}.md
    - Read the current phase details
    - Understand what needs to be built
  </plan>
  <feature_shape>
    - Read the Feature Shape in docs/features/
    - Understand the WHY behind the feature
  </feature_shape>
  <existing_code>
    - What similar code exists?
    - What patterns should we follow?
  </existing_code>
</analysis_areas>

<instructions>
  ACTION: Read PROGRESS.md, find matching plan, read Feature Shape
  IDENTIFY: Current step, what's next, relevant patterns
  OUTPUT: Context summary for Step 2
</instructions>

</step>

<step number="2" name="report_and_propose">

### Step 2: Report Findings and Propose Next Step

Present analysis to the user and propose the next action.

<output_format>
```text
📋 Coaching Session Analysis

Feature: [feature name]
Current Phase: [phase number and name]
Current Step: [specific step]

Progress:
✅ [completed items]
⏳ [current item]
⬜ [remaining items in phase]

Existing Patterns Found:
- [similar file 1]: [what it shows]
- [similar file 2]: [what it shows]

🎯 Next Step: [specific task]

Context: [why we're doing this]
Pattern to follow: [reference file]

Ready to start?
```
</output_format>

<instructions>
  ACTION: Present clear summary of current state
  PROPOSE: Specific next step with context
  WAIT: For user confirmation before proceeding
</instructions>

</step>

<step number="3" name="guide_implementation">

### Step 3: Guide Implementation

Follow the Learn By Doing methodology with placeholder files.

<file_creation_rules>
  <one_at_a_time>
    ALWAYS create ONE file at a time. Never create multiple files at once.
  </one_at_a_time>

  <implementation_files>
    Create placeholder structure:
    - Class/function signatures
    - Constructor with dependencies
    - Method stubs that throw "Not implemented"
    - Proper imports and types

    User fills in the actual logic.
  </implementation_files>

  <test_files>
    Create test structure for RED phase (TDD):
    - describe() blocks with correct grouping
    - it() blocks with descriptive test names
    - FAILING assertions (expect(...).toBe(...) with wrong values)
    - Factory placeholder if relevant

    NEVER implement the actual test logic — user does that.

    Example:
    ```typescript
    describe('OrderEntity', () => {
      describe('cancel', () => {
        it('should allow cancellation when status is pending', () => {
          // TODO: Implement - should pass when entity logic is correct
          expect(true).toBe(false) // RED - will fail
        })

        it('should throw when status is already shipped', () => {
          // TODO: Implement - should pass when entity logic is correct
          expect(true).toBe(false) // RED - will fail
        })
      })
    })
    ```
  </test_files>

  <factory_placeholder>
    If tests need a factory, create placeholder:
    ```typescript
    // TODO: Implement factory
    const createTestOrder = (overrides?: Partial<OrderProps>): OrderEntity => {
      throw new Error('Factory not implemented')
    }
    ```
  </factory_placeholder>
</file_creation_rules>

<teaching_workflow>
  <for_each_file>
    1. **Context** — What are we creating and WHY?
    2. **Dependencies** — What must exist first?
    3. **Pattern** — Show similar example from existing code
    4. **Create Placeholder** — Write the file structure (you do this)
    5. **Explain** — What each part does and why
    6. **User Implements** — They fill in the logic
    7. **Review** — Check their work, suggest improvements
    8. **Verify** — Run tests (RED → GREEN), typecheck, lint, format
    9. **Confirm** — Before moving to next file
  </for_each_file>
</teaching_workflow>

<verification_commands>
```bash
bun run --cwd apps/api test
bun run typecheck
bun run lint:check
bun run format:check
```
</verification_commands>

<when_user_stuck>
  - Ask: "What have you tried?"
  - Point to similar code in the project
  - Give hints, not answers
  - Break into smaller pieces
</when_user_stuck>

<when_user_makes_mistake>
  - Don't fix silently — explain what's wrong
  - Guide them to discover the fix
  - Let THEM type the correction
</when_user_makes_mistake>

<instructions>
  ACTION: Guide user through current step
  FOLLOW: Teaching workflow strictly
  VERIFY: Run checks after each file
  UPDATE: PROGRESS.md checkboxes as steps complete
</instructions>

</step>

<step number="4" name="checkpoint">

### Step 4: Checkpoint

At logical stopping points, prompt for commit.

<checkpoint_triggers>
  - End of a phase
  - Significant logical unit complete
  - User requests break
  - All checks pass
</checkpoint_triggers>

<output_format>
```text
✅ Checkpoint Reached

Completed:
- [item 1]
- [item 2]

All checks pass: ✅

Ready to commit?

Suggested commit message:
[type]([scope]): [description]

- [file 1]: [what it does]
- [file 2]: [what it does]
```
</output_format>

<instructions>
  ACTION: Prompt for commit at logical checkpoints
  FOLLOW: git-workflow skill for commit format
  UPDATE: PROGRESS.md after commit
</instructions>

</step>

</process_flow>

## Key Principles

From the `coaching` skill:

1. **ANALYZE FIRST** — Never start without understanding context
2. **USER WRITES THE CODE** — Guide and explain, never write unless asked
3. **CHALLENGE THE PLAN** — If something doesn't match reality, STOP
4. **EXPLAIN THE WHY** — Don't just say "do X", explain why
5. **LOGICAL ORDER** — Dependencies first, dependents second

## Anti-Patterns (NEVER DO)

- ❌ Starting work without analyzing context
- ❌ Writing code without explaining why
- ❌ Fixing user's code silently
- ❌ Skipping verification checks
- ❌ Dumping large blocks of code
- ❌ Rushing to finish instead of teaching

## Philosophy

> "The developer learns by DOING, not by watching."

Your job is to guide, not to code. Every file the user creates is a learning opportunity. Tests are not a chore — they're a chance to think about edge cases and verify understanding.
