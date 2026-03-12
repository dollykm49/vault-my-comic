
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { WishlistItem, User } from '../types';
import { Icons } from '../constants';

interface WishlistPageProps {
  user: User;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ user }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    issueNumber: '',
    publisher: '',
    notes: '',
  });

  const loadWishlist = async () => {
    setLoading(true);
    const data = await storageService.getWishlist(user.id);
    
    // Sort wishlist: Publisher (A-Z) -> Title (A-Z) -> Issue Number (Numerical)
    const sorted = [...data].sort((a, b) => {
      // 1. Publisher
      const pubA = (a.publisher || '').toLowerCase();
      const pubB = (b.publisher || '').toLowerCase();
      if (pubA < pubB) return -1;
      if (pubA > pubB) return 1;

      // 2. Title
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;

      // 3. Issue Number
      const numA = parseInt(a.issueNumber || '0') || 0;
      const numB = parseInt(b.issueNumber || '0') || 0;
      return numA - numB;
    });

    setWishlist(sorted);
    setLoading(false);
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const handleOpenDialog = (item?: WishlistItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        issueNumber: item.issueNumber || '',
        publisher: item.publisher || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        issueNumber: '',
        publisher: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const item: WishlistItem = {
        id: editingItem?.id || Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: formData.title,
        issueNumber: formData.issueNumber || undefined,
        publisher: formData.publisher || undefined,
        notes: formData.notes || undefined,
        addedDate: editingItem?.addedDate || Date.now(),
      };
      
      await storageService.saveWishlistItem(item);
      setIsDialogOpen(false);
      loadWishlist();
    } catch (error) {
      alert('Failed to save wishlist item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your wishlist?')) return;
    try {
      await storageService.deleteWishlistItem(id);
      loadWishlist();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-[#fbbf24] rounded-full animate-spin mb-4" />
        <p className="comic-font text-[#fbbf24] tracking-widest uppercase">Consulting Oracles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl comic-font text-[#fbbf24]">MY WISHLIST</h1>
          <p className="text-gray-400 mt-1">
            Comics you're hunting for - we'll keep an eye out.
          </p>
        </div>
        <button 
          onClick={() => handleOpenDialog()}
          className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2"
        >
          <Icons.Plus className="h-5 w-5" />
          Add to Wishlist
        </button>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
          <Icons.Heart className="h-20 w-20 mx-auto text-gray-700 mb-6 opacity-30" />
          <h3 className="text-2xl comic-font text-white uppercase mb-2">The List is Empty</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Your personal hunt list. Add comics you're looking for to stay organized.
          </p>
          <button 
            onClick={() => handleOpenDialog()}
            className="bg-[#fbbf24] text-[#1a2332] px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            Start Your Hunt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#fbbf24]/50 transition-all group relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-[#fbbf24]/10 rounded-full blur-xl group-hover:bg-[#fbbf24]/30 transition-all"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-black text-white uppercase leading-tight group-hover:text-[#fbbf24] transition-colors">{item.title}</h3>
                  {item.issueNumber && (
                    <p className="text-[#fbbf24] font-bold text-sm mt-1 uppercase">Issue #{item.issueNumber}</p>
                  )}
                </div>
                <div className="p-2 bg-[#dc2626]/10 rounded-lg">
                  <Icons.Heart className="h-6 w-6 text-[#dc2626] fill-[#dc2626]" />
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                {item.publisher && (
                  <p className="text-gray-400">
                    <span className="font-black text-gray-500 uppercase text-[10px] tracking-widest block mb-0.5">Publisher</span> 
                    <span className="text-white font-medium">{item.publisher}</span>
                  </p>
                )}
                {item.notes && (
                  <p className="text-gray-400">
                    <span className="font-black text-gray-500 uppercase text-[10px] tracking-widest block mb-0.5">Scout Notes</span> 
                    <span className="text-gray-300 italic">"{item.notes}"</span>
                  </p>
                )}
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                  Added {new Date(item.addedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleOpenDialog(item)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-4 bg-[#dc2626]/10 hover:bg-[#dc2626] text-[#dc2626] hover:text-white py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-slideUp">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h2 className="text-2xl comic-font text-[#fbbf24] uppercase tracking-wider">
                {editingItem ? 'Edit Target' : 'Add Target to List'}
              </h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Comic Title *</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Action Comics"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Issue #</label>
                  <input
                    value={formData.issueNumber}
                    onChange={(e) => setFormData({ ...formData, issueNumber: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Publisher</label>
                  <input
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="e.g. DC"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Scout Notes (Condition, Price Range, etc.)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What specifically are you looking for?"
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#fbbf24] transition-all resize-none"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                >
                  {editingItem ? 'Update Target' : 'Register Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
