import { SettingsPanel } from '@/components/settings/settings-panel';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, subscription, and privacy
        </p>
      </div>
      <SettingsPanel />
    </div>
  );
}
