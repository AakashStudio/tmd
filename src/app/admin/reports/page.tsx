import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const reports = await query(
    `SELECT r.*,
      reporter_p.name as reporter_name,
      reported_p.name as reported_name
     FROM reports r
     LEFT JOIN profiles reporter_p ON reporter_p.user_id = r.reporter_id
     LEFT JOIN profiles reported_p ON reported_p.user_id = r.reported_user_id
     ORDER BY 
       CASE WHEN r.status = 'pending' THEN 0 WHEN r.status = 'reviewing' THEN 1 ELSE 2 END,
       r.created_at DESC
     LIMIT 100`
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-[#FF9800]/15 text-[#FF9800]',
    reviewing: 'bg-[#2196F3]/15 text-[#2196F3]',
    resolved: 'bg-[#4CAF50]/15 text-[#4CAF50]',
    dismissed: 'bg-[#616161]/15 text-[#616161]',
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      <div className="space-y-3">
        {reports.rows.map((report: any) => (
          <div key={report.id} className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2E2E2E]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[report.status] || ''}`}>{report.status}</span>
                <span className="text-xs text-[#616161] bg-[#252525] px-2 py-0.5 rounded">{report.report_type}</span>
                <span className="text-xs text-[#616161] bg-[#252525] px-2 py-0.5 rounded">{report.reason}</span>
              </div>
              <span className="text-xs text-[#616161]">{new Date(report.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm">
              <span className="text-[#9E9E9E]">Reporter:</span> {report.reporter_name || 'Unknown'}
              {report.reported_name && (
                <> → <span className="text-[#9E9E9E]">Reported:</span> {report.reported_name}</>              )}
            </p>
            {report.description && <p className="text-sm text-[#616161] mt-1">{report.description}</p>}
          </div>
        ))}
        {reports.rows.length === 0 && <p className="text-[#9E9E9E] text-center py-8">No reports</p>}
      </div>
    </div>
  );
}
