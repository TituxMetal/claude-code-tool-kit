import { askLlm } from './llm'

const coachingSkill = await Bun.file(`${process.env.HOME}/.claude/skills/coaching/SKILL.md`).text().catch(() => '')

const SYSTEM_PROMPT = `You check if an AI assistant should stop its current turn. Output ONLY raw JSON, no markdown, no code fences, no explanation.

Here is the coaching methodology the assistant follows:

${coachingSkill}

Based on this methodology, it is OK to stop if ANY of these are true:
- The assistant gave guidance and is waiting for the user to write or fix code (coaching mode)
- The assistant asked a question and is waiting for user response
- All tasks the user asked for are complete
- The assistant provided an answer or explanation the user requested

It is NOT ok to stop if:
- The assistant started a multi-step task and abandoned it midway
- There are unresolved errors that the assistant should fix
- The assistant promised to do something but didn't do it

The context may be in French or English — both are valid. Respond with JSON regardless of context language.

Valid outputs (ONLY these two formats, nothing else):
{"ok": true}
{"ok": false, "reason": "short reason here"}`

const input = await Bun.stdin.json() as {
  hook_event_name: string
  stop_hook_active: boolean
  transcript_path: string
}

// Prevent infinite loops
if (input.stop_hook_active) {
  process.exit(0)
}

// Read the last portion of the transcript for context
let context = ''
try {
  const transcript = await Bun.file(input.transcript_path).text()
  const lines = transcript.split('\n').filter(Boolean)
  // Take last 20 lines for context
  context = lines.slice(-20).join('\n')
} catch {
  // Can't read transcript — allow stop
  process.exit(0)
}

if (!context) {
  process.exit(0)
}

const result = await askLlm(
  SYSTEM_PROMPT,
  `Here is the recent conversation context:\n${context.slice(0, 4000)}`,
  256,
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

  // Block the stop
  const output = {
    decision: 'block',
    reason: parsed.reason ?? 'Work appears incomplete',
  }
  console.log(JSON.stringify(output))
  process.exit(0)
} catch {
  process.exit(0)
}
