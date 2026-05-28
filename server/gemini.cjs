const { GoogleGenerativeAI } = require('@google/generative-ai')

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const geminiApiKey = () =>
  String(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      '',
  ).trim()

const isGeminiConfigured = () => geminiApiKey().length > 10

const extractJsonBlock = (value) => {
  const trimmed = String(value ?? '').trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('Gemini response does not include JSON block')
  }
  return trimmed.slice(first, last + 1)
}

const getGenerativeModel = (options = {}) => {
  const apiKey = geminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    ...options,
  })
}

/**
 * @param {Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>} history
 * @param {string} userMessage
 */
const chatWithGemini = async (history, userMessage, systemInstruction) => {
  const model = getGenerativeModel({
    systemInstruction,
    generationConfig: {
      temperature: 0.35,
      responseMimeType: 'application/json',
    },
  })

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  const text = result.response.text()
  return JSON.parse(extractJsonBlock(text))
}

module.exports = {
  MODEL_NAME,
  chatWithGemini,
  extractJsonBlock,
  geminiApiKey,
  getGenerativeModel,
  isGeminiConfigured,
}
