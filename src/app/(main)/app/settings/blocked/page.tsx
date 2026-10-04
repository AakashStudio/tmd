'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';

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
    <div className="flex-1 p-4 select-none bg-[#08080A]">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => router.push('/app/settings')}
          className="w-8 h-8 rounded-[6px] bg-[#121216] border border-[#1E1E26] flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="tmd-h3 text-white">Blocked Users</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-[#71717A]">Loading...</div>
      ) : blockedList.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No blocked users"
          description="You haven't blocked anyone yet. Blocked accounts cannot message or discover you."
        />
      ) : (
        <div className="divide-y divide-[#1E1E26] bg-[#121216] rounded-[8px] border border-[#1E1E26] overflow-hidden">
          {blockedList.map((user) => (
            <div key={user.id} className="p-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-white">{user.name}</p>
                <p className="text-[10px] text-[#71717A]">
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
