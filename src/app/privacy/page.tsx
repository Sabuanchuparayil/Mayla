import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Mayla",
  description:
    "How Mayla collects, uses, and protects your personal data, including face verification, location, photos, messaging, and payments.",
};

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: May 2026</p>

        <p className="mt-4 text-sm text-gray-500 italic">
          This document is a template provided for informational purposes and
          does not constitute legal advice.
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
            <p>
              Mayla (&ldquo;Mayla,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) helps people meet real, verified individuals.
              This Privacy Policy explains what information we collect when you
              use our app and website, how we use and protect it, and the
              choices you have. By using Mayla, you agree to the practices
              described here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              2. Information We Collect
            </h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account &amp; phone:</strong> your phone number and basic
                account credentials used to create and secure your account.
              </li>
              <li>
                <strong>Profile information:</strong> details you add such as
                your name, age, gender, bio, interests, and preferences.
              </li>
              <li>
                <strong>Photos:</strong> the images you upload to your profile or
                send within the app.
              </li>
              <li>
                <strong>Biometric / face verification data:</strong> a facial
                scan you provide during identity verification (see Section 4).
              </li>
              <li>
                <strong>Location:</strong> approximate or precise location used
                to show you nearby people (see Section 5).
              </li>
              <li>
                <strong>Usage data:</strong> how you interact with the app,
                including device information, log data, and diagnostics.
              </li>
              <li>
                <strong>Payment information:</strong> when you purchase a
                subscription, payment details are collected and processed by our
                payment provider, Stripe. We do not store full card numbers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create, operate, and personalize your Mayla account.</li>
              <li>Verify that you are a real person and help keep the community safe.</li>
              <li>Match you with and show you other members near you.</li>
              <li>Enable messaging, photos, and other core features.</li>
              <li>Process subscriptions and payments.</li>
              <li>Detect, prevent, and respond to fraud, abuse, and safety issues.</li>
              <li>Improve our services and comply with legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              4. Face Verification &amp; Biometric Data
            </h2>
            <p>
              Mayla uses face verification to confirm that members are real
              people and that profile photos match the person behind the
              account. When you verify, we generate a facial scan that is used
              <strong> solely to confirm your identity</strong> against your
              profile photos.
            </p>
            <p>
              We retain biometric verification data only for as long as
              reasonably necessary to complete and maintain verification, and we
              delete it when it is no longer needed or when you delete your
              account, whichever comes first. We do not use your facial scan for
              advertising, and{" "}
              <strong>we never sell your biometric data</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">5. Location Data</h2>
            <p>
              We use your location to power discovery and to show you people
              nearby. You can limit location precision or disable location
              access through your device settings, though doing so may reduce the
              quality of your matches or make some features unavailable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              6. Sharing &amp; Disclosure
            </h2>
            <p>
              We share information only as needed to operate Mayla:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service providers:</strong> trusted vendors such as
                Amazon Web Services (hosting and storage) and Stripe (payments)
                who process data on our behalf under contractual safeguards.
              </li>
              <li>
                <strong>Legal &amp; safety:</strong> when required by law, legal
                process, or to protect the rights, safety, and security of our
                members and the public.
              </li>
            </ul>
            <p>
              <strong>We never sell your personal information.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              7. Data Retention &amp; Deletion
            </h2>
            <p>
              We keep your information for as long as your account is active or
              as needed to provide our services. When you delete your account,
              we delete or anonymize your personal data, including your photos
              and biometric verification data, except where we must retain
              certain records to comply with legal, accounting, or safety
              obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">8. Your Rights</h2>
            <p>
              Depending on where you live, you may have the right to access,
              correct, export, or delete your personal data, and to opt out of
              certain processing. You can exercise many of these rights directly
              in the app or by contacting us at the email below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">9. Security</h2>
            <p>
              We use technical and organizational measures—including encryption
              in transit, access controls, and secure infrastructure—to protect
              your information. No system is perfectly secure, but we work
              continuously to safeguard your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">10. Children</h2>
            <p>
              Mayla is intended only for adults aged 18 and older. We do not
              knowingly collect personal information from anyone under 18. If we
              learn that we have, we will delete it promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we make
              material changes, we will notify you in the app or by other
              reasonable means and update the &ldquo;Last updated&rdquo; date
              above.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">12. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or our data
              practices, contact us at{" "}
              <a
                href="mailto:privacy@mayla.app"
                className="text-primary-500 hover:underline"
              >
                privacy@mayla.app
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
