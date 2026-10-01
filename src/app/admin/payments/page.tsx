import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const payments = await query(
    `SELECT pay.*, p.name as plan_name, prof.name as user_name, u.phone
     FROM payments pay
     JOIN plans p ON p.id = pay.plan_id
     JOIN users u ON u.id = pay.user_id
     LEFT JOIN profiles prof ON prof.user_id = pay.user_id
     ORDER BY pay.created_at DESC
     LIMIT 100`
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Payments</h2>
      <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2E2E2E] text-[#9E9E9E]">
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Razorpay ID</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {payments.rows.map((pay: any) => (
              <tr key={pay.id} className="hover:bg-[#252525]">
                <td className="p-3">{pay.user_name || pay.phone}</td>
                <td className="p-3">{pay.plan_name}</td>
                <td className="p-3 font-medium">\u20b9{pay.amount_inr}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    pay.status === 'success' ? 'bg-[#4CAF50]/15 text-[#4CAF50]' :
                    pay.status === 'failed' ? 'bg-[#F44336]/15 text-[#F44336]' :
                    'bg-[#FF9800]/15 text-[#FF9800]'
                  }`}>{pay.status}</span>
                </td>
                <td className="p-3 text-[#616161] text-xs">{pay.razorpay_payment_id || '—'}</td>
                <td className="p-3 text-[#616161] text-xs">{new Date(pay.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
