import type { GeneratedPack, PipelineTrace } from './generated-pack.js'
import {
  PIPELINE_STEPS,
  PROMPT_VERSIONS,
  SCHEMA_VERSIONS,
} from './generated-pack.js'

export const sampleGenerateRequest = {
  situation: 'Gặp sếp lần đầu ở Thâm Quyến',
  nativeLanguage: 'vi',
  targetLanguage: 'zh',
  level: 'beginner' as const,
  role: 'nhân viên mới',
  otherSpeaker: 'sếp',
  goal: 'giới thiệu bản thân',
  tone: 'lịch sự',
}

export const sampleNormalizedSituation = {
  name: 'Gặp sếp lần đầu',
  description: 'Buổi gặp đầu tiên với sếp ở Thâm Quyến',
  learnerRole: 'nhân viên mới',
  otherSpeaker: 'sếp',
  goal: 'giới thiệu bản thân',
  tone: 'lịch sự',
  level: 'beginner',
  nativeLanguage: 'vi',
  targetLanguage: 'zh',
}

export const sampleGeneratedDialogue = {
  title: 'Gặp sếp',
  lines: [
    {
      index: 0,
      speaker: 'other' as const,
      text: '你好',
      romanization: 'Nǐ hǎo',
      meaningNative: 'Xin chào',
    },
    {
      index: 1,
      speaker: 'learner' as const,
      text: '老板好',
      romanization: 'Lǎobǎn hǎo',
      meaningNative: 'Chào sếp',
    },
    {
      index: 2,
      speaker: 'other' as const,
      text: '你是新来的吗',
      romanization: 'Nǐ shì xīn lái de ma',
      meaningNative: 'Bạn mới đến phải không',
    },
    {
      index: 3,
      speaker: 'learner' as const,
      text: '是的，我是新来的',
      romanization: 'Shì de, wǒ shì xīn lái de',
      meaningNative: 'Vâng, tôi mới đến',
    },
  ],
}

export const sampleExtractedChunks = [
  {
    frame: '老板好',
    romanization: 'Lǎobǎn hǎo',
    meaningNative: 'Chào sếp',
    example: '老板好',
    slots: [],
    register: 'neutral' as const,
  },
  {
    frame: '我是____',
    romanization: 'Wǒ shì ____',
    meaningNative: 'Tôi là ...',
    example: '我是新来的',
    slots: [
      {
        name: 'role',
        placeholder: '____',
        variants: ['新来的', '实习生', '工程师'],
      },
    ],
    register: 'formal' as const,
  },
  {
    frame: '是的，我是____',
    romanization: 'Shì de, wǒ shì ____',
    meaningNative: 'Vâng, tôi là ...',
    example: '是的，我是新来的',
    slots: [
      {
        name: 'role',
        placeholder: '____',
        variants: ['新来的', '实习生'],
      },
    ],
    register: 'neutral' as const,
  },
]

export function buildSamplePack(): GeneratedPack {
  return {
    situation: {
      name: sampleNormalizedSituation.name,
      description: sampleNormalizedSituation.description,
      category: 'generated',
      roleSelf: sampleNormalizedSituation.learnerRole,
      roleOther: sampleNormalizedSituation.otherSpeaker,
      goal: sampleNormalizedSituation.goal,
      tone: sampleNormalizedSituation.tone,
    },
    dialogue: {
      title: sampleGeneratedDialogue.title,
      level: sampleNormalizedSituation.level,
      createdBy: 'ai_generator',
      lines: sampleGeneratedDialogue.lines.map((line) => ({
        position: line.index,
        speaker: line.speaker,
        text: line.text,
      })),
    },
    chunks: [
      {
        text: '老板好',
        type: 'sentence',
        meaning: 'Chào sếp',
        pronunciation: 'Lǎobǎn hǎo',
        level: 'beginner',
        register: 'neutral',
        pattern: {
          template: '老板好',
          meaning: 'Chào sếp',
          difficulty: 'easy',
          level: 'beginner',
          register: 'neutral',
          slots: [],
        },
      },
      {
        text: '我是新来的',
        type: 'phrase',
        meaning: 'Tôi là ...',
        pronunciation: 'Wǒ shì xīn lái de',
        level: 'beginner',
        register: 'formal',
        pattern: {
          template: '我是____',
          meaning: 'Tôi là ...',
          difficulty: 'easy',
          level: 'beginner',
          register: 'formal',
          slots: [
            {
              name: 'role',
              position: 0,
              expectedPos: 'phrase',
              variants: [
                { text: '新来的', meaning: '新来的', level: 'beginner' },
                { text: '实习生', meaning: '实习生', level: 'beginner' },
              ],
            },
          ],
        },
      },
      {
        text: '是的，我是新来的',
        type: 'phrase',
        meaning: 'Vâng, tôi là ...',
        pronunciation: 'Shì de, wǒ shì xīn lái de',
        level: 'beginner',
        register: 'neutral',
        pattern: {
          template: '是的，我是____',
          meaning: 'Vâng, tôi là ...',
          difficulty: 'easy',
          level: 'beginner',
          register: 'neutral',
          slots: [
            {
              name: 'role',
              position: 0,
              expectedPos: 'phrase',
              variants: [
                { text: '新来的', meaning: '新来的', level: 'beginner' },
                { text: '实习生', meaning: '实习生', level: 'beginner' },
              ],
            },
          ],
        },
      },
    ],
  }
}

export function buildSampleTraces(): PipelineTrace[] {
  return PIPELINE_STEPS.map((step, index) => ({
    step,
    model: `test-model-${index}`,
    promptVersion: PROMPT_VERSIONS[step],
    schemaVersion: SCHEMA_VERSIONS[step],
    input: { fixture: step },
    output: { fixture: step },
    validationVerdict: 'pass' as const,
  }))
}
