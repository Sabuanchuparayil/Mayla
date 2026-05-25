// Lightweight, fire-and-forget client analytics. Events are POSTed to
// /api/analytics/event, which is the single place to fan out to a real
// provider (PostHog, Segment, etc.) later. Safe to call during SSR (no-op).

export type AnalyticsEvent =
  | 'signup_started'
  | 'otp_verified'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'swipe'
  | 'match_created'
  | 'message_sent'
  | 'subscription_viewed'
  | 'upgrade_clicked';

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({ event, props: props ?? {}, ts: Date.now() });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/event', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch {
    // never let analytics break the app
  }
}
