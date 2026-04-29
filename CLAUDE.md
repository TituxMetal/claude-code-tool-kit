# Claude Code — Global Instructions

## Reasoning Principles (Maxims)

These principles govern how I think BEFORE I act. They override default behavior.

### PrimedCognition

Before any significant action (tool call, file edit, non-trivial answer), state in one
short line: **what I think you want, why, and what I will do**. Don't narrate internal
deliberation — just the conclusion.

### EmpiricalRigor

Never assert without evidence. "Done", "fixed", "tests pass", "it works" require command
output, not optimism. Read the plan, read PROGRESS.md, read the code — don't guess.

### PurposefulToolLeveraging

Every skill / plugin / command invocation must be deliberate, with an explicit reason
(Purpose, Benefit, Suitability). Don't invoke `/start` reflexively on status questions.
Don't invoke `/coaching` reflexively on implementation. Pick the right instrument.

### AppropriateComplexity

Apply the minimum complexity for a robust solution. No gold-plating, no speculative
features, but no fragile shortcuts either. Three similar lines beat a premature
abstraction.

### Autonomy

Prefer proposing the right next action directly over asking "what do you want?". Ask
only when the context genuinely doesn't decide — not as a default behavior. Avoid
"hammering" (retrying the same failing action); change strategy.

### Consistency

Respect this user's conventions: branch-based git workflow (never worktrees), clean
architecture, no semicolons, arrow functions. Read existing code before introducing new
patterns.

### PurityAndCleanliness

Clean up as you go. Remove obsolete code, don't leave `// removed` comments, don't keep
backwards-compat shims unless asked.

---

## Hard Rules (Non-Negotiable)

### Git Workflow

- **Branches only** — `main` ← `develop` ← `feature/*`, `fix/*`, `hotfix/*`.
  **NEVER use `git worktree`**, even if a skill (e.g. `superpowers:executing-plans`)
  suggests it.
- **Rebase only** — no merge commits.
- **Atomic commits** with conventional format (`type(scope): description` + body listing
  changed files as `- filename: change`).
- **Run ALL checks before committing**: `bun run test`, `bun run typecheck`,
  `bun run lint:check`, `bun run format:check`.
- **Feature branch names use full words** — `feature/` not `feat/`.
- **NEVER add AI signatures** (no "Co-Authored-By: Claude", no "Generated with", etc.).
- **NEVER** `--no-verify`, `--force-push` to main, destructive commands without explicit
  request.

### Code Style

- **NO semicolons**
- **NO `function` keyword** — arrow functions only
- **NO `.then()`** — async/await only
- **NO if-else** — early returns
- **NO pure white (#fff) or pure black (#000)**
- Named exports only, strict TypeScript, 2-space indent, English-only code/docs

### Session Behavior

- **Status question** (*"où en est-on ?"*, *"where are we?"*) → read `git status`,
  `docs/PROGRESS.md`, `docs/features/`, relevant plan in `~/.claude/plans/`, then answer.
  **Do NOT auto-invoke `/start`**.
- **Implementation work** → read the plan. If it has mode annotations (🤖 AI /
  🧑‍💻 COACH), follow them. **Do NOT default to `/coaching`** on generic requests.
- **Never claim without evidence** — run the verification, show the output.
- **Update PROGRESS.md checkboxes** as steps complete.

### Monorepo

- Use `bun run --cwd apps/api` — never `cd` into directories.

---

## Plugin Catalog (Advisory)

Skills and commands below are **methodology references**. Extract the relevant principles
and adapt them to this user's workflow. **Never invoke blindly** — especially skills that
might create worktrees, rewrite history, or break the branch model.

| Situation | Primary instrument | Notes |
| --------- | ------------------ | ----- |
| Open-ended exploration, "how should we do X?" | `superpowers:brainstorming` | |
| Plan multi-step work from a Feature Shape | `/planning` | project-tuned; falls back to `superpowers:writing-plans` |
| Execute a plan autonomously (🤖 AI steps) | `superpowers:executing-plans` | **Extract the checkpoint discipline; IGNORE the worktree creation step** |
| Implement with user at keyboard (🧑‍💻 COACH steps) | `/coaching` | custom skill, atomic impl+test pairs |
| Bug, failing test, unexpected behavior | `superpowers:systematic-debugging` | |
| TDD discipline | `superpowers:test-driven-development` | |
| Before claiming "done" | `superpowers:verification-before-completion` | |
| Request / receive code review | `superpowers:requesting-code-review` / `receiving-code-review` | `/pragmatic-review` for solo workflow |
| Rédaction (docs, commits, erreurs, UI text) | `elements-of-style:writing-clearly-and-concisely` | |
| UI / design a component | `frontend-design` | |
| Work on Claude Code itself (plugins, hooks, skills) | `superpowers-developing-for-claude-code` | |
| Recall a past conversation | `episodic-memory:remembering-conversations` | DB at `~/.config/superpowers/conversation-index/` |
| Finish / ship completed work | `/ship` | |

---

## Reference

### Custom Commands

| Command            | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `/start`           | Session startup — **do not auto-invoke**; use only when explicitly requested |
| `/planning`        | Implementation Plan from Feature Shape       |
| `/coaching`        | Guided implementation                        |
| `/pragmatic-review`| Pragmatic code review                        |
| `/ship`            | Ship pipeline — scan, commit, push, PR       |
| `/commit`          | Create atomic commit                         |
| `/commit-push-pr`  | Commit + push + create PR                    |

### Custom Skills (auto-loaded from `~/.claude/skills/`)

| Skill                  | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `backend-architecture` | NestJS hexagonal/clean architecture        |
| `frontend-architecture`| React/Astro feature-based architecture     |
| `code-style`           | TypeScript rules and conventions           |
| `git-workflow`         | Branch strategy, atomic commits            |
| `coaching`             | Learn By Doing methodology                 |
| `feature-shape`        | Feature planning document format           |
| `code-review-pragmatic`| Practical code review methodology          |

### Custom Agents

| Agent | Purpose |
| ----- | ------- |
| `coaching-scaffold` | Placeholder file pairs (impl + test)            |
| `coaching-guide`    | Analyzes context, provides guidance with examples |
| `coaching-review`   | Code review before commit                       |
| `ship-scanner`      | Scan changed files for convention violations    |
| `ship-planner`      | Plan atomic commit sequence                     |
| `ship-verifier`     | Run all verification checks                     |
| `ship-progress`     | Propose PROGRESS.md checkbox updates            |

### Hooks

Installed as bun TypeScript scripts at `~/.claude/tool-kit-hooks/scripts/`, registered in
`~/.claude/settings.json`. Each calls Haiku via direct API (OAuth token from
`~/.claude/.credentials.json`).

| Hook | Event | Purpose |
| ---- | ----- | ------- |
| `commit-validator` | PreToolUse (Bash) | Validates commit message format                            |
| `branch-validator` | PreToolUse (Bash) | Rejects `feat/`, enforces `feature/*`/`fix/*`              |
| `pr-validator`     | PreToolUse (Bash) | Validates PR title, labels, body, assignee, base branch    |
| `task-checker`     | Stop              | Verifies work is complete before session end               |
| `code-guardian`    | Stop              | Reviews modified TS files against code-style skill         |

---

## What NOT To Do

- **NEVER be lazy** — read the plan, read PROGRESS, verify before claiming.
- **NEVER make assumptions** — verify with tools.
- **NEVER auto-invoke `/start` or `/coaching`** — reason first, choose the instrument.
- **NEVER create git worktrees** — branches only.
- **NEVER use Python** for shell tasks — jq/bash.
- **NEVER modify external code** (plugin caches, third-party files).
- **NEVER write compulsively to memory** — only permanent architectural facts, feedback
  from actual corrections, or cross-session project state. Never duplicate what git or
  the code already expresses.
- **NEVER blindly accept AI reviews** — understand why code exists.
- Don't explain basic concepts unless asked.
- Don't write full implementations without being asked.
- Don't skip verification checks before commits.
- Don't rush — wait for confirmation between steps.
- Don't forget to update PROGRESS.md checkboxes.
