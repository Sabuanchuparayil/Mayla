import type { RelationshipGoalValue } from '@/lib/constants/profile-options';
import type { UserPreferences } from '@/lib/preferences';

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
  openToDifferentCultures?: string | null;
  relocateWillingness?: string | null;
  lifestyleExpectations?: string | null;
};

export type CompatibilityBreakdown = {
  preferenceMatch: number;
  interestOverlap: number;
  languageOverlap: number;
  goalAlignment: number;
  proximity: number;
  completeness: number;
  activityRecency: number;
};

export type CompatibilityResult = {
  score: number;
  reasons: string[];
  breakdown: CompatibilityBreakdown;
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

function scorePreferenceMatch(
  candidate: CompatibilityProfile,
  prefs: UserPreferences | undefined,
): { points: number; reason: string | null } {
  if (!prefs) return { points: 12, reason: null };

  const checks: boolean[] = [];

  if (prefs.genderPref.length > 0 && candidate.gender) {
    checks.push(prefs.genderPref.includes(candidate.gender));
  }
  const age = ageFromBirthDate(candidate.birthDate);
  if (age != null) {
    if (prefs.ageMin != null) checks.push(age >= prefs.ageMin);
    if (prefs.ageMax != null) checks.push(age <= prefs.ageMax);
  }
  if (prefs.nationalities.length > 0 && candidate.nationality) {
    checks.push(prefs.nationalities.includes(candidate.nationality));
  }
  if (prefs.languages.length > 0) {
    const langs = candidate.languages ?? [];
    checks.push(langs.some((l) => prefs.languages.includes(l)));
  }
  if (prefs.relationshipGoals.length > 0 && candidate.relationshipGoal) {
    checks.push(prefs.relationshipGoals.includes(candidate.relationshipGoal as never));
  }

  if (checks.length === 0) return { points: 12, reason: null };

  const ratio = checks.filter(Boolean).length / checks.length;
  return {
    points: Math.round(ratio * 25),
    reason: ratio >= 0.8 ? 'Matches your preferences' : null,
  };
}

function scoreActivityRecency(lastActive: Date | null | undefined): number {
  if (!lastActive) return 1;
  const hours = (Date.now() - lastActive.getTime()) / 3600000;
  if (hours <= 24) return 5;
  if (hours <= 24 * 7) return 3;
  if (hours <= 24 * 30) return 1;
  return 0;
}

export function computeCompatibility(
  viewer: CompatibilityProfile,
  candidate: CompatibilityProfile,
  options: {
    viewerPrefs?: UserPreferences;
    candidateLastActive?: Date | null;
    distanceMeters?: number | null;
  } = {},
): CompatibilityResult {
  const reasons: string[] = [];
  const breakdown: CompatibilityBreakdown = {
    preferenceMatch: 0,
    interestOverlap: 0,
    languageOverlap: 0,
    goalAlignment: 0,
    proximity: 0,
    completeness: 0,
    activityRecency: 0,
  };

  const pref = scorePreferenceMatch(candidate, options.viewerPrefs);
  breakdown.preferenceMatch = pref.points;
  if (pref.reason) reasons.push(pref.reason);

  const interestOverlap = jaccard(viewer.interests ?? [], candidate.interests ?? []);
  const lifestyleOverlap = jaccard(viewer.lifestyle ?? [], candidate.lifestyle ?? []);
  const combinedOverlap = (interestOverlap + lifestyleOverlap) / 2;
  breakdown.interestOverlap = Math.round(combinedOverlap * 20);
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

  const sharedLangs = (viewer.languages ?? []).filter((l) =>
    (candidate.languages ?? []).some((c) => c.toLowerCase() === l.toLowerCase()),
  );
  if (sharedLangs.length > 0) {
    breakdown.languageOverlap = Math.min(15, sharedLangs.length * 8);
    reasons.push(`Both speak ${sharedLangs.slice(0, 2).join(' & ')}`);
  }

  if (viewer.relationshipGoal && candidate.relationshipGoal) {
    if (viewer.relationshipGoal === candidate.relationshipGoal) {
      breakdown.goalAlignment = 15;
      reasons.push('Same relationship goal');
    } else {
      breakdown.goalAlignment = 5;
    }
  }

  const distanceMeters = options.distanceMeters ?? candidate.distanceMeters ?? null;
  if (distanceMeters != null) {
    breakdown.proximity = Math.round(Math.max(0, 100 - distanceMeters / 1000) * 0.1);
    if (distanceMeters < 5000) reasons.push(`${Math.round(distanceMeters / 1000)} km away`);
  } else {
    breakdown.proximity = 5;
  }

  breakdown.completeness = Math.round(profileCompletenessScore(candidate) * 0.1);
  breakdown.activityRecency = scoreActivityRecency(options.candidateLastActive);

  const score = Math.min(
    100,
    Math.max(
      0,
      breakdown.preferenceMatch +
        breakdown.interestOverlap +
        breakdown.languageOverlap +
        breakdown.goalAlignment +
        breakdown.proximity +
        breakdown.completeness +
        breakdown.activityRecency,
    ),
  );

  return {
    score,
    reasons: reasons.slice(0, 3),
    breakdown,
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
