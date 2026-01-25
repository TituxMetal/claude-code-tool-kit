# Claude Code Tool Kit

Personal collection of skills, commands, and configurations for Claude Code.

## Structure

```text
.
├── CLAUDE.md              # Main instructions & system prompt
├── commands/              # Slash commands (/start, /coaching, etc.)
│   ├── coaching.md
│   ├── planning.md
│   ├── pragmatic-review.md
│   └── start.md
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
| `coaching`              | Learn By Doing methodology for guided development             |
| `feature-shape`         | Feature planning document format                              |
| `code-review-pragmatic` | Practical code review for solo devs/small teams               |

## Commands

| Command             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/start`            | Session startup - analyze context and propose next action |
| `/coaching`         | Start a guided implementation session                     |
| `/planning`         | Create Implementation Plan from Feature Shape             |
| `/pragmatic-review` | Pragmatic code review                                     |

## Installation

```bash
./install.sh
```

The script will:

- Copy skills to `~/.claude/skills/`
- Copy commands to `~/.claude/commands/`
- Copy CLAUDE.md to `~/.claude/`
- Ask before overwriting existing files
- Create an uninstall script at `~/.claude/uninstall-tool-kit.sh`

## Uninstall

```bash
~/.claude/uninstall-tool-kit.sh
```

## License

Personal use.
