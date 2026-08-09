import { describe, expect, it, vi } from 'vitest'
import type { AiProvider } from '../types.js'
import { generateDialoguePack } from './generate-dialogue.js'
import {
  sampleExtractedChunks,
  sampleGeneratedDialogue,
  sampleNormalizedSituation,
} from '../../dialogue-packs/fixtures.js'
import { PIPELINE_STEPS } from '../../dialogue-packs/generated-pack.js'

function createFakeProvider(): AiProvider {
  return {
    id: 'openrouter',
    model: 'test-model',
    completeJson: vi.fn(async (options) => {
      if (options.schemaName === 'normalized_situation') {
        return {
          data: sampleNormalizedSituation,
          model: 'model-normalize',
          provider: 'openrouter',
          rawText: '{}',
        }
      }
      if (options.schemaName === 'generated_dialogue') {
        return {
          data: sampleGeneratedDialogue,
          model: 'model-dialogue',
          provider: 'openrouter',
          rawText: '{}',
        }
      }
      return {
        data: { chunks: sampleExtractedChunks },
        model: 'model-chunks',
        provider: 'openrouter',
        rawText: '{}',
      }
    }),
  }
}

describe('generateDialoguePack', () => {
  it('returns presentation fields plus persistable pack and traces', async () => {
    const provider = createFakeProvider()
    const result = await generateDialoguePack(provider, {
      situation: 'Gặp sếp',
      nativeLanguage: 'vi',
      targetLanguage: 'zh',
      level: 'beginner',
    })

    expect(result.situation).toEqual(sampleNormalizedSituation)
    expect(result.dialogue).toEqual(sampleGeneratedDialogue)
    expect(result.chunks).toEqual(sampleExtractedChunks)
    expect(result.pack.chunks.length).toBe(3)
    expect(result.traces.map((trace) => trace.step)).toEqual([...PIPELINE_STEPS])
    expect(provider.completeJson).toHaveBeenCalledTimes(3)
  })

  it('rejects malformed provider output before returning a persistable pack', async () => {
    const provider: AiProvider = {
      id: 'openrouter',
      model: 'test-model',
      completeJson: vi.fn(async (options) => {
        if (options.schemaName === 'normalized_situation') {
          return {
            data: { invalid: true },
            model: 'model-normalize',
            provider: 'openrouter',
            rawText: '{}',
          }
        }
        throw new Error('should not reach dialogue step')
      }),
    }

    await expect(
      generateDialoguePack(provider, {
        situation: 'Gặp sếp',
        nativeLanguage: 'vi',
        targetLanguage: 'zh',
        level: 'beginner',
      }),
    ).rejects.toThrow()
  })
})
