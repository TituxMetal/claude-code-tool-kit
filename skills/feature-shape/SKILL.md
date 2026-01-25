---
name: feature-shape
description: Feature Shape planning methodology. Mid-level planning documents that bridge MVP and implementation.
---

# Feature Shape Skill

Feature Shapes are mid-level planning documents that bridge the gap between the high-level MVP definition and concrete implementation steps.

---

## The Planning Hierarchy

```text
MVP.md                    → High-level roadmap (features list, scope, done criteria)
     ↓
Feature Shape             → Mid-level planning (WHAT and WHY, no file names)
(docs/features/NN-*.md)
     ↓
Implementation Plan       → Detailed phases (HOW, files, checkboxes)
(~/.claude/plans/*.md)
     ↓
PROGRESS.md               → Tracks execution progress
```

---

## Feature Shape Template

```markdown
# Feature Shape: [Feature Name]

## Problem

What user problem does this feature solve? Why does it need to exist? Keep it short — 2-3 sentences max.

## Solution (Broad Strokes)

Describe the solution at a high level:

- What can the user do?
- What are the main UI elements/screens?
- What data is involved?

Do NOT specify:

- File names or paths
- Function signatures
- Specific implementation details

## User Flow

Step-by-step description of how the user interacts with this feature:

1. User does X
2. System shows Y
3. User does Z
4. etc.

## Dependencies

**Requires:**

- What must exist before this feature can be built?
- Other features, infrastructure, data

**Enables:**

- What features depend on this one?
- Why is this feature needed for the next steps?

## What Must Exist (Backend)

High-level list of backend components needed:

- Entities / data models
- Use cases / operations
- API endpoints
- Validations

Do NOT specify file names — just describe what's needed functionally.

## What Must Exist (Frontend)

High-level list of frontend components needed:

- Pages / routes
- Components (list, form, modal, etc.)
- State management needs
- User interactions

Do NOT specify file names — just describe what's needed functionally.

## Open Questions

Things that need clarification before or during implementation:

1. Question 1?
2. Question 2?

These can be resolved during the planning phase.

## Out of Scope

What this feature explicitly does NOT include. Helps prevent scope creep.

## Risks / Gotchas

Potential issues, edge cases, or tricky parts to watch out for:

- Technical risks
- UX concerns
- Data integrity issues
- Things that might be forgotten
```

---

## Guidelines

### When to Create a Feature Shape

- Before starting implementation of a feature
- Only for the next 2-3 features (just-in-time planning)
- After the codebase context is available

### Who Creates It

- You + Claude Code together
- Claude Code reads the existing code to understand conventions
- You validate and adjust based on your knowledge

### How Detailed Should It Be

**Too vague:**

> "Admin can manage users"

**Too detailed:**

> "Create file `src/domain/entities/user.entity.ts` with class User..."

**Just right:**

> "Admin can create, edit, and deactivate users. Each user has a username, email, role, and status. The status can be active, suspended, or banned."

### Living Document

Feature Shapes can be updated during implementation if:

- New open questions are discovered
- Scope needs adjustment
- Dependencies change

But avoid major rewrites — if the shape was wrong, learn from it for the next one.

---

## MVP.md Structure

The MVP.md file is the high-level roadmap that Feature Shapes are derived from:

```markdown
# Project Name — MVP Definition

## Overview

Brief description of the project and target users.

## Core Value

What problems does this solve?

## MVP Scope

### MVP Core (Must Ship)

Minimum viable features.

### MVP Full (Nice to Have)

Extended features if time permits.

## MVP Core Features

### 1. Feature Name

- [ ] Capability 1
- [ ] Capability 2
- [ ] Capability 3

### 2. Another Feature

- [ ] Capability 1
- [ ] Capability 2

## Technical Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS |
| Frontend | Astro + React |
| etc. | etc. |

## Build Order

High-level order of features to implement.

## "Done" Criteria

What must be true for MVP to be complete.
```

---

## File Naming Convention

```text
docs/
├── MVP.md                          # High-level roadmap
├── PROGRESS.md                     # Current progress tracking
├── FEATURE_SHAPE_TEMPLATE.md       # This template (optional)
└── features/
    ├── 01-user-authentication.md   # Feature Shape 1
    ├── 02-user-profile.md          # Feature Shape 2
    └── 03-dashboard.md             # Feature Shape 3
```

Use numbered prefixes (`01-`, `02-`) to indicate build order.
