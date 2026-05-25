import { DiscoverFeed } from '@/components/discover/discover-feed';

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight">
          Discover
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Swipe on verified profiles near you
        </p>
      </div>
      <DiscoverFeed />
    </div>
  );
}
