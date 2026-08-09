import type { AiProvider } from '../types.js'
import {
  buildGeneratedPack,
  buildPipelineTraces,
  type GeneratedPack,
  type PipelineTrace,
} from '../../dialogue-packs/generated-pack.js'
import {
  extractedChunksSchema,
  generatedDialogueSchema,
  normalizedSituationSchema,
  type ExtractedChunks,
  type GenerateDialogueRequest,
  type GeneratedDialogue,
  type NormalizedSituation,
} from './schemas.js'

export type GenerateDialogueResult = {
  situation: NormalizedSituation
  dialogue: GeneratedDialogue
  chunks: ExtractedChunks['chunks']
  meta: {
    provider: string
    model: string
    steps: Array<{ step: string; model: string }>
  }
  pack: GeneratedPack
  traces: PipelineTrace[]
}

function langLabel(code: string): string {
  const known: Record<string, string> = {
    zh: 'Mandarin Chinese (Simplified, with pinyin)',
    'zh-CN': 'Mandarin Chinese (Simplified, with pinyin)',
    'zh-TW': 'Mandarin Chinese (Traditional, with pinyin)',
    en: 'English',
    vi: 'Vietnamese',
    ja: 'Japanese',
    ko: 'Korean',
  }
  return known[code] ?? code
}

/**
 * Multi-step generation per product-strategy AI pipeline.
 * Backend owns structural correctness via Zod after each provider call.
 */
export async function generateDialoguePack(
  provider: AiProvider,
  input: GenerateDialogueRequest,
): Promise<GenerateDialogueResult> {
  const steps: Array<{ step: string; model: string }> = []
  const models: Record<
    'situation_normalization' | 'dialogue_generation' | 'chunk_extraction',
    string
  > = {
    situation_normalization: '',
    dialogue_generation: '',
    chunk_extraction: '',
  }
  const l1 = langLabel(input.nativeLanguage)
  const l2 = langLabel(input.targetLanguage)

  const normalized = await provider.completeJson({
    schemaName: 'normalized_situation',
    schema: normalizedSituationSchema,
    messages: [
      {
        role: 'system',
        content: [
          'You normalize a learner speaking-practice request into a JSON object.',
          'Return ONLY JSON matching the required keys.',
          `Learner native language (L1 meanings): ${l1}.`,
          `Target spoken language (L2 dialogue text): ${l2}.`,
          'Keep the situation concrete and usable for a short real conversation.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          situation: input.situation,
          role: input.role,
          otherSpeaker: input.otherSpeaker,
          goal: input.goal,
          tone: input.tone,
          level: input.level,
          nativeLanguage: input.nativeLanguage,
          targetLanguage: input.targetLanguage,
        }),
      },
    ],
  })
  steps.push({ step: 'situation_normalization', model: normalized.model })
  models.situation_normalization = normalized.model

  const dialogue = await provider.completeJson({
    schemaName: 'generated_dialogue',
    schema: generatedDialogueSchema,
    messages: [
      {
        role: 'system',
        content: [
          'You write a short, memorization-ready dialogue for speaking practice.',
          'Return ONLY JSON: { "title": string, "lines": [{ "index", "speaker", "text", "romanization?", "meaningNative" }] }.',
          `Dialogue line "text" MUST be in ${l2}.`,
          `If the target is Chinese, include pinyin in "romanization".`,
          `"meaningNative" MUST be in ${l1}.`,
          'speaker is only "learner" or "other".',
          '4–12 turns. Natural, level-appropriate, useful in the stated situation.',
          'No markdown, no commentary.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify(normalized.data),
      },
    ],
  })
  steps.push({ step: 'dialogue_generation', model: dialogue.model })
  models.dialogue_generation = dialogue.model

  const chunks = await provider.completeJson({
    schemaName: 'extracted_chunks',
    schema: extractedChunksSchema,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: [
          'Extract reusable speaking chunks (sentence frames with swappable slots) from the dialogue.',
          'Return ONLY JSON: { "chunks": [{ "frame", "romanization?", "meaningNative", "example", "slots": [{ "name", "placeholder", "variants" }], "register" }] }.',
          `"frame" and "example" MUST be in ${l2}. Use a clear blank like "____" for each slot in the frame.`,
          `If Chinese, include pinyin in "romanization".`,
          `"meaningNative" MUST be in ${l1}.`,
          'Prefer learner-spoken lines. Each chunk needs 2–5 slot variants that stay grammatical.',
          '3–8 chunks. No duplicate frames. No commentary.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          situation: normalized.data,
          dialogue: dialogue.data,
        }),
      },
    ],
  })
  steps.push({ step: 'chunk_extraction', model: chunks.model })
  models.chunk_extraction = chunks.model

  const pack = buildGeneratedPack(
    input,
    normalized.data,
    dialogue.data,
    chunks.data.chunks,
  )
  const traces = buildPipelineTraces(
    input,
    normalized.data,
    dialogue.data,
    chunks.data.chunks,
    models,
  )

  return {
    situation: normalized.data,
    dialogue: dialogue.data,
    chunks: chunks.data.chunks,
    meta: {
      provider: provider.id,
      model: provider.model,
      steps,
    },
    pack,
    traces,
  }
}
