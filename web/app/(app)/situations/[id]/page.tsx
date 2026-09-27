import { SituationDetail } from "@/components/situations/situation-detail";

export const metadata = { title: "Situation detail" };

type PageProps = { params: Promise<{ id: string }> };

export default async function SituationDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <SituationDetail situationId={id} />
    </div>
  );
}
