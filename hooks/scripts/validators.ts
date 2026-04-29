// Pure regex validators for hook pre-flight checks.
// No I/O, no LLM, no side effects. Deterministic and testable.
// These are the load-bearing layer: when they reject, the hook blocks.
// The LLM in llm.ts is advisory only and never blocks on its own.

export type ValidationResult = { ok: true } | { ok: false, reason: string }

const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build'] as const
const TYPES_PATTERN = COMMIT_TYPES.join('|')

// type(scope): description    — scope is optional, description must start lowercase
const SUBJECT_REGEX = new RegExp(`^(${TYPES_PATTERN})(\\(([\\w:./-]+)\\))?: ([a-z].*)$`)
const TYPE_PREFIX_REGEX = new RegExp(`^(${TYPES_PATTERN})(\\([^)]*\\))?:\\s*(.*)$`)
const FORBIDDEN_SIGNATURES = /Co-Authored-By|Generated with|Signed-off-by|Claude Code|🤖/i

export const validateCommitMessage = (raw: string): ValidationResult => {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: 'commit message is empty' }

  const lines = trimmed.split('\n')
  const subject = lines[0] ?? ''

  if (!SUBJECT_REGEX.test(subject)) {
    // Try to give a precise reason
    const prefixMatch = subject.match(TYPE_PREFIX_REGEX)
    if (prefixMatch) {
      const description = prefixMatch[3] ?? ''
      if (!description) {
        return { ok: false, reason: `subject has no description after "${prefixMatch[1]}: " — got: ${JSON.stringify(subject)}` }
      }
      const firstChar = description.charAt(0)
      if (firstChar && firstChar !== firstChar.toLowerCase()) {
        return { ok: false, reason: `description must start with lowercase, got "${firstChar}" in: ${JSON.stringify(description)}` }
      }
    }
    return {
      ok: false,
      reason: `subject must match "type(scope): description" where type is one of [${COMMIT_TYPES.join(', ')}] and description starts with lowercase — got: ${JSON.stringify(subject)}`
    }
  }

  const body = lines.slice(1).join('\n').trim()
  if (!body) {
    return { ok: false, reason: 'commit body is empty — list the changed files (e.g. "- filename: what changed")' }
  }

  if (FORBIDDEN_SIGNATURES.test(body)) {
    return { ok: false, reason: 'commit body contains forbidden AI / co-author signature' }
  }

  return { ok: true }
}

// Code-style regex layer: only catches *trivial* deterministic patterns.
// Subtler rules (early-return vs if-else, control-flow nuance) stay with the LLM advisory.
const ADDED_LINE_PREFIX = String.raw`^\+(?!\+\+)`
const NOT_LINE_COMMENT = String.raw`(?!\s*\/\/)(?!\s*\*)(?!\s*\/\*)`
const SEMI_AT_EOL = new RegExp(`${ADDED_LINE_PREFIX}${NOT_LINE_COMMENT}.*[^\\s];\\s*$`, 'm')
const FUNCTION_KW = new RegExp(`${ADDED_LINE_PREFIX}.*\\bfunction\\b\\s*\\*?\\s*[\\w$]*\\s*\\(`, 'm')
const THEN_CHAIN = new RegExp(`${ADDED_LINE_PREFIX}.*\\.then\\s*\\(`, 'm')

export const findCodeStyleViolations = (diff: string): ValidationResult => {
  // Coaching scaffolds carry intentional placeholders — skip the deterministic layer.
  // The LLM advisory still runs and can comment if it wants.
  if (diff.includes('TODO(human)')) return { ok: true }

  const semi = diff.match(SEMI_AT_EOL)
  if (semi) return { ok: false, reason: `trailing semicolon forbidden — saw: ${semi[0].trim()}` }

  const fn = diff.match(FUNCTION_KW)
  if (fn) return { ok: false, reason: `"function" keyword forbidden, use arrow function — saw: ${fn[0].trim()}` }

  const then = diff.match(THEN_CHAIN)
  if (then) return { ok: false, reason: `.then() forbidden, use async/await — saw: ${then[0].trim()}` }

  return { ok: true }
}
