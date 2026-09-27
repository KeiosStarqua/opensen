import type { DuePracticeItem, PracticeItem, PracticeMode } from "./types";

function firstWords(text: string, count: number): string {
  return text.split(/\s+/).slice(0, count).join(" ");
}

function clozeFromText(text: string): { prompt: string; hint: string } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return { prompt: "Say the full sentence.", hint: firstWords(text, 2) };
  }
  const index = Math.min(1, words.length - 2);
  const blanked = [...words];
  const hidden = blanked[index];
  blanked[index] = "____";
  return {
    prompt: blanked.join(" "),
    hint: `Missing: ${hidden}`,
  };
}

function slotSwapFromText(text: string): PracticeItem | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;
  const index = 2;
  const original = words[index];
  const swapped = [...words];
  swapped[index] = "____";
  return {
    chunkId: "",
    mode: "slotSwap",
    prompt: `Replace the blank with a valid alternative (original: "${original}"):\n${swapped.join(" ")}`,
    expected: text,
    hint: original,
  };
}

export function chooseMode(
  item: DuePracticeItem,
  canSpeak: boolean,
): PracticeMode {
  if (item.reps === 0) {
    return canSpeak ? "listenRepeat" : "l1ToL2";
  }
  const rotation: PracticeMode[] = [
    "l1ToL2",
    "cloze",
    "slotSwap",
    ...(canSpeak ? (["listenRepeat"] as PracticeMode[]) : []),
  ];
  return rotation[(item.reps - 1) % rotation.length] ?? "l1ToL2";
}

export function buildPracticeItem(
  due: DuePracticeItem,
  canSpeak: boolean,
): PracticeItem {
  const mode = chooseMode(due, canSpeak);
  const base = {
    chunkId: due.chunkId,
    mode,
    expected: due.text,
  };

  switch (mode) {
    case "listenRepeat":
      return {
        ...base,
        prompt: due.meaning,
        spokenText: due.text,
        hint: firstWords(due.text, 3),
      };
    case "l1ToL2":
      return {
        ...base,
        prompt: due.meaning,
        hint: firstWords(due.text, 2),
      };
    case "cloze": {
      const { prompt, hint } = clozeFromText(due.text);
      return { ...base, prompt, hint };
    }
    case "slotSwap": {
      const swap = slotSwapFromText(due.text);
      if (swap) {
        return { ...base, ...swap, chunkId: due.chunkId };
      }
      const { prompt, hint } = clozeFromText(due.text);
      return { ...base, mode: "cloze", prompt, hint };
    }
    default:
      return { ...base, prompt: due.meaning };
  }
}
