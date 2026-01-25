---
name: code-review-pragmatic
description:
  Practical code review methodology for solo developers and small teams. Focuses on correctness,
  clarity, and architecture without enterprise overhead. Used by the /pragmatic-review command.
---

# Pragmatic Code Review Methodology

This skill defines **how** to review code — the checks to apply, bugs to catch, and feedback format
to use. The `/pragmatic-review` command handles orchestration and file output.

## Review Checklist

### 1. Does it Work?

- [ ] Logic is correct for the happy path
- [ ] Edge cases are handled (null, empty, zero)
- [ ] Error paths make sense
- [ ] No obvious infinite loops or off-by-one errors

### 2. Is it Clear?

- [ ] Variable names describe what they hold
- [ ] Functions do one thing
- [ ] No magic numbers (use constants)
- [ ] Complex logic has a comment explaining WHY

### 3. Will it Break Tomorrow?

- [ ] No hardcoded values that will change
- [ ] External dependencies are handled (network, files)
- [ ] Async code awaits properly
- [ ] Resources are cleaned up (files closed, listeners removed)

### 4. Does it Fit the Architecture?

**SOLID Principles:**

- **S** — Single responsibility? One reason to change?
- **O** — Open for extension, closed for modification?
- **L** — Subtypes substitutable for base types?
- **I** — Interfaces focused and minimal?
- **D** — High-level depends on abstractions, not concretions?

**Hexagonal/Clean Architecture (Backend):**

- Domain has no external dependencies (no imports from infra/adapters)
- Use cases orchestrate, don't contain business rules
- Adapters depend on ports (interfaces)
- Dependencies point inward (infra → app → domain)

**Feature-Based Architecture (Frontend):**

- Each feature is self-contained (components, hooks, types, tests)
- Shared code lives in `shared/` or `common/`
- No cross-feature imports (feature A should not import from feature B)
- Barrel exports expose only the public API

## What to Skip

This methodology intentionally ignores:

- **Scalability**: We're not reviewing for 100k users
- **Security audits**: No OWASP checklists or penetration testing
- **Team workflows**: No design docs, staged PRs, or team coordination
- **Performance optimization**: If it's not obviously slow, it's fine
- **Formatting**: Let the linter handle it

## Common Bugs to Catch

### TypeScript/JavaScript

**1. Missing await**

```typescript
const bad = async () => {
  const data = fetchData() // Missing await!
  return data.value // data is a Promise, not the result
}
```

**2. Wrong equality check**

```typescript
if (value == null) // Catches null AND undefined
if (value === null) // Only catches null — probably not what you want
```

**3. Array mutation during iteration**

```typescript
for (const item of items) {
  if (shouldRemove(item)) {
    items.splice(items.indexOf(item), 1) // Bug!
  }
}
// Better: use filter() to create new array
```

**4. Closure in loop with var**

```typescript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100) // Prints 3, 3, 3
}
// Fix: use let instead of var
```

**5. Unhandled promise rejection**

```typescript
// Bad: silent failure
fetchData().then(handleData)

// Good: handle errors
fetchData().then(handleData).catch(handleError)
// Or: await with try/catch
```

## Severity Labels

Use these labels for all findings:

| Label | Meaning | Action Required |
|-------|---------|-----------------|
| 🔴 **[fix]** | This is broken | Must fix before merge |
| 🏗️ **[arch]** | Architecture violation | Should fix, may defer |
| 💡 **[idea]** | Optional improvement | Nice to have |
| ❓ **[question]** | Need clarification | Discuss with author |

## Giving Good Feedback

**Do:**

```markdown
🔴 [fix] src/api/user.ts:42 — Missing await on `fetchUser()`.
The function returns a Promise, not the user object.

🏗️ [arch] src/features/auth/api.ts:15 — Imports from `features/profile/`.
Features should not depend on each other. Move shared logic to `shared/`.
```

**Don't:**

- Nitpick formatting (let the linter handle it)
- Suggest rewrites to match personal style
- Block for theoretical issues that won't happen
- Add excessive comments on working code

## Quick Fixes Reference

### Improve Clarity

| Before | After |
|--------|-------|
| `const d = new Date()` | `const createdAt = new Date()` |
| `if (x > 0 && y < 10 && z !== null)` | Extract to: `const isValid = ...` |
| Long multi-responsibility function | Split into smaller focused functions |

### Handle Edge Cases

```typescript
// Add early returns for edge cases
const processItems = (items: Item[]) => {
  if (!items || items.length === 0) return []

  // Main logic here
}
```

## Philosophy

> "Good enough today beats perfect never."

This methodology catches **real bugs**, improves **readability**, and maintains **clean
architecture**. If the code works, is clear, and respects the architecture — ship it.
