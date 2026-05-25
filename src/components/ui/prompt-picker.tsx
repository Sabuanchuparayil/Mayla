'use client';

import { PERSONALITY_PROMPTS } from '@/lib/constants/profile-options';
import { cn } from '@/lib/utils';

export type PersonalityPrompt = { prompt: string; answer: string };

type PromptPickerProps = {
  value: PersonalityPrompt[];
  onChange: (value: PersonalityPrompt[]) => void;
  max?: number;
};

export function PromptPicker({ value, onChange, max = 3 }: PromptPickerProps) {
  const usedPrompts = new Set(value.map((p) => p.prompt));
  const available = PERSONALITY_PROMPTS.filter((p) => !usedPrompts.has(p));

  function addPrompt(prompt: string) {
    if (value.length >= max) return;
    onChange([...value, { prompt, answer: '' }]);
  }

  function updateAnswer(index: number, answer: string) {
    const next = [...value];
    const current = next[index];
    if (!current) return;
    next[index] = { prompt: current.prompt, answer };
    onChange(next);
  }

  function removePrompt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {value.map((item, index) => (
        <div key={item.prompt} className="rounded-xl border border-warm-300/60 bg-white/50 p-4 dark:border-warm-400/20 dark:bg-white/5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-primary">{item.prompt}</p>
            <button
              type="button"
              onClick={() => removePrompt(index)}
              className="text-xs text-muted-foreground hover:text-red-500"
            >
              Remove
            </button>
          </div>
          <textarea
            value={item.answer}
            onChange={(e) => updateAnswer(index, e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Your answer..."
            className="w-full rounded-lg border border-warm-300/60 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-warm-400/20"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{item.answer.length}/200</p>
        </div>
      ))}

      {value.length < max && available.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Pick a prompt ({value.length}/{max})</p>
          <div className="flex flex-wrap gap-2">
            {available.slice(0, 6).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => addPrompt(prompt)}
                className={cn(
                  'rounded-full border border-dashed border-primary/30 px-3 py-1 text-xs text-primary/80 hover:bg-primary/5',
                )}
              >
                + {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
