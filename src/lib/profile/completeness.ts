export type ProfileCompletenessInput = {
  displayName?: string | null;
  bio?: string | null;
  birthDate?: Date | string | null;
  gender?: string | null;
  nationality?: string | null;
  languages?: unknown;
  education?: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  relationshipGoal?: string | null;
  lifestyle?: unknown;
  interests?: unknown;
  photos?: unknown;
  personalityPrompts?: unknown;
  city?: string | null;
};

function hasArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

const WEIGHTS: { key: keyof ProfileCompletenessInput; weight: number; check: (p: ProfileCompletenessInput) => boolean }[] = [
  { key: 'displayName', weight: 10, check: (p) => !!p.displayName?.trim() },
  { key: 'birthDate', weight: 10, check: (p) => !!p.birthDate },
  { key: 'gender', weight: 8, check: (p) => !!p.gender },
  { key: 'nationality', weight: 8, check: (p) => !!p.nationality },
  { key: 'languages', weight: 8, check: (p) => hasArray(p.languages) },
  { key: 'relationshipGoal', weight: 12, check: (p) => !!p.relationshipGoal },
  { key: 'photos', weight: 15, check: (p) => hasArray(p.photos) },
  { key: 'bio', weight: 5, check: (p) => !!p.bio?.trim() },
  { key: 'personalityPrompts', weight: 10, check: (p) => hasArray(p.personalityPrompts) },
  { key: 'lifestyle', weight: 6, check: (p) => hasArray(p.lifestyle) },
  { key: 'interests', weight: 4, check: (p) => hasArray(p.interests) },
  { key: 'education', weight: 4, check: (p) => !!p.education },
  { key: 'industry', weight: 4, check: (p) => !!p.industry },
  { key: 'city', weight: 6, check: (p) => !!p.city },
];

export function computeProfileCompleteness(profile: ProfileCompletenessInput): number {
  const total = WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  const earned = WEIGHTS.reduce((sum, w) => sum + (w.check(profile) ? w.weight : 0), 0);
  return Math.round((earned / total) * 100);
}

export function getCompletenessHints(profile: ProfileCompletenessInput): string[] {
  const hints: string[] = [];
  for (const w of WEIGHTS) {
    if (!w.check(profile)) {
      if (w.key === 'relationshipGoal') hints.push('Set your relationship goal to get better matches');
      else if (w.key === 'photos') hints.push('Add photos to get 3x more matches');
      else if (w.key === 'nationality') hints.push('Add your nationality — it matters in the ME');
      else if (w.key === 'languages') hints.push('Add languages you speak');
      else if (w.key === 'personalityPrompts') hints.push('Answer personality prompts to stand out');
    }
  }
  return hints.slice(0, 3);
}
