import Link from "next/link";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mayla",
    url: "https://mayla.app",
    description:
      "Mayla uses face verification and AI to ensure every match is a real person. Safe, genuine connections.",
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="text-2xl font-bold text-primary-500 tracking-tight"
            >
              Mayla
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero */}
        <section
          className="relative flex flex-col items-center justify-center min-h-[100svh] text-center px-4 sm:px-6 lg:px-8"
          style={{
            background:
              "linear-gradient(160deg, #ffffff 0%, #fef2f4 60%, #fde6ea 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Meet real people.{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #E85D75 0%, #d43258 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Verified.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
              Mayla uses face verification and AI to keep your matches genuine.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
              >
                Get Started — it&apos;s free
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold text-primary-500 border-2 border-primary-500 hover:bg-primary-50 transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Built for real connections
            </h2>
            <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
              Every feature is designed to protect you and help you meet
              authentic people.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-primary-50 border border-primary-100">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 mb-6">
                  <svg
                    className="w-7 h-7 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Real People Only
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every profile is verified with a live selfie. No catfishing.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-primary-50 border border-primary-100">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 mb-6">
                  <svg
                    className="w-7 h-7 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Disappearing Messages
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Send photos that self-destruct after viewing. Your privacy,
                  protected.
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-primary-50 border border-primary-100">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 mb-6">
                  <svg
                    className="w-7 h-7 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  People Nearby
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Discover verified singles within your distance preference.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
              Get started in minutes. It&apos;s quick, safe, and free.
            </p>
            <ol className="flex flex-col gap-10">
              {[
                {
                  step: 1,
                  title: "Create your profile",
                  description:
                    "Sign up with your phone number in seconds.",
                },
                {
                  step: 2,
                  title: "Get verified",
                  description: "Take a quick selfie to prove you're real.",
                },
                {
                  step: 3,
                  title: "Start matching",
                  description:
                    "Swipe, match, and chat with real people near you.",
                },
              ].map(({ step, title, description }) => (
                <li key={step} className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                    {step}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA banner */}
        <section
          className="py-24 px-4 sm:px-6 lg:px-8 text-center text-white"
          style={{
            background:
              "linear-gradient(135deg, #E85D75 0%, #d43258 60%, #b22248 100%)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Ready to meet someone real?
            </h2>
            <p className="text-lg text-primary-100 mb-10 opacity-90">
              Join thousands of verified singles already on Mayla.
            </p>
            <a
              href="#"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full text-lg font-bold text-primary-600 bg-white hover:bg-primary-50 transition-colors shadow-lg hover:shadow-xl"
            >
              Download Now
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-2xl font-bold text-primary-500 tracking-tight">
              Mayla
            </span>
            <span className="text-sm text-gray-400">Dating, verified.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-800 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-800 transition-colors">
              Terms of Service
            </Link>
            <a
              href="mailto:hello@mayla.app"
              className="hover:text-gray-800 transition-colors"
            >
              Contact
            </a>
          </nav>
          <p className="text-sm text-gray-400">
            &copy; 2026 Mayla. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
