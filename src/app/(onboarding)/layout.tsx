import Link from 'next/link';
import { requireServerUser } from '@/lib/auth/server';
import { MaylaIcon } from '@/components/ui/mayla-icon';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireServerUser();

  return (
    <div className="min-h-screen mesh-bg" style={{ background: 'var(--gradient-hero)' }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
        <Link href="/" className="flex items-center gap-2">
          <MaylaIcon className="h-6 w-6 text-primary" />
          <span className="font-[family-name:var(--font-amaranth)] text-lg font-bold gradient-text">
            mayla
          </span>
        </Link>
      </div>
      <main className="mx-auto flex max-w-6xl items-center justify-center px-5 py-16">
        {children}
      </main>
    </div>
  );
}
