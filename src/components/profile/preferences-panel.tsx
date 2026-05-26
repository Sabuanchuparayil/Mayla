'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChipSelect, SingleSelectChips } from '@/components/ui/chip-select';
import { RangeSlider, DistanceSlider } from '@/components/ui/range-slider';
import { apiFetch } from '@/lib/api/client';
import {
  RELATIONSHIP_GOALS,
  GENDERS,
  NATIONALITIES,
  LANGUAGES,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
} from '@/lib/constants/profile-options';

export function PreferencesPanel() {
  const [genderPref, setGenderPref] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(45);
  const [maxDistanceKm, setMaxDistanceKm] = useState(100);
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [relationshipGoals, setRelationshipGoals] = useState<string[]>([]);
  const [smokingDealbreaker, setSmokingDealbreaker] = useState<string | null>(null);
  const [drinkingDealbreaker, setDrinkingDealbreaker] = useState<string | null>(null);
  const [canFilterGoals, setCanFilterGoals] = useState(false);
  const [maxGoalFilters, setMaxGoalFilters] = useState(0);
  const [hideFromNationalities, setHideFromNationalities] = useState<string[]>([]);
  const [hideFromCities, setHideFromCities] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{
      preferences: {
        genderPref: string[];
        ageMin: number | null;
        ageMax: number | null;
        maxDistanceKm: number;
        nationalities: string[];
        languages: string[];
        relationshipGoals: string[];
        dealbreakers: Record<string, string>;
        hideFromNationalities: string[];
        hideFromCities: string[];
      };
      canFilterGoals: boolean;
      maxGoalFilters: number;
    }>('/api/users/me/preferences').then((r) => {
      if (r.success) {
        setGenderPref(r.data.preferences.genderPref);
        setAgeMin(r.data.preferences.ageMin ?? 22);
        setAgeMax(r.data.preferences.ageMax ?? 45);
        setMaxDistanceKm(r.data.preferences.maxDistanceKm);
        setNationalities(r.data.preferences.nationalities ?? []);
        setLanguages(r.data.preferences.languages ?? []);
        setRelationshipGoals(r.data.preferences.relationshipGoals);
        setSmokingDealbreaker(r.data.preferences.dealbreakers?.smoking ?? null);
        setDrinkingDealbreaker(r.data.preferences.dealbreakers?.drinking ?? null);
        setHideFromNationalities(r.data.preferences.hideFromNationalities ?? []);
        setHideFromCities(r.data.preferences.hideFromCities ?? []);
        setCanFilterGoals(r.data.canFilterGoals);
        setMaxGoalFilters(r.data.maxGoalFilters);
      }
    });
  }, []);

  async function save() {
    setError('');
    const dealbreakers: Record<string, string> = {};
    if (smokingDealbreaker) dealbreakers.smoking = smokingDealbreaker;
    if (drinkingDealbreaker) dealbreakers.drinking = drinkingDealbreaker;

    const result = await apiFetch('/api/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        genderPref,
        ageMin,
        ageMax,
        maxDistanceKm,
        nationalities,
        languages,
        relationshipGoals: canFilterGoals ? relationshipGoals : [],
        dealbreakers,
        hideFromNationalities,
        hideFromCities,
      }),
    });
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else if (!result.success) {
      setError(result.error.message);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Match preferences"
        description="Control who appears in your Discover feed"
      />
      {error ? (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      ) : null}

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium">Show me</p>
          <ChipSelect
            options={GENDERS.map((g) => ({ value: g.value, label: g.label }))}
            value={genderPref}
            onChange={setGenderPref}
          />
        </div>

        <RangeSlider
          min={18}
          max={60}
          valueMin={ageMin}
          valueMax={ageMax}
          onChange={(min, max) => {
            setAgeMin(min);
            setAgeMax(max);
          }}
          label="Age range"
        />

        <DistanceSlider value={maxDistanceKm} onChange={setMaxDistanceKm} />

        <div>
          <p className="mb-2 text-sm font-medium">Preferred nationalities (optional)</p>
          <ChipSelect
            options={NATIONALITIES.slice(0, 20).map((n) => ({ value: n.code, label: n.label }))}
            value={nationalities}
            onChange={setNationalities}
            max={5}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Must speak at least one of (optional)</p>
          <ChipSelect
            options={LANGUAGES}
            value={languages}
            onChange={setLanguages}
            max={5}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Relationship goal filter</p>
          {!canFilterGoals ? (
            <p className="text-xs text-muted-foreground">
              Upgrade to Gold to filter Discover by relationship goal. Everyone&apos;s goal is visible on their card for free.
            </p>
          ) : (
            <ChipSelect
              options={RELATIONSHIP_GOALS.map((g) => ({ value: g.value, label: g.label }))}
              value={relationshipGoals}
              onChange={setRelationshipGoals}
              max={maxGoalFilters}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Smoking dealbreaker</p>
            <SingleSelectChips
              options={SMOKING_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={smokingDealbreaker}
              onChange={setSmokingDealbreaker}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Drinking dealbreaker</p>
            <SingleSelectChips
              options={DRINKING_OPTIONS.map((o) => ({ value: o, label: o }))}
              value={drinkingDealbreaker}
              onChange={setDrinkingDealbreaker}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Hide me from nationalities</p>
          <ChipSelect
            options={NATIONALITIES.slice(0, 12).map((n) => ({ value: n.code, label: n.label }))}
            value={hideFromNationalities}
            onChange={setHideFromNationalities}
            max={10}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => void save()}>Save preferences</Button>
          {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
        </div>
      </div>
    </Card>
  );
}
