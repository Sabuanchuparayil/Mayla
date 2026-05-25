import { cookies } from 'next/headers';
import SettingsClient from './SettingsClient';

export interface Preferences {
  minAgePreference: number | null;
  maxAgePreference: number | null;
  maxDistance: number | null;
  genderPreference: string[];
}

export interface Privacy {
  isVisible: boolean;
}

export interface Account {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  profile: { name: string } | null;
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';
  const cookieHeader = `access_token=${token}`;
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const fetchOpts: RequestInit = {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  };

  let preferences: Preferences = {
    minAgePreference: 18,
    maxAgePreference: 50,
    maxDistance: 50,
    genderPreference: [],
  };
  let privacy: Privacy = { isVisible: true };
  let account: Account | null = null;

  try {
    const [prefRes, privRes, acctRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/user/preferences`, fetchOpts),
      fetch(`${baseUrl}/api/user/privacy`, fetchOpts),
      fetch(`${baseUrl}/api/user/account`, fetchOpts),
    ]);

    if (prefRes.status === 'fulfilled' && prefRes.value.ok) {
      const json = (await prefRes.value.json()) as { preferences: Preferences | null };
      if (json.preferences) preferences = json.preferences;
    }
    if (privRes.status === 'fulfilled' && privRes.value.ok) {
      const json = (await privRes.value.json()) as { privacy: Privacy | null };
      if (json.privacy) privacy = json.privacy;
    }
    if (acctRes.status === 'fulfilled' && acctRes.value.ok) {
      const json = (await acctRes.value.json()) as { account: Account };
      account = json.account;
    }
  } catch {
    // use defaults
  }

  return (
    <SettingsClient
      initialPreferences={preferences}
      initialPrivacy={privacy}
      initialAccount={account}
    />
  );
}
