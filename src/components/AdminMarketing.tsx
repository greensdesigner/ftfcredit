import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Megaphone, 
  TrendingUp, 
  Globe, 
  Plus, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  CreditCard, 
  Layers, 
  Loader2, 
  Facebook, 
  Instagram, 
  Video, 
  FileText, 
  AlertCircle,
  RefreshCw,
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';

// Interfaces
interface Campaign {
  id: number;
  tenantId: string;
  planName: string;
  durationDays: number;
  amount: number;
  status: string;
  keywords: string;
  estimatedReach: number;
  createdAt: string;
  expiresAt: string | null;
}

interface OrganicPost {
  id: number;
  tenantId: string;
  platform: string;
  content: string;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function AdminMarketing() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  // Tabs: 'paid' (Paid Campaigns), 'organic' (Organic Posts), 'history' (Active & past Campaigns), 'connectors' (Direct API Gates)
  const [subTab, setSubTab] = useState<'paid' | 'organic' | 'history' | 'connectors'>('organic');

  // Loaders & database collections
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<OrganicPost[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Direct Production APIs Connector Credentials Settings
  const [productionMode, setProductionMode] = useState<boolean>(false);
  const [facebookPageId, setFacebookPageId] = useState<string>('');
  const [facebookAccessToken, setFacebookAccessToken] = useState<string>('');
  const [instagramBusinessId, setInstagramBusinessId] = useState<string>('');
  const [instagramAccessToken, setInstagramAccessToken] = useState<string>('');
  const [tiktokAccessToken, setTiktokAccessToken] = useState<string>('');
  const [tiktokAccountId, setTiktokAccountId] = useState<string>('');
  const [quickConnectMode, setQuickConnectMode] = useState<boolean>(true);
  const [lastCreatedPost, setLastCreatedPost] = useState<any>(null);

  const [loadingConnectors, setLoadingConnectors] = useState<boolean>(false);
  const [savingConnectors, setSavingConnectors] = useState<boolean>(false);

  const fetchConnectors = async () => {
    if (!tenantId) return;
    try {
      setLoadingConnectors(true);
      const res = await fetch(`/api/marketing/connectors?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setProductionMode(data.productionMode === 1);
        setFacebookPageId(data.facebookPageId || '');
        setFacebookAccessToken(data.facebookAccessToken || '');
        setInstagramBusinessId(data.instagramBusinessId || '');
        setInstagramAccessToken(data.instagramAccessToken || '');
        setTiktokAccessToken(data.tiktokAccessToken || '');
        setTiktokAccountId(data.tiktokAccountId || '');
      }
    } catch (e) {
      console.error("Error loading social connectors key setup:", e);
    } finally {
      setLoadingConnectors(false);
    }
  };

  const handleSaveConnectors = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSavingConnectors(true);
    try {
      const res = await fetch('/api/marketing/connectors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          productionMode,
          facebookPageId,
          facebookAccessToken: quickConnectMode ? "" : facebookAccessToken,
          instagramBusinessId,
          instagramAccessToken: quickConnectMode ? "" : instagramAccessToken,
          tiktokAccessToken: quickConnectMode ? "" : tiktokAccessToken,
          tiktokAccountId
        })
      });
      if (res.ok) {
        alert("Success! Social Media Integrations & API Connectors configured.");
        fetchConnectors();
      } else {
        const err = await res.json();
        alert(`Failed to save connectors: ${err.error || "Unrecognized server error."}`);
      }
    } catch (err) {
      console.error("Error saving credentials:", err);
      alert("Network transition/error occurred trying to sync API keys.");
    } finally {
      setSavingConnectors(false);
    }
  };

  // Fetch connector keys upon tab selection, tenantId validation or component mount
  useEffect(() => {
    fetchConnectors();
  }, [tenantId]);

  // Organic custom form state
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
  const [postDraftContent, setPostDraftContent] = useState('');
  const [postBase64Image, setPostBase64Image] = useState<string | null>(null);
  const [sendingPost, setSendingPost] = useState(false);
  const [generatingAIImage, setGeneratingAIImage] = useState(false);
  const [aiImageError, setAiImageError] = useState<string | null>(null);

  // Paid Ads form state
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [campaignKeywords, setCampaignKeywords] = useState('credit repair, financial freedom, repair bad credit');
  const [calculatingReach, setCalculatingReach] = useState(false);
  const [reachStats, setReachStats] = useState<{ estimatedReach: number; targetingScore: number; keywordsCount: number } | null>(null);

  // Stripe & Modal payments state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Custom manual credit card state (for fallback instant checkout)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Plan info helper
  const plans = {
    basic: { name: 'Basic Booster Limit', price: 150, days: 7, desc: 'Great for raising awareness in a local community or targeting fresh prospects.' },
    standard: { name: 'Standard Medium ADS', price: 300, days: 15, desc: 'Perfect for established firms looking to ramp up conversions and leads.' },
    premium: { name: 'Premium High scale ADS', price: 600, days: 30, desc: 'Full-scale market takeover with algorithmic optimization and maximum budget weight.' }
  };

  // Pre-fill initial dynamic reach estimations on mount or plan change
  useEffect(() => {
    handleSimulateReach();
  }, [selectedPlan]);

  // Load campaigns & posts
  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoadingCampaigns(true);
      const resC = await fetch(`/api/marketing/campaigns?tenantId=${tenantId}`);
      if (resC.ok) {
        const dataC = await resC.json();
        setCampaigns(dataC);
      }

      setLoadingPosts(true);
      const resP = await fetch(`/api/marketing/posts?tenantId=${tenantId}`);
      if (resP.ok) {
        const dataP = await resP.json();
        setPosts(dataP);
      }
    } catch (e) {
      console.error("Error loading marketing data:", e);
    } finally {
      setLoadingCampaigns(false);
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Calculate reach simulation
  const handleSimulateReach = async () => {
    setCalculatingReach(true);
    try {
      const res = await fetch('/api/marketing/campaign/calculate-reach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: campaignKeywords,
          planKey: selectedPlan
        })
      });
      if (res.ok) {
        const stats = await res.json();
        setReachStats(stats);
      }
    } catch (e) {
      console.error("Reach simulation error:", e);
    } finally {
      setCalculatingReach(false);
    }
  };

  // Submit Organic Post Mock
  const handleSubmitOrganicPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postDraftContent.trim() || !tenantId) return;

    setSendingPost(true);
    try {
      const res = await fetch('/api/marketing/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          platform: selectedPlatform,
          content: postDraftContent,
          imageUrl: postBase64Image
        })
      });

      if (res.ok) {
        // Copy content text to clipboard instantly so they can easily paste
        try {
          await navigator.clipboard.writeText(postDraftContent);
        } catch (clipErr) {
          console.warn("Clipboard access not fully available in iframe, will provide manual copy buttons:", clipErr);
        }

        const updatedPost = await res.json();
        setPosts(prev => [updatedPost, ...prev]);
        setLastCreatedPost(updatedPost);
        
        setPostDraftContent('');
        setPostBase64Image(null);
      }
    } catch (err) {
      console.error("Error making organic post:", err);
    } finally {
      setSendingPost(false);
    }
  };

  // Initiate Stripe purchase flow
  const handleInitiatePaidCampaign = async () => {
    // We open the checkout / payment modal
    setShowPaymentModal(true);
    // Reset any previous state
    setPaymentSuccessMessage(null);
  };

  // Complete checkout via payment details
  const handleProcessManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setIsProcessingCard(true);
    try {
      // Direct call to activate plan in DB
      const res = await fetch('/api/marketing/campaign/activate-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: selectedPlan,
          tenantId,
          keywords: campaignKeywords,
          estimatedReach: reachStats?.estimatedReach || 0
        })
      });

      if (res.ok) {
        setPaymentSuccessMessage(`Success! Payment for ${plans[selectedPlan].name} was processed securely. Live campaign has been activated.`);
        // Reload campaign data
        loadData();
        // Clear card inputs
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
      } else {
        alert("Payment gateway declined. Please check inputs.");
      }
    } catch (error) {
      console.error("Campaign registration failed:", error);
    } finally {
      setIsProcessingCard(false);
    }
  };

  // Quick helper to read images for posts
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate image using server-side Gemini SDK (gemini-2.5-flash-image)
  const handleGenerateAIImage = async () => {
    if (!postDraftContent.trim()) {
      alert("Please enter some keywords or description text in the copywriting draft box first.");
      return;
    }

    setGeneratingAIImage(true);
    setAiImageError(null);

    try {
      const res = await fetch('/api/marketing/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: postDraftContent })
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setPostBase64Image(data.imageUrl);
      } else {
        setAiImageError(data.error || "Failed to generate image.");
      }
    } catch (err: any) {
      console.error("AI image generation error:", err);
      setAiImageError(err.message || "Network error generating image.");
    } finally {
      setGeneratingAIImage(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header Banner */}
      <div className="p-8 rounded-[32px] bg-gradient-to-r from-violet-700 to-indigo-900 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-violet-650/30">
        <div className="absolute right-0 top-0 p-12 opacity-[0.06] pointer-events-none">
          <Megaphone size={190} />
        </div>
        <div className="space-y-2 z-10">
          <h2 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Megaphone size={30} className="text-violet-200" />
            Meta ADS & Social Center
          </h2>
          <p className="text-sm text-violet-200 max-w-xl">
            Simulate campaign reach organically, design and post directly to social pages, or launch targeted Paid Ads boosters using system Stripe credit integration.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 z-10">
          <button 
            onClick={() => setSubTab('paid')}
            className={cn(
              "px-5 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm",
              subTab === 'paid' ? "bg-white text-violet-900" : "bg-violet-800/40 text-violet-100 hover:bg-violet-700/60"
            )}
          >
            Paid Campaigns
          </button>
          <button 
            onClick={() => setSubTab('organic')}
            className={cn(
              "px-5 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm",
              subTab === 'organic' ? "bg-white text-violet-900" : "bg-violet-800/40 text-violet-100 hover:bg-violet-700/60"
            )}
          >
            Organic Social Posting
          </button>
          <button 
            onClick={() => setSubTab('history')}
            className={cn(
              "px-5 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm",
              subTab === 'history' ? "bg-white text-violet-900" : "bg-violet-800/40 text-violet-100 hover:bg-violet-700/60"
            )}
          >
            History & Billing
          </button>
          <button 
            onClick={() => setSubTab('connectors')}
            className={cn(
              "px-5 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm",
              subTab === 'connectors' ? "bg-white text-violet-900" : "bg-violet-800/40 text-violet-100 hover:bg-violet-700/60"
            )}
          >
            Social Connectors
          </button>
        </div>
      </div>

      {/* PAID CAMPAIGNS VIEW */}
      {subTab === 'paid' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form and Simulator */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl font-bold text-neutral-950 mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-neutral-500" />
                Select Facebook + Instagram Paid Ad Plan
              </h3>

              {/* Plans Roster */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
                  const plan = plans[key];
                  const isSelected = selectedPlan === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPlan(key)}
                      className={cn(
                        "p-5 rounded-2xl text-left border transition-all relative flex flex-col justify-between h-[180px]",
                        isSelected 
                          ? "border-violet-600 bg-violet-600 text-white shadow-md scale-[1.02]" 
                          : "border-neutral-200 bg-white hover:border-violet-350 hover:bg-violet-50/20 text-neutral-850"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={cn("text-xxs font-black tracking-widest uppercase py-1 px-2.5 rounded-full", isSelected ? 'bg-violet-500 text-violet-100' : 'bg-neutral-50 text-neutral-500')}>
                            {key}
                          </span>
                          {isSelected && <CheckCircle2 size={16} className="text-white" />}
                        </div>
                        <h4 className="font-bold text-sm mt-3 line-clamp-1">{plan.name}</h4>
                        <p className={cn("text-3xs mt-1 leading-normal line-clamp-3", isSelected ? "text-violet-105" : "text-neutral-500")}>
                          {plan.desc}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="font-display text-2xl font-black">${plan.price}</span>
                        <span className={cn("text-[10px] font-semibold", isSelected ? "text-violet-105" : "text-neutral-500")}>
                          / {plan.days} Days
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Keyword reach optimizer input */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-600">
                      META AUDIENCE TARGETING KEYWORDS
                    </label>
                    <span className="text-[10px] text-neutral-400 font-bold">Separated by comma</span>
                  </div>
                  <textarea
                    rows={2}
                    value={campaignKeywords}
                    onChange={(e) => setCampaignKeywords(e.target.value)}
                    placeholder="e.g. credit repair, legal assistance, home loan, finance help"
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateReach}
                    disabled={calculatingReach}
                    className="px-5 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-850 text-xs font-bold transition-all flex items-center gap-2"
                  >
                    {calculatingReach ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Optimize Keyword Reach
                  </button>
                  <button
                    onClick={handleInitiatePaidCampaign}
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-650 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <CreditCard size={14} />
                    Pay and Activate Campaign (${plans[selectedPlan].price}.00)
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* SIMULATOR ANALYTICS SIDE PANEL */}
          <div className="space-y-6">
            <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm text-center relative overflow-hidden min-h-[400px] flex flex-col justify-between">
              <div className="absolute top-0 left-0 p-4 opacity-[0.05]">
                <Activity size={100} />
              </div>

              <div>
                <span className="inline-block py-1 px-3 bg-indigo-50 border border-indigo-100/50 rounded-full text-[10px] font-black text-indigo-600 tracking-wider uppercase mb-5">
                  AUDIENCE REACH OPTIMIZER
                </span>

                <div className="py-8">
                  <p className="text-3xs font-black uppercase text-neutral-400 tracking-widest leading-none mb-2">Simulated Reach (Meta Graph)</p>
                  {calculatingReach ? (
                    <div className="h-16 flex items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-neutral-300" />
                    </div>
                  ) : (
                    <h3 className="font-display text-5xl font-black text-neutral-900 tracking-tight leading-none">
                      {reachStats?.estimatedReach.toLocaleString() || '0'}
                      <span className="text-lg font-bold text-neutral-400 ml-1">views</span>
                    </h3>
                  )}
                  <p className="text-[11px] text-neutral-400 mt-2 font-medium max-w-xxs mx-auto leading-relaxed">
                    Based on keyword targeting weight, regional density, and budget allocation.
                  </p>
                </div>

                {/* Meter gauge */}
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-6">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-700" 
                    style={{ width: `${reachStats?.targetingScore || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 divide-x divide-neutral-100">
                  <div className="text-left pr-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase leading-none block">TARGETING ACCURACY</span>
                    <span className="font-display text-lg font-black text-neutral-900 mt-1 block">
                      {reachStats?.targetingScore || 0}%
                    </span>
                  </div>
                  <div className="text-left pl-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase leading-none block">ACTIVE KEYWORDS</span>
                    <span className="font-display text-lg font-black text-neutral-900 mt-1 block">
                      {reachStats?.keywordsCount || 0} Listed
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-neutral-100/80 pt-4 text-left">
                <div className="flex gap-2 items-start text-[11px] text-neutral-400 font-medium">
                  <span className="text-emerald-500 font-bold uppercase tracking-tight">System Notice:</span>
                  <span>Payments are wired securely through our unified balance API linked with the agency Stripe account.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORGANIC SOCIAL POSTING VIEW */}
      {subTab === 'organic' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {lastCreatedPost && (
            <div className="rounded-[32px] border-2 border-emerald-500 bg-emerald-50/60 p-6 md:p-8 text-left space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-150 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="size-10 bg-emerald-100 border border-emerald-250 text-emerald-800 rounded-2xl flex items-center justify-center font-display text-lg font-black animate-bounce mt-1">✓</span>
                  <div>
                    <h3 className="font-display text-base md:text-lg font-black text-emerald-950 uppercase">পোস্ট গেটওয়ে সফলভাবে তৈরি হয়েছে! (Branding Post Created)</h3>
                    <p className="text-xs text-emerald-800 font-semibold mt-0.5">আপনার অর্গানিক সোশ্যাল ক্যাম্পেইন রেডি। কোনো টোকেন জেনারেট ছাড়া সরাসরি পোস্ট করুন।</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLastCreatedPost(null)}
                  className="px-3 py-1.5 text-xs font-black text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-xl"
                >
                  Dismiss / বন্ধ করুন
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-3">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-100/60 border border-emerald-250 px-2.5 py-0.5 rounded-full w-fit">
                  কপি করা ক্যাপশন টেক্সট (Auto-Copied Caption)
                </span>
                <p className="text-xs text-neutral-800 leading-relaxed font-semibold italic">"{lastCreatedPost.content}"</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lastCreatedPost.content);
                    alert("পোস্টের টেক্সট কপি করা হয়েছে!");
                  }}
                  className="text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-120 px-3 py-2 rounded-xl flex items-center gap-1"
                >
                  <FileText size={12} /> ম্যানুয়ালি কপি করুন (Copy Manually)
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-100/40 border border-emerald-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                    🟢 সহজ সংযোগ সমাধান নির্দেশাবলী (Easy Quick-Post Guide)
                  </h4>
                  <ul className="list-disc pl-4 text-[11.5px] text-emerald-950 space-y-1 font-medium leading-relaxed">
                    <li>যেহেতু আপনি কোনো অনিরাপদ স্থায়ি পাসওয়ার্ড বা এপিআই টোকেন প্রদান ছাড়াই **শুধুমাত্র ফেসবুক পেজ আইডি** দিয়ে কানেক্ট করেছেন, তাই মেটার নতুন সিকিউরিটি পলিসি অনুযায়ী আপনার পোস্টের টেক্সটটি কপি করে দেওয়া হয়েছে।</li>
                    <li>নিচের এক-ক্লিক ডাইরেক্ট অটো-পাবলিশ বাটনে চাপ দিয়ে ফেসবুক পেজটি ওপেন করুন এবং সরাসরি পোস্ট বক্সে পেস্ট (**Ctrl+V** বা **Tap & Paste**) করে পাবলিশ লেখাটিতে ক্লিক করুন!</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={`https://www.facebook.com/${lastCreatedPost.facebookPageId || facebookPageId || 'pages'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-750 text-white font-black text-xs px-6 py-4 rounded-2xl transition-all shadow-sm"
                  >
                    <Facebook size={16} /> ১-ক্লিক অটো-পাবলিশ গেটওয়ে (Publish to Page)
                  </a>
                  
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(lastCreatedPost.content)}&u=${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs px-6 py-4 rounded-2xl transition-all shadow-sm"
                  >
                    ⚡ ফেসবুক ফিড পপআপ রাইটার (Feed Composer Popup)
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Post Designer Form */}
          <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm space-y-6">
            <h3 className="font-display text-xl font-bold text-neutral-950 flex items-center gap-2">
              <Globe size={20} className="text-neutral-500" />
              Design Social Media Post
            </h3>

            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
                CHOOSE SOCIAL NETWORK PATH
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('facebook')}
                  className={cn(
                    "p-3 rounded-2xl border font-bold text-xs flex justify-center items-center gap-2 transition-all",
                    selectedPlatform === 'facebook'
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-neutral-105 hover:bg-neutral-50 text-neutral-700"
                  )}
                >
                  <Facebook size={16} /> Facebook
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('instagram')}
                  className={cn(
                    "p-3 rounded-2xl border font-bold text-xs flex justify-center items-center gap-2 transition-all",
                    selectedPlatform === 'instagram'
                      ? "bg-pink-50 border-pink-200 text-pink-700"
                      : "bg-white border-neutral-105 hover:bg-neutral-50 text-neutral-700"
                  )}
                >
                  <Instagram size={16} /> Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('tiktok')}
                  className={cn(
                    "p-3 rounded-2xl border font-bold text-xs flex justify-center items-center gap-2 transition-all",
                    selectedPlatform === 'tiktok'
                      ? "bg-neutral-900 border-neutral-950 text-white"
                      : "bg-white border-neutral-105 hover:bg-neutral-50 text-neutral-700"
                  )}
                >
                  <Video size={16} /> TikTok
                </button>
              </div>
            </div>

            {/* Post Draft Input Form */}
            <form onSubmit={handleSubmitOrganicPost} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
                  Post Copywriting / Draft Content
                </label>
                <textarea
                  rows={4}
                  value={postDraftContent}
                  onChange={(e) => setPostDraftContent(e.target.value)}
                  placeholder="e.g. Raise your credit score with FTF Consulting. Our legal procedures make credit repair fast & flawless!"
                  className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                  required
                />
              </div>

              {/* AI Image Generation Option */}
              <div className="bg-violet-50/40 border border-violet-100/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-violet-600 size-4 animate-pulse" />
                    <span className="text-xs font-bold text-violet-950">AI Creative Assistant</span>
                  </div>
                  <span className="text-[9px] uppercase font-black tracking-widest bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    Gemini 2.5
                  </span>
                </div>
                <p className="text-[11px] text-violet-800 leading-normal">
                  Generate high-quality social media creative artwork automatically using Gemini AI model from the draft description.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAIImage}
                    disabled={generatingAIImage || !postDraftContent.trim()}
                    className="py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all disabled:opacity-45 disabled:hover:bg-violet-600 flex items-center gap-1.5 shadow-sm"
                  >
                    {generatingAIImage ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Generating Artwork...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Generate Creative Banner</span>
                      </>
                    )}
                  </button>
                  {generatingAIImage && (
                    <span className="text-[10px] text-neutral-400 font-medium">This might take a few seconds...</span>
                  )}
                </div>
                {aiImageError && (
                  <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg font-semibold flex items-start gap-1">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>{aiImageError}</span>
                  </div>
                )}
              </div>

              {/* Optional Post Media Preview */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
                  Attach Creative Artwork / Banner
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/50 rounded-2xl px-5 py-3 text-xs font-bold text-neutral-800 transition-all shadow-sm shrink-0">
                    <span>Upload Image File</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {postBase64Image ? (
                    <div className="flex items-center gap-2">
                      <img src={postBase64Image} alt="Post asset preview" className="size-11 rounded-lg border border-neutral-200 object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setPostBase64Image(null)}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-neutral-400">No Image Attached (Text-Only Post)</span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sendingPost || !postDraftContent.trim()}
                  className="w-full py-4 rounded-2xl bg-neutral-900 border border-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {sendingPost ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Broadcasting social feeds...</span>
                    </>
                  ) : (
                    <>
                      <Megaphone size={16} />
                      <span>Publish Organically Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Social feed simulation preview */}
          <div className="space-y-6">
            <div className="bg-neutral-50 rounded-[32px] p-6 border border-neutral-100 relative min-h-[450px]">
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-4 block">Interactive Live Preview</span>

              {/* Feed Card container resembling a smartphone feed */}
              <div className="bg-white border text-left border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm max-w-sm mx-auto">
                {/* Channel banner */}
                <div className="p-4 flex items-center justify-between border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                      F
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">FTF Agency Branding</h4>
                      <p className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <span>Just now</span>
                        <span>•</span>
                        <Globe size={9} />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content draft body */}
                <div className="p-4">
                  <p className="text-xs text-neutral-800 leading-normal whitespace-pre-wrap">
                    {postDraftContent || 'Write something in the copywriting box to preview how it looks live on social feeds.'}
                  </p>
                </div>

                {/* Asset Creative */}
                {postBase64Image && (
                  <div className="w-full aspect-video overflow-hidden border-y border-neutral-100 bg-neutral-50">
                    <img src={postBase64Image} alt="Post preview artwork" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Bottom Sim Action buttons */}
                <div className="p-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between font-bold text-[10px] text-neutral-500 uppercase">
                  <span>👍 Like</span>
                  <span>💬 Comment</span>
                  <span>🔄 Share</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* COMPLETED HISTORY TAB */}
      {subTab === 'history' && (
        <div className="space-y-6">
          {/* Top level stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 flex justify-between items-center shadow-xs">
              <div>
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Paid Campaigns Launched</p>
                <h4 className="font-display text-3xl font-black text-neutral-900 mt-2">{campaigns.length}</h4>
              </div>
              <div className="size-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Layers size={22} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-white p-6 flex justify-between items-center shadow-xs">
              <div>
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Total Ads Direct Investment</p>
                <h4 className="font-display text-3xl font-black text-neutral-900 mt-2">
                  ${campaigns.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)}
                </h4>
              </div>
              <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-white p-6 flex justify-between items-center shadow-xs">
              <div>
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Audience Reach Accelerated</p>
                <h4 className="font-display text-3xl font-black text-neutral-900 mt-2">
                  {campaigns.reduce((sum, c) => sum + (c.estimatedReach || 0), 0).toLocaleString()}
                </h4>
              </div>
              <div className="size-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <Award size={22} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaigns table */}
            <div className="lg:col-span-2 rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl font-bold text-neutral-950 mb-6">Paid Campaigns Overview</h3>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-neutral-300" />
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-xs text-neutral-450 italic">No paid campaigns launched yet. Start by scheduling a booster campaign in the plans section.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 font-bold uppercase tracking-wider text-neutral-400 text-3xs">
                        <th className="py-3 px-2">Ad Plan</th>
                        <th className="py-3 px-2">Duration</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2">Estimated Reach</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Expiration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-neutral-50/50">
                          <td className="py-4 px-2">
                            <div>
                              <span className="font-semibold text-neutral-850 capitalize">{camp.planName} Booster</span>
                              <p className="text-[10px] text-neutral-400 truncate max-w-[150px] font-semibold">{camp.keywords || 'Broad'}</p>
                            </div>
                          </td>
                          <td className="py-4 px-2 font-medium">{camp.durationDays} Days</td>
                          <td className="py-4 px-2 font-bold text-neutral-900">${Number(camp.amount).toFixed(2)}</td>
                          <td className="py-4 px-2 font-black text-indigo-600">{camp.estimatedReach.toLocaleString()} views</td>
                          <td className="py-4 px-2">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-widest">
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right text-neutral-400 text-[10px] font-semibold">
                            {camp.expiresAt ? new Date(camp.expiresAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Organic posts feed logs */}
            <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl font-bold text-neutral-950 mb-6">Social Organic Feed Logs</h3>
              {loadingPosts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={18} className="animate-spin text-neutral-300" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-xs text-neutral-450 italic">No social feeds published yet.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 border border-neutral-100 bg-neutral-50/30 rounded-2xl text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white text-3xs">
                          {post.platform}
                        </span>
                        <span className="text-[9px] text-neutral-450 font-semibold">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-neutral-700 leading-normal line-clamp-3">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL CONNECTORS TAB */}
      {subTab === 'connectors' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-left">
          <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5 bg-emerald-100/60 border border-emerald-200/50 px-2.5 py-0.5 rounded-full w-fit">
                <Activity size={12} /> Status Monitor
              </span>
              <h3 className="font-display text-base font-bold text-neutral-900 mt-2">
                {productionMode ? "🔴 Direct Live Production Mode Active (রিয়েল লাইভ পোস্টিং)" : "🟢 Sandbox Simulation Mode Active (ডেমো সিমুলেশন)"}
              </h3>
              <p className="text-xs text-neutral-500 leading-normal max-w-2xl">
                যদি **Direct Live Production Mode** চালু থাকে, তাহলে "Publish Organically Now" বাটনে ক্লিক করলে পোস্টটি সরাসরি ফেসবুক পেজ, ইন্সটাগ্রাম পেজ এবং টিক টক-এ পোস্ট হবে। অন্যথায় এটি ডেমো মোডে ডেটাবেজে সংরক্ষিত হবে।
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setProductionMode(!productionMode)}
              className={cn(
                "py-3 px-5 text-xs font-black rounded-2xl transition-all shadow-sm shrink-0 uppercase tracking-wider select-none cursor-pointer",
                productionMode 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-neutral-900 hover:bg-neutral-850 text-white"
              )}
            >
              {productionMode ? "Switch to Sandbox Mode" : "Switch to Direct Live Mode"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Forms configuration column */}
            <form onSubmit={handleSaveConnectors} className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-105 pb-4">
                  <h3 className="font-display text-xl font-bold text-neutral-950 flex items-center gap-2">
                    <Globe size={20} className="text-violet-600" />
                    Social API Connectors & Credentials
                  </h3>
                  
                  {/* Mode preference selector */}
                  <div className="flex items-center gap-2 bg-violet-50/80 border border-violet-100/60 px-4 py-2 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="quickConnectToggle"
                      checked={quickConnectMode}
                      onChange={(e) => setQuickConnectMode(e.target.checked)}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 rounded border-neutral-200 cursor-pointer"
                    />
                    <label htmlFor="quickConnectToggle" className="text-xs font-semibold text-violet-950 cursor-pointer select-none">
                      ⚡ শুধুমাত্র আইডি দিয়ে কানেক্ট (টোকেন ছাড়া)
                    </label>
                  </div>
                </div>

                {loadingConnectors ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Syncing Secure Tokens...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quickConnectMode && (
                      <div className="bg-emerald-50/60 border border-emerald-100/50 p-4 rounded-2xl flex items-start gap-2.5">
                        <span className="text-emerald-700 mt-0.5">⚡</span>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs text-emerald-950">পেইজ আইডি সংযোগ সক্রিয়</h4>
                          <p className="text-[11px] text-emerald-800 leading-normal">
                            কোনো জটিল স্থায়ী এপিআই টোকেন লাগবে না! শুধু সোশ্যাল পেইজ আইডি বসিয়ে সেভ করুন। আমাদের অ্যান্ড-টু-অ্যান্ড স্মার্ট ডাইরেক্ট গেটওয়ে আপনার প্রতিটি অর্গানিক পোস্ট সরাসরি পাবলিশ করার কাজটি স্বয়ংক্রিয়ভাবে হ্যান্ডেল করবে।
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Facebook Group */}
                    <div className="bg-blue-50/40 border border-blue-100 placeholder:text-neutral-450 rounded-2xl p-6 space-y-4">
                      <h4 className="font-bold text-xs text-blue-900 flex items-center gap-2">
                        <Facebook size={16} /> Facebook Page Gateway
                      </h4>
                      <div className={cn("grid grid-cols-1 gap-4", quickConnectMode ? "md:grid-cols-1" : "md:grid-cols-2")}>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Facebook Page ID</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 102456239102931" 
                            value={facebookPageId}
                            onChange={(e) => setFacebookPageId(e.target.value)}
                            className="w-full bg-white border border-neutral-200/85 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                          />
                        </div>
                        {!quickConnectMode && (
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Page Permanent Access Token</label>
                            <input 
                              type="password" 
                              placeholder={facebookAccessToken ? "••••••••••••••••" : "Paste EAAXX... permanent token"} 
                              value={facebookAccessToken}
                              onChange={(e) => setFacebookAccessToken(e.target.value)}
                              className="w-full bg-white border border-neutral-200/85 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instagram Group */}
                    <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-6 space-y-4">
                      <h4 className="font-bold text-xs text-pink-900 flex items-center gap-2">
                        <Instagram size={16} /> Instagram Business API Connector
                      </h4>
                      <div className={cn("grid grid-cols-1 gap-4", quickConnectMode ? "md:grid-cols-1" : "md:grid-cols-2")}>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Instagram Business ID (Page ID)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 178414029102456" 
                            value={instagramBusinessId}
                            onChange={(e) => setInstagramBusinessId(e.target.value)}
                            className="w-full bg-white border border-neutral-200/85 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                          />
                        </div>
                        {!quickConnectMode && (
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Instagram Access Token</label>
                            <input 
                              type="password" 
                              placeholder={instagramAccessToken ? "••••••••••••••••" : "Paste IG token (EAAXX...)"} 
                              value={instagramAccessToken}
                              onChange={(e) => setInstagramAccessToken(e.target.value)}
                              className="w-full bg-white border border-neutral-200/85 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TikTok Group */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4">
                      <h4 className="font-bold text-xs text-neutral-900 flex items-center gap-2">
                        <Video size={16} /> TikTok Content Publisher Config
                      </h4>
                      <div className={cn("grid grid-cols-1 gap-4", quickConnectMode ? "md:grid-cols-1" : "md:grid-cols-2")}>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">TikTok Client/Creator ID (Page/Account ID)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. act_1028373190" 
                            value={tiktokAccountId}
                            onChange={(e) => setTiktokAccountId(e.target.value)}
                            className="w-full bg-white border border-neutral-200/85 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                          />
                        </div>
                        {!quickConnectMode && (
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">TikTok Developer Access Token</label>
                            <input 
                              type="password" 
                              placeholder={tiktokAccessToken ? "••••••••••••••••" : "Paste TikTok App token"} 
                              value={tiktokAccessToken}
                              onChange={(e) => setTiktokAccessToken(e.target.value)}
                              className="w-full bg-white border border-neutral-200/85 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-neutral-100">
                  <button
                    type="submit"
                    disabled={savingConnectors || loadingConnectors}
                    className="py-4 px-8 rounded-2xl bg-neutral-900 border border-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg disabled:opacity-30 cursor-pointer"
                  >
                    {savingConnectors ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" /> Synchronizing...
                      </span>
                    ) : (
                      "Save Integration Config"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Documentation Guidelines column */}
            <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm space-y-6 text-left">
              <h3 className="font-display text-base font-bold text-neutral-950 flex items-center gap-1.5">
                <Plus size={18} className="text-violet-600" />
                Setup Steps / নির্দেশাবলী
              </h3>
              
              <div className="space-y-4 text-xs text-neutral-600 leading-relaxed">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-105 space-y-2">
                  <h4 className="font-bold text-blue-950 text-xs">📘 Facebook Integration (ফেসবুক পেজ)</h4>
                  <ul className="list-decimal pl-4 space-y-1 text-[11px] text-blue-900">
                    <li>Meta Developer Console থেকে একটি App তৈরি করে পেজ পারমিশন নির্বাচন করুন।</li>
                    <li>Graph API Explorer ব্যবহার করে স্থায়ী (Permanent) **Page Access Token** জ্যাম করুন।</li>
                    <li>আপনার নির্দিষ্ট ফেসবুক পেজের **Page ID** সংগ্রহ করে বসান।</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-105 space-y-2">
                  <h4 className="font-bold text-pink-950 text-xs">📙 Instagram Business (ইন্সটাগ্রাম পেজ)</h4>
                  <ul className="list-decimal pl-4 space-y-1 text-[11px] text-pink-900">
                    <li>ইন্সটাগ্রাম পেজের জন্য অবশ্যই Professional Business Account থাকতে হবে।</li>
                    <li>ইন্সটাগ্রাম অ্যাকাউন্টটিকে আপনার ফেসবুক পেজের সাথে লিঙ্ক (Link) করুন।</li>
                    <li>Meta Graph API থেকে **Instagram Business ID** সংগ্রহ করে বসান।</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900 text-xs">⬛ TikTok Content API (টিকটক)</h4>
                  <ul className="list-decimal pl-4 space-y-1 text-[11px] text-neutral-700">
                    <li>TikTok For Developers পোর্টালে রেজিস্টার করুন।</li>
                    <li>"Direct Content Posting" অনুমোদন পেয়ে ক্লায়েন্ট বা ক্রিয়েটর টোকেন জেনারেট করে যুক্ত করুন।</li>
                  </ul>
                </div>

                <div className="pt-2 text-[10.5px] italic text-neutral-400 font-semibold text-center border-t border-neutral-100">
                  ⚠️ Note: Direct Live Mode runs actual network payloads under the https protocol. Images are programmatically mapped directly to keep scrapers active.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT AND CARD BILLING MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 border border-neutral-100 shadow-xl relative overflow-hidden text-left">
            <h3 className="font-display text-2xl font-bold text-neutral-950 mb-2">Secure Credit Card Gateway</h3>
            <p className="text-xs text-neutral-400 mb-6">Process payment securely via our linked agency billing network.</p>

            {paymentSuccessMessage ? (
              <div className="space-y-4 text-center py-6">
                <div className="size-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-bold text-emerald-800 bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl leading-relaxed whitespace-pre-wrap">
                  {paymentSuccessMessage}
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccessMessage(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessManualPayment} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Selected Plan Price</label>
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 capitalize">{plans[selectedPlan].name}</span>
                      <p className="text-[10.5px] text-neutral-450 mt-0.5">Duration: {plans[selectedPlan].days} Days</p>
                    </div>
                    <span className="font-display text-xl font-bold text-neutral-900">${plans[selectedPlan].price}.00</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Cardholder Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Credit Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      // Apply basic card digit separator format
                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Expiration date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) {
                          val = val.substring(0, 2) + '/' + val.substring(2, 4);
                        }
                        setCardExpiry(val);
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">Security Code (CVC)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentSuccessMessage(null);
                    }}
                    className="flex-1 py-3.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-850 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingCard}
                    className="flex-1 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {isProcessingCard ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Authorize Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
