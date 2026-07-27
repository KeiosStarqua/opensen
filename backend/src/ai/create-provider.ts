import { HTTPException } from 'hono/http-exception'
import type { Env } from '../lib/env.js'
import type { AiProvider } from './types.js'
import { createOpenRouterProvider } from './providers/openrouter.js'

/**
 * Resolve the configured AI provider. Add new cases here when wiring
 * openai / anthropic / gemini — keep route handlers provider-agnostic.
 */
export function createAiProvider(env: Env): AiProvider {
  switch (env.AI_PROVIDER) {
    case 'openrouter': {
      if (!env.OPENROUTER_API_KEY) {
        throw new HTTPException(503, {
          message:
            'OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter',
        })
      }
      return createOpenRouterProvider({
        apiKey: env.OPENROUTER_API_KEY,
        model: env.AI_MODEL,
        siteUrl: env.OPENROUTER_SITE_URL,
        appName: env.OPENROUTER_APP_NAME,
      })
    }
    default: {
      const exhaustive: never = env.AI_PROVIDER
      throw new HTTPException(500, {
        message: `Unsupported AI_PROVIDER: ${String(exhaustive)}`,
      })
    }
  }
}
