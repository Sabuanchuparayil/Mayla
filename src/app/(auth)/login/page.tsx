import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in · Mayla',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary-500">mayla</h1>
        <p className="mt-1 text-sm text-gray-500">Find your person</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white px-8 py-8 shadow-xl shadow-gray-100/80 ring-1 ring-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Welcome</h2>
          <p className="mt-1 text-sm text-gray-500">Enter your phone number to get started</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
