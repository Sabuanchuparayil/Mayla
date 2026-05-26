import { cn } from '@/lib/utils';

/**
 * Mayla logo mark — arcs, dots, and dashed bridge.
 * Renders as an inline SVG that inherits color via `currentColor`.
 */
export function MaylaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
    >
      <path
        d="M72 310C72 310 148 140 256 140C364 140 440 310 440 310"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M112 332C112 332 176 176 256 176C336 176 400 332 400 332"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <circle cx="156" cy="280" r="30" fill="currentColor" />
      <circle cx="356" cy="280" r="30" fill="currentColor" />
      <path
        d="M190 276C190 276 220 228 256 228C292 228 322 276 322 276"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="12 16"
      />
    </svg>
  );
}

/** Logo mark on brand background — for OG ImageResponse favicon/PWA PNG generation. */
export function MaylaAppIconOg({ size }: { size: number }) {
  const r = Math.round((96 / 512) * size);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#E85D75',
        borderRadius: r,
      }}
    >
      <svg viewBox="0 0 512 512" width={size} height={size} fill="none">
        <path
          d="M72 310C72 310 148 140 256 140C364 140 440 310 440 310"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M112 332C112 332 176 176 256 176C336 176 400 332 400 332"
          stroke="white"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <circle cx="156" cy="280" r="30" fill="white" />
        <circle cx="356" cy="280" r="30" fill="white" />
        <path
          d="M190 276C190 276 220 228 256 228C292 228 322 276 322 276"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="12 16"
        />
      </svg>
    </div>
  );
}

/**
 * Mayla logo mark with filled background (for avatar-style use).
 */
export function MaylaIconFilled({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      <rect width="512" height="512" rx="96" fill="#E85D75" />
      <path
        d="M72 310C72 310 148 140 256 140C364 140 440 310 440 310"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M112 332C112 332 176 176 256 176C336 176 400 332 400 332"
        stroke="white"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <circle cx="156" cy="280" r="30" fill="white" />
      <circle cx="356" cy="280" r="30" fill="white" />
      <path
        d="M190 276C190 276 220 228 256 228C292 228 322 276 322 276"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="12 16"
      />
    </svg>
  );
}
