export const dynamic = 'force-dynamic';

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { MaylaAppIconOg } from '@/components/ui/mayla-icon';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sizeParam = searchParams.get('size');
  const size = sizeParam === '512' ? 512 : 192;

  return new ImageResponse(<MaylaAppIconOg size={size} />, {
    width: size,
    height: size,
  });
}
