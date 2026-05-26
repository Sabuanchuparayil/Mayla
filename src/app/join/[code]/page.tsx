import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { MaylaIcon } from '@/components/ui/mayla-icon';
import { InviteCodeCapture } from '@/lib/invite-storage';
import { buildInviteLink } from '@/lib/referral';
import { db } from '@/lib/db';
import { resolveReferrerByCode } from '@/lib/referral';

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ squad?: string }>;
};

async function resolveInvite(code: string) {
  const referrer = await resolveReferrerByCode(code);
  if (referrer) {
    const name = referrer.profile?.displayName ?? referrer.name ?? 'A friend';
    return {
      type: 'referral' as const,
      code: code.toUpperCase(),
      title: `${name.split(' ')[0]} invited you to Mayla`,
      subtitle: 'Verified social discovery for expats and travelers in the Middle East.',
      referrerName: name.split(' ')[0],
    };
  }

  const squad = await db.squad.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
    select: { name: true, code: true, _count: { select: { members: true } } },
  });
  if (squad) {
    return {
      type: 'squad' as const,
      code: squad.code,
      title: `Join ${squad.name} on Mayla`,
      subtitle: `${squad._count.members} friends already in this private squad.`,
      squadName: squad.name,
    };
  }

  return {
    type: 'unknown' as const,
    code: code.toUpperCase(),
    title: 'Join Mayla',
    subtitle: 'Selfie-verified social discovery for the Middle East.',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const invite = await resolveInvite(code);
  const url = buildInviteLink(code);
  return {
    title: invite.title,
    description: invite.subtitle,
    openGraph: {
      title: invite.title,
      description: invite.subtitle,
      url,
      siteName: 'Mayla',
      type: 'website',
      images: [{ url: '/pwa-icons/icon-512.png', width: 512, height: 512, alt: 'Mayla' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: invite.title,
      description: invite.subtitle,
    },
  };
}

export default async function JoinPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const { squad } = await searchParams;
  const invite = await resolveInvite(code);
  const isSquad = squad === '1' || invite.type === 'squad';

  return (
    <div className="flex min-h-screen flex-col mesh-bg" style={{ background: 'var(--gradient-hero)' }}>
      <InviteCodeCapture code={code} isSquad={isSquad} />
      <header className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2">
          <MaylaIcon className="h-9 w-9 text-primary" />
          <span className="font-[family-name:var(--font-amaranth)] text-xl font-bold gradient-text">mayla</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <Card className="w-full animate-fade-up">
          <CardHeader
            title={invite.title}
            description={invite.subtitle}
          />
          <div className="space-y-4 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Every profile is selfie-verified</li>
              <li>✓ Built for expat &amp; traveler communities</li>
              <li>✓ Invite code: <span className="font-mono font-semibold text-primary">{invite.code}</span></li>
            </ul>

            {invite.type === 'referral' ? (
              <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary">
                {invite.referrerName} thinks you&apos;d love Mayla — your first day of Gold is on us when you complete your profile.
              </p>
            ) : null}

            {invite.type === 'squad' ? (
              <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent-foreground">
                Join <strong>{invite.squadName}</strong> — see profiles your friends vouch for once the squad has 3 members.
              </p>
            ) : null}

            <Button href="/signup" className="w-full">
              Sign up with invite
            </Button>
            <Button href="/login" variant="outline" className="w-full">
              I already have an account
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
