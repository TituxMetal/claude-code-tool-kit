import { askLlm } from './llm'

const codeStyleSkill = await Bun.file(`${process.env.HOME}/.claude/skills/code-style/SKILL.md`).text().catch(() => '')

const SYSTEM_PROMPT = `You are a code review guardian. You receive a git diff of modified TypeScript files.

Here are the code style rules you MUST enforce:

${codeStyleSkill}

IMPORTANT REVIEW CONSTRAINTS:

- The diff may be TRUNCATED at 6000 characters. Do NOT flag a file as "incomplete" or "ends abruptly" — truncation is expected. Only flag actual style violations visible in the diff.

- "Early return" means any control flow that exits the current function/module without executing subsequent code. This includes:
  * \`return\` statement
  * \`process.exit()\` directly
  * Calling a helper function that itself ends with \`process.exit()\` (e.g. a \`deny()\` helper)
  Sequential \`if\` blocks where each calls a process-exiting helper ARE early returns. Do NOT flag them as if-else.

- Only flag patterns you can see explicitly in the diff. Never infer violations from missing context.

EXCEPTION: Files containing TODO(human) comments are coaching placeholders — do NOT flag them.

Output ONLY raw JSON, no markdown, no code fences, no explanation.
Valid outputs (ONLY these two formats, nothing else):
{"ok": true}
{"ok": false, "reason": "[file]: [issue] — [exact code snippet you saw]"}`

const input = await Bun.stdin.json() as {
  hook_event_name: string
  stop_hook_active: boolean
  cwd: string
}

// Prevent infinite loops
if (input.stop_hook_active) {
  process.exit(0)
}

// Get modified files
const namesProc = Bun.spawn(['git', 'diff', 'HEAD', '--name-only', '--diff-filter=ACMR'], {
  cwd: input.cwd,
  stdout: 'pipe',
  stderr: 'pipe',
})
const namesOutput = await new Response(namesProc.stdout).text()
await namesProc.exited

const tsFiles = namesOutput
  .split('\n')
  .filter((f) => f.match(/\.tsx?$/) && !f.includes('node_modules'))

if (tsFiles.length === 0) {
  process.exit(0)
}

// Get the actual diff for TS files only
const diffProc = Bun.spawn(['git', 'diff', 'HEAD', '--', ...tsFiles], {
  cwd: input.cwd,
  stdout: 'pipe',
  stderr: 'pipe',
})
const diffOutput = await new Response(diffProc.stdout).text()
await diffProc.exited

if (!diffOutput.trim()) {
  process.exit(0)
}

// Truncate diff to avoid exceeding token limits
const truncatedDiff = diffOutput.slice(0, 6000)
const wasTruncated = diffOutput.length > 6000

const result = await askLlm(
  SYSTEM_PROMPT,
  `Review this diff${wasTruncated ? ' (TRUNCATED at 6000 chars — do not flag completeness)' : ''}:\n${truncatedDiff}`,
  512,
  '{"',
)

if (!result) {
  process.exit(0)
}

try {
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as { ok: boolean, reason?: string }

  if (parsed.ok) {
    process.exit(0)
  }

  const output = {
    decision: 'block',
    reason: parsed.reason ?? 'Code style violation detected',
  }
  console.log(JSON.stringify(output))
  process.exit(0)
} catch {
  process.exit(0)
}
