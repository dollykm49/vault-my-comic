import React, { useState } from 'react';
import { Comic, User, SubscriptionTier } from '../types';
import { Icons } from '../constants';
import GradingResultPage from './GradingResultPage';
import { storageService } from '../services/storageService';

interface CollectionPageProps {
  user: User;
  comics: Comic[];
  onDelete: (id: string) => void;
  onImport: (comics: Comic[]) => void;
}

const CollectionPage: React.FC<CollectionPageProps> = ({ user, comics, onDelete, onImport }) => {
  const [activeTab, setActiveTab] = useState<'comics' | 'history'>('comics');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [expandedPublishers, setExpandedPublishers] = useState<Set<string>>(new Set());
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  const [viewingReport, setViewingReport] = useState<Comic | null>(null);
  const [listingComic, setListingComic] = useState<Comic | null>(null);
  const [listingPrice, setListingPrice] = useState<string>('');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  const isElite = user.subscription === SubscriptionTier.VAULT_ELITE;

  // Sort comics: Publisher (A-Z) -> Title (A-Z) -> Issue Number (Numerical)
  const sortedComics = [...comics].sort((a, b) => {
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
    const numA = parseInt(a.issueNumber) || 0;
    const numB = parseInt(b.issueNumber) || 0;
    return numA - numB;
  });

  const gradedComics = comics.filter(c => c.gradingReport).sort((a, b) => 
    (b.gradingReport?.date || 0) - (a.gradingReport?.date || 0)
  );

  const groupComics = (comics: Comic[]) => {
    const pubMap = new Map<string, Map<string, Comic[]>>();
    
    comics.forEach(comic => {
      const pub = comic.publisher || 'Unknown Publisher';
      const title = comic.title || 'Untitled';
      
      if (!pubMap.has(pub)) pubMap.set(pub, new Map());
      const titleMap = pubMap.get(pub)!;
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title)!.push(comic);
    });

    // Convert Map to sorted array structure
    return Array.from(pubMap.entries()).map(([publisher, titleMap]) => ({
      publisher,
      titles: Array.from(titleMap.entries()).map(([title, comics]) => ({
        title,
        comics
      }))
    }));
  };

  const groupedData = groupComics(sortedComics);

  const stats = {
    total: comics.length,
    value: comics.reduce((sum, c) => sum + (c.estimatedValue || 0), 0),
    forSale: comics.filter(c => c.isForSale).length
  };

  const togglePublisher = (pub: string) => {
    const newExpanded = new Set(expandedPublishers);
    if (newExpanded.has(pub)) newExpanded.delete(pub);
    else newExpanded.add(pub);
    setExpandedPublishers(newExpanded);
  };

  const toggleTitle = (titleKey: string) => {
    const newExpanded = new Set(expandedTitles);
    if (newExpanded.has(titleKey)) newExpanded.delete(titleKey);
    else newExpanded.add(titleKey);
    setExpandedTitles(newExpanded);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comics));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "my_vault_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            onImport(imported);
            alert(`Successfully imported ${imported.length} comics!`);
          }
        } catch (err) {
          alert("Invalid file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleListForSale = async () => {
    if (!listingComic || !listingPrice) return;
    
    try {
      const updatedComic = {
        ...listingComic,
        isForSale: true,
        listingPrice: Number(listingPrice),
        isFeatured: isElite ? isFeatured : false
      };
      await storageService.saveComic(updatedComic);
      alert("LISTING LIVE!\n\nYour comic is now visible in the marketplace.");
      setListingComic(null);
      setListingPrice('');
      setIsFeatured(false);
      window.location.reload();
    } catch (e) {
      alert("Failed to list comic.");
    }
  };

  const handleRemoveListing = async (comic: Comic) => {
    if (confirm("Remove this listing from the marketplace?")) {
      const updatedComic = { ...comic, isForSale: false, listingPrice: undefined };
      await storageService.saveComic(updatedComic);
      window.location.reload();
    }
  };

  const renderComicCard = (comic: Comic) => (
    <div key={comic.id} className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-[#fbbf24]/50 transition-all flex flex-col">
      <div className="relative aspect-[3/4]">
        <img src={comic.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        {comic.isForSale && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg">FOR SALE</div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {comic.gradingReport && (
            <button onClick={() => setViewingReport(comic)} className="p-2 bg-[#fbbf24] text-[#1a2332] rounded-lg">
              <Icons.GraduationCap className="w-5 h-5" />
            </button>
          )}
          {user.isSeller && (
            comic.isForSale ? (
              <button onClick={() => handleRemoveListing(comic)} className="p-2 bg-gray-700 text-white rounded-lg" title="Unlist">
                <Icons.Cart className="w-5 h-5 opacity-50" />
              </button>
            ) : (
              <button onClick={() => { setListingComic(comic); setListingPrice(comic.estimatedValue.toString()); }} className="p-2 bg-green-500 text-white rounded-lg" title="List for Sale">
                <Icons.Cart className="w-5 h-5" />
              </button>
            )
          )}
          <button onClick={() => onDelete(comic.id)} className="p-2 bg-[#dc2626] text-white rounded-lg">
            <Icons.Trash className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm uppercase truncate">{comic.title} #{comic.issueNumber}</h3>
        <p className="text-xs text-[#fbbf24] font-black mt-1">Est. ${comic.estimatedValue.toLocaleString()}</p>
        {comic.isForSale && (
          <p className="text-[10px] text-green-400 font-bold uppercase mt-1">Listed: ${comic.listingPrice?.toLocaleString()}</p>
        )}
      </div>
    </div>
  );

  if (viewingReport && viewingReport.gradingReport) {
    return (
      <GradingResultPage 
        user={user}
        result={viewingReport.gradingReport}
        images={viewingReport.gradingReport.images || [viewingReport.coverImage]}
        title={viewingReport.title}
        onSaveToCollection={() => {}}
        onReset={() => setViewingReport(null)}
        isRecallMode={true}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl comic-font text-[#fbbf24]">MY VAULT</h1>
          <p className="text-gray-400 text-sm">{comics.length} comics registered</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isElite && (
            <div className="flex gap-2 mr-4">
              <button onClick={handleImportClick} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10">
                <Icons.Upload className="w-4 h-4" />
                IMPORT
              </button>
              <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10">
                <Icons.Download className="w-4 h-4" />
                EXPORT
              </button>
            </div>
          )}
          <div className="bg-white/5 p-1 rounded-xl flex border border-white/10">
            <button onClick={() => setViewMode('grouped')} className={`p-2 rounded-lg ${viewMode === 'grouped' ? 'bg-[#fbbf24] text-[#1a2332]' : 'text-gray-400'}`}>
              <Icons.List className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#fbbf24] text-[#1a2332]' : 'text-gray-400'}`}>
              <Icons.Grid className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => window.location.hash = '#/collection/new'} className="bg-[#dc2626] hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Icons.Plus className="w-5 h-5" />
            ADD NEW
          </button>
        </div>
      </div>

      {/* Vault Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-2xl flex items-center justify-center">
            <Icons.Plus className="w-6 h-6 text-[#fbbf24]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Comics</p>
            <p className="text-2xl font-black text-white">{stats.total.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
            <Icons.GraduationCap className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vault Value</p>
            <p className="text-2xl font-black text-white">${stats.value.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-[#dc2626]/20 rounded-2xl flex items-center justify-center">
            <Icons.Cart className="w-6 h-6 text-[#dc2626]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">For Sale</p>
            <p className="text-2xl font-black text-white">{stats.forSale.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab('comics')}
          className={`px-8 py-4 font-black uppercase tracking-widest text-sm transition-all relative ${
            activeTab === 'comics' ? 'text-[#fbbf24]' : 'text-gray-500 hover:text-white'
          }`}
        >
          My Comics
          {activeTab === 'comics' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#fbbf24]" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-4 font-black uppercase tracking-widest text-sm transition-all relative ${
            activeTab === 'history' ? 'text-[#fbbf24]' : 'text-gray-500 hover:text-white'
          }`}
        >
          Grading History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#fbbf24]" />}
        </button>
      </div>

      {activeTab === 'comics' ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedComics.map(comic => renderComicCard(comic))}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedData.map(({ publisher, titles }) => (
              <div key={publisher} className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                <button 
                  onClick={() => togglePublisher(publisher)}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#fbbf24] text-[#1a2332] px-3 py-1 rounded-lg font-black text-xs uppercase tracking-widest">
                      {publisher}
                    </div>
                    <span className="text-gray-400 text-sm font-bold">
                      {titles.reduce((sum, t) => sum + t.comics.length, 0)} Comics
                    </span>
                  </div>
                  <div className={`transform transition-transform ${expandedPublishers.has(publisher) ? 'rotate-180' : ''}`}>
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedPublishers.has(publisher) && (
                  <div className="p-6 pt-0 space-y-4">
                    {titles.map(({ title, comics }) => {
                      const titleKey = `${publisher}-${title}`;
                      return (
                        <div key={title} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                          <button 
                            onClick={() => toggleTitle(titleKey)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Icons.List className="w-4 h-4 text-[#fbbf24]" />
                              <h3 className="font-bold text-white uppercase tracking-wider">{title}</h3>
                              <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded text-[10px] font-black">
                                {comics.length} ISSUES
                              </span>
                            </div>
                            <div className={`transform transition-transform ${expandedTitles.has(titleKey) ? 'rotate-180' : ''}`}>
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {expandedTitles.has(titleKey) && (
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/5">
                              {comics.map(comic => renderComicCard(comic))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {gradedComics.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
              <Icons.GraduationCap className="w-16 h-16 mx-auto text-gray-700 mb-4 opacity-20" />
              <h3 className="text-xl font-black text-white uppercase">No Grading History</h3>
              <p className="text-gray-500 mt-2">Comics you grade will appear here for easy access to certificates.</p>
              <button 
                onClick={() => window.location.hash = '#/grading'}
                className="mt-6 bg-[#fbbf24] text-[#1a2332] px-6 py-2 rounded-xl font-black uppercase tracking-widest"
              >
                Grade a Comic
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {gradedComics.map(comic => (
                <div key={comic.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-[#fbbf24]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/10">
                      <img src={comic.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase tracking-wider">{comic.title} #{comic.issueNumber}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="bg-[#fbbf24] text-[#1a2332] px-2 py-0.5 rounded text-[10px] font-black">GRADE {comic.gradingReport?.grade.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          {new Date(comic.gradingReport?.date || 0).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewingReport(comic)}
                      className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10"
                    >
                      <Icons.GraduationCap className="w-4 h-4 text-[#fbbf24]" />
                      VIEW REPORT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing Modal */}
      {listingComic && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border border-white/10 w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl comic-font text-[#fbbf24] mb-2 uppercase">List for Sale</h2>
              <p className="text-gray-400 text-sm">{listingComic.title} #{listingComic.issueNumber}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Asking Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input 
                    type="number"
                    value={listingPrice}
                    onChange={e => setListingPrice(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-8 pr-4 outline-none focus:border-[#fbbf24]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-medium italic">Estimated Value: ${listingComic.estimatedValue.toLocaleString()}</p>
              </div>

              {isElite && (
                <div className="flex items-center justify-between bg-[#fbbf24]/10 p-4 rounded-xl border border-[#fbbf24]/20">
                  <div>
                    <p className="text-white font-black text-xs uppercase tracking-widest">Featured Spot</p>
                    <p className="text-[10px] text-[#fbbf24] font-bold">Elite Perk: Highlight your listing</p>
                  </div>
                  <button 
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isFeatured ? 'bg-[#fbbf24]' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isFeatured ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              )}

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Marketplace Fee (12%)</span>
                  <span className="text-red-400">-${(Number(listingPrice) * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-white border-t border-white/10 pt-2">
                  <span>Your Net Payout</span>
                  <span className="text-green-400">${(Number(listingPrice) * 0.88).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setListingComic(null)} className="flex-1 bg-white/5 text-white py-4 rounded-xl font-bold uppercase tracking-widest">Cancel</button>
              <button onClick={handleListForSale} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-green-500/20">Go Live</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;