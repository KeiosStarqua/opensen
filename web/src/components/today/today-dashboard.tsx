import { AppLink } from "@/components/app-link";
import { useAppNavigate } from "@/lib/use-app-navigate";

import { AppRoutes } from "@/lib/app-routes";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import { queryErrorMessage } from "@/lib/query/api-query";
import { usePracticeDue, usePracticePlan } from "@/lib/query/hooks/practice";

export function TodayDashboard() {
  const navigate = useAppNavigate();
  const plan = usePracticePlan();
  const due = usePracticeDue(10);
  const stats = plan.data ?? null;
  // A failed due list keeps the dashboard usable; only the plan gates it.
  const dueItems = due.data ?? [];
  const error = queryErrorMessage(plan.error);
  const loading = plan.isPending;

  function retry() {
    void plan.refetch();
    void due.refetch();
  }

  function startPractice() {
    if (dueItems.length === 0) return;
    savePracticeFocusQueue(dueItems);
    navigate(AppRoutes.practiceSession);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <AppLink
          href={AppRoutes.settings}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium"
        >
          Settings
        </AppLink>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}{" "}
          <button type="button" onClick={retry} className="underline">
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-600">Loading…</p>
      ) : stats && stats.total === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-slate-300 p-6">
          <p className="text-slate-700">
            You have not enrolled any chunks yet. Start with onboarding or build
            a dialogue.
          </p>
          <div className="flex flex-wrap gap-3">
            <AppLink
              href={AppRoutes.onboarding}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
            >
              Onboarding
            </AppLink>
            <AppLink
              href={AppRoutes.situations}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Situations
            </AppLink>
          </div>
        </div>
      ) : stats ? (
        <>
          <section className="rounded-xl bg-emerald-800 p-6 text-white">
            <p className="text-sm opacity-90">Due for recall</p>
            <p className="mt-1 text-4xl font-semibold">{stats.dueNow}</p>
            <p className="mt-2 text-sm opacity-90">
              {stats.dueNext7Days} due in the next 7 days · {stats.reviewedToday}{" "}
              reviewed today
            </p>
            <button
              type="button"
              disabled={stats.dueNow === 0}
              onClick={startPractice}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50"
            >
              Start practice
            </button>
          </section>
          {dueItems.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold">Due now</h2>
              <ul className="mt-2 space-y-2">
                {dueItems.map((item) => (
                  <li key={item.chunkId} className="text-sm">
                    <AppLink
                      href={AppRoutes.chunk(item.chunkId)}
                      className="font-medium text-emerald-900"
                    >
                      {item.text}
                    </AppLink>
                    <span className="text-slate-600"> — {item.meaning}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <AppLink href={AppRoutes.plan} className="text-sm text-emerald-800 underline">
            View full plan
          </AppLink>
        </>
      ) : null}
    </div>
  );
}
