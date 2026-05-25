'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChipSelect, SingleSelectChips } from '@/components/ui/chip-select';
import { PromptPicker, type PersonalityPrompt } from '@/components/ui/prompt-picker';
import { CompletenessRing } from '@/components/ui/completeness-ring';
import { AvailabilityPicker } from '@/components/profile/availability-picker';
import { PhotoUpload } from '@/components/profile/photo-upload';
import { apiFetch } from '@/lib/api/client';
import {
  RELATIONSHIP_GOALS,
  GENDERS,
  NATIONALITIES,
  LANGUAGES,
  EDUCATION_LEVELS,
  INDUSTRIES,
  LIFESTYLE_TAGS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  EXERCISE_OPTIONS,
  DREAM_DATES,
  OPEN_TO_CULTURES_OPTIONS,
  RELOCATE_OPTIONS,
  LIFESTYLE_EXPECTATIONS_OPTIONS,
} from '@/lib/constants/profile-options';

type ProfileData = {
  displayName: string;
  bio: string;
  birthDate: string;
  gender: string;
  nationality: string;
  languages: string[];
  education: string;
  jobTitle: string;
  industry: string;
  relationshipGoal: string;
  lifestyle: string[];
  smoking: string;
  drinking: string;
  exercise: string;
  height: string;
  interests: string[];
  personalityPrompts: PersonalityPrompt[];
  city: string;
  country: string;
  photos: string[];
  dreamDates: string[];
  openToDifferentCultures: string;
  relocateWillingness: string;
  lifestyleExpectations: string;
};

export function ProfileEditor() {
  const [form, setForm] = useState<ProfileData>({
    displayName: '',
    bio: '',
    birthDate: '',
    gender: '',
    nationality: '',
    languages: [],
    education: '',
    jobTitle: '',
    industry: '',
    relationshipGoal: '',
    lifestyle: [],
    smoking: '',
    drinking: '',
    exercise: '',
    height: '',
    interests: [],
    personalityPrompts: [],
    city: '',
    country: 'AE',
    photos: [],
    dreamDates: [],
    openToDifferentCultures: '',
    relocateWillingness: '',
    lifestyleExpectations: '',
  });
  const [verified, setVerified] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ user: { name: string | null; verified: boolean } }>('/api/auth/me'),
      apiFetch<{
        profile: Record<string, unknown> | null;
        completeness: number;
        hints: string[];
      }>('/api/users/me/profile'),
    ]).then(([userRes, profileRes]) => {
      setLoading(false);
      if (userRes.success) {
        setVerified(userRes.data.user.verified);
      }
      if (profileRes.success && profileRes.data.profile) {
        const p = profileRes.data.profile;
        setCompleteness(profileRes.data.completeness);
        setHints(profileRes.data.hints);
        setForm({
          displayName: (p.displayName as string) ?? '',
          bio: (p.bio as string) ?? '',
          birthDate: p.birthDate
            ? new Date(p.birthDate as string).toISOString().slice(0, 10)
            : '',
          gender: (p.gender as string) ?? '',
          nationality: (p.nationality as string) ?? '',
          languages: (p.languages as string[]) ?? [],
          education: (p.education as string) ?? '',
          jobTitle: (p.jobTitle as string) ?? '',
          industry: (p.industry as string) ?? '',
          relationshipGoal: (p.relationshipGoal as string) ?? '',
          lifestyle: (p.lifestyle as string[]) ?? [],
          smoking: (p.smoking as string) ?? '',
          drinking: (p.drinking as string) ?? '',
          exercise: (p.exercise as string) ?? '',
          height: p.height ? String(p.height) : '',
          interests: (p.interests as string[]) ?? [],
          personalityPrompts: (p.personalityPrompts as PersonalityPrompt[]) ?? [],
          city: (p.city as string) ?? '',
          country: (p.country as string) ?? 'AE',
          photos: (p.photos as string[]) ?? [],
          dreamDates: (p.dreamDates as string[]) ?? [],
          openToDifferentCultures: (p.openToDifferentCultures as string) ?? '',
          relocateWillingness: (p.relocateWillingness as string) ?? '',
          lifestyleExpectations: (p.lifestyleExpectations as string) ?? '',
        });
      }
    });
  }, []);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const result = await apiFetch<{ completeness: number }>('/api/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        displayName: form.displayName,
        bio: form.bio || null,
        birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
        gender: form.gender || null,
        nationality: form.nationality || null,
        languages: form.languages,
        education: form.education || null,
        jobTitle: form.jobTitle || null,
        industry: form.industry || null,
        relationshipGoal: form.relationshipGoal || null,
        lifestyle: form.lifestyle,
        smoking: form.smoking || null,
        drinking: form.drinking || null,
        exercise: form.exercise || null,
        height: form.height ? Number(form.height) : null,
        interests: form.interests,
        personalityPrompts: form.personalityPrompts.filter((p) => p.answer.trim()),
        city: form.city || null,
        country: form.country,
        dreamDates: form.dreamDates,
        openToDifferentCultures: form.openToDifferentCultures || null,
        relocateWillingness: form.relocateWillingness || null,
        lifestyleExpectations: form.lifestyleExpectations || null,
      }),
    });
    if (result.success) {
      setCompleteness(result.data.completeness);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <div className="flex items-center gap-4">
          <div className="relative">
            <CompletenessRing percent={completeness} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">
              Profile completeness
            </h2>
            {hints.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {hints.map((h) => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-600">Your profile looks great!</p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Photos" description="Your first photo is shown on Discover" />
        <PhotoUpload photos={form.photos} onChange={(photos) => update('photos', photos)} />
      </Card>

      <Card>
        <AvailabilityPicker />
      </Card>

      <Card>
        <CardHeader title="Your profile" description="How others see you in Discover" />

        {!verified ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200/50 bg-amber-50/80 p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
            <p className="flex-1 text-sm text-amber-900 dark:text-amber-100">
              Complete selfie verification to appear in Discover
            </p>
            <Button href="/verify/selfie" size="sm">
              Verify
            </Button>
          </div>
        ) : null}

        <form onSubmit={save} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">About Me</h3>
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => update('displayName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="A little about yourself..."
              />
            </div>
            <div>
              <Label>Personality prompts</Label>
              <PromptPicker
                value={form.personalityPrompts}
                onChange={(v) => update('personalityPrompts', v)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Background</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="birthDate">Date of birth</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => update('birthDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={form.height}
                  onChange={(e) => update('height', e.target.value)}
                  placeholder="170"
                />
              </div>
            </div>
            <div>
              <Label>Gender</Label>
              <SingleSelectChips
                options={GENDERS.map((g) => ({ value: g.value, label: g.label }))}
                value={form.gender || null}
                onChange={(v) => update('gender', v)}
              />
            </div>
            <div>
              <Label>Nationality</Label>
              <SingleSelectChips
                options={NATIONALITIES.map((n) => ({ value: n.code, label: n.label }))}
                value={form.nationality || null}
                onChange={(v) => update('nationality', v)}
              />
            </div>
            <div>
              <Label>Languages</Label>
              <ChipSelect
                options={LANGUAGES}
                value={form.languages}
                onChange={(v) => update('languages', v)}
                max={5}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Work</h3>
            <div>
              <Label>Education</Label>
              <SingleSelectChips
                options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
                value={form.education || null}
                onChange={(v) => update('education', v)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  value={form.jobTitle}
                  onChange={(e) => update('jobTitle', e.target.value)}
                />
              </div>
              <div>
                <Label>Industry</Label>
                <SingleSelectChips
                  options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                  value={form.industry || null}
                  onChange={(v) => update('industry', v)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">What I&apos;m Looking For</h3>
            <p className="text-xs text-muted-foreground">Single choice — shown on your discover card</p>
            <SingleSelectChips
              options={RELATIONSHIP_GOALS.map((g) => ({
                value: g.value,
                label: g.label,
                description: g.description,
                icon: g.icon,
              }))}
              value={form.relationshipGoal || null}
              onChange={(v) => update('relationshipGoal', v)}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Dream Dates</h3>
            <p className="text-xs text-muted-foreground">What experiences would you love to share?</p>
            <ChipSelect
              options={DREAM_DATES}
              value={form.dreamDates}
              onChange={(v) => update('dreamDates', v)}
              max={6}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Cultural Compatibility</h3>
            <div>
              <Label>Open to different cultures</Label>
              <SingleSelectChips
                options={OPEN_TO_CULTURES_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={form.openToDifferentCultures || null}
                onChange={(v) => update('openToDifferentCultures', v)}
              />
            </div>
            <div>
              <Label>Relocate willingness</Label>
              <SingleSelectChips
                options={RELOCATE_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={form.relocateWillingness || null}
                onChange={(v) => update('relocateWillingness', v)}
              />
            </div>
            <div>
              <Label>Lifestyle expectations</Label>
              <SingleSelectChips
                options={LIFESTYLE_EXPECTATIONS_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={form.lifestyleExpectations || null}
                onChange={(v) => update('lifestyleExpectations', v)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Lifestyle</h3>
            <ChipSelect
              options={LIFESTYLE_TAGS}
              value={form.lifestyle}
              onChange={(v) => update('lifestyle', v)}
              max={8}
            />
            <div>
              <Label>Interests</Label>
              <ChipSelect
                options={form.interests.length ? form.interests : []}
                value={form.interests}
                onChange={(v) => update('interests', v)}
              />
              <Input
                className="mt-2"
                placeholder="Add interest and press Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !form.interests.includes(val)) {
                      update('interests', [...form.interests, val]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Smoking</Label>
                <SingleSelectChips
                  options={SMOKING_OPTIONS.map((o) => ({ value: o, label: o }))}
                  value={form.smoking || null}
                  onChange={(v) => update('smoking', v)}
                />
              </div>
              <div>
                <Label>Drinking</Label>
                <SingleSelectChips
                  options={DRINKING_OPTIONS.map((o) => ({ value: o, label: o }))}
                  value={form.drinking || null}
                  onChange={(v) => update('drinking', v)}
                />
              </div>
              <div>
                <Label>Exercise</Label>
                <SingleSelectChips
                  options={EXERCISE_OPTIONS.map((o) => ({ value: o, label: o }))}
                  value={form.exercise || null}
                  onChange={(v) => update('exercise', v)}
                />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Button type="submit">Save profile</Button>
            {saved ? (
              <span className="animate-fade-up text-sm font-medium text-emerald-600">
                Saved successfully
              </span>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
