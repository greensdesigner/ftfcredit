import React, { useState } from 'react';
import { 
  Building, FileText, Globe2, UploadCloud, CheckCircle2, 
  Sparkles, RefreshCw, AlertCircle, FilePlus2, CheckSquare, 
  ArrowUpRight, HelpCircle, ArrowRight 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FormationOrder, TaxDocument, ImmigrationCase } from '../types/ftf';

export default function FtfFormationTaxImmigration() {
  // Active inner sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'formation' | 'tax' | 'immigration'>('formation');

  // --- FORMATION STATES ---
  const [formationOrders, setFormationOrders] = useState<FormationOrder[]>([
    {
      id: 'form-1',
      companyName: 'Peterson Logistics Group LLC',
      type: 'LLC',
      state: 'Delaware',
      einRequested: true,
      operatingAgreementRequested: true,
      status: 'Approved & Completed',
      updatedAt: '2026-06-18'
    },
    {
      id: 'form-2',
      companyName: 'Vertex Venture Group Corp',
      type: 'Corporation',
      state: 'Wyoming',
      einRequested: true,
      operatingAgreementRequested: true,
      status: 'Submitted to State',
      updatedAt: '2026-07-04'
    }
  ]);
  const [newCorpName, setNewCorpName] = useState('');
  const [newCorpState, setNewCorpState] = useState('Delaware');
  const [newCorpType, setNewCorpType] = useState<'LLC' | 'Corporation'>('LLC');
  const [orderProcessing, setOrderProcessing] = useState(false);

  // --- TAX STATES ---
  const [taxDocs, setTaxDocs] = useState<TaxDocument[]>([
    { id: 'tax-1', name: '2025_W2_Marcus_Peterson.pdf', type: 'W2', uploadedAt: '2026-06-28', status: 'Filed', refundEstimate: 4250 },
    { id: 'tax-2', name: '2025_1099_Consulting_Fees.pdf', type: '1099', uploadedAt: '2026-07-01', status: 'In Progress' }
  ]);
  const [taxRefundStatus, setTaxRefundStatus] = useState<'IRS Accepted' | 'Processing Refund' | 'Refund Direct Deposited'>('Processing Refund');
  const [taxResolutionCase, setTaxResolutionCase] = useState<string>('IRS Audit representation sequence active. Correspondence dispatched on 06/25/2026.');
  const [uploadingTax, setUploadingTax] = useState(false);

  // --- IMMIGRATION STATES ---
  const [immigrationCases, setImmigrationCases] = useState<ImmigrationCase[]>([
    {
      id: 'imm-1',
      caseType: 'I-130 Petition for Alien Relative',
      uscisReceiptNumber: 'IOE948301948',
      status: 'Filed',
      deadline: '2026-11-15',
      requiredDocs: [
        { name: 'Sponsor Passport Copy', completed: true },
        { name: 'Beneficiary Birth Certificate', completed: true },
        { name: 'Marriage Certificate & Photos', completed: true },
        { name: 'Affidavit of Support Form I-864', completed: false }
      ]
    }
  ]);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  // Formation ordering logic
  const handlePlaceFormationOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorpName.trim()) return;
    setOrderProcessing(true);
    
    setTimeout(() => {
      const newOrder: FormationOrder = {
        id: `form-${Date.now()}`,
        companyName: newCorpName,
        type: newCorpType,
        state: newCorpState,
        einRequested: true,
        operatingAgreementRequested: true,
        status: 'Pending Review',
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setFormationOrders([newOrder, ...formationOrders]);
      setNewCorpName('');
      setOrderProcessing(false);
      alert(`Success: Corporate entity order for "${newCorpName}" has been submitted securely! State dispatch initiated.`);
    }, 1500);
  };

  // Tax upload logic
  const handleTaxUploadSim = () => {
    setUploadingTax(true);
    setTimeout(() => {
      const newDoc: TaxDocument = {
        id: `tax-${Date.now()}`,
        name: '2025_IRS_Tax_Declaration_Return.pdf',
        type: 'Tax Return',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Received'
      };
      setTaxDocs([newDoc, ...taxDocs]);
      setUploadingTax(false);
      alert("Success: Tax statement uploaded to secure processing portal. Accounting audits scheduled.");
    }, 1200);
  };

  // Immigration doc checklist toggles
  const toggleImmigrationDoc = (caseId: string, docName: string) => {
    setImmigrationCases(immigrationCases.map(imm => {
      if (imm.id === caseId) {
        return {
          ...imm,
          requiredDocs: imm.requiredDocs.map(d => d.name === docName ? { ...d, completed: !d.completed } : d)
        };
      }
      return imm;
    }));
  };

  const handlePassportUploadSim = () => {
    setUploadingPassport(true);
    setTimeout(() => {
      setUploadingPassport(false);
      alert("Success: Secure Passport and biographical page files processed via OCR SHA-256 validator.");
    }, 1200);
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* SECTION SUB-TAB NAVIGATION */}
      <div className="flex bg-neutral-100 p-1.5 rounded-2xl gap-2 max-w-xl mx-auto border border-neutral-150 justify-between">
        {[
          { id: 'formation', label: 'Business Formation', icon: Building },
          { id: 'tax', label: 'Tax Service Center', icon: FileText },
          { id: 'immigration', label: 'Immigration Services', icon: Globe2 }
        ].map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                isActive 
                  ? "bg-neutral-900 text-white shadow-md" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
              )}
            >
              <Icon size={14} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------ SUB-TAB: BUSINESS FORMATION ------------------ */}
      {activeSubTab === 'formation' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-150 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 font-mono">PHASE 10: BUSINESS FORMATION CENTRE</span>
              <h3 className="font-display font-black text-2xl text-neutral-900 leading-none">Incorporate LLCs & Corporations</h3>
              <p className="text-xs text-neutral-500 max-w-2xl">
                Deploy secure state filings to acquire your LLC, EIN, operating agreement, and corporate articles to establish business credentials.
              </p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-extrabold uppercase tracking-widest rounded-xl">
              D-U-N-S Linked
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Order Entity Form (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
              <h4 className="font-display font-black text-base text-neutral-900">Acquire Corporate Trade Entity</h4>
              
              <form onSubmit={handlePlaceFormationOrder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Proposed Business Name</label>
                  <input
                    type="text"
                    required
                    value={newCorpName}
                    onChange={(e) => setNewCorpName(e.target.value)}
                    placeholder="e.g. Peterson Freight Express"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:ring-0 focus:border-neutral-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Structure Type</label>
                  <select
                    value={newCorpType}
                    onChange={(e) => setNewCorpType(e.target.value as any)}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold"
                  >
                    <option value="LLC">Limited Liability Company (LLC)</option>
                    <option value="Corporation">C-Corporation (S-Corp Election Eligible)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">State of Organization</label>
                  <select
                    value={newCorpState}
                    onChange={(e) => setNewCorpState(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold"
                  >
                    <option value="Delaware">Delaware (Recommended for VC Funding)</option>
                    <option value="Wyoming">Wyoming (Optimal Privacy)</option>
                    <option value="Florida">Florida (Local State)</option>
                    <option value="Texas">Texas (Low Fees)</option>
                  </select>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 text-[10px] space-y-2 text-neutral-600">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Bundle Pack Includes:
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>Articles of Organization State Filing</li>
                    <li>Federal Employer Identification Number (EIN)</li>
                    <li>Corporate Resolution & Bylaws</li>
                    <li>Custom Operating Agreement drafts</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={orderProcessing}
                  className="w-full rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold uppercase tracking-wider text-xs py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {orderProcessing ? <RefreshCw className="animate-spin" size={14} /> : <FilePlus2 size={14} />}
                  {orderProcessing ? "Processing State Order..." : "Submit Incorporation Order"}
                </button>
              </form>
            </div>

            {/* Track Orders Status List (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
              <h4 className="font-display font-black text-base text-neutral-900">Current Incorporation Portfolios</h4>
              
              <div className="space-y-4">
                {formationOrders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl border border-neutral-150 bg-neutral-50 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="text-left">
                        <h5 className="font-black text-xs text-neutral-900">{order.companyName}</h5>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">{order.type} • Filed in {order.state} State</p>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        order.status === 'Approved & Completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        order.status === 'Submitted to State' ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}>
                        {order.status}
                      </span>
                    </div>

                    {/* Progress Slider Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full transition-all duration-500",
                          order.status === 'Approved & Completed' ? "w-full bg-emerald-500" :
                          order.status === 'Submitted to State' ? "w-2/3 bg-blue-500" : "w-1/3 bg-amber-500"
                        )} />
                      </div>
                      <div className="flex justify-between text-[8px] text-neutral-400 font-bold font-mono">
                        <span>1. Intake Review</span>
                        <span>2. State Dispatched</span>
                        <span>3. Approved & Live</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------ SUB-TAB: TAX SERVICE CENTRE ------------------ */}
      {activeSubTab === 'tax' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-150 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 font-mono">PHASE 11: TAX SERVICE CENTRE</span>
              <h3 className="font-display font-black text-2xl text-neutral-900 leading-none">Secure Income & IRS Resolution Hub</h3>
              <p className="text-xs text-neutral-500 max-w-2xl">
                Upload income records, monitor state and federal return processing times, and check active IRS resolution/settlement logs.
              </p>
            </div>
            <div className="flex gap-4 p-4 bg-neutral-900 text-white rounded-2xl shrink-0 shadow-lg text-xs leading-normal text-left">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Refund Status</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">{taxRefundStatus}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Upload Documents (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
              <h4 className="font-display font-black text-base text-neutral-900">Secure Tax Vault Upload</h4>
              
              <div className="space-y-4">
                <button
                  onClick={handleTaxUploadSim}
                  disabled={uploadingTax}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-neutral-950 bg-neutral-50 hover:bg-neutral-50/50 flex flex-col items-center justify-center p-6 transition-all text-center gap-2 cursor-pointer"
                >
                  {uploadingTax ? (
                    <RefreshCw className="animate-spin text-neutral-900" size={24} />
                  ) : (
                    <UploadCloud size={32} className="text-neutral-400" />
                  )}
                  <div className="font-extrabold text-xs text-neutral-800">
                    {uploadingTax ? "Securing and Syncing Files..." : "Drag files here or click to select"}
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">Accepts W2s, 1099s, and past state and federal returns (PDF/JPG).</p>
                </button>

                {/* Tax resolution case box */}
                <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-left">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-amber-900 leading-normal">
                    <span className="font-extrabold block uppercase tracking-wider text-[10px]">IRS Resolution & Compliance Notice</span>
                    <p className="font-medium text-amber-800">{taxResolutionCase}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* List of tax records (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
              <h4 className="font-display font-black text-base text-neutral-900">Secure Upload Ledger</h4>
              
              <div className="space-y-3">
                {taxDocs.map((doc) => (
                  <div key={doc.id} className="p-3.5 rounded-2xl border border-neutral-150 bg-neutral-50 flex items-center justify-between">
                    <div className="text-left space-y-0.5">
                      <p className="font-extrabold text-xs text-neutral-900">{doc.name}</p>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase">Form: {doc.type} • Uploaded {doc.uploadedAt}</span>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {doc.refundEstimate && (
                        <div className="text-xs font-black text-emerald-600">Refund: +${doc.refundEstimate.toLocaleString()}</div>
                      )}
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white",
                        doc.status === 'Filed' ? "bg-emerald-600" : "bg-blue-600"
                      )}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------ SUB-TAB: IMMIGRATION SERVICES ------------------ */}
      {activeSubTab === 'immigration' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-150 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 font-mono">PHASE 12: IMMIGRATION CENTRE</span>
              <h3 className="font-display font-black text-2xl text-neutral-900 leading-none">USCIS Petitions & Visas Checklist</h3>
              <p className="text-xs text-neutral-500 max-w-2xl">
                Upload biographical files, monitor application checklists, track deadlines, and view USCIS receipt progress updates securely.
              </p>
            </div>
            <div className="flex gap-4 p-4 bg-neutral-900 text-white rounded-2xl shrink-0 shadow-lg text-xs leading-normal text-left">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Petitions Tracked</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">{immigrationCases.length} Active</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Passport & Bio Upload (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
              <h4 className="font-display font-black text-base text-neutral-900">Biographical Document Vault</h4>
              
              <div className="space-y-4">
                <button
                  onClick={handlePassportUploadSim}
                  disabled={uploadingPassport}
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-neutral-950 bg-neutral-50 hover:bg-neutral-50/50 flex flex-col items-center justify-center p-6 transition-all text-center gap-2 cursor-pointer"
                >
                  {uploadingPassport ? (
                    <RefreshCw className="animate-spin text-neutral-900" size={24} />
                  ) : (
                    <UploadCloud size={28} className="text-neutral-400" />
                  )}
                  <div className="font-extrabold text-xs text-neutral-800">
                    {uploadingPassport ? "Encrypting and Verifying Passport..." : "Upload Biographical Passport Photo"}
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">Securely stored with SHA-256 validation algorithms.</p>
                </button>

                <div className="p-4 bg-blue-50 border border-blue-150 rounded-2xl text-xs text-blue-900 space-y-1.5 leading-normal">
                  <span className="font-extrabold block uppercase tracking-wider text-[10px]">USCIS Regulatory Policy notice</span>
                  <p className="font-medium text-blue-800">
                    Always confirm translation certifications for non-English records. Foreign languages require full literal English translation signed by a licensed translator.
                  </p>
                </div>
              </div>
            </div>

            {/* Application Checklists (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
              <h4 className="font-display font-black text-base text-neutral-900">USCIS Case Pipeline Checklists</h4>
              
              <div className="space-y-6">
                {immigrationCases.map((imm) => (
                  <div key={imm.id} className="p-5 rounded-2xl border border-neutral-150 bg-neutral-50 space-y-4 text-left">
                    <div className="flex justify-between items-start gap-4 border-b border-neutral-200/50 pb-3">
                      <div>
                        <h5 className="font-black text-xs text-neutral-900">{imm.caseType}</h5>
                        {imm.uscisReceiptNumber && (
                          <span className="text-[9px] bg-neutral-200 text-neutral-800 font-mono font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block">
                            Receipt: {imm.uscisReceiptNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                        Status: {imm.status}
                      </span>
                    </div>

                    {/* Document checklist items */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Package Required Documents</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {imm.requiredDocs.map((doc) => (
                          <button
                            key={doc.name}
                            onClick={() => toggleImmigrationDoc(imm.id, doc.name)}
                            className={cn(
                              "p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2",
                              doc.completed 
                                ? "bg-white border-emerald-500/30 text-neutral-800" 
                                : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-950"
                            )}
                          >
                            <span className="leading-snug">{doc.name}</span>
                            <span className={cn(
                              "size-4.5 rounded-full flex items-center justify-center text-[10px] shrink-0 text-white font-bold",
                              doc.completed ? "bg-emerald-600" : "bg-neutral-200"
                            )}>
                              {doc.completed ? "✓" : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
