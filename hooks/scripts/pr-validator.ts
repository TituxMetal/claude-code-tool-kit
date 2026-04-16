import { askLlm } from './llm'

const input = await Bun.stdin.json() as {
  tool_name: string
  tool_input: { command?: string, description?: string }
}

if (input.tool_name !== 'Bash' || !input.tool_input?.command) {
  process.exit(0)
}

const cmd = input.tool_input.command
const description = input.tool_input.description ?? ''

if (!cmd.includes('gh pr create')) {
  process.exit(0)
}

const hardIssues: string[] = []
const contextualIssues: string[] = []

// title checks
const titleMatch = cmd.match(/--title\s+["']([^"']+)["']/)
if (titleMatch) {
  const title = titleMatch[1]!

  // diminutifs — hard deny
  const diminutifs = [
    { pattern: /^feat[\s:(]/, full: 'feature' },
    { pattern: /^docs?[\s:(]/, full: 'documentation' },
    { pattern: /^ref[\s:(]/, full: 'refactor' },
  ]
  for (const { pattern, full } of diminutifs) {
    if (pattern.test(title)) {
      hardIssues.push(`Title uses diminutif — use "${full}" instead of abbreviated form`)
    }
  }

  // title format — hard deny
  const conventionalTitlePattern = /^(feature|fix|refactor|documentation|style|test|chore|perf|ci|build)\s*[\s:(]/i
  if (!conventionalTitlePattern.test(title)) {
    hardIssues.push('PR title must start with a full type word: feature, fix, refactor, documentation, style, test, chore, perf, ci, build')
  }

  // lowercase description — hard deny
  const descMatch = title.match(/^(?:feature|fix|refactor|documentation|style|test|chore|perf|ci|build)\s*(?:\([^)]*\))?\s*[:]\s*(.)/i)
  if (descMatch && descMatch[1] !== descMatch[1]!.toLowerCase()) {
    hardIssues.push('PR title description must start with a lowercase letter')
  }
}

// missing --assignee — hard deny
if (!cmd.includes('--assignee')) {
  hardIssues.push('Missing --assignee @me')
}

// fewer than 2 labels — hard deny
const labelMatches = cmd.match(/--label\s+["']?[^"'\s]+["']?/g)
const labelCount = labelMatches?.length ?? 0
if (labelCount < 2) {
  hardIssues.push(`Need at least 2 labels (found ${labelCount}). Choose from: enhancement, fix, documentation, bug, audit, consistency, coaching, priority:high, priority:medium — or create new relevant ones`)
}

// signatures in body — hard deny
const bodyStart = cmd.indexOf('--body')
if (bodyStart !== -1) {
  const bodyContent = cmd.slice(bodyStart)
  const signatures = ['Co-Authored-By', 'Generated with', 'Signed-off-by', 'Claude Code']
  for (const sig of signatures) {
    if (bodyContent.includes(sig)) {
      hardIssues.push(`PR body contains forbidden signature: "${sig}"`)
    }
  }
}

// empty body — hard deny
const emptyBodyMatch = cmd.match(/--body\s+["']\s*["']/)
if (emptyBodyMatch) {
  hardIssues.push('PR body is empty. Add a meaningful description of the changes.')
}

// Hard issues block immediately, no justification possible
if (hardIssues.length > 0) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: hardIssues.join('. '),
    },
  }))
  process.exit(0)
}

// --base main or no --base — contextual, Haiku evaluates justification
const baseMatch = cmd.match(/--base\s+["']?([^"'\s]+)/)
if (!baseMatch) {
  contextualIssues.push('No --base specified (defaults to main). Convention says PR to develop.')
}
if (baseMatch && baseMatch[1] === 'main') {
  contextualIssues.push('PR targets main. Convention says PR to develop.')
}

if (contextualIssues.length > 0) {
  if (!description) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: contextualIssues.join('. ') + '. Provide a justification in your tool description and retry.',
      },
    }))
    process.exit(0)
  }

  const result = await askLlm(
    'You evaluate if a PR base branch convention violation is justified. Output ONLY raw JSON: {"ok":true} or {"ok":false,"reason":"short reason"}',
    `Convention: PRs should target develop, not main.\nViolation: ${contextualIssues.join('. ')}\nJustification: "${description}"\n\nApprove only if the justification clearly explains why targeting main is necessary (e.g., production hotfix, project without develop branch, documentation-only repo).`,
    256,
    '{"',
  )

  if (!result) {
    process.exit(0)
  }

  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned) as { ok: boolean, reason?: string }
    if (!parsed.ok) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: parsed.reason ?? 'Justification for targeting main was not accepted.',
        },
      }))
      process.exit(0)
    }
  } catch {
    process.exit(0)
  }
}

process.exit(0)
