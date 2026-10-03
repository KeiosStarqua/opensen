import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubstitutionDrillSession } from "@/components/drills/substitution-drill-session";
import { PracticeSession } from "@/components/practice/practice-session";
import { SpeakingScreen } from "@/components/studio/speaking-screen";
import { StudioProvider } from "@/components/studio/studio-provider";
import { SuccessScreen } from "@/components/studio/success-screen";
import { WordOrderScreen } from "@/components/studio/word-order-screen";
import type { SentencePattern } from "@/lib/drills/drill-generator";
import type { DuePracticeItem } from "@/lib/practice/types";

const deckQuery = vi.hoisted(() => ({
  data: undefined as DuePracticeItem[] | undefined,
  error: null as unknown,
  isPending: true,
  isError: false,
  refetch: () => Promise.resolve(),
}));

const reviewMutation = vi.hoisted(() => ({
  error: null as unknown,
  isPending: false,
  reset: () => {},
  mutate: () => {},
}));

const handedOver = vi.hoisted(() => ({
  items: null as DuePracticeItem[] | null,
}));

const patternQuery = vi.hoisted(() => ({
  data: undefined as SentencePattern | undefined,
  error: null as unknown,
  isPending: true,
}));

const sessionPhase = vi.hoisted(() => ({
  step: null as "finished" | null,
  done: false,
}));

// renderToStaticMarkup cannot click through a session, so a finished screen
// is reached by the same initial state the component already uses.
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: (init: unknown) => {
      if (init === "prompt" && sessionPhase.step) {
        return actual.useState(sessionPhase.step);
      }
      if (init === false && sessionPhase.done) {
        return actual.useState(true);
      }
      return actual.useState(init);
    },
  };
});

vi.mock("@/components/app-link", () => ({
  AppLink: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/use-app-navigate", () => ({
  useAppNavigate: () => () => {},
}));

vi.mock("@/lib/query/hooks/practice", () => ({
  usePracticeSessionDeck: () => deckQuery,
  useSubmitReview: () => reviewMutation,
}));

vi.mock("@/lib/practice/focus-queue", () => ({
  consumePracticeFocusQueue: () => handedOver.items,
}));

vi.mock("@/lib/query/hooks/chunks", () => ({
  useSentencePattern: () => patternQuery,
}));

function html(node: React.ReactNode) {
  return renderToStaticMarkup(node);
}

function expectSkeleton(markup: string, label: string) {
  expect(markup).toContain('data-slot="skeleton"');
  expect(markup).toContain(`aria-label="${label}"`);
}

function expectNoSkeleton(markup: string) {
  expect(markup).not.toContain('data-slot="skeleton"');
}

const dueItem: DuePracticeItem = {
  chunkId: "chunk-1",
  text: "May I see your passport?",
  meaning: "Ask for a passport.",
  status: "review",
  dueAt: null,
  stability: 1,
  difficulty: 5,
  reps: 1,
  lapses: 0,
};

const pattern: SentencePattern = {
  id: "pattern-1",
  template: "I'd like {item}.",
  slots: [
    {
      id: "slot-1",
      name: "item",
      position: 0,
      variants: [
        { id: "v1", text: "coffee", meaning: "a drink" },
        { id: "v2", text: "tea", meaning: "another drink" },
      ],
    },
  ],
};

beforeEach(() => {
  deckQuery.data = undefined;
  deckQuery.error = null;
  deckQuery.isPending = true;
  deckQuery.isError = false;
  reviewMutation.error = null;
  reviewMutation.isPending = false;
  handedOver.items = null;
  patternQuery.data = undefined;
  patternQuery.error = null;
  patternQuery.isPending = true;
  sessionPhase.step = null;
  sessionPhase.done = false;
});

describe("studio practice screens", () => {
  it("renders the word-order sentence immediately", () => {
    const markup = html(
      <StudioProvider>
        <WordOrderScreen />
      </StudioProvider>,
    );
    expect(markup).toContain("Put the words in the correct order.");
    expect(markup).toContain("passport");
    expect(markup).toContain("Check");
    expectNoSkeleton(markup);
  });

  it("renders the speaking sentence immediately", () => {
    const markup = html(
      <StudioProvider>
        <SpeakingScreen />
      </StudioProvider>,
    );
    expect(markup).toContain("Could you help me find the station?");
    expect(markup).toContain("Next");
    expectNoSkeleton(markup);
  });

  it("renders the finished lesson immediately", () => {
    const markup = html(
      <StudioProvider>
        <SuccessScreen claim={null} />
      </StudioProvider>,
    );
    expect(markup).toContain("Great job!");
    expect(markup).toContain("Continue");
    expectNoSkeleton(markup);
  });
});

describe("recall session", () => {
  it("skeletons the sentence and answer controls while the deck is pending", () => {
    const markup = html(<PracticeSession />);
    expect(markup).toContain("Practice session");
    expectSkeleton(markup, "Loading practice");
    expect(markup).not.toContain("Loading due items");
  });

  it("shows the sentence once the deck arrives", () => {
    deckQuery.isPending = false;
    deckQuery.data = [dueItem];
    const markup = html(<PracticeSession />);
    expect(markup).toContain("Ask for a passport.");
    expect(markup).toContain("Check answer");
    expectNoSkeleton(markup);
  });

  it("keeps a handed-over queue on screen while the due query is still pending", () => {
    handedOver.items = [dueItem];
    const markup = html(<PracticeSession />);
    expect(markup).toContain("Ask for a passport.");
    expectNoSkeleton(markup);
  });

  it("shows an empty deck without a skeleton", () => {
    deckQuery.isPending = false;
    deckQuery.data = [];
    const markup = html(<PracticeSession />);
    expect(markup).toContain("Nothing due yet");
    expectNoSkeleton(markup);
  });

  it("shows an error without a skeleton", () => {
    deckQuery.isPending = false;
    deckQuery.isError = true;
    deckQuery.error = new Error("down");
    const markup = html(<PracticeSession />);
    expect(markup).toContain("Practice unavailable");
    expect(markup).toContain("Something went wrong.");
    expectNoSkeleton(markup);
  });

  it("shows a finished session without a skeleton", () => {
    deckQuery.isPending = false;
    deckQuery.data = [dueItem];
    sessionPhase.step = "finished";
    const markup = html(<PracticeSession />);
    expect(markup).toContain("Session complete");
    expectNoSkeleton(markup);
  });
});

describe("substitution drill", () => {
  it("keeps the title and skeletons the prompt while the pattern is pending", () => {
    const markup = html(<SubstitutionDrillSession patternId="pattern-1" />);
    expect(markup).toContain("Substitution drill");
    expectSkeleton(markup, "Loading drill");
    expect(markup).not.toContain("Loading drill…");
  });

  it("shows the prompt once the pattern arrives", () => {
    patternQuery.isPending = false;
    patternQuery.data = pattern;
    const markup = html(<SubstitutionDrillSession patternId="pattern-1" />);
    expect(markup).toContain("_____");
    expect(markup).toContain(">Check<");
    expectNoSkeleton(markup);
  });

  it("shows an error without a skeleton", () => {
    patternQuery.isPending = false;
    patternQuery.error = new Error("down");
    const markup = html(<SubstitutionDrillSession patternId="pattern-1" />);
    expect(markup).toContain("Something went wrong.");
    expectNoSkeleton(markup);
  });

  it("shows too few variants without a skeleton", () => {
    patternQuery.isPending = false;
    patternQuery.data = {
      ...pattern,
      slots: [
        {
          ...pattern.slots[0],
          variants: [pattern.slots[0].variants[0]],
        },
      ],
    };
    const markup = html(<SubstitutionDrillSession patternId="pattern-1" />);
    expect(markup).toContain("at least two fill variants");
    expectNoSkeleton(markup);
  });

  it("shows a finished drill without a skeleton", () => {
    patternQuery.isPending = false;
    patternQuery.data = pattern;
    sessionPhase.done = true;
    const markup = html(<SubstitutionDrillSession patternId="pattern-1" />);
    expect(markup).toContain("Drill complete");
    expectNoSkeleton(markup);
  });
});
