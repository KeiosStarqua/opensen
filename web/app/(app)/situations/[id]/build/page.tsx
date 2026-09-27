import { DialogueBuilder } from "@/components/dialogues/dialogue-builder";

export const metadata = { title: "Build dialogue" };

type PageProps = { params: Promise<{ id: string }> };

export default async function BuildDialoguePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <DialogueBuilder situationId={id} />
    </div>
  );
}
