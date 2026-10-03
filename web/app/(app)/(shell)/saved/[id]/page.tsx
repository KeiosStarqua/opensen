import { SavedSentenceStudy } from "@/components/saved-sentences/saved-sentence-study";

export const metadata = { title: "Study sentence" };

export default async function SavedSentencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SavedSentenceStudy id={id} />;
}
