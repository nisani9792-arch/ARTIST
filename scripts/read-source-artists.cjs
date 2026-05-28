const fs = require('node:fs')
const ExcelJS = require('exceljs')
const { enrichArtistsForImport } = require('../server/aiClassifier.cjs')

const SIGNED_HANDLER = 'אלעזר מרקס'

const sources = [
  {
    file: 'C:/Users/SHIMON YOHAY NISANI/Downloads/חתומים.xlsx',
    status: 'signed',
    sourceLabel: 'חתומים',
  },
  {
    file: 'C:/Users/SHIMON YOHAY NISANI/Downloads/לא חתומים.xlsx',
    status: 'unsigned',
    sourceLabel: 'לא חתומים',
  },
]

const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

const splitMultiValue = (value) =>
  clean(value)
    .split(/[,\n;|]+/)
    .map(clean)
    .filter(Boolean)

const slugify = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9א-ת]+/g, '-')
    .replace(/^-+|-+$/g, '')

const addUnique = (target, values) => {
  for (const value of values) {
    if (value && !target.includes(value)) {
      target.push(value)
    }
  }
}

const readWorkbookRows = async (file) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(file)

  const rowsBySheet = []

  workbook.eachSheet((worksheet) => {
    const headers = []
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      headers[columnNumber] = clean(cell.text || cell.value)
    })

    const rows = []

    for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber)
      const record = {}

      for (let columnNumber = 1; columnNumber < headers.length; columnNumber += 1) {
        const header = headers[columnNumber]
        if (!header) {
          continue
        }

        const cell = row.getCell(columnNumber)
        record[header] = clean(cell.text || cell.value)
      }

      if (Object.values(record).some(Boolean)) {
        rows.push(record)
      }
    }

    rowsBySheet.push(rows)
  })

  return rowsBySheet
}

const readSourceArtists = async () => {
  const artistsByKey = new Map()

  for (const source of sources) {
    if (!fs.existsSync(source.file)) {
      throw new Error(`Missing source file: ${source.file}`)
    }

    const sheets = await readWorkbookRows(source.file)

    for (const rows of sheets) {
      let currentArtist = null

      for (const row of rows) {
        const nameHe = clean(row['שם'])
        const nameEn = clean(row['שם באנגלית'])
        const genres = splitMultiValue(row["ז'אנרים של אמן"])
        const tags = splitMultiValue(row['תגיות'])
        const album = clean(row['אלבום אחרון'])

        if (nameHe || nameEn) {
          const key = `${nameHe || nameEn}::${nameEn}`.toLowerCase()
          const existing = artistsByKey.get(key)

          currentArtist =
            existing ??
            {
              id: slugify(nameEn || nameHe) || `artist-${artistsByKey.size + 1}`,
              nameHe,
              nameEn,
              genres: [],
              tags: [],
              latestAlbum: album,
              status: source.status,
              owner: source.status === 'signed' ? SIGNED_HANDLER : 'לא שויך',
              source: source.sourceLabel,
              notes: '',
              priority: source.status === 'signed' ? 'שימור קשר' : 'ליצירת קשר',
            }

          currentArtist.nameHe = currentArtist.nameHe || nameHe
          currentArtist.nameEn = currentArtist.nameEn || nameEn
          currentArtist.latestAlbum = currentArtist.latestAlbum || album
          currentArtist.status =
            currentArtist.status === 'signed' || source.status === 'signed'
              ? 'signed'
              : source.status
          currentArtist.source = currentArtist.source.includes(source.sourceLabel)
            ? currentArtist.source
            : `${currentArtist.source}, ${source.sourceLabel}`

          addUnique(currentArtist.genres, genres)
          addUnique(currentArtist.tags, tags)

          artistsByKey.set(key, currentArtist)
        } else if (currentArtist) {
          addUnique(currentArtist.genres, genres)
          addUnique(currentArtist.tags, tags)
          currentArtist.latestAlbum = currentArtist.latestAlbum || album
        }
      }
    }
  }

  const artists = [...artistsByKey.values()].sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he'))
  const seenIds = new Map()

  for (const artist of artists) {
    const baseId = artist.id || `artist-${seenIds.size + 1}`
    const count = seenIds.get(baseId) ?? 0
    seenIds.set(baseId, count + 1)
    artist.id = count === 0 ? baseId : `${baseId}-${count + 1}`
  }

  const popularLimit = Number(process.env.POPULAR_LIMIT ?? 20)
  return enrichArtistsForImport(artists, popularLimit)
}

module.exports = { readSourceArtists, SIGNED_HANDLER }
