import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, MessageSquare, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  tenantId: string;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
}

export default function ClientInbox() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typedMessage, setTypedMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<any>(null);

  // Fetch conversations with admin team
  const fetchMessages = async (showLoading = false) => {
    if (!tenantId || !user?.uid) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/messages?tenantId=${tenantId}&clientUid=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Mark admin messages as read
  const markAsRead = async () => {
    if (!tenantId || !user?.uid) return;
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          clientUid: user.uid,
          readerRole: 'client'
        })
      });
    } catch (e) {
      console.error("Error marking messages as read:", e);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !tenantId || !user?.uid) return;

    const messageText = typedMessage.trim();
    setTypedMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: 'admin',
          message: messageText,
          tenantId
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Load and poll messages
  useEffect(() => {
    fetchMessages(true);
    markAsRead();

    pollingInterval.current = setInterval(() => {
      fetchMessages(false);
      markAsRead(); // Mark incoming reports as read too
    }, 3000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [tenantId, user?.uid]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format date helper
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 rounded-[32px] border border-neutral-100 bg-white shadow-sm overflow-hidden flex flex-col min-h-[550px] text-left">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-neutral-950 flex items-center justify-center text-white">
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-neutral-900 leading-none mb-1">Direct Consulting Channel</h3>
            <p className="text-xs text-neutral-400 font-medium">Have a question? Text your legal processing expert directly.</p>
          </div>
        </div>

        <button 
          onClick={() => fetchMessages(true)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition-all"
          title="Refresh chat"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {/* Messages Sandbox */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] bg-neutral-50/20">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
            <RefreshCw size={24} className="animate-spin text-neutral-300" />
            <p className="text-xs font-bold uppercase tracking-wider">Syncing secure connection...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-neutral-400 text-center max-w-sm mx-auto">
            <div className="size-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
              <UserCheck size={24} />
            </div>
            <p className="text-sm font-bold text-neutral-900 font-display uppercase tracking-wide">Secure Chanel Open</p>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Initiate a live text chat with your assigned credit advisor. Simply write your query below, and our backoffice will respond shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[75%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm leading-relaxed",
                      isMe 
                        ? "bg-neutral-900 text-white rounded-br-none" 
                        : "bg-white text-neutral-900 rounded-bl-none border border-neutral-100"
                    )}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase tracking-tight">
                    {isMe ? 'You' : (msg.senderName || 'Advising Specialist')} • {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Message FTF Legal Support... (press Enter to send)"
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={sending || !typedMessage.trim()}
          className="size-12 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 text-white flex items-center justify-center shrink-0 shadow-md hover:shadow-lg transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
