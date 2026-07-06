import React, { useState } from 'react';
import { Smartphone, Bell, MessageSquare, Calendar, Shield, ArrowLeft, ArrowUpRight, Check, Send } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FtfMobileAppSimulator() {
  const [deviceOS, setDeviceOS] = useState<'iOS' | 'Android'>('iOS');
  const [activeScreen, setActiveScreen] = useState<'home' | 'notifications' | 'chat' | 'schedule'>('home');
  const [messages, setMessages] = useState<{ sender: 'client' | 'admin', text: string, time: string }[]>([
    { sender: 'admin', text: 'Hi Marcus, Equifax deleted your medical collection! Your score updated.', time: '10:05 AM' },
    { sender: 'client', text: 'Amazing! Can we apply for business lines of credit now?', time: '10:10 AM' },
    { sender: 'admin', text: 'Yes, your funding readiness is at 72%. Let’s draft the creditor letters first.', time: '10:12 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('2026-07-10');
  const [appointmentTime, setAppointmentTime] = useState('14:00');

  // Push notifications
  const [notifications, setNotifications] = useState([
    { id: 'n-1', title: 'Bureau Dispute Sent', body: 'Dispute round 1 dispatched to Equifax.', read: false, time: '2h ago' },
    { id: 'n-2', title: 'FICO Score Update', body: 'Your Experian rating rose by +15 points.', read: true, time: '1d ago' },
    { id: 'n-3', title: 'Business Formation Status', body: 'LLC Articles of Organization submitted.', read: true, time: '3d ago' }
  ]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { sender: 'client', text: chatInput, time: 'Just now' }]);
    setChatInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'admin', text: 'Received! Let me verify on the CRM logs.', time: 'Just now' }]);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-[32px] border border-neutral-150 p-6 shadow-sm flex flex-col lg:flex-row gap-8 items-center text-left">
      {/* Explanation Text */}
      <div className="flex-1 space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          <Smartphone size={12} className="text-emerald-500 animate-pulse" /> Phase 13: Client Mobile App
        </div>
        <h3 className="font-display font-black text-xl text-neutral-900 leading-tight">FTF Client Mobile Companion App</h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          FTF Credit Repair provides white-label companion applications for iOS and Android devices. Your clients can review dispute progression logs, receive real-time push alerts, book strategy sessions, and message their consulting brokers directly from their phones.
        </p>
        
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs space-y-2">
          <h4 className="font-extrabold text-neutral-900 uppercase tracking-wide">Included Core Channels</h4>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-neutral-600">
            <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Push Notifications</div>
            <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Secure Chat Tunnel</div>
            <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Score Updates</div>
            <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Upload Documents</div>
          </div>
        </div>

        {/* OS toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setDeviceOS('iOS')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all",
              deviceOS === 'iOS' ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-600"
            )}
          >
            Apple iOS Profile
          </button>
          <button
            onClick={() => setDeviceOS('Android')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all",
              deviceOS === 'Android' ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-600"
            )}
          >
            Google Android Profile
          </button>
        </div>
      </div>

      {/* Interactive Mobile Device Frame */}
      <div className="relative w-[310px] h-[610px] bg-neutral-950 rounded-[48px] p-3.5 shadow-2xl border-[6px] border-neutral-800 flex flex-col shrink-0">
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-5 w-28 h-5 bg-neutral-900 rounded-full z-20 flex items-center justify-end px-4 gap-1">
          <div className="size-1 rounded-full bg-blue-600 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
        </div>

        {/* Phone Glass Display Screen */}
        <div className="w-full h-full bg-white rounded-[36px] overflow-hidden flex flex-col relative text-[11px]">
          
          {/* Status Bar */}
          <div className="h-9 pt-3 px-6 flex justify-between items-center text-[10px] font-black text-neutral-950 font-mono z-10 select-none shrink-0 bg-neutral-50">
            <span>09:41 AM</span>
            <div className="flex items-center gap-1">
              <span className="tracking-tighter">LTE</span>
              <div className="w-4 h-2.5 border border-neutral-950 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-neutral-950 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Screen Navigation Inner Layout */}
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50 relative">
            
            {/* Inner Header */}
            <div className="h-11 px-4 bg-white border-b border-neutral-100 flex items-center justify-between font-bold text-neutral-900 shrink-0">
              {activeScreen !== 'home' ? (
                <button onClick={() => setActiveScreen('home')} className="text-neutral-500 flex items-center gap-0.5 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <span className="font-display font-extrabold text-neutral-950">FTF Credit Portal</span>
              )}
              
              <div className="flex gap-2">
                <button onClick={() => setActiveScreen('notifications')} className="relative text-neutral-500 cursor-pointer">
                  <Bell size={14} />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 size-1.5 bg-red-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* SCREEN STATES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* SCREEN: HOME */}
              {activeScreen === 'home' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Scores Cards */}
                  <div className="bg-neutral-900 text-white rounded-2xl p-3.5 space-y-3 shadow-md">
                    <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-neutral-400">Personal FICO Scores</span>
                      <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">Disputes Active</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
                        <div className="text-[8px] text-neutral-400 font-bold uppercase">EXP</div>
                        <div className="text-sm font-black text-white mt-0.5">620</div>
                      </div>
                      <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
                        <div className="text-[8px] text-neutral-400 font-bold uppercase">EQF</div>
                        <div className="text-sm font-black text-white mt-0.5">598</div>
                      </div>
                      <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
                        <div className="text-[8px] text-neutral-400 font-bold uppercase">TRU</div>
                        <div className="text-sm font-black text-white mt-0.5">615</div>
                      </div>
                    </div>
                  </div>

                  {/* Funding readiness block */}
                  <div className="bg-white rounded-2xl p-3 border border-neutral-150 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[8px] text-neutral-400 font-black uppercase tracking-wider">Funding Score</div>
                      <div className="text-base font-black text-neutral-900 mt-0.5">72%</div>
                    </div>
                    <span className="bg-blue-50 text-blue-700 font-black text-[8px] px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                      Good Odds <ArrowUpRight size={10} />
                    </span>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <button 
                      onClick={() => setActiveScreen('chat')}
                      className="bg-white border border-neutral-150 p-3 rounded-2xl flex flex-col items-center gap-1 hover:border-neutral-900 cursor-pointer transition-all"
                    >
                      <MessageSquare size={16} className="text-emerald-500" />
                      <span className="font-extrabold text-[9px] uppercase tracking-wider">Chat Tunnel</span>
                    </button>
                    <button 
                      onClick={() => setActiveScreen('schedule')}
                      className="bg-white border border-neutral-150 p-3 rounded-2xl flex flex-col items-center gap-1 hover:border-neutral-900 cursor-pointer transition-all"
                    >
                      <Calendar size={16} className="text-blue-500" />
                      <span className="font-extrabold text-[9px] uppercase tracking-wider">Book Strategy</span>
                    </button>
                  </div>

                  {/* Active Case tracker */}
                  <div className="bg-white rounded-2xl p-3.5 border border-neutral-150 text-left space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-[9px] uppercase tracking-wider text-neutral-400">Ongoing Progress</span>
                      <span className="text-[8px] text-neutral-400 font-bold font-mono">Step 1 of 5</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/5 bg-neutral-900 rounded-full" />
                    </div>
                    <p className="text-[9px] font-semibold text-neutral-500 leading-snug">
                      Your dispute letters have been sent. The national bureaus have until **August 4th** to conclude investigations.
                    </p>
                  </div>
                </div>
              )}

              {/* SCREEN: NOTIFICATIONS */}
              {activeScreen === 'notifications' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-[10px] uppercase tracking-widest text-neutral-400">Push Notifications</span>
                    <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} className="text-[9px] text-neutral-400 hover:text-neutral-900 font-extrabold">Mark All Read</button>
                  </div>
                  
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className={cn("p-3 rounded-xl border text-left flex gap-2 relative", n.read ? "bg-white border-neutral-150" : "bg-emerald-50/50 border-emerald-100")}>
                        {!n.read && <span className="absolute top-3 right-3 size-1.5 bg-emerald-500 rounded-full" />}
                        <Bell size={12} className={n.read ? "text-neutral-400" : "text-emerald-600"} />
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-neutral-900 text-[10px]">{n.title}</h4>
                          <p className="text-[9px] text-neutral-500 font-medium leading-tight">{n.body}</p>
                          <span className="text-[8px] text-neutral-300 font-mono font-bold block pt-1">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SCREEN: CHAT */}
              {activeScreen === 'chat' && (
                <div className="h-full flex flex-col justify-between animate-in fade-in duration-200">
                  <div className="space-y-3 flex-1 overflow-y-auto pb-4 max-h-[300px]">
                    {messages.map((m, idx) => (
                      <div key={idx} className={cn("flex flex-col max-w-[80%] text-[10px] p-2.5 rounded-2xl leading-normal border", m.sender === 'client' ? "ml-auto bg-emerald-600 text-white border-emerald-700 rounded-tr-none" : "mr-auto bg-white text-neutral-800 border-neutral-150 rounded-tl-none")}>
                        <p className="font-semibold">{m.text}</p>
                        <span className="text-[8px] opacity-70 mt-1 block text-right font-mono font-bold">{m.time}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 border-t border-neutral-100 pt-2 shrink-0 bg-neutral-50">
                    <input 
                      type="text" 
                      placeholder="Type message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-bold focus:ring-0 focus:border-neutral-950"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="size-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 hover:bg-neutral-800 cursor-pointer"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN: SCHEDULE */}
              {activeScreen === 'schedule' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="font-extrabold text-neutral-900 uppercase tracking-wide">Schedule Broker Call</h4>
                    <p className="text-[9px] text-neutral-400 mt-0.5">Book a one-on-one consultation with your credit broker.</p>
                  </div>

                  {scheduled ? (
                    <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 text-center space-y-1">
                      <Check size={20} className="text-emerald-500 mx-auto" />
                      <div className="font-black text-emerald-950 text-[10px]">Session Scheduled!</div>
                      <p className="text-[9px] text-emerald-600 font-semibold leading-relaxed">
                        Confirmed for {appointmentDate} at {appointmentTime}. A calendar invite has been sent.
                      </p>
                      <button 
                        onClick={() => setScheduled(false)} 
                        className="text-[9px] text-neutral-400 hover:text-neutral-900 font-extrabold underline block mx-auto pt-2 cursor-pointer"
                      >
                        Reschedule Call
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-neutral-400 uppercase">Consultation Date</label>
                        <input 
                          type="date" 
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-bold focus:ring-0" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-neutral-400 uppercase">Broker Time Slot</label>
                        <select 
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-bold focus:ring-0"
                        >
                          <option value="10:00">10:00 AM (EST)</option>
                          <option value="11:30">11:30 AM (EST)</option>
                          <option value="14:00">02:00 PM (EST)</option>
                          <option value="16:30">04:30 PM (EST)</option>
                        </select>
                      </div>

                      <button 
                        onClick={() => setScheduled(true)}
                        className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold uppercase tracking-wider py-2 text-[9px] cursor-pointer"
                      >
                        Confirm Booking Slot
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Bottom Nav Bar */}
            <div className="h-12 bg-white border-t border-neutral-100 flex items-center justify-around text-[9px] font-extrabold text-neutral-400 shrink-0">
              <button onClick={() => setActiveScreen('home')} className={cn("flex flex-col items-center gap-0.5 cursor-pointer", activeScreen === 'home' ? "text-neutral-950" : "")}>
                <Smartphone size={14} />
                <span>Home</span>
              </button>
              <button onClick={() => setActiveScreen('chat')} className={cn("flex flex-col items-center gap-0.5 cursor-pointer", activeScreen === 'chat' ? "text-neutral-950" : "")}>
                <MessageSquare size={14} />
                <span>Chat</span>
              </button>
              <button onClick={() => setActiveScreen('schedule')} className={cn("flex flex-col items-center gap-0.5 cursor-pointer", activeScreen === 'schedule' ? "text-neutral-950" : "")}>
                <Calendar size={14} />
                <span>Calendar</span>
              </button>
            </div>

          </div>

          {/* iOS bottom grab indicator */}
          <div className="h-5 bg-white flex items-center justify-center shrink-0 select-none pb-1">
            <div className="w-24 h-1 bg-neutral-200 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
}
