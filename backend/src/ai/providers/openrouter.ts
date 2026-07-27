import { HTTPException } from 'hono/http-exception'
import type { z } from 'zod'
import type {
  AiProvider,
  CompleteJsonOptions,
  CompleteJsonResult,
} from '../types.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type OpenRouterConfig = {
  apiKey: string
  model: string
  siteUrl?: string
  appName?: string
}

type OpenRouterChoice = {
  message?: { content?: string | null }
  finish_reason?: string | null
}

type OpenRouterResponse = {
  id?: string
  model?: string
  choices?: OpenRouterChoice[]
  error?: { message?: string; code?: number }
}

/**
 * OpenRouter is OpenAI-compatible. Other providers (OpenAI, Anthropic, Gemini)
 * get their own files under providers/ and register in create-provider.ts.
 */
export function createOpenRouterProvider(
  config: OpenRouterConfig,
): AiProvider {
  return {
    id: 'openrouter',
    model: config.model,

    async completeJson<T extends z.ZodType>(
      options: CompleteJsonOptions<T>,
    ): Promise<CompleteJsonResult<z.infer<T>>> {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      }
      if (config.siteUrl) headers['HTTP-Referer'] = config.siteUrl
      if (config.appName) headers['X-Title'] = config.appName

      const body = {
        model: config.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 4096,
        response_format: { type: 'json_object' as const },
        provider: { require_parameters: true },
      }

      let response: Response
      try {
        response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })
      } catch (err) {
        throw new HTTPException(502, {
          message: `OpenRouter network error: ${err instanceof Error ? err.message : String(err)}`,
        })
      }

      const payload = (await response.json()) as OpenRouterResponse

      if (!response.ok) {
        throw new HTTPException(502, {
          message:
            payload.error?.message ??
            `OpenRouter HTTP ${response.status}`,
        })
      }

      if (payload.error?.message) {
        throw new HTTPException(502, {
          message: payload.error.message,
        })
      }

      const rawText = payload.choices?.[0]?.message?.content?.trim()
      if (!rawText) {
        throw new HTTPException(502, {
          message: 'OpenRouter returned empty content',
        })
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(rawText)
      } catch {
        throw new HTTPException(502, {
          message: 'OpenRouter returned non-JSON content',
        })
      }

      const validated = options.schema.safeParse(parsed)
      if (!validated.success) {
        throw new HTTPException(502, {
          message: `AI output failed schema "${options.schemaName}": ${validated.error.message}`,
        })
      }

      return {
        data: validated.data,
        model: payload.model ?? config.model,
        provider: 'openrouter',
        rawText,
      }
    },
  }
}
