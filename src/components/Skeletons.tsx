export function ProfileCardSkeleton() {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-zinc-200 animate-pulse">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-zinc-300" />
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-zinc-300 to-transparent" />
      <div className="absolute bottom-10 left-6 right-6 space-y-2">
        <div className="h-5 w-2/3 rounded bg-zinc-300" />
        <div className="h-4 w-1/3 rounded bg-zinc-300" />
      </div>
    </div>
  );
}

export function MatchRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-zinc-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-zinc-200" />
        <div className="h-3 w-2/3 rounded bg-zinc-200" />
      </div>
    </div>
  );
}

export function ChatBubbleSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 animate-pulse">
      <div className="flex justify-start">
        <div className="h-10 w-48 rounded-2xl bg-zinc-200" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-40 rounded-2xl bg-zinc-200" />
      </div>
      <div className="flex justify-start">
        <div className="h-10 w-56 rounded-2xl bg-zinc-200" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}
