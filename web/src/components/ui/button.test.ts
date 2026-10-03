import { describe, expect, it } from "vitest";

import { Button, buttonVariants } from "./button";

describe("shadcn Button", () => {
  it("imports as a component", () => {
    expect(typeof Button).toBe("function");
    expect(buttonVariants({ variant: "default", size: "default" })).toContain(
      "bg-primary",
    );
  });
});
