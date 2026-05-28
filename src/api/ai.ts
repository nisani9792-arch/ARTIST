import { request } from './client'

export type AiChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type AiActionResult = {
  ok: boolean
  summary: string
  artist?: unknown
  artists?: unknown[]
  count?: number
}

export type AiChatResponse = {
  reply: string
  actions: unknown[]
  results: AiActionResult[]
  configured: boolean
}

export const fetchAiStatus = () =>
  request<{ configured: boolean }>('/api/ai/status')

export const sendAiChat = async (message: string, history: AiChatTurn[] = []) =>
  request<AiChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })
