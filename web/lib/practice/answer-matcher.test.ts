import { describe, expect, it } from "vitest";

import { isCorrect, normalizeAnswer, similarity } from "./answer-matcher";

describe("answer-matcher", () => {
  it("normalizes case and punctuation", () => {
    expect(normalizeAnswer("Hello, World!")).toBe("hello world");
  });

  it("scores exact matches highly", () => {
    expect(similarity("Could I get the check?", "could i get the check")).toBe(1);
    expect(isCorrect(similarity("test phrase", "test phrase"))).toBe(true);
  });
});
