import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-access',
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let role: string | undefined;
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    role = payload['role'] as string | undefined;
  } catch {
    redirect('/login');
  }

  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Mayla</span>
          <span className="ml-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</span>
        </div>
        <AdminSidebarNav />
        <div className="px-4 py-3 border-t border-gray-200">
          <span className="text-xs text-gray-400">{role}</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
