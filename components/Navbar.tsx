
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons, COLORS } from '../constants';
import { User, Notification } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  notifications: Notification[];
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, notifications }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-[#1a2332] border-b border-gray-700 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-3xl comic-font text-[#dc2626] drop-shadow-[2px_2px_0_rgba(251,191,36,1)]">COMIC VAULT</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {user && (
                <>
                  <Link to="/collection" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">My Collection</Link>
                  <Link to="/grading" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">AI Grading</Link>
                  <Link to="/art-lab" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Art Lab</Link>
                  <Link to="/marketplace" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Marketplace</Link>
                  <Link to="/community" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Community</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <button onClick={() => navigate('/settings')} className="relative p-2 text-gray-400 hover:text-white" title="Settings">
                  <Icons.Settings className="h-6 w-6" />
                </button>
                <button onClick={() => navigate('/billing')} className="relative p-2 text-gray-400 hover:text-[#fbbf24]" title="Subscription & Billing">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </button>
                <button onClick={() => navigate('/messages')} className="relative p-2 text-gray-400 hover:text-white" title="Messages">
                  <Icons.MessageSquare className="h-6 w-6" />
                </button>
                <button onClick={() => navigate('/wishlist')} className="relative p-2 text-gray-400 hover:text-white" title="Wishlist">
                  <Icons.Heart className="h-6 w-6" />
                </button>
                <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-400 hover:text-white" title="Notifications">
                  <Icons.Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#dc2626] text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </>
            )}
            {user ? (
              <div className="flex items-center space-x-3 ml-4 border-l border-gray-700 pl-4">
                <Link to="/profile" className="flex items-center gap-3 group">
                  <div className="hidden lg:block text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.role === 'ADMIN' && (
                        <span className="bg-[#fbbf24] text-[#1a2332] text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">ADMIN</span>
                      )}
                      <span className="text-[9px] font-black text-gray-500 uppercase block leading-none">
                        {user.subscription.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-[#fbbf24] transition-colors">{user.displayName || user.username}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-white/5 group-hover:border-[#fbbf24] transition-all">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Icons.User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </Link>
                <button 
                  onClick={onLogout}
                  className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-all"
                  title="Logout"
                >
                  <Icons.LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-[#dc2626] hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
