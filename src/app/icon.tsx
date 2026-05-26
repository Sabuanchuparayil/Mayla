import { ImageResponse } from 'next/og';
import { MaylaAppIconOg } from '@/components/ui/mayla-icon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<MaylaAppIconOg size={32} />, { ...size });
}
