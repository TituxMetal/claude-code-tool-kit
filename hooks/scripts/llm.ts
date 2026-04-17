const CREDENTIALS_PATH = `${process.env.HOME}/.claude/.credentials.json`
const MODEL = 'claude-haiku-4-5-20251001'
const API_URL = 'https://api.anthropic.com/v1/messages'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export const askLlm = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 256,
  prefill?: string,
  temperature = 0,
): Promise<string | null> => {
  try {
    const creds = await Bun.file(CREDENTIALS_PATH).json()
    const token = creds.claudeAiOauth?.accessToken

    if (!token) return null

    const messages: Message[] = [{ role: 'user', content: userPrompt }]
    if (prefill) messages.push({ role: 'assistant', content: prefill })

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': token,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) return null

    const data = await response.json() as { content: Array<{ type: string, text: string }> }
    const text = data.content?.find((b) => b.type === 'text')?.text ?? null

    if (text === null) return null
    return prefill ? prefill + text : text
  } catch {
    return null
  }
}
