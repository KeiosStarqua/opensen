import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading blocks for shell routes. Each one matches the shape of the data
 * that is still in flight. Static page chrome stays in the screen.
 */

function indexes(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

function Bone({ className, ...props }: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn("bg-black/10", className)}
      {...props}
    />
  );
}

function LoadingBlock({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className={className}>{children}</div>
    </div>
  );
}

/** Library row: play control, two lines, star. */
export function LibrarySentenceRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingBlock label="Loading your sentences">
      <ul className="space-y-3">
        {indexes(count).map((index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-sm"
          >
            <Bone className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-3/5" />
              <Bone className="h-3 w-2/5" />
            </div>
            <Bone className="h-10 w-10 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </LoadingBlock>
  );
}

/** `/saved` row: quote, sentence, star. */
export function HeardSentenceRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingBlock label="Loading your sentences">
      <ul className="space-y-3">
        {indexes(count).map((index) => (
          <li
            key={index}
            className="flex items-center gap-2 rounded-[22px] bg-white px-3 py-2 shadow-sm"
          >
            <Bone className="h-6 w-6 shrink-0 rounded-md" />
            <Bone className="h-5 min-w-0 flex-1" />
            <Bone className="h-10 w-10 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </LoadingBlock>
  );
}

/** Star while the saved-sentence list has not returned. */
export function SaveStarSkeleton({ announce = true }: { announce?: boolean }) {
  const bone = <Bone className="h-10 w-10 rounded-full" />;
  if (!announce) return bone;
  return (
    <span
      role="status"
      aria-busy="true"
      aria-label="Loading save state"
      className="grid h-10 w-10 place-items-center"
    >
      <span className="sr-only">Loading save state</span>
      {bone}
    </span>
  );
}

/** Today recall card. */
export function TodayPlanSkeleton() {
  return (
    <LoadingBlock label="Loading today">
      <section className="rounded-xl bg-emerald-800 p-6">
        <Bone className="h-4 w-28 bg-white/30" />
        <Bone className="mt-3 h-10 w-16 bg-white/40" />
        <Bone className="mt-3 h-4 w-64 max-w-full bg-white/25" />
        <Bone className="mt-4 h-9 w-32 rounded-lg bg-white/50" />
      </section>
    </LoadingBlock>
  );
}

/** Due sentences under the today card. */
export function DueRowsSkeleton() {
  return (
    <LoadingBlock label="Loading due sentences">
      <section>
        <Bone className="h-6 w-24" />
        <ul className="mt-2 space-y-3">
          {indexes(3).map((index) => (
            <li key={index}>
              <Bone className="h-4 w-full max-w-md" />
            </li>
          ))}
        </ul>
      </section>
    </LoadingBlock>
  );
}

/** Plan stat tiles and the up-next list, before the plan query returns. */
export function PracticePlanSkeleton() {
  return (
    <LoadingBlock label="Loading plan" className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {indexes(4).map((index) => (
          <div key={index} className="rounded-lg border bg-white p-3">
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-8 w-10" />
          </div>
        ))}
      </div>
      <section>
        <Bone className="h-6 w-24" />
        <ul className="mt-2 divide-y rounded-xl border bg-white">
          {indexes(4).map((index) => (
            <li key={index} className="space-y-2 px-4 py-3">
              <Bone className="h-4 w-2/3" />
              <Bone className="h-4 w-1/2" />
              <Bone className="h-3 w-32" />
            </li>
          ))}
        </ul>
      </section>
    </LoadingBlock>
  );
}

/** Up-next rows once plan stats are known and the due list is still loading. */
export function PlanDueListSkeleton() {
  return (
    <LoadingBlock label="Loading due sentences">
      <ul className="mt-2 divide-y rounded-xl border bg-white">
        {indexes(4).map((index) => (
          <li key={index} className="space-y-2 px-4 py-3">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-3 w-32" />
          </li>
        ))}
      </ul>
    </LoadingBlock>
  );
}

/** Chunk rows on `/patterns`. */
export function ChunkListSkeleton() {
  return (
    <LoadingBlock label="Loading chunks">
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {indexes(4).map((index) => (
          <li key={index} className="space-y-2 px-4 py-3">
            <Bone className="h-5 w-2/3" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-3 w-24" />
          </li>
        ))}
      </ul>
    </LoadingBlock>
  );
}

/** Situation cards. */
export function SituationCardsSkeleton() {
  return (
    <LoadingBlock label="Loading situations">
      <ul className="space-y-3">
        {indexes(4).map((index) => (
          <li
            key={index}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4"
          >
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-6 w-48 max-w-full" />
            <Bone className="mt-3 h-4 w-full" />
            <Bone className="mt-2 h-4 w-4/5" />
          </li>
        ))}
      </ul>
    </LoadingBlock>
  );
}

/** Signed-in email line on `/profile`. */
export function ProfileEmailSkeleton() {
  return (
    <LoadingBlock label="Loading account">
      <Bone className="h-4 w-56 max-w-full" />
    </LoadingBlock>
  );
}
