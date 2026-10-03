import { SavedSentencesScreen } from "@/components/saved-sentences/saved-sentences-screen";

export const metadata = { title: "Sentences you heard" };

export default async function SavedSentencesPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  return <SavedSentencesScreen startComposing={add === "1"} />;
}
