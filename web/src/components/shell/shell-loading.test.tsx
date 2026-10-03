import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ChunkListSkeleton,
  DueRowsSkeleton,
  HeardSentenceRowsSkeleton,
  LibrarySentenceRowsSkeleton,
  PlanDueListSkeleton,
  PracticePlanSkeleton,
  ProfileEmailSkeleton,
  SaveStarSkeleton,
  SituationCardsSkeleton,
  TodayPlanSkeleton,
} from "./shell-loading";

function markup(node: React.ReactNode) {
  return renderToStaticMarkup(node);
}

describe("shell loading placeholders", () => {
  it.each([
    ["Loading your sentences", <LibrarySentenceRowsSkeleton />],
    ["Loading your sentences", <HeardSentenceRowsSkeleton />],
    ["Loading today", <TodayPlanSkeleton />],
    ["Loading due sentences", <DueRowsSkeleton />],
    ["Loading plan", <PracticePlanSkeleton />],
    ["Loading due sentences", <PlanDueListSkeleton />],
    ["Loading chunks", <ChunkListSkeleton />],
    ["Loading situations", <SituationCardsSkeleton />],
    ["Loading account", <ProfileEmailSkeleton />],
    ["Loading save state", <SaveStarSkeleton />],
  ])("announces %s with skeleton blocks", (label, node) => {
    const html = markup(node);
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('aria-busy="true"');
  });

  it("lets a list announce the save state once", () => {
    const html = markup(<SaveStarSkeleton announce={false} />);
    expect(html).toContain('data-slot="skeleton"');
    expect(html).not.toContain('role="status"');
  });
});
