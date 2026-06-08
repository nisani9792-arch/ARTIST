const { upsertArtists, getStats } = require('../server/db.cjs')
const { readSourceArtists } = require('./read-source-artists.cjs')

const seedNeon = async () => {
  const artists = await readSourceArtists()
  await upsertArtists(artists)

  const stats = await getStats()
  console.log(
    `Seeded Neon with ${stats.total} artists (${stats.signed} signed, ${stats.unsigned} unsigned, ${stats.in_process} in_process).`,
  )
}

seedNeon().catch((error) => {
  console.error(error)
  process.exit(1)
})
