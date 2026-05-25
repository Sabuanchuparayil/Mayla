import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import OnboardingFlow from './OnboardingFlow';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-access',
);

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    userId = payload['userId'] as string;
    if (!userId) redirect('/login');
  } catch {
    redirect('/login');
  }

  // Load prompts from DB
  const rawPrompts = await db.prompt.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
    select: { id: true, question: true, category: true },
  });

  const prompts = rawPrompts.map((p) => ({
    id: p.id,
    question: p.question,
    category: p.category ?? 'General',
  }));

  // Load profile name if exists (for Step 6)
  const profile = await db.profile.findUnique({
    where: { userId },
    select: { name: true },
  });

  return (
    <OnboardingFlow
      prompts={prompts}
      existingName={profile?.name ?? null}
    />
  );
}
