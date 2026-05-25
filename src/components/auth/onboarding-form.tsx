'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChipSelect, SingleSelectChips } from '@/components/ui/chip-select';
import { PromptPicker, type PersonalityPrompt } from '@/components/ui/prompt-picker';
import { apiFetch } from '@/lib/api/client';
import {
  RELATIONSHIP_GOALS,
  GENDERS,
  NATIONALITIES,
  LANGUAGES,
  EDUCATION_LEVELS,
  INDUSTRIES,
  LIFESTYLE_TAGS,
} from '@/lib/constants/profile-options';

const STEPS = [
  'Basics',
  'Background',
  'Work',
  'Your Goal',
  'Lifestyle',
  'Personality',
] as const;

type FormData = {
  name: string;
  birthDate: string;
  gender: string;
  nationality: string;
  languages: string[];
  education: string;
  jobTitle: string;
  industry: string;
  relationshipGoal: string;
  lifestyle: string[];
  interests: string[];
  personalityPrompts: PersonalityPrompt[];
  city: string;
};

export function OnboardingForm({ defaultName }: { defaultName?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: defaultName ?? '',
    birthDate: '',
    gender: '',
    nationality: '',
    languages: [],
    education: '',
    jobTitle: '',
    industry: '',
    relationshipGoal: '',
    lifestyle: [],
    interests: [],
    personalityPrompts: [],
    city: '',
  });

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.birthDate.length > 0 && form.gender.length > 0;
      case 1:
        return form.nationality.length > 0 && form.languages.length > 0;
      case 2:
        return true;
      case 3:
        return form.relationshipGoal.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }

  async function finish() {
    setError('');
    setLoading(true);

    const birthDateIso = new Date(form.birthDate).toISOString();

    const result = await apiFetch<{ user: unknown }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: form.name,
        birthDate: birthDateIso,
        gender: form.gender,
        nationality: form.nationality,
        languages: form.languages,
        education: form.education || undefined,
        jobTitle: form.jobTitle || undefined,
        industry: form.industry || undefined,
        relationshipGoal: form.relationshipGoal,
        lifestyle: form.lifestyle,
        interests: form.interests,
        personalityPrompts: form.personalityPrompts.filter((p) => p.answer.trim()),
        city: form.city || undefined,
        country: form.nationality.length === 2 && form.nationality !== 'OTHER' ? form.nationality : 'AE',
      }),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader
        title={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
        description="Build your profile so Mayla can find people who match your intent"
      />

      <div className="mb-6 flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-warm-200 dark:bg-warm-400/20'
            }`}
          />
        ))}
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200/50 bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        {step === 0 ? (
          <>
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                required
                placeholder="How should others see you?"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="birthDate">Date of birth</Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <SingleSelectChips
                options={GENDERS.map((g) => ({ value: g.value, label: g.label }))}
                value={form.gender || null}
                onChange={(v) => update('gender', v)}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <Label>Nationality</Label>
              <SingleSelectChips
                options={NATIONALITIES.map((n) => ({ value: n.code, label: n.label }))}
                value={form.nationality || null}
                onChange={(v) => update('nationality', v)}
              />
            </div>
            <div>
              <Label>Languages you speak</Label>
              <ChipSelect
                options={LANGUAGES}
                value={form.languages}
                onChange={(v) => update('languages', v)}
                max={5}
              />
            </div>
            <div>
              <Label htmlFor="city">City (optional)</Label>
              <Input
                id="city"
                placeholder="Dubai, Riyadh, Manama..."
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <Label>Education</Label>
              <SingleSelectChips
                options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
                value={form.education || null}
                onChange={(v) => update('education', v)}
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job title (optional)</Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Software Engineer"
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
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Pick one — this shows on your profile so others know your intent instantly.
            </p>
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
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div>
              <Label>Lifestyle</Label>
              <ChipSelect
                options={LIFESTYLE_TAGS}
                value={form.lifestyle}
                onChange={(v) => update('lifestyle', v)}
                max={8}
              />
            </div>
            <div>
              <Label htmlFor="interests">Interests (comma-separated, optional)</Label>
              <Input
                id="interests"
                placeholder="coffee, travel, fitness"
                value={form.interests.join(', ')}
                onChange={(e) =>
                  update(
                    'interests',
                    e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Answer up to 3 prompts — these help you stand out (optional).
            </p>
            <PromptPicker
              value={form.personalityPrompts}
              onChange={(v) => update('personalityPrompts', v)}
              max={3}
            />
          </>
        ) : null}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button
            className="flex-1"
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button className="flex-1" loading={loading} onClick={finish}>
            Complete profile
          </Button>
        )}
      </div>
    </Card>
  );
}
