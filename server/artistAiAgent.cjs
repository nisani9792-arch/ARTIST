const {
  createArtist,
  getArtistById,
  getStats,
  searchArtists,
  updateArtist,
  bulkUpdateArtists,
} = require('./db.cjs')
const { chatWithGemini, isGeminiConfigured } = require('./gemini.cjs')
const { BUCKETS } = require('./artistBuckets.cjs')
const SIGNED_HANDLER = 'אלעזר מרקס'

const priority = (status) => {
  if (status === 'signed') return 'שימור קשר'
  if (status === 'in_process') return 'פתיחת חסם'
  return 'ליצירת קשר'
}

const SYSTEM_PROMPT = `אתה עוזר CRM חכם למערכת JUSIC ARTIST לניהול אומנים ישראלים (חתומים / לא חתומים / תקועים).
ענה תמיד בעברית, בצורה קצרה ומקצועית.
החזר JSON בלבד במבנה:
{
  "reply": "תשובה למשתמש בעברית",
  "actions": [
    {
      "type": "create_artist" | "update_artist" | "bulk_update_status" | "search_artists" | "none",
      "params": { }
    }
  ]
}

כללי פעולה:
- create_artist: { nameHe, nameEn?, status?: signed|unsigned|in_process, owner?, bucket?: popular|main|outside_genre, genres?: string[], tags?: string[], notes? }
  אם status=signed שייך owner לברירת מחדל "${SIGNED_HANDLER}" אלא אם צוין אחרת.
- update_artist: { id או nameHe, patch: { status?, owner?, bucket?, notes?, tags?, genres? } }
- bulk_update_status: { query או ids[], status, owner? } — לעדכון מרוכז לפי חיפוש או רשימת מזהים
- search_artists: { q?, status?, limit?: number } — לשאילתות מידע בלבד, לא משנה DB
- none: אין שינוי במערכת

אם הבקשה לא ברורה — שאל שאלה אחת קצרה ב-reply ו-actions עם type none.
אל תמציא מזהי אומנים — חפש קודם או ציין שלא נמצא.
bucket: popular = פופולריים, main = שאר, outside_genre = חילוני/מחוץ לז׳אנר.`

const findArtistByHint = async (hint) => {
  const text = String(hint ?? '').trim()
  if (!text) return null
  if (text.length >= 8 && !text.includes(' ')) {
    const byId = await getArtistById(text)
    if (byId) return byId
  }
  const result = await searchArtists({ q: text, page: 1, limit: 5 })
  return result.artists[0] ?? null
}

const executeAction = async (action, operatorName) => {
  const type = action?.type ?? 'none'
  const params = action?.params ?? {}

  if (type === 'none') {
    return { ok: true, summary: 'ללא שינוי' }
  }

  if (type === 'search_artists') {
    const result = await searchArtists({
      q: params.q ?? '',
      status: params.status ?? 'all',
      page: 1,
      limit: Math.min(Number(params.limit) || 8, 20),
    })
    return {
      ok: true,
      summary: `נמצאו ${result.total} אומנים (מוצגים ${result.artists.length})`,
      artists: result.artists.map((a) => ({
        id: a.id,
        nameHe: a.nameHe,
        status: a.status,
        owner: a.owner,
        bucket: a.bucket,
      })),
    }
  }

  if (type === 'create_artist') {
    const nameHe = String(params.nameHe ?? '').trim()
    if (!nameHe) {
      return { ok: false, summary: 'חסר שם עברי ליצירת אומן' }
    }
    const status = params.status ?? 'unsigned'
    const owner =
      params.owner ?? (status === 'signed' ? SIGNED_HANDLER : operatorName || 'לא שויך')
    const artist = await createArtist(
      {
        nameHe,
        nameEn: params.nameEn ?? '',
        status,
        owner,
        bucket: BUCKETS.includes(params.bucket) ? params.bucket : 'main',
        genres: params.genres ?? [],
        tags: params.tags ?? [],
        notes: params.notes ?? '',
        priority: priority(status),
        source: 'AI צ׳אט',
      },
      operatorName,
    )
    return { ok: true, summary: `נוצר אומן: ${artist.nameHe}`, artist }
  }

  if (type === 'update_artist') {
    const target =
      (params.id ? await getArtistById(params.id) : null) ??
      (await findArtistByHint(params.nameHe ?? params.q))
    if (!target) {
      return { ok: false, summary: 'לא נמצא אומן לעדכון' }
    }
    const patch = params.patch ?? params
    const artist = await updateArtist(target.id, patch, operatorName)
    return { ok: true, summary: `עודכן: ${artist.nameHe}`, artist }
  }

  if (type === 'bulk_update_status') {
    let ids = Array.isArray(params.ids) ? params.ids : []
    if (ids.length === 0 && params.q) {
      const found = await searchArtists({
        q: params.q,
        status: params.statusFilter ?? 'all',
        page: 1,
        limit: Math.min(Number(params.limit) || 50, 100),
      })
      ids = found.artists.map((a) => a.id)
    }
    if (ids.length === 0) {
      return { ok: false, summary: 'לא נמצאו אומנים לעדכון מרוכז' }
    }
    const status = params.status ?? 'unsigned'
    const artists = await bulkUpdateArtists(
      {
        ids,
        status,
        owner: params.owner ?? operatorName ?? 'לא שויך',
        priority: priority(status),
        bucket: BUCKETS.includes(params.bucket) ? params.bucket : undefined,
      },
      operatorName,
    )
    return { ok: true, summary: `עודכנו ${artists.length} אומנים לסטטוס ${status}`, count: artists.length }
  }

  return { ok: false, summary: `פעולה לא נכרה: ${type}` }
}

const buildContext = async (operatorName) => {
  const stats = await getStats()
  const recent = await searchArtists({ page: 1, limit: 8, sort: 'smart' })
  return {
    operatorName,
    stats,
    recentArtists: recent.artists.map((a) => ({
      id: a.id,
      nameHe: a.nameHe,
      status: a.status,
      owner: a.owner,
      bucket: a.bucket,
    })),
  }
}

/**
 * @param {{ message: string, history?: Array<{ role: string, content: string }>, operatorName: string }} input
 */
const runArtistAiChat = async ({ message, history = [], operatorName }) => {
  if (!isGeminiConfigured()) {
    return {
      reply:
        'מפתח Gemini לא מוגדר בשרת. הוסף GEMINI_API_KEY (או GOOGLE_GEMINI_API_KEY) ב-Render / .env והפעל מחדש.',
      actions: [],
      results: [],
      configured: false,
    }
  }

  const context = await buildContext(operatorName)
  const userPayload = JSON.stringify({
    context,
    userMessage: String(message ?? '').trim(),
  })

  const geminiHistory = history.slice(-12).map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }))

  const parsed = await chatWithGemini(geminiHistory, userPayload, SYSTEM_PROMPT)
  const actions = Array.isArray(parsed.actions) ? parsed.actions : [{ type: 'none', params: {} }]
  const results = []

  for (const action of actions.slice(0, 4)) {
    try {
      results.push(await executeAction(action, operatorName))
    } catch (error) {
      results.push({ ok: false, summary: error.message || 'שגיאה בביצוע' })
    }
  }

  return {
    reply: String(parsed.reply ?? 'בוצע.'),
    actions,
    results,
    configured: true,
  }
}

module.exports = { runArtistAiChat, isGeminiConfigured }
