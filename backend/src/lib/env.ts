import { z } from 'zod'

const aiProviderSchema = z.enum(['openrouter']).default('openrouter')

const trimmedNonEmptyString = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1))

const postgresUrlSchema = trimmedNonEmptyString.pipe(
  z.string().url().refine(
    (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
    { message: 'DATABASE_URL must be a PostgreSQL connection string' },
  ),
)

const envSchema = z.object({
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  AI_PROVIDER: aiProviderSchema,
  AI_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
  OPENROUTER_API_KEY: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  OPENROUTER_SITE_URL: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined))
    .pipe(z.string().url().optional()),
  OPENROUTER_APP_NAME: z.string().min(1).default('OpenSen'),
})

const databaseEnvSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
})

const migrationEnvSchema = z.object({
  MIGRATION_DATABASE_URL: postgresUrlSchema.optional(),
  DATABASE_URL: postgresUrlSchema,
})

const testDatabaseEnvSchema = z.object({
  TEST_DATABASE_URL: postgresUrlSchema,
})

export type Env = z.infer<typeof envSchema>
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>
export type MigrationEnv = z.infer<typeof migrationEnvSchema>
export type TestDatabaseEnv = z.infer<typeof testDatabaseEnvSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source)
}

export function loadDatabaseEnv(
  source: NodeJS.ProcessEnv = process.env,
): DatabaseEnv {
  return databaseEnvSchema.parse(source)
}

export function loadMigrationEnv(
  source: NodeJS.ProcessEnv = process.env,
): MigrationEnv {
  return migrationEnvSchema.parse(source)
}

export function loadTestDatabaseEnv(
  source: NodeJS.ProcessEnv = process.env,
): TestDatabaseEnv {
  const parsed = testDatabaseEnvSchema.parse(source)
  const databaseName = extractDatabaseName(parsed.TEST_DATABASE_URL)

  if (!isDesignatedTestDatabase(databaseName)) {
    throw new Error(
      'TEST_DATABASE_URL must point to the designated test database (opensen_test)',
    )
  }

  return parsed
}

export function resolveMigrationDatabaseUrl(
  source: NodeJS.ProcessEnv = process.env,
): string {
  const env = loadMigrationEnv(source)
  return env.MIGRATION_DATABASE_URL ?? env.DATABASE_URL
}

function extractDatabaseName(url: string): string {
  const pathname = new URL(url).pathname.replace(/^\//, '')
  return pathname.split('/')[0] ?? ''
}

function isDesignatedTestDatabase(databaseName: string): boolean {
  return databaseName === 'opensen_test' || databaseName.endsWith('_test')
}
