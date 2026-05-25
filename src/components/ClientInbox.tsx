import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, MessageSquare, Clock, UserCheck, Paperclip, FileText, Download, X } from 'lucide-react';
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
  fileUrl?: string | null;
  fileName?: string | null;
}

export default function ClientInbox() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typedMessage, setTypedMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const messageEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Limit to 10MB
        alert("ফাইলসাইজ ১০ মেগাবাইটের কম হতে হবে।");
        return;
      }
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
    if ((!typedMessage.trim() && !selectedFile) || !tenantId || !user?.uid) return;

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
          tenantId,
          fileUrl: selectedFile || null,
          fileName: selectedFileName || null
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        handleClearFile();
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
                    {msg.message && <div className="break-words whitespace-pre-line">{msg.message}</div>}
                    {msg.fileUrl && (
                      <div className={cn(
                        "flex items-center gap-2 rounded-xl p-2.5 mt-1 border text-[11px] font-semibold break-all select-none hover:opacity-95 transition-all",
                        isMe 
                          ? "bg-neutral-800 border-neutral-700 text-white mt-1" 
                          : "bg-neutral-50 border-neutral-200 text-neutral-800 mt-1"
                      )}>
                        <FileText size={16} className="shrink-0 text-red-500" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold leading-none">{msg.fileName || 'Attached File'}</p>
                        </div>
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName || 'attached_file'}
                          className={cn(
                            "p-1 rounded-md shrink-0 transition-colors",
                            isMe ? "hover:bg-neutral-700 text-neutral-200" : "hover:bg-neutral-200 text-neutral-600"
                          )}
                          title="Download File"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )}
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

      {/* Selected File Area */}
      {selectedFile && (
        <div className="mx-6 mb-2 p-2 rounded-xl bg-neutral-100/80 border border-neutral-200 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-neutral-800 font-bold max-w-[85%]">
            <FileText size={16} className="text-neutral-600 shrink-0" />
            <span className="truncate">{selectedFileName}</span>
          </div>
          <button 
            type="button" 
            onClick={handleClearFile} 
            className="p-1 hover:bg-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-900 transition-all shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100 bg-white flex items-center gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-500 hover:text-neutral-950 transition-all rounded-2xl flex items-center justify-center shrink-0"
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="text"
          placeholder="Message FTF Legal Support... (press Enter to send)"
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={sending || (!typedMessage.trim() && !selectedFile)}
          className="size-12 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 text-white flex items-center justify-center shrink-0 shadow-md hover:shadow-lg transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
