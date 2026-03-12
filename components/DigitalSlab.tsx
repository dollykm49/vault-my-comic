
import React from 'react';
import { GradingResult, Comic, User } from '../types';
import { Icons } from '../constants';
import { Shield, Award, CheckCircle, QrCode } from 'lucide-react';

interface DigitalSlabProps {
  user: User;
  result: GradingResult;
  title: string;
  image: string;
  verificationId: string;
}

const DigitalSlab: React.FC<DigitalSlabProps> = ({ user, result, title, image, verificationId }) => {
  return (
    <div className="relative max-w-md mx-auto animate-fadeIn group">
      {/* The Slab Case (Acrylic Look) */}
      <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-4 border-4 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden">
        
        {/* Holographic Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover:translate-x-full transition-transform duration-1000" />

        {/* Top Label (CGC Style) */}
        <div className="bg-[#1a2332] rounded-t-2xl p-4 border-b-4 border-[#fbbf24] flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-[#fbbf24] uppercase tracking-[0.2em]">Comic Vault Certified</h3>
            <h2 className="text-lg font-black text-white uppercase leading-none truncate max-w-[200px]">{title}</h2>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Universal Grade • AI Verified</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white leading-none">{result.grade.toFixed(1)}</div>
            <div className="text-[8px] font-black text-[#fbbf24] uppercase tracking-widest mt-1">GRADE</div>
          </div>
        </div>

        {/* Middle Section (The Comic) */}
        <div className="bg-black mt-2 rounded-xl overflow-hidden aspect-[3/4] border-2 border-white/5 relative">
          <img src={image} className="w-full h-full object-cover" alt="Slabbed Comic" referrerPolicy="no-referrer" />
          
          {/* Holographic Seal */}
          <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-tr from-silver via-white to-silver border-2 border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-red-400/20 animate-pulse" />
            <Shield className="w-6 h-6 text-white/80 relative z-10" />
          </div>
        </div>

        {/* Bottom Label (Verification) */}
        <div className="mt-2 bg-white/5 rounded-b-2xl p-4 flex justify-between items-center border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Authenticity Guaranteed</span>
            </div>
            <p className="text-[10px] font-mono text-gray-500">{verificationId}</p>
          </div>
          <div className="bg-white p-1 rounded-lg">
            <QrCode className="w-8 h-8 text-black" />
          </div>
        </div>
      </div>

      {/* Slab Stand (Shadow Effect) */}
      <div className="w-4/5 h-4 bg-black/40 blur-xl mx-auto mt-4 rounded-full" />
    </div>
  );
};

export default DigitalSlab;
