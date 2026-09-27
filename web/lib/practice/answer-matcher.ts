const NON_WORD = /[^a-z0-9' ]+/g;
const SPACES = /\s+/g;

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("’", "'")
    .replace(NON_WORD, " ")
    .replace(SPACES, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      current[j + 1] = Math.min(
        previous[j + 1] + 1,
        current[j] + 1,
        previous[j] + cost,
      );
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

export function similarity(expected: string, actual: string): number {
  const a = normalizeAnswer(expected);
  const b = normalizeAnswer(actual);
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const distance = levenshtein(a, b);
  const longest = Math.max(a.length, b.length);
  return 1 - distance / longest;
}

export const CORRECT_THRESHOLD = 0.85;

export function isCorrect(score: number): boolean {
  return score >= CORRECT_THRESHOLD;
}
