/**
 * Both `/saved` and Library’s saved list are this account’s saved-sentence
 * rows. A lesson star inserts that sentence’s text into the same list.
 */

export type SavedSentenceRow = {
  id: string;
  text: string;
};

export type CatalogSentence = {
  text: string;
  meaning: string;
  topicName: string;
  lessonTitle: string;
};

export type LibrarySavedEntry = {
  id: string;
  text: string;
  meaning: string | null;
  topicName: string | null;
  lessonTitle: string | null;
};

export function librarySavedEntries(
  saved: readonly SavedSentenceRow[],
  catalog: readonly CatalogSentence[],
): LibrarySavedEntry[] {
  const byText = new Map<string, CatalogSentence>();
  for (const item of catalog) {
    if (!byText.has(item.text)) byText.set(item.text, item);
  }
  return saved.map((row) => {
    const match = byText.get(row.text);
    return {
      id: row.id,
      text: row.text,
      meaning: match?.meaning ?? null,
      topicName: match?.topicName ?? null,
      lessonTitle: match?.lessonTitle ?? null,
    };
  });
}

export function isTextSaved(
  text: string,
  saved: readonly { text: string }[],
): boolean {
  return saved.some((row) => row.text === text);
}

export function savedIdsForText(
  text: string,
  saved: readonly SavedSentenceRow[],
): string[] {
  return saved.filter((row) => row.text === text).map((row) => row.id);
}

export type SentenceSaveChange =
  | { action: "save"; text: string }
  | { action: "unsave"; ids: string[] };

/**
 * Star on a lesson sentence. Saving inserts the text. Unsaving removes every
 * row with that text so the sentence leaves both screens.
 */
export function sentenceSaveChange(
  text: string,
  saved: readonly SavedSentenceRow[],
): SentenceSaveChange {
  const ids = savedIdsForText(text, saved);
  if (ids.length === 0) return { action: "save", text };
  return { action: "unsave", ids };
}
