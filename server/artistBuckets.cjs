/** @typedef {'popular' | 'main' | 'outside_genre'} ArtistBucket */

const BUCKETS = /** @type {const} */ (['popular', 'main', 'outside_genre'])

const normalizeName = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('he-IL')

/** Well-known Israeli artists — high priority for "popular" bucket */
const POPULAR_NAME_HINTS = [
  'עומר אדם',
  'עדן חסד',
  'סטטיק ובן אל',
  'סטטיק',
  'בן אל',
  'נועה קירל',
  'איתי לוי',
  'אודיה',
  'אנה זק',
  'רביד פלוטניק',
  'שלמה ארצי',
  'אריק איינשטיין',
  'גידי גוב',
  'שלום חנוך',
  'יהודה פוליקר',
  'מתי כספי',
  'ריטה',
  'שירן קרן',
  'עפרה חזה',
  'זהבה בן',
  'דודו אהרון',
  'ליאור נרקיס',
  'פאר טסי',
  'נסים סרוסי',
  'מרגול',
  'שלום חנוך',
  'אייל גולן',
  'משה פרץ',
  'עידן רייכל',
  'אביב גפן',
  'חנן בן ארי',
  'שלום חנוך',
  'יהורם גאון',
  'חיים משולחן',
  'צביקה פיק',
  'יוסי בנאי',
  'אריק לביא',
  'גלי עטרי',
  'ריטה',
  'שלום חנוך',
  'נועה קירל',
  'אמיר דדון',
  'קרולינה',
  'שלומי שבת',
  'אייל גולן',
  'עומר אדם',
  'נועה קירל',
  'סטפן לגר',
  'מושיק עפיה',
  'אייל גולן',
  'שלומי שבנה',
  'רן דנקר',
  'עדן בן זקן',
  'נטע ברזילי',
  'דנה אינטרנשיונל',
  'שיר לי',
  'אגם בוחבוט',
  'נועה קירל',
  'עומר אדם',
  'סטטיק',
  'הפיל הכחול',
  'מוניקה סקס',
  'אביב גפן',
  'הדג נחש',
  'בנזין',
  'טיפקס',
  'שלום חנוך',
  'יהודה פוליקר',
  'ברי סחרוף',
  'עדן חסד',
  'אביתר בנאי',
  'אהוד בנאי',
  'יוני בלוך',
  'שלום חנוך',
  'אריק איינשטיין',
  'גידי גוב',
  'שלמה ארצי',
  'יהורם גאון',
  'חיים משולחן',
  'צביקה פיק',
  'יוסי בנאי',
  'אריק לביא',
  'גלי עטרי',
  'ריטה',
  'עפרה חזה',
  'זהבה בן',
  'שירן קרן',
  'דודו אהרון',
  'ליאור נרקיס',
  'פאר טסי',
  'נסים סרוסי',
  'מרגול',
  'אייל גולן',
  'משה פרץ',
  'עידן רייכל',
  'אמיר דדון',
  'קרולינה',
  'שלומי שבת',
  'רן דנקר',
  'עדן בן זקן',
  'נטע ברזילי',
  'דנה אינטרנשיונל',
  'אגם בוחבוט',
  'הפיל הכחול',
  'הדג נחש',
  'בנזין',
  'טיפקס',
  'ברי סחרוף',
  'אביתר בנאי',
  'אהוד בנאי',
  'יוני בלוך',
]

const POPULAR_NAME_SET = new Set(POPULAR_NAME_HINTS.map(normalizeName))

/** Secular / mainstream-pop leaning — outside core religious genre roster */
const OUTSIDE_GENRE_NAME_HINTS = [
  'חנן בן ארי',
  'עדן חסד',
  'אביב גפן',
  'אהוד בנאי',
  'אביתר בנאי',
  'יוני בלוך',
  'אריק איינשטיין',
  'גידי גוב',
  'שלום חנוך',
  'יהודה פוליקר',
  'מתי כספי',
  'ריטה',
  'הדג נחש',
  'הפיל הכחול',
  'בנזין',
  'טיפקס',
  'מוניקה סקס',
  'ברי סחרוף',
  'אמיר דדון',
  'קרולינה',
  'שלומי שבת',
  'נטע ברזילי',
  'דנה אינטרנשיונל',
  'אגם בוחבוט',
  'נועה קירל',
  'עומר אדם',
  'סטטיק',
  'בן אל',
  'עדן בן זקן',
  'רביד פלוטניק',
  'אנה זק',
  'אודיה',
  'איתי לוי',
  'פאר טסי',
  'נסים סרוסי',
  'ליאור נרקיס',
  'דודו אהרון',
  'שירן קרן',
  'עפרה חזה',
  'זהבה בן',
  'אריק לביא',
  'גלי עטרי',
  'יוסי בנאי',
  'צביקה פיק',
  'חיים משולחן',
  'יהורם גאון',
  'שלמה ארצי',
  'עידן רייכל',
  'אייל גולן',
  'משה פרץ',
  'מרגול',
  'דודו אהרון',
  'ליאור נרקיס',
  'פאר טסי',
  'נסים סרוסי',
  'שיר לי',
  'רן דנקר',
  'סטפן לגר',
  'מושיק עפיה',
  'שלומי שבנה',
  'עדן חסד',
  'אביב גפן',
  'חנן בן ארי',
]

const OUTSIDE_GENRE_NAME_SET = new Set(OUTSIDE_GENRE_NAME_HINTS.map(normalizeName))

const SECULAR_GENRE_KEYWORDS = [
  'פופ',
  'רוק',
  'אינדי',
  'אלטרנטיב',
  'היפ הופ',
  'ראפ',
  'אקוסטי',
  'אלקטרוני',
  'פיינק',
  'חילוני',
  'ישראלי',
  'מזרחי',
  'שירי אהבה',
  'בלוז',
  'ג\'אז',
  'פאנק',
  'סול',
  'R&B',
  'r&b',
]

const RELIGIOUS_GENRE_KEYWORDS = [
  'חסידי',
  'דתי',
  'ניגונים',
  'תהילים',
  'שירי תורה',
  'מזרחי דתי',
  'יהודי',
  'שמחה',
  'חזנות',
  'מנגינות',
]

const matchesKeyword = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword.toLocaleLowerCase('he-IL')))

const popularityScore = (artist) => {
  const nameHe = normalizeName(artist.nameHe ?? artist.name_he)
  const nameEn = normalizeName(artist.nameEn ?? artist.name_en)
  let score = 0

  if (POPULAR_NAME_SET.has(nameHe)) score += 1000
  if (nameEn && POPULAR_NAME_SET.has(nameEn)) score += 1000

  for (const hint of POPULAR_NAME_HINTS) {
    const normalizedHint = normalizeName(hint)
    if (nameHe.includes(normalizedHint) || normalizedHint.includes(nameHe)) {
      score += 400
      break
    }
  }

  const genres = artist.genres ?? []
  const tags = artist.tags ?? []
  const genreText = genres.join(' ').toLocaleLowerCase('he-IL')
  const tagText = tags.join(' ').toLocaleLowerCase('he-IL')
  const combined = `${genreText} ${tagText}`

  score += Math.min(tags.length, 12) * 4
  score += Math.min(genres.length, 8) * 2
  if (artist.nameEn || artist.name_en) score += 8
  if (artist.latestAlbum || artist.latest_album) score += 3

  if (matchesKeyword(combined, ['פופ', 'רוק', 'היפ הופ', 'ראפ', 'מזרחי'])) score += 25
  if (artist.status === 'signed') score += 15

  return score
}

const isOutsideGenreArtist = (artist) => {
  if (artist._forceOutside === true) return true

  const nameHe = normalizeName(artist.nameHe ?? artist.name_he)
  if (OUTSIDE_GENRE_NAME_SET.has(nameHe)) return true

  for (const hint of OUTSIDE_GENRE_NAME_HINTS) {
    const normalizedHint = normalizeName(hint)
    if (nameHe.includes(normalizedHint) || normalizedHint.includes(nameHe)) {
      return true
    }
  }

  const genres = artist.genres ?? []
  const tags = artist.tags ?? []
  const combined = [...genres, ...tags].join(' ').toLocaleLowerCase('he-IL')

  if (!combined.trim()) return false
  if (matchesKeyword(combined, RELIGIOUS_GENRE_KEYWORDS)) return false

  if (matchesKeyword(combined, SECULAR_GENRE_KEYWORDS)) {
    if (combined.includes('מזרחי') && !combined.includes('דתי')) return true
    if (!combined.includes('מזרחי')) return true
  }

  return false
}

/**
 * @param {Array<Record<string, unknown>>} artists
 * @param {number} popularLimit
 */
const classifyArtistBuckets = (artists, popularLimit = 20) => {
  const limit = Math.min(Math.max(1, Number(popularLimit) || 20), 100)
  const scored = artists.map((artist) => ({
    id: artist.id,
    score: popularityScore(artist),
    outside: isOutsideGenreArtist(artist),
  }))

  const outsideIds = new Set(scored.filter((row) => row.outside).map((row) => row.id))
  const rankedMain = scored
    .filter((row) => !outsideIds.has(row.id))
    .sort((a, b) => b.score - a.score)

  const popularIds = new Set(rankedMain.slice(0, limit).map((row) => row.id))
  const assignments = new Map()

  for (const row of scored) {
    if (outsideIds.has(row.id)) {
      assignments.set(row.id, 'outside_genre')
    } else if (popularIds.has(row.id)) {
      assignments.set(row.id, 'popular')
    } else {
      assignments.set(row.id, 'main')
    }
  }

  return {
    assignments,
    scores: new Map(scored.map((row) => [row.id, row.score])),
    limit,
  }
}

module.exports = {
  BUCKETS,
  classifyArtistBuckets,
  isOutsideGenreArtist,
  popularityScore,
}
