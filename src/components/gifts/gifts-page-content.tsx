'use client';

import { GiftInbox } from '@/components/gifts/gift-inbox';
import { useLocale } from '@/hooks/use-locale';

export function GiftsPageContent() {
  const { t } = useLocale();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight">
          {t('gifts')}
        </h1>
        <p className="text-sm text-muted-foreground">Virtual gifts from admirers</p>
      </div>
      <GiftInbox />
    </div>
  );
}
