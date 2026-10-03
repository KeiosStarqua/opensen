import { createFileRoute, notFound } from "@tanstack/react-router";

import { LearnScreen } from "@/components/studio/learn-screen";
import { pageTitle } from "@/lib/page-title";
import { getTopic } from "@/lib/studio/content";

export const Route = createFileRoute("/_app/_shell/learn/$topic/")({
  loader: ({ params }) => {
    const topic = getTopic(params.topic);
    if (!topic) throw notFound();
    return { title: topic.lesson.title };
  },
  head: ({ loaderData }) => ({ meta: [pageTitle(loaderData?.title ?? "Learn")] }),
  component: TopicPage,
});

function TopicPage() {
  const { topic } = Route.useParams();
  return <LearnScreen topicId={topic} />;
}
