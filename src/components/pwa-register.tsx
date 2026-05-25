'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
  return isIos && !isStandalone;
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M12 15V2.25m0 0-3 3m3-3 3 3" />
    </svg>
  );
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.unregister()),
      );
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-dismissed');
    if (dismissed) return;

    if (isIosSafari()) {
      setIsIos(true);
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setShowBanner(false);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setInstallPrompt(null);
  }, [installPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-dismissed', '1');
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[60] md:bottom-6 md:left-auto md:right-6 md:max-w-sm animate-fade-up"
      role="alert"
    >
      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-400">
          {isIos ? (
            <ShareIcon className="h-5 w-5 text-white" />
          ) : (
            <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install Mayla</p>
          {isIos ? (
            <p className="text-xs text-muted-foreground">
              Tap <ShareIcon className="inline h-3.5 w-3.5 -mt-0.5" /> then <strong>&quot;Add to Home Screen&quot;</strong>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors px-2 py-1"
          >
            {isIos ? 'Got it' : 'Later'}
          </button>
          {!isIos && (
            <button
              onClick={handleInstall}
              className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-400 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:brightness-105 transition-all"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
