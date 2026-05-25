import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · Mayla",
  description:
    "The terms and conditions that govern your use of the Mayla dating app, including eligibility, account rules, subscriptions, and safety.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-full bg-white font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="text-2xl font-bold text-primary-500 tracking-tight"
            >
              Mayla
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: May 2026</p>

        <p className="mt-4 text-sm text-gray-500 italic">
          This document is a template provided for informational purposes and
          does not constitute legal advice.
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) form a binding
              agreement between you and Mayla (&ldquo;Mayla,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By
              creating an account or using the app, you agree to these Terms and
              to our Privacy Policy. If you do not agree, please do not use
              Mayla.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">2. Eligibility</h2>
            <p>
              You must be at least <strong>18 years old</strong> to use Mayla.
              By using the app, you represent that you are 18 or older and that
              you have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              3. Your Account &amp; Verification
            </h2>
            <p>
              You are responsible for the activity on your account and for
              keeping your login credentials secure. To help keep the community
              authentic, Mayla may require face verification to confirm your
              identity. You agree to provide accurate information and not to
              impersonate anyone or create accounts for others.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              4. Acceptable Use &amp; Community Guidelines
            </h2>
            <p>To keep Mayla safe and welcoming, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harass, threaten, bully, or abuse other members.</li>
              <li>Create fake, misleading, or impersonating profiles.</li>
              <li>
                Post or share illegal, hateful, sexually exploitative, or
                otherwise objectionable content.
              </li>
              <li>Solicit money, spam, or promote commercial services.</li>
              <li>Use the app for any unlawful purpose or to harm others.</li>
            </ul>
            <p>
              We may remove content or suspend accounts that violate these
              guidelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              5. Content &amp; Licenses
            </h2>
            <p>
              You retain ownership of the photos, messages, and other content
              you create (&ldquo;User Content&rdquo;). By posting User Content,
              you grant Mayla a limited, worldwide license to host, store, and
              display it solely to operate and improve the service. Some media,
              such as disappearing photos, is designed to be available only
              briefly and may be deleted automatically after viewing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              6. Subscriptions &amp; Payments
            </h2>
            <p>
              Mayla offers paid subscriptions with additional features.
              Subscriptions <strong>renew automatically</strong> at the end of
              each billing period unless you cancel beforehand. Payments are
              processed securely through Stripe. You can cancel at any time
              through your account settings; cancellation takes effect at the
              end of the current billing period, and fees already paid are
              generally non-refundable except where required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              7. Safety &amp; Reporting
            </h2>
            <p>
              Your safety matters. If someone makes you uncomfortable, you can
              block and report them in the app. We review reports and may take
              action, including removing content or banning accounts. Always use
              good judgment when meeting people, and never share sensitive
              financial information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">8. Termination</h2>
            <p>
              You may delete your account at any time. We may suspend or
              terminate your access if you violate these Terms, create risk for
              other members, or use the app unlawfully. Upon termination, your
              right to use Mayla ends immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              9. Disclaimers &amp; Limitation of Liability
            </h2>
            <p>
              Mayla is provided &ldquo;as is&rdquo; without warranties of any
              kind. We do not guarantee that you will find a match or that other
              members are who they claim to be, even with verification. To the
              fullest extent permitted by law, Mayla is not liable for indirect,
              incidental, or consequential damages arising from your use of the
              service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              10. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which
              Mayla operates, without regard to conflict-of-law principles. Any
              disputes will be resolved in the courts of that jurisdiction,
              unless applicable law provides otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              11. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. When we make material
              changes, we will notify you and update the &ldquo;Last
              updated&rdquo; date above. Continued use of Mayla after changes
              take effect means you accept the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">12. Contact</h2>
            <p>
              Questions about these Terms? Reach us at{" "}
              <a
                href="mailto:legal@mayla.app"
                className="text-primary-500 hover:underline"
              >
                legal@mayla.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/"
            className="text-sm font-medium text-primary-500 hover:underline"
          >
            ← Back to Mayla
          </Link>
        </div>
      </main>
    </div>
  );
}
