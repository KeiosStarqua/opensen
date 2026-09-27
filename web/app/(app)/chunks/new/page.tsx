import { ChunkCreateForm } from "@/components/chunks/chunk-create-form";

export const metadata = { title: "New chunk" };

export default function NewChunkPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ChunkCreateForm />
    </div>
  );
}
