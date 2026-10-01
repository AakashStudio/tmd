import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [totalUsers, activeUsers, newSignups, totalMatches, totalMessages, activeSubs, revenue, pendingReports, pendingVerification, activeEvents] = await Promise.all([
    queryOne<{count:string}>('SELECT COUNT(*) as count FROM users'),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM users WHERE status = 'active' AND last_active_at > NOW() - INTERVAL '7 days'`),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '30 days'`),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM matches WHERE status = 'active'`),
    queryOne<{count:string}>('SELECT COUNT(*) as count FROM messages'),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`),
    queryOne<{total:string}>(`SELECT COALESCE(SUM(amount_inr), 0) as total FROM payments WHERE status = 'success'`),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM verification_requests WHERE status = 'pending'`),
    queryOne<{count:string}>(`SELECT COUNT(*) as count FROM events WHERE status = 'published' AND event_date >= CURRENT_DATE`),
  ]);

  const stats = [
    { label: 'Total Users', value: totalUsers?.count || '0', color: 'text-white' },
    { label: 'Active Users (7d)', value: activeUsers?.count || '0', color: 'text-[#4CAF50]' },
    { label: 'New Signups (30d)', value: newSignups?.count || '0', color: 'text-[#E91E63]' },
    { label: 'Active Matches', value: totalMatches?.count || '0', color: 'text-[#FF6F61]' },
    { label: 'Messages', value: totalMessages?.count || '0', color: 'text-white' },
    { label: 'Active Subscriptions', value: activeSubs?.count || '0', color: 'text-[#4CAF50]' },
    { label: 'Total Revenue', value: `\u20b9${revenue?.total || '0'}`, color: 'text-[#E91E63]' },
    { label: 'Pending Reports', value: pendingReports?.count || '0', color: pendingReports && parseInt(pendingReports.count) > 0 ? 'text-[#FF9800]' : 'text-white' },
    { label: 'Pending Verification', value: pendingVerification?.count || '0', color: 'text-[#FF9800]' },
    { label: 'Active Events', value: activeEvents?.count || '0', color: 'text-white' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2E2E2E]">
            <p className="text-xs text-[#616161] mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
