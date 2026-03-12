
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { Notification, User } from '../types';
import { Icons } from '../constants';
import { useNavigate } from 'react-router-dom';

interface NotificationsPageProps {
  user: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    const data = await storageService.getNotifications(user.id);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await storageService.markNotificationRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await storageService.markAllNotificationsRead(user.id);
      loadNotifications();
    } catch (error) {
      alert('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await storageService.deleteNotification(id);
      loadNotifications();
    } catch (error) {
      alert('Failed to delete notification');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-[#fbbf24] rounded-full animate-spin mb-4" />
        <p className="comic-font text-[#fbbf24] tracking-widest uppercase">Transmitting Alerts...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl comic-font text-[#fbbf24]">COMM-LINK ALERTS</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} NEW MESSAGES IN THE VAULT` : 'NO NEW ALERTS AT THIS TIME'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Clear All Unread
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <Icons.Bell className="h-20 w-20 mx-auto text-gray-700 mb-6 opacity-20" />
          <h3 className="text-2xl comic-font text-white uppercase mb-2">Signal is Clear</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            You're all caught up. We'll alert you if a wishlist item appears or a system update occurs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                !notification.isRead 
                  ? 'bg-[#fbbf24]/5 border-[#fbbf24]/30 shadow-lg shadow-[#fbbf24]/5' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`mt-1 p-3 rounded-xl shrink-0 ${
                !notification.isRead ? 'bg-[#fbbf24] text-[#1a2332]' : 'bg-gray-800 text-gray-400'
              }`}>
                {notification.type === 'wishlist_match' ? <Icons.Heart className="h-5 w-5" /> : <Icons.Bell className="h-5 w-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-black uppercase tracking-wide text-sm ${!notification.isRead ? 'text-[#fbbf24]' : 'text-gray-300'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center gap-3">
                  {notification.link && (
                    <button 
                      onClick={() => navigate(notification.link!)}
                      className="bg-[#dc2626] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-red-700 transition-all"
                    >
                      View Details
                    </button>
                  )}
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-[#fbbf24] hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(notification.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all"
                title="Delete alert"
              >
                <Icons.Trash className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
