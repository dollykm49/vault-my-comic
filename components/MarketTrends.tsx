
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Icons, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { User, SubscriptionTier } from '../types';
import { TrendingUp, TrendingDown, Info, AlertCircle, Lock } from 'lucide-react';

interface MarketTrendsProps {
  user: User;
  comicTitle: string;
  currentGrade: number;
}

const MarketTrends: React.FC<MarketTrendsProps> = ({ user, comicTitle, currentGrade }) => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<any>(null);
  const isElite = user.subscription === SubscriptionTier.VAULT_ELITE;

  useEffect(() => {
    if (isElite) {
      fetchTrends();
    }
  }, [comicTitle, currentGrade, isElite]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      // We'll use a simulated trend for now, but in a real app, 
      // Gemini would fetch or we'd hit a pricing API.
      // Let's simulate a Gemini-powered market analysis.
      
      const mockData = [
        { month: 'Jan', price: 450 },
        { month: 'Feb', price: 480 },
        { month: 'Mar', price: 460 },
        { month: 'Apr', price: 520 },
        { month: 'May', price: 590 },
        { month: 'Jun', price: 610 },
      ];

      setTrends({
        history: mockData,
        change: '+35.5%',
        sentiment: 'Bullish',
        advice: `This issue in a ${currentGrade} grade is currently seeing high demand due to recent cinematic announcements. Holding is recommended as prices are trending upward.`,
        volatility: 'Medium'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isElite) {
    return (
      <div className="bg-[#1a2332] border-2 border-dashed border-white/10 rounded-3xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-[#fbbf24]/10 rounded-full flex items-center justify-center mx-auto border border-[#fbbf24]/20">
          <Lock className="text-[#fbbf24] w-8 h-8" />
        </div>
        <h3 className="comic-font text-2xl text-white uppercase tracking-widest">Market Insights Locked</h3>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
          The AI Price Guide & Market Trends are exclusive to "The Mastermind" tier members.
        </p>
        <button 
          onClick={() => window.location.hash = '#/subscription'}
          className="bg-[#fbbf24] text-[#1a2332] px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
        >
          Upgrade for Insights
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#1a2332] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#fbbf24]/20 border-t-[#fbbf24] rounded-full animate-spin" />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Analyzing Market Data...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2332] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#fbbf24] text-[#1a2332] rounded-lg">
            <TrendingUp size={18} />
          </div>
          <h3 className="comic-font text-xl text-white uppercase tracking-widest">Market Trends</h3>
        </div>
        <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">
          {trends.sentiment}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Chart Area */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends.history}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #ffffff20', borderRadius: '12px' }}
                itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#fbbf24" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">6-Month Growth</p>
            <p className="text-2xl font-black text-green-400">{trends.change}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Volatility</p>
            <p className="text-2xl font-black text-[#fbbf24]">{trends.volatility}</p>
          </div>
        </div>

        {/* AI Advice */}
        <div className="bg-[#fbbf24]/10 p-5 rounded-2xl border border-[#fbbf24]/20 flex gap-4">
          <div className="shrink-0 w-10 h-10 bg-[#fbbf24] text-[#1a2332] rounded-full flex items-center justify-center">
            <Info size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest">AI Market Advice</p>
            <p className="text-xs text-white/80 font-medium leading-relaxed italic">
              "{trends.advice}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;
