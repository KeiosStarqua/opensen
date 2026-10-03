import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading blocks for recall and substitution drills. Each one matches the
 * sentence and controls still in flight. Static titles stay in the screen.
 */

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

/** Recall prompt: mode, sentence, answer field, check button. */
export function RecallPromptSkeleton() {
  return (
    <LoadingBlock label="Loading practice">
      <Bone className="h-4 w-24" />
      <Bone className="mt-3 h-7 w-full max-w-lg" />
      <Bone className="mt-2 h-7 w-3/5 max-w-sm" />
      <Bone className="mt-8 h-24 w-full rounded-lg" />
      <Bone className="mt-4 h-9 w-32 rounded-lg" />
    </LoadingBlock>
  );
}

/** Drill body: example lines, prompt, answer field, check button. */
export function DrillPromptSkeleton() {
  return (
    <LoadingBlock label="Loading drill" className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-4 w-11/12" />
        <Bone className="h-4 w-4/5" />
      </div>
      <Bone className="h-7 w-2/3 max-w-md" />
      <div className="space-y-3">
        <Bone className="h-10 w-full rounded-lg" />
        <Bone className="h-9 w-20 rounded-lg" />
      </div>
      <Bone className="h-3 w-24" />
    </LoadingBlock>
  );
}
