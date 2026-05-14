const { setupDatabase, getStats } = require('../server/db.cjs')

setupDatabase()
  .then(getStats)
  .then((stats) => {
    console.log(`Neon database is ready. Current artists: ${stats.total}.`)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
