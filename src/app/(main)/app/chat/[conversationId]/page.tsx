'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Camera, Check, CheckCheck, MoreVertical, Shield, Flag, UserX, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Avatar } from '@/components/ui/Avatar';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  media?: {
    id: string;
    isViewOnce: boolean;
    viewedAt: string | null;
    expiresAt: string | null;
  } | null;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; photo: string | null; verified: boolean; matchId: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showOptions, setShowOptions] = useState(false);
  const [showUnmatch, setShowUnmatch] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [viewTimeRemaining, setViewTimeRemaining] = useState<number>(15);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadConversationInfo();
    loadMessages();
    loadCurrentUser();
    startSSE();
    markAsRead();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [conversationId]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) setCurrentUserId(data.data.user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversationInfo = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const conv = data.data.find((c: any) => c.id === conversationId);
        if (conv) {
          setOtherUser({
            id: conv.otherUserId,
            name: conv.otherUserName,
            photo: conv.otherUserPhoto,
            verified: conv.otherUserVerified,
            matchId: conv.matchId,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startSSE = () => {
    const es = new EventSource('/api/chat/ws');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.data.conversationId === conversationId) {
          setMessages((prev) => [...prev, data.data]);
          scrollToBottom();
          markAsRead();
        }
        if (data.type === 'status_update' && data.data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.data.id
                ? {
                    ...m,
                    status: data.data.status,
                    deliveredAt: data.data.deliveredAt,
                    readAt: data.data.readAt,
                  }
                : m
            )
          );
        }
      } catch (err) {
        // keepalive or parse error
      }
    };
    es.onerror = () => {
      es.close();
      setTimeout(startSSE, 4000);
    };
    eventSourceRef.current = es;
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/chat/${conversationId}/read`, { method: 'POST' });
    } catch (err) {
      // silent
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      content: newMessage.trim(),
      messageType: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');
    scrollToBottom();

    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempMsg.content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.data : m)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendViewOnce = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const res = await fetch(`/api/chat/${conversationId}/view-once`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, data.data]);
          scrollToBottom();
        } else {
          alert(data.error || 'Failed to send View Once photo');
        }
      } catch (err) {
        console.error(err);
      }
    };
    input.click();
  };

  const handleOpenViewOnce = async (messageId: string) => {
    try {
      const res = await fetch(`/api/chat/${conversationId}/view-once`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        setViewingPhotoUrl(data.data.url);
        setViewTimeRemaining(15);

        const timer = setInterval(() => {
          setViewTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setViewingPhotoUrl(null);
              loadMessages();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(data.error || 'This View Once photo has already expired.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnmatchConfirm = async () => {
    if (!otherUser?.matchId) return;
    try {
      await fetch(`/api/matches/${otherUser.matchId}/unmatch`, { method: 'POST' });
      router.push('/app/chat');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockConfirm = async () => {
    if (!otherUser?.id) return;
    try {
      await fetch(`/api/users/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otherUser.id }),
      });
      router.push('/app/chat');
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check size={12} className="text-white/60" />;
      case 'delivered': return <CheckCheck size={12} className="text-white/70" />;
      case 'read': return <CheckCheck size={12} className="text-[#FF4D6D]" />;
      default: return null;
    }
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#08080A] select-none">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 py-2.5 bg-[#0E0E12] border-b border-[#1E1E26] sticky top-0 z-20 shadow-md">
        <button
          type="button"
          onClick={() => router.push('/app/chat')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={19} />
        </button>

        {otherUser ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative">
              <Avatar
                src={otherUser.photo}
                alt={otherUser.name}
                size="sm"
                verified={otherUser.verified}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border border-[#0E0E12]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">{otherUser.name}</h2>
              <span className="text-[10px] text-[#10B981] font-semibold flex items-center gap-1">
                Active now
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-xs font-bold">Chat</div>
        )}

        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
          aria-label="Options"
        >
          <MoreVertical size={17} />
        </button>
      </header>

      {/* Message Thread */}
      <main className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
        {/* Safety Notice */}
        <div className="text-center py-1">
          <span className="text-[10px] text-[#71717A] bg-[#121216] px-3 py-1 rounded-[6px] border border-[#1E1E26] inline-flex items-center gap-1">
            <Shield size={11} className="text-[#FF1493]" /> TMD Encrypted • View Once Active
          </span>
        </div>

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-[8px] px-3.5 py-2 text-xs shadow-md transition-all ${
                  isMine
                    ? 'bg-gradient-to-r from-[#FF1493] to-[#FF4D6D] text-white'
                    : 'bg-[#121216] text-white border border-[#1E1E26]'
                }`}
              >
                {/* View Once Photo Bubble */}
                {msg.messageType === 'view_once_photo' ? (
                  <div
                    onClick={() => !isMine && !msg.media?.viewedAt && handleOpenViewOnce(msg.id)}
                    className={`flex items-center gap-2.5 py-1 ${!isMine && !msg.media?.viewedAt ? 'cursor-pointer hover:opacity-90' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-black/35 flex items-center justify-center flex-shrink-0">
                      <Camera size={16} className={msg.media?.viewedAt ? 'text-[#71717A]' : 'text-[#FF4D6D]'} />
                    </div>
                    <div>
                      <p className="font-bold text-[11px]">
                        {msg.media?.viewedAt ? 'Photo Opened' : 'View Once Photo'}
                      </p>
                      <p className="text-[10px] opacity-75">
                        {msg.media?.viewedAt ? 'Single view expired' : isMine ? 'Sent to recipient' : 'Tap to view (15s)'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-relaxed font-normal">{msg.content}</p>
                )}

                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[9px] opacity-65 font-mono">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                  {isMine && getStatusIcon(msg.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Dock */}
      <footer className="px-3 py-2.5 bg-[#0E0E12] border-t border-[#1E1E26]">
        <div className="flex items-center gap-2">
          {/* Camera / View Once Trigger */}
          <button
            type="button"
            onClick={handleSendViewOnce}
            className="w-10 h-10 rounded-[8px] bg-[#121216] border border-[#1E1E26] text-[#A1A1AA] hover:text-[#FF1493] hover:border-[#FF1493]/40 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            title="Send View Once photo"
            aria-label="Send View Once"
          >
            <Camera size={18} />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white placeholder-[#71717A] text-xs focus:outline-none focus:border-[#FF1493] transition-colors"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-[8px] bg-[#FF1493] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#E0007E] active:scale-95 transition-all cursor-pointer flex-shrink-0 shadow-md shadow-[#FF1493]/25"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </footer>

      {/* Ephemeral View Once Fullscreen Overlay */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 select-none animate-fade-in">
          <div className="w-full flex items-center justify-between z-10 pt-2 px-2">
            <span className="text-xs font-bold bg-[#FF1493] text-white px-3 py-1 rounded-[6px] shadow-lg">
              Self-Destructs in {viewTimeRemaining}s
            </span>
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 w-full max-w-sm flex items-center justify-center py-4 relative">
            <img
              src={viewingPhotoUrl}
              alt="View Once"
              className="max-h-full max-w-full object-contain rounded-[8px] shadow-2xl pointer-events-none"
            />
            {/* Anti-screenshot Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <span className="text-white text-2xl font-black rotate-[-25deg] uppercase tracking-widest">
                TMD PROTECTED
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#71717A] pb-4">
            Protected single-view media. Screenshots & recording are strictly prohibited.
          </p>
        </div>
      )}

      {/* Conversation Options BottomSheet */}
      <BottomSheet isOpen={showOptions} onClose={() => setShowOptions(false)} title="Conversation Options">
        <div className="space-y-1 pb-4">
          <button
            type="button"
            onClick={() => {
              setShowOptions(false);
              setShowUnmatch(true);
            }}
            className="w-full text-left px-3.5 py-3 rounded-[8px] hover:bg-[#1A1A22] text-xs font-bold text-white flex items-center gap-3 transition-colors cursor-pointer"
          >
            <UserX size={16} className="text-[#FF4D6D]" />
            <span>Unmatch {otherUser?.name}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowOptions(false);
              setShowBlock(true);
            }}
            className="w-full text-left px-3.5 py-3 rounded-[8px] hover:bg-[#1A1A22] text-xs font-bold text-[#EF4444] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Shield size={16} className="text-[#EF4444]" />
            <span>Block & Report {otherUser?.name}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowOptions(false);
              router.push('/app/settings/report');
            }}
            className="w-full text-left px-3.5 py-3 rounded-[8px] hover:bg-[#1A1A22] text-xs font-semibold text-[#A1A1AA] hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Flag size={16} className="text-[#71717A]" />
            <span>Report Profile</span>
          </button>
        </div>
      </BottomSheet>

      {/* Unmatch Dialog */}
      <Dialog
        isOpen={showUnmatch}
        onClose={() => setShowUnmatch(false)}
        title={`Unmatch with ${otherUser?.name}?`}
        description="This will remove your match, close this chat, and prevent future discovery with each other."
        confirmText="Unmatch"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleUnmatchConfirm}
      />

      {/* Block Dialog */}
      <Dialog
        isOpen={showBlock}
        onClose={() => setShowBlock(false)}
        title={`Block ${otherUser?.name}?`}
        description="They will be immediately blocked from messaging you, discovering your profile, or seeing your events."
        confirmText="Block User"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}
