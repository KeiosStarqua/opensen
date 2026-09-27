import { DialogueView } from "@/components/dialogues/dialogue-view";

export const metadata = { title: "Dialogue" };

type PageProps = { params: Promise<{ id: string }> };

export default async function DialoguePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <DialogueView dialogueId={id} />
    </div>
  );
}
