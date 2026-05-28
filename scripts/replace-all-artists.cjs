require('dotenv').config()

const { replaceAllArtists, getStats } = require('../server/db.cjs')
const { readSourceArtists } = require('./read-source-artists.cjs')

const replaceFromExcel = async () => {
  console.log('Reading Excel sources with AI enrichment...')
  const artists = await readSourceArtists()

  const signed = artists.filter((a) => a.status === 'signed').length
  const unsigned = artists.filter((a) => a.status === 'unsigned').length
  const popular = artists.filter((a) => a.bucket === 'popular').length
  const outside = artists.filter((a) => a.bucket === 'outside_genre').length
  const secular = artists.filter((a) => a.audienceType === 'secular').length

  console.log(
    `Prepared ${artists.length} artists (${signed} signed → אלעזר מרקס, ${unsigned} unsigned).`,
  )
  console.log(
    `AI buckets: ${popular} popular, ${outside} outside_genre, ${secular} secular audience.`,
  )

  const hanan = artists.find((a) => a.nameHe === 'חנן בן ארי')
  if (hanan) {
    console.log('Sample — חנן בן ארי:', {
      bucket: hanan.bucket,
      audienceType: hanan.audienceType,
      tags: hanan.tags.slice(0, 4),
    })
  }

  console.log('Replacing all artists in database...')
  const result = await replaceAllArtists(artists)
  const stats = await getStats()

  console.log(`Done. Inserted ${result.inserted} artists.`)
  console.log(
    `DB stats: ${stats.total} total, ${stats.signed} signed, ${stats.unsigned} unsigned, ${stats.popular} popular, ${stats.outside_genre} outside_genre.`,
  )
}

replaceFromExcel().catch((error) => {
  console.error(error)
  process.exit(1)
})
