import { z } from 'zod'

export const generateDialogueRequestSchema = z.object({
  situation: z.string().min(3).max(2000),
  nativeLanguage: z.string().min(2).max(32).default('vi'),
  targetLanguage: z.string().min(2).max(32).default('zh'),
  level: z
    .enum(['beginner', 'elementary', 'intermediate', 'advanced'])
    .default('beginner'),
  role: z.string().max(200).optional(),
  otherSpeaker: z.string().max(200).optional(),
  goal: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
})

export type GenerateDialogueRequest = z.infer<
  typeof generateDialogueRequestSchema
>

export const normalizedSituationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  learnerRole: z.string().min(1),
  otherSpeaker: z.string().min(1),
  goal: z.string().min(1),
  tone: z.string().min(1),
  level: z.string().min(1),
  nativeLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
})

export type NormalizedSituation = z.infer<typeof normalizedSituationSchema>

export const dialogueLineSchema = z.object({
  index: z.number().int().nonnegative(),
  speaker: z.enum(['learner', 'other']),
  text: z.string().min(1),
  romanization: z.string().optional(),
  meaningNative: z.string().min(1),
})

export const generatedDialogueSchema = z.object({
  title: z.string().min(1),
  lines: z.array(dialogueLineSchema).min(4).max(16),
})

export type GeneratedDialogue = z.infer<typeof generatedDialogueSchema>

export const chunkSlotSchema = z.object({
  name: z.string().min(1),
  placeholder: z.string().min(1),
  variants: z.array(z.string().min(1)).min(2).max(8),
})

export const extractedChunkSchema = z.object({
  frame: z.string().min(1),
  romanization: z.string().optional(),
  meaningNative: z.string().min(1),
  example: z.string().min(1),
  slots: z.array(chunkSlotSchema).max(3),
  register: z.enum(['casual', 'neutral', 'formal']).default('neutral'),
})

export const extractedChunksSchema = z.object({
  chunks: z.array(extractedChunkSchema).min(3).max(10),
})

export type ExtractedChunks = z.infer<typeof extractedChunksSchema>
