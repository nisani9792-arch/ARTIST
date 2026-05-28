/**
 * Rule-based "AI" profiling for Israeli artists:
 * - popularity tier (for bucket assignment)
 * - audience type: religious / secular / mixed (חילוני־דתי)
 */

const { popularityScore: basePopularityScore, isOutsideGenreArtist } = require('./artistBuckets.cjs')

const normalizeName = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('he-IL')

/** Mainstream / secular-leaning artists (user examples + market leaders) */
const SECULAR_KNOWN_NAMES = [
  'חנן בן ארי',
  'עומר אדם',
  'עדן חסד',
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
  'אביב גפן',
  'עידן רייכל',
  'אייל גולן',
  'משה פרץ',
  'הדג נחש',
  'הפיל הכחול',
  'סטטיק',
  'בן אל',
  'פאר טסי',
  'אמיר דדון',
  'נטע ברזילי',
  'עדן בן זקן',
  'דנה אינטרנשיונל',
  'אגם בוחבוט',
  'ברי סחרוף',
  'אהוד בנאי',
  'אביתר בנאי',
  'יוני בלוך',
  'טיפקס',
  'בנזין',
  'מוניקה סקס',
]

const SECULAR_NAME_SET = new Set(SECULAR_KNOWN_NAMES.map(normalizeName))

const RELIGIOUS_GENRE_PREFIX = /^[1-5]\./
const SECULAR_GENRE_PREFIX = /^6\./
const MIZRACHI_GENRE_PREFIX = /^7\./
const PIYUT_GENRE_PREFIX = /^8\./

const RELIGIOUS_GENRE_WORDS = [
  'חסיד',
  'חזנות',
  'ניגון',
  'ניגונים',
  'תורה',
  'דתי',
  'ליטאי',
  'ישיבתי',
  'פיוט',
  "ע''מ",
]

const SECULAR_GENRE_WORDS = ['אלטרנטיבי - ישראלי', 'ישראלי', 'אינדי', 'רוק', 'פופ', 'היפ הופ']

const RELIGIOUS_TAG_WORDS = ['תורה', 'תפילה', 'חזנות', 'ניגון', 'חסיד', 'דתי', 'שמחה', 'מנגינות']

const isJunkArtist = (artist) => {
  const nameHe = String(artist.nameHe ?? '').trim()
  const nameEn = String(artist.nameEn ?? '').trim()
  if (!nameHe && !nameEn) return true
  if (/^\d+$/.test(nameHe)) return true
  if (nameHe.length < 2 && !nameEn) return true
  if (nameHe === '""' || nameHe === "''") return true
  return false
}

const nameMatchesSet = (nameHe, nameEn, set, hints) => {
  const he = normalizeName(nameHe)
  const en = normalizeName(nameEn)
  if (set.has(he) || (en && set.has(en))) return true
  for (const hint of hints) {
    const h = normalizeName(hint)
    if (he.includes(h) || h.includes(he)) return true
    if (en && (en.includes(h) || h.includes(en))) return true
  }
  return false
}

const genreText = (artist) => (artist.genres ?? []).join(' ').toLocaleLowerCase('he-IL')

const tagText = (artist) => (artist.tags ?? []).join(' ').toLocaleLowerCase('he-IL')

/**
 * @returns {'religious' | 'secular' | 'mixed'}
 */
const classifyAudienceType = (artist) => {
  const nameHe = artist.nameHe ?? artist.name_he ?? ''
  const nameEn = artist.nameEn ?? artist.name_en ?? ''

  if (nameMatchesSet(nameHe, nameEn, SECULAR_NAME_SET, SECULAR_KNOWN_NAMES)) {
    return 'secular'
  }

  const genres = artist.genres ?? []
  let religiousScore = 0
  let secularScore = 0

  for (const genre of genres) {
    const g = String(genre).trim()
    if (RELIGIOUS_GENRE_PREFIX.test(g)) religiousScore += 3
    if (SECULAR_GENRE_PREFIX.test(g)) secularScore += 4
    if (MIZRACHI_GENRE_PREFIX.test(g)) secularScore += 1
    if (PIYUT_GENRE_PREFIX.test(g)) religiousScore += 2
    if (RELIGIOUS_GENRE_WORDS.some((w) => g.includes(w))) religiousScore += 2
    if (SECULAR_GENRE_WORDS.some((w) => g.includes(w))) secularScore += 2
  }

  const combined = `${genreText(artist)} ${tagText(artist)}`
  if (RELIGIOUS_TAG_WORDS.some((w) => combined.includes(w))) religiousScore += 1

  if (secularScore >= 4 && religiousScore <= 2) return 'secular'
  if (religiousScore >= 3 && secularScore <= 1) return 'religious'
  if (religiousScore >= 2 && secularScore >= 2) return 'mixed'
  if (religiousScore > secularScore) return 'religious'
  if (secularScore > religiousScore) return 'secular'

  if (isOutsideGenreArtist(artist)) return 'secular'
  return 'mixed'
}

/**
 * @returns {'high' | 'medium' | 'low'}
 */
const classifyPopularityTier = (artist, score) => {
  const nameHe = artist.nameHe ?? ''
  const nameEn = artist.nameEn ?? ''

  if (nameMatchesSet(nameHe, nameEn, SECULAR_NAME_SET, SECULAR_KNOWN_NAMES)) {
    return 'high'
  }

  if (score >= 500) return 'high'
  if (score >= 80 || artist.status === 'signed') return 'medium'
  if ((artist.tags ?? []).length >= 4) return 'medium'
  return 'low'
}

const audienceLabel = (type) => {
  if (type === 'secular') return 'חילוני / מיינסטרים'
  if (type === 'religious') return 'דתי / חסידי'
  return 'מעורב'
}

const analyzeArtistProfile = (artist) => {
  const score = basePopularityScore(artist)
  const audienceType = classifyAudienceType(artist)
  const popularityTier = classifyPopularityTier(artist, score)
  const outsideGenre = audienceType === 'secular' || isOutsideGenreArtist(artist)

  const autoTags = []
  if (!artist.tags?.includes(`קהל:${audienceLabel(audienceType)}`)) {
    autoTags.push(`קהל:${audienceLabel(audienceType)}`)
  }
  if (popularityTier === 'high' && !artist.tags?.includes('AI:פופולרי')) {
    autoTags.push('AI:פופולרי')
  }
  if (outsideGenre && !artist.tags?.includes('AI:מחוץ לז׳אנר')) {
    autoTags.push('AI:מחוץ לז׳אנר')
  }

  const summary = [
    `סיווג AI: ${audienceLabel(audienceType)}`,
    `פופולריות: ${popularityTier === 'high' ? 'גבוהה' : popularityTier === 'medium' ? 'בינונית' : 'נמוכה'}`,
    outsideGenre ? 'מומלץ בקטגוריה: מחוץ לז׳אנר' : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    audienceType,
    popularityTier,
    popularityScore: score,
    outsideGenre,
    autoTags,
    summary,
  }
}

const enrichArtistWithAi = (artist) => {
  if (isJunkArtist(artist)) return null

  const profile = analyzeArtistProfile(artist)
  const tags = [...(artist.tags ?? [])]
  for (const tag of profile.autoTags) {
    if (!tags.includes(tag)) tags.push(tag)
  }

  const notes =
    artist.notes && artist.notes.includes('סיווג AI')
      ? artist.notes
      : [profile.summary, artist.notes].filter(Boolean).join('\n')

  return {
    ...artist,
    tags,
    notes,
    audienceType: profile.audienceType,
    popularityTier: profile.popularityTier,
    popularityScore: profile.popularityScore,
    _outsideGenre: profile.outsideGenre,
  }
}

const enrichArtistsForImport = (artists, popularLimit = 20) => {
  const { classifyArtistBuckets } = require('./artistBuckets.cjs')
  const enriched = artists.map(enrichArtistWithAi).filter(Boolean)

  const forBuckets = enriched.map((a) => ({
    ...a,
    _forceOutside: a._outsideGenre || a.audienceType === 'secular',
  }))

  const { assignments, scores } = classifyArtistBuckets(forBuckets, popularLimit)

  return enriched.map((artist) => ({
    ...artist,
    bucket: assignments.get(artist.id) ?? 'main',
    popularityScore: scores.get(artist.id) ?? artist.popularityScore ?? 0,
    _outsideGenre: undefined,
    _forceOutside: undefined,
    popularityTier: undefined,
  }))
}

module.exports = {
  analyzeArtistProfile,
  audienceLabel,
  classifyAudienceType,
  classifyPopularityTier,
  enrichArtistWithAi,
  enrichArtistsForImport,
  isJunkArtist,
}
