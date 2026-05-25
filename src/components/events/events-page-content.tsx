'use client';

import { EventsBoard } from '@/components/events/events-board';
import { useLocale } from '@/hooks/use-locale';

export function EventsPageContent() {
  const { t } = useLocale();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight">
          {t('events')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meet people at brunches, beach days, and social mixers
        </p>
      </div>
      <EventsBoard />
    </div>
  );
}
