import { headers } from 'next/headers';
import { requireServerUser, requireOnboardingComplete } from '@/lib/auth/server';
import { AppHeader } from '@/components/layout/app-header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/dashboard';

  await requireOnboardingComplete(user, pathname);

  return (
    <div className="min-h-screen mesh-bg" style={{ background: 'var(--gradient-warm)' }}>
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-5 py-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
