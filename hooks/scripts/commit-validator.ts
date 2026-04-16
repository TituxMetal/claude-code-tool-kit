import { askLlm } from './llm'

const LOG_FILE = '/tmp/commit-validator.log'

const log = async (msg: string) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  await Bun.write(LOG_FILE, (await Bun.file(LOG_FILE).text().catch(() => '')) + line)
}

const SYSTEM_PROMPT = `You validate git commit messages. Output ONLY raw JSON, no markdown, no code fences, no explanation.

Rules (FAIL on any violation):

1. First line format: "type(scope): description"
   - Allowed types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
   - The description (the text AFTER "type(scope): ") MUST start with a lowercase letter
   - Do not flag the body content for casing — only the description on the first line matters for case

2. The body MUST exist and contain a "Files:" section followed by lines starting with "- "

3. The body MUST NOT contain any of these signatures: "Co-Authored-By", "Generated with", "Signed-off-by", "Claude Code"

Output formats (NOTHING else allowed):
{"ok": true}
{"ok": false, "reason": "<specific reason quoting the exact violating text>"}

When you flag a violation, quote the EXACT character sequence you read from the message. Do not paraphrase or correct.`

const extractMessage = async (cmd: string): Promise<string | null> => {
  // -F file
  const fileMatch = cmd.match(/-F\s+(\S+)/)
  if (fileMatch && fileMatch[1]) {
    return Bun.file(fileMatch[1]).text().catch(() => null)
  }

  // heredoc form: -m "$(cat <<'EOF' ... EOF)"
  const heredocMatch = cmd.match(/<<\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\b/)
  if (heredocMatch && heredocMatch[2]) {
    return heredocMatch[2]
  }

  // -m "..." with double quotes
  const doubleMatch = cmd.match(/-m\s+"([\s\S]*?)"(?:\s|$)/)
  if (doubleMatch && doubleMatch[1]) {
    return doubleMatch[1]
  }

  // -m '...' with single quotes
  const singleMatch = cmd.match(/-m\s+'([\s\S]*?)'(?:\s|$)/)
  if (singleMatch && singleMatch[1]) {
    return singleMatch[1]
  }

  return null
}

const input = await Bun.stdin.json() as {
  tool_name: string
  tool_input: { command?: string }
}

// Fast path: not a Bash tool or no command
if (input.tool_name !== 'Bash' || !input.tool_input?.command) {
  process.exit(0)
}

const cmd = input.tool_input.command

// Fast path: not a git commit command
if (!cmd.includes('git commit') && !cmd.includes('git -c') ) {
  process.exit(0)
}

// Fast path: skip all amends — the original commit was already validated
if (cmd.includes('--amend')) {
  process.exit(0)
}

const message = await extractMessage(cmd)

await log(`Command: ${cmd}`)
await log(`Extracted message: ${message}`)

if (!message) {
  await log('Could not extract message, allowing')
  process.exit(0)
}

const result = await askLlm(SYSTEM_PROMPT, `Validate this commit message:\n\n${message}`, 256, '{"')

await log(`LLM response: ${result}`)

if (!result) {
  await log('LLM unavailable, allowing')
  process.exit(0)
}

try {
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as { ok: boolean, reason?: string }

  await log(`Parsed: ok=${parsed.ok}, reason=${parsed.reason}`)

  if (parsed.ok) {
    process.exit(0)
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: parsed.reason ?? 'Commit message does not follow conventions',
    },
  }
  console.log(JSON.stringify(output))
  process.exit(0)
} catch (e) {
  await log(`Parse error: ${e}`)
  process.exit(0)
}
