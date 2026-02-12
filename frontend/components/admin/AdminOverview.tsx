
import React from 'react';
import { Transaction, User, Project, Ticket, AdminStats } from '../../types';
import { TrendingUp, Users, Layers, MessageSquare, CreditCard, Plus, ArrowUpRight } from 'lucide-react';

interface AdminOverviewProps {
    users: User[];
    projects: Project[];
    tickets: Ticket[];
    transactions: Transaction[];
    stats?: AdminStats | null;
    onNavigate: (view: string) => void;
}

const RevenueChart = ({ transactions }: { transactions: Transaction[] }) => {
    try {
        // Generate Last 7 Days Labels
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Aggregate Data Safe Check
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        const data = days.map(dayStr => {
            const dayTotal = safeTransactions
                .filter(t => t && t.type === 'credit' && t.date === dayStr)
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
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
    } catch (e) {
        return <div className="text-xs text-red-500 p-4">Error loading chart</div>;
    }
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ users = [], projects = [], tickets = [], transactions = [], stats, onNavigate }) => {
    // Extensive safety checks
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeTickets = Array.isArray(tickets) ? tickets : [];

    const displayRevenue = stats?.revenue?.total ?? safeTransactions.filter(t => t && t.type === 'credit').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const displayRevenueToday = stats?.revenue?.today ?? 0;
    const displayActiveProjects = stats?.projects?.active ?? safeProjects.filter(p => p && p.status === 'active').length;
    const displayUsers = stats?.users?.total ?? safeUsers.length;
    const displayNewUsers = stats?.users?.new_today ?? 0;
    const openTickets = safeTickets.filter(t => t && t.status === 'open').length;

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Admin Overview</h2>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors relative overflow-hidden group">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users size={14} /> Total Users
                    </div>
                    <div className="text-4xl font-black text-gray-900">{displayUsers}</div>
                    {displayNewUsers > 0 && (
                        <div className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-1">
                            <Plus size={10} /> +{displayNewUsers} Today
                        </div>
                    )}
                </div>

                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Layers size={14} /> Active Projects
                    </div>
                    <div className="text-4xl font-black text-gray-900">{displayActiveProjects}</div>
                    {stats?.projects?.new_today! > 0 && (
                        <div className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-1">
                            <ArrowUpRight size={10} /> +{stats?.projects?.new_today} New Today
                        </div>
                    )}
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
                    <div className="text-4xl font-black text-[#ff4d00]">€{(displayRevenue || 0).toLocaleString()}</div>
                    {displayRevenueToday > 0 && (
                        <div className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-1">
                            <CreditCard size={10} /> +€{displayRevenueToday.toFixed(2)} Today
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-8 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00]">Revenue Trend (7 Days)</h3>
                    </div>
                    <RevenueChart transactions={safeTransactions} />
                </div>

                <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Recent Registrations</h3>
                        <button onClick={() => onNavigate('admin-users')} className="text-[10px] uppercase font-bold text-gray-400 hover:text-[#ff4d00]">View All</button>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-64">
                        {safeUsers.slice(0, 5).map(u => (
                            <div key={u?.id || Math.random()} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {(u?.name || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-900">{u?.name || 'Unknown User'}</div>
                                        <div className="text-[9px] text-gray-400">{u?.email || 'No Email'}</div>
                                    </div>
                                </div>
                                <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{u?.joinedDate || '-'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
