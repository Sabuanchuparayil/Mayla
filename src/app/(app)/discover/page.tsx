import { DiscoverFeed } from '@/components/discover/discover-feed';
import { DateRequestInbox } from '@/components/discover/date-request-inbox';
import { LikesYouInbox } from '@/components/discover/likes-you-inbox';
import { DailyPicks } from '@/components/discover/daily-picks';

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
      <DailyPicks />
      <LikesYouInbox />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Date Requests</h2>
        <DateRequestInbox />
      </div>
      <DiscoverFeed />
    </div>
  );
}
