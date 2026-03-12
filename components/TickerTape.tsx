import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Comic } from '../types';

export default function TickerTape({ userId }: { userId?: string }) {
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    loadListings();
    const interval = setInterval(loadListings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const loadListings = async () => {
    try {
      const data = userId 
        ? await storageService.getMarketplaceComics(userId)
        : await storageService.getMarketplaceComics('guest');
      
      if (data && data.length > 0) {
        setListings([...data, ...data, ...data]);
      } else {
        // Fallback to "Market Highlights" if no real listings exist
        const defaultHighlights: any[] = [
          { id: 'def-1', title: 'Amazing Fantasy', issueNumber: '15', listingPrice: 1100000, grade: '9.6' },
          { id: 'def-2', title: 'Action Comics', issueNumber: '1', listingPrice: 3250000, grade: '8.5' },
          { id: 'def-3', title: 'Detective Comics', issueNumber: '27', listingPrice: 2100000, grade: '8.0' },
          { id: 'def-4', title: 'X-Men', issueNumber: '1', listingPrice: 800000, grade: '9.8' },
          { id: 'def-5', title: 'Hulk', issueNumber: '181', listingPrice: 50000, grade: '9.8' },
          { id: 'def-6', title: 'Spider-Man', issueNumber: '300', listingPrice: 15000, grade: '9.8' },
        ];
        setListings([...defaultHighlights, ...defaultHighlights, ...defaultHighlights]);
      }
    } catch (error) {
      console.error('Failed to load ticker listings:', error);
    }
  };

  return (
    <div className="sticky top-16 z-40 bg-[#0f172a]/90 backdrop-blur-md text-white overflow-hidden border-b border-[#fbbf24]/30 shadow-xl h-10 flex items-center no-print relative">
      <div className="absolute left-0 top-0 bottom-0 px-4 bg-[#dc2626] flex items-center z-20 shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          <span className="text-[10px] font-black tracking-widest uppercase">Live Market</span>
        </div>
      </div>
      <div className="ticker-wrapper flex whitespace-nowrap animate-ticker pl-32">
        <div className="ticker-content flex items-center gap-16 px-4">
          {listings.map((listing, index) => (
            <div key={`${listing.id}-${index}`} className="flex items-center gap-4 group cursor-help">
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500 group-hover:text-gray-300 transition-colors">
                  {listing.title}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  #{listing.issueNumber}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-[#fbbf24] tabular-nums drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  ${listing.listingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                
                {listing.grade && (
                  <span className="px-1.5 py-0.5 bg-[#fbbf24]/10 rounded text-[9px] font-black text-[#fbbf24] border border-[#fbbf24]/20">
                    {listing.grade}
                  </span>
                )}
                
                {Math.random() > 0.5 ? (
                  <div className="flex items-center text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span className="text-[9px] font-black">+{(Math.random() * 2.5).toFixed(2)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    <span className="text-[9px] font-black">-{(Math.random() * 1.8).toFixed(2)}%</span>
                  </div>
                )}
              </div>
              <div className="w-px h-4 bg-gray-800 mx-2" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-0 px-4 bg-[#0f172a] flex items-center z-20 border-l border-gray-800">
        <div className="group relative flex items-center">
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest cursor-help">
            Disclaimer
          </span>
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black border border-gray-700 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <p className="text-[9px] leading-tight text-gray-300">
              Prices shown are for demonstration purposes only and are not legitimate market values. Live marketplace listings will be featured here in a future update.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
