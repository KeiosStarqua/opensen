export type PatternSlot = {
  id: string;
  name: string;
  position: number;
  variants: Array<{ id: string; text: string; meaning: string }>;
};

export type SentencePattern = {
  id: string;
  template: string;
  slots: PatternSlot[];
};

export type DrillItem = {
  slotId: string;
  slotName: string;
  examples: string[];
  prompt: string;
  answer: string;
  cue?: string;
};

function renderTemplate(
  template: string,
  fills: Record<string, string>,
  blankSlot?: string,
): string {
  return template.replace(/\{([^}]+)\}/g, (_, name: string) => {
    if (blankSlot && name === blankSlot) return "_____";
    return fills[name] ?? `{${name}}`;
  });
}

function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase().replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, "");
}

export function matchVariant(
  slot: PatternSlot,
  answer: string,
): { text: string } | null {
  const wanted = normalizeAnswer(answer);
  if (!wanted) return null;
  for (const variant of slot.variants) {
    if (normalizeAnswer(variant.text) === wanted) {
      return variant;
    }
  }
  return null;
}

export function buildDrillItems(pattern: SentencePattern): DrillItem[] {
  const items: DrillItem[] = [];
  for (const slot of pattern.slots) {
    if (slot.variants.length < 2) continue;
    const defaultFills: Record<string, string> = {};
    for (const other of pattern.slots) {
      if (other.id !== slot.id && other.variants[0]) {
        defaultFills[other.name] = other.variants[0].text;
      }
    }
    for (const target of slot.variants) {
      const others = slot.variants.filter((v) => v.id !== target.id);
      const examples = others
        .slice(0, 2)
        .map((variant) =>
          renderTemplate(pattern.template, {
            ...defaultFills,
            [slot.name]: variant.text,
          }),
        );
      items.push({
        slotId: slot.id,
        slotName: slot.name,
        examples,
        prompt: renderTemplate(pattern.template, defaultFills, slot.name),
        answer: target.text,
        cue: target.meaning,
      });
    }
  }
  return items;
}
