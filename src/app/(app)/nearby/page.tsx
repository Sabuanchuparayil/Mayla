import { Metadata } from 'next';
import NearbyGrid from '@/components/NearbyGrid';

export const metadata: Metadata = {
  title: 'Nearby · Mayla',
};

export default function NearbyPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Nearby</h1>
      </div>
      <NearbyGrid />
    </div>
  );
}
