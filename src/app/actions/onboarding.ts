'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { Gender, RelationshipIntent } from '@/generated/prisma/enums';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-access',
);

async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) throw new Error('Unauthorized');
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  const userId = payload['userId'] as string | undefined;
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export type ActionResult = { success: true } | { success: false; error: string };

export async function saveBasicInfo(data: {
  name: string;
  birthDate: string;
  gender: string;
  genderPreference: string[];
}): Promise<ActionResult> {
  try {
    const userId = await getUserId();

    // Validate age >= 18
    const birth = new Date(data.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) return { success: false, error: 'You must be at least 18 years old.' };

    const validGenders = Object.values(Gender) as string[];
    if (!validGenders.includes(data.gender)) {
      return { success: false, error: 'Invalid gender.' };
    }
    const genderPref = data.genderPreference.filter((g) => validGenders.includes(g)) as Gender[];

    await db.profile.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name.trim(),
        birthDate: birth,
        gender: data.gender as Gender,
        genderPreference: genderPref,
      },
      update: {
        name: data.name.trim(),
        birthDate: birth,
        gender: data.gender as Gender,
        genderPreference: genderPref,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('saveBasicInfo error', err);
    return { success: false, error: 'Failed to save. Please try again.' };
  }
}

export async function saveIntent(intent: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();

    const validIntents = Object.values(RelationshipIntent) as string[];
    if (!validIntents.includes(intent)) {
      return { success: false, error: 'Invalid relationship intent.' };
    }

    await db.profile.upsert({
      where: { userId },
      create: {
        userId,
        name: '',
        birthDate: new Date(),
        gender: Gender.OTHER,
        relationshipIntent: intent as RelationshipIntent,
      },
      update: {
        relationshipIntent: intent as RelationshipIntent,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('saveIntent error', err);
    return { success: false, error: 'Failed to save. Please try again.' };
  }
}

export async function savePrompts(
  answers: { promptId: string; answer: string }[],
): Promise<ActionResult> {
  try {
    const userId = await getUserId();

    const profile = await db.profile.findUnique({ where: { userId } });
    if (!profile) return { success: false, error: 'Profile not found.' };

    // Delete existing prompts for this profile
    await db.profilePrompt.deleteMany({ where: { profileId: profile.id } });

    // Create new prompt answers
    await db.profilePrompt.createMany({
      data: answers.map((a, idx) => ({
        profileId: profile.id,
        promptId: a.promptId,
        answer: a.answer.slice(0, 300),
        order: idx,
      })),
    });

    return { success: true };
  } catch (err) {
    console.error('savePrompts error', err);
    return { success: false, error: 'Failed to save. Please try again.' };
  }
}
