import { query } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const events = await query(
    `SELECT e.*, p.name as organizer_name, u.phone as organizer_phone,
      (SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'approved') as attendee_count
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     LEFT JOIN profiles p ON p.user_id = e.organizer_id
     ORDER BY e.created_at DESC
     LIMIT 100`
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Events Moderation</h2>
      <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2E2E2E] text-[#9E9E9E]">
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Organizer</th>
              <th className="text-left p-3">Date & Time</th>
              <th className="text-left p-3">Venue</th>
              <th className="text-left p-3">Capacity</th>
              <th className="text-left p-3">Fee</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {events.rows.map((ev: any) => (
              <tr key={ev.id} className="hover:bg-[#252525]">
                <td className="p-3 font-semibold">{ev.title}</td>
                <td className="p-3 text-xs capitalize text-[#9E9E9E]">{ev.category.replace('_', ' ')}</td>
                <td className="p-3 text-sm">
                  {ev.organizer_name || 'Organizer'}
                  <div className="text-[10px] text-[#616161]">{ev.organizer_phone}</div>
                </td>
                <td className="p-3 text-xs text-[#9E9E9E]">
                  {new Date(ev.event_date).toLocaleDateString()} at {ev.start_time}
                </td>
                <td className="p-3 text-xs text-[#9E9E9E] max-w-xs truncate">{ev.venue_name}</td>
                <td className="p-3 text-xs">
                  {ev.attendee_count} / {ev.capacity}
                </td>
                <td className="p-3 text-xs text-[#E91E63]">
                  {ev.entry_fee_inr ? `₹${ev.entry_fee_inr}` : 'Free'}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    ev.status === 'published' ? 'bg-[#4CAF50]/15 text-[#4CAF50]' :
                    ev.status === 'cancelled' ? 'bg-[#F44336]/15 text-[#F44336]' :
                    'bg-[#FF9800]/15 text-[#FF9800]'
                  }`}>
                    {ev.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
