import { DiscoverFeed } from '@/components/discover/discover-feed';
import { DiscoverSecondaryPanels } from '@/components/discover/discover-secondary-panels';
import { ProfileCompletenessBanner } from '@/components/profile/completeness-banner';

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
      <ProfileCompletenessBanner />
      <DiscoverFeed />
      <details className="group rounded-2xl border border-card-border bg-card/50">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between">
            More for you
            <span className="text-xs font-normal transition-transform group-open:rotate-180">▼</span>
          </span>
        </summary>
        <div className="border-t border-card-border px-4 pb-4 pt-2">
          <DiscoverSecondaryPanels />
        </div>
      </details>
    </div>
  );
}
