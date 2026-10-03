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
