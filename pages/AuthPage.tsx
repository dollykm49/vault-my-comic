
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase.ts';
import { storageService } from '../services/storageService.ts';
import { SubscriptionTier, UserRole, User } from '../types.ts';

interface AuthPageProps {
  onDemoLogin?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onDemoLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [tier, setTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Authentication service is unavailable.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
            }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          const newUser: User = {
            id: data.user.id,
            username: username || email.split('@')[0],
            role: UserRole.USER,
            subscription: tier,
            freeScansRemaining: tier === SubscriptionTier.FREE ? 1 : 999,
            purchasedScansRemaining: 0,
            hasArtLab: tier === SubscriptionTier.VAULT_ELITE,
            isSeller: false,
            stripeConnected: false,
            joinedDate: Date.now()
          };

          await storageService.createProfile(data.user.id, newUser);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      alert("A password reset link has been sent to your email address.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#dc2626]/10 rounded-full blur-3xl"></div>
        
        <h2 className="text-4xl comic-font text-[#fbbf24] text-center mb-2">
          {isSignUp ? 'JOIN THE VAULT' : 'ACCESS GRANTED'}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-8">
          {isSignUp ? 'Create your hero identity today.' : 'Welcome back, collector.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Hero Identity</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  className="w-full bg-[#1a2332] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#dc2626] outline-none transition-all" 
                  placeholder="e.g. Peter Parker" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Membership Tier</label>
                <select 
                  value={tier} 
                  onChange={(e) => setTier(e.target.value as SubscriptionTier)} 
                  className="w-full bg-[#1a2332] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#dc2626] outline-none appearance-none cursor-pointer"
                >
                  <option value={SubscriptionTier.FREE}>Rookie Informant ($0)</option>
                  <option value={SubscriptionTier.COLLECTOR}>Gumshoe Detective ($9.99)</option>
                  <option value={SubscriptionTier.VAULT_ELITE}>The Mastermind ($49.99)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full bg-[#1a2332] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#dc2626] outline-none transition-all" 
              placeholder="hero@dailybugle.com" 
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Secret Code (Password)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full bg-[#1a2332] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#dc2626] outline-none transition-all" 
              placeholder="••••••••" 
            />
          </div>

          {!isSignUp && (
            <div className="flex justify-end -mt-2">
              <button 
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-gray-500 hover:text-[#fbbf24] transition-colors font-bold uppercase tracking-widest"
              >
                Forgot Secret Code?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Initializing...
              </span>
            ) : isSignUp ? 'CREATE ACCOUNT' : 'SECURE LOGIN'}
          </button>

          {isSignUp && (
            <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest mt-4">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-[#fbbf24] hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-[#fbbf24] hover:underline">Privacy Policy</Link>.
            </p>
          )}

        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gray-400 hover:text-[#fbbf24] text-sm font-bold transition-colors uppercase tracking-widest"
          >
            {isSignUp ? 'Already have an identity? Login' : "New hero? Join the vault"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
