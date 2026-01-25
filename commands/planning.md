---
description: Create Implementation Plan from a Feature Shape
alwaysApply: false
version: 1.0
---

# Planning Command

Create a detailed Implementation Plan from a Feature Shape document.

## Overview

This command reads a Feature Shape, analyzes the existing codebase patterns, resolves open questions, and creates a comprehensive Implementation Plan with phases, checkboxes, and verification steps.

## Arguments

- `$ARGUMENTS` — Feature name or number (e.g., "01" or "user-profile")

<process_flow>

<step number="1" subagent="Explore" name="analyze_codebase">

### Step 1: Analyze Codebase Patterns

Understand the existing codebase to ensure the plan follows established patterns.

<analysis_areas>
  <backend>
    - Identify existing modules (e.g., users/, auth/)
    - Note domain layer patterns (entities, value objects, repositories)
    - Note application layer patterns (use cases, DTOs, mappers)
    - Note infrastructure layer patterns (controllers, Prisma repos)
  </backend>
  <frontend>
    - Identify existing features (e.g., auth/, profile/)
    - Note component patterns (containers, forms, lists)
    - Note store patterns (nanostores atoms, actions)
    - Note API service patterns
  </frontend>
  <testing>
    - Identify test file naming conventions
    - Note testing patterns (mocks, fixtures)
  </testing>
</analysis_areas>

<instructions>
  ACTION: Explore apps/api/src/ and apps/web/src/ (or src/)
  IDENTIFY: Existing patterns, naming conventions, module structure
  OUTPUT: Pattern summary for Step 3
</instructions>

</step>

<step number="2" name="read_feature_shape">

### Step 2: Read Feature Shape

Load and understand the Feature Shape document.

<instructions>
  ACTION: Read docs/features/$ARGUMENTS*.md (match by number or name)
  EXTRACT: Problem, Solution, User Flow, Dependencies, Backend needs, Frontend needs
  IDENTIFY: Open Questions that need resolution
  OUTPUT: Feature requirements summary
</instructions>

</step>

<step number="3" name="resolve_questions">

### Step 3: Resolve Open Questions

Address any open questions from the Feature Shape before planning.

<instructions>
  ACTION: Present open questions to user
  ASK: For decisions on each question
  RECORD: Decisions for inclusion in the plan
</instructions>

</step>

<step number="4" name="create_implementation_plan">

### Step 4: Create Implementation Plan

Generate a detailed Implementation Plan following the established pattern.

<plan_structure>
```markdown
# Feature NN: [Feature Name] — Implementation Plan

## Overview

Brief description and scope (Backend + Frontend).

---

## Decisions Made

| Question | Answer |
|----------|--------|
| [open question 1] | [decision] |
| [open question 2] | [decision] |

---

## Monorepo Commands Reference

```bash
bun run --cwd apps/api dev
bun run --cwd apps/api test
bun run --cwd apps/web dev
bun run --cwd apps/web test
```

---

# PART 1: BACKEND

## Phase 1: Database Schema (~15-30 min)

**File:** `apps/api/prisma/schema.prisma`

- [ ] Add enums (if needed)
- [ ] Add model with relations
- [ ] Run migration

**Commit:** `feat(feature): add database schema`

---

## Phase 2: Domain Layer (~45 min)

**Directory:** `apps/api/src/[feature]/domain/`

### 2.1 Value Objects

| Value Object | Validation Rules | Status |
|--------------|------------------|--------|
| `XxxId.vo.ts` | UUID format | |
| `Yyy.vo.ts` | [rules] | |

### 2.2 Entity

Properties and methods...

### 2.3 Repository Interface

Interface definition...

### 2.4 Exceptions

List of domain exceptions...

**Commit:** `feat(feature): add domain layer`

---

## Phase 3: Application Layer (~60 min, split if needed)

### 3.1 DTOs
### 3.2 Use Cases
### 3.3 Mapper
### 3.4 Service (if needed)

---

## Phase 4: Infrastructure Layer (~45 min)

### 4.1 Repository Implementation
### 4.2 Infrastructure Mapper
### 4.3 Controller

---

## Phase 5: Module & Wiring (~15 min)

---

# PART 2: FRONTEND

## Phase 6: Types & Schemas (~30 min)

## Phase 7: API Service & Store (~30 min)

## Phase 8: Components (~45 min, split if needed)

## Phase 9: Pages & Navigation (~30 min)

---

# VERIFICATION PLAN

## Manual API Testing

```bash
curl commands...
```

## End-to-End Testing

1. Start apps
2. Test user flow
3. Verify all features work

---

# FILE STRUCTURE

```text
apps/api/src/[feature]/
├── domain/
├── application/
├── infrastructure/
└── [Feature].module.ts

apps/web/src/features/[feature]/
├── api/
├── components/
├── hooks/
├── schemas/
├── store/
├── types/
└── index.ts
```

---

# CRITICAL FILES TO MODIFY

| File | Action |
|------|--------|
| `apps/api/src/app.module.ts` | Import new module |
| `apps/web/src/layouts/Main.astro` | Add navigation |
```
</plan_structure>

<phase_guidelines>
  - Each phase: 30-60 minutes max
  - Each phase ends with a commit
  - Backend phases follow: Domain → Application → Infrastructure
  - Frontend phases follow: Types → API/Store → Components → Pages
  - Include file counts per phase
  - Include commit message suggestion per phase
</phase_guidelines>

<plan_filename>
  Format: {project-name}-{feature-number}-{feature-name}.md

  - project-name: Name of the current project directory (kebab-case)
  - feature-number: From Feature Shape filename (e.g., "01", "02")
  - feature-name: From Feature Shape filename (kebab-case)

  Examples:
  - warehouse-manager-01-vehicle-profile.md
  - car-cost-tracker-02-user-authentication.md
  - my-app-03-dashboard.md
</plan_filename>

<instructions>
  ACTION: Create ~/.claude/plans/{project-name}-{feature-number}-{feature-name}.md
  FOLLOW: Existing codebase patterns
  INCLUDE: All sections from plan structure
  OUTPUT: Path to created plan file
</instructions>

</step>

<step number="5" name="create_progress_file">

### Step 5: Create/Update PROGRESS.md

Create a progress tracking file for the feature.

<instructions>
  ACTION: Create or update docs/PROGRESS.md
  INCLUDE: All phases with checkboxes
  FORMAT: Matches the Implementation Plan structure
</instructions>

</step>

</process_flow>

## Execution Flow

1. Analyze codebase patterns (parallel-safe)
2. Read the Feature Shape
3. Resolve open questions with user
4. Create Implementation Plan
5. Create/Update PROGRESS.md

## Output

- Implementation Plan: `~/.claude/plans/{project}-{feature-number}-{feature-name}.md`
- Progress tracking: `docs/PROGRESS.md`

## Philosophy

> "Plan thoroughly, execute confidently."

A good Implementation Plan removes ambiguity and lets the developer focus on coding, not deciding what to build next.
