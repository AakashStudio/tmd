import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect('/login');

  // Check admin role
  const admin = await queryOne(
    'SELECT role FROM admin_users WHERE user_id = $1',
    [session.userId]
  );

  if (!admin) redirect('/app');

  return (
    <div className="min-h-dvh bg-[#0A0A0A]">
      <nav className="border-b border-[#2E2E2E] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold"><span className="text-[#E91E63]">TMD</span> Admin</h1>
            <div className="hidden md:flex items-center gap-4">
              <a href="/admin" className="text-sm text-[#9E9E9E] hover:text-white">Dashboard</a>
              <a href="/admin/users" className="text-sm text-[#9E9E9E] hover:text-white">Users</a>
              <a href="/admin/reports" className="text-sm text-[#9E9E9E] hover:text-white">Reports</a>
              <a href="/admin/verification" className="text-sm text-[#9E9E9E] hover:text-white">Verification</a>
              <a href="/admin/events" className="text-sm text-[#9E9E9E] hover:text-white">Events</a>
              <a href="/admin/payments" className="text-sm text-[#9E9E9E] hover:text-white">Payments</a>
              <a href="/admin/support" className="text-sm text-[#9E9E9E] hover:text-white">Support</a>
            </div>
          </div>
          <span className="text-xs text-[#E91E63] font-medium">{admin.role.replace('_', ' ').toUpperCase()}</span>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
