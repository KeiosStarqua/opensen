import { z } from 'zod'

const aiProviderSchema = z.enum(['openrouter']).default('openrouter')

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

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source)
}
