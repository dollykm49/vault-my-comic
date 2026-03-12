import React from 'react';
import { User as UserType, SubscriptionTier } from '../types';
import { supabase } from '../supabase';
import { Shield, Cloud, Lock, Database, CreditCard, LogOut, ChevronRight, Fingerprint, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SettingsProps {
  user: UserType;
  onUpdateUser: (updates: Partial<UserType>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConnectingStripe, setIsConnectingStripe] = React.useState(false);

  React.useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') {
      // In a real app, you'd verify with the backend first
      onUpdateUser({ isSeller: true });
      // Clear the URL params
      navigate('/settings', { replace: true });
    } else if (stripeStatus === 'refresh') {
      alert('Stripe onboarding was interrupted. Please try again.');
      navigate('/settings', { replace: true });
    }
  }, [searchParams, onUpdateUser, navigate]);

  const handleStripeOnboarding = async () => {
    setIsConnectingStripe(true);
    try {
      const response = await fetch('/api/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.username + '@example.com' }), // Mock email
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to get onboarding URL');
      }
    } catch (error) {
      console.error('Stripe Onboarding Error:', error);
      alert('Failed to start Stripe onboarding. Please try again.');
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const SettingItem = ({ icon: Icon, title, desc, actionLabel, onClick }: { icon: any, title: string, desc: string, actionLabel?: string, onClick?: () => void }) => (
    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-[#fbbf24]/20 text-[#fbbf24] rounded-2xl flex items-center justify-center">
          <Icon size={24} />
        </div>
        <div className="text-left">
          <h4 className="font-black text-white uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      {actionLabel ? (
        <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" onClick={onClick}>{actionLabel}</button>
      ) : (
        <ChevronRight size={20} className="text-gray-700" />
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-5xl comic-font text-[#fbbf24] uppercase tracking-wider mb-2">Account Control</h1>
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em]">Vault ID: CV-{user.id.toUpperCase().substring(0,8)}</p>
      </div>

      <div className="grid gap-6">
        <section className="space-y-4">
           <h3 className="text-left comic-font text-2xl text-[#dc2626] uppercase tracking-widest ml-4">Public Identity</h3>
           <SettingItem icon={UserIcon} title="Hero Profile" desc="Manage your alias, bio, and avatar" actionLabel="EDIT" onClick={() => navigate('/profile')} />
        </section>

        <section className="space-y-4">
           <h3 className="text-left comic-font text-2xl text-[#dc2626] uppercase tracking-widest ml-4">Vault Security</h3>
           <SettingItem icon={Fingerprint} title="2FA Authentication" desc="Extra layer of grail protection" actionLabel="ENABLE" />
           <SettingItem icon={Lock} title="Privacy Mode" desc="Hide collection value from public search" />
        </section>

        <section className="space-y-4">
           <h3 className="text-left comic-font text-2xl text-[#dc2626] uppercase tracking-widest ml-4">Cloud Connection</h3>
           <div className="bg-[#1a2332] border border-[#fbbf24] text-white p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-blue-600 rounded-3xl border-2 border-white/20 flex items-center justify-center shadow-2xl">
                    <Cloud size={40} className="text-white" />
                 </div>
                 <div className="text-left">
                    <h4 className="comic-font text-3xl uppercase tracking-widest leading-none mb-1">Vault Sync Active</h4>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Connected to Secure Node: US-EAST-1</p>
                 </div>
              </div>
              <button className="bg-[#fbbf24] text-[#1a2332] h-14 px-10 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all">CONFIGURE DATABASE</button>
           </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-left comic-font text-2xl text-[#dc2626] uppercase tracking-widest ml-4">Billing & Membership</h3>
           <SettingItem 
             icon={ShieldCheck} 
             title="Seller Status" 
             desc={user.isSeller ? "Verified Marketplace Seller" : "Unverified - Cannot List Grails"} 
             actionLabel={isConnectingStripe ? "CONNECTING..." : (user.isSeller ? "MANAGE STRIPE" : "VERIFY NOW")} 
             onClick={() => {
               if (!user.isSeller) {
                 handleStripeOnboarding();
               }
             }}
           />
           <SettingItem icon={CreditCard} title="Subscription" desc={`Current Tier: ${user.subscription.replace(/_/g, ' ')}`} actionLabel="UPGRADE" onClick={() => navigate('/billing')} />
           <SettingItem icon={Database} title="Storage Usage" desc={`${user.storageUsed || 0} / ${user.storageLimit || 10} Artifacts Shelved`} />
        </section>

        <div className="pt-10 flex flex-col items-center gap-4">
           <button className="text-gray-500 hover:text-red-500 flex items-center gap-2 uppercase font-black tracking-widest text-[10px] transition-colors" onClick={handleLogout}>
             <LogOut size={16} /> Eject Session
           </button>
           <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em]">Comic Vault Engine v2.5.42-Stable</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
