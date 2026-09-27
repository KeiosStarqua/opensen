import { ChunkLibrary } from "@/components/chunks/chunk-library";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <ChunkLibrary />
    </div>
  );
}
