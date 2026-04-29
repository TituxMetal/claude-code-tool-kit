import { describe, expect, test } from 'bun:test'

import { findCodeStyleViolations, validateCommitMessage } from './validators'

// Reference fixture: the exact false positives Haiku triggered on
// commit-validator during the 2026-04-29 ship session.
const SESSION_FALSE_POSITIVES = [
  'feat(web:check-logs): add picker mode to LogCheckDialog for dashboard quick-log',
  'feat(web:check-logs): support picker mode in LogCheckDialog for dashboard quick-log',
  'feat(web:check-logs): wire picker mode into LogCheckDialog for dashboard quick-log'
]

describe('validateCommitMessage — valid', () => {
  test('passes the canonical example from git-workflow skill', () => {
    const msg = `feat(users): add User entity with behavior methods

- User.entity.ts: getFullName(), isActive()
- User.entity.spec.ts: unit tests for all methods`
    expect(validateCommitMessage(msg)).toEqual({ ok: true })
  })

  test.each(SESSION_FALSE_POSITIVES)(
    'passes session false positive: %s',
    subject => {
      const msg = `${subject}\n\n- LogCheckDialog.tsx: picker mode wiring\n- LogCheckDialog.spec.tsx: tests`
      expect(validateCommitMessage(msg)).toEqual({ ok: true })
    }
  )

  test('passes a scope without parens (no scope at all)', () => {
    const msg = 'fix: correct token validation\n\n- Auth.service.ts: fix expiration check'
    expect(validateCommitMessage(msg)).toEqual({ ok: true })
  })

  test('passes a scope containing colon (web:check-logs)', () => {
    const msg = 'feat(web:check-logs): add picker mode\n\n- LogCheckDialog.tsx: change'
    expect(validateCommitMessage(msg)).toEqual({ ok: true })
  })

  test('passes a scope containing slash and dash', () => {
    const msg = 'docs(visual-refresh): close Block 5\n\n- PROGRESS.md: tick boxes'
    expect(validateCommitMessage(msg)).toEqual({ ok: true })
  })

  test.each(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build'])(
    'accepts allowed type: %s',
    type => {
      const msg = `${type}(api): something happens here\n\n- file.ts: details`
      expect(validateCommitMessage(msg)).toEqual({ ok: true })
    }
  )
})

describe('validateCommitMessage — invalid', () => {
  test('rejects empty message', () => {
    expect(validateCommitMessage('')).toEqual({ ok: false, reason: 'commit message is empty' })
  })

  test('rejects uppercase first description letter', () => {
    const result = validateCommitMessage('feat(api): Add user auth\n\n- file.ts: change')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/lowercase/)
  })

  test('rejects unknown type', () => {
    const result = validateCommitMessage('foo(api): add thing\n\n- file.ts: change')
    expect(result.ok).toBe(false)
  })

  test('rejects missing body', () => {
    const result = validateCommitMessage('feat(api): add user auth')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/body is empty/)
  })

  test('rejects Co-Authored-By signature', () => {
    const msg = 'feat(api): add foo\n\n- file.ts: change\n\nCo-Authored-By: Claude'
    const result = validateCommitMessage(msg)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/signature/)
  })

  test('rejects "Generated with" signature', () => {
    const msg = 'feat(api): add foo\n\n- file.ts: change\n\nGenerated with Claude Code'
    expect(validateCommitMessage(msg).ok).toBe(false)
  })

  test('rejects subject without colon', () => {
    expect(validateCommitMessage('feat add foo\n\n- file.ts: change').ok).toBe(false)
  })
})

describe('findCodeStyleViolations — clean', () => {
  test('passes a clean TypeScript diff', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+import { useState } from 'react'
+
+const Foo = () => {
+  const [a, setA] = useState(0)
+  return a
+}`
    expect(findCodeStyleViolations(diff)).toEqual({ ok: true })
  })

  test('passes when diff is empty', () => {
    expect(findCodeStyleViolations('')).toEqual({ ok: true })
  })

  test('skips entirely when TODO(human) marker is present (coaching scaffold)', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+function placeholder() {
+  // TODO(human): implement this
+  return null;
+}`
    expect(findCodeStyleViolations(diff)).toEqual({ ok: true })
  })

  test('does not flag a semicolon inside a single-line comment', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+// note: trailing semicolon; intentional in this comment
+const x = 1`
    expect(findCodeStyleViolations(diff)).toEqual({ ok: true })
  })
})

describe('findCodeStyleViolations — flagged', () => {
  test('flags a trailing semicolon in code', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+const x = 1;
+const y = 2`
    const result = findCodeStyleViolations(diff)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/semicolon/)
  })

  test('flags the function keyword', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+function foo() {
+  return 1
+}`
    const result = findCodeStyleViolations(diff)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/function/)
  })

  test('flags an async function declaration', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+async function fetchUser(id: string) {
+  return await api.get(id)
+}`
    expect(findCodeStyleViolations(diff).ok).toBe(false)
  })

  test('flags a .then() chain', () => {
    const diff = `diff --git a/foo.ts b/foo.ts
+const data = fetch('/api').then(r => r.json())`
    const result = findCodeStyleViolations(diff)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/then/)
  })
})
