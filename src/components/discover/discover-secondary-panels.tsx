'use client';

import { Suspense } from 'react';
import { DateRequestInbox } from '@/components/discover/date-request-inbox';
import { LikesYouInbox } from '@/components/discover/likes-you-inbox';
import { LookingForYouPanel } from '@/components/discover/looking-for-you-panel';
import { DailyPicks } from '@/components/discover/daily-picks';
import { Skeleton } from '@/components/ui/skeleton';

function PanelSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function DiscoverSecondaryPanels() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<PanelSkeleton />}>
        <DailyPicks />
      </Suspense>
      <Suspense fallback={<PanelSkeleton />}>
        <LookingForYouPanel />
      </Suspense>
      <Suspense fallback={<PanelSkeleton />}>
        <LikesYouInbox />
      </Suspense>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Date Requests</h2>
        <Suspense fallback={<PanelSkeleton />}>
          <DateRequestInbox />
        </Suspense>
      </div>
    </div>
  );
}
