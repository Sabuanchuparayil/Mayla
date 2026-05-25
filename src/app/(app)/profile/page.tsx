import { cookies } from 'next/headers';
import Link from 'next/link';
import ProfileClient, { type OwnProfile } from './ProfileClient';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';
  const cookieHeader = `access_token=${token}`;
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

  let profile: OwnProfile | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { profile: OwnProfile };
      profile = json.profile;
    }
  } catch {
    profile = null;
  }

  if (!profile) {
    return (
      <div className="h-full overflow-y-auto flex flex-col items-center justify-center text-center px-6 gap-4">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth="1.5">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Complete your profile</h1>
        <p className="text-gray-500 text-sm max-w-xs">
          You haven&apos;t set up your profile yet. Finish onboarding to start meeting people.
        </p>
        <Link
          href="/onboarding"
          className="bg-primary-500 text-white font-semibold px-6 py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Complete onboarding
        </Link>
      </div>
    );
  }

  return <ProfileClient profile={profile} />;
}
