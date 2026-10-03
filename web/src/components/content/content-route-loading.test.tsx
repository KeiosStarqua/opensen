import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChunkCreateForm } from "@/components/chunks/chunk-create-form";
import { ChunkDetailView } from "@/components/chunks/chunk-detail";
import { DialogueBuilder } from "@/components/dialogues/dialogue-builder";
import { DialogueView } from "@/components/dialogues/dialogue-view";
import { SituationDetail } from "@/components/situations/situation-detail";
import { ApiError } from "@/lib/api/types";
import type { ChunkDetail } from "@/lib/query/hooks/chunks";
import type {
  GeneratedDialogue,
  SavedDialogue,
} from "@/lib/query/hooks/dialogues";
import type { SituationDetail as SituationDetailData } from "@/lib/query/hooks/situations";

const chunkQuery = vi.hoisted(() => ({
  data: undefined as ChunkDetail | undefined,
  error: null as unknown,
  isPending: true,
}));

const updateMutation = vi.hoisted(() => ({
  error: null as unknown,
  isPending: false,
  mutate: () => {},
}));

const createMutation = vi.hoisted(() => ({
  error: null as unknown,
  isPending: false,
  mutate: () => {},
}));

const dialogueQuery = vi.hoisted(() => ({
  data: undefined as SavedDialogue | undefined,
  error: null as unknown,
  isPending: true,
}));

const generateMutation = vi.hoisted(() => ({
  data: undefined as GeneratedDialogue | undefined,
  error: null as unknown,
  isPending: false,
  mutate: () => {},
}));

const situationQuery = vi.hoisted(() => ({
  data: undefined as SituationDetailData | undefined,
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

vi.mock("@/lib/use-app-navigate", () => ({
  useAppNavigate: () => () => {},
}));

vi.mock("@/lib/query/hooks/chunks", () => ({
  useChunk: () => chunkQuery,
  useUpdateChunk: () => updateMutation,
  useCreateChunk: () => createMutation,
}));

vi.mock("@/lib/query/hooks/dialogues", () => ({
  useDialogue: () => dialogueQuery,
  useGenerateDialogue: () => generateMutation,
}));

vi.mock("@/lib/query/hooks/situations", () => ({
  useSituation: () => situationQuery,
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

const chunk: ChunkDetail = {
  id: "chunk-1",
  text: "I'm allergic to peanuts.",
  meaning: "Bị dị ứng đậu phộng.",
  register: "neutral",
  level: "beginner",
  editable: false,
  patternId: "pattern-1",
  situation: { id: "sit-1", name: "At a restaurant" },
};

const dialogue: SavedDialogue = {
  title: "Ordering coffee",
  level: "beginner",
  lines: [
    { speaker: "learner", text: "I'd like a coffee." },
    { speaker: "staff", text: "Sure." },
  ],
  chunks: [{ id: "c1", text: "I'd like a coffee.", meaning: "muốn cà phê" }],
};

const generated: GeneratedDialogue = {
  dialogue: {
    title: "Asking for the bill",
    lines: [{ speaker: "learner", text: "Could I get the bill?" }],
  },
  chunks: [],
};

const situation: SituationDetailData = {
  id: "sit-1",
  name: "At a cafe",
  description: "Order a drink.",
  category: "food",
  roleSelf: "customer",
  roleOther: "barista",
  goal: "Get a coffee",
  tone: "polite",
  intents: [{ id: "i1", name: "Order", description: "Ask for a drink" }],
  dialogues: [{ id: "d1", title: "Morning order", level: "beginner" }],
  chunks: [{ id: "c1", text: "I'd like a coffee.", meaning: "muốn cà phê" }],
};

beforeEach(() => {
  chunkQuery.data = undefined;
  chunkQuery.error = null;
  chunkQuery.isPending = true;
  updateMutation.error = null;
  updateMutation.isPending = false;
  createMutation.error = null;
  createMutation.isPending = false;
  dialogueQuery.data = undefined;
  dialogueQuery.error = null;
  dialogueQuery.isPending = true;
  generateMutation.data = undefined;
  generateMutation.error = null;
  generateMutation.isPending = false;
  situationQuery.data = undefined;
  situationQuery.error = null;
  situationQuery.isPending = true;
});

describe("chunk detail", () => {
  it("keeps the patterns link and skeletons the sentence while the chunk is pending", () => {
    const markup = html(<ChunkDetailView chunkId="chunk-1" />);
    expect(markup).toContain("← Sentence patterns");
    expectSkeleton(markup, "Loading chunk");
    expect(markup).not.toContain("Loading chunk…");
  });

  it("shows the sentence once the chunk arrives", () => {
    chunkQuery.isPending = false;
    chunkQuery.data = chunk;
    const markup = html(<ChunkDetailView chunkId="chunk-1" />);
    expect(markup).toContain("I&#x27;m allergic to peanuts.");
    expect(markup).toContain("Bị dị ứng đậu phộng.");
    expect(markup).toContain("Practice");
    expect(markup).toContain("Substitution drill");
    expectNoSkeleton(markup);
  });

  it("shows an editable chunk without a skeleton", () => {
    chunkQuery.isPending = false;
    chunkQuery.data = { ...chunk, editable: true, patternId: null };
    const markup = html(<ChunkDetailView chunkId="chunk-1" />);
    expect(markup).toContain("Save changes");
    expect(markup).toContain("I&#x27;m allergic to peanuts.");
    expectNoSkeleton(markup);
  });

  it("shows an error without a skeleton", () => {
    chunkQuery.isPending = false;
    chunkQuery.error = new Error("down");
    const markup = html(<ChunkDetailView chunkId="chunk-1" />);
    expect(markup).toContain("Something went wrong.");
    expectNoSkeleton(markup);
  });

  it("shows a not-found chunk without a skeleton", () => {
    chunkQuery.isPending = false;
    chunkQuery.error = new ApiError("http", "Chunk not found", 404);
    const markup = html(<ChunkDetailView chunkId="missing" />);
    expect(markup).toContain("Chunk not found");
    expectNoSkeleton(markup);
  });

  it("shows a settled empty chunk without a skeleton", () => {
    chunkQuery.isPending = false;
    const markup = html(<ChunkDetailView chunkId="missing" />);
    expect(markup).toContain("Chunk not found");
    expectNoSkeleton(markup);
  });
});

describe("new chunk", () => {
  it("renders the form immediately", () => {
    const markup = html(<ChunkCreateForm />);
    expect(markup).toContain("New chunk");
    expect(markup).toContain("Example sentence");
    expect(markup).toContain("Create chunk");
    expectNoSkeleton(markup);
  });

  it("keeps the form on screen while creating", () => {
    createMutation.isPending = true;
    const markup = html(<ChunkCreateForm />);
    expect(markup).toContain("Creating…");
    expect(markup).toContain("Example sentence");
    expectNoSkeleton(markup);
  });
});

describe("dialogue detail", () => {
  it("skeletons the title and lines while the dialogue is pending", () => {
    const markup = html(<DialogueView dialogueId="dialogue-1" />);
    expectSkeleton(markup, "Loading dialogue");
    expect(markup).not.toContain("Loading dialogue…");
  });

  it("shows the lines once the dialogue arrives", () => {
    dialogueQuery.isPending = false;
    dialogueQuery.data = dialogue;
    const markup = html(<DialogueView dialogueId="dialogue-1" />);
    expect(markup).toContain("Ordering coffee");
    expect(markup).toContain("I&#x27;d like a coffee.");
    expect(markup).toContain("Chunks");
    expectNoSkeleton(markup);
  });

  it("shows an error without a skeleton", () => {
    dialogueQuery.isPending = false;
    dialogueQuery.error = new Error("down");
    const markup = html(<DialogueView dialogueId="dialogue-1" />);
    expect(markup).toContain("Something went wrong.");
    expectNoSkeleton(markup);
  });

  it("shows a not-found dialogue without a skeleton", () => {
    dialogueQuery.isPending = false;
    dialogueQuery.error = new ApiError("http", "Dialogue not found", 404);
    const markup = html(<DialogueView dialogueId="missing" />);
    expect(markup).toContain("Dialogue not found");
    expectNoSkeleton(markup);
  });
});

describe("situation detail", () => {
  it("keeps the catalog link and skeletons the title while the situation is pending", () => {
    const markup = html(<SituationDetail situationId="sit-1" />);
    expect(markup).toContain("← Situations");
    expectSkeleton(markup, "Loading situation");
    expect(markup).not.toContain(">Loading…<");
  });

  it("shows the description once the situation arrives", () => {
    situationQuery.isPending = false;
    situationQuery.data = situation;
    const markup = html(<SituationDetail situationId="sit-1" />);
    expect(markup).toContain("At a cafe");
    expect(markup).toContain("Order a drink.");
    expect(markup).toContain("Build dialogue");
    expect(markup).toContain("Morning order");
    expectNoSkeleton(markup);
  });

  it("shows an error without a skeleton", () => {
    situationQuery.isPending = false;
    situationQuery.error = new Error("down");
    const markup = html(<SituationDetail situationId="sit-1" />);
    expect(markup).toContain("Something went wrong.");
    expect(markup).toContain("← Back to catalog");
    expectNoSkeleton(markup);
  });

  it("shows a missing situation without a skeleton", () => {
    situationQuery.isPending = false;
    const markup = html(<SituationDetail situationId="missing" />);
    expect(markup).toContain("Situation not found");
    expectNoSkeleton(markup);
  });

  it("prefers an error over a skeleton when the query has already failed", () => {
    situationQuery.isPending = true;
    situationQuery.error = new ApiError("http", "Situation not found", 404);
    const markup = html(<SituationDetail situationId="missing" />);
    expect(markup).toContain("Situation not found");
    expectNoSkeleton(markup);
  });
});

describe("build dialogue", () => {
  it("renders the form immediately", () => {
    const markup = html(<DialogueBuilder situationId="sit-1" />);
    expect(markup).toContain("Build dialogue");
    expect(markup).toContain("Situation description");
    expect(markup).toContain("Generate dialogue");
    expect(markup).toContain("← Back to situation");
    expectNoSkeleton(markup);
  });

  it("keeps the form on screen while generating", () => {
    generateMutation.isPending = true;
    const markup = html(<DialogueBuilder situationId="sit-1" />);
    expect(markup).toContain("Generating…");
    expect(markup).toContain("Situation description");
    expectNoSkeleton(markup);
  });

  it("shows a generate error without a skeleton", () => {
    generateMutation.error = new Error("down");
    const markup = html(<DialogueBuilder situationId="sit-1" />);
    expect(markup).toContain("Something went wrong.");
    expect(markup).toContain("Generate dialogue");
    expectNoSkeleton(markup);
  });

  it("shows the generated dialogue without a skeleton", () => {
    generateMutation.data = generated;
    const markup = html(<DialogueBuilder situationId="sit-1" />);
    expect(markup).toContain("Asking for the bill");
    expect(markup).toContain("Could I get the bill?");
    expectNoSkeleton(markup);
  });
});
