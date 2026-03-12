
import React from 'react';
import { Link } from 'react-router-dom';
import { User, Comic } from '../types';
import { Icons } from '../constants';

interface DashboardProps {
  user: User;
  comics: Comic[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, comics }) => {
  const totalValue = comics.reduce((sum, c) => sum + c.estimatedValue, 0);
  const forSaleCount = comics.filter(c => c.isForSale).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl comic-font text-[#fbbf24] tracking-wider">WELCOME BACK, {user.username.toUpperCase()}!</h1>
          <p className="text-gray-400 mt-1">Manage your vault and discover new treasures.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/grading" className="flex items-center gap-2 bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg hover:shadow-red-500/20 uppercase tracking-widest text-xs">
            <Icons.GraduationCap className="h-4 w-4" />
            GRADE NOW
          </Link>
          <Link to="/collection/new" className="flex items-center gap-2 bg-[#fbbf24] hover:bg-yellow-500 text-[#1a2332] px-6 py-3 rounded-xl font-black transition-all shadow-lg hover:shadow-yellow-500/20 uppercase tracking-widest text-xs">
            <Icons.Plus className="h-4 w-4" />
            ADD COMIC
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Comics', value: comics.length, icon: <Icons.Search className="w-8 h-8 text-blue-400" /> },
          { label: 'Vault Value', value: `$${totalValue.toLocaleString()}`, icon: <Icons.Heart className="w-8 h-8 text-pink-500" /> },
          { label: 'Active Listings', value: forSaleCount, icon: <Icons.Cart className="w-8 h-8 text-green-400" /> },
          { label: 'Free Scans', value: user.freeScansRemaining, icon: <Icons.GraduationCap className="w-8 h-8 text-yellow-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black mt-1 text-white">{stat.value}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl comic-font text-white uppercase tracking-wider">Recent Additions</h2>
            <Link to="/collection" className="text-[#fbbf24] hover:underline text-xs font-black uppercase tracking-widest">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {comics.slice(0, 3).map((comic) => (
              <div key={comic.id} className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#fbbf24]/50 transition-all">
                <img src={comic.coverImage} alt={comic.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                <div className="p-4">
                  <h3 className="font-black truncate text-white uppercase text-sm">{comic.title} #{comic.issueNumber}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{comic.publisher}</p>
                </div>
              </div>
            ))}
            {comics.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 bg-white/5 rounded-3xl border border-dashed border-gray-700">
                <Icons.Search className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-500 font-bold uppercase text-xs">Your vault is empty.</p>
                <Link to="/collection/new" className="text-[#fbbf24] mt-4 font-black text-xs uppercase hover:underline tracking-widest">Add your first comic</Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-3xl p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-3xl comic-font text-[#dc2626] mb-4">GO COLLECTOR PRO!</h2>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed mb-8">Unlock unlimited AI grading, lower marketplace fees, and professional dealer tools.</p>
            <Link to="/billing" className="block w-full bg-[#dc2626] hover:bg-red-700 text-white py-4 rounded-xl font-black text-center shadow-lg shadow-red-500/20 transition-all active:scale-95 uppercase tracking-widest">
              Upgrade Now
            </Link>
          </div>
          <Icons.GraduationCap className="absolute -bottom-6 -right-6 w-40 h-40 text-[#dc2626]/5 rotate-12 group-hover:rotate-6 transition-all duration-700" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
