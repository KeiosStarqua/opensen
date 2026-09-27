import { SuccessScreen } from "@/components/studio/success-screen";

export const metadata = { title: "Lesson complete" };

type PageProps = { searchParams: Promise<{ claim?: string }> };

export default async function DonePage({ searchParams }: PageProps) {
  const { claim } = await searchParams;
  return <SuccessScreen claim={claim ?? null} />;
}
