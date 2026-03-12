
import React, { useState } from 'react';
import { GradingResult, Comic, User, SubscriptionTier } from '../types';
import { Icons } from '../constants';
import MarketTrends from '../components/MarketTrends';
import DigitalSlab from '../components/DigitalSlab';
import { geminiService } from '../services/geminiService';

interface GradingResultPageProps {
  user: User;
  result: GradingResult;
  images: string[];
  title: string;
  onSaveToCollection: (metadata: { title: string, issueNumber: string, publisher: string, publishYear: string }) => void;
  onReset: () => void;
  isRecallMode?: boolean;
  isSaving?: boolean;
  isDemoMode?: boolean;
}

const GradingResultPage: React.FC<GradingResultPageProps> = ({ 
  user,
  result, 
  images, 
  title, 
  onSaveToCollection,
  onReset,
  isRecallMode = false,
  isSaving = false,
  isDemoMode = false
}) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSlab, setShowSlab] = useState(false);
  const [formData, setFormData] = useState({
    title: title || result.identifiedTitle || '',
    issueNumber: '',
    publisher: '',
    publishYear: new Date().getFullYear().toString()
  });
  const [isAutofilling, setIsAutofilling] = useState(false);
  const isElite = user.subscription === SubscriptionTier.VAULT_ELITE;

  const handleAutofill = async () => {
    if (!formData.title && !images[0]) return;
    setIsAutofilling(true);
    try {
      const metadata = await geminiService.autofillComicDetails(formData.title || 'Unknown Comic', images[0]);
      setFormData({
        title: formData.title || metadata.title || '',
        issueNumber: metadata.issueNumber || '',
        publisher: metadata.publisher || '',
        publishYear: metadata.publishYear?.toString() || new Date().getFullYear().toString()
      });
    } catch (err) {
      console.error("Autofill failed:", err);
    } finally {
      setIsAutofilling(false);
    }
  };

  const handlePrint = () => {
    try {
      if (typeof window !== 'undefined') {
        window.focus();
        setTimeout(() => {
          window.print();
        }, 250);
      }
    } catch (err) {
      console.error('Print failed:', err);
      alert("The print dialog could not be opened. You can try using the browser's print shortcut (Ctrl+P or Cmd+P) to save the report.");
    }
  };

  const verificationId = `CV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  if (showCertificate && isElite) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
        <div className="flex justify-between items-center no-print">
          <button 
            onClick={() => setShowCertificate(false)} 
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Report
          </button>
          <button 
            onClick={handlePrint}
            className="bg-[#fbbf24] text-[#1a2332] px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Icons.Printer className="w-5 h-5" />
            Print Certificate
          </button>
        </div>

        {/* Sophisticated Mastermind Certificate */}
        <div className="bg-[#fdfcf0] text-[#1a2332] p-12 md:p-20 rounded-none border-[20px] border-double border-[#fbbf24] relative shadow-2xl overflow-hidden print:m-0 print:shadow-none print:border-[15px]">
          {/* Elegant Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          {/* Gold Seal */}
          <div className="absolute bottom-12 right-12 w-40 h-40 flex items-center justify-center opacity-90">
            <div className="absolute inset-0 bg-[#fbbf24] rounded-full animate-pulse opacity-20" />
            <div className="w-32 h-32 border-4 border-dashed border-[#fbbf24] rounded-full flex items-center justify-center p-2">
              <div className="w-full h-full bg-[#fbbf24] rounded-full flex flex-col items-center justify-center text-center p-2 shadow-inner">
                <Icons.GraduationCap className="w-8 h-8 text-[#1a2332] mb-1" />
                <span className="text-[8px] font-black uppercase tracking-tighter leading-none text-[#1a2332]">VAULT ELITE</span>
                <span className="text-[6px] font-bold text-[#1a2332]/60 uppercase">OFFICIAL SEAL</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-12 text-center">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="bg-[#1a2332] text-[#fbbf24] px-6 py-2 rounded-full text-xs font-black tracking-[0.3em] uppercase">
                  Mastermind Exclusive
                </div>
              </div>
              <h1 className="text-7xl font-serif italic text-[#1a2332] tracking-tight">Certificate of Authenticity</h1>
              <div className="w-32 h-1 bg-[#fbbf24] mx-auto" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.4em]">Official Vault Grading Analysis</p>
            </div>

            <div className="space-y-2">
              <p className="text-gray-500 font-serif italic text-lg">This document certifies that the following asset has been analyzed and graded by the Vault AI System</p>
              <h2 className="text-5xl font-black text-[#1a2332] uppercase tracking-wider">{title}</h2>
            </div>

            <div className="flex justify-center gap-12 py-8 border-y-2 border-[#fbbf24]/20">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Final Grade</p>
                <div className="text-7xl font-black text-[#1a2332] leading-none">{result.grade.toFixed(1)}</div>
              </div>
              <div className="w-px bg-[#fbbf24]/20" />
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Market Valuation</p>
                <div className="text-7xl font-black text-[#fbbf24] leading-none">${result.estimatedValue.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
              {[
                { label: 'Corners', value: result.corners },
                { label: 'Edges', value: result.edges },
                { label: 'Surface', value: result.surface },
                { label: 'Centering', value: result.centering }
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[8px] font-black text-[#fbbf24] uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xs font-bold text-[#1a2332] leading-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="pt-12 flex flex-col md:flex-row justify-between items-end gap-8 text-left">
              <div className="space-y-4 max-w-md">
                <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
                  Verification ID: {verificationId}<br />
                  Issued to: {user.username}<br />
                  Date of Analysis: {new Date().toLocaleDateString()}
                </p>
                <div className="w-48 h-px bg-gray-200" />
                <p className="text-[8px] text-gray-400 italic">
                  This certificate is a digital representation of the Vault AI grading process. 
                  The grade assigned is based on visual data provided at the time of scan.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-40 h-10 bg-black flex gap-1 p-1">
                  {Array.from({length: 25}).map((_, i) => (
                    <div key={i} className="bg-white h-full" style={{ width: `${Math.random() * 3 + 1}px` }}></div>
                  ))}
                </div>
                <span className="text-[8px] font-mono mt-1 text-gray-400">{verificationId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <button 
          onClick={onReset} 
          disabled={isSaving}
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {isRecallMode ? 'Back to Vault' : 'Back to Grading'}
        </button>
        <div className="flex gap-3">
          {isElite && (
            <>
              <button 
                onClick={() => { setShowSlab(!showSlab); setShowCertificate(false); }}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 ${showSlab ? 'bg-white text-[#1a2332]' : 'bg-gray-800 text-white border border-white/10'}`}
              >
                <Icons.Layers className="w-5 h-5" />
                {showSlab ? 'View Report' : 'Digital Slab'}
              </button>
              <button 
                onClick={() => { setShowCertificate(true); setShowSlab(false); }}
                className="flex items-center gap-2 bg-[#fbbf24] text-[#1a2332] px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95"
              >
                <Icons.GraduationCap className="w-5 h-5" />
                View Certificate
              </button>
            </>
          )}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95"
          >
            <Icons.Printer className="w-5 h-5" />
            Print Report
          </button>
          {!isRecallMode && (
            <button 
              onClick={() => onSaveToCollection(formData)}
              disabled={isSaving || !formData.title}
              className="flex items-center gap-2 bg-[#fbbf24] hover:bg-yellow-500 text-[#1a2332] px-6 py-2 rounded-lg font-bold shadow-lg shadow-yellow-500/10 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Icons.Plus className="w-5 h-5" />
              )}
              {isSaving ? 'Saving...' : 'Save to Vault'}
            </button>
          )}
        </div>
      </div>

      {/* Main Report Card / Professional Slab */}
      {showSlab && isElite ? (
        <div className="py-10">
          <DigitalSlab 
            user={user} 
            result={result} 
            title={title} 
            image={images[0]} 
            verificationId={verificationId} 
          />
        </div>
      ) : (
        <div className="certificate-container bg-white text-[#1a2332] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#1a2332] relative print:shadow-none print:m-0 print:border-[15px] print:border-double">
        
        {/* Ribbon Watermark (Print Friendly) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#dc2626] translate-x-24 -translate-y-24 rotate-45 flex items-end justify-center pb-8 shadow-xl print:shadow-none">
          <span className="text-white text-4xl font-black -rotate-45 tracking-tighter">
            {isDemoMode ? 'DEMO REPORT' : 'VAULT CERTIFIED'}
          </span>
        </div>

        {/* Content Padding */}
        <div className="p-8 md:p-16 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-8 border-[#1a2332] pb-6 gap-6">
            <div className="space-y-2">
              <h1 className="text-6xl comic-font text-[#1a2332] leading-none">CERTIFICATE OF GRADE</h1>
              <p className="text-xl font-black text-[#dc2626] tracking-[0.2em] uppercase">Official Vault Analysis</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Verification ID</p>
              <p className="text-3xl font-black tracking-tighter">{verificationId}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-16">
            {/* Left Column: Grade & Key Visual */}
            <div className="md:w-1/3 space-y-8">
              <div className="relative">
                <div className="aspect-[3/4] bg-gray-50 rounded-2xl border-4 border-[#1a2332] overflow-hidden shadow-2xl">
                  <img src={images[0]} alt="Comic Front" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                
                {/* The Grade Bubble */}
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#1a2332] text-white rounded-full flex flex-col items-center justify-center border-8 border-white shadow-2xl transform -rotate-12">
                  <span className="text-5xl font-black leading-none">{result.grade.toFixed(1)}</span>
                  <span className="text-xs font-black uppercase tracking-widest mt-1">GRADE</span>
                </div>
              </div>

              {/* Market Value Box */}
              <div className="bg-[#fbbf24] p-8 rounded-2xl border-4 border-[#1a2332] shadow-lg text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Estimated Market Value</p>
                <p className="text-5xl font-black text-[#1a2332]">${result.estimatedValue.toLocaleString()}</p>
              </div>

              {/* Secondary Scans for Verification */}
              <div className="grid grid-cols-2 gap-2 no-print">
                {images.slice(1, 3).map((img, i) => (
                  <div key={i} className="aspect-[3/4] rounded-lg border-2 border-gray-100 overflow-hidden">
                    <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Detailed Breakdown */}
            <div className="md:w-2/3 space-y-10">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-4xl font-black text-[#1a2332] leading-none uppercase">IDENTIFY COMIC</h2>
                  {isElite && (
                    <button 
                      onClick={handleAutofill}
                      disabled={isAutofilling}
                      className="flex items-center gap-2 bg-[#1a2332] text-[#fbbf24] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAutofilling ? (
                        <div className="w-3 h-3 border-2 border-[#fbbf24]/30 border-t-[#fbbf24] rounded-full animate-spin" />
                      ) : (
                        <Icons.Sparkles className="w-3 h-3" />
                      )}
                      {isAutofilling ? 'Autofilling...' : 'Mastermind Autofill'}
                    </button>
                  )}
                </div>
                
                {!isRecallMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                    <div className="md:col-span-2">
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Comic Title</label>
                      <input 
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Amazing Spider-Man"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-[#1a2332] focus:ring-2 focus:ring-[#fbbf24] outline-none transition-all font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Issue #</label>
                      <input 
                        type="text"
                        value={formData.issueNumber}
                        onChange={(e) => setFormData({...formData, issueNumber: e.target.value})}
                        placeholder="e.g. 300"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-[#1a2332] focus:ring-2 focus:ring-[#fbbf24] outline-none transition-all font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Publisher</label>
                      <input 
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                        placeholder="e.g. Marvel"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-[#1a2332] focus:ring-2 focus:ring-[#fbbf24] outline-none transition-all font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Publish Year</label>
                      <input 
                        type="number"
                        value={formData.publishYear}
                        onChange={(e) => setFormData({...formData, publishYear: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-[#1a2332] focus:ring-2 focus:ring-[#fbbf24] outline-none transition-all font-bold text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="bg-[#1a2332] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">GEMINI 2.0 AI ANALYSIS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ISSUED: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Evaluation Matrix */}
              {user.subscription !== SubscriptionTier.FREE ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-3xl border-2 border-gray-100">
                  {[
                    { label: 'Corners', text: result.corners },
                    { label: 'Edges', text: result.edges },
                    { label: 'Surface', text: result.surface },
                    { label: 'Centering', text: result.centering }
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#dc2626] flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-[#dc2626]"></span>
                         {item.label}
                      </h4>
                      <p className="text-sm font-bold leading-relaxed text-[#1a2332]">{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-4 border-dashed border-gray-100 p-8 rounded-3xl text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <Icons.Lock className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-[#1a2332] uppercase tracking-widest">Detailed Analysis Locked</p>
                    <p className="text-xs text-gray-400 max-w-[200px] mx-auto">Upgrade to Gumshoe Detective or higher to unlock corner, edge, and surface analysis.</p>
                  </div>
                  <button 
                    onClick={() => window.location.hash = '#/subscription'}
                    className="bg-[#dc2626] text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}

              {/* Analysis Text */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Official AI Statement</h4>
                <div className="relative">
                   <span className="absolute -top-10 -left-6 text-9xl text-gray-100 font-serif pointer-events-none">“</span>
                   <p className="text-2xl font-medium leading-relaxed italic text-gray-700 relative z-10 px-4">
                     {result.analysis}
                   </p>
                </div>
              </div>

              {/* Security Seal Footer */}
              <div className="pt-12 border-t border-gray-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1a2332]">Comic Vault Certified</p>
                  <p className="text-[8px] text-gray-400 max-w-xs font-bold leading-tight">
                    This digital certification uses advanced computer vision to assess comic book condition. 
                    Verification ID {verificationId} is unique to this specific asset scan session.
                  </p>
                </div>
                
                {/* Professional QR/Barcode Style Visual */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-8 bg-black flex gap-1 p-1">
                    {Array.from({length: 20}).map((_, i) => (
                      <div key={i} className="bg-white h-full" style={{ width: `${Math.random() * 4 + 1}px` }}></div>
                    ))}
                  </div>
                  <span className="text-[8px] font-mono mt-1">{verificationId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Market Trends Section */}
      <div className="no-print">
        <MarketTrends user={user} comicTitle={title} currentGrade={result.grade} />
      </div>

      {/* Footer Info no-print */}
      <div className="text-center no-print text-gray-500">
         <p className="text-xs font-bold uppercase tracking-widest">Protect this document. It is the digital proof of your Vault grading.</p>
      </div>
    </div>
  );
};

export default GradingResultPage;

