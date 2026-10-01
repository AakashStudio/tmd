'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MessageSquare, Heart, Search, ArrowRight, Lock, Camera, Check, Flame } from 'lucide-react';
import { ListItemSkeleton } from '@/components/ui/Skeleton';

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
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col select-none bg-[#0A0A0A]">
      {/* Top Header & Segmented Dual Tabs */}
      <header className="px-4 pt-3 pb-0 border-b border-[#1A1A1A] bg-[#0E0E0E]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Messages</h1>
            {conversations.some((c) => c.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse" />
            )}
          </div>
          {whoLikedCount > 0 && (
            <button
              onClick={() => router.push('/app/plan')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#E91E63] bg-[#E91E63]/10 border border-[#E91E63]/25 px-2.5 py-1 rounded-[6px] hover:brightness-110 cursor-pointer"
            >
              <Heart size={13} className="fill-[#E91E63]" />
              <span>{whoLikedCount} Likes</span>
            </button>
          )}
        </div>

        {/* Dual Top Tabs: MATCHES | CHAT (Locked Spec Section 5) */}
        <div className="flex border-b border-[#1E1E1E]">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 pb-2.5 text-xs font-black tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'matches'
                ? 'text-white'
                : 'text-[#666666] hover:text-[#A0A0A0]'
            }`}
          >
            MATCHES {matches.length > 0 && `(${matches.length})`}
            {activeTab === 'matches' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#E91E63] rounded-[1px] shadow-[0_0_8px_rgba(233,30,99,0.8)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 pb-2.5 text-xs font-black tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'chat'
                ? 'text-white'
                : 'text-[#666666] hover:text-[#A0A0A0]'
            }`}
          >
            CHAT {conversations.length > 0 && `(${conversations.length})`}
            {conversations.some((c) => c.unreadCount > 0) && (
              <span className="absolute top-0 right-1/4 w-2 h-2 bg-[#E91E63] rounded-full shadow-[0_0_6px_#E91E63]" />
            )}
            {activeTab === 'chat' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#E91E63] rounded-[1px] shadow-[0_0_8px_rgba(233,30,99,0.8)]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="flex-1 py-3">
          {/* TAB 1: MATCHES */}
          {activeTab === 'matches' && (
            <div className="px-3.5 space-y-4">
              {/* Horizontal Story Carousel: Likes You Card + New Matches */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-[#666666] uppercase tracking-wider px-1">
                  New Connections
                </span>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide">
                  {/* Who Liked You Gold/Pink Glamour Story Card */}
                  <div
                    onClick={() => router.push('/app/plan')}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-[8px] p-0.5 bg-gradient-to-tr from-[#E91E63] via-[#FF6F61] to-[#FFD54F] shadow-lg shadow-[#E91E63]/25 group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[6px] bg-[#141414] flex flex-col items-center justify-center relative overflow-hidden">
                        <Heart size={20} className="text-[#E91E63] fill-[#E91E63]" />
                        <span className="text-[11px] font-black text-white mt-0.5">{whoLikedCount}</span>
                        {whoLikedLocked && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <Lock size={14} className="text-[#FFD54F]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#FF6F61] truncate max-w-[64px]">
                      Likes You
                    </span>
                  </div>

                  {/* Recent Match Story Tiles */}
                  {matches.slice(0, 8).map((match) => (
                    <div
                      key={match.id}
                      onClick={() => {
                        if (match.conversationId) router.push(`/app/chat/${match.conversationId}`);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-[8px] p-0.5 bg-gradient-to-tr from-[#E91E63] to-[#FF6F61] shadow-md group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-[6px] bg-[#1E1E1E] overflow-hidden relative">
                          {match.primaryPhoto ? (
                            <img src={match.primaryPhoto} alt={match.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                              {match.name[0]}
                            </div>
                          )}
                          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-[1px] bg-[#10B981] border border-black" />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-[64px]">
                        {match.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Matches Gallery Grid */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-black text-[#666666] uppercase tracking-wider px-1">
                  All Matches ({matches.length})
                </span>

                {matches.length === 0 ? (
                  <div className="text-center py-14 px-4 space-y-3 bg-[#121212] border border-[#202020] rounded-[8px] p-6">
                    <div className="w-12 h-12 rounded-[8px] bg-[#181818] border border-[#262626] flex items-center justify-center mx-auto text-[#666666]">
                      <Heart size={22} />
                    </div>
                    <h3 className="tmd-h3 text-white">No matches yet</h3>
                    <p className="tmd-body-small text-[#888888] max-w-xs mx-auto">
                      Discover verified profiles in your area. When you both swipe right, you can chat instantly.
                    </p>
                    <button
                      onClick={() => router.push('/app')}
                      className="px-4 py-2 bg-[#E91E63] text-white text-xs font-bold rounded-[6px] hover:bg-[#D81B60] transition-colors cursor-pointer mt-1"
                    >
                      Start Discovering
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => {
                          if (match.conversationId) router.push(`/app/chat/${match.conversationId}`);
                        }}
                        className="bg-[#121212] rounded-[8px] overflow-hidden border border-[#202020] hover:border-[#383838] transition-all cursor-pointer group shadow-lg"
                      >
                        <div className="aspect-[4/5] relative bg-[#181818] overflow-hidden">
                          {match.primaryPhoto ? (
                            <img
                              src={match.primaryPhoto}
                              alt={match.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[#616161]">
                              No photo
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-black text-white truncate drop-shadow-sm">
                                {match.name}, {match.age}
                              </span>
                              {match.isVerified && (
                                <span className="w-3.5 h-3.5 rounded-[2px] bg-[#E91E63] text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-[#FF6F61] opacity-90">
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
            <div className="px-3.5 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-[#121212] border border-[#202020] rounded-[8px] text-white placeholder-[#555555] text-xs focus:outline-none focus:border-[#E91E63] transition-colors"
                />
              </div>

              {/* Conversations List */}
              {filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3 bg-[#121212] border border-[#202020] rounded-[8px] p-6">
                  <div className="w-12 h-12 rounded-[8px] bg-[#181818] border border-[#262626] flex items-center justify-center mx-auto text-[#616161]">
                    <MessageSquare size={22} />
                  </div>
                  <h3 className="tmd-h3 text-white">No conversations yet</h3>
                  <p className="tmd-body-small text-[#888888] max-w-xs mx-auto">
                    Say hello to your matches to break the ice and start chatting.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#1A1A1A] bg-[#121212] rounded-[8px] border border-[#202020] overflow-hidden shadow-lg">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => router.push(`/app/chat/${conv.id}`)}
                      className="flex items-center gap-3 p-3 hover:bg-[#161616] transition-colors cursor-pointer group"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-[#202020] border border-[#282828]">
                          {conv.otherUserPhoto ? (
                            <img src={conv.otherUserPhoto} alt={conv.otherUserName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                              {conv.otherUserName[0]}
                            </div>
                          )}
                        </div>
                        {conv.otherUserVerified && (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-[2px] bg-[#E91E63] text-white flex items-center justify-center text-[8px] font-bold border border-[#121212]">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-black text-white truncate group-hover:text-[#E91E63] transition-colors">
                            {conv.otherUserName}
                          </span>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-[#616161] font-medium flex-shrink-0">
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-[#888888]'}`}>
                            {conv.lastMessage?.messageType === 'view_once_photo'
                              ? '📷 View Once Photo'
                              : conv.lastMessage?.content || 'Say hello...'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 w-4 h-4 rounded-full bg-[#E91E63] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#E91E63]/40">
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
