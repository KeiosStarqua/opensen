import { PracticePlanView } from "@/components/plan/practice-plan-view";

export const metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PracticePlanView />
    </div>
  );
}
