import { describe, expect, it } from "vitest";

import { buildDrillItems, matchVariant } from "./drill-generator";

describe("buildDrillItems", () => {
  it("skips slots with fewer than two variants", () => {
    const items = buildDrillItems({
      id: "p1",
      template: "I like {food}",
      slots: [
        {
          id: "s1",
          name: "food",
          position: 0,
          variants: [{ id: "v1", text: "rice", meaning: "cơm" }],
        },
      ],
    });
    expect(items).toHaveLength(0);
  });

  it("builds items when two variants exist", () => {
    const items = buildDrillItems({
      id: "p1",
      template: "I like {food}",
      slots: [
        {
          id: "s1",
          name: "food",
          position: 0,
          variants: [
            { id: "v1", text: "rice", meaning: "cơm" },
            { id: "v2", text: "noodles", meaning: "mì" },
          ],
        },
      ],
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.prompt).toContain("_____");
  });
});

describe("matchVariant", () => {
  it("matches case-insensitively", () => {
    const slot = {
      id: "s1",
      name: "food",
      position: 0,
      variants: [{ id: "v1", text: "Rice", meaning: "cơm" }],
    };
    expect(matchVariant(slot, " rice ")).not.toBeNull();
  });
});
