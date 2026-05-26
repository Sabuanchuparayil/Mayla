'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';

type NotificationItem = {
  type: string;
  title: string;
  body: string;
  href: string;
};

type Summary = {
  unreadMessages: number;
  pendingLikes: number;
  pendingDateRequests: number;
  total: number;
  items: NotificationItem[];
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    function load() {
      apiFetch<Summary>('/api/notifications/summary').then((r) => {
        if (r.success) setSummary(r.data);
      });
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const badgeCount = summary?.total ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-warm-200/50 hover:text-foreground dark:hover:bg-warm-400/10"
        aria-label={`Notifications${badgeCount > 0 ? `, ${badgeCount} unread` : ''}`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {badgeCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-card-border bg-card p-2 shadow-xl animate-scale-in"
          >
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notifications
            </p>
            {!summary?.items.length ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up</p>
            ) : (
              <ul className="space-y-1">
                {summary.items.map((item) => (
                  <li key={item.type}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-warm-200/50 dark:hover:bg-warm-400/10"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.body}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function useUnreadMessages() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function load() {
      apiFetch<{ unreadMessages: number }>('/api/notifications/summary').then((r) => {
        if (r.success) setCount(r.data.unreadMessages);
      });
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
