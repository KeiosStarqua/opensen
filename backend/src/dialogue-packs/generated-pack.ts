import { z } from 'zod'
import type { GenerateDialogueRequest } from '../ai/pipeline/schemas.js'
import {
  chunkSlotSchema,
  dialogueLineSchema,
  extractedChunkSchema,
  generatedDialogueSchema,
  normalizedSituationSchema,
} from '../ai/pipeline/schemas.js'

/** Stable prompt revision identifiers — maintained beside pipeline contracts. */
export const PROMPT_VERSIONS = {
  situation_normalization: 'situation_normalization/v1',
  dialogue_generation: 'dialogue_generation/v1',
  chunk_extraction: 'chunk_extraction/v1',
} as const

/** Stable schema revision identifiers for provenance rows. */
export const SCHEMA_VERSIONS = {
  situation_normalization: 'normalized_situation/v1',
  dialogue_generation: 'generated_dialogue/v1',
  chunk_extraction: 'extracted_chunks/v1',
} as const

export const PIPELINE_STEPS = [
  'situation_normalization',
  'dialogue_generation',
  'chunk_extraction',
] as const

export type PipelineStep = (typeof PIPELINE_STEPS)[number]

export const generatedPackSlotSchema = z.object({
  name: z.string().min(1),
  position: z.number().int().nonnegative(),
  expectedPos: z.string().min(1),
  variants: z.array(
    z.object({
      text: z.string().min(1),
      meaning: z.string().min(1),
      level: z.string().min(1),
    }),
  ).min(2),
})

export const generatedPackPatternSchema = z.object({
  template: z.string().min(1),
  meaning: z.string().min(1),
  difficulty: z.string().min(1),
  level: z.string().min(1),
  register: z.enum(['casual', 'neutral', 'polite', 'formal']),
  slots: z.array(generatedPackSlotSchema),
})

export const generatedPackChunkSchema = z.object({
  text: z.string().min(1),
  type: z.string().min(1),
  meaning: z.string().min(1),
  pronunciation: z.string().optional(),
  level: z.string().min(1),
  register: z.enum(['casual', 'neutral', 'polite', 'formal']),
  pattern: generatedPackPatternSchema,
})

export const generatedPackLineSchema = z.object({
  position: z.number().int().nonnegative(),
  speaker: z.enum(['learner', 'other']),
  text: z.string().min(1),
})

export const generatedPackSituationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  roleSelf: z.string().min(1),
  roleOther: z.string().min(1),
  goal: z.string().min(1),
  tone: z.string().min(1),
})

export const generatedPackDialogueSchema = z.object({
  title: z.string().min(1),
  level: z.string().min(1),
  createdBy: z.string().min(1),
  lines: z.array(generatedPackLineSchema).min(4),
})

export const generatedPackSchema = z.object({
  situation: generatedPackSituationSchema,
  dialogue: generatedPackDialogueSchema,
  chunks: z.array(generatedPackChunkSchema).min(3),
})

export type GeneratedPack = z.infer<typeof generatedPackSchema>

export const pipelineTraceSchema = z.object({
  step: z.enum(PIPELINE_STEPS),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
  input: z.record(z.unknown()),
  output: z.record(z.unknown()),
  validationVerdict: z.literal('pass'),
})

export type PipelineTrace = z.infer<typeof pipelineTraceSchema>

export type PersistenceProjection = {
  requestId: string
  situationId: string
  dialogueId: string
  chunkIds: string[]
}

const LEVEL_TO_DIFFICULTY: Record<string, string> = {
  beginner: 'easy',
  elementary: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
}

const DEFAULT_EXPECTED_POS = 'phrase'

const DEFAULT_SITUATION_CATEGORY = 'generated'

function mapRegister(
  register: 'casual' | 'neutral' | 'formal',
): 'casual' | 'neutral' | 'polite' | 'formal' {
  if (register === 'formal') return 'formal'
  if (register === 'casual') return 'casual'
  return 'neutral'
}

function assertContiguousPositions(
  lines: Array<{ position: number }>,
  label: string,
): void {
  const positions = lines.map((line) => line.position)
  const unique = new Set(positions)
  if (unique.size !== positions.length) {
    throw new Error(`${label} positions must be unique`)
  }

  const sorted = [...positions].sort((a, b) => a - b)
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index] !== index) {
      throw new Error(`${label} positions must be contiguous starting at 0`)
    }
  }
}

function mapSituation(
  normalized: z.infer<typeof normalizedSituationSchema>,
): GeneratedPack['situation'] {
  return {
    name: normalized.name,
    description: normalized.description,
    category: DEFAULT_SITUATION_CATEGORY,
    roleSelf: normalized.learnerRole,
    roleOther: normalized.otherSpeaker,
    goal: normalized.goal,
    tone: normalized.tone,
  }
}

function mapDialogueLines(
  lines: z.infer<typeof generatedDialogueSchema>['lines'],
): GeneratedPack['dialogue']['lines'] {
  const mapped = lines.map((line) => ({
    position: line.index,
    speaker: line.speaker,
    text: line.text,
  }))

  assertContiguousPositions(mapped, 'dialogue line')
  return mapped
}

function mapChunk(
  chunk: z.infer<typeof extractedChunkSchema>,
  level: string,
): GeneratedPack['chunks'][number] {
  const register = mapRegister(chunk.register)
  const slots = chunk.slots.map((slot, slotIndex) => {
    const parsedSlot = chunkSlotSchema.parse(slot)

    return {
      name: parsedSlot.name,
      position: slotIndex,
      expectedPos: DEFAULT_EXPECTED_POS,
      variants: parsedSlot.variants.map((variant) => ({
        text: variant,
        meaning: variant,
        level,
      })),
    }
  })

  const slotNames = slots.map((slot) => slot.name)
  if (new Set(slotNames).size !== slotNames.length) {
    throw new Error('chunk slot names must be unique within a frame')
  }

  assertContiguousPositions(slots, 'chunk slot')

  return {
    text: chunk.example,
    type: slots.length > 0 ? 'phrase' : 'sentence',
    meaning: chunk.meaningNative,
    pronunciation: chunk.romanization,
    level,
    register,
    pattern: {
      template: chunk.frame,
      meaning: chunk.meaningNative,
      difficulty: LEVEL_TO_DIFFICULTY[level] ?? 'medium',
      level,
      register,
      slots,
    },
  }
}

export function buildGeneratedPack(
  request: GenerateDialogueRequest,
  normalized: z.infer<typeof normalizedSituationSchema>,
  dialogue: z.infer<typeof generatedDialogueSchema>,
  extractedChunks: Array<z.infer<typeof extractedChunkSchema>>,
): GeneratedPack {
  const level = request.level
  const pack = generatedPackSchema.parse({
    situation: mapSituation(normalized),
    dialogue: {
      title: dialogue.title,
      level: normalized.level,
      createdBy: 'ai_generator',
      lines: mapDialogueLines(dialogue.lines),
    },
    chunks: extractedChunks.map((chunk) => mapChunk(chunk, level)),
  })

  return pack
}

function allowlistedSituationInput(request: GenerateDialogueRequest): Record<string, unknown> {
  return {
    situation: request.situation,
    role: request.role,
    otherSpeaker: request.otherSpeaker,
    goal: request.goal,
    tone: request.tone,
    level: request.level,
    nativeLanguage: request.nativeLanguage,
    targetLanguage: request.targetLanguage,
  }
}

function allowlistedDialogueInput(
  normalized: z.infer<typeof normalizedSituationSchema>,
): Record<string, unknown> {
  return {
    name: normalized.name,
    description: normalized.description,
    learnerRole: normalized.learnerRole,
    otherSpeaker: normalized.otherSpeaker,
    goal: normalized.goal,
    tone: normalized.tone,
    level: normalized.level,
    nativeLanguage: normalized.nativeLanguage,
    targetLanguage: normalized.targetLanguage,
  }
}

function allowlistedChunkInput(
  normalized: z.infer<typeof normalizedSituationSchema>,
  dialogue: z.infer<typeof generatedDialogueSchema>,
): Record<string, unknown> {
  return {
    situationName: normalized.name,
    dialogueTitle: dialogue.title,
    lineCount: dialogue.lines.length,
  }
}

export function buildPipelineTrace(
  step: PipelineStep,
  model: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): PipelineTrace {
  return pipelineTraceSchema.parse({
    step,
    model,
    promptVersion: PROMPT_VERSIONS[step],
    schemaVersion: SCHEMA_VERSIONS[step],
    input,
    output,
    validationVerdict: 'pass',
  })
}

export function buildPipelineTraces(
  request: GenerateDialogueRequest,
  normalized: z.infer<typeof normalizedSituationSchema>,
  dialogue: z.infer<typeof generatedDialogueSchema>,
  chunks: z.infer<typeof extractedChunkSchema>[],
  models: Record<PipelineStep, string>,
): PipelineTrace[] {
  return [
    buildPipelineTrace(
      'situation_normalization',
      models.situation_normalization,
      allowlistedSituationInput(request),
      normalizedSituationSchema.parse(normalized) as Record<string, unknown>,
    ),
    buildPipelineTrace(
      'dialogue_generation',
      models.dialogue_generation,
      allowlistedDialogueInput(normalized),
      generatedDialogueSchema.parse(dialogue) as Record<string, unknown>,
    ),
    buildPipelineTrace(
      'chunk_extraction',
      models.chunk_extraction,
      allowlistedChunkInput(normalized, dialogue),
      { chunks: z.array(extractedChunkSchema).parse(chunks) } as Record<string, unknown>,
    ),
  ]
}
