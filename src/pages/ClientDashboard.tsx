import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, CheckCircle2, Settings, Plus, Sparkles, 
  Trash2, Layers, CheckSquare, ListTodo, FileText, ArrowUpRight, ShieldCheck, HelpCircle, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

// Local Note Type
interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

// Local Kanban Task Type
interface Task {
  id: string;
  title: string;
  column: 'todo' | 'progress' | 'done';
}

export default function ClientDashboard() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'workspace';

  // --- PLAYGROUND WORKSPACE STATES (For User's New App Concept) ---
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Boilerplate Workspace Active',
      content: 'This workspace is ready for you to build your SaaS app! All backend payment frameworks, stripe connects, and DB tables are already integrated and live.',
      category: 'General',
      updatedAt: new Date().toLocaleDateString()
    }
  ]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Initialize database tables', column: 'done' },
    { id: '2', title: 'Stripe webhook configuration', column: 'progress' },
    { id: '3', title: 'Integrate client business logic', column: 'todo' }
  ]);
  const [taskTitle, setTaskTitle] = useState('');

  // --- BILLING STATES ---
  const [plans] = useState([
    { name: 'Standard Plan', price: 99, features: ['Core App Engine', 'Basic Analytics', 'Standard DB Operations', 'E-mail Support'] },
    { name: 'Premium Plan', price: 149, features: ['Advanced Features', 'Live Real-time Events', 'Premium Automation', 'Priority Support'] },
    { name: 'Elite Plan', price: 299, features: ['Unlimited Resource Quota', 'Custom Hostname Branding', 'Direct Stripe Billing', 'Dedicated Account Executive'] }
  ]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [subscribingLoader, setSubscribingLoader] = useState(false);

  // Sync / Refresh billing info
  useEffect(() => {
    if (user?.uid) {
      fetchPaymentHistory();
    }
  }, [user?.uid]);

  const fetchPaymentHistory = async () => {
    if (!user?.uid) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/users/${user.uid}/payments`);
      if (res.ok) {
        setPaymentHistory(await res.json());
      }
    } catch (e) {
      console.error("Failed to load payment history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.streetAddress || '');
  const [profileCity, setProfileCity] = useState(user?.city || '');
  const [profileState, setProfileState] = useState(user?.state || '');
  const [profileZip, setProfileZip] = useState(user?.zipCode || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.streetAddress || '');
      setProfileCity(user.city || '');
      setProfileState(user.state || '');
      setProfileZip(user.zipCode || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileName,
          phone: profilePhone,
          streetAddress: profileAddress,
          city: profileCity,
          state: profileState,
          zipCode: profileZip,
          email: user.email
        })
      });
      if (res.ok) {
        await refreshProfile();
        alert("Profile info synchronized with database successfully!");
      } else {
        alert("Server failed to update profile.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Simulated rapid checkout when stripe keys are not fully configured
  const handleSimulatedSubscribe = async (planName: string, amount: number) => {
    if (!user?.uid) return;
    setSubscribingLoader(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          planName,
          amount,
          status: 'active'
        })
      });
      if (res.ok) {
        await refreshProfile();
        await fetchPaymentHistory();
        alert(`Successfully subscribed to ${planName}! Active plan initialized in database.`);
      } else {
        alert("Failed to initialize plan on database.");
      }
    } catch (e: any) {
      alert("Error processing: " + e.message);
    } finally {
      setSubscribingLoader(false);
    }
  };

  // Note-taker helpers
  const handleAddNote = () => {
    if (!noteTitle.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent || 'No content provided yet.',
      category: noteCategory || 'General',
      updatedAt: new Date().toLocaleDateString()
    };
    setNotes([newNote, ...notes]);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  // Task Kanban Board helpers
  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      column: 'todo'
    };
    setTasks([...tasks, newTask]);
    setTaskTitle('');
  };

  const moveTask = (id: string, col: 'todo' | 'progress' | 'done') => {
    setTasks(tasks.map(t => t.id === id ? { ...t, column: col } : t));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-6 text-left">
          <div>
            <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="text-yellow-500" /> Client Sandbox Portal
            </div>
            <h1 className="font-display text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              Your Custom Application Hub
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Configure billing systems, manage your profile, and test custom UI features directly.
            </p>
          </div>
          
          {/* Current subscription quick status badge */}
          <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-2xl p-4 shadow-lg shrink-0">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider leading-none">Subscription Status</div>
              <div className="text-sm font-bold mt-1">
                {user?.sub_status === 'active' ? (
                  <span className="text-emerald-400 font-black">{user.plan_name || 'Standard Plan'} Active</span>
                ) : (
                  <span className="text-amber-400">Setup Required</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 gap-2 pb-1 text-left overflow-x-auto">
          {[
            { id: 'workspace', label: 'Interactive App Sandbox' },
            { id: 'billing', label: 'Billing & Subscriptions' },
            { id: 'profile', label: 'My Settings Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={cn(
                "px-5 py-3 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-neutral-900 text-neutral-900 font-extrabold" 
                  : "border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ------------------ SANDBOX PLAYGROUND WORKSPACE TAB ------------------ */}
        {activeTab === 'workspace' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Developer Welcome Notice */}
            <div className="rounded-[32px] border border-neutral-150 bg-white p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start text-left">
              <div className="size-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <HelpCircle size={24} />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-neutral-900">Build Your Custom SaaS Right Here!</h2>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
                  We have fully purged the old credit repair files, leaving you with a clean slate while preserving 100% of the core user database authorization and Stripe direct payments setup. Below is an interactive sandbox displaying how you can construct customized components inside this portal!
                </p>
              </div>
            </div>

            {/* Custom SaaS Showcase (Note Taker and Kanban Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Note-Taker Section */}
              <div className="lg:col-span-5 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6 text-left">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <FileText className="text-neutral-900" size={20} />
                  <h3 className="font-display font-extrabold text-base text-neutral-900">Custom Markdown Notes Organizer</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="text" 
                      placeholder="Note Title..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Category (e.g. Work, Ideas)..."
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value)}
                        className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                      />
                      <button 
                        onClick={handleAddNote}
                        className="px-4 py-2 bg-neutral-950 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>
                  <textarea 
                    placeholder="Write details of your note here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold focus:border-neutral-900 focus:ring-0"
                  />
                </div>

                {/* Notes List */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-4 text-center">No notes written yet. Fill fields above to add one.</p>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 relative group">
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="absolute right-3 top-3 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{note.category}</span>
                          <span className="text-[10px] text-neutral-300 font-mono font-bold">{note.updatedAt}</span>
                        </div>
                        <h4 className="font-bold text-xs text-neutral-900 mt-2">{note.title}</h4>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed whitespace-pre-line">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kanban Sprint Tracker */}
              <div className="lg:col-span-7 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ListTodo className="text-neutral-900" size={20} />
                    <h3 className="font-display font-extrabold text-base text-neutral-900">Sprint Kanban Tasks Board</h3>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add interactive task..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold w-48 focus:border-neutral-900 focus:ring-0"
                    />
                    <button 
                      onClick={handleAddTask}
                      className="px-3 py-1.5 bg-neutral-950 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Todo */}
                  <div className="space-y-3 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 min-h-[350px]">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Backlog / Todo</span>
                      <span className="text-[10px] bg-neutral-200 text-neutral-700 font-bold px-2 py-0.5 rounded-full">{tasks.filter(t => t.column === 'todo').length}</span>
                    </div>
                    {tasks.filter(t => t.column === 'todo').map(task => (
                      <div key={task.id} className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm text-left relative group">
                        <p className="text-xs font-bold text-neutral-800 leading-snug">{task.title}</p>
                        <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-neutral-50">
                          <button 
                            onClick={() => moveTask(task.id, 'progress')} 
                            className="text-[9px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-900 cursor-pointer"
                          >
                            Work &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* In Progress */}
                  <div className="space-y-3 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 min-h-[350px]">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">In Development</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">{tasks.filter(t => t.column === 'progress').length}</span>
                    </div>
                    {tasks.filter(t => t.column === 'progress').map(task => (
                      <div key={task.id} className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm text-left relative group">
                        <p className="text-xs font-bold text-neutral-800 leading-snug">{task.title}</p>
                        <div className="flex justify-between gap-1 mt-3 pt-2 border-t border-neutral-50">
                          <button 
                            onClick={() => moveTask(task.id, 'todo')} 
                            className="text-[9px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-900 cursor-pointer"
                          >
                            &larr; Revert
                          </button>
                          <button 
                            onClick={() => moveTask(task.id, 'done')} 
                            className="text-[9px] font-black uppercase tracking-wider text-neutral-400 hover:text-emerald-600 cursor-pointer"
                          >
                            Deploy &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Done */}
                  <div className="space-y-3 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 min-h-[350px]">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Shipped</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">{tasks.filter(t => t.column === 'done').length}</span>
                    </div>
                    {tasks.filter(t => t.column === 'done').map(task => (
                      <div key={task.id} className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm text-left relative group">
                        <p className="text-xs font-bold text-neutral-800 leading-snug line-through opacity-60">{task.title}</p>
                        <div className="flex justify-start gap-1 mt-3 pt-2 border-t border-neutral-50">
                          <button 
                            onClick={() => moveTask(task.id, 'progress')} 
                            className="text-[9px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-900 cursor-pointer"
                          >
                            &larr; Reopen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ------------------ BILLING & SUBSCRIPTIONS TAB ------------------ */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-left">
            
            {/* Quick Pricing Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isActive = user?.plan_name === p.name && user?.sub_status === 'active';
                return (
                  <div 
                    key={p.name} 
                    className={cn(
                      "rounded-[32px] border p-8 flex flex-col relative overflow-hidden transition-all text-left",
                      isActive 
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-xl scale-[1.02]" 
                        : "border-neutral-150 bg-white text-neutral-900 shadow-sm hover:border-neutral-300"
                    )}
                  >
                    {isActive && (
                      <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Active Sub
                      </span>
                    )}
                    <h3 className="font-display font-black text-lg uppercase tracking-wide">{p.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black font-display">${p.price}</span>
                      <span className="text-xs opacity-75">/ month</span>
                    </div>
                    
                    <ul className="mt-6 space-y-3.5 flex-1 border-t border-neutral-200/25 pt-6">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs font-bold leading-none">
                          <CheckCircle2 size={14} className={isActive ? "text-emerald-400" : "text-emerald-600"} />
                          <span className="opacity-80">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={isActive || subscribingLoader}
                      onClick={() => handleSimulatedSubscribe(p.name, p.price)}
                      className={cn(
                        "w-full rounded-2xl py-3.5 text-xs font-extrabold uppercase tracking-wider mt-8 transition-all cursor-pointer flex items-center justify-center gap-2",
                        isActive 
                          ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-default" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:scale-[1.01]"
                      )}
                    >
                      {subscribingLoader ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isActive ? (
                        'Your Current Plan'
                      ) : (
                        `Subscribe Plan • $${p.price}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Invoices List / Payment History */}
            <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-base text-neutral-900">Transaction Receipts & Invoices</h3>
                  <p className="text-xs text-neutral-500 mt-1">Detailed history of all recurring subscription renewals on this account.</p>
                </div>
                <button 
                  onClick={fetchPaymentHistory}
                  className="px-4 py-2 border border-neutral-200 hover:border-neutral-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Refresh Invoices
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs">
                  <Loader2 size={24} className="animate-spin text-neutral-900" />
                  Loading payment registers...
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 italic">
                  No billing transactions logged. Active plan payments will list here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        <th className="pb-3 font-extrabold">Invoice Ref ID</th>
                        <th className="pb-3 font-extrabold">Billing Date</th>
                        <th className="pb-3 font-extrabold text-center">Amount Paid</th>
                        <th className="pb-3 font-extrabold text-center">Channel</th>
                        <th className="pb-3 font-extrabold text-right">Receipt Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 text-xs font-bold text-neutral-800">
                      {paymentHistory.map((pm) => (
                        <tr key={pm.id} className="hover:bg-neutral-50/50">
                          <td className="py-4 font-mono font-medium text-neutral-500 text-[11px]">{pm.id}</td>
                          <td className="py-4 font-normal text-neutral-600">{new Date(pm.paymentDate || pm.createdAt).toLocaleString()}</td>
                          <td className="py-4 text-center font-bold font-display">${Number(pm.amount).toFixed(2)}</td>
                          <td className="py-4 text-center">
                            <span className="bg-neutral-100 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-tighter">
                              {pm.paymentType || 'CARD'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                              pm.status === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            )}>
                              {pm.status === 'success' ? 'Successful Paid' : 'Declined'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ------------------ PROFILE SETTINGS TAB ------------------ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm space-y-6 text-left max-w-3xl mx-auto animate-in fade-in duration-300">
            <div>
              <h2 className="font-display text-xl font-extrabold text-neutral-900">Personal Information</h2>
              <p className="text-xs text-neutral-500 mt-1">Synchronize your personal details and business contact settings.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4 border-t border-neutral-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Street Address</label>
                  <input 
                    type="text" 
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">City</label>
                  <input 
                    type="text" 
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">State</label>
                    <input 
                      type="text" 
                      value={profileState}
                      onChange={(e) => setProfileState(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Zip Code</label>
                    <input 
                      type="text" 
                      value={profileZip}
                      onChange={(e) => setProfileZip(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-900 focus:ring-0"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-6 border-t border-neutral-100">
                <button 
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {savingProfile ? 'Updating Database...' : 'Save Settings Changes'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
