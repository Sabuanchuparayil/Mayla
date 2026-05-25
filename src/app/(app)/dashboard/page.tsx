import { getServerUser } from '@/lib/auth/server';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function DashboardPage() {
  const user = await getServerUser();

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="animate-fade-up">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your journey continues. Discover, connect, and build something real.
        </p>
      </div>

      {/* Verification prompt */}
      {!user?.verified ? (
        <Card className="animate-fade-up delay-100 border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/30">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-amber-600 dark:text-amber-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">Complete selfie verification</p>
              <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
                Verify your identity to appear in Discover and build trust with your matches.
              </p>
              <Button href="/verify/selfie" size="sm" className="mt-3">
                Verify now
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-fade-up delay-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-900/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verification</p>
              <p className="text-lg font-semibold">{user?.verified ? 'Verified' : 'Pending'}</p>
            </div>
          </div>
        </Card>
        <Card className="animate-fade-up delay-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-2.5 dark:bg-primary-900/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Onboarding</p>
              <p className="text-lg font-semibold">{user?.onboardingCompleted ? 'Complete' : 'In progress'}</p>
            </div>
          </div>
        </Card>
        <Card className="animate-fade-up delay-300">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent-50 p-2.5 dark:bg-accent-900/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold capitalize">Free tier</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="animate-fade-up delay-300">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">Quick actions</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/discover" variant="glow">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Start discovering
          </Button>
          <Button href="/chat" variant="outline">Messages</Button>
          <Button href="/nearby" variant="outline">Nearby</Button>
          <Button href="/profile" variant="outline">Edit profile</Button>
          <Button href="/settings" variant="ghost">Settings</Button>
        </div>
      </Card>
    </div>
  );
}
