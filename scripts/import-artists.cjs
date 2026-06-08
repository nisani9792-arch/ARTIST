const fs = require('node:fs')
const path = require('node:path')
const { readSourceArtists } = require('./read-source-artists.cjs')

const root = path.resolve(__dirname, '..')
const seedDir = path.join(root, 'data', 'seed')

const importArtists = async () => {
  const artists = await readSourceArtists()
  fs.mkdirSync(seedDir, { recursive: true })

  const jsonPath = path.join(seedDir, 'artists.json')
  fs.writeFileSync(jsonPath, JSON.stringify(artists, null, 2))

  const counts = artists.reduce(
    (acc, artist) => {
      acc.total += 1
      acc[artist.status] += 1
      return acc
    },
    { total: 0, signed: 0, unsigned: 0, in_process: 0 },
  )

  console.log(
    `Imported ${counts.total} artists (${counts.signed} signed, ${counts.unsigned} unsigned) to data/seed/artists.json`,
  )
}

importArtists().catch((error) => {
  console.error(error)
  process.exit(1)
})
