'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface BlockedUser {
  id: string;
  blockedUserId: string;
  name: string;
  createdAt: string;
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [blockedList, setBlockedList] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data?.blockedUsers) {
        setBlockedList(data.data.blockedUsers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      const res = await fetch('/api/users/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('User unblocked', 'success');
        setBlockedList((prev) => prev.filter((u) => u.blockedUserId !== userId));
      } else {
        showToast(data.error || 'Failed to unblock', 'error');
      }
    } catch (err) {
      showToast('Error unblocking user', 'error');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-5rem)] px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/app/settings')} className="text-[#9E9E9E] hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Blocked Users</h1>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#9E9E9E]">Loading...</div>
      ) : blockedList.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Shield size={36} className="text-[#616161] mx-auto" />
          <p className="text-[#9E9E9E] text-sm">You haven't blocked anyone.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#2E2E2E] bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
          {blockedList.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-[#616161]">
                  Blocked {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={unblockingId === user.blockedUserId}
                onClick={() => handleUnblock(user.blockedUserId)}
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
