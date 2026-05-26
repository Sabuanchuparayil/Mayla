import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-warm-200/60 dark:bg-warm-400/10', className)}
      aria-hidden="true"
    />
  );
}

export function DiscoverCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden p-0">
      <Skeleton className="h-80 rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="flex gap-3 pt-3">
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-14 flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ChatRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-card-border px-4 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
