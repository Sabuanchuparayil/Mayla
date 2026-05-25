import { NearbyList } from '@/components/nearby/nearby-list';

export default function NearbyPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight">
          Nearby
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People close to you, sorted by distance
        </p>
      </div>
      <NearbyList />
    </div>
  );
}
