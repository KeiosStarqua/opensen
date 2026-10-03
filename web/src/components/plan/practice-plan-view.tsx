import { AppLink } from "@/components/app-link";
import {
  PlanDueListSkeleton,
  PracticePlanSkeleton,
} from "@/components/shell/shell-loading";
import { useAppNavigate } from "@/lib/use-app-navigate";

import { AppRoutes } from "@/lib/app-routes";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import { queryErrorMessage } from "@/lib/query/api-query";
import { usePracticeDue, usePracticePlan } from "@/lib/query/hooks/practice";

export function PracticePlanView() {
  const navigate = useAppNavigate();
  const plan = usePracticePlan();
  const due = usePracticeDue(50);
  const stats = plan.data ?? null;
  const items = due.data ?? [];
  const error = stats ? null : queryErrorMessage(plan.error);
  const loading = plan.isPending && !error;
  const dueError = due.data ? null : queryErrorMessage(due.error);
  const dueLoading = due.isPending && !dueError;

  function startPractice() {
    if (items.length === 0) return;
    savePracticeFocusQueue(items);
    navigate(AppRoutes.practiceSession);
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-red-700">{error}</p>
        <p className="text-sm text-slate-600">
          Ensure `DATABASE_URL` is configured on the API and you have enrolled
          chunks (generate a dialogue or practice from Library).
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Plan</h1>
        <PracticePlanSkeleton />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Plan</h1>
        <p className="text-slate-600">
          No chunks in your plan yet. Build a dialogue or add chunks from the
          library.
        </p>
        <AppLink
          href={AppRoutes.situations}
          className="inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Browse situations
        </AppLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Plan</h1>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-3">
          <dt className="text-xs text-slate-500">Enrolled</dt>
          <dd className="text-2xl font-semibold">{stats.total}</dd>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <dt className="text-xs text-slate-500">Due now</dt>
          <dd className="text-2xl font-semibold">{stats.dueNow}</dd>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <dt className="text-xs text-slate-500">Due 7 days</dt>
          <dd className="text-2xl font-semibold">{stats.dueNext7Days}</dd>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <dt className="text-xs text-slate-500">Reviewed today</dt>
          <dd className="text-2xl font-semibold">{stats.reviewedToday}</dd>
        </div>
      </dl>
      {stats.dueNow > 0 ? (
        <button
          type="button"
          onClick={startPractice}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Start practice ({stats.dueNow} due)
        </button>
      ) : null}
      <section>
        <h2 className="text-lg font-semibold">Up next</h2>
        {dueLoading ? (
          <PlanDueListSkeleton />
        ) : (
          <ul className="mt-2 divide-y rounded-xl border bg-white">
            {items.slice(0, 20).map((item) => (
              <li key={item.chunkId} className="px-4 py-3 text-sm">
                <AppLink
                  href={AppRoutes.chunk(item.chunkId)}
                  className="font-medium text-emerald-900"
                >
                  {item.text}
                </AppLink>
                <p className="text-slate-600">{item.meaning}</p>
                <p className="text-xs text-slate-500">
                  {item.status}
                  {item.dueAt ? ` · due ${new Date(item.dueAt).toLocaleString()}` : " · new"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
