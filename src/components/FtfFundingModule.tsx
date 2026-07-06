import React, { useState } from 'react';
import { 
  Briefcase, TrendingUp, DollarSign, ShieldAlert, CheckCircle2, 
  ArrowUpRight, Sparkles, Loader2, Gauge, AlertCircle, HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { mockFundingOffers } from '../data/ftfMockData';

export default function FtfFundingModule() {
  // Calculator inputs
  const [revenue, setRevenue] = useState(18500);
  const [timeInBusiness, setTimeInBusiness] = useState(2.5);
  const [industry, setIndustry] = useState('Professional Services (Low Risk)');
  const [creditScore, setCreditScore] = useState(650);

  // Computed Outputs
  const [evaluating, setEvaluating] = useState(false);
  const [readinessScore, setReadinessScore] = useState(72);
  const [estimatedFunding, setEstimatedFunding] = useState(125000);
  const [offers, setOffers] = useState(mockFundingOffers);

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    
    setTimeout(() => {
      // Calculate dynamic score based on simple metrics
      let score = 30;
      if (creditScore >= 720) score += 30;
      else if (creditScore >= 660) score += 20;
      else score += 10;

      if (revenue >= 30000) score += 30;
      else if (revenue >= 15000) score += 20;
      else score += 10;

      if (timeInBusiness >= 3) score += 25;
      else if (timeInBusiness >= 1) score += 15;
      else score += 5;

      if (!industry.includes('High Risk')) score += 15;
      else score += 5;

      // Limit score
      score = Math.min(score, 100);

      // Estimate amount
      const multiplier = score / 100;
      const estimated = Math.round((revenue * 12 * 0.4) * multiplier);

      // Generate offers based on status
      const updatedOffers = mockFundingOffers.map((offer, index) => {
        let odds: 'High' | 'Medium' | 'Low' = 'Medium';
        if (score >= 80) odds = 'High';
        else if (score >= 60) odds = index % 2 === 0 ? 'High' : 'Medium';
        else odds = 'Low';

        return {
          ...offer,
          amount: Math.round(offer.amount * (score / 72)),
          odds
        };
      });

      setReadinessScore(score);
      setEstimatedFunding(estimated);
      setOffers(updatedOffers);
      setEvaluating(false);
      alert("AI Funding Analysis Complete! Eligibility criteria updated successfully.");
    }, 1200);
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[32px] border border-neutral-150 p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <Sparkles size={12} /> Phase 9: Business Funding Module
          </div>
          <h2 className="font-display font-black text-2xl text-neutral-900 leading-none">AI Corporate Funding Allocator</h2>
          <p className="text-xs text-neutral-500 max-w-3xl">
            Our backend AI underwriting engine evaluates bank statement cash flow alongside your credit scores to determine optimal business lending structures. Adjust metrics below to trigger evaluation.
          </p>
        </div>

        {/* Big metrics tracker */}
        <div className="flex gap-4 p-4 bg-neutral-900 text-white rounded-2xl shrink-0 shadow-lg">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Readiness Score</span>
            <div className="text-2xl font-black font-display text-emerald-400 mt-1">{readinessScore}%</div>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Estimated Capital</span>
            <div className="text-2xl font-black font-display text-white mt-1">${estimatedFunding.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT CALCULATOR (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
          <h3 className="font-display font-black text-base text-neutral-900">Configure Corporate Profile</h3>
          
          <form onSubmit={handleEvaluate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Monthly Business Bank Deposits</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  className="w-full rounded-2xl border border-neutral-200 pl-8 pr-4 py-3 text-xs font-bold focus:border-neutral-950 focus:ring-0"
                  required
                />
              </div>
              <p className="text-[9px] text-neutral-400 font-medium">Sum of all monthly corporate deposits (minimum $10,000 for standard MCAs).</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Years Active under EIN (LLC / Corp)</label>
              <input
                type="number"
                step="0.1"
                value={timeInBusiness}
                onChange={(e) => setTimeInBusiness(Number(e.target.value))}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-950 focus:ring-0"
                required
              />
              <p className="text-[9px] text-neutral-400 font-medium">Length of incorporation listed on Secretary of State filings.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Industry Risk Classification</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold"
              >
                <option value="Professional Services (Low Risk)">Professional Services (Low Risk)</option>
                <option value="E-Commerce & Retail (Medium Risk)">E-Commerce & Retail (Medium Risk)</option>
                <option value="Trucking & Logistics (High Risk)">Trucking & Logistics (High Risk)</option>
                <option value="Real Estate Development (High Risk)">Real Estate Development (High Risk)</option>
              </select>
              <p className="text-[9px] text-neutral-400 font-medium">Underwriters reject high-risk categories automatically or limit limits.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Average Personal FICO Score</label>
              <input
                type="number"
                value={creditScore}
                onChange={(e) => setCreditScore(Number(e.target.value))}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-xs font-bold focus:border-neutral-950 focus:ring-0"
                required
              />
              <p className="text-[9px] text-neutral-400 font-medium">Personal credit file health unlocks zero-guarantee card sequencing.</p>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold uppercase tracking-wider text-xs py-3.5 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {evaluating ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              {evaluating ? "AI Underwriting Evaluation..." : "Recalculate Funding Limits"}
            </button>
          </form>
        </div>

        {/* RESULTS MODULE (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            
            {/* Computed Dial Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
              <div>
                <h3 className="font-display font-black text-base text-neutral-900">Matched Corporate Lending Offers</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Lenders filtered by odds of success and legal credit requirements.</p>
              </div>
              <span className={cn(
                "px-3 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest text-white shrink-0",
                readinessScore >= 80 ? "bg-emerald-600" :
                readinessScore >= 60 ? "bg-blue-600" : "bg-amber-600"
              )}>
                {readinessScore >= 80 ? 'Excellent Approval Odds' :
                 readinessScore >= 60 ? 'Standard Approval Odds' : 'High Credit Risk'}
              </span>
            </div>

            {/* Offer cards list */}
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-2xl border border-neutral-150 bg-neutral-50 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-neutral-900 text-white font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        {offer.lender}
                      </span>
                      <span className="text-xs font-extrabold text-neutral-900">{offer.type}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-semibold">Term Factor: {offer.term}</div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-lg font-black font-display text-neutral-900">${offer.amount.toLocaleString()}</div>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                      offer.odds === 'High' ? "bg-emerald-50 text-emerald-700" :
                      offer.odds === 'Medium' ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                    )}>
                      {offer.odds} Odds
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Micro warning notice */}
            <div className="p-4 bg-blue-50 border border-blue-150 rounded-2xl flex gap-3 text-left">
              <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs text-blue-900 leading-normal">
                <span className="font-extrabold block uppercase tracking-wider text-[10px]">Zero Personal Guarantee Credit Cards Stacking Pathway</span>
                <p className="font-medium text-blue-800">
                  By pairing your LLC formation EIN with your newly repaired personal profiles, we can structure <strong>$45,000+ of zero-interest intro business credit cards</strong>. These balances will report solely to corporate credit bureaus (Experian Business, Equifax Business, Dun & Bradstreet) and won't affect your personal debt ratios.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
