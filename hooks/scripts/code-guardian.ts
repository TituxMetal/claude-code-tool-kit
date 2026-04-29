import { askLlm } from './llm'
import { findCodeStyleViolations } from './validators'

const LOG_FILE = '/tmp/code-guardian.log'

const log = async (msg: string) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  await Bun.write(LOG_FILE, (await Bun.file(LOG_FILE).text().catch(() => '')) + line)
}

// Advisory-only prompt: trivial deterministic patterns (function keyword,
// .then(), trailing semicolons) are enforced by findCodeStyleViolations()
// before this prompt is reached. The LLM is here for the harder, control-flow
// rules the skill mentions but regex cannot reliably express — chiefly the
// "early return vs if-else" nuance.
const codeStyleSkill = await Bun
  .file(`${process.env.HOME}/.claude/skills/code-style/SKILL.md`)
  .text()
  .catch(() => '')

const ADVISORY_PROMPT = `You are an advisory code-style reviewer for a TypeScript diff.

Trivial mechanical rules (no semicolons, no \`function\` keyword, no \`.then()\`) are already enforced deterministically before you see the diff. DO NOT mention them.

Your job: flag the harder, control-flow patterns described in the project's code-style skill, especially "early return vs if-else":

${codeStyleSkill}

REVIEW CONSTRAINTS:
- The diff may be TRUNCATED at 6000 characters. Truncation is expected — do NOT flag completeness.
- Only flag patterns explicitly visible in the diff. Never infer violations from missing context.
- Sequential \`if\` blocks where each calls a process-exiting helper (e.g. \`return\`, \`process.exit()\`, a \`deny()\` helper) ARE early returns. Do NOT flag them as if-else.
- Files containing \`TODO(human)\` are coaching scaffolds. DO NOT flag them.

Output ONLY raw JSON, no markdown:
{"ok": true}
{"ok": false, "note": "<short specific suggestion under 160 chars, including a code snippet you saw>"}

If in doubt, return {"ok": true}. False positives are worse than missed issues.`

const input = await Bun.stdin.json() as {
  hook_event_name: string
  stop_hook_active: boolean
  cwd: string
}

if (input.stop_hook_active) process.exit(0)

const namesProc = Bun.spawn(['git', 'diff', 'HEAD', '--name-only', '--diff-filter=ACMR'], {
  cwd: input.cwd,
  stdout: 'pipe',
  stderr: 'pipe',
})
const namesOutput = await new Response(namesProc.stdout).text()
await namesProc.exited

const tsFiles = namesOutput
  .split('\n')
  .filter(f => f.match(/\.tsx?$/) && !f.includes('node_modules'))

if (tsFiles.length === 0) process.exit(0)

const diffProc = Bun.spawn(['git', 'diff', 'HEAD', '--', ...tsFiles], {
  cwd: input.cwd,
  stdout: 'pipe',
  stderr: 'pipe',
})
const diffOutput = await new Response(diffProc.stdout).text()
await diffProc.exited

if (!diffOutput.trim()) process.exit(0)

const truncatedDiff = diffOutput.slice(0, 6000)
const wasTruncated = diffOutput.length > 6000

await log(`Files: ${tsFiles.length} (truncated=${wasTruncated})`)

// === Layer 1: deterministic regex (BLOCKING) ===
const structural = findCodeStyleViolations(truncatedDiff)
if (!structural.ok) {
  await log(`[regex] BLOCK: ${structural.reason}`)
  console.log(JSON.stringify({ decision: 'block', reason: structural.reason }))
  process.exit(0)
}

await log('[regex] PASS')

// === Layer 2: LLM advisory (NEVER blocks) ===
const result = await askLlm(
  ADVISORY_PROMPT,
  `Review this diff${wasTruncated ? ' (TRUNCATED at 6000 chars — do not flag completeness)' : ''}:\n${truncatedDiff}`,
  512,
  '{"'
)

if (!result) {
  await log('[advisory] LLM unavailable, allowing')
  process.exit(0)
}

try {
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as { ok: boolean, note?: string }
  if (parsed.ok) {
    await log('[advisory] OK')
    process.exit(0)
  }
  await log(`[advisory] NOTE (non-blocking): ${parsed.note ?? '(no note)'}`)
  process.exit(0)
} catch (e) {
  await log(`[advisory] Parse error (non-blocking): ${e}`)
  process.exit(0)
}
