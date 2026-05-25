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
  const [optimizingContent, setOptimizingContent] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

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

  // Handle checking URL parameters for Stripe checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get('payment_success') === 'true';
    const planKey = params.get('planKey');
    const keywords = params.get('keywords');
    const reach = parseInt(params.get('reach') || '0', 10);

    if (paymentSuccess && planKey && tenantId) {
      const autoActivate = async () => {
        try {
          const res = await fetch('/api/marketing/campaign/activate-mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planKey,
              tenantId,
              keywords: decodeURIComponent(keywords || ''),
              estimatedReach: reach
            })
          });

          if (res.ok) {
            setPaymentSuccessMessage(`Success! Payment for ${plans[planKey as 'basic' | 'standard' | 'premium']?.name || 'Booster Campaign'} was processed securely via Stripe. Your live paid campaign has been successfully activated.`);
            setShowPaymentModal(true);
            loadData();
          }
        } catch (error) {
          console.error("Auto activation of paid campaign failed:", error);
        } finally {
          // Clean up the URL search params elegantly without reloading the page
          const cleanUrl = window.location.pathname + '?tab=marketing';
          window.history.replaceState({}, document.title, cleanUrl);
        }
      };

      autoActivate();
    }
  }, [tenantId]);

  // Initiate Stripe purchase flow
  const handleInitiatePaidCampaign = async () => {
    // We open the checkout / payment modal
    setShowPaymentModal(true);
    // Reset any previous state
    setPaymentSuccessMessage(null);
  };

  // Pay securely using real Stripe Checkout Session
  const handlePayWithStripeCheckout = async () => {
    if (!tenantId) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/marketing/campaign/checkout', {
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
        const data = await res.json();
        if (data.url) {
          // Redirect the user’s window to the secure Stripe-hosted Checkout Page
          window.location.href = data.url;
        } else if (data.fallbackSimulate) {
          // Fallback if Stripe credentials are not bound yet
          alert("Stripe credentials are not fully bound in the server configuration. Activating campaign in Demo Simulator Mode.");
          const runFallback = async () => {
            const fallbackRes = await fetch('/api/marketing/campaign/activate-mock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planKey: selectedPlan,
                tenantId,
                keywords: campaignKeywords,
                estimatedReach: reachStats?.estimatedReach || 0
              })
            });

            if (fallbackRes.ok) {
              setPaymentSuccessMessage(`Success! Your booster campaign (${plans[selectedPlan].name}) has been activated in Simulator Demo Mode.`);
              loadData();
            }
          };
          await runFallback();
        }
      } else {
        alert("Failed to create Stripe checkout session. Please check backend environment configuration.");
      }
    } catch (err: any) {
      console.error("Stripe Checkout Session Error:", err);
      alert("Error starting Stripe payment: " + err.message);
    } finally {
      setCheckoutLoading(false);
    }
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

  // Convert messy description or keywords into a beautiful structured social copywriting
  const handleOptimizeContent = async () => {
    if (!postDraftContent.trim()) {
      alert("Please key in some draft text or keywords in the box to optimize.");
      return;
    }

    setOptimizingContent(true);
    setOptimizeError(null);

    try {
      const res = await fetch('/api/marketing/optimize-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: postDraftContent })
      });

      const data = await res.json();
      if (res.ok && data.optimizedContent) {
        setPostDraftContent(data.optimizedContent);
      } else {
        setOptimizeError(data.error || "Failed to optimize post content.");
      }
    } catch (err: any) {
      console.error("Content optimization error:", err);
      setOptimizeError(err.message || "A network connectivity issue occurred.");
    } finally {
      setOptimizingContent(false);
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
      <div className="p-10 rounded-[32px] bg-gradient-to-r from-violet-700 to-indigo-900 text-white relative overflow-hidden shadow-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 border border-violet-650/40">
        <div className="absolute right-0 top-0 p-12 opacity-[0.06] pointer-events-none">
          <Megaphone size={190} />
        </div>
        <div className="space-y-3 z-10">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Megaphone size={36} className="text-violet-200 shrink-0" />
            Meta ADS & Social Center
          </h2>
          <p className="text-sm md:text-base font-medium text-violet-100 max-w-2xl leading-relaxed">
            Simulate campaign reach organically, design and post directly to social pages, or launch targeted Paid Ads boosters using system Stripe credit integration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0 z-10">
          <button 
            onClick={() => setSubTab('paid')}
            className={cn(
              "px-6 py-3.5 text-sm font-extrabold rounded-2xl transition-all shadow-md hover:scale-[1.02]",
              subTab === 'paid' ? "bg-white text-violet-900" : "bg-violet-800/50 text-violet-100 hover:bg-violet-750"
            )}
          >
            Paid Campaigns
          </button>
          <button 
            onClick={() => setSubTab('organic')}
            className={cn(
              "px-6 py-3.5 text-sm font-extrabold rounded-2xl transition-all shadow-md hover:scale-[1.02]",
              subTab === 'organic' ? "bg-white text-violet-900" : "bg-violet-800/50 text-violet-100 hover:bg-violet-750"
            )}
          >
            Organic Social Posting
          </button>
          <button 
            onClick={() => setSubTab('history')}
            className={cn(
              "px-6 py-3.5 text-sm font-extrabold rounded-2xl transition-all shadow-md hover:scale-[1.02]",
              subTab === 'history' ? "bg-white text-violet-900" : "bg-violet-800/50 text-violet-100 hover:bg-violet-750"
            )}
          >
            History & Billing
          </button>
          <button 
            onClick={() => setSubTab('connectors')}
            className={cn(
              "px-6 py-3.5 text-sm font-extrabold rounded-2xl transition-all shadow-md hover:scale-[1.02]",
              subTab === 'connectors' ? "bg-white text-violet-900" : "bg-violet-800/50 text-violet-100 hover:bg-violet-750"
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
            <div className="rounded-[32px] border border-neutral-150 bg-white p-10 shadow-md">
              <h3 className="font-display text-2xl font-black text-neutral-950 mb-6 pb-2 border-b border-neutral-100 flex items-center gap-3">
                <Sparkles size={24} className="text-violet-600" />
                Select Facebook + Instagram Paid Ad Plan
              </h3>

              {/* Plans Roster */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
                  const plan = plans[key];
                  const isSelected = selectedPlan === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPlan(key)}
                      className={cn(
                        "p-6 rounded-2xl text-left border transition-all relative flex flex-col justify-between min-h-[220px]",
                        isSelected 
                          ? "border-violet-600 bg-violet-600 text-white shadow-lg scale-[1.02]" 
                          : "border-neutral-200 bg-white hover:border-violet-350 hover:bg-violet-50/30 text-neutral-850"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={cn("text-xs font-black tracking-widest uppercase py-1 px-3 rounded-full", isSelected ? 'bg-violet-500 text-violet-100' : 'bg-neutral-100 text-neutral-600')}>
                            {key}
                          </span>
                          {isSelected && <CheckCircle2 size={18} className="text-white" />}
                        </div>
                        <h4 className="font-black text-base md:text-lg mt-4 line-clamp-1">{plan.name}</h4>
                        <p className={cn("text-xs md:text-sm mt-1.5 leading-relaxed line-clamp-3 font-medium", isSelected ? "text-violet-100" : "text-neutral-500")}>
                          {plan.desc}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 mt-4 border-t pt-3 border-violet-500/20">
                        <span className="font-display text-3xl font-black">${plan.price}</span>
                        <span className={cn("text-xs font-semibold", isSelected ? "text-violet-100" : "text-neutral-500")}>
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
                    <label className="block text-sm font-black uppercase tracking-wider text-neutral-800">
                      META AUDIENCE TARGETING KEYWORDS
                    </label>
                    <span className="text-xs text-neutral-500 font-bold">Separated by comma</span>
                  </div>
                  <textarea
                    rows={2}
                    value={campaignKeywords}
                    onChange={(e) => setCampaignKeywords(e.target.value)}
                    placeholder="e.g. credit repair, legal assistance, home loan, finance help"
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleSimulateReach}
                    disabled={calculatingReach}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-sm font-extrabold transition-all flex items-center justify-center gap-2"
                  >
                    {calculatingReach ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Optimize Keyword Reach
                  </button>
                  <button
                    onClick={handleInitiatePaidCampaign}
                    className="flex-1 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-650 text-white text-sm font-black transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg"
                  >
                    <CreditCard size={16} />
                    Pay and Activate Campaign (${plans[selectedPlan].price}.00)
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* SIMULATOR ANALYTICS SIDE PANEL */}
          <div className="space-y-6">
            <div className="rounded-[32px] border border-neutral-150 bg-white p-10 shadow-md text-center relative overflow-hidden min-h-[420px] flex flex-col justify-between">
              <div className="absolute top-0 left-0 p-4 opacity-[0.05]">
                <Activity size={100} />
              </div>

              <div>
                <span className="inline-block py-1.5 px-4.5 bg-indigo-50 border border-indigo-150 rounded-full text-xs font-black text-indigo-700 tracking-wider uppercase mb-6">
                  AUDIENCE REACH OPTIMIZER
                </span>

                <div className="py-8">
                  <p className="text-xs font-black uppercase text-neutral-400 tracking-widest leading-none mb-3">Simulated Reach (Meta Graph)</p>
                  {calculatingReach ? (
                    <div className="h-16 flex items-center justify-center">
                      <Loader2 size={36} className="animate-spin text-neutral-300" />
                    </div>
                  ) : (
                    <h3 className="font-display text-6xl font-black text-neutral-900 tracking-tight leading-none">
                      {reachStats?.estimatedReach.toLocaleString() || '0'}
                      <span className="text-xl font-bold text-neutral-400 ml-1.5">views</span>
                    </h3>
                  )}
                  <p className="text-xs md:text-sm font-semibold text-neutral-500 mt-4 leading-relaxed max-w-[240px] mx-auto">
                    Based on keyword targeting weight, regional density, and budget allocation.
                  </p>
                </div>

                {/* Meter gauge */}
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden mb-8">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-700" 
                    style={{ width: `${reachStats?.targetingScore || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 divide-x divide-neutral-150">
                  <div className="text-left pr-2">
                    <span className="text-xs font-black text-neutral-400 uppercase leading-none block tracking-wide">TARGETING ACCURACY</span>
                    <span className="font-display text-xl md:text-2xl font-black text-neutral-900 mt-2 block">
                      {reachStats?.targetingScore || 0}%
                    </span>
                  </div>
                  <div className="text-left pl-4">
                    <span className="text-xs font-black text-neutral-400 uppercase leading-none block tracking-wide">ACTIVE KEYWORDS</span>
                    <span className="font-display text-xl md:text-2xl font-black text-neutral-900 mt-2 block">
                      {reachStats?.keywordsCount || 0} Listed
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-neutral-150 pt-5 text-left">
                <div className="flex flex-col gap-1 text-xs md:text-sm text-neutral-500 font-semibold leading-relaxed">
                  <span className="text-emerald-600 font-black uppercase tracking-wider block">System Notice:</span>
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
            <div className="rounded-[32px] border-4 border-emerald-500 bg-emerald-50/70 p-8 md:p-10 text-left space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-4">
                <div className="flex items-center gap-3">
                  <span className="size-12 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center justify-center font-display text-xl font-black animate-bounce mt-1">✓</span>
                  <div>
                    <h3 className="font-display text-lg md:text-xl font-black text-emerald-950 uppercase">Post Gateway Successfully Created! (Branding Post Created)</h3>
                    <p className="text-sm text-emerald-900 font-bold mt-1">Your organic social campaign is ready. Publish directly on your page without creating an insecure token.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLastCreatedPost(null)}
                  className="px-4.5 py-2 text-sm font-black text-emerald-950 bg-emerald-200/80 hover:bg-emerald-250 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 space-y-4">
                <span className="text-xs font-black uppercase text-emerald-800 tracking-wider bg-emerald-100/60 border border-emerald-250 px-3 py-1 rounded-full w-fit">
                  Optimized Caption Text (Auto-Copied Caption)
                </span>
                <p className="text-sm md:text-base text-neutral-900 leading-relaxed font-bold italic">"{lastCreatedPost.content}"</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lastCreatedPost.content);
                    alert("Post text successfully copied to clipboard!");
                  }}
                  className="text-xs md:text-sm font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <FileText size={14} /> Copy Manually
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-emerald-100/40 border border-emerald-200 rounded-2xl space-y-3">
                  <h4 className="font-black text-sm md:text-base text-emerald-950 flex items-center gap-1.5">
                    🟢 Easy Connector & Placement Instructions (Easy Quick-Post Guide)
                  </h4>
                  <ul className="list-disc pl-5 text-xs md:text-sm text-emerald-950 space-y-2 font-semibold leading-relaxed">
                    <li>Since you have connected with **only your Facebook Page ID** (without providing insecure permanent access tokens or passwords), your formatted direct-post caption has been securely copied to your clipboard.</li>
                    <li>Click the "Direct Publish Gateway" button below. Paste (**Ctrl+V** or Tap & Hold and Paste) the text directly into the page's post box, and click publish!</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <a
                    href={`https://www.facebook.com/${lastCreatedPost.facebookPageId || facebookPageId || 'pages'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-755 text-white font-black text-sm px-8 py-4.5 rounded-2xl transition-all shadow-md hover:scale-[1.01]"
                  >
                    <Facebook size={18} /> 1-Click Direct Publish Gateway (Page Feed)
                  </a>
                  
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(lastCreatedPost.content)}&u=${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-sm px-8 py-4.5 rounded-2xl transition-all shadow-md hover:scale-[1.01]"
                  >
                    ⚡ Facebook Share Composer Popup
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Post Designer Form */}
          <div className="rounded-[32px] border border-neutral-150 bg-white p-10 shadow-md space-y-6">
            <h3 className="font-display text-2xl font-black text-neutral-950 pb-2 border-b border-neutral-100 flex items-center gap-3">
              <Globe size={24} className="text-violet-650" />
              Design Social Media Post
            </h3>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-black uppercase tracking-wider text-neutral-800 mb-3">
                CHOOSE SOCIAL NETWORK PATH
              </label>
              <div className="grid grid-cols-3 gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('facebook')}
                  className={cn(
                    "p-4 rounded-2xl border font-extrabold text-sm flex justify-center items-center gap-2 transition-all shadow-xs",
                    selectedPlatform === 'facebook'
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-black ring-2 ring-blue-100"
                      : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  )}
                >
                  <Facebook size={18} /> Facebook
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('instagram')}
                  className={cn(
                    "p-4 rounded-2xl border font-extrabold text-sm flex justify-center items-center gap-2 transition-all shadow-xs",
                    selectedPlatform === 'instagram'
                      ? "bg-pink-50 border-pink-200 text-pink-700 font-black ring-2 ring-pink-100"
                      : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  )}
                >
                  <Instagram size={18} /> Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('tiktok')}
                  className={cn(
                    "p-4 rounded-2xl border font-extrabold text-sm flex justify-center items-center gap-2 transition-all shadow-xs",
                    selectedPlatform === 'tiktok'
                      ? "bg-neutral-900 border-neutral-950 text-white font-black ring-2 ring-neutral-200"
                      : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  )}
                >
                  <Video size={18} /> TikTok
                </button>
              </div>
            </div>

            {/* Post Draft Input Form */}
            <form onSubmit={handleSubmitOrganicPost} className="space-y-5">
              <div>
                <label className="block text-sm font-black uppercase tracking-wider text-neutral-800 mb-2.5">
                  Post Copywriting / Draft Content
                </label>
                <textarea
                  rows={4}
                  value={postDraftContent}
                  onChange={(e) => setPostDraftContent(e.target.value)}
                  placeholder="e.g. Raise your credit score with FTF Consulting. Our legal procedures make credit repair fast & flawless!"
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-2xl px-5 py-4 text-sm md:text-base font-bold focus:outline-none focus:border-neutral-950 focus:bg-white transition-all text-neutral-850 placeholder:text-neutral-400"
                  required
                />
              </div>

              {/* AI Post Content Optimizer */}
              <div className="bg-violet-50/50 border border-violet-150 rounded-3xl p-6 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-violet-600 size-5 animate-pulse" />
                    <span className="text-sm md:text-base font-black text-violet-950">AI Writing Assistant (AI Copywriter)</span>
                  </div>
                  <span className="text-xs uppercase font-extrabold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">
                    Gemini 3.5 Active
                  </span>
                </div>
                <p className="text-xs md:text-sm font-bold text-violet-950 leading-relaxed">
                  Beautify your keywords, rough drafts, or random thoughts into highly elegant social media posts. The perfect emojis, formatting, and tags are automatically formatted!
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOptimizeContent}
                    disabled={optimizingContent || !postDraftContent.trim()}
                    className="w-full sm:w-auto self-start py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black transition-all disabled:opacity-45 disabled:hover:bg-violet-600 flex items-center justify-center gap-2.5 shadow-md"
                  >
                    {optimizingContent ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Beautifying Draft...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-violet-200" />
                        <span>⚡ Beautify & Structure Content with AI</span>
                      </>
                    )}
                  </button>
                  {optimizeError && (
                    <div className="text-xs md:text-sm text-red-700 bg-red-50 p-3 rounded-xl font-bold flex items-start gap-1.5 border border-red-100">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{optimizeError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Post Media Preview */}
              <div>
                <label className="block text-sm font-black uppercase tracking-wider text-neutral-800 mb-2.5">
                  Attach Creative Artwork / Banner
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-2xl px-6 py-4 text-sm font-extrabold text-neutral-900 transition-all shadow-sm shrink-0">
                    <span>Upload Image File</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {postBase64Image ? (
                    <div className="flex items-center gap-3">
                      <img src={postBase64Image} alt="Post asset preview" className="size-14 rounded-xl border-2 border-neutral-200 object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setPostBase64Image(null)}
                        className="text-xs md:text-sm text-red-650 font-black hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs uppercase font-extrabold text-neutral-500">No Image Attached (Text-Only Post)</span>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={sendingPost || !postDraftContent.trim()}
                  className="w-full py-4.5 rounded-2xl bg-neutral-900 border border-neutral-900 text-white text-sm font-black hover:bg-neutral-800 disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {sendingPost ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Broadcasting social feeds...</span>
                    </>
                  ) : (
                    <>
                      <Megaphone size={18} />
                      <span>Publish Organically Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Social feed simulation preview */}
          <div className="space-y-6">
            <div className="bg-neutral-50 rounded-[32px] p-8 border border-neutral-150 relative min-h-[450px]">
              <span className="text-xs font-black tracking-widest text-neutral-500 uppercase mb-4 block">Interactive Live Preview</span>

              {/* Feed Card container resembling a smartphone feed */}
              <div className="bg-white border text-left border-neutral-205 rounded-2xl overflow-hidden shadow-md max-w-sm mx-auto">
                {/* Channel banner */}
                <div className="p-4 flex items-center justify-between border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-neutral-950 text-white flex items-center justify-center font-black text-sm uppercase">
                      F
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm md:text-base text-neutral-950">FTF Agency Branding</h4>
                      <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <span>Just now</span>
                        <span>•</span>
                        <Globe size={11} className="text-neutral-400" />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content draft body */}
                <div className="p-5 border-b border-neutral-50">
                  <p className="text-sm md:text-base text-neutral-900 leading-relaxed font-semibold whitespace-pre-wrap">
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
                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-around font-extrabold text-xs text-neutral-600 uppercase">
                  <span className="hover:text-blue-600 cursor-pointer transition-all">👍 Like</span>
                  <span className="hover:text-blue-600 cursor-pointer transition-all">💬 Comment</span>
                  <span className="hover:text-blue-600 cursor-pointer transition-all">🔄 Share</span>
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
            <div className="rounded-2xl border border-neutral-150 bg-white p-7 flex justify-between items-center shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-neutral-500 tracking-wider">Paid Campaigns Launched</p>
                <h4 className="font-display text-4xl font-black text-neutral-950">{campaigns.length}</h4>
              </div>
              <div className="size-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                <Layers size={26} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-150 bg-white p-7 flex justify-between items-center shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-neutral-500 tracking-wider">Total Ads Direct Investment</p>
                <h4 className="font-display text-4xl font-black text-neutral-950">
                  ${campaigns.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)}
                </h4>
              </div>
              <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign size={26} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-150 bg-white p-7 flex justify-between items-center shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-neutral-500 tracking-wider">Audience Reach Accelerated</p>
                <h4 className="font-display text-4xl font-black text-neutral-950">
                  {campaigns.reduce((sum, c) => sum + (c.estimatedReach || 0), 0).toLocaleString()}
                </h4>
              </div>
              <div className="size-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                <Award size={26} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaigns table */}
            <div className="lg:col-span-2 rounded-[32px] border border-neutral-150 bg-white p-10 shadow-md">
              <h3 className="font-display text-2xl font-black text-neutral-950 mb-6 pb-2 border-b border-neutral-100">Paid Campaigns Overview</h3>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-neutral-300" />
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-sm font-semibold text-neutral-500 italic">No paid campaigns launched yet. Start by scheduling a booster campaign in the plans section.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 font-extrabold uppercase tracking-wider text-neutral-500 text-2xs">
                        <th className="py-3 px-2">Ad Plan</th>
                        <th className="py-3 px-2">Duration</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2">Estimated Reach</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Expiration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-800 font-medium">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-neutral-50/50">
                          <td className="py-4 px-2">
                            <div>
                              <span className="font-bold text-neutral-900 capitalize text-sm md:text-base">{camp.planName} Booster</span>
                              <p className="text-xs text-neutral-500 truncate max-w-[150px] font-bold">{camp.keywords || 'Broad'}</p>
                            </div>
                          </td>
                          <td className="py-4 px-2 font-semibold">{camp.durationDays} Days</td>
                          <td className="py-4 px-2 font-black text-neutral-950 text-sm">${Number(camp.amount).toFixed(2)}</td>
                          <td className="py-4 px-2 font-black text-indigo-750 text-sm">{camp.estimatedReach.toLocaleString()} views</td>
                          <td className="py-4 px-2">
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 border border-emerald-150 text-emerald-700 uppercase tracking-wider">
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right text-neutral-500 text-xs font-bold">
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
            <div className="rounded-[32px] border border-neutral-150 bg-white p-10 shadow-md">
              <h3 className="font-display text-2xl font-black text-neutral-950 mb-6 pb-2 border-b border-neutral-100">Social Organic Feed Logs</h3>
              {loadingPosts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={18} className="animate-spin text-neutral-300" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-sm font-semibold text-neutral-500 italic">No social feeds published yet.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 border border-neutral-150 bg-neutral-50/30 rounded-2xl text-sm space-y-3 font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-extrabold px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-2xs">
                          {post.platform}
                        </span>
                        <span className="text-xs text-neutral-500 font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-neutral-800 leading-relaxed font-bold">{post.content}</p>
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
          <div className="bg-emerald-50/60 border border-emerald-150 rounded-3xl p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5 bg-emerald-100 border border-emerald-250 px-3 py-1 rounded-full w-fit">
                <Activity size={14} /> Status Monitor
              </span>
              <h3 className="font-display text-xl font-extrabold text-neutral-950 mt-2.5">
                {productionMode ? "🔴 Direct Live Production Mode Active" : "🟢 Sandbox Simulation Mode Active"}
              </h3>
              <p className="text-sm font-semibold text-neutral-600 leading-relaxed max-w-3xl">
                If **Direct Live Production Mode** is active, clicking "Publish Organically Now" will dispatch the post directly to your Facebook Page, Instagram Business profile, or TikTok account. Otherwise, it compiles safely into your sandbox mock logs.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setProductionMode(!productionMode)}
              className={cn(
                "py-4 px-6 text-sm font-black rounded-2xl transition-all shadow-md shrink-0 uppercase tracking-wider select-none cursor-pointer",
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
              <div className="bg-white rounded-[32px] border border-neutral-150 p-10 shadow-md space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                  <h3 className="font-display text-2xl font-black text-neutral-950 flex items-center gap-3">
                    <Globe size={24} className="text-violet-650" />
                    Social API Connectors & Credentials
                  </h3>
                  
                  {/* Mode preference selector */}
                  <div className="flex items-center gap-2.5 bg-violet-50/90 border border-violet-100 px-5 py-3 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="quickConnectToggle"
                      checked={quickConnectMode}
                      onChange={(e) => setQuickConnectMode(e.target.checked)}
                      className="h-4 w-4 text-violet-650 focus:ring-violet-500 rounded border-neutral-200 cursor-pointer"
                    />
                    <label htmlFor="quickConnectToggle" className="text-sm font-bold text-violet-950 cursor-pointer select-none">
                      ⚡ Quick Connect with ID Only (Token-free)
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
                      <div className="bg-emerald-50/60 border border-emerald-150 p-5 rounded-2xl flex items-start gap-3">
                        <span className="text-emerald-700 mt-0.5 text-base">⚡</span>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm md:text-base text-emerald-950">Page ID Direct Connector Active</h4>
                          <p className="text-xs md:text-sm font-bold text-emerald-850 leading-relaxed">
                            No complex permanent API access tokens required! Simply configure your social Page IDs and save. Our smart direct gateway handles direct posting tasks automatically.
                          </p>
                        </div>
                      </div>
                    )}
 
                    {/* Facebook Group */}
                    <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-6 space-y-4">
                      <h4 className="font-black text-sm text-blue-900 flex items-center gap-2.5">
                        <Facebook size={18} /> Facebook Page Gateway
                      </h4>
                      <div className={cn("grid grid-cols-1 gap-4", quickConnectMode ? "md:grid-cols-1" : "md:grid-cols-2")}>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-neutral-750 mb-1.5">Facebook Page ID</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 102456239102931" 
                            value={facebookPageId}
                            onChange={(e) => setFacebookPageId(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                          />
                        </div>
                        {!quickConnectMode && (
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-neutral-750 mb-1.5">Page Permanent Access Token</label>
                            <input 
                              type="password" 
                              placeholder={facebookAccessToken ? "••••••••••••••••" : "Paste EAAXX... permanent token"} 
                              value={facebookAccessToken}
                              onChange={(e) => setFacebookAccessToken(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instagram Group */}
                    <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-6 space-y-4">
                      <h4 className="font-black text-sm text-pink-900 flex items-center gap-2.5">
                        <Instagram size={18} /> Instagram Business API Connector
                      </h4>
                      <div className={cn("grid grid-cols-1 gap-4", quickConnectMode ? "md:grid-cols-1" : "md:grid-cols-2")}>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-neutral-750 mb-1.5">Instagram Business ID (Page ID)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 178414029102456" 
                            value={instagramBusinessId}
                            onChange={(e) => setInstagramBusinessId(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                          />
                        </div>
                        {!quickConnectMode && (
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-neutral-750 mb-1.5">Instagram Access Token</label>
                            <input 
                              type="password" 
                              placeholder={instagramAccessToken ? "••••••••••••••••" : "Paste IG token (EAAXX...)"} 
                              value={instagramAccessToken}
                              onChange={(e) => setInstagramAccessToken(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TikTok Group */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4">
                      <h4 className="font-black text-sm text-neutral-900 flex items-center gap-2.5">
                        <Video size={18} /> TikTok Content Publisher Config
                      </h4>
                      <div className={cn("grid grid-cols-1 gap-4", quickConnectMode ? "md:grid-cols-1" : "md:grid-cols-2")}>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-neutral-750 mb-1.5">TikTok Client/Creator ID (Page/Account ID)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. act_1028373190" 
                            value={tiktokAccountId}
                            onChange={(e) => setTiktokAccountId(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                          />
                        </div>
                        {!quickConnectMode && (
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-neutral-750 mb-1.5">TikTok Developer Access Token</label>
                            <input 
                              type="password" 
                              placeholder={tiktokAccessToken ? "••••••••••••••••" : "Paste TikTok App token"} 
                              value={tiktokAccessToken}
                              onChange={(e) => setTiktokAccessToken(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-neutral-950 transition-all text-neutral-850"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-5 border-t border-neutral-100">
                  <button
                    type="submit"
                    disabled={savingConnectors || loadingConnectors}
                    className="py-4.5 px-8 rounded-2xl bg-neutral-900 border border-neutral-900 hover:bg-neutral-800 text-white text-sm font-black uppercase tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-30 cursor-pointer"
                  >
                    {savingConnectors ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={16} className="animate-spin" /> Synchronizing...
                      </span>
                    ) : (
                      "Save Integration Keys"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Documentation Guidelines column */}
            <div className="rounded-[32px] border border-neutral-150 bg-white p-10 shadow-md space-y-6 text-left">
              <h3 className="font-display text-lg font-black text-neutral-950 flex items-center gap-2 border-b border-neutral-100 pb-2">
                <Plus size={20} className="text-violet-600" />
                Setup Steps & Directives
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-neutral-700 leading-relaxed font-semibold">
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-150 space-y-2">
                  <h4 className="font-black text-blue-950 text-sm">📘 Facebook Integration (Facebook Page)</h4>
                  <ul className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-blue-900">
                    <li>Create an App inside the Meta Developer Console and configure Page permissions.</li>
                    <li>Acquire a permanent, never-expiring **Page Access Token** using Meta's Graph API Explorer tool.</li>
                    <li>Retrieve and save your Facebook **Page ID** into the connector configuration.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-pink-50/50 border border-pink-150 space-y-2">
                  <h4 className="font-black text-pink-955 text-sm">📙 Instagram Business (Instagram Profile)</h4>
                  <ul className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-pink-900 bg-transparent">
                    <li>Ensure your Instagram profile is converted to a Professional Business Account.</li>
                    <li>Link your Instagram Business Account directly with your connected Facebook Page.</li>
                    <li>Retrieve and input your **Instagram Business ID** from your Meta Graph setup.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-55 border border-neutral-150 space-y-2">
                  <h4 className="font-black text-neutral-950 text-sm">⬛ TikTok Content API (TikTok Profile)</h4>
                  <ul className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-neutral-850 bg-transparent">
                    <li>Register a developer profile on the official TikTok For Developers portal.</li>
                    <li>Gain approvals for "Direct Content Posting" and generate client/creator tokens to integrate.</li>
                  </ul>
                </div>

                <div className="pt-3 text-xs italic text-neutral-500 font-semibold text-center border-t border-neutral-100">
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
          <div className="bg-white rounded-[32px] max-w-lg w-full p-10 border border-neutral-150 shadow-2xl relative overflow-hidden text-left">
            <h3 className="font-display text-3xl font-black text-neutral-950 mb-1">Ad Campaign Payment Gateway</h3>
            <p className="text-sm font-semibold text-neutral-550 mb-6">Complete transaction securely using your agency's connected Stripe integration.</p>

            {paymentSuccessMessage ? (
              <div className="space-y-6 text-center py-8">
                <div className="size-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-sm font-bold text-emerald-900 bg-emerald-50 border border-emerald-150 p-5 rounded-2xl leading-relaxed whitespace-pre-wrap">
                  {paymentSuccessMessage}
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccessMessage(null);
                  }}
                  className="w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-white transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">Selected Plan Price</label>
                  <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-150 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-neutral-900 capitalize">{plans[selectedPlan].name}</span>
                      <p className="text-xs font-bold text-neutral-550 mt-0.5">Duration: {plans[selectedPlan].days} Days</p>
                    </div>
                    <span className="font-display text-2xl font-black text-emerald-700">${plans[selectedPlan].price}.00</span>
                  </div>
                </div>

                <div className="p-1 rounded-3xl bg-neutral-50/50 border border-neutral-150 relative">
                  <div className="p-5 text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">RECOMMENDED LIVE SECURE PAYMENT</p>
                    <button
                      type="button"
                      disabled={checkoutLoading}
                      onClick={handlePayWithStripeCheckout}
                      className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-650 disabled:from-neutral-300 disabled:to-neutral-400 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Preparing Secure Checkout...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          <span>Pay with Stripe Checkout</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-2.5 flex items-center justify-center gap-1">
                      🔒 Live connection with secure Stripe keys
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentSuccessMessage(null);
                    }}
                    className="w-full py-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-850 text-sm font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
