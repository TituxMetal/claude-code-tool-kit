// Provider-pluggable LLM client for hooks.
// Defaults to Anthropic Haiku via Claude Max OAuth (current behaviour).
// Set LLM_PROVIDER=deepseek + DEEPSEEK_API_KEY in env to swap to DeepSeek.
//
// Hooks call askLlm() — they never see which provider is active.
// Failure path is fail-open: any error returns null, callers proceed.

const ANTHROPIC_CREDENTIALS_PATH = `${process.env.HOME}/.claude/.credentials.json`
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'
// /beta enables `prefix: true` on the final assistant message (DeepSeek prefix-completion).
// Plain /v1 also works but ignores the prefill.
const DEEPSEEK_URL = 'https://api.deepseek.com/beta/chat/completions'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Provider = 'anthropic' | 'deepseek'

const resolveProvider = (): Provider => {
  const raw = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase()
  if (raw === 'deepseek') return 'deepseek'
  return 'anthropic'
}

const askAnthropic = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  prefill: string | undefined,
  temperature: number
): Promise<string | null> => {
  const creds = await Bun.file(ANTHROPIC_CREDENTIALS_PATH).json()
  const token = creds.claudeAiOauth?.accessToken
  if (!token) return null

  const messages: Message[] = [{ role: 'user', content: userPrompt }]
  if (prefill) messages.push({ role: 'assistant', content: prefill })

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': token,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) return null

  const data = (await response.json()) as { content: Array<{ type: string, text: string }> }
  const text = data.content?.find(b => b.type === 'text')?.text ?? null
  if (text === null) return null
  return prefill ? prefill + text : text
}

const askDeepseek = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  prefill: string | undefined,
  temperature: number
): Promise<string | null> => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return null

  const messages: Array<{ role: string, content: string, prefix?: boolean }> = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
  if (prefill) messages.push({ role: 'assistant', content: prefill, prefix: true })

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages,
    }),
  })

  if (!response.ok) return null

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
  const text = data.choices?.[0]?.message?.content ?? null
  if (text === null) return null
  // DeepSeek prefix-completion already includes the prefill in `content`, but be defensive:
  // if it didn't (e.g. a non-/beta endpoint), prepend it ourselves to match Anthropic shape.
  if (prefill && !text.startsWith(prefill)) return prefill + text
  return text
}

export const askLlm = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 256,
  prefill?: string,
  temperature = 0
): Promise<string | null> => {
  const provider = resolveProvider()
  try {
    if (provider === 'deepseek') {
      return await askDeepseek(systemPrompt, userPrompt, maxTokens, prefill, temperature)
    }
    return await askAnthropic(systemPrompt, userPrompt, maxTokens, prefill, temperature)
  } catch {
    return null
  }
}
