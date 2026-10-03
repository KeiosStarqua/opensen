import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChunkLibrary } from "@/components/chunks/chunk-library";
import { PracticePlanView } from "@/components/plan/practice-plan-view";
import { SavedSentencesScreen } from "@/components/saved-sentences/saved-sentences-screen";
import { SituationsCatalog } from "@/components/situations/situations-catalog";
import { ExploreScreen } from "@/components/studio/explore-screen";
import { HomeScreen } from "@/components/studio/home-screen";
import { LearnScreen } from "@/components/studio/learn-screen";
import { LibraryScreen } from "@/components/studio/library-screen";
import { ProfileScreen } from "@/components/studio/profile-screen";
import { SentenceScreen } from "@/components/studio/sentence-screen";
import { StudioProvider } from "@/components/studio/studio-provider";
import { TodayDashboard } from "@/components/today/today-dashboard";

const sessionState = vi.hoisted(() => ({
  data: null as { user: { email: string; name: string } } | null,
  isPending: false,
}));

const savedList = vi.hoisted(() => ({
  data: undefined as { id: string; text: string }[] | undefined,
  error: null as unknown,
  isPending: true,
}));

const savedActions = vi.hoisted(() => ({
  list: { isPending: true },
  rows: undefined as { id: string; text: string }[] | undefined,
  isSaved: () => false,
  toggleText: () => {},
  unsaveId: () => {},
  pending: false,
  error: null as string | null,
  listError: null as string | null,
}));

const planQuery = vi.hoisted(() => ({
  data: undefined as
    | {
        total: number;
        dueNow: number;
        dueNext7Days: number;
        reviewedToday: number;
      }
    | undefined,
  error: null as unknown,
  isPending: true,
  refetch: () => Promise.resolve(),
}));

const dueQuery = vi.hoisted(() => ({
  data: undefined as
    | {
        chunkId: string;
        text: string;
        meaning: string;
        status: string;
        dueAt: string | null;
      }[]
    | undefined,
  error: null as unknown,
  isPending: true,
  refetch: () => Promise.resolve(),
}));

const chunksQuery = vi.hoisted(() => ({
  data: undefined as
    | {
        id: string;
        text: string;
        meaning: string;
        register: string;
        level: string;
      }[]
    | undefined,
  error: null as unknown,
  isPending: true,
  isPlaceholderData: false,
}));

const situationsQuery = vi.hoisted(() => ({
  data: undefined as
    | { id: string; category: string; name: string; description: string }[]
    | undefined,
  error: null as unknown,
  isPending: true,
}));

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

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

vi.mock("@/lib/use-app-navigate", () => ({
  useAppNavigate: () => () => {},
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => sessionState,
  },
}));

vi.mock("@/lib/query/hooks/saved-sentences", () => ({
  useSavedSentences: () => savedList,
  useSaveSentence: () => ({ isPending: false, error: null, mutate: () => {} }),
  useUnsaveSentences: () => ({ isPending: false, error: null, mutate: () => {} }),
  useSavedSentenceListActions: () => savedActions,
}));

vi.mock("@/lib/query/hooks/practice", () => ({
  usePracticePlan: () => planQuery,
  usePracticeDue: () => dueQuery,
}));

vi.mock("@/lib/query/hooks/chunks", () => ({
  useChunks: () => chunksQuery,
}));

vi.mock("@/lib/query/hooks/situations", () => ({
  useSituationsList: () => situationsQuery,
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

const planStats = {
  total: 4,
  dueNow: 2,
  dueNext7Days: 3,
  reviewedToday: 1,
};

const dueItem = {
  chunkId: "chunk-1",
  text: "May I see your passport?",
  meaning: "Ask for a passport.",
  status: "review",
  dueAt: null,
};

beforeEach(() => {
  sessionState.data = null;
  sessionState.isPending = false;
  savedList.data = undefined;
  savedList.error = null;
  savedList.isPending = true;
  savedActions.list = { isPending: true };
  savedActions.rows = undefined;
  savedActions.listError = null;
  savedActions.error = null;
  savedActions.pending = false;
  planQuery.data = undefined;
  planQuery.error = null;
  planQuery.isPending = true;
  dueQuery.data = undefined;
  dueQuery.error = null;
  dueQuery.isPending = true;
  chunksQuery.data = undefined;
  chunksQuery.error = null;
  chunksQuery.isPending = true;
  chunksQuery.isPlaceholderData = false;
  situationsQuery.data = undefined;
  situationsQuery.error = null;
  situationsQuery.isPending = true;
});

describe("shell routes with local content", () => {
  it("renders home, explore, and learn immediately", () => {
    const home = html(
      <StudioProvider>
        <HomeScreen />
      </StudioProvider>,
    );
    const explore = html(
      <StudioProvider>
        <ExploreScreen />
      </StudioProvider>,
    );
    const learn = html(
      <StudioProvider>
        <LearnScreen topicId="travel" />
      </StudioProvider>,
    );

    expect(home).toContain("Hi Minh!");
    expect(explore).toContain("Explore");
    expect(learn).toContain("At the Airport");
    expectNoSkeleton(home);
    expectNoSkeleton(explore);
    expectNoSkeleton(learn);
  });
});

describe("lesson sentence save state", () => {
  it("skeletons the star while the saved list is loading and keeps the sentence", () => {
    const markup = html(
      <StudioProvider>
        <SentenceScreen topicId="travel" stepId="check-in" index={0} />
      </StudioProvider>,
    );

    expect(markup).toContain("May I see your passport?");
    expectSkeleton(markup, "Loading save state");
  });

  it("shows the star once the list returns, and the error instead of a skeleton", () => {
    savedActions.list = { isPending: false };
    savedActions.rows = [];
    const ready = html(
      <StudioProvider>
        <SentenceScreen topicId="travel" stepId="check-in" index={0} />
      </StudioProvider>,
    );
    expect(ready).toContain('aria-label="Save sentence"');
    expectNoSkeleton(ready);

    savedActions.list = { isPending: true };
    savedActions.rows = undefined;
    savedActions.listError = "Could not load sentences.";
    const failed = html(
      <StudioProvider>
        <SentenceScreen topicId="travel" stepId="check-in" index={0} />
      </StudioProvider>,
    );
    expect(failed).toContain("Could not load sentences.");
    expect(failed).toContain("May I see your passport?");
    expectNoSkeleton(failed);
  });
});

describe("saved sentence lists", () => {
  it("skeletons /saved while the list is pending, then shows rows, empty, or the error", () => {
    const pending = html(<SavedSentencesScreen />);
    expect(pending).toContain("Sentences you heard");
    expect(pending).toContain("Add a sentence");
    expectSkeleton(pending, "Loading your sentences");
    expect(pending).not.toContain("Loading your sentences…");

    savedList.isPending = false;
    savedList.data = [];
    const empty = html(<SavedSentencesScreen />);
    expect(empty).toContain("Nothing saved yet.");
    expectNoSkeleton(empty);

    savedList.data = [{ id: "s1", text: "Could you say that again?" }];
    const ready = html(<SavedSentencesScreen />);
    expect(ready).toContain("Could you say that again?");
    expectNoSkeleton(ready);

    savedList.data = undefined;
    savedList.isPending = false;
    savedList.error = new Error("down");
    const failed = html(<SavedSentencesScreen />);
    expect(failed).toContain("Something went wrong.");
    expectNoSkeleton(failed);
  });

  it("skeletons the library saved tab the same way", () => {
    const pending = html(
      <StudioProvider>
        <LibraryScreen />
      </StudioProvider>,
    );
    expect(pending).toContain("My Sentences");
    expectSkeleton(pending, "Loading your sentences");

    savedActions.list = { isPending: false };
    savedActions.rows = [];
    const empty = html(
      <StudioProvider>
        <LibraryScreen />
      </StudioProvider>,
    );
    expect(empty).toContain("No sentences in this filter yet.");
    expectNoSkeleton(empty);

    savedActions.rows = [{ id: "s1", text: "Could you say that again?" }];
    const ready = html(
      <StudioProvider>
        <LibraryScreen />
      </StudioProvider>,
    );
    expect(ready).toContain("Could you say that again?");
    expectNoSkeleton(ready);

    savedActions.rows = undefined;
    savedActions.list = { isPending: true };
    savedActions.listError = "Could not load sentences.";
    const failed = html(
      <StudioProvider>
        <LibraryScreen />
      </StudioProvider>,
    );
    expect(failed).toContain("Could not load sentences.");
    expectNoSkeleton(failed);
  });
});

describe("today and plan", () => {
  it("keeps the today heading and skeletons the plan, then the due list", () => {
    const pending = html(<TodayDashboard />);
    expect(pending).toContain("Today");
    expect(pending).toContain("Settings");
    expectSkeleton(pending, "Loading today");
    expect(pending).not.toContain(">Loading…<");

    planQuery.isPending = false;
    planQuery.data = planStats;
    dueQuery.isPending = true;
    const duePending = html(<TodayDashboard />);
    expect(duePending).toContain("Due for recall");
    expect(duePending).toContain(">2<");
    expectSkeleton(duePending, "Loading due sentences");

    dueQuery.isPending = false;
    dueQuery.data = [dueItem];
    const ready = html(<TodayDashboard />);
    expect(ready).toContain("May I see your passport?");
    expectNoSkeleton(ready);

    dueQuery.data = [];
    const noDue = html(<TodayDashboard />);
    expect(noDue).not.toContain("Due now");
    expectNoSkeleton(noDue);

    planQuery.data = { ...planStats, total: 0, dueNow: 0 };
    const empty = html(<TodayDashboard />);
    expect(empty).toContain("You have not enrolled any chunks yet.");
    expectNoSkeleton(empty);

    planQuery.data = undefined;
    planQuery.isPending = false;
    planQuery.error = new Error("down");
    const failed = html(<TodayDashboard />);
    expect(failed).toContain("Something went wrong.");
    expectNoSkeleton(failed);
  });

  it("shows the plan title immediately and skeletons stats, not errors or an empty plan", () => {
    const pending = html(<PracticePlanView />);
    expect(pending).toContain("Plan");
    expectSkeleton(pending, "Loading plan");
    expect(pending).not.toContain("Loading plan…");

    planQuery.isPending = false;
    planQuery.data = planStats;
    dueQuery.isPending = true;
    const duePending = html(<PracticePlanView />);
    expect(duePending).toContain("Enrolled");
    expect(duePending).toContain("Up next");
    expectSkeleton(duePending, "Loading due sentences");

    dueQuery.isPending = false;
    dueQuery.data = [dueItem];
    const ready = html(<PracticePlanView />);
    expect(ready).toContain("May I see your passport?");
    expectNoSkeleton(ready);

    planQuery.data = { ...planStats, total: 0 };
    const empty = html(<PracticePlanView />);
    expect(empty).toContain("No chunks in your plan yet.");
    expectNoSkeleton(empty);

    planQuery.data = undefined;
    planQuery.isPending = false;
    planQuery.error = new Error("down");
    const failed = html(<PracticePlanView />);
    expect(failed).toContain("Something went wrong.");
    expect(failed).toContain("DATABASE_URL");
    expectNoSkeleton(failed);
  });
});

describe("patterns and situations", () => {
  it("skeletons chunk rows and leaves the search chrome in place", () => {
    const pending = html(<ChunkLibrary />);
    expect(pending).toContain("Library");
    expect(pending).toContain("Search chunks");
    expect(pending).toContain("Export to Anki");
    expectSkeleton(pending, "Loading chunks");

    chunksQuery.isPending = false;
    chunksQuery.data = [];
    const empty = html(<ChunkLibrary />);
    expect(empty).toContain("No chunks yet.");
    expectNoSkeleton(empty);

    chunksQuery.data = [
      {
        id: "c1",
        text: "Here is my booking.",
        meaning: "Offer your reservation.",
        register: "polite",
        level: "a2",
      },
    ];
    const ready = html(<ChunkLibrary />);
    expect(ready).toContain("Here is my booking.");
    expectNoSkeleton(ready);

    chunksQuery.data = undefined;
    chunksQuery.isPending = true;
    chunksQuery.error = new Error("down");
    const failed = html(<ChunkLibrary />);
    expect(failed).toContain("Something went wrong.");
    expectNoSkeleton(failed);
  });

  it("skeletons situation cards and keeps errors and the empty catalog", () => {
    const pending = html(<SituationsCatalog />);
    expectSkeleton(pending, "Loading situations");
    expect(pending).not.toContain("Loading situations…");

    situationsQuery.isPending = false;
    situationsQuery.data = [];
    const empty = html(<SituationsCatalog />);
    expect(empty).toContain("No situations in the database yet.");
    expectNoSkeleton(empty);

    situationsQuery.data = [
      {
        id: "sit-1",
        category: "travel",
        name: "At the airport",
        description: "Check in for a flight.",
      },
    ];
    const ready = html(<SituationsCatalog />);
    expect(ready).toContain("At the airport");
    expectNoSkeleton(ready);

    situationsQuery.data = undefined;
    situationsQuery.isPending = true;
    situationsQuery.error = new Error("down");
    const failed = html(<SituationsCatalog />);
    expect(failed).toContain("Something went wrong.");
    expectNoSkeleton(failed);
  });
});

describe("profile", () => {
  it("skeletons only the email line while the session is pending", () => {
    sessionState.isPending = true;
    const pending = html(
      <StudioProvider>
        <ProfileScreen />
      </StudioProvider>,
    );
    expect(pending).toContain("My Progress");
    expect(pending).toContain("Day streak");
    expectSkeleton(pending, "Loading account");

    sessionState.isPending = false;
    sessionState.data = { user: { email: "lan@example.com", name: "Lan" } };
    const ready = html(
      <StudioProvider>
        <ProfileScreen />
      </StudioProvider>,
    );
    expect(ready).toContain("Signed in as lan@example.com");
    expectNoSkeleton(ready);

    sessionState.data = null;
    const signedOut = html(
      <StudioProvider>
        <ProfileScreen />
      </StudioProvider>,
    );
    expect(signedOut).not.toContain("Signed in as");
    expectNoSkeleton(signedOut);
  });
});
