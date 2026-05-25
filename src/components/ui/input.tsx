import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          'flex h-11 w-full rounded-xl border bg-white/60 px-4 py-2 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 dark:bg-white/5 dark:focus:bg-white/10',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15'
            : 'border-warm-300 dark:border-warm-400/20',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
