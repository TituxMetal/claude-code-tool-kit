---
description: Pragmatic Code Review
alwaysApply: false
version: 2.0
---

# Pragmatic Code Review Command

Practical code review focused on catching real bugs, improving clarity, and maintaining clean
architecture — without enterprise overhead.

## Overview

This command orchestrates a code review through specialized sub-agents, ensuring thorough project
discovery before diving into code analysis.

<process_flow>

<step number="1" subagent="Explore" name="discover_project_structure">

### Step 1: Project Discovery

Before reviewing any code, understand the project structure.

<discovery_areas>
  <structure>
    - Is this a monorepo? Check for apps/, packages/ directories
    - Identify ALL apps/packages (e.g., apps/api, apps/web, packages/shared)
    - Map key directories in each app (src/, lib/, components/, domain/)
  </structure>
  <architecture>
    - Identify architecture pattern (hexagonal, clean, feature-based, etc.)
    - Note domain/entity locations for backend
    - Note feature structure for frontend
  </architecture>
</discovery_areas>

<instructions>
  ACTION: Run "ls apps/ packages/ 2>/dev/null || ls src/" FIRST
  IDENTIFY: All apps and packages in the project
  MAP: Key directories and architecture patterns
  OUTPUT: Project structure summary for Step 2
</instructions>

</step>

<step number="2" subagent="code-reviewer" name="review_all_code">

### Step 2: Code Review

Perform the actual code review using the `code-review-pragmatic` skill methodology.

<review_scope>
  <target>
    - Review: $ARGUMENTS (if provided)
    - If no arguments: check git diff --cached, then git diff, then recent commits
    - For monorepos: review ALL apps, not just the one with recent changes
  </target>
  <methodology>
    - Follow the `code-review-pragmatic` skill for review approach
    - Apply SOLID principles checks
    - Apply Hexagonal/Clean Architecture checks (backend)
    - Apply Feature-Based Architecture checks (frontend)
    - Flag common bugs (missing await, array mutation, wrong equality, closures)
  </methodology>
</review_scope>

<severity_labels>
  - 🔴 **[fix]** — Must fix, this is broken
  - 🏗️ **[arch]** — Architecture issue (wrong layer, bad dependency)
  - 💡 **[idea]** — Optional improvement
  - ❓ **[question]** — Need clarification
</severity_labels>

<instructions>
  ACTION: Use the code-review-pragmatic skill methodology
  REVIEW: All apps identified in Step 1
  CHECK: git changes first, then core domain/feature code if no changes
  APPLY: Architecture checks appropriate for each app type
  COLLECT: All findings with severity labels and file:line references
</instructions>

</step>

<step number="3" name="create_review_file">

### Step 3: Create Review Report

Generate a dated review file with all findings.

<file_specification>
  <path>docs/review-YYYY-MM-DD.md</path>
  <structure>
    - Title with date
    - Summary table (bugs, architecture issues, suggestions count)
    - Findings organized by app (for monorepos)
    - Each finding: severity label, file:line, description
    - "Last reviewed" timestamp at bottom
  </structure>
</file_specification>

<output_format>
```markdown
# Code Review: [branch/scope] (YYYY-MM-DD)

## Summary

| Category | Count |
|----------|-------|
| Bugs | X |
| Architecture Issues | X |
| Suggestions | X |

## apps/api

🔴 [fix] src/domain/Entity.ts:42 — Description of bug

🏗️ [arch] src/infrastructure/Repo.ts:15 — Description of issue

## apps/web

💡 [idea] src/features/auth/Login.tsx:28 — Suggestion

---

*Last reviewed: YYYY-MM-DD*
```
</output_format>

<instructions>
  ACTION: Create docs/review-YYYY-MM-DD.md with today's date
  FORMAT: Use the output format structure above
  ORGANIZE: Group findings by app for monorepos
  INCLUDE: Summary table with counts by category
</instructions>

</step>

</process_flow>

## Execution Flow

1. **Always** run Step 1 first — no exceptions
2. Step 2 uses findings from Step 1 to know what to review
3. Step 3 persists the review for future reference

## Philosophy

> "Good enough today beats perfect never."

Focus on **real bugs**, **readability**, and **clean architecture**. If the code works, is clear,
and respects the architecture — ship it.
