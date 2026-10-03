import { describe, expect, it } from "vitest";

import { listLibraryItems } from "@/lib/studio/content";

import {
  isTextSaved,
  librarySavedEntries,
  sentenceSaveChange,
  type SavedSentenceRow,
} from "./library-list";

const LEARNER = "learner-a";
const OTHER = "learner-b";

/**
 * Stand-in for `saved_sentences`: one list, newest first, filtered by owner.
 * `/saved` renders `list(owner)`. Library’s saved tab renders the same rows.
 */
function accountSentences() {
  const rows: Array<SavedSentenceRow & { ownerId: string }> = [];
  let next = 0;
  return {
    add(ownerId: string, text: string) {
      const row = { id: `id-${++next}`, text, ownerId };
      rows.unshift(row);
      return row;
    },
    list(ownerId: string): SavedSentenceRow[] {
      return rows
        .filter((row) => row.ownerId === ownerId)
        .map(({ id, text }) => ({ id, text }));
    },
    remove(ownerId: string, id: string) {
      const index = rows.findIndex(
        (row) => row.id === id && row.ownerId === ownerId,
      );
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

describe("library and /saved share one saved-sentence list", () => {
  const catalog = listLibraryItems();
  const lesson = catalog.find((item) => item.id === "travel-station");
  if (!lesson) throw new Error("expected the station lesson sentence");

  it("shows a sentence added on /saved in the library saved list", () => {
    const account = accountSentences();
    account.add(LEARNER, "The meeting starts at four.");

    const library = librarySavedEntries(account.list(LEARNER), catalog);
    expect(library.map((row) => row.text)).toContain("The meeting starts at four.");
    expect(library[0]?.topicName).toBeNull();
  });

  it("shows a lesson sentence saved from the library on /saved", () => {
    const account = accountSentences();
    const change = sentenceSaveChange(lesson.text, account.list(LEARNER));
    expect(change).toEqual({ action: "save", text: lesson.text });
    account.add(LEARNER, change.action === "save" ? change.text : lesson.text);

    expect(account.list(LEARNER).map((row) => row.text)).toContain(lesson.text);
    const library = librarySavedEntries(account.list(LEARNER), catalog);
    expect(library[0]).toMatchObject({
      text: lesson.text,
      topicName: lesson.topicName,
      lessonTitle: lesson.lessonTitle,
    });
  });

  it("drops the sentence from both lists when either side unsaves it", () => {
    const account = accountSentences();
    const heard = account.add(LEARNER, "The meeting starts at four.");
    account.add(LEARNER, lesson.text);

    expect(account.remove(LEARNER, heard.id)).toBe(true);
    expect(
      librarySavedEntries(account.list(LEARNER), catalog).map((row) => row.text),
    ).not.toContain("The meeting starts at four.");
    expect(account.list(LEARNER).map((row) => row.text)).not.toContain(
      "The meeting starts at four.",
    );

    const unsaved = sentenceSaveChange(lesson.text, account.list(LEARNER));
    expect(unsaved.action).toBe("unsave");
    if (unsaved.action !== "unsave") return;
    for (const id of unsaved.ids) account.remove(LEARNER, id);

    expect(account.list(LEARNER).map((row) => row.text)).not.toContain(lesson.text);
    expect(isTextSaved(lesson.text, account.list(LEARNER))).toBe(false);
    expect(
      librarySavedEntries(account.list(LEARNER), catalog).map((row) => row.text),
    ).not.toContain(lesson.text);
  });

  it("still shows the row when the account list is read again", () => {
    const account = accountSentences();
    account.add(LEARNER, "The meeting starts at four.");

    const first = librarySavedEntries(account.list(LEARNER), catalog);
    const again = librarySavedEntries(account.list(LEARNER), catalog);

    expect(again).toEqual(first);
    expect(again.map((row) => row.text)).toEqual(["The meeting starts at four."]);
    expect(account.list(LEARNER).map((row) => row.text)).toEqual([
      "The meeting starts at four.",
    ]);
  });

  it("does not show another learner’s rows", () => {
    const account = accountSentences();
    account.add(OTHER, "Their sentence");
    account.add(LEARNER, "Mine");

    expect(account.list(LEARNER).map((row) => row.text)).toEqual(["Mine"]);
    expect(
      librarySavedEntries(account.list(LEARNER), catalog).map((row) => row.text),
    ).toEqual(["Mine"]);
    expect(account.remove(LEARNER, account.list(OTHER)[0]?.id ?? "")).toBe(false);
    expect(account.list(OTHER).map((row) => row.text)).toEqual(["Their sentence"]);
  });

  it("does not treat catalog lesson sentences as saved when the account list is empty", () => {
    expect(isTextSaved(lesson.text, [])).toBe(false);
    expect(librarySavedEntries([], catalog)).toEqual([]);
  });
});
