import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ClientInbox from '../components/ClientInbox';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, History, TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  Sparkles, FileText, UploadCloud, Smartphone, ShieldCheck, MessageSquare, 
  Send, Plus, RefreshCw, PenTool, CheckSquare, Award, ArrowUpRight, ArrowRight, ShieldAlert, Key, Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ClientDashboard() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // Sub-tabs for customer modules
  const [subTab, setSubTab] = useState<'credit' | 'funding' | 'launchpad' | 'documents' | 'chat' | 'security' | 'mobile'>('credit');

  // Multi-module business state managers
  const [creditInfo, setCreditInfo] = useState<any>({
    scoreExperian: 620,
    scoreEquifax: 598,
    scoreTransUnion: 615,
    itemsRemoved: 7,
    itemsRemaining: 11,
    fundingReadiness: 72,
    financialHealth: 68
  });

  // Simulator Sliders
  const [simCardPay, setSimCardPay] = useState(30); // card utilization (30% is ideal)
  const [simRemoveCollection, setSimRemoveCollection] = useState(false);
  const [simNewTradeline, setSimNewTradeline] = useState(false);
  const [simulatedScore, setSimulatedScore] = useState({ exp: 620, equ: 598, tra: 615 });

  // Document Vault & E-Sign
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [eSignName, setESignName] = useState('');
  const [eSignAgreementChecked, setESignAgreementChecked] = useState(false);
  const [eSignCompleted, setESignCompleted] = useState(false);

  // AI Credit Report Parsing
  const [selectedProvider, setSelectedProvider] = useState<'SmartCredit' | 'IdentityIQ' | 'PrivacyGuard' | 'MyScoreIQ'>('SmartCredit');
  const [reportText, setReportText] = useState('');
  const [parsingLoading, setParsingLoading] = useState(false);
  const [extractedNegativeItems, setExtractedNegativeItems] = useState<any[]>([]);
  const [reportAuditSummary, setReportAuditSummary] = useState('');

  // AI Dispute Letter Generator
  const [disputeLetters, setDisputeLetters] = useState<any[]>([]);
  const [bureau, setBureau] = useState('Experian');
  const [letterType, setLetterType] = useState('Bureau Dispute');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [disputeReason, setDisputeReason] = useState('Incorrect payment status and unverified balance.');
  const [letterGenerating, setLetterGenerating] = useState(false);
  const [lastGeneratedLetter, setLastGeneratedLetter] = useState<any>(null);

  // FTF AI Assistant Chat
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: 'assistant', content: "Hello! I am FTF AI, your private advisor. How can I help you optimize your credit repair, draft federal challenges, structure your business funding, or form your LLC today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Business Funding Module
  const [monthlyRevenue, setMonthlyRevenue] = useState('$15,000');
  const [timeInBusiness, setTimeInBusiness] = useState('1 Year');
  const [industry, setIndustry] = useState('E-commerce');
  const [fundingFico, setFundingFico] = useState('650');
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingResult, setFundingResult] = useState<any>(null);

  // Specialized Launchpads
  const [formationList, setFormationList] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [entityType, setEntityType] = useState('LLC');
  const [formationEIN, setFormationEIN] = useState(true);
  const [formationAgreement, setFormationAgreement] = useState(true);

  const [taxFilings, setTaxFilings] = useState<any[]>([]);
  const [taxYear, setTaxYear] = useState('2025');
  const [taxFormType, setTaxFormType] = useState('Form 1040 (Personal)');
  const [taxResolution, setTaxResolution] = useState('None');

  const [immigrationCases, setImmigrationCases] = useState<any[]>([]);
  const [immigrationType, setImmigrationType] = useState('I-130 family-based Petition');
  const [immigrationDeadline, setImmigrationDeadline] = useState('');

  // Enterprise Security
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [activeEncryptionLabel, setActiveEncryptionLabel] = useState('AES-256 Dynamic Server Key');

  // Live updates simulator sync
  useEffect(() => {
    if (user?.uid) {
      fetchCreditInfo();
      fetchDocuments();
      fetchDisputeLetters();
      fetchLaunchpadData();
    }
  }, [user?.uid]);

  // Recalculate Simulator Score
  useEffect(() => {
    let baseExp = creditInfo.scoreExperian;
    let baseEqu = creditInfo.scoreEquifax;
    let baseTra = creditInfo.scoreTransUnion;

    // Credit Card Utilization effect
    if (simCardPay < 30) {
      const bonus = Math.floor((30 - simCardPay) * 1.5);
      baseExp += bonus; baseEqu += bonus; baseTra += bonus;
    } else {
      const penalty = Math.floor((simCardPay - 30) * 1.2);
      baseExp -= penalty; baseEqu -= penalty; baseTra -= penalty;
    }

    // Removing Collection effect
    if (simRemoveCollection) {
      baseExp += 45; baseEqu += 40; baseTra += 48;
    }

    // New Tradeline effect
    if (simNewTradeline) {
      baseExp += 25; baseEqu += 20; baseTra += 22;
    }

    setSimulatedScore({
      exp: Math.min(850, Math.max(300, baseExp)),
      equ: Math.min(850, Math.max(300, baseEqu)),
      tra: Math.min(850, Math.max(300, baseTra))
    });
  }, [simCardPay, simRemoveCollection, simNewTradeline, creditInfo]);

  const fetchCreditInfo = async () => {
    try {
      const res = await fetch(`/api/client/credit-info?userId=${user?.uid}`);
      if (res.ok) setCreditInfo(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/client/documents?userId=${user?.uid}`);
      if (res.ok) setVaultDocs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDisputeLetters = async () => {
    try {
      const res = await fetch(`/api/client/dispute-letters?userId=${user?.uid}`);
      if (res.ok) setDisputeLetters(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLaunchpadData = async () => {
    try {
      const resForm = await fetch(`/api/client/formation-status?userId=${user?.uid}`);
      if (resForm.ok) setFormationList(await resForm.json());

      const resTaxes = await fetch(`/api/client/tax-filings?userId=${user?.uid}`);
      if (resTaxes.ok) setTaxFilings(await resTaxes.json());

      const resImm = await fetch(`/api/client/immigration-cases?userId=${user?.uid}`);
      if (resImm.ok) setImmigrationCases(await resImm.json());
    } catch (e) {
      console.error(e);
    }
  };

  const triggerUploadDoc = async (type: string, name: string) => {
    try {
      const res = await fetch('/api/client/upload-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, docType: type, fileName: name })
      });
      if (res.ok) {
        fetchDocuments();
        setUploadedCount(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEsign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eSignName || !eSignAgreementChecked) return;
    setESignCompleted(true);
    alert("Agreements e-signed successfully. Welcome onboard FTF America!");
  };

  const handleAiReportParse = async (e: React.FormEvent) => {
    e.preventDefault();
    setParsingLoading(true);
    try {
      const res = await fetch('/api/client/ai-import-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, provider: selectedProvider, rawText: reportText })
      });
      if (res.ok) {
        const data = await res.json();
        setExtractedNegativeItems(data.negativeItems || []);
        setReportAuditSummary(data.auditSummary || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setParsingLoading(false);
    }
  };

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountNumber) {
      alert("Please provide account name and number.");
      return;
    }
    setLetterGenerating(true);
    try {
      const res = await fetch('/api/client/generate-dispute-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          bureau,
          letterType,
          accountName,
          accountNumber,
          reason: disputeReason
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLastGeneratedLetter(data);
        fetchDisputeLetters();
        setAccountName('');
        setAccountNumber('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLetterGenerating(false);
    }
  };

  const handleFundingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundingLoading(true);
    try {
      const res = await fetch('/api/client/funding-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revenue: monthlyRevenue, timeInBusiness, industry, creditScore: fundingFico })
      });
      if (res.ok) {
        setFundingResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFundingLoading(false);
    }
  };

  const handleOrderFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;
    try {
      const res = await fetch('/api/client/order-formation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, entityType, companyName, hasEIN: formationEIN, hasOperatingAgreement: formationAgreement })
      });
      if (res.ok) {
        setCompanyName('');
        fetchLaunchpadData();
        alert("LLC / Entity Order Submitted to the Secretary of State!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaxUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/client/upload-tax-filing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, taxYear, formType: taxFormType, resolutionCase: taxResolution })
      });
      if (res.ok) {
        fetchLaunchpadData();
        alert("Tax forms successfully queued for processing!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImmigrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/client/upload-immigration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, caseType: immigrationType, nextDeadline: immigrationDeadline })
      });
      if (res.ok) {
        setImmigrationDeadline('');
        fetchLaunchpadData();
        alert("Immigration Form case cataloged for professional document preparation.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/client/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: chatHistory })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const getStepStatus = (stepIdx: number) => {
    const currentStep = user?.onboardingStep || 1;
    if (currentStep > stepIdx + 1) return 'completed';
    if (currentStep === stepIdx + 1) return 'in-progress';
    return 'pending';
  };

  const progressSteps = [
    { label: 'Analysis Phase', description: 'Our experts are analyzing your credit report.', icon: TrendingUp },
    { label: 'Dispute Letters', description: 'Crafting legal dispute letters for local and national bureaus.', icon: History },
    { label: 'Sent to Bureaus', description: 'Letters have been dispatched and we are awaiting confirmation.', icon: Clock },
    { label: 'Verifying Results', description: 'Reviewing responses from creditors and credit bureaus.', icon: AlertTriangle },
    { label: 'Project Completed', description: 'All goals have been successfully met. Project finalized.', icon: CheckCircle2 },
  ];

  return (
    <DashboardLayout>
      {activeTab === 'inbox' ? (
        <ClientInbox />
      ) : (
        <div className="space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
          
          {/* Header Dashboard section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-[32px] p-8 text-white shadow-xl">
            <div className="space-y-2">
              <span className="text-[10px] bg-neutral-700 px-3 py-1 rounded-full text-neutral-300 uppercase tracking-widest font-extrabold">All-In-One Client Hub</span>
              <h1 className="font-display text-4xl font-black tracking-tight mt-2">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
              <p className="text-neutral-300 text-sm max-w-xl">
                USA’s easiest interface for corporate LLC formation, credit analysis, automated dispute generation, personal/business funding access, IRS taxes, and USCIS cases.
              </p>
            </div>
            
            {/* Visual Progress Roadmap badge list */}
            <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4 border border-white/10">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Financial Health Score</div>
                <div className="text-3xl font-black font-display text-emerald-400">{creditInfo.financialHealth}/100</div>
              </div>
              <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award size={24} />
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap bg-neutral-100 rounded-3xl p-1.5 gap-1.5 border border-neutral-200 overflow-x-auto">
            <button 
              onClick={() => setSubTab('credit')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'credit' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <TrendingUp size={16} /> 📊 Credit Center
            </button>
            <button 
              onClick={() => setSubTab('funding')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'funding' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <CreditCard size={16} /> 💼 Business Funding
            </button>
            <button 
              onClick={() => setSubTab('launchpad')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'launchpad' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <Globe size={16} /> 🚀 USA Launchpad (LLC/Taxes)
            </button>
            <button 
              onClick={() => setSubTab('documents')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'documents' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <FileText size={16} /> 📄 Document Vault & Sign
            </button>
            <button 
              onClick={() => setSubTab('chat')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'chat' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <MessageSquare size={16} /> 💬 FTF AI Advisor
            </button>
            <button 
              onClick={() => setSubTab('security')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'security' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <ShieldCheck size={16} /> 🛡️ Enterprise Security
            </button>
            <button 
              onClick={() => setSubTab('mobile')}
              className={cn(
                "px-5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                subTab === 'mobile' ? "bg-white text-neutral-900 shadow-md scale-102" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <Smartphone size={16} /> 📱 Preview Mobile App
            </button>
          </div>

          {/* ======================= CREDIT CENTER ======================= */}
          {subTab === 'credit' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Credit Scores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Experian */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Experian Score</span>
                    <h3 className="text-4xl font-black font-display text-sky-600 mt-2">{creditInfo.scoreExperian}</h3>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-sky-500" style={{ width: `${(creditInfo.scoreExperian / 850) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 uppercase font-mono">Last refreshed: Live Sync</p>
                </div>

                {/* Equifax */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Equifax Score</span>
                    <h3 className="text-4xl font-black font-display text-red-600 mt-2">{creditInfo.scoreEquifax}</h3>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-red-500" style={{ width: `${(creditInfo.scoreEquifax / 850) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 uppercase font-mono">Last refreshed: Live Sync</p>
                </div>

                {/* TransUnion */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">TransUnion Score</span>
                    <h3 className="text-4xl font-black font-display text-emerald-600 mt-2">{creditInfo.scoreTransUnion}</h3>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-emerald-500" style={{ width: `${(creditInfo.scoreTransUnion / 850) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 uppercase font-mono">Last refreshed: Live Sync</p>
                </div>

              </div>

              {/* Items Status Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 flex justify-between items-center text-emerald-900">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-600">Disputed Negative Items Removed</p>
                    <p className="text-3xl font-black font-display mt-2">{creditInfo.itemsRemoved}</p>
                  </div>
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                
                <div className="bg-red-50 rounded-2xl border border-red-100 p-6 flex justify-between items-center text-red-900">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-red-600">Disputed Items Remaining</p>
                    <p className="text-3xl font-black font-display mt-2">{creditInfo.itemsRemaining}</p>
                  </div>
                  <AlertTriangle size={32} className="text-red-400" />
                </div>

                <div className="bg-purple-50 rounded-2xl border border-purple-100 p-6 flex justify-between items-center text-purple-900">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-purple-600">Funding Readiness Index</p>
                    <p className="text-3xl font-black font-display mt-2">{creditInfo.fundingReadiness}%</p>
                  </div>
                  <TrendingUp size={32} className="text-purple-500" />
                </div>
              </div>

              {/* Interactive Credit Simulator Panel */}
              <div className="bg-neutral-50 rounded-[32px] border border-neutral-150 p-8 space-y-6">
                <div>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-3 py-1 rounded-full font-bold uppercase">Phase 16: Dynamic Simulator</span>
                  <h3 className="font-display text-2xl font-black text-neutral-900 mt-3">Interactive Credit Simulator</h3>
                  <p className="text-xs text-neutral-500">Slide metrics to preview the immediate impact on Experian, Equifax, and TransUnion.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Sliders */}
                  <div className="space-y-6 bg-white rounded-2xl p-6 border border-neutral-100">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-700 mb-2">
                        <span>Revolving Credit Card Utilization</span>
                        <span className="text-sky-600">{simCardPay}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="95" 
                        value={simCardPay}
                        onChange={(e) => setSimCardPay(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <p className="text-[9px] text-neutral-400 mt-1">Paying down card usage below 30% boosts scores immediately.</p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">Remove 1 Negative Collection</span>
                        <span className="text-[9px] text-neutral-400">Deletes collections listed in bureau audit.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={simRemoveCollection}
                        onChange={(e) => setSimRemoveCollection(e.target.checked)}
                        className="size-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">Add 1 Primary positive Tradeline</span>
                        <span className="text-[9px] text-neutral-400">Adds an on-time primary trade line (e.g. self-lending).</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={simNewTradeline}
                        onChange={(e) => setSimNewTradeline(e.target.checked)}
                        className="size-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Right Column: Simulated Score Outputs */}
                  <div className="bg-neutral-900 rounded-2xl p-6 text-white flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm text-neutral-400">Simulated Outcome Projection</h4>
                      <p className="text-[10px] text-neutral-500 mt-1">These projected numbers show target goals after FCRA letter challenges.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-neutral-800 my-4">
                      <div className="text-center">
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Experian</div>
                        <div className="text-2xl font-black font-display text-sky-400 mt-1">{simulatedScore.exp}</div>
                      </div>
                      <div className="text-center border-x border-neutral-800">
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Equifax</div>
                        <div className="text-2xl font-black font-display text-red-400 mt-1">{simulatedScore.equ}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">TransUnion</div>
                        <div className="text-2xl font-black font-display text-emerald-400 mt-1">{simulatedScore.tra}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setCreditInfo({
                          ...creditInfo,
                          scoreExperian: simulatedScore.exp,
                          scoreEquifax: simulatedScore.equ,
                          scoreTransUnion: simulatedScore.tra,
                          financialHealth: Math.min(100, creditInfo.financialHealth + 12)
                        });
                        alert("Simulated scores synced to your active profile stats!");
                      }}
                      className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-bold py-3 text-white transition-all shadow-md"
                    >
                      Lock In Simulated Targets
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Report Import & OCR Auditing */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Raw report input */}
                <div className="lg:col-span-1 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 2: AI Report Import</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Provide credit reports below. Gemini AI automatically reads and processes collections, inquiries, and charge-offs.</p>
                  
                  <form onSubmit={handleAiReportParse} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Provider</label>
                      <select 
                        value={selectedProvider} 
                        onChange={(e: any) => setSelectedProvider(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold"
                      >
                        <option value="SmartCredit">SmartCredit</option>
                        <option value="IdentityIQ">IdentityIQ</option>
                        <option value="PrivacyGuard">PrivacyGuard</option>
                        <option value="MyScoreIQ">MyScoreIQ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Raw Credit Report Text</label>
                      <textarea 
                        rows={4}
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        placeholder="Paste credit report raw text or OCR chunk here..."
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={parsingLoading}
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3 transition-all flex items-center justify-center gap-2"
                    >
                      {parsingLoading ? <RefreshCw className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                      Parse with OCR AI Engine
                    </button>
                  </form>
                </div>

                {/* Right: Extracted Audited Negative Accounts (Phase 3) */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-6">
                  <div>
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 3: AI Credit Audit Result</h4>
                    <p className="text-xs text-neutral-500 mt-1">Identified negative accounts ready for dispute generation.</p>
                  </div>

                  {extractedNegativeItems.length === 0 ? (
                    <div className="p-10 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 text-center text-neutral-400 text-xs font-medium">
                      Paste a report to analyze or use standard pre-loaded accounts:
                      <button 
                        onClick={() => {
                          setExtractedNegativeItems([
                            { bureau: "Experian", item: "Capital One Charge-off", account: "CAP-0023", amount: "$1,450", reason: "Balance reporting incorrectly after discharge", strategy: "FCRA Section 611 validation dispute" },
                            { bureau: "TransUnion", item: "LVNV Funding Collection", account: "LVN-4911", amount: "$890", reason: "No original contract verifying debt assignment", strategy: "Debt verification notice + direct challenge" }
                          ]);
                          setReportAuditSummary("Pre-loaded audit summary completed. 2 challengeable accounts identified.");
                        }}
                        className="block mt-4 mx-auto text-xs font-bold text-neutral-900 underline"
                      >
                        Load Standard Sample Items
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reportAuditSummary && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 leading-relaxed font-medium">
                          <strong>Audit Verdict:</strong> {reportAuditSummary}
                        </div>
                      )}

                      <div className="space-y-3">
                        {extractedNegativeItems.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest",
                                  item.bureau === 'Experian' && "bg-sky-50 text-sky-600",
                                  item.bureau === 'Equifax' && "bg-red-50 text-red-600",
                                  item.bureau === 'TransUnion' && "bg-emerald-50 text-emerald-600"
                                )}>
                                  {item.bureau}
                                </span>
                                <span className="font-bold text-neutral-900">{item.item}</span>
                                <span className="text-neutral-400 font-mono">({item.account})</span>
                              </div>
                              <p className="text-neutral-500 mt-2"><strong>Reason to Challenge:</strong> {item.reason}</p>
                              <p className="text-neutral-400 text-[10px] mt-1"><strong>FCRA Strategy:</strong> {item.strategy}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-neutral-900 font-mono">{item.amount}</div>
                              <button 
                                onClick={() => {
                                  setBureau(item.bureau);
                                  setAccountName(item.item);
                                  setAccountNumber(item.account);
                                  setDisputeReason(item.reason);
                                  alert(`Loaded ${item.item} details into Phase 4 Dispute Letter Generator below!`);
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 text-neutral-900 font-bold hover:underline"
                              >
                                Create Dispute Letter <ArrowRight size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Automated dispute generator (Phase 4) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Dispute Form */}
                <div className="lg:col-span-1 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PenTool className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 4: Dispute Generator</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Generate legally sound FCRA challenge notices to credit bureaus and creditors instantly.</p>
                  
                  <form onSubmit={handleCreateLetter} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Target Recipient</label>
                      <select 
                        value={bureau} 
                        onChange={(e) => setBureau(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold"
                      >
                        <option value="Experian">Experian Bureau</option>
                        <option value="Equifax">Equifax Bureau</option>
                        <option value="TransUnion">TransUnion Bureau</option>
                        <option value="Creditor">Direct Furnishing Creditor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Letter Class</label>
                      <select 
                        value={letterType} 
                        onChange={(e) => setLetterType(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold"
                      >
                        <option value="Bureau Dispute">Federal Bureau Dispute (Round 1)</option>
                        <option value="Creditor Dispute">Creditor Direct Challenge</option>
                        <option value="Debt Validation">Debt Validation Notice (FDCPA)</option>
                        <option value="CFPB Complaint">CFPB Federal Portal Complaint</option>
                        <option value="FTC Complaint">FTC Identity Theft Report</option>
                        <option value="Method of Verification">Method of Verification Request</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Account/Furnisher Name</label>
                      <input 
                        type="text" 
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="e.g. Capital One Bank"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Account Number</label>
                      <input 
                        type="text" 
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. CAP-0023"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Specific Challenge Reason</label>
                      <textarea 
                        rows={2}
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="e.g. Balances incorrectly verified post bankruptcy."
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={letterGenerating}
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3 transition-all flex items-center justify-center gap-2"
                    >
                      {letterGenerating ? <RefreshCw className="animate-spin" size={14} /> : <PenTool size={14} />}
                      Generate Dispute Letter
                    </button>
                  </form>
                </div>

                {/* Right: Generated Letter Preview & History */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-6">
                  <div>
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Active Challenge Letters Inbox ({disputeLetters.length})</h4>
                    <p className="text-xs text-neutral-500 mt-1">Export, review, or print your generated compliance letters.</p>
                  </div>

                  {disputeLetters.length === 0 && !lastGeneratedLetter ? (
                    <div className="p-12 border border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl text-center text-neutral-400 text-xs font-medium">
                      No dispute notices generated yet. Build your first letter using the generator form.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Last Generated Preview */}
                      {(lastGeneratedLetter || disputeLetters[0]) && (
                        <div className="p-6 bg-neutral-900 rounded-2xl text-white space-y-4">
                          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                            <div>
                              <span className="text-[10px] bg-neutral-800 px-3 py-1 rounded text-neutral-300 font-mono uppercase">Preview Draft</span>
                              <h5 className="font-display font-bold text-sm mt-1">Draft for {(lastGeneratedLetter || disputeLetters[0]).bureau}</h5>
                            </div>
                            <button 
                              onClick={() => {
                                const text = (lastGeneratedLetter || disputeLetters[0]).content;
                                navigator.clipboard.writeText(text);
                                alert("Letter content copied to your clipboard!");
                              }}
                              className="text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded transition-all"
                            >
                              Copy Content
                            </button>
                          </div>
                          <pre className="font-mono text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 text-neutral-300">
                            {(lastGeneratedLetter || disputeLetters[0]).content}
                          </pre>
                        </div>
                      )}

                      {/* Letter Queue Table */}
                      <div className="space-y-2">
                        <h5 className="font-display font-bold text-neutral-800 text-xs">Mailing Dispatch Queue</h5>
                        <div className="space-y-2">
                          {disputeLetters.map((letter) => (
                            <div key={letter.id} className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-neutral-900">{letter.bureau} Letter</span>
                                <span className="text-neutral-400 font-mono ml-2">({letter.letterType})</span>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold text-blue-600 uppercase tracking-widest">
                                ● {letter.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ======================= BUSINESS FUNDING ======================= */}
          {subTab === 'funding' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Funding Eligibility Form (Phase 9) */}
                <div className="lg:col-span-1 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 9: Business Funding</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Provide company cashflow information below. FTF AI analyzes eligibility for SBA, Term Loans, and MCAs instantly.</p>
                  
                  <form onSubmit={handleFundingSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Monthly Cashflow Revenue</label>
                      <input 
                        type="text" 
                        required
                        value={monthlyRevenue}
                        onChange={(e) => setMonthlyRevenue(e.target.value)}
                        placeholder="e.g. $15,000"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold text-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Time in Business</label>
                      <input 
                        type="text" 
                        required
                        value={timeInBusiness}
                        onChange={(e) => setTimeInBusiness(e.target.value)}
                        placeholder="e.g. 1 Year"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold text-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Primary Industry</label>
                      <input 
                        type="text" 
                        required
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. E-commerce"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold text-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Owner FICO Score</label>
                      <input 
                        type="number" 
                        required
                        value={fundingFico}
                        onChange={(e) => setFundingFico(e.target.value)}
                        placeholder="e.g. 650"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold text-neutral-800"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={fundingLoading}
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3 transition-all flex items-center justify-center gap-2"
                    >
                      {fundingLoading ? <RefreshCw className="animate-spin" size={14} /> : <TrendingUp size={14} />}
                      Analyze Funding Eligibility
                    </button>
                  </form>
                </div>

                {/* Right: Matches Eligibility Results */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-6">
                  <div>
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Matched Capital Funding Programs</h4>
                    <p className="text-xs text-neutral-500 mt-1">Real-time lending analysis based on underwriting rules.</p>
                  </div>

                  {!fundingResult ? (
                    <div className="p-12 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 text-center text-neutral-400 text-xs font-medium">
                      Submit cashflow metrics to run underwriting analysis.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                        <span><strong>Eligibility Confidence:</strong> APPROVED</span>
                        <span className="font-mono font-bold">{fundingResult.score}% rating</span>
                      </div>

                      <div className="space-y-4">
                        {(fundingResult.programs || []).map((prog: any, idx: number) => (
                          <div key={idx} className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-neutral-900 text-sm">{prog.name}</h5>
                                <span className="text-[10px] text-neutral-400">Plausible lenders: {prog.lenders}</span>
                              </div>
                              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black font-mono">{prog.estimate}</span>
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed">{prog.details}</p>
                            <div className="text-[10px] text-neutral-400">Approval Odds: <strong className="text-emerald-600">{prog.odds}</strong></div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-150 text-xs text-neutral-700 leading-relaxed font-medium">
                        <strong>Advisor Recommendation:</strong> {fundingResult.advice}
                      </div>

                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ======================= USA LAUNCHPAD ======================= */}
          {subTab === 'launchpad' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LLC Business Formation (Phase 10) */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 10: LLC Formation</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Form a secure entity in any of the 50 American states directly.</p>
                  
                  <form onSubmit={handleOrderFormation} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Company Legal Name</label>
                      <input 
                        type="text" 
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Tech LLC"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Entity Class</label>
                      <select 
                        value={entityType} 
                        onChange={(e) => setEntityType(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold"
                      >
                        <option value="LLC">Limited Liability Company (LLC)</option>
                        <option value="S-Corp">S-Corporation</option>
                        <option value="C-Corp">C-Corporation</option>
                        <option value="Non-profit">Non-Profit Organization</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Include Federal EIN Tax ID</span>
                        <input 
                          type="checkbox" 
                          checked={formationEIN} 
                          onChange={(e) => setFormationEIN(e.target.checked)}
                          className="size-4"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Operating Agreement & Bylaws</span>
                        <input 
                          type="checkbox" 
                          checked={formationAgreement} 
                          onChange={(e) => setFormationAgreement(e.target.checked)}
                          className="size-4"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3 transition-all"
                    >
                      File Entity with State
                    </button>
                  </form>

                  {/* Entity History */}
                  <div className="space-y-2 pt-4 border-t border-neutral-100 text-xs">
                    <span className="font-bold text-neutral-800 block">Formation Catalog</span>
                    {formationList.length === 0 ? (
                      <span className="text-neutral-400 italic">No business entities filed yet.</span>
                    ) : (
                      <div className="space-y-1">
                        {formationList.map((f) => (
                          <div key={f.id} className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                            <span className="font-bold">{f.companyName}</span>
                            <span className="text-[10px] uppercase font-bold text-amber-600">{f.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Service Center (Phase 11) */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 11: Tax filings</h4>
                  </div>
                  <p className="text-xs text-neutral-500">File personal/corporate tax returns and register IRS Audit cases.</p>
                  
                  <form onSubmit={handleTaxUpload} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Tax Filing Year</label>
                      <input 
                        type="text" 
                        required
                        value={taxYear}
                        onChange={(e) => setTaxYear(e.target.value)}
                        placeholder="e.g. 2025"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Form Selection</label>
                      <select 
                        value={taxFormType} 
                        onChange={(e) => setTaxFormType(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold"
                      >
                        <option value="Form 1040 (Personal)">Form 1040 (Personal Return)</option>
                        <option value="Form 1120S (S-Corp)">Form 1120S (S-Corp Corporate Return)</option>
                        <option value="Form 1065 (Partnership)">Form 1065 (Partnership)</option>
                        <option value="IRS Audit Resolution">IRS Resolution & Audit Defense</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">IRS Case Resolution Type</label>
                      <input 
                        type="text" 
                        value={taxResolution}
                        onChange={(e) => setTaxResolution(e.target.value)}
                        placeholder="Offer in Compromise, Back Tax Debt, None"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3 transition-all"
                    >
                      Queue IRS Tax documents
                    </button>
                  </form>

                  {/* Tax History */}
                  <div className="space-y-2 pt-4 border-t border-neutral-100 text-xs">
                    <span className="font-bold text-neutral-800 block">Filing History</span>
                    {taxFilings.length === 0 ? (
                      <span className="text-neutral-400 italic">No tax returns queued yet.</span>
                    ) : (
                      <div className="space-y-1">
                        {taxFilings.map((t) => (
                          <div key={t.id} className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                            <span className="font-bold">{t.formType} ({t.taxYear})</span>
                            <span className="text-[10px] uppercase font-bold text-emerald-600">{t.refundStatus}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Immigration Center (Phase 12) */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 12: Immigration Cases</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Submit USCIS family, citizenship, work, and passport cases safely.</p>
                  
                  <form onSubmit={handleImmigrationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">USCIS Form Class</label>
                      <select 
                        value={immigrationType} 
                        onChange={(e) => setImmigrationType(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold"
                      >
                        <option value="I-130 family-based Petition">I-130 Family-Based Petition</option>
                        <option value="N-400 Naturalization/Citizenship">N-400 Naturalization/Citizenship</option>
                        <option value="I-765 Work Authorization">I-765 Work Authorization</option>
                        <option value="US Passport Expedited Renewal">US Passport Expedited Renewal</option>
                        <option value="I-485 Adjustment of Status">I-485 Adjustment of Status</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">Target Interview/Action Deadline</label>
                      <input 
                        type="date" 
                        value={immigrationDeadline}
                        onChange={(e) => setImmigrationDeadline(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900 font-bold text-neutral-800"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3 transition-all"
                    >
                      Initialize USCIS Case File
                    </button>
                  </form>

                  {/* Immigration History */}
                  <div className="space-y-2 pt-4 border-t border-neutral-100 text-xs">
                    <span className="font-bold text-neutral-800 block">USCIS Tracking</span>
                    {immigrationCases.length === 0 ? (
                      <span className="text-neutral-400 italic">No USCIS cases filed yet.</span>
                    ) : (
                      <div className="space-y-1">
                        {immigrationCases.map((i) => (
                          <div key={i.id} className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                            <span className="font-bold truncate max-w-[140px]">{i.caseType}</span>
                            <span className="text-[10px] uppercase font-bold text-indigo-600">{i.uscisStatus}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================= DOCUMENT VAULT & SIGN ======================= */}
          {subTab === 'documents' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Onboarding uploads (Phase 1) */}
                <div className="lg:col-span-1 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UploadCloud className="text-neutral-900" size={20} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 1: Compliance Uploads</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Upload mandatory verification documents to start legal challenges immediately.</p>
                  
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">1. Government Photo ID</span>
                        <span className="text-[10px] text-neutral-400">Driver's License or US Passport</span>
                      </div>
                      <button 
                        onClick={() => triggerUploadDoc('Government ID', 'driver_license.jpg')}
                        className="rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-[10px] font-bold"
                      >
                        Upload file
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">2. Social Security Card</span>
                        <span className="text-[10px] text-neutral-400">Required for direct credit bureau matching</span>
                      </div>
                      <button 
                        onClick={() => triggerUploadDoc('SSN Card', 'ssn_card.pdf')}
                        className="rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-[10px] font-bold"
                      >
                        Upload file
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">3. Utility Bill</span>
                        <span className="text-[10px] text-neutral-400">Utility or bank statement (proof of address)</span>
                      </div>
                      <button 
                        onClick={() => triggerUploadDoc('Utility Bill', 'utility_bill_jan.png')}
                        className="rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-[10px] font-bold"
                      >
                        Upload file
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: E-Sign agreements & Vault History */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-6">
                  
                  {/* Digital Contract E-Sign Panel */}
                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-150 text-xs text-neutral-700 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PenTool className="text-neutral-900" size={16} />
                      <strong className="font-display font-extrabold text-neutral-900 text-sm">Mandatory E-Sign Agreement</strong>
                    </div>
                    
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 max-h-36 overflow-y-auto leading-relaxed text-[11px] text-neutral-500 font-medium">
                      <p className="font-bold text-neutral-800 mb-1">FTF AMERICA RETAINER AGREEMENT & POWER OF ATTORNEY</p>
                      <p className="mb-2">I hereby appoint FTF America as my legal attorney-in-fact to issue disputes under FCRA Section 611 and FDCPA standards to Experian, Equifax, TransUnion, and all relevant trade-line creditors on my behalf.</p>
                      <p className="mb-2"><strong>Services Included:</strong> Professional Credit Report Analysis, AI Dispute Letter drafts, LLC filing preparation, IRS tax organization, and USCIS file reviews.</p>
                    </div>

                    {eSignCompleted ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} /> RETAINER AGREEMENT SUCCESSFULLY SIGNED & VERIFIED ON {new Date().toLocaleDateString()}
                      </div>
                    ) : (
                      <form onSubmit={handleEsign} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="agree"
                            checked={eSignAgreementChecked} 
                            onChange={(e) => setESignAgreementChecked(e.target.checked)}
                            className="size-4 rounded cursor-pointer"
                          />
                          <label htmlFor="agree" className="cursor-pointer font-bold select-none text-[11px] text-neutral-600">I agree to the electronic Power of Attorney and retainer terms.</label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input 
                            type="text" 
                            required
                            placeholder="Type your Full Name to sign (e.g. John Doe)" 
                            value={eSignName}
                            onChange={(e) => setESignName(e.target.value)}
                            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs outline-none focus:border-neutral-900"
                          />
                          <button 
                            type="submit" 
                            className="rounded-xl bg-neutral-900 hover:bg-neutral-800 px-6 py-3 font-bold text-white text-xs transition-all shadow"
                          >
                            Sign Retainer Agreement
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Document Vault history */}
                  <div className="space-y-4">
                    <h5 className="font-display font-bold text-neutral-800 text-xs">Your Secure Document Vault ({vaultDocs.length})</h5>
                    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50/50">
                      <table className="w-full text-left text-xs text-neutral-600">
                        <thead className="bg-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                          <tr>
                            <th className="px-6 py-3">Document Class</th>
                            <th className="px-6 py-3">File Name</th>
                            <th className="px-6 py-3">Security Audits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {vaultDocs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-6 text-center text-neutral-400">Vault is empty. Click compliance upload to add.</td>
                            </tr>
                          ) : (
                            vaultDocs.map((doc: any) => (
                              <tr key={doc.id}>
                                <td className="px-6 py-3 font-bold text-neutral-900">{doc.docType}</td>
                                <td className="px-6 py-3 font-mono text-neutral-400">{doc.fileName}</td>
                                <td className="px-6 py-3">
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                                    ● {doc.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ======================= FTF AI ASSISTANT CHAT ======================= */}
          {subTab === 'chat' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-neutral-900 rounded-xl text-white flex items-center justify-center font-bold">FTF</div>
                    <div>
                      <h4 className="font-display font-extrabold text-neutral-900 text-sm">FTF Private AI Assistant (Phase 5)</h4>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Secure Gemini Engine</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                    ● Private Connection Active
                  </span>
                </div>

                {/* Chat window body */}
                <div className="h-96 overflow-y-auto border border-neutral-100 rounded-2xl p-6 bg-neutral-50/50 space-y-4">
                  {chatHistory.map((h, i) => (
                    <div key={i} className={cn(
                      "flex gap-3 max-w-xl text-xs leading-relaxed",
                      h.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center font-bold shrink-0 text-[10px]",
                        h.role === 'user' ? "bg-sky-500 text-white" : "bg-neutral-900 text-white"
                      )}>
                        {h.role === 'user' ? 'Me' : 'AI'}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm text-neutral-800",
                        h.role === 'user' ? "bg-sky-500 text-white" : "bg-white border border-neutral-100"
                      )}>
                        {h.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3 max-w-xl text-xs mr-auto animate-pulse">
                      <div className="size-8 rounded-lg bg-neutral-200 shrink-0"></div>
                      <div className="p-4 rounded-2xl bg-neutral-100 text-neutral-400">FTF AI is reading credit codes...</div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about bankruptcy validation, LLC operating structures, tax write-offs, or funding metrics..."
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs outline-none focus:border-neutral-900"
                    required
                  />
                  <button 
                    type="submit"
                    className="rounded-xl bg-neutral-900 hover:bg-neutral-800 px-6 font-bold text-white text-xs transition-all flex items-center gap-1"
                  >
                    Send <Send size={12} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ======================= ENTERPRISE SECURITY ======================= */}
          {subTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300 text-left">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visual Lock/Metrics */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">Phase 14: Safety Core</h4>
                  </div>
                  <p className="text-xs text-neutral-500">Every connection, document, and dispute is protected by bank-level standards.</p>
                  
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>Encryption Protocol</span>
                      <strong className="text-emerald-600 font-mono">AES-256 GCM</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Server Key Lifecycle</span>
                      <strong className="text-neutral-500 font-mono">12-Hour Rotate</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Compliance Standards</span>
                      <strong className="text-neutral-500 font-mono">FTC / GLBA Compliant</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[10px] text-neutral-400">Require secure OTP for credit reports.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={mfaEnabled}
                      onChange={(e) => setMfaEnabled(e.target.checked)}
                      className="size-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Audit logs of recent sessions */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-display font-extrabold text-neutral-900 text-sm">IP & Device Audit Trail</h4>
                    <p className="text-xs text-neutral-500 mt-1">Audit active session entries to protect client confidentiality.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-neutral-900 block">Chrome on Linux (Active Session)</strong>
                        <span className="text-neutral-400 font-mono">IP: 198.162.0.41 • New York, US</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 font-mono font-bold px-2 py-0.5 rounded text-[10px]">CURRENT</span>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-neutral-900 block">Safari on Apple iPhone</strong>
                        <span className="text-neutral-400 font-mono">IP: 172.56.21.90 • Florida, US</span>
                      </div>
                      <button 
                        onClick={() => alert("Successfully revoked mobile viewport session token.")}
                        className="font-bold text-neutral-900 hover:underline text-[11px]"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================= SMARTPHONE MOBILE PREVIEW ======================= */}
          {subTab === 'mobile' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center flex flex-col items-center justify-center">
              <div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold uppercase">Phase 13: Client Mobile App</span>
                <h3 className="font-display text-2xl font-black text-neutral-900 mt-3">Interactive Mobile Viewport</h3>
                <p className="text-xs text-neutral-500">Preview exactly how the FTF client experience renders on native iOS/Android screens.</p>
              </div>

              {/* iPhone Mock Wrapper */}
              <div className="w-80 h-[600px] bg-neutral-900 rounded-[48px] border-8 border-neutral-800 shadow-2xl relative overflow-hidden text-left flex flex-col justify-between p-4 ring-12 ring-neutral-950">
                {/* Dynamic notch bar */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-neutral-800 rounded-full flex items-center justify-between px-4 text-white text-[8px] font-mono">
                  <span>9:41</span>
                  <div className="w-3.5 h-1.5 bg-neutral-500 rounded"></div>
                </div>

                {/* iPhone Body viewport */}
                <div className="bg-white h-full w-full rounded-[36px] overflow-hidden flex flex-col justify-between pt-6 pb-2 text-neutral-800">
                  <div className="px-5 space-y-4">
                    {/* Tiny header */}
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">FTF Mobile</span>
                        <span className="font-display font-bold text-xs">Aesthetic Slate App</span>
                      </div>
                      <div className="size-6 bg-neutral-900 rounded-full text-white flex items-center justify-center font-bold text-[8px]">FT</div>
                    </div>

                    {/* Miniature score grid */}
                    <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-2">
                      <span className="text-[8px] uppercase font-bold text-neutral-400">Experian Score</span>
                      <div className="flex justify-between items-baseline">
                        <strong className="text-sky-600 font-display text-xl font-black">{creditInfo.scoreExperian}</strong>
                        <span className="text-[8px] text-emerald-500 font-bold">Excellent range</span>
                      </div>
                      <div className="h-1 w-full bg-neutral-200 rounded-full">
                        <div className="h-full bg-sky-500" style={{ width: '74%' }}></div>
                      </div>
                    </div>

                    {/* Road status micro progress */}
                    <div className="space-y-2">
                      <span className="text-[8px] uppercase font-bold text-neutral-400">Mission roadmap step</span>
                      <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-900 leading-none">Completed Onboarding retainer.</span>
                      </div>
                    </div>

                    {/* Short micro assistant chat */}
                    <div className="bg-neutral-50 p-2.5 rounded-2xl border border-neutral-100 space-y-2">
                      <span className="text-[8px] uppercase font-bold text-neutral-400">Ask FTF Mobile AI</span>
                      <div className="text-[9px] bg-white border border-neutral-100 rounded-lg p-2 leading-relaxed text-neutral-600">
                        "Your Experian legal dispute letter is prepared."
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pt-2 border-t border-neutral-100 text-center">
                    <span className="text-[8px] text-neutral-400 uppercase font-bold tracking-widest">● Secure iOS Sandbox active</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Existing Roadmap Visual Timeline */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 pt-8 border-t border-neutral-100">
            {/* Progress Tracking */}
            <div className="lg:col-span-2 rounded-[32px] border border-neutral-100 bg-white p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp size={120} />
              </div>
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-display text-2xl font-bold text-neutral-900">Mission Roadmap</h3>
                <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[10px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-tighter">Live Updates</span>
              </div>
              <div className="space-y-10 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-1 before:bg-neutral-50">
                {progressSteps.map((step, idx) => {
                  const status = getStepStatus(idx);
                  return (
                    <div key={step.label} className="relative flex items-start gap-8 pl-12 group">
                      <div className={cn(
                        "absolute left-0 top-1 size-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-500 z-10",
                        status === 'completed' ? "bg-emerald-500 scale-110" : 
                        status === 'in-progress' ? "bg-amber-500 scale-125 ring-4 ring-amber-50" : "bg-neutral-100"
                      )}>
                        {status === 'completed' ? <CheckCircle2 size={16} className="text-white" /> : 
                         status === 'in-progress' ? <Clock size={16} className="text-white animate-pulse" /> : <div className="size-2 bg-neutral-300 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col">
                          <h4 className={cn("text-lg font-bold transition-colors", status === 'pending' ? "text-neutral-400" : "text-neutral-900")}>
                            {step.label}
                          </h4>
                          <p className="text-sm text-neutral-500 mt-1 max-w-md leading-relaxed">
                            {status === 'completed' ? 'This stage is completed. All goals met.' : 
                             status === 'in-progress' ? step.description : 
                             'Unlock this stage by completing previous milestones.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-6">
              <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm">
                <h3 className="font-display text-lg font-bold text-neutral-900 mb-6">Service Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-bold text-emerald-900 uppercase">Payment Sync</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                     <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-neutral-300"></div>
                      <span className="text-xs font-bold text-neutral-900 uppercase">Credit Refresh</span>
                    </div>
                    <span className="text-[10px] font-black text-neutral-400 italic">30D CYCLE</span>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 rounded-2xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all">
                  Request Mid-Cycle Update
                </button>
              </div>

              <div className="rounded-[32px] border-2 border-dashed border-neutral-100 bg-neutral-50/30 p-8 flex flex-col items-center text-center">
                  <div className="size-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                    <AlertTriangle className="text-amber-500" size={20} />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-500 leading-relaxed uppercase tracking-wider">Need Professional Assistance?</p>
                  <p className="text-xs text-neutral-400 mt-2">Connect with your assigned legal expert for a private strategy session.</p>
                  <button 
                    onClick={() => setSearchParams({ tab: 'inbox' })}
                    className="mt-6 text-sm font-bold text-neutral-900 underline underline-offset-8 decoration-2 decoration-neutral-200 hover:decoration-neutral-900 transition-all"
                  >
                    Open Direct Channel
                  </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
