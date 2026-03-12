
import React, { useState } from 'react';
import { DISCLOSURES, Icons } from '../constants';
import { User } from '../types';
import { stripeService } from '../services/stripeService';

interface MarketplaceSignupProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
}

const MarketplaceSignup: React.FC<MarketplaceSignupProps> = ({ user, onUpdateUser }) => {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      await stripeService.createConnectOnboarding(user);
      // The user will be redirected to Stripe Onboarding
    } catch (e) {
      alert("Stripe Connect Error: Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  if (user.isSeller && user.stripeConnected) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-12 animate-fadeIn">
        <div className="bg-green-500/10 border border-green-500/20 p-16 rounded-[3rem] relative overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-500/10 rounded-full blur-[100px] animate-pulse"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/40 transform -rotate-6">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl comic-font text-[#fbbf24] tracking-widest uppercase">STALL IS OPEN!</h1>
              <p className="text-gray-400 max-w-lg mx-auto text-lg leading-relaxed font-medium">
                Identity verified. Bank account linked. You are now officially a <span className="text-white">Certified Vault Merchant</span>.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-8">
              <button className="bg-[#fbbf24] text-[#1a2332] px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95">
                Go to Dashboard
              </button>
              <button 
                onClick={() => stripeService.createPortalSession(user)}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest border border-white/10 transition-all"
              >
                Stripe Express
              </button>
            </div>
            
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pt-8">
              Connected via Stripe Express • Payouts processed every 24-48 hours
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {step === 1 && (
        <div className="space-y-16 animate-fadeIn">
          <div className="text-center space-y-6">
            <div className="inline-block bg-[#dc2626]/10 text-[#dc2626] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#dc2626]/20">
              Seller Onboarding
            </div>
            <h1 className="text-6xl comic-font text-white tracking-wider">TURN PAPER INTO <span className="text-[#fbbf24]">PROFIT</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Join the elite circle of Comic Vault sellers. Professional payouts, zero-trust security, and instant global exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Escrow Payouts', 
                desc: 'Funds are held securely by Stripe until tracking confirms delivery.', 
                icon: <Icons.Cart className="w-8 h-8" />,
                accent: 'bg-blue-500 shadow-blue-500/20'
              },
              { 
                title: 'Verified Buyers', 
                desc: 'Every transaction is screened for fraud and card-testing protection.', 
                icon: <Icons.UserCircle className="w-8 h-8" />,
                accent: 'bg-green-500 shadow-green-500/20'
              },
              { 
                title: 'Lower Fees', 
                desc: 'Collector and Pro tiers get massive discounts on marketplace commissions.', 
                icon: <Icons.Sparkles className="w-8 h-8" />,
                accent: 'bg-[#fbbf24] shadow-[#fbbf24]/20'
              },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] group hover:bg-white/10 transition-all duration-300">
                <div className={`${f.accent} text-[#1a2332] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:-rotate-6 transition-all`}>{f.icon}</div>
                <h3 className="font-black text-white uppercase mb-3 text-lg tracking-tight">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem] backdrop-blur-xl max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#fbbf24]/5 rounded-full blur-3xl"></div>
            
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <div className="w-2 h-2 bg-[#fbbf24] rounded-full animate-ping"></div>
              Merchant Certification Agreement
            </h2>
            
            <div className="space-y-6 text-sm text-gray-300">
              <div className="bg-black/60 p-6 rounded-2xl border border-white/5 space-y-4">
                <p className="text-gray-400 leading-relaxed italic font-medium">
                  "{DISCLOSURES.MARKETPLACE}"
                </p>
                <p className="text-gray-400 leading-relaxed italic font-medium">
                  "{DISCLOSURES.GRADING}"
                </p>
              </div>
              
              <label className="flex items-center gap-6 mt-10 p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#fbbf24]/30 cursor-pointer transition-all group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-8 h-8 rounded-lg border-gray-700 bg-gray-800 text-[#fbbf24] focus:ring-[#fbbf24] cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#fbbf24] transition-colors">Confirm Terms</p>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                    I acknowledge that Comic Vault acts as a venue, and all identity verification and payout scheduling is managed by Stripe.
                  </p>
                </div>
              </label>
            </div>
            
            <button 
              disabled={!agreed}
              onClick={() => setStep(2)}
              className={`w-full mt-10 py-6 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl ${
                agreed ? 'bg-[#dc2626] hover:bg-red-700 shadow-red-500/20 hover:scale-[1.02] active:scale-95' : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              Start Merchant Onboarding
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto text-center space-y-8 animate-slideUp py-20 px-4">
          <div className="p-12 bg-white rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#635bff] via-[#5a51e7] to-blue-500"></div>
            
            <div className="flex justify-center mb-10 transform hover:scale-105 transition-transform duration-500">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-16" alt="Stripe" />
            </div>
            
            <div className="space-y-4 mb-12">
              <h2 className="text-4xl font-black text-[#1a2332] uppercase tracking-tighter leading-none">Express Setup</h2>
              <p className="text-gray-500 text-sm leading-relaxed px-6 font-medium">
                We've partnered with Stripe for secure, fast payouts. You'll be redirected to a secure Stripe portal to finish setting up.
              </p>
            </div>
            
            <div className="space-y-6">
              <button 
                onClick={handleConnectStripe}
                disabled={loading}
                className="w-full bg-[#635bff] hover:bg-[#5a51e7] text-white py-6 rounded-[1.5rem] font-black flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.Plus className="w-6 h-6" />
                    <span className="tracking-widest uppercase">Launch Stripe Connect</span>
                  </>
                )}
              </button>
              
              <div className="flex flex-col items-center gap-4 pt-6 opacity-30">
                <p className="text-[10px] font-black text-[#1a2332] uppercase tracking-[0.3em]">Securely Payout To</p>
                <div className="flex items-center gap-8 grayscale">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8" alt="Mastercard" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Chase_logo_and_wordmark.svg" className="h-5" alt="Chase" />
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setStep(1)} 
            disabled={loading}
            className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-110 disabled:opacity-0"
          >
            Cancel and Return
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSignup;
