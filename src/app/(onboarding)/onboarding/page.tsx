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

  // Load profile + related data to compute resume point (and name for Step 6)
  const profile = await db.profile.findUnique({
    where: { userId },
    select: {
      name: true,
      birthDate: true,
      gender: true,
      genderPreference: true,
      relationshipIntent: true,
      _count: { select: { profilePrompts: true } },
    },
  });

  const [verificationCount, verifiedPhotoCount] = await Promise.all([
    db.verification.count({ where: { userId } }),
    db.photo.count({ where: { userId, isVerified: true } }),
  ]);

  // Determine the furthest-incomplete step (first step NOT complete, 1..6)
  const step1Complete = Boolean(
    profile &&
      profile.name &&
      profile.birthDate &&
      profile.gender &&
      profile.genderPreference.length > 0,
  );
  const step2Complete = step1Complete && Boolean(profile?.relationshipIntent);
  const step3Complete = step2Complete && (profile?._count.profilePrompts ?? 0) >= 3;
  const step4Complete = step3Complete && verificationCount > 0;
  const step5Complete = step4Complete && verifiedPhotoCount >= 3;

  let initialStep = 1;
  if (step5Complete) initialStep = 6;
  else if (step4Complete) initialStep = 5;
  else if (step3Complete) initialStep = 4;
  else if (step2Complete) initialStep = 3;
  else if (step1Complete) initialStep = 2;

  return (
    <OnboardingFlow
      prompts={prompts}
      existingName={profile?.name ?? null}
      initialStep={initialStep}
    />
  );
}
