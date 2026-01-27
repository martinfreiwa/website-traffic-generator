
import React from 'react';
import { Transaction, User, Project, Ticket } from '../../types';
import { TrendingUp, Users, Layers, MessageSquare } from 'lucide-react';

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
        const dayTotal = transactions
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

const AdminOverview: React.FC<AdminOverviewProps> = ({ users, projects, tickets, transactions, onNavigate }) => {
    const totalRevenue = transactions.filter(t => t.type === 'credit').reduce((a,b) => a + b.amount, 0);
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const openTickets = tickets.filter(t => t.status === 'open').length;

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Admin Overview</h2>
            
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users size={14}/> Total Users
                    </div>
                    <div className="text-4xl font-black text-gray-900">{users.length}</div>
                </div>
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Layers size={14}/> Active Projects
                    </div>
                    <div className="text-4xl font-black text-gray-900">{activeProjects}</div>
                </div>
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MessageSquare size={14}/> Open Tickets
                    </div>
                    <div className="text-4xl font-black text-gray-900">{openTickets}</div>
                </div>
                <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp size={14}/> Total Revenue
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
