import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading blocks for content detail routes. Each one matches the title and
 * body still in flight. Static links and forms stay in the screen.
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

/** Chunk sentence, meaning, and actions. */
export function ChunkDetailSkeleton() {
  return (
    <LoadingBlock label="Loading chunk">
      <Bone className="h-9 w-4/5 max-w-lg" />
      <Bone className="mt-4 h-6 w-3/5 max-w-sm" />
      <Bone className="mt-4 h-4 w-48 max-w-full" />
      <Bone className="mt-4 h-9 w-24 rounded-lg" />
    </LoadingBlock>
  );
}

/** Dialogue title and spoken lines. */
export function DialogueDetailSkeleton() {
  return (
    <LoadingBlock label="Loading dialogue" className="space-y-6">
      <div>
        <Bone className="h-9 w-2/3 max-w-md" />
        <Bone className="mt-2 h-4 w-24" />
      </div>
      <div className="space-y-2">
        {indexes(4).map((index) => (
          <Bone key={index} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </LoadingBlock>
  );
}

/** Situation title, description, and the build action. */
export function SituationDetailSkeleton() {
  return (
    <LoadingBlock label="Loading situation">
      <Bone className="mt-4 h-3 w-20" />
      <Bone className="mt-2 h-9 w-2/3 max-w-md" />
      <Bone className="mt-4 h-6 w-full" />
      <Bone className="mt-2 h-6 w-4/5" />
      <Bone className="mt-4 h-4 w-3/4 max-w-md" />
      <Bone className="mt-2 h-4 w-1/2 max-w-xs" />
      <Bone className="mt-6 h-9 w-36 rounded-lg" />
    </LoadingBlock>
  );
}
