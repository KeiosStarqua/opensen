import { ChunkLibrary } from "@/components/chunks/chunk-library";

export const metadata = { title: "Sentence patterns" };

export default function PatternsPage() {
  return (
    <div className="mx-auto max-w-3xl px-2 py-6">
      <ChunkLibrary />
    </div>
  );
}
