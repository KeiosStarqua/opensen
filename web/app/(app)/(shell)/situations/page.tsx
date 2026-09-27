import { SituationsCatalog } from "@/components/situations/situations-catalog";

export const metadata = { title: "Situations" };

export default function SituationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Situations</h1>
      <p className="mt-2 text-slate-600">
        Real-world scenarios to anchor your speaking practice.
      </p>
      <div className="mt-8">
        <SituationsCatalog />
      </div>
    </div>
  );
}
