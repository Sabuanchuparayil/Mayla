'use client';

import { cn } from '@/lib/utils';

type ChipSelectProps = {
  options: string[] | { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  className?: string;
};

export function ChipSelect({ options, value, onChange, max, className }: ChipSelectProps) {
  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
      return;
    }
    if (max !== undefined && value.length >= max) return;
    onChange([...value, option]);
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {normalized.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(opt.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200',
              selected
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-warm-300/60 bg-white/50 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:border-warm-400/20 dark:bg-white/5',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type SingleSelectProps = {
  options: { value: string; label: string; description?: string; icon?: string }[];
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
};

export function SingleSelectChips({ options, value, onChange, className }: SingleSelectProps) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200',
              selected
                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                : 'border-warm-300/60 bg-white/50 hover:border-primary/30 dark:border-warm-400/20 dark:bg-white/5',
            )}
          >
            {opt.icon ? <span className="text-xl">{opt.icon}</span> : null}
            <div>
              <div className="text-sm font-semibold">{opt.label}</div>
              {opt.description ? (
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
