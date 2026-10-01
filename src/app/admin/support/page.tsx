import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const [tickets, dobRequests] = await Promise.all([
    query(
      `SELECT st.*, p.name as user_name, u.phone
       FROM support_tickets st
       JOIN users u ON u.id = st.user_id
       LEFT JOIN profiles p ON p.user_id = st.user_id
       ORDER BY st.created_at DESC
       LIMIT 50`
    ),
    query(
      `SELECT d.*, p.name as user_name, u.phone,
        EXTRACT(YEAR FROM AGE(d.current_dob))::int as current_age,
        EXTRACT(YEAR FROM AGE(d.requested_dob))::int as new_age
       FROM dob_correction_requests d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN profiles p ON p.user_id = d.user_id
       ORDER BY CASE WHEN d.status = 'pending' THEN 0 ELSE 1 END, d.created_at DESC
       LIMIT 50`
    ),
  ]);

  return (
    <div className="space-y-8">
      {/* DOB Correction Requests */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>DOB Correction Requests (Pro Users)</span>
          <span className="text-xs bg-[#E91E63]/20 text-[#E91E63] px-2 py-0.5 rounded font-mono">
            {dobRequests.rows.filter((r: any) => r.status === 'pending').length} pending
          </span>
        </h2>
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2E2E2E] text-[#9E9E9E]">
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Current DOB (Age)</th>
                <th className="text-left p-3">Requested DOB (New Age)</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {dobRequests.rows.map((req: any) => (
                <tr key={req.id} className="hover:bg-[#252525]">
                  <td className="p-3">
                    <span className="font-medium">{req.user_name || 'User'}</span>
                    <div className="text-[10px] text-[#616161]">{req.phone}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {new Date(req.current_dob).toLocaleDateString()} ({req.current_age} yrs)
                  </td>
                  <td className="p-3 text-xs font-semibold text-[#E91E63]">
                    {new Date(req.requested_dob).toLocaleDateString()} ({req.new_age} yrs)
                  </td>
                  <td className="p-3 text-xs text-[#9E9E9E] max-w-xs">{req.reason}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      req.status === 'approved' ? 'bg-[#4CAF50]/15 text-[#4CAF50]' :
                      req.status === 'rejected' ? 'bg-[#F44336]/15 text-[#F44336]' :
                      'bg-[#FF9800]/15 text-[#FF9800]'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[#616161]">{new Date(req.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {dobRequests.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#9E9E9E]">No DOB correction requests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Tickets */}
      <div>
        <h2 className="text-xl font-bold mb-4">Support Tickets</h2>
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2E2E2E] text-[#9E9E9E]">
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Subject</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {tickets.rows.map((t: any) => (
                <tr key={t.id} className="hover:bg-[#252525]">
                  <td className="p-3 font-medium">{t.user_name || t.phone}</td>
                  <td className="p-3 text-xs text-[#9E9E9E] capitalize">{t.category}</td>
                  <td className="p-3 text-sm">{t.subject}</td>
                  <td className="p-3">
                    <span className="text-xs bg-[#252525] text-[#9E9E9E] px-2 py-0.5 rounded">{t.status}</span>
                  </td>
                  <td className="p-3 text-xs text-[#616161]">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {tickets.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#9E9E9E]">No open tickets</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
