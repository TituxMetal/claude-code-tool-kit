import { askLlm } from './llm'

const input = await Bun.stdin.json() as {
  tool_name: string
  tool_input: { command?: string, description?: string }
  cwd: string
}

if (input.tool_name !== 'Bash' || !input.tool_input?.command) {
  process.exit(0)
}

const cmd = input.tool_input.command
const description = input.tool_input.description ?? ''

// Only match explicit branch creation commands, nothing else
const createMatch = cmd.match(/git\s+(?:checkout\s+-[bB]|switch\s+-[cC])\s+["']?([a-zA-Z0-9_./-]+)/)

if (!createMatch) {
  process.exit(0)
}

const branchName = createMatch[1]!

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

// Hard deny: diminutifs — no justification possible
if (branchName.startsWith('feat/')) {
  deny(`Use "feature/" not "feat/" — no diminutifs. Rename to: feature/${branchName.slice(5)}`)
}

// Contextual: no standard prefix — ask Haiku if justified
if (!branchName.startsWith('feature/') && !branchName.startsWith('fix/') && branchName !== 'develop') {
  if (!description) {
    deny(`Branch "${branchName}" does not follow convention (feature/* or fix/*). Provide a justification in your tool description and retry.`)
  }

  const result = await askLlm(
    'You evaluate if a git branch name convention violation is justified. Output ONLY raw JSON: {"ok":true} or {"ok":false,"reason":"short reason"}',
    `Convention: branches must use feature/* or fix/* prefix.\nBranch: "${branchName}"\nJustification: "${description}"\n\nIs this justification valid? Approve only if the justification clearly explains why this project or situation requires a non-standard branch name.`,
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
      deny(parsed.reason ?? `Branch "${branchName}" does not follow convention and justification was not accepted.`)
    }
  } catch {
    process.exit(0)
  }
}

// Contextual: branching from non-develop — ask Haiku if justified
const currentBranchProc = Bun.spawn(['git', 'branch', '--show-current'], {
  cwd: input.cwd,
  stdout: 'pipe',
  stderr: 'pipe',
})
const currentBranch = (await new Response(currentBranchProc.stdout).text()).trim()
await currentBranchProc.exited

if (currentBranch && currentBranch !== 'develop' && (branchName.startsWith('feature/') || branchName.startsWith('fix/'))) {
  if (!description) {
    deny(`Creating "${branchName}" from "${currentBranch}" instead of "develop". Provide a justification in your tool description and retry.`)
  }

  const result = await askLlm(
    'You evaluate if branching from a non-standard base branch is justified. Output ONLY raw JSON: {"ok":true} or {"ok":false,"reason":"short reason"}',
    `Convention: feature/fix branches should be based on develop.\nBranch: "${branchName}" from "${currentBranch}"\nJustification: "${description}"\n\nIs this justification valid? Approve only if the justification clearly explains why branching from "${currentBranch}" is necessary.`,
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
      deny(parsed.reason ?? `Branching from "${currentBranch}" was not justified.`)
    }
  } catch {
    process.exit(0)
  }
}

process.exit(0)
