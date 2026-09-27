export const SITUATION_MAX_LENGTH = 500;

export type OnboardingPreviewLine = {
  speaker: "learner" | "other";
  text: string;
};

export type OnboardingGoal = {
  id: "travel" | "work" | "study" | "daily" | "social" | "custom";
  label: string;
  scene: string;
  sceneAlt: string;
  prompt: string;
  meaning: string;
  example: string;
  previewTitle: string;
  previewSummary: string;
  lines: readonly OnboardingPreviewLine[];
  chunks: readonly string[];
};

export const onboardingGoals = [
  {
    id: "travel",
    label: "Travel",
    scene: "/onboarding/onboarding-travel.png",
    sceneAlt: "Sen holding a map in an airport terminal, with a plane outside the window",
    prompt: "May I see your passport?",
    meaning: "Tôi có thể xem hộ chiếu của bạn không?",
    example:
      "I'm flying to Taiwan next month and need to speak with airport staff, ask for directions, and check in.",
    previewTitle: "At the airport",
    previewSummary:
      "A real conversation to help you navigate the airport, check in, and get to your gate.",
    lines: [
      {
        speaker: "learner",
        text: "Excuse me, where is the check-in counter for China Airlines?",
      },
      { speaker: "other", text: "It's over there, near Row C." },
    ],
    chunks: ["check-in counter", "boarding pass", "Where is …?"],
  },
  {
    id: "work",
    label: "Work",
    scene: "/onboarding/onboarding-work.png",
    sceneAlt: "Sen holding a notebook in a bright office lobby",
    prompt: "Nice to meet you. I'm on the design team.",
    meaning: "Rất vui được gặp bạn. Tôi thuộc nhóm thiết kế.",
    example:
      "I start a new job next week and need to introduce myself in the Monday standup.",
    previewTitle: "First day at work",
    previewSummary:
      "Introduce yourself, ask where things are, and join your first meeting.",
    lines: [
      {
        speaker: "learner",
        text: "Hi, I'm new here. Could you show me the meeting room?",
      },
      { speaker: "other", text: "Of course. It's just down the hall, on the left." },
    ],
    chunks: ["Nice to meet you", "I'm on the … team", "Could you show me …?"],
  },
  {
    id: "study",
    label: "Study abroad",
    scene: "/onboarding/onboarding-study.png",
    sceneAlt: "Sen with a book on a leafy campus path",
    prompt: "I'm particularly interested in this course.",
    meaning: "Tôi đặc biệt quan tâm đến khóa học này.",
    example: "Meeting my professor for the first time and asking about office hours.",
    previewTitle: "Meeting your professor",
    previewSummary: "Say hello, name your interest, and ask about office hours.",
    lines: [
      {
        speaker: "learner",
        text: "Hello, Professor Lee. I'm particularly interested in this course.",
      },
      { speaker: "other", text: "Welcome. My office hours are on Thursday afternoon." },
    ],
    chunks: ["I'm particularly interested in …", "office hours", "Could I ask …?"],
  },
  {
    id: "daily",
    label: "Daily conversations",
    scene: "/onboarding/onboarding-daily.png",
    sceneAlt: "Sen waving at a sunny cafe counter",
    prompt: "I'd like a latte, please.",
    meaning: "Cho tôi một ly latte.",
    example: "Ordering coffee for here and asking if they have oat milk.",
    previewTitle: "Ordering at a cafe",
    previewSummary: "Order, choose for here or to go, and ask a simple follow-up.",
    lines: [
      { speaker: "learner", text: "I'd like a latte, please. For here." },
      { speaker: "other", text: "Sure. Would you like anything else?" },
    ],
    chunks: ["I'd like …", "For here", "Could I get …?"],
  },
  {
    id: "social",
    label: "Dating and social life",
    scene: "/onboarding/onboarding-social.png",
    sceneAlt: "Sen at a small outdoor cafe table with two cups",
    prompt: "Are you free this weekend?",
    meaning: "Cuối tuần này bạn có rảnh không?",
    example: "Inviting someone for coffee on Saturday and suggesting a place.",
    previewTitle: "Making plans",
    previewSummary: "Invite someone out, suggest a place, and answer simply.",
    lines: [
      { speaker: "learner", text: "Are you free this weekend? Want to grab coffee?" },
      { speaker: "other", text: "I'd love to. Saturday afternoon works for me." },
    ],
    chunks: ["Are you free …?", "Want to grab …?", "I'd love to"],
  },
  {
    id: "custom",
    label: "Custom situation",
    scene: "/onboarding/onboarding-custom.png",
    sceneAlt: "Sen reading a blank notebook in a garden",
    prompt: "Here's the situation I need.",
    meaning: "Đây là tình huống tôi cần.",
    example: "Describe the conversation in your own words.",
    previewTitle: "Your conversation",
    previewSummary:
      "Describe it below. OpenSen will turn that note into lines and chunks.",
    lines: [
      { speaker: "learner", text: "I need to say this clearly." },
      { speaker: "other", text: "Got it. Let's practice the useful lines." },
    ],
    chunks: ["I need to …", "Could we …?", "Let me explain …"],
  },
] as const satisfies readonly OnboardingGoal[];

export const onboardingGoalLabels = onboardingGoals.map((goal) => goal.label);

export function goalByLabel(label: string) {
  return onboardingGoals.find((goal) => goal.label === label) ?? onboardingGoals[0];
}
