'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SafeUser } from '@/lib/api/response';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';
import { MaylaIcon } from '@/components/ui/mayla-icon';
import { useLocale } from '@/hooks/use-locale';

const navItemDefs = [
  { href: '/discover', labelKey: 'discover', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
  },
  { href: '/nearby', labelKey: 'nearby', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  { href: '/events', labelKey: 'events', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  { href: '/chat', labelKey: 'chat', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  { href: '/profile', labelKey: 'profile', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

export function AppHeader({ user }: { user: SafeUser }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const navItems = navItemDefs.map((item) => ({ ...item, label: t(item.labelKey) }));

  return (
    <>
      {/* Desktop header */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <MaylaIcon className="h-9 w-9 text-primary" />
              <span className="font-[family-name:var(--font-amaranth)] text-xl font-bold gradient-text">
                mayla
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-warm-200/50 dark:hover:bg-warm-400/10',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
              {user.role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300',
                    pathname === '/admin'
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-warm-200/50',
                  )}
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className={cn(
                'hidden rounded-lg px-2 py-1 text-sm transition-colors sm:inline',
                pathname === '/profile' || pathname.startsWith('/profile/')
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground hover:bg-warm-200/50 hover:text-foreground dark:hover:bg-warm-400/10',
              )}
              aria-label="View your profile"
            >
              {user.name ?? user.username ?? user.phone}
            </Link>
            {user.verified ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                Verified
              </span>
            ) : null}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-glass-border md:hidden safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[11px] font-medium transition-all duration-300',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
              >
                <span className={cn(
                  'transition-transform duration-300',
                  active && 'scale-110',
                )}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-gradient-to-r from-primary to-accent" />
                )}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[11px] font-medium transition-all duration-300',
              pathname === '/settings' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            More
          </Link>
        </div>
      </nav>
    </>
  );
}
