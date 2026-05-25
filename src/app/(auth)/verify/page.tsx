import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VerifyForm from './VerifyForm';

export const metadata: Metadata = {
  title: 'Verify · Mayla',
};

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  const visible = phone.slice(-4);
  const prefix = phone.slice(0, phone.length - 7);
  return `${prefix} ****${visible}`;
}

export default async function VerifyPage() {
  const cookieStore = await cookies();
  const identifier = cookieStore.get('otp_identifier')?.value;

  if (!identifier) {
    redirect('/login');
  }

  const maskedPhone = maskPhone(identifier);

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary-500">mayla</h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white px-8 py-8 shadow-xl shadow-gray-100/80 ring-1 ring-gray-100">
        <Link
          href="/login"
          className="mb-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </Link>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Check your messages</h2>
          <p className="mt-1 text-sm text-gray-500">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-gray-700">{maskedPhone}</span>
          </p>
        </div>

        <VerifyForm maskedPhone={maskedPhone} />
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Wrong number?{' '}
        <Link href="/login" className="text-primary-500 hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
}
