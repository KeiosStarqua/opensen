import { defineConfig } from 'drizzle-kit'
import { loadLocalEnv } from './src/lib/load-local-env.js'

loadLocalEnv()

const migrationUrl =
  process.env.MIGRATION_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  'postgresql://opensen:opensen@localhost:5433/opensen_test'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: migrationUrl,
  },
  strict: true,
  verbose: true,
})
