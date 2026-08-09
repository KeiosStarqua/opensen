import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const migrationUrl =
  process.env.MIGRATION_DATABASE_URL?.trim() ||
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
