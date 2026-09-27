import { TodayDashboard } from "@/components/today/today-dashboard";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <TodayDashboard />
    </div>
  );
}
