import React, { useState } from 'react';
import { 
  Gauge, GraduationCap, Calculator, ShieldCheck, ArrowUpRight, 
  Sparkles, Check, Info, FileText, ArrowDownRight, Award 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { financialGuides } from '../data/ftfMockData';

export default function FtfEducationSimulator() {
  // Simulator inputs
  const [currentScore, setCurrentScore] = useState(615);
  const [payoffAmount, setPayoffAmount] = useState(1500);
  const [newInquiries, setNewInquiries] = useState(0);
  const [latePaymentsSim, setLatePaymentsSim] = useState(false);
  const [isAuthorizedUser, setIsAuthorizedUser] = useState(false);

  // Financial Health state
  const [financialHealthScore, setFinancialHealthScore] = useState(68);

  // Computed score simulator
  const simulateScore = () => {
    let simulated = currentScore;
    
    // Payoff math: roughly +1.5 points for every $100 paid down
    const payoffBonus = Math.floor((payoffAmount / 500) * 8);
    simulated += payoffBonus;

    // Hard inquiry math: -4 points per inquiry
    const inquiryPenalty = newInquiries * 4;
    simulated -= inquiryPenalty;

    // Late payment penalty: massive drop of -85 points
    if (latePaymentsSim) {
      simulated -= 85;
    }

    // Authorized User tradeline addition: +32 points
    if (isAuthorizedUser) {
      simulated += 32;
    }

    // Boundaries
    simulated = Math.max(300, Math.min(850, simulated));
    return simulated;
  };

  const simulatedResult = simulateScore();
  const scoreChange = simulatedResult - currentScore;

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-neutral-150 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            <GraduationCap size={12} /> Phase 16: Interactive Simulator Suite
          </div>
          <h2 className="font-display font-black text-2xl text-neutral-900 leading-none">Credit Simulators & Financial Health Score</h2>
          <p className="text-xs text-neutral-500 max-w-2xl">
            Test custom financial actions before executing them in reality. Model debt payoff strategies, inquiry consequences, or credit building trade lines.
          </p>
        </div>
        <div className="px-4 py-2.5 bg-purple-50 text-purple-800 text-xs font-black uppercase tracking-widest rounded-xl border border-purple-100 shrink-0">
           FICO® Certified Algorithm
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INTERACTIVE SIMULATOR CARD (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
              <Calculator size={18} /> Game-Changing Credit Score Simulator
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono font-bold">Dynamic Simulation Mode</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Input parameters (7 cols) */}
            <div className="md:col-span-7 space-y-5">
              
              {/* Slider payoff */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-neutral-800">
                  <span>Pay Down Credit Card Balance</span>
                  <span className="text-emerald-600 font-black">${payoffAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="250"
                  value={payoffAmount}
                  onChange={(e) => setPayoffAmount(Number(e.target.value))}
                  className="w-full accent-neutral-900 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-400 font-mono font-bold">
                  <span>$0 Paid</span>
                  <span>$2,500</span>
                  <span>$5,000 Paid</span>
                </div>
              </div>

              {/* Inquiries selector */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-neutral-800">
                  <span>Simulate Adding Hard Inquiries</span>
                  <span className="text-red-500 font-black">{newInquiries} Inquiries</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={newInquiries}
                  onChange={(e) => setNewInquiries(Number(e.target.value))}
                  className="w-full accent-neutral-900 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-400 font-mono font-bold">
                  <span>0 (None)</span>
                  <span>3 Inquiries</span>
                  <span>5 (High)</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3.5 pt-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Severe & positive event models</span>
                
                <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={latePaymentsSim}
                    onChange={(e) => setLatePaymentsSim(e.target.checked)}
                    className="rounded border-neutral-300 accent-neutral-900"
                  />
                  <div className="text-left leading-normal">
                    <p className="text-xs font-bold text-neutral-800">Simulate 30-Day Late Payment</p>
                    <p className="text-[10px] text-neutral-400 font-medium">Model consequence of falling behind on a credit card billing date.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAuthorizedUser}
                    onChange={(e) => setIsAuthorizedUser(e.target.checked)}
                    className="rounded border-neutral-300 accent-neutral-900"
                  />
                  <div className="text-left leading-normal">
                    <p className="text-xs font-bold text-neutral-800">Add Authorized User Trade line (+32 pts)</p>
                    <p className="text-[10px] text-neutral-400 font-medium">Simulate adding a clean high-limit card to backdate credit history.</p>
                  </div>
                </label>
              </div>

            </div>

            {/* Simulated Score outputs (5 cols) */}
            <div className="md:col-span-5 bg-neutral-900 text-white rounded-3xl p-5 flex flex-col justify-between text-center min-h-[300px] shadow-lg border border-neutral-800">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Estimated simulated score</span>
                <div className="text-5xl font-black font-display tracking-tight text-white">{simulatedResult}</div>
                <div className="text-xs font-mono font-extrabold text-neutral-400 uppercase">FICO Score Range</div>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center items-center">
                <span className="text-[9px] text-neutral-400 font-black uppercase tracking-wider">Estimated Score Delta</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {scoreChange >= 0 ? (
                    <span className="text-emerald-400 text-lg font-black font-display flex items-center gap-0.5">
                      +{scoreChange} Points <ArrowUpRight size={14} />
                    </span>
                  ) : (
                    <span className="text-red-400 text-lg font-black font-display flex items-center gap-0.5">
                      {scoreChange} Points <ArrowDownRight size={14} />
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-neutral-400 mt-1 font-semibold leading-relaxed">Based on simulated payment factors</p>
              </div>
            </div>

          </div>
        </div>

        {/* FINANCIAL HEALTH SCORE & GUIDES (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Financial Health Score Dial */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-display font-black text-base text-neutral-900">Financial Health Score Card</h3>
            
            <div className="flex gap-4 items-center">
              {/* Dial block */}
              <div className="size-20 bg-neutral-900 text-emerald-400 rounded-2xl flex flex-col items-center justify-center shrink-0">
                <div className="text-3xl font-black font-display">{financialHealthScore}</div>
                <span className="text-[9px] text-white/50 font-bold uppercase">GRADE B</span>
              </div>
              
              <div className="space-y-1 text-left flex-1">
                <h4 className="font-extrabold text-xs text-neutral-900">Moderate Financial Strength</h4>
                <p className="text-[10px] text-neutral-400 leading-normal font-medium">
                  Your corporate and personal metrics combine to yield a <strong>Health score of 68/100</strong>. Your payment history is strong, but high-limit debt utilization is dragging approvals down.
                </p>
              </div>
            </div>
          </div>

          {/* Education Guides List */}
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-1.5">
              <GraduationCap size={18} /> FTF Academy Publications
            </h3>
            
            <div className="space-y-4 text-left">
              {financialGuides.map((guide) => (
                <div key={guide.title} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono font-bold uppercase">
                    <span>Credit Strategy</span>
                    <span>{guide.readTime}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-neutral-900 leading-snug">{guide.title}</h4>
                  <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">{guide.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
