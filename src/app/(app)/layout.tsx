import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.has('access_token')) redirect('/login');
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      <main className="flex-1 overflow-hidden pb-16">{children}</main>
      <BottomNav matchCount={0} />
    </div>
  );
}
