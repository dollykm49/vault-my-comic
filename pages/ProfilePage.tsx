import React, { useState, useRef } from 'react';
import { User, SubscriptionTier } from '../types';
import { storageService } from '../services/storageService';
import { Camera, Save, User as UserIcon, Shield, Mail, Calendar, Edit3 } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalAvatarUrl = user.avatarUrl;

      if (avatarPreview && avatarPreview !== user.avatarUrl) {
        // Upload new avatar
        const path = `avatars/${user.id}_${Date.now()}.jpg`;
        finalAvatarUrl = await storageService.uploadFile(path, avatarPreview);
      }

      await onUpdateUser({
        username,
        displayName,
        bio,
        avatarUrl: finalAvatarUrl
      });
      alert("PROFILE SECURED!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-5xl comic-font text-[#fbbf24] uppercase tracking-wider mb-2">Hero Profile</h1>
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em]">Customize your public identity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#fbbf24]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div 
              className="w-32 h-32 mx-auto rounded-full border-4 border-[#fbbf24] overflow-hidden relative cursor-pointer group/avatar mb-6"
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#1a2332] flex items-center justify-center text-[#fbbf24]">
                  <UserIcon size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />

            <h2 className="comic-font text-2xl text-white uppercase mb-1">{user.displayName || user.username}</h2>
            <div className="inline-block px-3 py-1 bg-[#fbbf24]/20 rounded-full">
              <p className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest">
                {user.subscription?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-4 text-gray-400">
              <Shield size={18} className="text-[#dc2626]" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Vault ID</p>
                <p className="text-xs font-bold text-white uppercase">CV-{user.id.substring(0,8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <Calendar size={18} className="text-[#dc2626]" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Joined Vault</p>
                <p className="text-xs font-bold text-white uppercase">{new Date(user.joinedDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase tracking-widest ml-1">
                <UserIcon size={14} /> Hero Name (Display Name)
              </label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] transition-all outline-none"
                placeholder="Enter your real name or hero name..."
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase tracking-widest ml-1">
                <UserIcon size={14} /> Hero Alias (Username)
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] transition-all outline-none"
                placeholder="Enter your collector name..."
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase tracking-widest ml-1">
                <Edit3 size={14} /> Origin Story (Bio)
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] transition-all outline-none min-h-[120px] resize-none"
                placeholder="Tell the community about your collection focus..."
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#fbbf24] text-[#1a2332] py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-[#1a2332]/30 border-t-[#1a2332] rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    SECURE PROFILE
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#dc2626] rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-tight mb-1">Identity Verification</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                Verified collectors get a special badge in the marketplace and community. Complete your Stripe onboarding in settings to earn your badge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
