import React, { useState } from 'react';
import { Palette, Sparkles, Wand2, Download, Save, RefreshCw, Layers, History, Trash2, Maximize2, Lock } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { User, GeneratedArt, SubscriptionTier } from '../types';
import { useNavigate } from 'react-router-dom';

interface ArtLabProps {
  user: User;
}

const ArtLab: React.FC<ArtLabProps> = ({ user }) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("3:4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentArt, setCurrentArt] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedArt[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  React.useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback for non-AI Studio environments
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const isElite = user.subscription === SubscriptionTier.VAULT_ELITE;
  const hasArtLabAccess = isElite || user.hasArtLab;

  const handleGenerate = async () => {
    if (!hasArtLabAccess) {
      alert("The Art Lab is exclusive to 'The Mastermind' tier members or ArtLab Pro subscribers. Upgrade to manifest your visions!");
      navigate('/billing');
      return;
    }
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const imageUrl = await geminiService.generateArt(prompt, aspectRatio);
      setCurrentArt(imageUrl);
      
      const newArt: GeneratedArt = {
        id: Math.random().toString(36).substr(2, 9),
        prompt,
        imageUrl,
        aspectRatio,
        createdAt: new Date().toISOString()
      };
      setHistory(prev => [newArt, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to manifest art. The Multiverse is busy. Try again!");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasArtLabAccess) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-[#fbbf24]/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-[#fbbf24]/20">
          <Lock size={48} className="text-[#fbbf24]" />
        </div>
        <h1 className="comic-font text-5xl text-white uppercase tracking-wider mb-4">RESTRICTED ACCESS</h1>
        <p className="text-gray-400 max-w-md mx-auto mb-10 font-bold uppercase text-xs tracking-widest leading-relaxed">
          The Art Lab Multiverse Engine requires "The Mastermind" clearance or an ArtLab Pro subscription. Upgrade your identity to generate infinite comic variations.
        </p>
        <button 
          onClick={() => navigate('/billing')}
          className="bg-[#fbbf24] text-[#1a2332] px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[#fbbf24]/20"
        >
          UPGRADE ACCESS
        </button>
      </div>
    );
  }

  const downloadArt = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `comic-vault-art-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Control Center */}
      <div className="bg-[#1a2332] text-white p-8 rounded-[2.5rem] border border-[#fbbf24] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Palette size={200} />
        </div>
        
        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-left space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#fbbf24] text-[#1a2332] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                <Sparkles size={12} fill="currentColor" /> Multiverse Engine v3.0
              </div>
              <h1 className="comic-font text-5xl uppercase tracking-wider leading-none">Comic Art Lab</h1>
              <p className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Generate infinite variations of your favorite grails.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Manifestation Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A silver age Spider-Man vs Carnage in a rainy cyberpunk Tokyo skyline, oil painting style..."
                  className="w-full h-32 bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-[#fbbf24] outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Aspect Ratio</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none appearance-none cursor-pointer"
                  >
                    <option value="1:1" className="bg-[#1a2332]">Square (1:1)</option>
                    <option value="3:4" className="bg-[#1a2332]">Comic Standard (3:4)</option>
                    <option value="4:3" className="bg-[#1a2332]">Landscape (4:3)</option>
                    <option value="9:16" className="bg-[#1a2332]">Mobile (9:16)</option>
                    <option value="16:9" className="bg-[#1a2332]">Cinematic (16:9)</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  {!hasApiKey && window.aistudio && (
                    <button 
                      onClick={handleSelectApiKey}
                      className="h-12 px-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all"
                    >
                      Set API Key
                    </button>
                  )}
                  <button 
                    className="flex-1 h-12 bg-[#fbbf24] text-[#1a2332] rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim() || (!hasApiKey && !!window.aistudio)}
                  >
                    {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    {isGenerating ? "MANIFESTING..." : "GENERATE ART"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className={`aspect-[${aspectRatio.replace(':', '/')}] bg-slate-800 rounded-[2rem] border border-white/10 shadow-inner flex items-center justify-center overflow-hidden transition-all duration-700 ${isGenerating ? 'animate-pulse' : ''}`}>
              {currentArt ? (
                <div className="relative w-full h-full group">
                  <img src={currentArt} className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" alt="Generated" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => downloadArt(currentArt)} className="p-3 bg-[#fbbf24] text-[#1a2332] rounded-full hover:scale-110 transition-transform shadow-xl">
                      <Download size={24} />
                    </button>
                    <button className="p-3 bg-white text-[#1a2332] rounded-full hover:scale-110 transition-transform shadow-xl">
                      <Save size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 space-y-4 opacity-20">
                  <Palette size={64} className="mx-auto" />
                  <p className="comic-font text-2xl uppercase tracking-widest">Awaiting Creation</p>
                </div>
              )}
            </div>
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-[2rem] z-20">
                <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="comic-font text-xl uppercase tracking-widest text-white">Painting the Multiverse...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History / Gallery */}
      <div className="space-y-6 text-left">
        <div className="flex items-center justify-between border-b-2 border-white/5 pb-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#fbbf24] text-[#1a2332] rounded-lg">
                <History size={18} />
             </div>
             <h2 className="comic-font text-3xl uppercase tracking-wider text-white">Creation Gallery</h2>
          </div>
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{history.length} ITEMS ARCHIVED</span>
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {history.map((art) => (
              <div key={art.id} className="group relative aspect-[3/4] bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:translate-y-[-4px]">
                <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.prompt} referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-[#1a2332]/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                  <p className="text-[8px] font-bold text-white uppercase leading-tight line-clamp-3">{art.prompt}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentArt(art.imageUrl)} className="flex-1 p-2 bg-white text-[#1a2332] rounded-lg hover:bg-[#fbbf24] transition-colors flex justify-center">
                      <Maximize2 size={12} />
                    </button>
                    <button onClick={() => downloadArt(art.imageUrl)} className="flex-1 p-2 bg-white text-[#1a2332] rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex justify-center">
                      <Download size={12} />
                    </button>
                    <button onClick={() => setHistory(prev => prev.filter(a => a.id !== art.id))} className="flex-1 p-2 bg-white text-[#1a2332] rounded-lg hover:bg-red-500 hover:text-white transition-colors flex justify-center">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 bg-white/5 rounded-[2rem] border-4 border-dashed border-white/5 text-center flex flex-col items-center">
             <Layers size={48} className="text-gray-700 mb-4" />
             <p className="comic-font text-2xl uppercase tracking-widest text-gray-600">Your Gallery is Empty</p>
             <p className="text-gray-500 font-bold uppercase text-[9px] mt-2 tracking-widest">Start generating to build your multiversal archive.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtLab;
