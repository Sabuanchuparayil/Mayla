'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { t as translate, type Locale } from '@/lib/i18n/messages';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    apiFetch<{ profile: { locale?: string } }>('/api/users/me/profile').then((r) => {
      if (r.success && r.data.profile?.locale) {
        const next = r.data.profile.locale as Locale;
        if (['en', 'tl', 'ru', 'es', 'ar'].includes(next)) {
          setLocaleState(next);
        }
      }
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
