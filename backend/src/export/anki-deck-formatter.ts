export type AnkiNote = {
  front: string;
  back: string;
  tags: string[];
};

function escapeField(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\t/g, " ").replace(/\n/g, "<br>");
}

function html(text: string): string {
  return escapeField(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function slugTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function formatAnkiDeck(notes: AnkiNote[]): string {
  const buffer: string[] = [
    "#separator:tab",
    "#html:true",
    "#tags column:3",
    "#columns:Front\tBack\tTags",
  ];
  for (const note of notes) {
    const tags = note.tags.map(slugTag).filter(Boolean).join(" ");
    buffer.push(
      `${escapeField(note.front)}\t${escapeField(note.back)}\t${tags}`,
    );
  }
  return buffer.join("\n") + "\n";
}

export function noteForChunk(input: {
  text: string;
  meaning: string;
  register: string;
  level: string;
  template?: string;
  situationName?: string;
}): AnkiNote {
  let back = `<b>${html(input.text)}</b>`;
  if (input.template) {
    back += `<br><br><i>Frame:</i> ${html(input.template)}`;
  }
  if (input.situationName) {
    back += `<br><br><small>${html(input.situationName)}</small>`;
  }
  return {
    front: input.meaning.trim() || input.text,
    back,
    tags: ["opensen", `register::${input.register}`, `level::${input.level}`],
  };
}
