import { db } from '@/lib/db';
import type { Tier } from '@/lib/subscription';
import type { RelationshipGoalValue } from '@/lib/constants/profile-options';

export type UserPreferences = {
  genderPref: string[];
  ageMin: number | null;
  ageMax: number | null;
  nationalities: string[];
  languages: string[];
  maxDistanceKm: number;
  relationshipGoals: RelationshipGoalValue[];
  dealbreakers: Record<string, string>;
  hideFromNationalities: string[];
  hideFromCities: string[];
};

export function defaultPreferences(): UserPreferences {
  return {
    genderPref: [],
    ageMin: null,
    ageMax: null,
    nationalities: [],
    languages: [],
    maxDistanceKm: 100,
    relationshipGoals: [],
    dealbreakers: {},
    hideFromNationalities: [],
    hideFromCities: [],
  };
}

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function parseDealbreakers(value: unknown): Record<string, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return {};
}

export function parsePreferences(row: {
  genderPref: unknown;
  ageMin: number | null;
  ageMax: number | null;
  nationalities: unknown;
  languages: unknown;
  maxDistanceKm: number;
  relationshipGoals: unknown;
  dealbreakers: unknown;
  hideFromNationalities: unknown;
  hideFromCities: unknown;
}): UserPreferences {
  return {
    genderPref: parseJsonArray(row.genderPref),
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    nationalities: parseJsonArray(row.nationalities),
    languages: parseJsonArray(row.languages),
    maxDistanceKm: row.maxDistanceKm,
    relationshipGoals: parseJsonArray(row.relationshipGoals) as RelationshipGoalValue[],
    dealbreakers: parseDealbreakers(row.dealbreakers),
    hideFromNationalities: parseJsonArray(row.hideFromNationalities),
    hideFromCities: parseJsonArray(row.hideFromCities),
  };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const row = await db.userPreference.findUnique({ where: { userId } });
  if (!row) return defaultPreferences();
  return parsePreferences(row);
}

export async function upsertUserPreferences(userId: string, prefs: Partial<UserPreferences>) {
  const current = await getUserPreferences(userId);
  const merged = { ...current, ...prefs };

  return db.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      genderPref: merged.genderPref,
      ageMin: merged.ageMin,
      ageMax: merged.ageMax,
      nationalities: merged.nationalities,
      languages: merged.languages,
      maxDistanceKm: merged.maxDistanceKm,
      relationshipGoals: merged.relationshipGoals,
      dealbreakers: merged.dealbreakers,
      hideFromNationalities: merged.hideFromNationalities,
      hideFromCities: merged.hideFromCities,
    },
    update: {
      genderPref: merged.genderPref,
      ageMin: merged.ageMin,
      ageMax: merged.ageMax,
      nationalities: merged.nationalities,
      languages: merged.languages,
      maxDistanceKm: merged.maxDistanceKm,
      relationshipGoals: merged.relationshipGoals,
      dealbreakers: merged.dealbreakers,
      hideFromNationalities: merged.hideFromNationalities,
      hideFromCities: merged.hideFromCities,
    },
  });
}

export function maxGoalFiltersForTier(tier: Tier): number {
  if (tier === 'PLATINUM') return 7;
  if (tier === 'GOLD') return 1;
  return 0;
}

export function canFilterByGoals(tier: Tier): boolean {
  return tier !== 'FREE';
}
