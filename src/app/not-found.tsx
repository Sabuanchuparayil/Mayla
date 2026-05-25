import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">404</h1>
        <p className="text-zinc-500">Page not found</p>
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
