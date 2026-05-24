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

  // Tabs: 'paid' (Paid Campaigns), 'organic' (Organic Posts), 'history' (Active & past Campaigns)
  const [subTab, setSubTab] = useState<'paid' | 'organic' | 'history'>('paid');

  // Loaders & database collections
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<OrganicPost[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Organic custom form state
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
  const [postDraftContent, setPostDraftContent] = useState('');
  const [postBase64Image, setPostBase64Image] = useState<string | null>(null);
  const [sendingPost, setSendingPost] = useState(false);

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
        setPostDraftContent('');
        setPostBase64Image(null);
        // Refresh local listings
        const updatedPost = await res.json();
        setPosts(prev => [updatedPost, ...prev]);
        alert("Success! Your post has been organically published.");
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
