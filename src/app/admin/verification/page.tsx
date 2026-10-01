import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage() {
  const requests = await query(
    `SELECT vr.*, p.name, u.phone, u.is_verified
     FROM verification_requests vr
     JOIN users u ON u.id = vr.user_id
     LEFT JOIN profiles p ON p.user_id = vr.user_id
     ORDER BY CASE WHEN vr.status = 'pending' THEN 0 ELSE 1 END, vr.submitted_at DESC
     LIMIT 100`
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Verification Requests</h2>
      <div className="space-y-3">
        {requests.rows.map((req: any) => (
          <div key={req.id} className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2E2E2E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{req.name || 'No profile'}</p>
                <p className="text-xs text-[#616161]">{req.phone}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                req.status === 'pending' ? 'bg-[#FF9800]/15 text-[#FF9800]' :
                req.status === 'approved' ? 'bg-[#4CAF50]/15 text-[#4CAF50]' :
                'bg-[#F44336]/15 text-[#F44336]'
              }`}>{req.status}</span>
            </div>
            <p className="text-xs text-[#616161] mt-1">Submitted: {new Date(req.submitted_at).toLocaleString()}</p>
          </div>
        ))}
        {requests.rows.length === 0 && <p className="text-[#9E9E9E] text-center py-8">No verification requests</p>}
      </div>
    </div>
  );
}
