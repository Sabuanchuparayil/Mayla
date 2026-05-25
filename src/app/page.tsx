import { getServerUser } from '@/lib/auth/server';
import { Button } from '@/components/ui/button';
import { MaylaIcon } from '@/components/ui/mayla-icon';

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

export default async function HomePage() {
  const user = await getServerUser();

  return (
    <div className="flex min-h-screen flex-col mesh-bg" style={{ background: 'var(--gradient-hero)' }}>
      {/* Floating decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <MaylaIcon className="absolute top-[15%] right-[10%] h-6 w-6 text-primary/8 animate-float" />
        <MaylaIcon className="absolute top-[45%] left-[8%] h-4 w-4 text-accent/10 animate-float delay-200" />
        <MaylaIcon className="absolute bottom-[25%] right-[15%] h-5 w-5 text-primary/6 animate-float delay-500" />
        <SparkleIcon className="absolute top-[30%] left-[20%] h-5 w-5 text-accent/8 animate-float delay-300" />
        <SparkleIcon className="absolute bottom-[35%] right-[25%] h-4 w-4 text-primary/6 animate-float delay-700" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <MaylaIcon className="h-6 w-6 text-primary" />
            <span className="font-[family-name:var(--font-amaranth)] text-xl font-bold gradient-text">
              mayla
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button href="/dashboard">Dashboard</Button>
            ) : (
              <>
                <Button href="/verify" variant="ghost" size="sm">
                  Phone sign in
                </Button>
                <Button href="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button href="/signup" size="sm">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-5 py-2 text-sm font-medium text-primary backdrop-blur-sm">
          <ShieldIcon className="h-4 w-4" />
          Verified social discovery
        </div>

        <h1 className="animate-fade-up delay-100 mt-8 max-w-3xl font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Where{' '}
          <span className="gradient-text italic inline border-0 outline-none">real</span>
          {' '}connections begin
        </h1>

        <p className="animate-fade-up delay-200 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Every profile is selfie-verified. Every photo is face-matched.
          Meet authentic people near you — no pretending, no catfishing.
        </p>

        <div className="animate-fade-up delay-300 mt-10 flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Button href="/discover" size="lg" variant="glow">
              <MaylaIcon className="h-5 w-5" />
              Start discovering
            </Button>
          ) : (
            <>
              <Button href="/verify" size="lg" variant="glow">
                <MaylaIcon className="h-5 w-5" />
                Continue with phone
              </Button>
              <Button href="/signup" size="lg" variant="outline">
                Create account
              </Button>
            </>
          )}
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid w-full gap-5 text-left md:grid-cols-3">
          {[
            {
              icon: ShieldIcon,
              title: 'Selfie verified',
              body: 'Every profile is verified with a live selfie. Know exactly who you are talking to.',
              delay: 'delay-100',
            },
            {
              icon: MapPinIcon,
              title: 'Nearby discovery',
              body: 'Find people close to you across the Middle East, sorted by distance in real time.',
              delay: 'delay-200',
            },
            {
              icon: ChatIcon,
              title: 'Secure conversations',
              body: 'Message your matches instantly with encrypted, real-time conversations.',
              delay: 'delay-300',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`group glass-card p-7 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 animate-fade-up ${item.delay}`}
            >
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="animate-fade-up delay-500 mt-20 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground/60">
          <span className="flex items-center gap-1.5">
            <ShieldIcon className="h-4 w-4" />
            Face verification
          </span>
          <span className="h-4 w-px bg-warm-300" />
          <span className="flex items-center gap-1.5">
            <MaylaIcon className="h-3.5 w-3.5" />
            100% real profiles
          </span>
          <span className="h-4 w-px bg-warm-300" />
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4" />
            Middle East focused
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-200/50 py-8 text-center text-sm text-muted-foreground/50 dark:border-warm-400/10">
        <p>&copy; {new Date().getFullYear()} Mayla. Made with love for the Middle East.</p>
      </footer>
    </div>
  );
}
