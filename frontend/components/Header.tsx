import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '../services/db';
import { Notification } from '../types';

interface HeaderProps {
  title: string;
  onMobileMenuClick: () => void;
  isAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onMobileMenuClick, isAdmin = false }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await (isAdmin ? db.getAdminNotifications() : db.getNotifications());
        setNotifications(data);
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    };
    fetchNotifs();

    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await db.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    // db.markAllNotificationsRead(isAdmin ? 'admin' : 'u1');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  }

  return (
    <header className="bg-white h-20 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm md:shadow-none relative">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          onClick={onMobileMenuClick}
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-black tracking-wide text-gray-900 uppercase">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-1">
            <Bell className={unreadCount > 0 ? "text-[#ff4d00]" : "text-gray-400"} size={22} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-600 transform translate-x-1/4 -translate-y-1/4 animate-pulse"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 top-full mt-4 w-80 bg-white border border-gray-200 shadow-xl z-40 animate-in fade-in slide-in-from-top-2 rounded-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Notifications ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[#ff4d00] uppercase hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-orange-50/30' : ''}`}>
                        <div className="flex gap-3">
                          <div className="mt-1 flex-shrink-0">{getIcon(n.type)}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-xs font-bold ${!n.read ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</h4>
                              {!n.read && (
                                <button onClick={() => handleMarkRead(n.id)} className="text-gray-300 hover:text-[#ff4d00]">
                                  <Check size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                            <div className="text-[9px] text-gray-300 mt-2 font-mono">{n.date}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="hidden md:block w-px h-8 bg-gray-200"></div>
        <div className="text-sm font-medium text-gray-500 tracking-wide hidden md:block">
          {currentDate}
        </div>
      </div>
    </header>
  );
};

export default Header;