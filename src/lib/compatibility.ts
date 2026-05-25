import type { RelationshipGoalValue } from '@/lib/constants/profile-options';

export type CompatibilityProfile = {
  userId: string;
  birthDate?: Date | null;
  gender?: string | null;
  nationality?: string | null;
  languages?: string[];
  interests?: string[];
  lifestyle?: string[];
  dreamDates?: string[];
  relationshipGoal?: RelationshipGoalValue | string | null;
  city?: string | null;
  distanceMeters?: number | null;
  personalityPrompts?: { prompt: string; answer: string; audioUrl?: string }[];
  nationalitiesPref?: string[];
};

export type CompatibilityResult = {
  score: number;
  reasons: string[];
};

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function ageFromBirthDate(birthDate: Date | null | undefined): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function profileCompletenessScore(p: CompatibilityProfile): number {
  let score = 0;
  if (p.relationshipGoal) score += 20;
  if (p.nationality) score += 15;
  if (p.languages?.length) score += 15;
  if (p.interests?.length) score += 15;
  if (p.lifestyle?.length) score += 15;
  if (p.personalityPrompts?.length) score += 20;
  return Math.min(100, score);
}

export function computeCompatibility(
  viewer: CompatibilityProfile,
  candidate: CompatibilityProfile,
): CompatibilityResult {
  const reasons: string[] = [];
  let score = 0;

  // Relationship goal alignment (15%)
  if (viewer.relationshipGoal && candidate.relationshipGoal) {
    if (viewer.relationshipGoal === candidate.relationshipGoal) {
      score += 15;
      reasons.push('Same relationship goal');
    } else {
      score += 5;
    }
  }

  // Interest + lifestyle overlap (20%)
  const interestOverlap = jaccard(viewer.interests ?? [], candidate.interests ?? []);
  const lifestyleOverlap = jaccard(viewer.lifestyle ?? [], candidate.lifestyle ?? []);
  const combinedOverlap = (interestOverlap + lifestyleOverlap) / 2;
  score += Math.round(combinedOverlap * 20);
  const sharedInterests = (viewer.interests ?? []).filter((i) =>
    (candidate.interests ?? []).some((c) => c.toLowerCase() === i.toLowerCase()),
  );
  const sharedLifestyle = (viewer.lifestyle ?? []).filter((i) =>
    (candidate.lifestyle ?? []).some((c) => c.toLowerCase() === i.toLowerCase()),
  );
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
  } else if (sharedLifestyle.length > 0) {
    reasons.push(`Shared lifestyle: ${sharedLifestyle.slice(0, 2).join(', ')}`);
  }

  // Language overlap (15%)
  const sharedLangs = (viewer.languages ?? []).filter((l) =>
    (candidate.languages ?? []).some((c) => c.toLowerCase() === l.toLowerCase()),
  );
  if (sharedLangs.length > 0) {
    score += Math.min(15, sharedLangs.length * 8);
    reasons.push(`Both speak ${sharedLangs.slice(0, 2).join(' & ')}`);
  }

  // Nationality proximity (5%) or cross-cultural bonus
  if (viewer.nationality && candidate.nationality) {
    if (viewer.nationality === candidate.nationality) {
      score += 5;
      reasons.push('Same nationality');
    } else if (
      viewer.nationalitiesPref?.includes(candidate.nationality) ||
      (viewer.nationalitiesPref?.length ?? 0) === 0
    ) {
      score += 8;
      reasons.push('Cross-cultural match');
    }
  }

  // Dream dates overlap (10%)
  const dreamOverlap = jaccard(viewer.dreamDates ?? [], candidate.dreamDates ?? []);
  if (dreamOverlap > 0) {
    score += Math.round(dreamOverlap * 10);
    const shared = (viewer.dreamDates ?? []).filter((d) =>
      (candidate.dreamDates ?? []).some((c) => c.toLowerCase() === d.toLowerCase()),
    );
    if (shared.length > 0) reasons.push(`Dream date: ${shared[0]}`);
  }

  // Profile completeness (10%)
  score += Math.round(profileCompletenessScore(candidate) * 0.1);

  // Preference match placeholder (25%) — filled by caller if prefs available
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    reasons: reasons.slice(0, 3),
  };
}

export function suggestIcebreakers(
  viewer: CompatibilityProfile,
  candidate: CompatibilityProfile,
): string[] {
  const openers: string[] = [];
  const sharedInterests = (viewer.interests ?? []).filter((i) =>
    (candidate.interests ?? []).some((c) => c.toLowerCase() === i.toLowerCase()),
  );
  if (sharedInterests.length > 0) {
    openers.push(`You both love ${sharedInterests[0]} — what's your favourite spot for it?`);
  }
  const prompt = candidate.personalityPrompts?.[0];
  if (prompt?.answer) {
    openers.push(`Ask about "${prompt.prompt.replace(/\.\.\.$/, '')}"`);
  }
  if (candidate.city) {
    openers.push(`What's the best restaurant you've been to in ${candidate.city}?`);
  }
  openers.push("Hey! I'd love to get to know you better.");
  return openers.slice(0, 3);
}

export { ageFromBirthDate };
