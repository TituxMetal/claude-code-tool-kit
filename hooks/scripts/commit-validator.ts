import { askLlm } from './llm'
import { validateCommitMessage } from './validators'

const LOG_FILE = '/tmp/commit-validator.log'

const log = async (msg: string) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  await Bun.write(LOG_FILE, (await Bun.file(LOG_FILE).text().catch(() => '')) + line)
}

// Advisory-only prompt: structural rules are already enforced deterministically
// by validateCommitMessage() in validators.ts. The LLM never blocks — it only
// suggests improvements that get logged. If Haiku (or DeepSeek) hallucinates,
// the hallucination lands in /tmp/commit-validator.log and is harmless.
const ADVISORY_PROMPT = `You are an advisory reviewer for git commit messages.

The structural rules (type/scope/format, lowercase first letter, body presence, no AI signatures) are already enforced before you see the message. DO NOT mention them.

Your job: flag content quality issues that a human reviewer would catch:
- Vague descriptions ("fix stuff", "update code", "changes", "tweaks")
- Body that does not actually list the changed files or describe what changed
- Description and body contradicting each other

Output ONLY raw JSON, no markdown, no code fences. Two possible shapes:
{"ok": true}
{"ok": false, "note": "<short specific suggestion under 120 chars>"}

If in doubt, return {"ok": true}. False positives are worse than missed issues.`

const extractMessage = async (cmd: string): Promise<string | null> => {
  const fileMatch = cmd.match(/-F\s+(\S+)/)
  if (fileMatch && fileMatch[1]) {
    return Bun.file(fileMatch[1]).text().catch(() => null)
  }

  const heredocMatch = cmd.match(/<<\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\b/)
  if (heredocMatch && heredocMatch[2]) return heredocMatch[2]

  const doubleMatch = cmd.match(/-m\s+"([\s\S]*?)"(?:\s|$)/)
  if (doubleMatch && doubleMatch[1]) return doubleMatch[1]

  const singleMatch = cmd.match(/-m\s+'([\s\S]*?)'(?:\s|$)/)
  if (singleMatch && singleMatch[1]) return singleMatch[1]

  return null
}

const deny = (reason: string) => {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }))
  process.exit(0)
}

const input = await Bun.stdin.json() as {
  tool_name: string
  tool_input: { command?: string }
}

if (input.tool_name !== 'Bash' || !input.tool_input?.command) process.exit(0)

const cmd = input.tool_input.command
if (!cmd.includes('git commit') && !cmd.includes('git -c')) process.exit(0)

// Skip amends — the original commit was already validated.
if (cmd.includes('--amend')) process.exit(0)

const message = await extractMessage(cmd)

await log(`Command: ${cmd}`)
await log(`Extracted message: ${message}`)

if (!message) {
  await log('Could not extract message, allowing')
  process.exit(0)
}

// === Layer 1: deterministic regex (BLOCKING) ===
const structural = validateCommitMessage(message)
if (!structural.ok) {
  await log(`[regex] DENY: ${structural.reason}`)
  deny(structural.reason)
}

await log('[regex] PASS')

// === Layer 2: LLM advisory (NEVER blocks) ===
const result = await askLlm(ADVISORY_PROMPT, `Review this commit message:\n\n${message}`, 256, '{"')
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
