
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { LiveVisitor, Ticket } from '../../types';
import { Search, Monitor, Smartphone, MessageSquare, Clock, Globe, Zap, RefreshCw, AlertTriangle } from 'lucide-react';

interface AdminLiveUsersProps {
  onStartChat: (ticketId: string) => void;
}

const AdminLiveUsers: React.FC<AdminLiveUsersProps> = ({ onStartChat }) => {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVisitors = async () => {
      const data = await db.getRealTimeVisitors(); // Now async
      setVisitors(data);
      setLoading(false);
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000); // Poll Firestore every 10s
    return () => clearInterval(interval);
  }, []);

  const handleChat = (visitor: LiveVisitor) => {
      // Logic to find existing chat or create new one
      const tickets = db.getTickets();
      let activeChat = tickets.find(t => 
          (visitor.userId ? t.userId === visitor.userId : false) && 
          t.type === 'chat' && 
          t.status !== 'closed'
      );

      if (!activeChat) {
          // Create new chat
          const newChat: Ticket = {
            id: `C-${Date.now().toString().slice(-4)}`,
            type: 'chat',
            userId: visitor.userId || `guest-${Date.now()}`,
            userName: visitor.name,
            guestEmail: visitor.email !== 'Unknown' ? visitor.email : undefined,
            subject: 'Admin Initiated Chat',
            status: 'open',
            priority: 'medium',
            date: new Date().toLocaleDateString(),
            lastMessage: 'Admin started chat',
            unread: false,
            messages: [{
                id: `m-${Date.now()}`,
                sender: 'admin',
                text: 'Hello! I noticed you are online. How can I help you today?',
                date: new Date().toLocaleString()
            }]
          };
          db.createTicket(newChat);
          activeChat = newChat;
      }
      
      onStartChat(activeChat.id);
  };

  const filteredVisitors = visitors.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Logic
  const mobileCount = visitors.filter(v => v.device === 'Mobile').length;
  const desktopCount = visitors.filter(v => v.device === 'Desktop').length;
  const topPage = visitors.length > 0 
    ? visitors.sort((a,b) => visitors.filter(v => v.currentPage === a.currentPage).length - visitors.filter(v => v.currentPage === b.currentPage).length).pop()?.currentPage
    : 'N/A';

  return (
    <div className="animate-in fade-in h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
            <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Live Network Data</span>
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">Real-Time Visitors</h2>
            </div>
            
            <div className="flex gap-4 items-center">
                 <div className="flex gap-2">
                     <div className="bg-white border border-gray-200 px-3 py-2 flex flex-col items-center min-w-[80px]">
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Mobile</span>
                         <span className="text-lg font-black text-gray-900">{mobileCount}</span>
                     </div>
                     <div className="bg-white border border-gray-200 px-3 py-2 flex flex-col items-center min-w-[80px]">
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Desktop</span>
                         <span className="text-lg font-black text-gray-900">{desktopCount}</span>
                     </div>
                     <div className="bg-white border border-gray-200 px-3 py-2 flex flex-col items-center min-w-[80px] hidden md:flex">
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Top Page</span>
                         <span className="text-xs font-black text-gray-900 truncate max-w-[80px]">{topPage}</span>
                     </div>
                 </div>

                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search IP, Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border border-gray-200 pl-10 pr-4 py-3 text-sm outline-none focus:border-[#ff4d00] shadow-sm w-48" 
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                </div>
            </div>
        </div>

        {visitors.length === 0 && !loading && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 flex items-center gap-3">
                <AlertTriangle className="text-orange-500" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-orange-800">No active visitors</h4>
                    <p className="text-xs text-orange-700">The database is currently empty of live sessions. Open the site in an Incognito window to see yourself appear here.</p>
                </div>
            </div>
        )}

        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden flex-1">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Identity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Page</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Active</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Environment</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400 animate-pulse">Scanning live network...</td></tr>
                        ) : filteredVisitors.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400">No active users found matching your filter.</td></tr>
                        ) : (
                            filteredVisitors.map(visitor => (
                                <tr key={visitor.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                {visitor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    {visitor.name}
                                                    {visitor.role === 'guest' && <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-sm uppercase">Guest</span>}
                                                </div>
                                                <div className="text-[10px] text-gray-400">{visitor.email}</div>
                                                <div className="text-[9px] text-gray-300 mt-0.5 flex items-center gap-1"><Globe size={10}/> {visitor.location}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-xs font-bold text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded-sm">{visitor.currentPage}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                            <Clock size={12} className="text-gray-400" /> {visitor.lastActive}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                            {visitor.device.includes('Mobile') ? <Smartphone size={14}/> : <Monitor size={14}/>}
                                            {visitor.device} / {visitor.browser}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-1">{visitor.ip}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleChat(visitor)}
                                            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2 ml-auto shadow-sm"
                                        >
                                            <MessageSquare size={12} /> Chat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AdminLiveUsers;
