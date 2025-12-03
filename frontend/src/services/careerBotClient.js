const CAREER_BOT_DEFAULT_MODEL = 'gpt-4o-mini'

export const CAREER_BOT_SYSTEM_PROMPT = `You are CareerBot, an economic mobility career coach for Atlanta’s CareerRise organization. 
Focus on five priority sectors: information technology, construction and skilled trades, advanced manufacturing, transportation/distribution/logistics (TDL), and healthcare.
For each response, ground recommendations in current Atlanta metro trends and, when helpful, compare to overall U.S. averages.
Highlight typical salary ranges, job growth or unemployment outlook, in-demand certifications, and education or training pathways. 
Favor concise bullet points, cite relevant local training resources when known, and note if data should be validated for freshness. 
Maintain an encouraging, practical tone that helps job seekers make informed decisions about these industries.
Respond using plain text sentences without Markdown headings, numbered lists, or formatted bullet syntax.`

export const CAREER_BOT_QUICK_PROMPTS = [
  {
    label: 'IT Careers',
    message:
      'Give me an overview of entry-level IT support roles in Atlanta, including typical salaries and certifications.',
  },
  {
    label: 'Healthcare',
    message:
      'What healthcare jobs are growing fastest in Atlanta right now? Include education requirements and wages.',
  },
  {
    label: 'Construction',
    message:
      'What are the best-paying skilled trades in construction around Atlanta and what apprenticeships should I consider?',
  },
  {
    label: 'Manufacturing',
    message:
      'How is advanced manufacturing doing in Atlanta compared to the U.S.? Share typical employers and training paths.',
  },
  {
    label: 'TDL Pathways',
    message:
      'Outline career pathways in transportation, distribution, and logistics in Atlanta with credential recommendations.',
  },
]

function resolveApiKey() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'CareerBot is not configured. Add VITE_OPENAI_API_KEY to your frontend .env file and restart the dev server.',
    )
  }
  return apiKey
}

/**
 * Sends the chat history to OpenAI and returns the assistant's reply.
 * @param {Object} params
 * @param {{role: 'system' | 'user' | 'assistant', content: string}[]} params.messages
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<string>}
 */
export async function sendCareerBotMessage({ messages, signal } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('CareerBot requires at least one message before requesting a response.')
  }

  const apiKey = resolveApiKey()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CAREER_BOT_DEFAULT_MODEL,
      temperature: 0.35,
      max_tokens: 220,
      messages,
    }),
  })

  if (!response.ok) {
    const errorBody = await safeReadJson(response)
    const detail = errorBody?.error?.message || response.statusText || 'Unknown error'
    throw new Error(`CareerBot request failed: ${detail}`)
  }

  const payload = await response.json()
  const reply = payload?.choices?.[0]?.message?.content?.trim()

  if (!reply) {
    throw new Error('CareerBot did not return a response. Please try again.')
  }

  return reply
}

async function safeReadJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}


