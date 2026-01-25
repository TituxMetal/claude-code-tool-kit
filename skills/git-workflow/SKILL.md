---
name: git-workflow
description: Git workflow rules for branches, commits, and pull requests.
---

# Git Workflow Skill

Rules for commits, branches, and pull requests.

---

## Branch Strategy

```text
main (production, stable)
  └── develop (integration, default)
    ├── feature/add-user-auth
    ├── feature/implement-dashboard
    └── fix/typo-in-readme
```

| Branch      | Purpose                                           |
| ----------- | ------------------------------------------------- |
| `main`      | Production. Only PRs from develop. Always stable. |
| `develop`   | Integration. Features merge here. Default branch. |
| `feature/*` | New features                                      |
| `fix/*`     | Bug fixes and small corrections                   |

---

## Atomic Commits

**One logical change per commit.** Not 27 files dumped together.

### Commit Message Format

```text
type(scope): short description

- Detail 1
- Detail 2
- Detail 3
```

### Types

| Type       | Use For                     |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation only          |
| `style`    | Formatting, no code change  |
| `refactor` | Code change, no new feature |
| `test`     | Adding tests                |
| `chore`    | Maintenance, deps, config   |

### Examples

```bash
# ✅ GOOD — atomic, descriptive
git commit -m "feat(users): add User entity with behavior methods

- User.entity.ts: getFullName(), isActive()
- User.entity.spec.ts: unit tests for all methods"

# ✅ GOOD — single file fix
git commit -m "fix(auth): correct token validation

- Auth.service.ts: fix expiration check"

# ❌ BAD — too vague
git commit -m "feat(api): add domain layer"

# ❌ BAD — no details
git commit -m "fix stuff"
```

---

## Always List Files

Commit messages MUST mention what files are included, especially tests:

```bash
# ✅ GOOD
git commit -m "feat(orders): add CreateOrder use case

- CreateOrder.uc.ts: use case implementation
- CreateOrder.uc.spec.ts: unit tests with mocked repo"

# ❌ BAD — tests not mentioned
git commit -m "feat(orders): add CreateOrder use case"
```

---

## No Signatures

**NEVER add these to commits:**

- ❌ "Generated with Claude Code"
- ❌ "Co-Authored-By: Claude"
- ❌ Any AI attribution
- ❌ "Signed-off-by"

---

## Feature Workflow

### Starting a Feature

```bash
# 1. Ensure on develop and up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-user-profile
```

### During a Feature

- Run checks BEFORE each commit (see below)
- Commit atomically as you complete logical units
- Keep commits small and focused

### Finishing a Feature

```bash
# 1. Final verification (ALL checks must pass)
bun run test
bun run typecheck
bun run lint:check
bun run format:check

# 2. Push and create PR
git push -u origin feature/add-user-profile
gh pr create --base develop --assignee @me \
  --title "feat: add user profile feature" \
  --body "Description of changes"
```

---

## Verify BEFORE Committing

**ALWAYS run ALL checks BEFORE every commit:**

```bash
bun run test
bun run typecheck
bun run lint:check
bun run format:check
```

**If any check fails, fix it BEFORE committing.** The goal is clean commits, not fix commits after
the fact.

---

## Phase-Based Development

When working on a feature with multiple phases:

- Each phase should be completable in 30-60 minutes
- Each phase ends with a commit
- Update PROGRESS.md checkboxes as you complete steps
- If a phase is too big, split it into sub-phases
