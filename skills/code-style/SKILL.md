---
name: code-style
description: Rules for writing code in projects.
---

# Code Style Skill

Rules for writing code in projects.

---

## TypeScript Style

```text
NO semicolons
NO function keyword (use arrow functions)
NO .then() (use async/await)
NO if-else (use early returns only)
NO pure white (#fff) or pure black (#000) in UI
```

### Arrow Functions

```typescript
// ❌ BAD - function keyword
function getStatus(isActive: boolean): string {
  return isActive ? 'active' : 'inactive'
}

// ✅ GOOD - arrow function
const getStatus = (isActive: boolean): string => {
  return isActive ? 'active' : 'inactive'
}
```

### Async/Await

```typescript
// ❌ BAD - .then()
const fetchData = () => {
  return api.get('/data').then(response => {
    return response.data
  })
}

// ✅ GOOD - async/await
const fetchData = async () => {
  const response = await api.get('/data')
  return response.data
}
```

### Early Returns Pattern

```typescript
// ❌ BAD - if-else
const getStatus = (isActive: boolean): string => {
  if (isActive) {
    return 'active'
  } else {
    return 'inactive'
  }
}

// ✅ GOOD - early return
const getStatus = (isActive: boolean): string => {
  if (isActive) return 'active'
  return 'inactive'
}
```

---

## Backend File Naming (NestJS)

### Code Files — PascalCase.type.ts

```text
domain/
├── entities/
│   ├── Order.entity.ts
│   └── Order.entity.spec.ts
├── value-objects/
│   ├── Email.vo.ts
│   └── Email.vo.spec.ts
└── interfaces/
    └── Order.repository.ts         # Interface only

application/
├── use-cases/
│   ├── CreateOrder.uc.ts
│   └── CreateOrder.uc.spec.ts
├── dtos/
│   ├── CreateOrder.dto.ts
│   └── OrderResponse.dto.ts
└── mappers/
    ├── Order.mapper.ts
    └── Order.mapper.spec.ts

infrastructure/
├── repositories/
│   ├── PrismaOrder.repository.ts   # Implementation
│   └── PrismaOrder.repository.spec.ts
├── mappers/
│   ├── Order.mapper.ts             # Infrastructure mapper
│   └── Order.mapper.spec.ts
└── controllers/
    ├── Order.controller.ts
    └── Order.controller.spec.ts
```

### Backend File Type Extensions

| Type                      | Extension        | Example                      |
| ------------------------- | ---------------- | ---------------------------- |
| Entity                    | `.entity.ts`     | `Order.entity.ts`            |
| Value Object              | `.vo.ts`         | `Email.vo.ts`                |
| Repository Interface      | `.repository.ts` | `Order.repository.ts`        |
| Repository Implementation | `.repository.ts` | `PrismaOrder.repository.ts`  |
| Use Case                  | `.uc.ts`         | `CreateOrder.uc.ts`          |
| DTO                       | `.dto.ts`        | `OrderResponse.dto.ts`       |
| Application Mapper        | `.mapper.ts`     | `Order.mapper.ts`            |
| Infrastructure Mapper     | `.mapper.ts`     | `Order.mapper.ts`            |
| Controller                | `.controller.ts` | `Order.controller.ts`        |
| Module                    | `.module.ts`     | `Order.module.ts`            |
| Test                      | `.spec.ts`       | `Order.entity.spec.ts`       |

---

## Frontend File Naming (React/Astro)

### Structure

```text
src/
├── components/ui/           # Shared UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── index.ts
├── features/                # Feature modules
│   └── auth/
│       ├── api/
│       │   ├── auth.service.ts
│       │   └── auth.service.spec.ts
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── LoginForm.spec.tsx
│       │   └── AuthContainer.tsx
│       ├── hooks/
│       │   └── useAuth.ts
│       ├── schemas/
│       │   ├── auth.schema.ts
│       │   └── auth.schema.spec.ts
│       ├── store/
│       │   ├── auth.store.ts
│       │   └── auth.store.spec.ts
│       ├── types/
│       │   └── auth.types.ts
│       └── index.ts
├── lib/                     # Shared libraries
│   ├── apiRequest.ts
│   └── authClient.ts
├── types/                   # Global types
│   ├── api.types.ts
│   └── user.types.ts
└── utils/                   # Global utilities
    └── navigation.ts
```

### Frontend File Type Extensions

| Type         | Pattern               | Example              |
| ------------ | --------------------- | -------------------- |
| Component    | `PascalCase.tsx`      | `LoginForm.tsx`      |
| Container    | `PascalCase.tsx`      | `AuthContainer.tsx`  |
| Service      | `camelCase.service.ts`| `auth.service.ts`    |
| Hook         | `useCamelCase.ts`     | `useAuth.ts`         |
| Schema (Zod) | `camelCase.schema.ts` | `auth.schema.ts`     |
| Store        | `camelCase.store.ts`  | `auth.store.ts`      |
| Types        | `camelCase.types.ts`  | `auth.types.ts`      |
| Utility      | `camelCase.ts`        | `navigation.ts`      |
| Test         | `.spec.ts(x)`         | `LoginForm.spec.tsx` |

### Nanostores Convention

```typescript
// Atoms use $ prefix
export const $user = atom<User | null>(null)
export const $isLoading = atom<boolean>(false)
export const $error = atom<string | null>(null)

// Computed values also use $ prefix
export const $isAuthenticated = computed($user, user => !!user)

// Actions are grouped in an object
export const authActions = {
  async refresh() { /* ... */ },
  clearError() { /* ... */ }
}
```

---

## Documentation Files — kebab-case

```text
├── feature-overview.md
├── vision.md
└── readme.md
```

---

## Monorepo Commands

**ALWAYS use `bun run --cwd` — NEVER `cd` into directories**

```bash
# ✅ GOOD
bun run --cwd apps/api test
bun run --cwd apps/api prisma generate
bun run --cwd apps/web dev

# ❌ BAD
cd apps/api && bun run test
```

---

## UI Theme

Dark Zinc only. NO light mode.

```text
Background:  zinc-900, zinc-950
Cards:       zinc-800 with zinc-700 borders
Text:        zinc-100, zinc-200, zinc-300
Accent Even: emerald-500, emerald-600
Accent Odd:  sky-500, sky-600

NEVER: #fff (white), #000 (black)
```

---

## HTML

Use semantic elements:

```html
<!-- ✅ GOOD -->
<article>
  <header>
    <h1>Title</h1>
  </header>
  <section>Content</section>
  <footer>Meta</footer>
</article>

<!-- ❌ BAD -->
<div class="article">
  <div class="header">
    <div class="title">Title</div>
  </div>
</div>
```
