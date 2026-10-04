'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MessageSquare, Heart, Search, Lock } from 'lucide-react';
import { ListItemSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';

interface MatchItem {
  id: string;
  matchedUserId: string;
  name: string;
  age: number;
  isVerified: boolean;
  primaryPhoto: string | null;
  conversationId: string | null;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  matchId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserVerified: boolean;
  otherUserPhoto: string | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    messageType: string;
    status: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'matches' | 'chat'>('matches');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [whoLikedCount, setWhoLikedCount] = useState<number>(0);
  const [whoLikedLocked, setWhoLikedLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, convsRes, whoLikedRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/chat/conversations'),
        fetch('/api/discovery/who-liked'),
      ]);
      const matchesData = await matchesRes.json();
      const convsData = await convsRes.json();
      const whoData = await whoLikedRes.json();

      if (matchesData.success && Array.isArray(matchesData.data)) setMatches(matchesData.data);
      if (convsData.success && Array.isArray(convsData.data)) setConversations(convsData.data);
      if (whoData.success) {
        setWhoLikedCount(whoData.data?.total || 0);
        setWhoLikedLocked(false);
      } else if (whoData.data?.locked) {
        setWhoLikedLocked(true);
        setWhoLikedCount(8);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m`;
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h`;
    if (diffHrs < 168) return `${Math.floor(diffHrs / 24)}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col select-none bg-[#08080A]">
      {/* Top Header */}
      <header className="px-4 pt-3 pb-0 bg-[#0E0E12] border-b border-[#1E1E26] sticky top-0 z-30">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h1 className="tmd-h2 text-white">Messages</h1>
            {conversations.some((c) => c.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-[#FF1493] animate-pulse" />
            )}
          </div>
          {whoLikedCount > 0 && (
            <button
              type="button"
              onClick={() => router.push('/app/plan')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF1493] bg-[#FF1493]/10 border border-[#FF1493]/25 px-2.5 py-1 rounded-[6px] hover:brightness-110 cursor-pointer"
            >
              <Heart size={13} className="fill-[#FF1493]" />
              <span>{whoLikedCount} Likes</span>
            </button>
          )}
        </div>

        {/* Dual Tabs: MATCHES | CHAT */}
        <Tabs
          tabs={[
            { id: 'matches', label: 'MATCHES', badge: matches.length > 0 ? matches.length : null },
            { id: 'chat', label: 'CHAT', badge: conversations.some(c => c.unreadCount > 0) ? '•' : null },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'matches' | 'chat')}
        />
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="flex-1 p-3.5">
          {/* TAB 1: MATCHES */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {/* Horizontal Stories Carousel */}
              <div className="space-y-1.5">
                <span className="tmd-metadata text-[#71717A] px-1">
                  New Connections
                </span>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                  {/* Who Liked You Story Tile */}
                  <div
                    onClick={() => router.push('/app/plan')}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#FF1493] via-[#FF4D6D] to-[#F59E0B] shadow-md group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-full bg-[#121216] flex flex-col items-center justify-center relative overflow-hidden">
                        <Heart size={18} className="text-[#FF1493] fill-[#FF1493]" />
                        <span className="text-[10px] font-bold text-white mt-0.5">{whoLikedCount}</span>
                        {whoLikedLocked && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <Lock size={12} className="text-[#F59E0B]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#FF4D6D] truncate max-w-[64px]">
                      Likes You
                    </span>
                  </div>

                  {/* Matches Horizontal Story Rings */}
                  {matches.slice(0, 10).map((match) => (
                    <div
                      key={match.id}
                      onClick={() => {
                        if (match.conversationId) router.push(`/app/chat/${match.conversationId}`);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#FF1493] to-[#FF4D6D] shadow-md group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full bg-[#121216] overflow-hidden relative">
                          {match.primaryPhoto ? (
                            <img src={match.primaryPhoto} alt={match.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                              {match.name[0]}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-[64px]">
                        {match.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Matches Grid */}
              <div className="space-y-2 pt-2">
                <span className="tmd-metadata text-[#71717A] px-1">
                  All Matches ({matches.length})
                </span>

                {matches.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title="No matches yet"
                    description="Your matches will appear here once you both like each other."
                    actionLabel="Start Discovering"
                    onAction={() => router.push('/app')}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => {
                          if (match.conversationId) router.push(`/app/chat/${match.conversationId}`);
                        }}
                        className="bg-[#121216] rounded-[8px] overflow-hidden border border-[#1E1E26] hover:border-[#2D2D38] transition-all cursor-pointer group shadow-lg"
                      >
                        <div className="aspect-[4/5] relative bg-[#1A1A22] overflow-hidden">
                          {match.primaryPhoto ? (
                            <img
                              src={match.primaryPhoto}
                              alt={match.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[#71717A]">
                              No photo
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                              {match.name}, {match.age}
                            </span>
                            <span className="text-[10px] font-bold text-[#FF4D6D]">
                              Chat →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white placeholder-[#71717A] text-xs focus:outline-none focus:border-[#FF1493] transition-colors"
                />
              </div>

              {/* Conversations List */}
              {filteredConversations.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Start a conversation when you match."
                />
              ) : (
                <div className="divide-y divide-[#1E1E26] bg-[#121216] rounded-[8px] border border-[#1E1E26] overflow-hidden shadow-lg">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => router.push(`/app/chat/${conv.id}`)}
                      className="flex items-center gap-3 p-3 hover:bg-[#1A1A22] transition-colors cursor-pointer group"
                    >
                      <Avatar
                        src={conv.otherUserPhoto}
                        alt={conv.otherUserName}
                        size="md"
                        verified={conv.otherUserVerified}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-white truncate group-hover:text-[#FF1493] transition-colors">
                            {conv.otherUserName}
                          </span>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-[#71717A] font-medium flex-shrink-0">
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-[#A1A1AA]'}`}>
                            {conv.lastMessage?.messageType === 'view_once_photo'
                              ? '📷 View Once Photo'
                              : conv.lastMessage?.content || 'Start chatting'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 w-4 h-4 rounded-full bg-[#FF1493] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#FF1493]/40">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
