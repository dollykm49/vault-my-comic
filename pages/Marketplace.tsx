
import React, { useEffect, useState } from 'react';
import { Comic, User } from '../types';
import { storageService } from '../services/storageService';
import { stripeService } from '../services/stripeService';
import { Icons } from '../constants';
import { useNavigate } from 'react-router-dom';

interface MarketplaceProps {
  user: User;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user }) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [sellers, setSellers] = useState<{[key: string]: User}>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setLoading(true);
    const [data, allProfiles] = await Promise.all([
      storageService.getMarketplaceComics(user.id),
      storageService.getAllProfiles()
    ]);
    
    const sellerMap: {[key: string]: User} = {};
    allProfiles.forEach(p => sellerMap[p.id] = p);
    
    setSellers(sellerMap);
    setComics(data);
    setLoading(false);
  };

  const handleBuy = async (comic: Comic) => {
    setBuyingId(comic.id);
    try {
      await stripeService.handleMarketplacePurchase(user, comic);
      // The user will be redirected to Stripe Checkout
    } catch (error) {
      alert("Transaction failed.");
    } finally {
      setBuyingId(null);
    }
  };

  const filtered = comics.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.publisher.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-[#fbbf24] rounded-full animate-spin mb-4" />
        <p className="comic-font text-[#fbbf24] tracking-widest uppercase">Scanning Global Listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex-1 w-full">
          <h1 className="text-5xl comic-font text-[#fbbf24] tracking-wider mb-2">LIVE MARKETPLACE</h1>
          <div className="relative max-w-xl">
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, issue, or publisher..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-[#fbbf24] transition-all"
            />
          </div>
        </div>
        {!user.isSeller && (
          <button 
            onClick={() => navigate('/marketplace')}
            className="bg-[#fbbf24] text-[#1a2332] px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap"
          >
            Become a Seller
          </button>
        )}
      </header>

      {filtered.length === 0 ? (
        <div className="text-center py-32 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5">
          <Icons.Cart className="h-20 w-20 mx-auto text-gray-700 mb-6 opacity-20" />
          <h2 className="text-2xl comic-font text-white uppercase">No items found</h2>
          <p className="text-gray-500 mt-2">Be the first to list a comic in the marketplace!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map(comic => (
            <div key={comic.id} className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col hover:border-[#fbbf24]/50 transition-all hover:-translate-y-1">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={comic.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4 bg-[#dc2626] text-white px-3 py-1 rounded-lg text-xs font-black shadow-xl border border-[#fbbf24]">
                  GRADE {comic.conditionRating.toFixed(1)}
                </div>
                {comic.isFeatured && (
                  <div className="absolute bottom-4 left-4 bg-[#fbbf24] text-[#1a2332] px-3 py-1 rounded-lg text-[10px] font-black shadow-xl animate-pulse">
                    FEATURED SPOT
                  </div>
                )}
                {comic.gradingReport && (
                  <div className="absolute top-4 right-4 bg-[#fbbf24] text-[#1a2332] p-2 rounded-lg shadow-xl" title="AI Certified">
                    <Icons.Sparkles className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight truncate mb-1">{comic.title} #{comic.issueNumber}</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">{comic.publisher} • {comic.publishYear}</p>
                  
                  {/* Seller Info */}
                  <div className="flex items-center gap-2 mb-4 p-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <Icons.UserCircle className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white uppercase truncate">
                        {sellers[comic.ownerId]?.username || 'Collector'}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-[#fbbf24] font-bold uppercase tracking-tighter">Trusted Seller</span>
                        <Icons.Sparkles className="w-2 h-2 text-[#fbbf24]" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Listing Price</p>
                      <p className="text-3xl font-black text-[#fbbf24]">${(comic.listingPrice || comic.estimatedValue).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/messages?userId=${comic.ownerId}`)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                      title="Message Seller"
                    >
                      <Icons.MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleBuy(comic)}
                    disabled={buyingId === comic.id}
                    className="w-full bg-[#dc2626] hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {buyingId === comic.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icons.Cart className="w-5 h-5" />
                        Secure Checkout
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
