import { useEffect, useRef, useState } from 'react'
import {
  CAREER_BOT_QUICK_PROMPTS,
  CAREER_BOT_SYSTEM_PROMPT,
  sendCareerBotMessage,
} from '../services/careerBotClient.js'
import './CareerBot.css'

const INTRO_MESSAGE =
  'Hi, I’m CareerBot. Ask me about high-opportunity careers in Atlanta across IT, healthcare, construction, manufacturing, or transportation/logistics. I can share salary ranges, training options, and how Atlanta compares to national trends.'

function toPlainText(markdown) {
  if (!markdown) return ''
  return markdown
    .replace(/```[\s\S]*?```/g, '') // remove fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/^#{1,6}\s*/gm, '') // headings
    .replace(/^\s*[-*+]\s+/gm, '- ') // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '- ') // ordered lists
    .replace(/^\s*>+\s?/gm, '') // blockquotes
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1') // italics
    .replace(/_(.*?)_/g, '$1')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function CareerBot() {
  const hasApiKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY)
  const [messages, setMessages] = useState([
    { id: 'intro', role: 'assistant', content: INTRO_MESSAGE },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isLoading])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return
    await submitPrompt(trimmed)
  }

  const submitPrompt = async (prompt) => {
    if (!hasApiKey) {
      setError('CareerBot is not configured yet. Add your VITE_OPENAI_API_KEY to the .env file.')
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInputValue('')
    setIsLoading(true)
    setError('')

    try {
      const apiMessages = [
        { role: 'system', content: CAREER_BOT_SYSTEM_PROMPT },
        ...nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ]

      const reply = await sendCareerBotMessage({ messages: apiMessages })
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: toPlainText(reply),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const friendlyMessage =
        err instanceof Error ? err.message : 'Something went wrong while contacting CareerBot.'
      setError(friendlyMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'I had trouble reaching the CareerBot service. Please double-check the API key and try again.',
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (message) => {
    if (isLoading) return
    submitPrompt(message)
  }

  const handleChange = (event) => {
    setInputValue(event.target.value)
  }

  return (
    <section className="page-section careerbot-page">
      <header className="careerbot-header">
        <div>
          <h1>CareerBot</h1>
          <p>
            Personalized guidance across Atlanta’s five target industries — IT, construction,
            manufacturing, transportation/logistics, and healthcare. Ask questions, compare Atlanta
            trends to national averages, and explore training pathways.
          </p>
        </div>
        {!hasApiKey && (
          <div className="careerbot-alert" role="status">
            Add <code>VITE_OPENAI_API_KEY</code> to <code>frontend/.env</code>, then restart
            Vite to enable the chatbot.
          </div>
        )}
        {error && hasApiKey && (
          <div className="careerbot-alert careerbot-alert--error" role="alert">
            {error}
          </div>
        )}
      </header>
      <div className="careerbot-quick-prompts">
        {CAREER_BOT_QUICK_PROMPTS.map(({ label, message }) => (
          <button
            key={label}
            type="button"
            className="careerbot-chip"
            onClick={() => handleQuickPrompt(message)}
            disabled={isLoading || !hasApiKey}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="careerbot-chat">
        <div className="careerbot-messages" ref={scrollRef}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={[
                'careerbot-message',
                `careerbot-message--${message.role}`,
                message.isError ? 'careerbot-message--error' : '',
              ]
                .join(' ')
                .trim()}
            >
              <div className="careerbot-message__label">
                {message.role === 'user' ? 'You' : 'CareerBot'}
              </div>
              <div className="careerbot-message__content">{message.content}</div>
            </article>
          ))}
          {isLoading && (
            <div className="careerbot-message careerbot-message--assistant careerbot-message--typing">
              <div className="careerbot-message__label">CareerBot</div>
              <div className="careerbot-message__content" aria-live="polite">
                <span className="careerbot-typing-dot" />
                <span className="careerbot-typing-dot" />
                <span className="careerbot-typing-dot" />
              </div>
            </div>
          )}
        </div>
        <form className="careerbot-input" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={
              hasApiKey
                ? 'Ask about salaries, training, certifications, or industry trends...'
                : 'Add your OpenAI API key to enable CareerBot.'
            }
            value={inputValue}
            onChange={handleChange}
            disabled={isLoading || !hasApiKey}
            aria-disabled={!hasApiKey}
          />
          <button
            type="submit"
            disabled={!hasApiKey || isLoading || !inputValue.trim()}
            className="careerbot-send"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="careerbot-disclaimer">
          CareerBot offers guidance based on recent labor-market intelligence for Atlanta&apos;s key
          industries. Always verify training requirements and salary data with current sources.
        </p>
      </div>
    </section>
  )
}

export default CareerBot


