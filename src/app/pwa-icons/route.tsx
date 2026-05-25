export const dynamic = 'force-dynamic';

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

function MaylaAppIcon({ size }: { size: number }) {
  const scale = size / 512;
  const r = Math.round(96 * scale);
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sizeParam = searchParams.get('size');
  const size = sizeParam === '512' ? 512 : 192;

  return new ImageResponse(<MaylaAppIcon size={size} />, {
    width: size,
    height: size,
  });
}
