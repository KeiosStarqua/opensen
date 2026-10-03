import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ChunkDetailSkeleton,
  DialogueDetailSkeleton,
  SituationDetailSkeleton,
} from "./content-loading";

function markup(node: React.ReactNode) {
  return renderToStaticMarkup(node);
}

describe("content detail loading placeholders", () => {
  it.each([
    ["Loading chunk", <ChunkDetailSkeleton />],
    ["Loading dialogue", <DialogueDetailSkeleton />],
    ["Loading situation", <SituationDetailSkeleton />],
  ])("announces %s with skeleton blocks", (label, node) => {
    const html = markup(node);
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/data-slot="skeleton"/g)?.length).toBeGreaterThan(1);
  });
});
