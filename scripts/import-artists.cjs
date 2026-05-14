const fs = require('node:fs')
const path = require('node:path')
const { readSourceArtists } = require('./read-source-artists.cjs')

const root = path.resolve(__dirname, '..')

const buildOutput = (artists) => `export type SignatureStatus = 'signed' | 'unsigned' | 'stuck'

export type ArtistRecord = {
  id: string
  nameHe: string
  nameEn: string
  genres: string[]
  tags: string[]
  latestAlbum: string
  status: SignatureStatus
  owner: string
  source: string
  notes: string
  priority: string
  updatedAt?: string
}

export const initialArtists: ArtistRecord[] = ${JSON.stringify(artists, null, 2)}
`

const importArtists = async () => {
  const artists = await readSourceArtists()
  const outputPath = path.join(root, 'src', 'data', 'artists.ts')
  fs.writeFileSync(outputPath, buildOutput(artists))

  const counts = artists.reduce(
    (acc, artist) => {
      acc.total += 1
      acc[artist.status] += 1
      return acc
    },
    { total: 0, signed: 0, unsigned: 0, stuck: 0 },
  )

  console.log(`Imported ${counts.total} artists (${counts.signed} signed, ${counts.unsigned} unsigned).`)
}

importArtists().catch((error) => {
  console.error(error)
  process.exit(1)
})
