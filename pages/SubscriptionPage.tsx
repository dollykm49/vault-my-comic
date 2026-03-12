
import React, { useState, useEffect } from 'react';
import { User, SubscriptionTier } from '../types';
import { Icons, SUBSCRIPTION_LIMITS, SCAN_PACKS, ARTLAB_PRICING } from '../constants';
import { stripeService } from '../services/stripeService';
import { useSearchParams } from 'react-router-dom';

interface SubscriptionPageProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [searchParams, setSearchParams] = useSearchParams();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStripe = async () => {
      try {
        const response = await fetch('/api/stripe/health');
        const data = await response.json();
        setStripeConfigured(data.configured);
      } catch (e) {
        setStripeConfigured(false);
      }
    };
    checkStripe();

    const status = searchParams.get('status');
    if (status === 'success') {
      setMessage({ type: 'success', text: 'Purchase successful! Your account has been updated.' });
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('status');
        newParams.delete('session_id');
        setSearchParams(newParams);
      }, 3000);
    } else if (status === 'cancel') {
      setMessage({ type: 'error', text: 'Transaction was cancelled.' });
    }

    // Check if we are on production domain but might be missing config
    if (window.location.hostname === 'vaultmycomic.com' && !message) {
      console.log("Checking Stripe configuration for vaultmycomic.com...");
    }
  }, [searchParams, setSearchParams]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === user.subscription) {
      await stripeService.createPortalSession(user);
      return;
    }
    
    setLoading(tier);
    try {
      await stripeService.createCheckoutSession(user, tier, interval);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || "Payment processing failed. Please check your Stripe configuration." });
    } finally {
      setLoading(null);
    }
  };

  const handleArtLabPurchase = async () => {
    setLoading('artlab');
    try {
      await stripeService.createArtLabSession(user, interval);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || "ArtLab purchase failed." });
    } finally {
      setLoading(null);
    }
  };

  const handleScanPackPurchase = async (packId: string) => {
    setLoading(packId);
    try {
      await stripeService.createScanPackSession(user, packId);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || "Scan pack purchase failed." });
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: SubscriptionTier.FREE,
      name: 'Rookie Informant',
      price: '0',
      tagline: 'The Street Level',
      description: 'Perfect for new detectives starting their first case file.',
      icon: <Icons.UserCircle className="w-12 h-12 text-gray-400" />,
      color: 'border-white/10 hover:border-white/20',
      buttonText: 'Current Plan'
    },
    {
      id: SubscriptionTier.COLLECTOR,
      name: 'Gumshoe Detective',
      price: interval === 'month' ? SUBSCRIPTION_LIMITS[SubscriptionTier.COLLECTOR].priceMonthly : SUBSCRIPTION_LIMITS[SubscriptionTier.COLLECTOR].priceYearly,
      tagline: 'The Professional',
      description: 'For serious investigators who need the full breakdown on every suspect.',
      icon: <Icons.Sparkles className="w-12 h-12 text-[#fbbf24]" />,
      color: 'border-[#fbbf24] bg-[#fbbf24]/5 shadow-[0_0_50px_rgba(251,191,36,0.15)] ring-2 ring-[#fbbf24]/30',
      buttonText: 'Upgrade Now'
    },
    {
      id: SubscriptionTier.VAULT_ELITE,
      name: 'The Mastermind',
      price: interval === 'month' ? SUBSCRIPTION_LIMITS[SubscriptionTier.VAULT_ELITE].priceMonthly : SUBSCRIPTION_LIMITS[SubscriptionTier.VAULT_ELITE].priceYearly,
      tagline: 'The Boss',
      description: 'Unrestricted access to the city\'s most classified comic data.',
      icon: <Icons.GraduationCap className="w-12 h-12 text-[#dc2626]" />,
      color: 'border-[#dc2626] bg-[#dc2626]/5 hover:bg-[#dc2626]/10',
      buttonText: 'Become The Mastermind'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 space-y-24 animate-fadeIn">
      <div className="text-center space-y-8">
        {stripeConfigured === false && (
          <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 mb-8">
            <div className="flex items-center gap-4">
              <Icons.AlertCircle className="w-8 h-8 shrink-0" />
              <div className="text-left">
                <h3 className="font-black uppercase tracking-widest text-sm">Billing System Offline</h3>
                <p className="text-xs mt-1 font-medium opacity-80">
                  Stripe is not configured correctly on the server. Please ensure <code className="bg-red-500/20 px-1 rounded">STRIPE_SECRET_KEY</code> is set in the Settings menu.
                </p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`max-w-md mx-auto p-4 rounded-2xl mb-8 animate-bounce ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            <div className="flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs">
              {message.type === 'success' ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="inline-block bg-[#fbbf24]/10 text-[#fbbf24] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-[#fbbf24]/20">
            Vault Membership Plans
          </div>
          <h1 className="text-6xl comic-font text-white tracking-wider drop-shadow-lg">
            CHOOSE YOUR <span className="text-[#fbbf24]">POWER LEVEL</span>
          </h1>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-bold ${interval === 'month' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
            className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
          >
            <div className={`w-5 h-5 bg-[#fbbf24] rounded-full transition-transform duration-300 ${interval === 'year' ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${interval === 'year' ? 'text-white' : 'text-gray-500'}`}>Yearly</span>
            <span className="bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Save 20%</span>
          </div>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((t) => (
          <div 
            key={t.id} 
            className={`group relative flex flex-col p-10 rounded-[2.5rem] border-2 transition-all duration-500 hover:-translate-y-2 ${t.color}`}
          >
            {user.subscription === t.id && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#fbbf24] text-[#1a2332] text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-xl ring-4 ring-[#1a2332]">
                Your Active Tier
              </div>
            )}
            
            <div className="mb-8 transform group-hover:scale-110 transition-transform duration-500">{t.icon}</div>
            <div className="mb-8">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">{t.tagline}</span>
              <h3 className="text-4xl comic-font text-white uppercase">{t.name}</h3>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-white">${t.price}</span>
              <span className="text-gray-500 font-bold uppercase text-xs">
                / {interval === 'year' ? 'YEAR' : 'MONTH'}
              </span>
            </div>
            
            <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium">{t.description}</p>
            
            <div className="flex-1 space-y-5 mb-12">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Included Perks</p>
              {(SUBSCRIPTION_LIMITS[t.id as SubscriptionTier].perks).map((perk, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="bg-green-500/20 p-1 rounded-full mt-0.5 shrink-0">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">{perk}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(t.id as SubscriptionTier)}
              disabled={loading !== null}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                user.subscription === t.id
                ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                : t.id === SubscriptionTier.COLLECTOR
                ? 'bg-[#fbbf24] text-[#1a2332] hover:bg-yellow-500 hover:shadow-yellow-500/20 active:scale-95'
                : 'bg-white text-[#1a2332] hover:bg-gray-100 active:scale-95'
              }`}
            >
              {loading === t.id ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Redirecting...
                </span>
              ) : user.subscription === t.id ? (
                'Manage Subscription'
              ) : (
                t.buttonText
              )}
            </button>
          </div>
        ))}
      </div>

      {/* ArtLab & Scan Packs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ArtLab Pro */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-[3rem] p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icons.Sparkles className="w-32 h-32 text-purple-400" />
          </div>
          <div className="relative space-y-8">
            <div>
              <div className="inline-block bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Add-On Feature</div>
              <h2 className="text-4xl comic-font text-white uppercase">ArtLab Pro</h2>
              <p className="text-gray-400 mt-4 leading-relaxed">
                Unlock the full potential of AI-driven comic art generation. Create custom variants, 
                posters, and character designs with our advanced ArtLab tools.
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">
                ${interval === 'month' ? ARTLAB_PRICING.priceMonthly : ARTLAB_PRICING.priceYearly}
              </span>
              <span className="text-gray-500 font-bold uppercase text-xs">/ {interval === 'year' ? 'YEAR' : 'MONTH'}</span>
            </div>

            <ul className="space-y-3">
              {ARTLAB_PRICING.perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <Icons.CheckCircle className="w-4 h-4 text-purple-400" />
                  {perk}
                </li>
              ))}
            </ul>

            <button 
              onClick={handleArtLabPurchase}
              disabled={loading !== null || user.subscription === SubscriptionTier.VAULT_ELITE || user.hasArtLab}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                user.subscription === SubscriptionTier.VAULT_ELITE || user.hasArtLab
                ? 'bg-purple-500/10 text-purple-500/50 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 active:scale-95'
              }`}
            >
              {user.subscription === SubscriptionTier.VAULT_ELITE ? 'Included in Mastermind' : user.hasArtLab ? 'Active' : 'Unlock ArtLab Pro'}
            </button>
          </div>
        </div>

        {/* Scan Packs */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12">
          <div className="mb-8">
            <h2 className="text-4xl comic-font text-white uppercase">Scan Refills</h2>
            <p className="text-gray-400 mt-2">Need more grading power? Grab a one-time scan pack to keep your collection growing.</p>
          </div>

          <div className="space-y-4">
            {SCAN_PACKS.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#fbbf24]/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Camera className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase tracking-wide">{pack.label}</h4>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">{pack.count} Grading Scans</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleScanPackPurchase(pack.id)}
                  disabled={loading !== null}
                  className="px-6 py-3 bg-white text-[#1a2332] rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#fbbf24] transition-all active:scale-95"
                >
                  {loading === pack.id ? '...' : `$${pack.price}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#635bff] via-blue-400 to-[#635bff]"></div>
          
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-8" alt="Stripe" />
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex gap-4">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-white font-black uppercase tracking-widest text-sm">Security & Confidence</h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl mx-auto font-medium">
                Payments are securely processed by Stripe. We do not store your credit card information on our servers. 
                Subscriptions can be canceled at any time with one click. 
                VAT and local taxes may apply based on your location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
