'use client';

import { useState } from 'react';

export function AdminUserActions({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) window.location.reload();
      else alert('Failed');
    } catch (err) {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      {currentStatus === 'active' && (
        <>
          <button onClick={() => handleAction('suspend')} className="text-[10px] px-2 py-1 rounded bg-[#FF9800]/15 text-[#FF9800] hover:bg-[#FF9800]/25" disabled={loading}>Suspend</button>
          <button onClick={() => handleAction('ban')} className="text-[10px] px-2 py-1 rounded bg-[#F44336]/15 text-[#F44336] hover:bg-[#F44336]/25" disabled={loading}>Ban</button>
        </>
      )}
      {(currentStatus === 'suspended' || currentStatus === 'banned') && (
        <button onClick={() => handleAction('activate')} className="text-[10px] px-2 py-1 rounded bg-[#4CAF50]/15 text-[#4CAF50] hover:bg-[#4CAF50]/25" disabled={loading}>Activate</button>
      )}
    </div>
  );
}
