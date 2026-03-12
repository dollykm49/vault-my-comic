
import React, { useState, useRef } from 'react';
import { Icons, COLORS } from '../constants';
import CameraModal from './CameraModal';
import { geminiService } from '../services/geminiService';
import { GradingResult, User, SubscriptionTier } from '../types';

interface GradingPageProps {
  user: User;
  onGradingComplete: (result: GradingResult, images: string[], title: string) => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const GradingPage: React.FC<GradingPageProps> = ({ user, onGradingComplete }) => {
  const [images, setImages] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preprocessImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64);
          return;
        }

        // Enlarge slightly if small, or keep size
        const scale = img.width < 1000 ? 1.5 : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Simple "Enhancement" - Increase contrast and sharpness via canvas filters if supported
        // or just redraw with better quality
        ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
        ctx.drawImage(canvas, 0, 0);
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const handleCapture = async (image: string) => {
    const enhanced = await preprocessImage(image);
    setImages(prev => [...prev, enhanced]);
    setIsCameraOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`"${file.name}" is too large. Max size is 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const enhanced = await preprocessImage(base64String);
        setImages(prev => [...prev, enhanced]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startGrading = async () => {
    if (images.length < 1) {
      setError("Please add at least one photo of your comic.");
      return;
    }

    setLoading(true);
    setError(null);

    const isElite = user.subscription === SubscriptionTier.VAULT_ELITE;
    const totalScans = user.freeScansRemaining + user.purchasedScansRemaining;

    if (!isElite && totalScans <= 0) {
      setError("You have no scans remaining. Please upgrade or purchase a scan pack.");
      setLoading(false);
      return;
    }

    // Check for API key
    const hasKey = typeof process !== 'undefined' && process.env && (process.env.API_KEY || process.env.GEMINI_API_KEY);
    if (!hasKey) {
      setError("Gemini API Key is missing. Please ensure API_KEY or GEMINI_API_KEY is set in your environment.");
      setLoading(false);
      return;
    }

    try {
      const result = await geminiService.gradeComic(images, title);
      
      if (result.status !== 'success') {
        const refusalMessages = {
          'refused_quality': "IMAGE QUALITY REJECTED: The AI cannot see enough detail. Please provide clearer, high-resolution photos of the corners and spine.",
          'refused_restoration': "RESTORATION DETECTED: The AI suspects this comic has been restored (glue, tape, or trimming). Professional grading is required.",
          'refused_uncertain': "MARKET UNCERTAINTY: The AI cannot confidently estimate a value for this specific issue/grade. No scan credit will be used.",
        };
        
        setError(result.refusalMessage || refusalMessages[result.status as keyof typeof refusalMessages] || "The AI could not complete the grading report.");
        setLoading(false);
        return;
      }

      onGradingComplete(result, images, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <header className="text-center">
        <h1 className="text-4xl comic-font text-[#fbbf24] mb-2 uppercase tracking-widest">AI COMIC GRADING</h1>
        <p className="text-gray-400">Get an instant professional-grade analysis powered by Gemini.</p>
        {(user.subscription === SubscriptionTier.VAULT_ELITE) ? (
          <div className="mt-4 inline-flex items-center gap-2 bg-[#dc2626]/20 text-[#dc2626] px-4 py-1 rounded-full border border-[#dc2626]/30 font-black uppercase text-[10px] tracking-widest">
            <Icons.Sparkles className="w-4 h-4" />
            Unlimited Mastermind Scans
          </div>
        ) : (user.freeScansRemaining + user.purchasedScansRemaining > 0) && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1 rounded-full border border-green-500/30 font-medium text-sm">
              <Icons.GraduationCap className="w-5 h-5" />
              {user.freeScansRemaining + user.purchasedScansRemaining} Scan{user.freeScansRemaining + user.purchasedScansRemaining !== 1 ? 's' : ''} Remaining
            </div>
            {user.purchasedScansRemaining > 0 && (
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                ({user.freeScansRemaining} Free + {user.purchasedScansRemaining} Purchased)
              </span>
            )}
          </div>
        )}
      </header>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc2626] via-[#fbbf24] to-[#dc2626]"></div>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Comic Title & Issue</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Amazing Spider-Man #300"
              className="w-full bg-[#1a2332] border border-gray-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent outline-none transition-all placeholder:text-gray-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">
              Grading Evidence (Front, Back, Corners)
              <span className="ml-2 text-[#fbbf24] normal-case font-medium italic opacity-80">
                Tip: Submitting 2-3 photos helps accuracy, but 1 is fine!
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden group border-2 border-white/5 shadow-lg">
                  <img src={img} alt={`Scan ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => setIsCameraOpen(true)}
                className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#fbbf24] hover:bg-[#fbbf24]/5 transition-all text-gray-500 hover:text-[#fbbf24] group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#fbbf24]/20">
                  <Icons.Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Snap Photo</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#fbbf24] hover:bg-[#fbbf24]/5 transition-all text-gray-500 hover:text-[#fbbf24] group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#fbbf24]/20">
                  <Icons.Upload className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Upload File</span>
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            onClick={startGrading}
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all uppercase tracking-[0.2em] ${
              loading 
                ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                : 'bg-[#dc2626] hover:bg-red-700 text-white hover:shadow-red-500/40 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                AI ANALYZING DATA...
              </span>
            ) : (
              'ANALYZE & ISSUE GRADE'
            )}
          </button>

          <div className="text-center space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Max 10MB per image • Gemini 2.0 Pro Analysis
            </p>
            <p className="text-[9px] text-gray-600 max-w-sm mx-auto leading-relaxed">
              For accurate grading, ensure images are in focus with bright lighting. Capturing close-ups of the spine and corners improves quality scores.
            </p>
          </div>
        </div>
      </div>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCapture} 
      />
    </div>
  );
};

export default GradingPage;
