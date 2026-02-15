

import React, { useEffect, useState } from 'react';
import { Project, Transaction, SystemAlert } from '../types';
import { db } from '../services/db';
import { TrendingUp, Activity, CreditCard, Users, ArrowRight, Clock, ShieldCheck, Zap, Info, AlertTriangle, AlertOctagon, Star } from 'lucide-react';

interface HomeDashboardProps {
    projects: Project[];
    balance: number;
    onNavigateToProject: (id: string) => void;
    onNavigateToBuyCredits: () => void;
}

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                setTimeLeft(null);
                clearInterval(timer);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex gap-2 mt-3 font-mono text-sm font-black text-black bg-white/20 p-2 rounded-sm inline-flex">
            <span>{String(timeLeft.days).padStart(2, '0')}d</span>:
            <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
            <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
            <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </div>
    )
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ projects, balance, onNavigateToProject, onNavigateToBuyCredits }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);

    useEffect(() => {
        setTransactions(db.getTransactions().slice(0, 5));

        // Fetch and Filter Alerts for Current User
        const allAlerts = db.getAlerts();
        const currentUser = db.getCurrentUser();
        const visibleAlerts = allAlerts.filter(a => db.checkBroadcastTarget(a, currentUser));
        setAlerts(visibleAlerts);

    }, [balance]);

    const activeProjects = projects.filter(p => p.status === 'active');

    // Calculate Real Traffic Stats from Project Data
    const totalTraffic = projects.reduce((acc, p) => {
        const projectVisits = p.stats?.reduce((sum, day) => sum + day.visitors, 0) || 0;
        return acc + projectVisits;
    }, 0);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'error': return <AlertOctagon size={18} />;
            case 'warning': return <AlertTriangle size={18} />;
            case 'promo': return <Star size={18} />;
            default: return <Info size={18} />;
        }
    }

    // Helper to format large numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* System Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`p-4 border-l-4 shadow-sm flex items-start gap-3 rounded-r-sm ${alert.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                                alert.type === 'promo' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                                    alert.type === 'warning' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                                        'bg-blue-50 border-blue-500 text-blue-700'
                            }`}>
                            <div className="mt-0.5 shrink-0">{getAlertIcon(alert.type)}</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">{alert.message}</p>
                                {alert.countdownEnds && <CountdownTimer targetDate={alert.countdownEnds} />}
                                <p className="text-[10px] font-medium opacity-70 mt-1 uppercase tracking-wider">{alert.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Overview</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dashboard</h2>
                </div>
                <div className="flex gap-4">
                    <div className="hidden md:block text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network Status</div>
                        <div className="text-[#ff4d00] text-xs font-bold flex items-center gap-2 justify-end mt-1">
                            <div className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full animate-pulse"></div>
                            Operational
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} className="text-[#ff4d00]" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Traffic</div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{formatNumber(totalTraffic)}</div>
                    <div className="text-xs font-bold text-[#ff4d00] flex items-center gap-1">Real-time <span className="text-gray-400 font-medium">stats</span></div>
                </div>

                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors cursor-pointer" onClick={() => onNavigateToProject('')}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={48} className="text-[#ff4d00]" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Campaigns</div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{activeProjects.length}</div>
                    <div className="text-xs font-bold text-gray-500">View all campaigns</div>
                </div>

                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors cursor-pointer" onClick={onNavigateToBuyCredits}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard size={48} className="text-[#ff4d00]" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wallet Balance</div>
                    <div className="text-3xl font-black text-gray-900 mb-1">€{balance.toFixed(2)}</div>
                    <div className="text-xs font-bold text-[#ff4d00] flex items-center gap-1">Add Funds <ArrowRight size={10} /></div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Campaigns Widget */}
                <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                            <Activity size={14} className="text-[#ff4d00]" /> Recent Campaigns
                        </h3>
                        <button onClick={() => onNavigateToProject('')} className="text-[10px] font-bold text-gray-400 uppercase hover:text-[#ff4d00] transition-colors">View All</button>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#f9fafb] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Project Name</th>
                                    <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {projects.slice(0, 5).map(p => (
                                    <tr key={p.id} className="hover:bg-orange-50/50 cursor-pointer transition-colors group" onClick={() => onNavigateToProject(p.id)}>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-gray-900 group-hover:text-[#ff4d00] transition-colors">{p.name}</div>
                                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">{p.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{p.plan}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-sm ${p.status === 'active' ? 'bg-[#ff4d00] text-white' :
                                                    p.status === 'completed' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {projects.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-xs text-gray-400">No active campaigns.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Side Column */}
                <div className="space-y-8">

                    {/* Recent Transactions */}
                    <div className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Clock size={14} className="text-gray-400" /> Recent History
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {transactions.map(t => (
                                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-900 truncate max-w-[100px]">{t.desc}</div>
                                        <div className="text-[9px] text-gray-400">{t.date}</div>
                                    </div>
                                    <div className={`text-xs font-bold ${t.type === 'credit' ? 'text-[#ff4d00]' : 'text-gray-900'}`}>
                                        {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(0)}
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && <div className="p-4 text-center text-xs text-gray-400">No recent transactions</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;