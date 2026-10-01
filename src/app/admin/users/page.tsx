import { query } from '@/lib/db';
import { AdminUserActions } from '@/components/admin/AdminUserActions';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await query(
    `SELECT u.id, u.phone, u.email, u.status, u.is_verified, u.role, u.created_at, u.last_active_at,
      p.name, p.gender, p.city,
      EXTRACT(YEAR FROM AGE(p.dob))::int as age,
      (SELECT p2.slug FROM subscriptions s JOIN plans p2 ON p2.id = s.plan_id
       WHERE s.user_id = u.id AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC LIMIT 1) as plan_slug
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     ORDER BY u.created_at DESC
     LIMIT 100`
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Users</h2>
      <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2E2E2E] text-[#9E9E9E]">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Age</th>
              <th className="text-left p-3">City</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {users.rows.map((user: any) => (
              <tr key={user.id} className="hover:bg-[#252525]">
                <td className="p-3 font-medium">{user.name || '—'}</td>
                <td className="p-3 text-[#9E9E9E]">{user.phone || '—'}</td>
                <td className="p-3">{user.age || '—'}</td>
                <td className="p-3 text-[#9E9E9E]">{user.city || '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${user.plan_slug === 'pro_499' ? 'bg-[#E91E63]/15 text-[#E91E63]' : 'bg-[#252525] text-[#9E9E9E]'}`}>
                    {user.plan_slug || 'free'}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${user.status === 'active' ? 'bg-[#4CAF50]/15 text-[#4CAF50]' : user.status === 'banned' ? 'bg-[#F44336]/15 text-[#F44336]' : 'bg-[#FF9800]/15 text-[#FF9800]'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-3">{user.is_verified ? '✓' : '—'}</td>
                <td className="p-3 text-[#616161] text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <AdminUserActions userId={user.id} currentStatus={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
