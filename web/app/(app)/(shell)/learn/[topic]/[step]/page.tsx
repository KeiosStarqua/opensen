import { notFound } from "next/navigation";

import { SentenceScreen } from "@/components/studio/sentence-screen";
import { getStep } from "@/lib/studio/content";

type PageProps = {
  params: Promise<{ topic: string; step: string }>;
  searchParams: Promise<{ i?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { topic, step } = await params;
  const match = getStep(topic, step);
  return { title: match ? `${match.step.title} · ${match.topic.lesson.title}` : "Sentence" };
}

export default async function SentencePage({ params, searchParams }: PageProps) {
  const { topic, step } = await params;
  const { i } = await searchParams;
  if (!getStep(topic, step)) notFound();
  const index = Number.parseInt(i ?? "0", 10);
  return (
    <SentenceScreen
      topicId={topic}
      stepId={step}
      index={Number.isFinite(index) ? index : 0}
    />
  );
}
