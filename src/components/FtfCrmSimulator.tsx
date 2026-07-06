import React, { useState } from 'react';
import { 
  Users, CheckSquare, Plus, Mail, MessageSquare, Phone, 
  Clock, Trash2, ArrowRight, Play, Eye, Calendar, Sparkles, Check, Send 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Lead, CrmTask, CrmNote, CommunicationLog } from '../types/ftf';
import { 
  initialLeads, initialCrmTasks, initialCrmNotes, initialCommunicationLogs 
} from '../data/ftfMockData';

export default function FtfCrmSimulator() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [tasks, setTasks] = useState<CrmTask[]>(initialCrmTasks);
  const [notes, setNotes] = useState<CrmNote[]>(initialCrmNotes);
  const [logs, setLogs] = useState<CommunicationLog[]>(initialCommunicationLogs);

  // Forms
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadGoal, setNewLeadGoal] = useState(50000);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'Call' | 'Email' | 'SMS' | 'Other'>('Call');
  const [newTaskDue, setNewTaskDue] = useState('2026-07-10');

  const [newNoteContent, setNewNoteContent] = useState('');

  // Automated notification trigger form
  const [commType, setCommType] = useState<'SMS' | 'Email' | 'Voice Drop'>('SMS');
  const [commRecipient, setCommRecipient] = useState('Marcus Peterson');
  const [commMessage, setCommMessage] = useState('FTF System Warning: Your Experian credit inquiries are ready for deletion. Proceed to sign letter round 2.');

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: newLeadName,
      email: newLeadEmail || `${newLeadName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: newLeadPhone || '555-0100',
      status: 'New',
      creditScore: 600,
      fundingGoal: newLeadGoal,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setLeads([...leads, newLead]);
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadPhone('');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: CrmTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      dueDate: newTaskDue,
      completed: false,
      type: newTaskType
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    const newNote: CrmNote = {
      id: `note-${Date.now()}`,
      content: newNoteContent,
      author: 'FTF Admin Portal',
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotes([newNote, ...notes]);
    setNewNoteContent('');
  };

  const handleTriggerCommunication = () => {
    if (!commRecipient.trim() || !commMessage.trim()) return;
    
    const newLog: CommunicationLog = {
      id: `comm-${Date.now()}`,
      type: commType,
      recipient: commRecipient,
      message: commMessage,
      status: 'Delivered',
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLogs([newLog, ...logs]);
    alert(`Success: Simulated ${commType} dispatch completed to recipient "${commRecipient}"! Message delivered successfully.`);
  };

  const cycleLeadStatus = (id: string) => {
    const statuses: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Enrolled', 'Active', 'Closed'];
    setLeads(leads.map(lead => {
      if (lead.id === id) {
        const idx = statuses.indexOf(lead.status);
        const nextStatus = statuses[(idx + 1) % statuses.length];
        return { ...lead, status: nextStatus };
      }
      return lead;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-150 p-5 rounded-3xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Total CRM Leads</span>
          <div className="text-2xl font-black font-display text-neutral-900 mt-1">{leads.length} Active</div>
        </div>
        <div className="bg-white border border-neutral-150 p-5 rounded-3xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Tasks Pending</span>
          <div className="text-2xl font-black font-display text-amber-600 mt-1">{tasks.filter(t => !t.completed).length} Tasks</div>
        </div>
        <div className="bg-white border border-neutral-150 p-5 rounded-3xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Conversion Rate</span>
          <div className="text-2xl font-black font-display text-emerald-600 mt-1">42.5%</div>
        </div>
        <div className="bg-white border border-neutral-150 p-5 rounded-3xl shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Total SMS/Emails Sent</span>
          <div className="text-2xl font-black font-display text-neutral-900 mt-1">{logs.length} Sent</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEADS BOARD (7 Columns span) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
                  <Users size={20} className="text-neutral-900" /> CRM Leads & Conversion Matrix
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Double-click or tap the status badge to cycle leads through pipeline states.</p>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="pb-3 font-extrabold">Lead Contact</th>
                    <th className="pb-3 font-extrabold">FICO Rating</th>
                    <th className="pb-3 font-extrabold text-right">Goal Limit</th>
                    <th className="pb-3 font-extrabold text-center">Pipeline status</th>
                    <th className="pb-3 font-extrabold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-xs font-bold text-neutral-800">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-neutral-50/50">
                      <td className="py-4">
                        <div>
                          <p className="text-neutral-900 font-bold">{l.name}</p>
                          <p className="text-[10px] text-neutral-400 font-semibold">{l.email} • {l.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 font-mono">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px]",
                          l.creditScore >= 660 ? "bg-emerald-50 text-emerald-700" :
                          l.creditScore >= 600 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        )}>
                          {l.creditScore} FICO
                        </span>
                      </td>
                      <td className="py-4 text-right font-display text-neutral-900">${l.fundingGoal.toLocaleString()}</td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => cycleLeadStatus(l.id)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer hover:scale-105 transition-all",
                            l.status === 'New' ? "bg-neutral-50 text-neutral-600 border-neutral-200" :
                            l.status === 'Contacted' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            l.status === 'Qualified' ? "bg-purple-50 text-purple-700 border-purple-200" :
                            l.status === 'Enrolled' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            l.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {l.status} &rarr;
                        </button>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setCommRecipient(l.name)}
                          className="px-2 py-1 bg-neutral-900 text-white rounded-lg text-[10px] uppercase font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          Stage Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create Lead Form */}
            <form onSubmit={handleAddLead} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-150 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Add New CRM Lead Prospect</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={newLeadName}
                  required
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0" 
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0" 
                />
                <input 
                  type="text" 
                  placeholder="Phone" 
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0" 
                />
                <button 
                  type="submit"
                  className="rounded-xl bg-neutral-950 text-white font-extrabold text-xs uppercase tracking-wider py-2 cursor-pointer hover:bg-neutral-800 transition-all"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>

          {/* AUTOMATED COMMUNICATIONS DISPATCH LOGS */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
                <MessageSquare size={20} className="text-neutral-900" /> Automated Texting, Emails & Voice Drops
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Trigger secure communications to simulate real customer marketing and transaction updates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Trigger Input form (4 cols) */}
              <div className="md:col-span-5 space-y-4 border-r border-neutral-100 pr-0 md:pr-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Dispatch Transmitter</span>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Comm Method</label>
                    <select 
                      value={commType}
                      onChange={(e) => setCommType(e.target.value as any)}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold"
                    >
                      <option value="SMS">Simulated SMS Text</option>
                      <option value="Email">Transactional Email</option>
                      <option value="Voice Drop">Voice Drop (ROBO-CALL)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Recipient Name</label>
                    <input 
                      type="text" 
                      value={commRecipient}
                      onChange={(e) => setCommRecipient(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold focus:ring-0" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Message Script</label>
                    <textarea 
                      rows={3}
                      value={commMessage}
                      onChange={(e) => setCommMessage(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold focus:ring-0"
                    />
                  </div>

                  <button
                    onClick={handleTriggerCommunication}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Play size={12} /> Dispatch Broadcast
                  </button>
                </div>
              </div>

              {/* Logs display (7 cols) */}
              <div className="md:col-span-7 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Secure Transmitter Outbox logs</span>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 border border-neutral-150 rounded-2xl bg-neutral-50 flex items-start gap-2.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-widest text-white shrink-0",
                        log.type === 'SMS' ? "bg-emerald-600" :
                        log.type === 'Email' ? "bg-blue-600" : "bg-purple-600"
                      )}>
                        {log.type}
                      </span>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-neutral-900">To: {log.recipient}</span>
                          <span className="text-neutral-400 font-bold font-mono text-[9px]">{log.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-snug">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* TASKS AND NOTES (4 Columns span) */}
        <div className="lg:col-span-4 space-y-6">
          {/* CRM Tasks Checklist */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
              <CheckSquare size={18} /> Daily Action Tasks
            </h3>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex items-center gap-2.5 text-left">
                    <button
                      onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                      className={cn(
                        "size-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer",
                        task.completed ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-300 bg-white"
                      )}
                    >
                      {task.completed && <Check size={12} />}
                    </button>
                    <div>
                      <p className={cn("text-xs font-bold leading-snug", task.completed ? "line-through text-neutral-400" : "text-neutral-800")}>{task.title}</p>
                      <span className="text-[9px] text-neutral-400 font-mono font-bold">Due: {task.dueDate}</span>
                    </div>
                  </div>
                  <span className="text-[8px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded uppercase font-mono font-bold shrink-0">{task.type}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTask} className="pt-3 border-t border-neutral-100 space-y-2">
              <input 
                type="text" 
                placeholder="New Task Title..." 
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold focus:ring-0" 
              />
              <div className="flex gap-2">
                <select 
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as any)}
                  className="flex-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-bold"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="Other">Other</option>
                </select>
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-neutral-950 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>

          {/* Admin CRM Private Notes */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-display font-black text-base text-neutral-900">CRM Internal Notes</h3>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-left">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-neutral-50/50 border border-neutral-100 rounded-2xl relative">
                  <p className="text-[11px] text-neutral-600 leading-relaxed">{note.content}</p>
                  <div className="flex justify-between items-center text-[8px] text-neutral-400 font-mono font-bold mt-2">
                    <span>By {note.author}</span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="pt-3 border-t border-neutral-100 space-y-2">
              <textarea 
                rows={2}
                placeholder="Write private CRM note here..." 
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold focus:ring-0" 
              />
              <button 
                type="submit" 
                className="w-full py-1.5 bg-neutral-950 text-white text-xs font-extrabold uppercase tracking-wide rounded-xl hover:bg-neutral-800 cursor-pointer"
              >
                Save CRM Note
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
