'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  matchCount: number;
}

export default function BottomNav({ matchCount }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const activeClass = 'text-primary-500';
  const inactiveClass = 'text-gray-400';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {/* Discover */}
        <Link href="/discover" className={`flex flex-col items-center gap-0.5 ${isActive('/discover') ? activeClass : inactiveClass}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9.243 2 7 4.243 7 7c0 3.728 5 11 5 11s5-7.272 5-11c0-2.757-2.243-5-5-5zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" opacity="0.3"/>
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.019 6.033-2 12-2s11 5.019 11 9.191C23 11.301 17.626 16.059 12 21.593zM12 4C9.243 4 7 6.243 7 9c0 3.728 5 11 5 11s5-7.272 5-11c0-2.757-2.243-5-5-5zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
          </svg>
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        {/* Nearby */}
        <Link href="/nearby" className={`flex flex-col items-center gap-0.5 ${isActive('/nearby') ? activeClass : inactiveClass}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span className="text-[10px] font-medium">Nearby</span>
        </Link>

        {/* Matches */}
        <Link href="/matches" className={`flex flex-col items-center gap-0.5 relative ${isActive('/matches') ? activeClass : inactiveClass}`}>
          <div className="relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                {matchCount > 99 ? '99+' : matchCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Matches</span>
        </Link>

        {/* Likes */}
        <Link href="/likes" className={`flex flex-col items-center gap-0.5 ${isActive('/likes') ? activeClass : inactiveClass}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27l-4.95 2.96 1.31-5.64L4 10.76l5.77-.5L12 5l2.23 5.26 5.77.5-4.36 3.83 1.31 5.64z"/>
            <path d="M19 2l.7 1.8L21.5 4.5 19.7 5.2 19 7l-.7-1.8L16.5 4.5l1.8-.7z"/>
          </svg>
          <span className="text-[10px] font-medium">Likes</span>
        </Link>

        {/* Profile */}
        <Link href="/profile" className={`flex flex-col items-center gap-0.5 ${isActive('/profile') ? activeClass : inactiveClass}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
