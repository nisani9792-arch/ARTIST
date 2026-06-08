require('dotenv').config()
const { setupDatabase } = require('../server/db.cjs')

setupDatabase()
  .then(() => {
    console.log('Migration complete: stuck → in_process')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
