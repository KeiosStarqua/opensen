import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("shadcn Skeleton", () => {
  it("imports as a component", () => {
    expect(typeof Skeleton).toBe("function");
  });
});
