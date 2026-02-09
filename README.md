# Claude Code Tool Kit

Personal collection of skills, commands, agents, and configurations for Claude Code.

## Structure

```text
.
├── CLAUDE.md              # Main instructions & system prompt
├── commands/              # Slash commands (/start, /coaching, etc.)
│   ├── coaching.md
│   ├── planning.md
│   ├── pragmatic-review.md
│   └── start.md
├── agents/                # Specialized agent behaviors
│   ├── coaching-guide.md
│   ├── coaching-review.md
│   └── coaching-scaffold.md
├── hooks/                 # Claude Code hooks (injected into settings.json)
│   ├── hooks-config.json
│   └── prompts/
│       ├── commit-validator.txt
│       ├── task-checker.txt
│       └── code-guardian.txt
└── skills/                # Auto-loaded contextual skills
    ├── backend-architecture/
    ├── coaching/
    ├── code-review-pragmatic/
    ├── code-style/
    ├── feature-shape/
    ├── frontend-architecture/
    └── git-workflow/
```

## Skills

| Skill                   | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `backend-architecture`  | NestJS hexagonal/clean architecture patterns                  |
| `frontend-architecture` | React/Astro feature-based architecture                        |
| `code-style`            | TypeScript conventions (no semicolons, arrow functions, etc.) |
| `git-workflow`          | Branch strategy, atomic commits, PR workflow                  |
| `coaching`              | Guided development methodology (pair-programming partner)     |
| `feature-shape`         | Feature planning document format                              |
| `code-review-pragmatic` | Practical code review for solo devs/small teams               |

## Commands

| Command             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/start`            | Session startup - analyze context and propose next action |
| `/coaching`         | Start a guided implementation session                     |
| `/planning`         | Create Implementation Plan from Feature Shape             |
| `/pragmatic-review` | Pragmatic code review                                     |

## Agents

| Agent               | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `coaching-scaffold` | Creates placeholder file pairs (impl + test)          |
| `coaching-guide`    | Analyzes context and provides guidance with examples  |
| `coaching-review`   | Code review before commit (logic, types, consistency) |

## Hooks

Hooks are injected into `~/.claude/settings.json` at install time (requires `jq`).

| Hook                | Event              | Type   | Purpose                                                  |
| ------------------- | ------------------ | ------ | -------------------------------------------------------- |
| `commit-validator`  | PreToolUse (Bash)  | prompt | Validates git commit format and rules                    |
| `task-checker`      | Stop               | prompt | Verifies Claude completed all tasks before stopping      |
| `code-guardian`     | Stop               | agent  | Reviews modified code against style rules                |

Prompt files are in `hooks/prompts/` and can be edited directly. Run `./install.sh` again to apply changes.

## Architecture

### Toolkit Overview

```mermaid
graph TB
    subgraph "Claude Code Tool Kit"
        subgraph "Skills (auto-loaded)"
            S1[backend-architecture]
            S2[frontend-architecture]
            S3[code-style]
            S4[git-workflow]
            S5[coaching]
            S6[feature-shape]
            S7[code-review-pragmatic]
        end

        subgraph "Commands (user-invoked)"
            C1["⌘ start"]
            C2["⌘ planning"]
            C3["⌘ coaching"]
            C4["⌘ pragmatic-review"]
        end

        subgraph "Agents (behavior refs)"
            A1[coaching-guide]
            A2[coaching-scaffold]
            A3[coaching-review]
        end

        subgraph "Hooks (auto-fired)"
            H1["commit-validator<br/>PreToolUse · Bash"]
            H2["task-checker<br/>Stop · prompt"]
            H3["code-guardian<br/>Stop · agent"]
        end

        CFG[CLAUDE.md]
    end

    C3 -->|"reads behavior"| A1
    C3 -->|"reads behavior"| A2
    C3 -->|"reads behavior"| A3
    C3 -->|"follows"| S5
    C4 -->|"follows"| S7
    C2 -->|"follows"| S6

    H1 -->|"enforces"| S4
    H3 -->|"enforces"| S3

    CFG -->|"references"| S1 & S2 & S3 & S4 & S5 & S6 & S7
```

### Hook Execution Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Claude
    participant CV as commit-validator
    participant TC as task-checker
    participant CG as code-guardian

    U->>C: Request task
    C->>C: Working...

    Note over C,CV: On every Bash tool call
    C->>CV: Bash(git commit -m "...")
    CV-->>C: {"ok": true} or {"ok": false, "reason": "..."}

    Note over C,CG: When Claude tries to stop
    C->>TC: Stop event
    TC-->>C: {"ok": true} (all tasks done)
    C->>CG: Stop event (agent)
    CG->>CG: git diff → read files → check rules
    CG-->>C: {"ok": true} (code clean)
    C-->>U: Response delivered
```

## Installation

```bash
./install.sh
```

The script will:

- Copy skills to `~/.claude/skills/`
- Copy commands to `~/.claude/commands/`
- Copy agents to `~/.claude/agents/`
- Inject hooks into `~/.claude/settings.json` (requires `jq`)
- Copy CLAUDE.md to `~/.claude/`
- Ask before overwriting existing files
- Create an uninstall script at `~/.claude/uninstall-tool-kit.sh`

## Uninstall

```bash
~/.claude/uninstall-tool-kit.sh
```

## License

Personal use.
