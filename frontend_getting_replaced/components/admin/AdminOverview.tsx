
import React, { useState, useEffect } from 'react';
import { Transaction, User, Project, Ticket } from '../../types';
import { TrendingUp, Users, Layers, MessageSquare, Search, Bell, Download, Keyboard } from 'lucide-react';

interface AdminOverviewProps {
    users: User[];
    projects: Project[];
    tickets: Ticket[];
    transactions: Transaction[];
    onNavigate: (view: string) => void;
}

const RevenueChart = ({ transactions }: { transactions: Transaction[] }) => {
    // Generate Last 7 Days Labels
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    // Aggregate Data
    const data = days.map(dayStr => {
        const dayTotal = (transactions || [])
            .filter(t => t.type === 'credit' && t.date === dayStr)
            .reduce((sum, t) => sum + t.amount, 0);
        return dayTotal;
    });

    const max = Math.max(...data, 100);

    return (
        <div className="h-48 flex items-end justify-between gap-2">
            {data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group">
                    <div
                        className="bg-black group-hover:bg-[#ff4d00] transition-colors rounded-t-sm w-full relative"
                        style={{ height: `${(val / max) * 100}%`, minHeight: '4px' }}
                    >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            €{val}
                        </div>
                    </div>
                    <div className="text-[9px] text-gray-400 text-center mt-2 font-mono">{days[i]}</div>
                </div>
            ))}
        </div>
    )
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ users = [], projects = [], tickets = [], transactions = [], onNavigate }) => {
    const totalRevenue = (transactions || []).filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0);
    const activeProjects = (projects || []).filter(p => p.status === 'active').length;
    const openTickets = (tickets || []).filter(t => t.status === 'open').length;
    
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [notifications, setNotifications] = useState<{id: string, message: string, type: string, time: string}[]>([]);

    // Quick Search Handler
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        
        const query = searchQuery.toLowerCase();
        const results = [
            ...users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)).map(u => ({ type: 'user', ...u })),
            ...projects.filter(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)).map(p => ({ type: 'project', ...p })),
            ...tickets.filter(t => t.subject.toLowerCase().includes(query)).map(t => ({ type: 'ticket', ...t }))
        ].slice(0, 10);
        
        setSearchResults(results);
    }, [searchQuery, users, projects, tickets]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
            }
            // Escape to close
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowShortcuts(false);
            }
            // ? for shortcuts help
            if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                setShowShortcuts(true);
            }
            // Navigation shortcuts
            if (e.altKey) {
                switch(e.key) {
                    case '1': onNavigate('admin-home'); break;
                    case '2': onNavigate('admin-users'); break;
                    case '3': onNavigate('admin-projects'); break;
                    case '4': onNavigate('admin-transactions'); break;
                    case '5': onNavigate('admin-tickets'); break;
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNavigate]);

    // Simulate real-time notifications
    useEffect(() => {
        const interval = setInterval(() => {
            // Check for new users, tickets, etc.
            const newNotifications = [];
            if (users.length > 0) {
                const recentUsers = users.filter(u => {
                    const joinDate = new Date(u.joinedDate);
                    const hoursSince = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60);
                    return hoursSince < 1;
                });
                recentUsers.forEach(u => {
                    newNotifications.push({
                        id: `user-${u.id}`,
                        message: `New user registered: ${u.name}`,
                        type: 'success',
                        time: 'Just now'
                    });
                });
            }
            if (tickets.length > 0) {
                const openTickets = tickets.filter(t => t.status === 'open');
                if (openTickets.length > 0) {
                    newNotifications.push({
                        id: `tickets-${Date.now()}`,
                        message: `${openTickets.length} open tickets require attention`,
                        type: 'warning',
                        time: 'Just now'
                    });
                }
            }
            setNotifications(newNotifications.slice(0, 5));
        }, 30000); // Check every 30 seconds
        
        return () => clearInterval(interval);
    }, [users, tickets]);

    const handleExport = () => {
        const data = {
            users: users.length,
            projects: projects.length,
            transactions: transactions.length,
            revenue: totalRevenue,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Quick Search Modal */}
            {showSearch && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={() => setShowSearch(false)}>
                    <div className="bg-white w-full max-w-2xl shadow-2xl rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            <Search size={20} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search users, projects, tickets... (Ctrl+K)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 outline-none text-lg"
                                autoFocus
                            />
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">ESC to close</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {searchResults.length === 0 && searchQuery.length >= 2 && (
                                <div className="p-8 text-center text-gray-400">No results found</div>
                            )}
                            {searchResults.map((result, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                    onClick={() => {
                                        if (result.type === 'user') onNavigate('admin-users');
                                        if (result.type === 'project') onNavigate('admin-projects');
                                        if (result.type === 'ticket') onNavigate('admin-tickets');
                                        setShowSearch(false);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                            result.type === 'user' ? 'bg-blue-100 text-blue-600' :
                                            result.type === 'project' ? 'bg-green-100 text-green-600' :
                                            'bg-orange-100 text-orange-600'
                                        }`}>{result.type}</span>
                                        <span className="font-medium">{result.name || result.subject || 'Unknown'}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{result.email || result.id || ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-white w-full max-w-lg shadow-2xl rounded-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                                <Keyboard size={20} /> Keyboard Shortcuts
                            </h3>
                            <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm">Quick Search</span>
                                <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Ctrl + K</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm">Show Shortcuts</span>
                                <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">?</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm">Close Modal</span>
                                <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">ESC</span>
                            </div>
                            <div className="border-t border-gray-200 my-3 pt-3">
                                <p className="text-xs text-gray-400 mb-2">Navigation (Alt + Number)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                        <span>Overview</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Alt + 1</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                        <span>Users</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Alt + 2</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                        <span>Projects</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Alt + 3</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                        <span>Transactions</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Alt + 4</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                        <span>Tickets</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Alt + 5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Search and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tight">Admin Overview</h2>
                <div className="flex items-center gap-3">
                    {/* Real-time Notifications */}
                    <div className="relative">
                        <button className="p-2 text-gray-400 hover:text-[#ff4d00] transition-colors relative">
                            <Bell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        {notifications.length > 0 && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-sm z-10">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b border-gray-100 text-sm ${n.type === 'warning' ? 'bg-orange-50' : 'bg-green-50'}`}>
                                        {n.message}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowSearch(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors rounded-sm"
                    >
                        <Search size={16} /> Quick Search
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Ctrl+K</span>
                    </button>
                    
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors rounded-sm"
                    >
                        <Download size={16} /> Export
                    </button>
                    
                    <button 
                        onClick={() => setShowShortcuts(true)}
                        className="p-2 text-gray-400 hover:text-[#ff4d00] transition-colors"
                        title="Keyboard Shortcuts (?)"
                    >
                        <Keyboard size={20} />
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users size={14} /> Total Users
                    </div>
                    <div className="text-4xl font-black text-gray-900">{users.length}</div>
                </div>
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Layers size={14} /> Active Projects
                    </div>
                    <div className="text-4xl font-black text-gray-900">{activeProjects}</div>
                </div>
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MessageSquare size={14} /> Open Tickets
                    </div>
                    <div className="text-4xl font-black text-gray-900">{openTickets}</div>
                </div>
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp size={14} /> Total Revenue
                    </div>
                    <div className="text-4xl font-black text-[#ff4d00]">€{totalRevenue.toFixed(0)}</div>
                </div>
            </div>

            {/* Revenue Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-8 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00]">Revenue Trend (7 Days)</h3>
                    </div>
                    <RevenueChart transactions={transactions} />
                </div>

                <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Recent Registrations</h3>
                        <button onClick={() => onNavigate('admin-users')} className="text-[10px] uppercase font-bold text-gray-400 hover:text-[#ff4d00]">View All</button>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-64">
                        {users.slice(0, 5).map(u => (
                            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-900">{u.name}</div>
                                        <div className="text-[9px] text-gray-400">{u.email}</div>
                                    </div>
                                </div>
                                <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{u.joinedDate}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
