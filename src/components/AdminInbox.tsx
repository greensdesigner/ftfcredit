import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, RefreshCw, User, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface ChatContact {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

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

export default function AdminInbox() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const pollingContactsInterval = useRef<any>(null);
  const pollingMessagesInterval = useRef<any>(null);

  // Fetch all chat contacts
  const fetchContacts = async (showLoading = false) => {
    if (!tenantId) return;
    if (showLoading) setLoadingContacts(true);
    try {
      const res = await fetch(`/api/messages/contacts?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.error("Error fetching contacts:", e);
    } finally {
      if (showLoading) setLoadingContacts(false);
    }
  };

  // Fetch messages with selected contact
  const fetchMessages = async (clientUid: string, showLoading = false) => {
    if (!tenantId) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?tenantId=${tenantId}&clientUid=${clientUid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Mark all messages from selected client as read
  const markAsRead = async (clientUid: string) => {
    if (!tenantId) return;
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          clientUid,
          readerRole: 'admin'
        })
      });
      // Refresh contact badge count locally
      setContacts(prev =>
        prev.map(c => c.uid === clientUid ? { ...c, unreadCount: 0 } : c)
      );
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  };

  // Handle contact selection
  const handleSelectContact = (contact: ChatContact) => {
    setSelectedContact(contact);
    fetchMessages(contact.uid, true);
    markAsRead(contact.uid);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedContact || !tenantId || !user) return;

    const messageText = typedMessage.trim();
    setTypedMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: selectedContact.uid,
          message: messageText,
          tenantId
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        // Append message and scroll
        setMessages(prev => [...prev, newMsg]);
        // Fast refresh contacts in background to update "last message"
        fetchContacts();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  // Poll contacts list every 5 seconds
  useEffect(() => {
    fetchContacts(true);
    pollingContactsInterval.current = setInterval(() => {
      fetchContacts(false);
    }, 5000);

    return () => {
      if (pollingContactsInterval.current) clearInterval(pollingContactsInterval.current);
    };
  }, [tenantId]);

  // Poll active conversation every 3 seconds when a contact is selected
  useEffect(() => {
    if (pollingMessagesInterval.current) {
      clearInterval(pollingMessagesInterval.current);
      pollingMessagesInterval.current = null;
    }

    if (selectedContact) {
      pollingMessagesInterval.current = setInterval(() => {
        fetchMessages(selectedContact.uid, false);
      }, 3000);
    }

    return () => {
      if (pollingMessagesInterval.current) clearInterval(pollingMessagesInterval.current);
    };
  }, [selectedContact, tenantId]);

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date helper
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 rounded-[32px] border border-neutral-100 bg-white shadow-sm overflow-hidden min-h-[650px] flex flex-col md:flex-row text-left">
      {/* Sidebar List of Clients */}
      <div className="w-full md:w-80 border-r border-neutral-100 flex flex-col bg-neutral-50/50">
        <div className="p-6 border-b border-neutral-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-neutral-900 flex items-center gap-2">
              <MessageSquare size={20} className="text-neutral-500" />
              Clients Messages
            </h3>
            <button 
              onClick={() => fetchContacts(true)}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition-all"
              title="Refresh inbox"
            >
              <RefreshCw size={16} className={cn(loadingContacts && "animate-spin")} />
            </button>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-800 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Contacts Roster */}
        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {loadingContacts && contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
              <RefreshCw size={24} className="animate-spin text-neutral-300" />
              <p className="text-xs font-bold uppercase tracking-wider">Syncing conversations...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 text-center px-4">
              <User size={32} className="text-neutral-300 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">No conversations found</p>
              <p className="text-[11px] text-neutral-400 mt-1">Clients can initiate message chats from their portal dashboards.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100/50">
              {filteredContacts.map(contact => {
                const isSelected = selectedContact?.uid === contact.uid;
                return (
                  <button
                    key={contact.uid}
                    onClick={() => handleSelectContact(contact)}
                    className={cn(
                      "w-full text-left p-4 flex gap-3 transition-all relative",
                      isSelected 
                        ? "bg-white border-l-4 border-neutral-950" 
                        : "hover:bg-white/80"
                    )}
                  >
                    <div className="size-11 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {contact.avatarUrl ? (
                        <img src={contact.avatarUrl} alt={contact.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-neutral-900 text-sm truncate">{contact.fullName}</span>
                        {contact.lastMessageAt && (
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-semibold">
                            <Clock size={10} />
                            {formatTime(contact.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate pr-4">
                        {contact.lastMessage || <span className="italic text-neutral-300">No messages yet</span>}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {contact.unreadCount > 0 && (
                      <span className="absolute top-1/2 -translate-y-1/2 right-4 size-5 rounded-full bg-emerald-500 text-[10px] font-black text-white flex items-center justify-center shadow-sm">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Panel */}
      <div className="flex-1 flex flex-col bg-white min-h-[450px]">
        {selectedContact ? (
          <>
            {/* Conversation Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden">
                  {selectedContact.avatarUrl ? (
                    <img src={selectedContact.avatarUrl} alt={selectedContact.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-neutral-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm leading-none mb-1">{selectedContact.fullName}</h4>
                  <p className="text-xs text-neutral-400 font-medium">{selectedContact.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-black tracking-tight text-emerald-500 uppercase flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Conversation Active
              </span>
            </div>

            {/* Message History */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] bg-neutral-50/20">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="animate-spin text-neutral-300" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-neutral-400 text-center">
                  <MessageSquare size={32} className="text-neutral-200 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">No Messages yet</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Send a message below to start the conversation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isAdminSender = msg.senderId === user?.uid || msg.senderRole === 'admin' || msg.senderRole === 'super_admin';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[75%]",
                          isAdminSender ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm leading-relaxed",
                            isAdminSender 
                              ? "bg-neutral-900 text-white rounded-br-none" 
                              : "bg-neutral-100 text-neutral-900 rounded-bl-none border border-neutral-200/50"
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase tracking-tight">
                          {isAdminSender ? 'You' : selectedContact.fullName} • {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100 flex gap-2">
              <input
                type="text"
                placeholder={`Reply to ${selectedContact.fullName.split(' ')[0]}...`}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
              />
              <button
                type="submit"
                disabled={sending || !typedMessage.trim()}
                className="size-11 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 text-white flex items-center justify-center shrink-0 shadow-md hover:shadow-lg transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="size-16 rounded-[20px] bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 shadow-inner mb-4">
              <MessageSquare size={28} className="text-neutral-300" />
            </div>
            <h4 className="font-display font-bold text-neutral-950 text-sm uppercase tracking-wider mb-1">Select conversation</h4>
            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
              Choose a client from the sidebar roster to reply to messages or initiate direct support channels.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
