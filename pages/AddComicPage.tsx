import React, { useState, useRef } from 'react';
import { Icons, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { supabase } from '../supabase';
import { User, SubscriptionTier, Comic } from '../types';
import { useNavigate } from 'react-router-dom';

interface AddComicPageProps {
  user: User;
  onAdd: (comic: Comic) => void;
}

const AddComicPage: React.FC<AddComicPageProps> = ({ user, onAdd }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    issueNumber: '',
    publisher: '',
    publishYear: new Date().getFullYear(),
    purchasePrice: '',
    estimatedValue: '',
    notes: '',
    coverImage: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = user.subscription === SubscriptionTier.VAULT_ELITE;

  const handleAutofill = async () => {
    if (!formData.title) {
      alert("Enter a title first!");
      return;
    }
    
    if (typeof process !== 'undefined' && (!process.env.API_KEY || process.env.API_KEY === 'undefined')) {
      alert("Gemini API Key is missing. Autofill requires an API key.");
      return;
    }

    setLoading(true);
    try {
      const data = await geminiService.autofillComicDetails(formData.title, formData.coverImage);
      setFormData(prev => ({
        ...prev,
        publisher: data.publisher,
        issueNumber: data.issueNumber,
        publishYear: data.publishYear,
        notes: prev.notes + (prev.notes ? "\n\n" : "") + "History: " + data.briefHistory
      }));
    } catch (e) {
      alert("Autofill failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const comicId = Math.random().toString(36).substr(2, 9);
      let coverUrl = formData.coverImage || 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?q=80&w=300&auto=format&fit=crop';
      
      // Upload image to Cloud Storage if it's a local file (base64) and Supabase is ready
      if (formData.coverImage && formData.coverImage.startsWith('data:')) {
        if (supabase) {
          try {
            coverUrl = await storageService.uploadFile(`covers/${user.id}/${comicId}.jpg`, formData.coverImage);
          } catch (uploadError) {
            console.error("Cover upload failed, using local data:", uploadError);
            coverUrl = formData.coverImage;
          }
        } else {
          // Fallback to base64 if Supabase is not ready
          coverUrl = formData.coverImage;
        }
      }

      const newComic: Comic = {
        id: comicId,
        ownerId: user.id,
        title: formData.title,
        issueNumber: formData.issueNumber,
        publisher: formData.publisher,
        publishYear: Number(formData.publishYear),
        conditionRating: 10,
        purchasePrice: Number(formData.purchasePrice),
        estimatedValue: Number(formData.estimatedValue),
        coverImage: coverUrl,
        notes: formData.notes,
        isForSale: false
      };
      
      onAdd(newComic);
      navigate('/collection');
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving comic to vault. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, coverImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl comic-font text-[#fbbf24]">ADD NEW COMIC</h1>
        {isPro && (
          <button 
            type="button"
            onClick={handleAutofill}
            disabled={loading}
            className="flex items-center gap-2 bg-[#fbbf24] text-[#1a2332] px-6 py-2 rounded-xl font-black shadow-lg hover:scale-105 transition-all"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Icons.Sparkles className="w-5 h-5" />}
            AI AUTOFILL
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-3xl border border-white/10">
        <div className="space-y-6">
          <div className="relative group aspect-[2/3] bg-black/40 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {formData.coverImage ? (
              <img src={formData.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <>
                <Icons.Camera className="w-12 h-12 text-gray-500 group-hover:text-white transition-colors" />
                <p className="text-gray-500 text-sm mt-4 font-bold uppercase">Click to Upload Cover</p>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImage} accept="image/*" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
            <input 
              required
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#fbbf24]" 
              placeholder="e.g. Detective Comics"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Issue #</label>
              <input 
                value={formData.issueNumber} 
                onChange={e => setFormData({...formData, issueNumber: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" 
                placeholder="27"
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Year</label>
              <input 
                type="number"
                value={formData.publishYear} 
                onChange={e => setFormData({...formData, publishYear: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Publisher</label>
            <input 
              value={formData.publisher} 
              onChange={e => setFormData({...formData, publisher: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" 
              placeholder="DC, Marvel, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bought For ($)</label>
              <input 
                type="number"
                value={formData.purchasePrice} 
                onChange={e => setFormData({...formData, purchasePrice: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Est. Value ($)</label>
              <input 
                type="number"
                value={formData.estimatedValue} 
                onChange={e => setFormData({...formData, estimatedValue: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notes</label>
            <textarea 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" 
              placeholder="Personal notes or AI history summary..."
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#dc2626] text-white py-4 rounded-xl font-black shadow-xl hover:shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'UPLOADING TO VAULT...' : 'SECURE IN VAULT'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddComicPage;