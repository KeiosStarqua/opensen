import { describe, expect, it } from "vitest";

import {
  applyHint,
  applyReward,
  openingPlacement,
  sameOrder,
  scrambledWords,
  wordsOf,
} from "./model";

describe("studio word order", () => {
  it("splits a sentence into answer words", () => {
    expect(wordsOf("May I see your passport?")).toEqual([
      "May",
      "I",
      "see",
      "your",
      "passport",
    ]);
  });

  it("starts the passport puzzle mid-order, with I still in the bank", () => {
    expect(openingPlacement("May I see your passport?")).toEqual({
      placed: ["see", "May", "passport", "your"],
      bank: ["I"],
    });
    expect(sameOrder(["see", "May", "passport", "your", "I"], "May I see your passport?")).toBe(
      false,
    );
    expect(
      sameOrder(["May", "I", "see", "your", "passport"], "May I see your passport?"),
    ).toBe(true);
  });

  it("scrambles other sentences into a different order", () => {
    const text = "Could you help me find the station?";
    expect(scrambledWords(text).join(" ")).not.toBe(wordsOf(text).join(" "));
  });

  it("reveals the next correct word and parks the rest", () => {
    const hint = applyHint(
      "May I see your passport?",
      ["see", "May", "passport", "your"],
      ["I"],
    );
    expect(hint.placed).toEqual(["May"]);
    expect(hint.bank).toEqual(["see", "passport", "your", "I"]);
  });
});

describe("studio rewards", () => {
  it("adds the lesson bonus and caps topic progress", () => {
    const next = applyReward({
      streak: 3,
      points: 120,
      sentencesLearned: 18,
      topicProgress: { travel: { done: 7, total: 8 } },
    });
    expect(next).toMatchObject({
      streak: 4,
      points: 130,
      sentencesLearned: 21,
      topicProgress: { travel: { done: 8, total: 8 } },
    });
  });
});
