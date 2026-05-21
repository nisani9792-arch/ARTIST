require('dotenv').config()

const { classifyArtistBucketsInDb, setupDatabase } = require('../server/db.cjs')

const popularLimit = Number(process.argv[2] ?? 20)

setupDatabase()
  .then(() => classifyArtistBucketsInDb(popularLimit))
  .then((result) => {
    console.log(
      `Classified ${result.updated} artists (top ${result.popularLimit} → popular bucket)`,
    )
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
