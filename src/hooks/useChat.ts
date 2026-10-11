"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  isFromMe: boolean;
  content: string;
  type: "TEXT" | "VIEW_ONCE_PHOTO";
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
  media: {
    id: string;
    isViewOnce: boolean;
    isOpened: boolean;
    isExpired: boolean;
    canOpen: boolean;
    openedAt: string | null;
  } | null;
}

export interface ChatPartner {
  userId: string;
  name: string;
  photoUrl: string | null;
  isVerified: boolean;
  lastActiveAt: string;
}

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const lastMessageIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!conversationId) return;

    try {
      let url = `/api/chat/${conversationId}/messages`;
      if (isPolling && lastMessageIdRef.current) {
        url += `?cursor=${encodeURIComponent(lastMessageIdRef.current)}&direction=after&includePartner=false`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load messages");
      }
      const data = await res.json();
      const fetched: ChatMessage[] = data.messages || [];

      if (isPolling && lastMessageIdRef.current) {
        if (fetched.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = fetched.filter((m) => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            const updated = [...prev, ...newOnes];
            lastMessageIdRef.current = updated[updated.length - 1].id;
            return updated;
          });
        }
      } else {
        setMessages(fetched);
        if (fetched.length > 0) {
          lastMessageIdRef.current = fetched[fetched.length - 1].id;
        }
      }

      if (data.partner) {
        setPartner(data.partner);
      }
    } catch (err: any) {
      setError(err.message || "Error loading messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      lastMessageIdRef.current = null;
      return;
    }

    lastMessageIdRef.current = null;
    fetchMessages(false);

    // 3-second polling for real-time chat updates (incremental)
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim() || isSending) return;
    setIsSending(true);

    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "TEXT", content }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send message");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const sendViewOncePhoto = async (base64Data: string) => {
    if (!conversationId || !base64Data || isSending) return;
    setIsSending(true);

    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VIEW_ONCE_PHOTO",
          mediaBase64: base64Data,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send view-once photo");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      alert(err.message || "Failed to send photo");
    } finally {
      setIsSending(false);
    }
  };

  const openViewOnce = async (mediaId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/chat/view-once/${mediaId}/open`, {
        method: "POST",
      });

      if (res.status === 410) {
        alert("This view-once photo has already been opened or has expired.");
        await fetchMessages();
        return null;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cannot open view-once photo");
      }

      const data = await res.json();
      const streamUrl = `/api/chat/view-once/${mediaId}/stream?token=${encodeURIComponent(
        data.streamToken
      )}`;

      // Update local state to mark opened immediately
      setMessages((prev) =>
        prev.map((m) =>
          m.media?.id === mediaId
            ? {
                ...m,
                media: {
                  ...m.media,
                  isOpened: true,
                  canOpen: false,
                  openedAt: new Date().toISOString(),
                },
              }
            : m
        )
      );

      return streamUrl;
    } catch (err: any) {
      alert(err.message || "Failed to open view-once photo");
      return null;
    }
  };

  return {
    messages,
    partner,
    isLoading,
    isSending,
    error,
    sendMessage,
    sendViewOncePhoto,
    openViewOnce,
    refresh: fetchMessages,
  };
}
