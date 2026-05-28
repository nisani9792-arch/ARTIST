import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchAiStatus, sendAiChat, type AiChatTurn } from '../api/ai'
import { artistsKeys } from '../features/artists/useArtistsQuery'
import { useToast } from '../hooks/useToast'

const STARTER_PROMPTS = [
  'הוסף את אומן חדש בשם ... כלא חתום',
  'שנה את סטטוס חנן בן ארי לחתום תחת אלעזר מרקס',
  'כמה אומנים חתומים יש במערכת?',
  'הצג 5 אומנים פופולריים שלא חתומים',
]

type ArtistAiChatProps = {
  operatorName: string
}

export const ArtistAiChat = ({ operatorName }: ArtistAiChatProps) => {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<AiChatTurn[]>([
    {
      role: 'assistant',
      content: `שלום ${operatorName}! אני העוזר החכם של JUSIC ARTIST. אפשר לבקש ממני להוסיף אומן, לשנות סטטוס, לשייך מטפל, או לחפש ברשימה.`,
    },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: aiStatus } = useQuery({
    queryKey: ['ai', 'status'],
    queryFn: fetchAiStatus,
    staleTime: 60_000,
  })

  const chatMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: AiChatTurn[] }) =>
      sendAiChat(message, history),
    onSuccess: async (result) => {
      const summaries = result.results
        .filter((r) => r.summary && r.summary !== 'ללא שינוי')
        .map((r) => `• ${r.summary}`)
        .join('\n')
      const content = summaries ? `${result.reply}\n\n${summaries}` : result.reply
      setTurns((prev) => [...prev, { role: 'assistant', content }])
      const changed = result.results.some((r) => r.ok && r.summary !== 'ללא שינוי')
      if (changed) {
        await queryClient.invalidateQueries({ queryKey: artistsKeys.all, refetchType: 'active' })
        pushToast('המערכת עודכנה לפי בקשתך', 'success')
      }
    },
    onError: (error) => {
      const text = error instanceof Error ? error.message : 'שגיאה בתקשורת עם AI'
      setTurns((prev) => [...prev, { role: 'assistant', content: text }])
      pushToast(text, 'error')
    },
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, chatMutation.isPending])

  const submit = (text: string) => {
    const message = text.trim()
    if (!message || chatMutation.isPending) return

    const history = turns.filter((t) => t.role === 'user' || t.role === 'assistant')
    setTurns((prev) => [...prev, { role: 'user', content: message }])
    setInput('')
    chatMutation.mutate({ message, history })
  }

  return (
    <>
      <button
        type="button"
        className={`ai-chat-fab ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title="עוזר AI"
      >
        <Sparkles size={20} />
        <span>AI</span>
      </button>

      {open && (
        <section className="ai-chat-panel" aria-label="צ׳אט AI לניהול אומנים">
          <header className="ai-chat-header">
            <div>
              <Bot size={18} />
              <strong>עוזר אומנים חכם</strong>
              <span className={`ai-chat-status ${aiStatus?.configured ? 'on' : 'off'}`}>
                {aiStatus?.configured ? 'Gemini מחובר' : 'Gemini לא מוגדר'}
              </span>
            </div>
            <button type="button" className="btn btn-icon" onClick={() => setOpen(false)} aria-label="סגור">
              <X size={16} />
            </button>
          </header>

          <div className="ai-chat-messages" ref={scrollRef}>
            {turns.map((turn, index) => (
              <div key={`${turn.role}-${index}`} className={`ai-chat-bubble ${turn.role}`}>
                {turn.content}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="ai-chat-bubble assistant ai-chat-typing">חושב...</div>
            )}
          </div>

          <div className="ai-chat-starters">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chip-filter"
                onClick={() => submit(prompt)}
                disabled={chatMutation.isPending}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="ai-chat-input-row"
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="לדוגמה: הוסף את ___ כחתום תחת אלעזר מרקס..."
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={chatMutation.isPending || !input.trim()}
              aria-label="שלח"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
