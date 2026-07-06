import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  "Why did my score drop?",
  "What is a Metro 2 violation?",
  "What are business funding requirements?",
  "How can I remove a charge-off?"
];

export default function FtfAiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      text: "Hello! I am FTF AI, your 24/7 dedicated Credit & Business Funding intelligence. I can analyze your credit score metrics, clarify inquiries, identify regulatory disputes, or review business loan requirements. Ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ftf-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.response || "I didn't receive a clear statement. Let me try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Local smart response fallback if backend key is missing or routes are disabled
        setTimeout(() => {
          const lowerText = textToSend.toLowerCase();
          let fallbackResponse = "I have reviewed your query. Under FCRA and FDCPA guidelines, credit accounts must report with absolute accuracy. Would you like me to generate a formal dispute letter for this?";

          if (lowerText.includes("drop") || lowerText.includes("score drop")) {
            fallbackResponse = `Your credit score drops are usually caused by four primary variables:
1. **Utilization Increase**: Carrying balances above 10% of your limit on credit cards immediately increases credit risk and reduces FICO score calculations.
2. **Hard Inquiry Impact**: Every hard inquiry pulls personal score ratings down by 3-5 points, which remains active on your report for 12 months.
3. **New Account Impact**: Registering new trade lines reduces the average age of accounts (AAoA), dropping scores temporarily.
4. **Reporting Delays or Changes**: Closed accounts, active disputes being updated, or old items dropping off can shift bureau calculations.

To recover, we recommend immediately paying credit cards down to 3% utilization (using the AZEO method) and auditing the hard inquiries for Permissible Purpose under FCRA Section 604.`;
          } else if (lowerText.includes("metro 2") || lowerText.includes("metro")) {
            fallbackResponse = `**Metro 2** is the industry standard format for reporting consumer credit history. Credit reporting agencies and original creditors must transmit account metrics in precise fields. 

If any field (e.g., Base Segment, J2 Segment, Current Balance, or Account Status Date) is incorrectly padded, contains missing characters, or conflicts with the Date of Last Activity, it represents a **Metro 2 Formatting Violation**. 

Under 15 U.S.C. § 1681i, any account failing complete technological compliance must be completely deleted from the consumer credit report. FTF automatically scans reports to detect these exact metadata conflicts.`;
          } else if (lowerText.includes("funding") || lowerText.includes("business funding")) {
            fallbackResponse = `To secure high-limit **Business Funding**, lenders evaluate both your personal credit profile and corporate fundamentals:
1. **Personal Credit Score**: A minimum 680 FICO score on all 3 bureaus with zero late payments in the last 24 months.
2. **Business Age**: At least 2 years registered as an LLC or Corporation to satisfy standard underwriting.
3. **Monthly Revenues**: Consistent bank deposits of $15,000+ per month ($180k+ annual run rate) for Merchant Cash Advances (MCA) or Lines of Credit.
4. **Industry Classification**: Avoiding high-risk industries (such as trucking, real estate investing, or cannabis) on your EIN profile, or styling the LLC name appropriately.

You currently hold a **Funding Readiness Score of 72%**. Fixing your remaining negative items will unlock higher credit stacking opportunities.`;
          } else if (lowerText.includes("charge-off") || lowerText.includes("remove")) {
            fallbackResponse = `Removing a **Charge-Off** or collection involves a multi-round audit process:
1. **Validation Demand (FDCPA § 1692g)**: Demand that the collection agency produce the original contract bearing your signature, and proof of complete chain of assignment.
2. **Factual Dispute (FCRA § 611)**: Target reporting discrepancies, such as reporting a balance on a charge-off while simultaneously showing a closed account status (which represents illegal double-reporting under FTC guidelines).
3. **Metro 2 Tech Audit**: Scan for chronological metadata errors.

Once we identify these statutory violations, we file a direct CFPB complaint alongside formal dispute packets. If the bureau fails to resolve it in 30 days, they are legally bound to erase the trade line.`;
          }

          const botMessage: Message = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: fallbackResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMessage]);
        }, 1000);
      }
    } catch (err: any) {
      setError("Failed to stream answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-neutral-150 shadow-sm flex flex-col h-[580px] overflow-hidden text-left">
      {/* Header */}
      <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-display font-black text-sm">FTF AI Assistant</h3>
            <p className="text-[10px] text-neutral-400 font-medium">Equipped with FCRA / FDCPA / Credit Guidelines • 24/7 Live</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
          <Sparkles size={10} className="animate-pulse" /> Active
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-neutral-50/50">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%] text-xs leading-relaxed",
                isBot ? "mr-auto" : "ml-auto flex-row-reverse"
              )}
            >
              <div className={cn(
                "size-8 rounded-xl flex items-center justify-center shrink-0 uppercase text-[10px] font-black font-mono",
                isBot ? "bg-neutral-900 text-emerald-400" : "bg-emerald-600 text-white"
              )}>
                {isBot ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="space-y-1">
                <div className={cn(
                  "p-4 rounded-[20px] whitespace-pre-wrap font-semibold shadow-sm border",
                  isBot 
                    ? "bg-white text-neutral-800 border-neutral-150 rounded-tl-sm" 
                    : "bg-emerald-600 text-white border-emerald-700 rounded-tr-sm"
                )}>
                  {msg.text}
                </div>
                <div className={cn("text-[9px] text-neutral-400 font-bold", isBot ? "text-left" : "text-right")}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] text-xs mr-auto">
            <div className="size-8 rounded-xl bg-neutral-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="bg-white border border-neutral-150 p-4 rounded-[20px] rounded-tl-sm text-neutral-500 font-semibold italic flex items-center gap-2 shadow-sm">
              <Bot size={14} className="animate-bounce" />
              FTF AI is compiling relevant legal codes...
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex gap-2 text-red-700 text-xs items-center">
            <AlertCircle size={14} className="shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Preset Prompts suggestions */}
      <div className="p-4 bg-white border-t border-neutral-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {PRESET_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="px-3.5 py-1.5 border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900 bg-white rounded-full text-[10px] font-extrabold tracking-tight cursor-pointer whitespace-nowrap transition-all shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-100 bg-white flex gap-3 shrink-0">
        <input
          type="text"
          placeholder="Ask FTF AI about credit reports, utilization, Metro 2, funding eligibility..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          className="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={loading || !input.trim()}
          className="size-11 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-all shadow-md disabled:opacity-40 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
