import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { Search, User as UserIcon, MessageSquare, Shield, Globe, Users, Zap, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommunityThreadsPage from './CommunityThreadsPage';

interface CommunityPageProps {
  user: User;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'collectors' | 'discussions'>('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [featuredCollectors, setFeaturedCollectors] = useState<User[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const profiles = await storageService.getAllProfiles();
      // Just take some random ones for now, excluding current user
      const filtered = profiles.filter(p => p.id !== user.id).slice(0, 6);
      setFeaturedCollectors(filtered);
    };
    fetchFeatured();
  }, [user.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const users = await storageService.searchProfiles(searchQuery);
      setResults(users.filter(u => u.id !== user.id));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const startChat = (otherUser: User) => {
    navigate(`/messages?userId=${otherUser.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-full">
          <Globe size={12} className="text-[#fbbf24]" />
          <span className="text-[10px] font-black text-[#fbbf24] uppercase tracking-[0.2em]">Global Collector Network</span>
        </div>
        <h1 className="text-6xl comic-font text-[#fbbf24] uppercase tracking-wider">The Community</h1>
        <p className="text-gray-500 font-black text-xs uppercase tracking-[0.3em] max-w-2xl mx-auto">
          Connect with fellow collectors, trade grails, and build your network in the ultimate comic ecosystem.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => setActiveTab('discussions')}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
            activeTab === 'discussions' 
              ? 'bg-[#fbbf24] text-[#1a2332] shadow-lg shadow-[#fbbf24]/20' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <MessageCircle size={16} />
          Discussions
        </button>
        <button 
          onClick={() => setActiveTab('collectors')}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
            activeTab === 'collectors' 
              ? 'bg-[#fbbf24] text-[#1a2332] shadow-lg shadow-[#fbbf24]/20' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Users size={16} />
          Collectors
        </button>
      </div>

      {activeTab === 'discussions' ? (
        <CommunityThreadsPage user={user} />
      ) : (
        <>
          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by alias (username)..."
                className="w-full bg-black/40 border-2 border-white/10 rounded-[2rem] px-8 py-6 text-white font-bold focus:border-[#fbbf24] focus:ring-0 transition-all outline-none pl-16"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#fbbf24] text-[#1a2332] px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
              >
                FIND HEROES
              </button>
            </form>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="comic-font text-2xl text-[#dc2626] uppercase tracking-widest">Search Results</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              {isSearching ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map(profile => (
                    <div key={profile.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Zap size={16} className="text-[#fbbf24]" />
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl border-2 border-[#fbbf24]/30 overflow-hidden bg-[#1a2332] shrink-0">
                          {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#fbbf24]">
                              <UserIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div className="text-left overflow-hidden">
                          <h4 className="comic-font text-xl text-white uppercase truncate">{profile.username}</h4>
                          <p className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest truncate">
                            {profile.subscription?.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>

                      {profile.bio && (
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest line-clamp-2 mb-6 h-8 leading-relaxed">
                          {profile.bio}
                        </p>
                      )}

                      <button 
                        onClick={() => startChat(profile)}
                        className="w-full bg-white/10 hover:bg-[#fbbf24] hover:text-[#1a2332] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={14} />
                        SEND MESSAGE
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Users size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No collectors found matching your search.</p>
                </div>
              )}
            </section>
          )}

          {/* Featured Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="comic-font text-3xl text-[#dc2626] uppercase tracking-widest">Active Collectors</h3>
                <div className="h-px w-32 bg-white/5" />
              </div>
              <div className="flex items-center gap-2 text-[#fbbf24] text-[10px] font-black uppercase tracking-widest">
                <Shield size={14} /> Verified Network
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCollectors.map(profile => (
                <div key={profile.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={16} className="text-[#fbbf24]" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-[#fbbf24]/30 overflow-hidden bg-[#1a2332] shrink-0">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#fbbf24]">
                          <UserIcon size={24} />
                        </div>
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <h4 className="comic-font text-xl text-white uppercase truncate">{profile.username}</h4>
                      <p className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest truncate">
                        {profile.subscription?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest line-clamp-2 mb-6 h-8 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  <button 
                    onClick={() => startChat(profile)}
                    className="w-full bg-white/10 hover:bg-[#fbbf24] hover:text-[#1a2332] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} />
                    SEND MESSAGE
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Community Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            {[
              { label: 'Active Vaults', value: '12,482', icon: Shield },
              { label: 'Grails Secured', value: '1.2M+', icon: Zap },
              { label: 'Global Trades', value: '45K', icon: Globe }
            ].map((stat, i) => (
              <div key={i} className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-8 rounded-[2.5rem] text-center">
                <div className="w-12 h-12 bg-[#fbbf24]/20 text-[#fbbf24] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={24} />
                </div>
                <h4 className="text-3xl comic-font text-white mb-1">{stat.value}</h4>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CommunityPage;
