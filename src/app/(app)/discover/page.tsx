import { Metadata } from 'next';
import SwipeStack from '@/components/SwipeStack';

export const metadata: Metadata = {
  title: 'Discover · Mayla',
};

export default function DiscoverPage() {
  return (
    <div className="h-full flex flex-col">
      <SwipeStack />
    </div>
  );
}
