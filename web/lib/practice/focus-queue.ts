import type { DuePracticeItem } from "./types";

export const PRACTICE_FOCUS_QUEUE_KEY = "opensen:practice-focus-queue";

export function savePracticeFocusQueue(items: DuePracticeItem[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PRACTICE_FOCUS_QUEUE_KEY,
    JSON.stringify(items),
  );
}

export function consumePracticeFocusQueue(): DuePracticeItem[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PRACTICE_FOCUS_QUEUE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(PRACTICE_FOCUS_QUEUE_KEY);
  try {
    return JSON.parse(raw) as DuePracticeItem[];
  } catch {
    return null;
  }
}
