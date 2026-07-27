import type { z } from 'zod'

export type AiMessageRole = 'system' | 'user' | 'assistant'

export type AiMessage = {
  role: AiMessageRole
  content: string
}

export type CompleteJsonOptions<T extends z.ZodType> = {
  messages: AiMessage[]
  schema: T
  /** OpenRouter / OpenAI structured-output schema name */
  schemaName: string
  temperature?: number
  maxTokens?: number
}

export type CompleteJsonResult<T> = {
  data: T
  model: string
  provider: string
  rawText: string
}

export type AiProviderId = 'openrouter'

export interface AiProvider {
  readonly id: AiProviderId
  readonly model: string
  completeJson<T extends z.ZodType>(
    options: CompleteJsonOptions<T>,
  ): Promise<CompleteJsonResult<z.infer<T>>>
}
