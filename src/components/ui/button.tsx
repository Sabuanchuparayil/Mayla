'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  href?: string;
};

const variants = {
  primary:
    'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:brightness-105 active:brightness-95',
  secondary:
    'bg-gradient-to-r from-accent-400 to-accent-300 text-accent-900 shadow-md shadow-accent-400/20 hover:shadow-lg hover:shadow-accent-400/30 hover:brightness-105',
  outline:
    'border border-primary-200 bg-transparent text-primary-600 hover:bg-primary-50 hover:border-primary-300 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/20',
  ghost:
    'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary-50/60 dark:hover:bg-primary-900/20',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20',
  glow:
    'bg-gradient-to-r from-primary-500 via-primary-400 to-accent-400 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 animate-pulse-glow',
};

const sizes = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 gap-2',
  lg: 'h-13 px-7 text-lg gap-2.5',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}) {
  return cn(
    'inline-flex items-center justify-center rounded-xl font-medium tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
    variants[variant ?? 'primary'],
    sizes[size ?? 'md'],
    className,
  );
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = buttonClassName({ variant, size, className });

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
