import { notFound } from "next/navigation";

import { LearnScreen } from "@/components/studio/learn-screen";
import { getTopic } from "@/lib/studio/content";

type PageProps = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { topic: topicId } = await params;
  const topic = getTopic(topicId);
  return { title: topic?.lesson.title ?? "Learn" };
}

export default async function TopicPage({ params }: PageProps) {
  const { topic: topicId } = await params;
  if (!getTopic(topicId)) notFound();
  return <LearnScreen topicId={topicId} />;
}
