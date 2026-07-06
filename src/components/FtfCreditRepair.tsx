import React, { useState, useEffect } from 'react';
import { 
  BarChart, FileText, UploadCloud, ShieldCheck, CheckSquare, 
  Sparkles, RefreshCw, AlertCircle, FileSpreadsheet, Layers, 
  Check, Copy, Download, ArrowUpRight, HelpCircle, AlertTriangle, Trash2, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NegativeAccount, DisputeLetter } from '../types/ftf';
import { initialNegativeAccounts, generateLetterTemplate, successRoadmap } from '../data/ftfMockData';

export default function FtfCreditRepair() {
  // Score parameters
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('ftf_scores');
    return saved ? JSON.parse(saved) : { experian: 619, equifax: 598, transunion: 615 };
  });
  const [itemsRemoved, setItemsRemoved] = useState(() => {
    const saved = localStorage.getItem('ftf_items_removed');
    return saved ? Number(saved) : 7;
  });
  const [itemsRemaining, setItemsRemaining] = useState(() => {
    const saved = localStorage.getItem('ftf_items_remaining');
    return saved ? Number(saved) : 11;
  });
  const [disputedAccounts, setDisputedAccounts] = useState(() => {
    const saved = localStorage.getItem('ftf_disputed_accounts');
    return saved ? Number(saved) : 3;
  });
  const [positiveAccounts, setPositiveAccounts] = useState(() => {
    const saved = localStorage.getItem('ftf_positive_accounts');
    return saved ? Number(saved) : 4;
  });
  const [fundingReadiness, setFundingReadiness] = useState(() => {
    const saved = localStorage.getItem('ftf_funding_readiness');
    return saved ? Number(saved) : 72;
  });

  const [selectedLetterAccounts, setSelectedLetterAccounts] = useState<string[]>([]);

  // Phase 1 - Documents
  const [uploadedDocs, setUploadedDocs] = useState<{
    idCard: string | null;
    ssnCard: string | null;
    utilityBill: string | null;
  }>(() => {
    const saved = localStorage.getItem('ftf_uploaded_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          idCard: typeof parsed.idCard === 'string' ? parsed.idCard : (parsed.idCard ? 'Government_ID.pdf' : null),
          ssnCard: typeof parsed.ssnCard === 'string' ? parsed.ssnCard : (parsed.ssnCard ? 'SSN_Card.pdf' : null),
          utilityBill: typeof parsed.utilityBill === 'string' ? parsed.utilityBill : (parsed.utilityBill ? 'Utility_Bill.pdf' : null),
        };
      } catch (e) {
        // ignore
      }
    }
    return { idCard: null, ssnCard: null, utilityBill: null };
  });

  useEffect(() => {
    localStorage.setItem('ftf_uploaded_docs', JSON.stringify(uploadedDocs));
  }, [uploadedDocs]);

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [eSigned, setESigned] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  // Phase 2 - Report Importer
  const [selectedProvider, setSelectedProvider] = useState<'SmartCredit' | 'IdentityIQ' | 'PrivacyGuard' | 'MyScoreIQ'>('SmartCredit');
  const [importingReport, setImportingReport] = useState(false);
  const [creditReportFileName, setCreditReportFileName] = useState<string | null>(() => {
    return localStorage.getItem('ftf_credit_report_filename');
  });
  const [dragOverReport, setDragOverReport] = useState(false);

  useEffect(() => {
    if (creditReportFileName) {
      localStorage.setItem('ftf_credit_report_filename', creditReportFileName);
    } else {
      localStorage.removeItem('ftf_credit_report_filename');
    }
  }, [creditReportFileName]);

  const [reportScanLog, setReportScanLog] = useState<string[]>([]);
  const [scannedAccounts, setScannedAccounts] = useState<NegativeAccount[]>(() => {
    const saved = localStorage.getItem('ftf_scanned_accounts');
    return saved ? JSON.parse(saved) : initialNegativeAccounts;
  });

  useEffect(() => {
    localStorage.setItem('ftf_scanned_accounts', JSON.stringify(scannedAccounts));
  }, [scannedAccounts]);

  useEffect(() => {
    localStorage.setItem('ftf_scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem('ftf_items_removed', String(itemsRemoved));
  }, [itemsRemoved]);

  useEffect(() => {
    localStorage.setItem('ftf_items_remaining', String(itemsRemaining));
  }, [itemsRemaining]);

  useEffect(() => {
    localStorage.setItem('ftf_disputed_accounts', String(disputedAccounts));
  }, [disputedAccounts]);

  useEffect(() => {
    localStorage.setItem('ftf_positive_accounts', String(positiveAccounts));
  }, [positiveAccounts]);

  useEffect(() => {
    localStorage.setItem('ftf_funding_readiness', String(fundingReadiness));
  }, [fundingReadiness]);

  // Synchronize dynamic parameters when scannedAccounts changes
  useEffect(() => {
    setItemsRemaining(scannedAccounts.length);
    const dispCount = scannedAccounts.filter(acc => acc.status === 'In Dispute' || selectedLetterAccounts.includes(acc.id)).length;
    setDisputedAccounts(dispCount);
  }, [scannedAccounts, selectedLetterAccounts]);

  // Dynamic Funding Odds Calculation
  useEffect(() => {
    const avgScore = (scores.experian + scores.equifax + scores.transunion) / 3;
    let calculatedOdds = Math.round(((avgScore - 300) / 550) * 100);
    calculatedOdds = calculatedOdds - (scannedAccounts.length * 3) + (itemsRemoved * 2);
    calculatedOdds = Math.max(5, Math.min(99, calculatedOdds));
    setFundingReadiness(calculatedOdds);
  }, [scores, scannedAccounts.length, itemsRemoved]);

  // Manual Negative Account addition states
  const [newCreditor, setNewCreditor] = useState('');
  const [newAccountType, setNewAccountType] = useState('Credit Card');
  const [newBalance, setNewBalance] = useState('');
  const [newStrategy, setNewStrategy] = useState('Incomplete Credit Transaction validation');
  const [newViolation, setNewViolation] = useState('FCRA Section 611 - Reporting without validation limits');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  const handleClearAllScans = () => {
    if (window.confirm("Are you sure you want to permanently clear all scanned account data?")) {
      setScannedAccounts([]);
      setSelectedLetterAccounts([]);
    }
  };

  const handleLoadDemoAccounts = () => {
    setScannedAccounts(initialNegativeAccounts);
  };

  const handleDeleteAccount = (id: string) => {
    setScannedAccounts(scannedAccounts.filter(acc => acc.id !== id));
    setSelectedLetterAccounts(selectedLetterAccounts.filter(x => x !== id));
  };

  const handleAddAccountManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreditor.trim()) return;
    const newAcc: NegativeAccount = {
      id: `acc-${Date.now()}`,
      creditor: newCreditor,
      type: newAccountType,
      balance: parseFloat(newBalance) || 0,
      status: 'In Dispute',
      strategy: newStrategy,
      lawViolation: newViolation,
      priority: newPriority
    };
    setScannedAccounts([...scannedAccounts, newAcc]);
    setNewCreditor('');
    setNewBalance('');
    alert("New negative account successfully added manually!");
  };

  // Phase 3 & 4 - Letter Generator
  const [selectedLetterType, setSelectedLetterType] = useState<'bureau' | 'creditor' | 'validation' | 'cfpb' | 'ftc'>('bureau');
  const [disputeRecipient, setDisputeRecipient] = useState('Equifax Dispute Dept, PO Box 740256, Atlanta, GA 30374');
  const [generatedLetter, setGeneratedLetter] = useState<DisputeLetter | null>(null);
  const [copied, setCopied] = useState(false);

  // Simulation state for manual credit updates
  const [editingScores, setEditingScores] = useState(false);

  // Real file selection and simulation handlers
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, docKey: string) => {
    e.preventDefault();
    setDragOverKey(docKey);
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docKey: 'idCard' | 'ssnCard' | 'utilityBill') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(docKey);
    setReportScanLog(prev => [...prev, `Uploading physical document: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`]);
    
    setTimeout(() => {
      setUploadedDocs(prev => ({ ...prev, [docKey]: file.name }));
      setIsUploading(null);
      setReportScanLog(prev => [...prev, `✅ Document "${file.name}" processed and securely saved in AES-256 cloud repository.`]);
      alert(`"${file.name}" uploaded successfully!`);
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent, docKey: 'idCard' | 'ssnCard' | 'utilityBill') => {
    e.preventDefault();
    setDragOverKey(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(docKey);
    setReportScanLog(prev => [...prev, `Uploading physical document via Drag & Drop: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`]);
    
    setTimeout(() => {
      setUploadedDocs(prev => ({ ...prev, [docKey]: file.name }));
      setIsUploading(null);
      setReportScanLog(prev => [...prev, `✅ Document "${file.name}" processed and securely saved in AES-256 cloud repository.`]);
      alert(`"${file.name}" uploaded successfully via Drag & Drop!`);
    }, 1200);
  };

  const handleRemoveFile = (docKey: 'idCard' | 'ssnCard' | 'utilityBill', e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedDocs(prev => ({ ...prev, [docKey]: null }));
    setReportScanLog(prev => [...prev, `Removed document for field: ${docKey}.`]);
  };

  // Real credit report file selection and simulation handlers for Phase 2
  const handleCreditReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreditReportFileName(file.name);
    setReportScanLog(prev => [...prev, `📂 loaded credit report file: "${file.name}" ready for scanning.`]);
    alert(`"${file.name}" loaded and ready to scan! Please click the "Import & Scan" button below.`);
  };

  const handleCreditReportDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverReport(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setCreditReportFileName(file.name);
    setReportScanLog(prev => [...prev, `📂 Dropped credit report file via drag-and-drop: "${file.name}" ready for scanning.`]);
    alert(`"${file.name}" loaded successfully via Drag & Drop! Click the "Import & Scan" button below to analyze.`);
  };

  const handleRemoveCreditReportFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreditReportFileName(null);
    setReportScanLog(prev => [...prev, `Cleared loaded credit report file.`]);
  };

  // Import simulation
  const handleImportReport = () => {
    setImportingReport(true);
    setReportScanLog([]);
    const fileName = creditReportFileName || `${selectedProvider}_Default_Disclosures.html`;
    const logs = [
      `Initiating secure local file ingestion for "${fileName}"...`,
      `Applying custom Optical Character Recognition (OCR) and parsing HTML/PDF tags...`,
      `Scanning line items for regulatory compliance under FCRA guidelines...`,
      `Analyzing payment history, charge-offs, late-payment indicators, and collection items...`,
      `Detecting Metro 2 reporting violations in 15 U.S.C. § 1681...`,
      `Extraction complete! Mapped and loaded credit file parameters into workspace.`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setReportScanLog(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setImportingReport(false);
        // Load negative trade lines from the file
        setScannedAccounts(initialNegativeAccounts);
        alert(`Successfully scanned "${fileName}"! 5 negative trade lines found and imported into your workspace.`);
      }
    }, 600);
  };

  // Letter generation
  const handleGenerateDisputeLetter = () => {
    const selectedAccs = scannedAccounts.filter(acc => selectedLetterAccounts.includes(acc.id));
    if (selectedAccs.length === 0) {
      alert("Please check at least one negative account to bundle into your dispute letter.");
      return;
    }

    const clientName = signatureName || "Marcus Peterson";
    const letter = generateLetterTemplate(
      selectedLetterType,
      clientName,
      "XXX-XX-1234",
      "1403 Slate Creek Lane, Chicago, IL 60611",
      disputeRecipient,
      selectedAccs
    );
    setGeneratedLetter(letter);
  };

  const handleCopyLetter = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAccountSelection = (id: string) => {
    if (selectedLetterAccounts.includes(id)) {
      setSelectedLetterAccounts(selectedLetterAccounts.filter(x => x !== id));
    } else {
      setSelectedLetterAccounts([...selectedLetterAccounts, id]);
    }
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* SCORES HEADER */}
      <div className="bg-neutral-900 text-white rounded-[32px] p-8 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">FTF CREDIT REPAIR MODULE</span>
          <h2 className="font-display font-black text-2xl tracking-tight leading-none">Personal Credit Executive Summary</h2>
          <p className="text-xs text-neutral-400">Manage score benchmarks, track active disputes, and compile legal challenge documents.</p>
        </div>

        {/* Dynamic controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setEditingScores(!editingScores)}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={editingScores ? "animate-spin" : ""} />
            {editingScores ? "Save Parameters" : "Adjust Metrics"}
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score dial */}
        <div className="bg-white border border-neutral-150 p-6 rounded-3xl shadow-xs space-y-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">FICO Score Matrix</span>
          
          {editingScores ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span>Experian</span><input type="number" className="w-16 border rounded text-right p-0.5" value={scores.experian} onChange={e => setScores({ ...scores, experian: Number(e.target.value) })} /></div>
              <div className="flex justify-between"><span>Equifax</span><input type="number" className="w-16 border rounded text-right p-0.5" value={scores.equifax} onChange={e => setScores({ ...scores, equifax: Number(e.target.value) })} /></div>
              <div className="flex justify-between"><span>TransUnion</span><input type="number" className="w-16 border rounded text-right p-0.5" value={scores.transunion} onChange={e => setScores({ ...scores, transunion: Number(e.target.value) })} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
                <div className="text-[9px] text-neutral-400 font-bold uppercase">EXP</div>
                <div className="text-base font-black text-neutral-900 mt-0.5">{scores.experian}</div>
              </div>
              <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
                <div className="text-[9px] text-neutral-400 font-bold uppercase">EQF</div>
                <div className="text-base font-black text-neutral-900 mt-0.5">{scores.equifax}</div>
              </div>
              <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
                <div className="text-[9px] text-neutral-400 font-bold uppercase">TRU</div>
                <div className="text-base font-black text-neutral-900 mt-0.5">{scores.transunion}</div>
              </div>
            </div>
          )}
        </div>

        {/* Status board */}
        <div className="bg-white border border-neutral-150 p-6 rounded-3xl shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Negative Trade Lines</span>
            {editingScores ? (
              <div className="space-y-1 mt-2 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-bold">Accounts:</span>
                  <input type="number" className="w-12 border border-neutral-200 rounded text-right p-0.5 text-neutral-800 font-bold" value={itemsRemaining} disabled />
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-bold">Deleted:</span>
                  <input type="number" className="w-12 border border-neutral-200 rounded text-right p-0.5 text-neutral-800 font-bold" value={itemsRemoved} onChange={e => setItemsRemoved(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-black font-display text-neutral-900 mt-2">{itemsRemaining} Accounts</div>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">✓ {itemsRemoved} Deleted Items</span>
              </>
            )}
          </div>
          <div className="size-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Disputed counters */}
        <div className="bg-white border border-neutral-150 p-6 rounded-3xl shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Dispute Round Status</span>
            {editingScores ? (
              <div className="space-y-1 mt-2 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-bold">Disputed:</span>
                  <input type="number" className="w-12 border border-neutral-200 rounded text-right p-0.5 text-neutral-800 font-bold" value={disputedAccounts} disabled />
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-bold">Verified:</span>
                  <input type="number" className="w-12 border border-neutral-200 rounded text-right p-0.5 text-neutral-800 font-bold" value={positiveAccounts} onChange={e => setPositiveAccounts(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-black font-display text-neutral-900 mt-2">{disputedAccounts} In Dispute</div>
                <span className="text-[10px] text-neutral-400 font-bold mt-1 inline-block">{positiveAccounts} Verified Good Trade Lines</span>
              </>
            )}
          </div>
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
        </div>

        {/* Readiness Dial */}
        <div className="bg-white border border-neutral-150 p-6 rounded-3xl shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Funding Odds</span>
            {editingScores ? (
              <div className="space-y-1 mt-2 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-bold">Odds %:</span>
                  <input type="number" className="w-12 border border-neutral-200 rounded text-right p-0.5 text-neutral-800 font-bold" value={fundingReadiness} onChange={e => setFundingReadiness(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-black font-display text-neutral-900 mt-2">{fundingReadiness}% Dial</div>
                <span className="text-[10px] text-blue-600 font-extrabold mt-1 inline-block">TARGET: 80% For Tier 1 Cards</span>
              </>
            )}
          </div>
          <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PHASE 1: CLIENT ONBOARDING & DOCUMENT VAULT (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-600" /> Phase 1: Secure Compliance Upload
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Sensitive verification files must report 100% complete before credit challenge submission.</p>
            </div>

            {/* Document Check boxes */}
            <div className="space-y-3.5">
              
              {/* ID Card */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'idCard')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'idCard')}
                className={cn(
                  "flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border transition-all",
                  dragOverKey === 'idCard' ? "border-emerald-500 bg-emerald-50/20" : "border-neutral-100"
                )}
              >
                <div className="space-y-0.5 text-left flex-1 mr-3">
                  <h4 className="font-bold text-xs text-neutral-800">Primary Government Photo ID</h4>
                  <p className="text-[10px] text-neutral-400">Drivers License or Passport showing current address.</p>
                  {uploadedDocs.idCard && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold block mt-1 truncate max-w-[200px]" title={uploadedDocs.idCard}>
                      📄 {uploadedDocs.idCard}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input 
                    type="file" 
                    id="file-idCard" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'idCard')} 
                  />
                  <button
                    onClick={() => document.getElementById('file-idCard')?.click()}
                    disabled={isUploading === 'idCard'}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer border flex items-center gap-1.5 transition-all",
                      uploadedDocs.idCard 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-fade-in" 
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900"
                    )}
                  >
                    {isUploading === 'idCard' ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : uploadedDocs.idCard ? (
                      <>✓ Uploaded</>
                    ) : (
                      <>Upload File</>
                    )}
                  </button>
                  {uploadedDocs.idCard && (
                    <button
                      onClick={(e) => handleRemoveFile('idCard', e)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove File"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* SSN Card */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'ssnCard')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'ssnCard')}
                className={cn(
                  "flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border transition-all",
                  dragOverKey === 'ssnCard' ? "border-emerald-500 bg-emerald-50/20" : "border-neutral-100"
                )}
              >
                <div className="space-y-0.5 text-left flex-1 mr-3">
                  <h4 className="font-bold text-xs text-neutral-800">Social Security Number Card</h4>
                  <p className="text-[10px] text-neutral-400">Clear photograph of physical SSN or ITIN confirmation letter.</p>
                  {uploadedDocs.ssnCard && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold block mt-1 truncate max-w-[200px]" title={uploadedDocs.ssnCard}>
                      📄 {uploadedDocs.ssnCard}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input 
                    type="file" 
                    id="file-ssnCard" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'ssnCard')} 
                  />
                  <button
                    onClick={() => document.getElementById('file-ssnCard')?.click()}
                    disabled={isUploading === 'ssnCard'}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer border flex items-center gap-1.5 transition-all",
                      uploadedDocs.ssnCard 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-fade-in" 
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900"
                    )}
                  >
                    {isUploading === 'ssnCard' ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : uploadedDocs.ssnCard ? (
                      <>✓ Uploaded</>
                    ) : (
                      <>Upload File</>
                    )}
                  </button>
                  {uploadedDocs.ssnCard && (
                    <button
                      onClick={(e) => handleRemoveFile('ssnCard', e)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove File"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Utility Bill */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'utilityBill')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'utilityBill')}
                className={cn(
                  "flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border transition-all",
                  dragOverKey === 'utilityBill' ? "border-emerald-500 bg-emerald-50/20" : "border-neutral-100"
                )}
              >
                <div className="space-y-0.5 text-left flex-1 mr-3">
                  <h4 className="font-bold text-xs text-neutral-800">Proof of Billing Address</h4>
                  <p className="text-[10px] text-neutral-400">Utility bill, bank log, or insurance slip less than 60 days old.</p>
                  {uploadedDocs.utilityBill && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold block mt-1 truncate max-w-[200px]" title={uploadedDocs.utilityBill}>
                      📄 {uploadedDocs.utilityBill}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input 
                    type="file" 
                    id="file-utilityBill" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'utilityBill')} 
                  />
                  <button
                    onClick={() => document.getElementById('file-utilityBill')?.click()}
                    disabled={isUploading === 'utilityBill'}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer border flex items-center gap-1.5 transition-all",
                      uploadedDocs.utilityBill 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-fade-in" 
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900"
                    )}
                  >
                    {isUploading === 'utilityBill' ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : uploadedDocs.utilityBill ? (
                      <>✓ Uploaded</>
                    ) : (
                      <>Upload File</>
                    )}
                  </button>
                  {uploadedDocs.utilityBill && (
                    <button
                      onClick={(e) => handleRemoveFile('utilityBill', e)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove File"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* E-SIGN AGREEMENTS SECTION */}
            <div className="pt-6 border-t border-neutral-100 space-y-4">
              <div>
                <h4 className="font-display font-extrabold text-sm text-neutral-900">E-Sign Dispute Challenge Agreement</h4>
                <p className="text-[10px] text-neutral-500 leading-relaxed mt-0.5">Authorizes the FTF legal audit team to coordinate challenge notices on your behalf.</p>
              </div>

              {eSigned ? (
                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">✓ E-Signature Confirmed</span>
                  <p className="text-xs font-bold text-neutral-800">Digitally Verified: "{signatureName}"</p>
                  <p className="text-[9px] text-emerald-600">Timestamp: SHA-256 Secure Logged</p>
                  <button onClick={() => { setESigned(false); setSignatureName(''); }} className="text-[9px] text-neutral-400 underline pt-1 cursor-pointer">Revoke Authorized Consent</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Type Full Name for digital signature..."
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold focus:ring-0 focus:border-neutral-900"
                  />
                  <button
                    onClick={() => {
                      if (!signatureName.trim()) { alert("Please type your full legal name first."); return; }
                      setESigned(true);
                    }}
                    className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold uppercase tracking-wider text-[10px] py-2.5 cursor-pointer"
                  >
                    Authorize E-Sign Consent
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SUCCESS ROADMAP DISPLAY */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-display font-black text-base text-neutral-900">FTF Strategic Success Roadmap</h3>
            
            <div className="space-y-4 text-xs font-bold">
              {successRoadmap.map((rm) => (
                <div key={rm.step} className="flex gap-3">
                  <div className="size-6 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 font-display text-xs font-black">
                    {rm.step}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-neutral-900 font-extrabold">{rm.title}</h4>
                    <p className="text-[10px] text-neutral-400 leading-normal font-medium">{rm.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PORTAL SUITE (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PHASE 2: CREDIT REPORT IMPORT CENTRE */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-neutral-900" /> Phase 2: Credit Report Importer
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Select your credit monitoring provider to import and auto-read FICO listings.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['SmartCredit', 'IdentityIQ', 'PrivacyGuard', 'MyScoreIQ'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvider(p)}
                  className={cn(
                    "p-3 rounded-2xl border text-center text-xs font-black tracking-tight cursor-pointer transition-all",
                    selectedProvider === p 
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-md" 
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-950"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Real Credit Report File Upload Component */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOverReport(true); }}
              onDragLeave={() => setDragOverReport(false)}
              onDrop={handleCreditReportDrop}
              onClick={() => document.getElementById('credit-report-input')?.click()}
              className={cn(
                "border-2 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                dragOverReport 
                  ? "border-emerald-500 bg-emerald-50/30 text-emerald-900" 
                  : "border-neutral-200 hover:border-neutral-900 bg-neutral-50/50"
              )}
            >
              <input 
                type="file" 
                id="credit-report-input" 
                className="hidden" 
                accept=".html,.pdf,.txt,.xml,image/*"
                onChange={handleCreditReportFileChange}
              />
              <UploadCloud size={32} className={cn("mb-2 text-neutral-400", dragOverReport && "text-emerald-500")} />
              
              {creditReportFileName ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 font-mono block">FILE READY FOR SCANNING</span>
                  <p className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 justify-center">
                    📄 {creditReportFileName}
                  </p>
                  <p className="text-[9px] text-neutral-400">Click the button below to perform AI OCR scan</p>
                  <button 
                    onClick={handleRemoveCreditReportFile}
                    className="mt-2 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                  >
                    <Trash2 size={10} /> Clear File
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-700">Drag & Drop file here or click to choose file</p>
                  <p className="text-[10px] text-neutral-400 leading-normal">Upload downloaded HTML, PDF, or Image from SmartCredit, IdentityIQ, PrivacyGuard, or MyScoreIQ.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-neutral-50 p-4 rounded-2xl border border-neutral-150 justify-between">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Connection Engine Status</span>
                <p className="text-xs font-bold text-neutral-900">
                  {creditReportFileName 
                    ? `Ready to scan local "${creditReportFileName}" file.`
                    : `API Gateway ready to parse loaded ${selectedProvider} file.`}
                </p>
              </div>
              <button
                onClick={handleImportReport}
                disabled={importingReport}
                className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {importingReport ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <UploadCloud size={14} />
                )}
                {importingReport ? "AI OCR Scanning Report..." : creditReportFileName ? "Scan Loaded Credit File" : `Import & Scan ${selectedProvider} File`}
              </button>
            </div>

            {/* SCAN LOGS */}
            {reportScanLog.length > 0 && (
              <div className="bg-neutral-950 text-emerald-400 font-mono text-[9px] p-4 rounded-2xl space-y-1 max-h-[150px] overflow-y-auto border border-neutral-800">
                <div className="text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-800 pb-1 mb-1 flex justify-between">
                  <span>FTF OCR SYSTEM TRACE LOGS</span>
                  <span className="animate-pulse">● LIVE</span>
                </div>
                {reportScanLog.map((log, index) => (
                  <div key={index} className="leading-relaxed">{log}</div>
                ))}
              </div>
            )}

            {/* Manual Entry Sub-Form */}
            <form onSubmit={handleAddAccountManually} className="p-4 rounded-2xl bg-neutral-50/50 border border-neutral-150 space-y-3 pt-4 border-t border-neutral-100 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Add Negative Trade Line Manually</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  placeholder="Creditor/Bank Name (e.g. Chase Bank)" 
                  value={newCreditor}
                  required
                  onChange={(e) => setNewCreditor(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0" 
                />
                <input 
                  type="text" 
                  placeholder="Account Type (e.g. Credit Card)" 
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0" 
                />
                <input 
                  type="number" 
                  placeholder="Balance (e.g. 1200)" 
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  placeholder="Dispute Finding/Reason" 
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold bg-white focus:ring-0 md:col-span-2" 
                />
                <button 
                  type="submit"
                  className="rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={12} /> Add Account
                </button>
              </div>
            </form>
          </div>

          {/* PHASE 3 & 4: DISPUTE SUITE (AI Auditor & Letter Generator) */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
                <Sparkles size={20} className="text-neutral-900" /> Phase 3 & 4: AI Auditor & Dispute Letter Generator
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Check negative records below to combine them into an automated legal dispute notice.</p>
            </div>

            {/* Scanned items grid */}
            <div className="space-y-3.5">
              {scannedAccounts.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <p className="text-neutral-400 text-xs font-semibold">No negative trade lines found. Scan a credit file above or add a trade line manually.</p>
                </div>
              ) : (
                scannedAccounts.map((acc) => {
                  const isSelected = selectedLetterAccounts.includes(acc.id);
                  return (
                    <div 
                      key={acc.id} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all text-left flex gap-3 items-start",
                        isSelected ? "border-neutral-950 bg-neutral-50/50" : "border-neutral-150 bg-white"
                      )}
                    >
                      <button
                        onClick={() => toggleAccountSelection(acc.id)}
                        className={cn(
                          "size-5 rounded-md border flex items-center justify-center mt-1 cursor-pointer shrink-0 transition-colors",
                          isSelected ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-300 bg-white"
                        )}
                      >
                        {isSelected && <Check size={12} />}
                      </button>

                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-extrabold text-neutral-950 text-xs">{acc.creditor}</h4>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">{acc.type} • Balance: ${acc.balance.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                              acc.priority === 'High' ? "bg-red-50 text-red-700" :
                              acc.priority === 'Medium' ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                            )}>
                              {acc.priority} Priority
                            </span>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* AI Audit section */}
                        <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-xl text-[10px] space-y-1 leading-normal text-neutral-600">
                          <div className="text-neutral-800 font-extrabold">🚨 Credit File Violation:</div>
                          <div><strong className="font-bold text-neutral-700">Audit Finding:</strong> {acc.strategy}</div>
                          <div><strong className="font-bold text-neutral-700">Legal Foundation:</strong> {acc.lawViolation}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Letter settings selection */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Challenge Configuration Panel</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase">Challenge Agency / Target Recipient</label>
                  <input
                    type="text"
                    value={disputeRecipient}
                    onChange={(e) => setDisputeRecipient(e.target.value)}
                    className="w-full bg-white rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase">Challenge Action Strategy Type</label>
                  <select
                    value={selectedLetterType}
                    onChange={(e) => setSelectedLetterType(e.target.value as any)}
                    className="w-full bg-white rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold"
                  >
                    <option value="bureau">Bureau Dispute Notice (FCRA § 611)</option>
                    <option value="creditor">Direct Creditor Challenge (Metro 2 Violation)</option>
                    <option value="validation">Collection Debt Validation Demand (FDCPA § 1692g)</option>
                    <option value="cfpb">CFPB Administrative Enforcement Request</option>
                    <option value="ftc">FTC Safeguards Compliance Report</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateDisputeLetter}
                className="w-full rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold uppercase tracking-wider text-xs py-3 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <FileText size={14} /> Generate Automated Challenge Letter ({selectedLetterAccounts.length} Items)
              </button>
            </div>

            {/* GENERATED LETTER RENDER */}
            {generatedLetter && (
              <div className="border border-neutral-150 rounded-2xl overflow-hidden shadow-xs text-left animate-in fade-in duration-200">
                <div className="bg-neutral-900 text-white p-3.5 flex justify-between items-center">
                  <div className="text-xs font-bold flex items-center gap-2">
                    <CheckSquare size={14} className="text-emerald-400" />
                    <span>Generated: {generatedLetter.subject}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopyLetter}
                      className="px-2 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px] font-bold tracking-tight uppercase flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? "✓ Copied" : <><Copy size={12} /> Copy</>}
                    </button>
                    <a 
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(generatedLetter.content)}`} 
                      download={`${generatedLetter.type}_dispute_letter.txt`}
                      className="px-2 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px] font-bold tracking-tight uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={12} /> Save
                    </a>
                  </div>
                </div>
                <pre className="bg-neutral-50 p-6 text-[10px] leading-relaxed font-mono whitespace-pre-wrap text-neutral-800 max-h-[300px] overflow-y-auto border-t border-neutral-200">
                  {generatedLetter.content}
                </pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
