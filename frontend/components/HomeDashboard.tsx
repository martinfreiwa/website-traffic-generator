
import React, { useEffect, useState } from 'react';
import { Project, Transaction, SystemAlert, User } from '../types';
import { db } from '../services/db';
import {
    TrendingUp, Activity, CreditCard, Users, ArrowRight, Clock,
    Zap, Info, AlertTriangle, AlertOctagon, Star, Sun, Globe,
    Gift, MessageSquare, Copy, Check, BarChart, Plus
} from 'lucide-react';

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

const TrafficChart = ({ stats }: { stats: { date: string, visitors: number }[] }) => {
    const maxVal = Math.max(...stats.map(s => s.visitors), 1);

    return (
        <div className="h-32 flex items-end justify-between gap-1 w-full mt-4">
            {stats.map((s, i) => {
                const height = (s.visitors / maxVal) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                            {s.date}: {s.visitors.toLocaleString()}
                        </div>
                        <div
                            className="bg-[#ff4d00] opacity-30 group-hover:opacity-100 transition-all rounded-t-sm"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                        ></div>
                    </div>
                );
            })}
        </div>
    );
};

const HomeDashboard: React.FC<HomeDashboardProps> = ({ projects, balance, onNavigateToProject, onNavigateToBuyCredits }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [serverTime, setServerTime] = useState<string>('');
    const [dailyTip, setDailyTip] = useState<string>('');
    const [didYouKnow, setDidYouKnow] = useState<string>('');
    const [copiedRef, setCopiedRef] = useState(false);
    const [bonusClaimed, setBonusClaimed] = useState(false);
    const [activeNow, setActiveNow] = useState(0);

    useEffect(() => {
        const currentUser = db.getCurrentUser();
        setUser(currentUser || null);
        setTransactions(db.getTransactions().slice(0, 5));

        // Fetch and Filter Alerts for Current User
        const allAlerts = db.getAlerts();
        const visibleAlerts = allAlerts.filter(a => db.checkBroadcastTarget(a, currentUser));
        setAlerts(visibleAlerts);

        // SEO Tips
        const tips = [
            "Use alt tags on all images for better accessibility and SEO ranking.",
            "Improve page load speed by compressing images and using lazy loading.",
            "Use descriptive and keyword-rich title tags for every page.",
            "Internal linking helps search engines understand your site structure.",
            "Write unique meta descriptions to improve click-through rates."
        ];
        setDailyTip(tips[Math.floor(Math.random() * tips.length)]);

        // Did You Know
        const facts = [
            "The first website was published in 1991 by Tim Berners-Lee.",
            "Over 50% of web traffic comes from mobile devices.",
            "Google processes over 3.5 billion searches per day.",
            "The average bounce rate for websites is between 41% and 55%."
        ];
        setDidYouKnow(facts[Math.floor(Math.random() * facts.length)]);

        // Server Time Tick
        const timeInterval = setInterval(() => {
            setServerTime(new Date().toUTCString().split(' ')[4] + ' UTC');
        }, 1000);

        // Active Now Polling
        const fetchActiveNow = async () => {
            try {
                const data = await db.getActiveNow();
                setActiveNow(data.activeNow);
            } catch (e) {
                // Keep last known value on error
            }
        };
        fetchActiveNow();
        const activeInterval = setInterval(fetchActiveNow, 5000);

        return () => {
            clearInterval(timeInterval);
            clearInterval(activeInterval);
        };
    }, [balance]);

    const activeProjects = projects.filter(p => p.status === 'active');

    // Calculate aggregate stats for the last 30 days
    const aggregateStats = React.useMemo(() => {
        const last30Days: { date: string, visitors: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            let dailyTotal = 0;
            projects.forEach(p => {
                const dayStat = p.stats?.find(s => s.date === d.toISOString().split('T')[0]);
                if (dayStat) dailyTotal += dayStat.visitors;
            });

            last30Days.push({ date: dateStr, visitors: dailyTotal });
        }
        return last30Days;
    }, [projects]);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleCopyReferral = () => {
        navigator.clipboard.writeText(`https://traffic.com/ref/${user?.id || 'user'}`);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
    };

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

            {/* Enhanced Header Section */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1 flex items-center gap-2">
                        <Sun size={12} strokeWidth={3} /> {getGreeting()}
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
                        Welcome, {user?.name?.split(' ')[0] || 'User'}
                    </h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">
                        Your network performance is <span className="text-green-600">Optimal</span>
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase bg-white px-4 py-2 border border-gray-200 shadow-sm rounded-sm">
                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-[#ff4d00]" />
                            <span className="text-gray-900">{serverTime}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full animate-pulse"></div>
                            <span className="text-[#ff4d00]">Server Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Traffic Stat */}
                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors rounded-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={64} className="text-[#ff4d00]" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Hits Sent</div>
                    <div className="text-4xl font-black text-gray-900 mb-2">{formatNumber(totalTraffic)}</div>
                    <div className="text-[10px] font-black text-[#ff4d00] flex items-center gap-1 uppercase tracking-wider">
                        <Activity size={12} /> Active Now: {activeNow}
                    </div>
                </div>

                {/* Active Campaigns */}
                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors cursor-pointer rounded-sm" onClick={() => onNavigateToProject('')}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap size={64} className="text-[#ff4d00]" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Projects</div>
                    <div className="text-4xl font-black text-gray-900 mb-2">{activeProjects.length}</div>
                    <div className="text-[10px] font-black text-gray-500 flex items-center gap-1 uppercase tracking-wider">
                        Manage Campaigns <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors cursor-pointer rounded-sm" onClick={onNavigateToBuyCredits}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CreditCard size={64} className="text-[#ff4d00]" />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wallet Balance</div>
                    <div className="text-4xl font-black text-gray-900 mb-2">€{balance.toFixed(2)}</div>
                    <div className="text-[10px] font-black text-[#ff4d00] flex items-center gap-1 uppercase tracking-wider">
                        Add Credits <Plus size={10} className="group-hover:rotate-90 transition-transform" />
                    </div>
                </div>

                {/* Gamification Level */}
                <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors rounded-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star size={64} className="text-[#ff4d00]" />
                    </div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level 1 Novice</div>
                        <span className="text-[10px] font-black text-[#ff4d00]">24%</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Growth Path</div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-[#ff4d00] w-[24%] transition-all duration-1000"></div>
                    </div>
                    <div className="mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Next Reward: +5% Bonus</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Campaigns & Traffic Chart */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Traffic Summary Chart Widget */}
                    <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                    <BarChart size={14} className="text-[#ff4d00]" /> Network Throughput
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Last 30 days volume</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase"><div className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full"></div> Hits</span>
                            </div>
                        </div>
                        <TrafficChart stats={aggregateStats} />
                    </div>

                    {/* Recent Campaigns Widget */}
                    <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Activity size={14} className="text-[#ff4d00]" /> Recent Campaigns
                            </h3>
                            <button onClick={() => onNavigateToProject('')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#ff4d00] transition-colors flex items-center gap-1">
                                View Full List <ArrowRight size={10} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Project Name</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Pricing Plan</th>
                                        <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {projects.slice(0, 5).map(p => (
                                        <tr key={p.id} className="hover:bg-orange-50/30 cursor-pointer transition-colors group" onClick={() => onNavigateToProject(p.id)}>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-gray-900 group-hover:text-[#ff4d00] transition-colors">{p.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">{p.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 py-1 bg-gray-100 rounded-sm">{p.plan}</span>
                                            </td>
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
                                        <tr><td colSpan={3} className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No projects found. Create your first campaign to get started.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SEO Tip & Did You Know */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex gap-4 hover:border-blue-400 transition-colors">
                            <div className="mt-1 bg-blue-50 p-2 rounded-sm"><Info size={16} className="text-blue-500" /></div>
                            <div>
                                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Weekly SEO Insight</div>
                                <p className="text-xs text-gray-700 leading-relaxed font-bold">"{dailyTip}"</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex gap-4 hover:border-orange-400 transition-colors">
                            <div className="mt-1 bg-orange-50 p-2 rounded-sm"><Globe size={16} className="text-[#ff4d00]" /></div>
                            <div>
                                <div className="text-[9px] font-black text-[#ff4d00] uppercase tracking-widest mb-1">Internet Statistics</div>
                                <p className="text-xs text-gray-700 leading-relaxed font-bold">"{didYouKnow}"</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6">

                    {/* Quick Access Control */}
                    <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-sm">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                            <Zap size={14} className="text-[#ff4d00]" /> Command Center
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => onNavigateToProject('new')} className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-sm group">
                                <Activity size={20} className="mb-2 text-[#ff4d00]" />
                                <div className="text-[9px] font-black uppercase tracking-widest">New Project</div>
                            </button>
                            <button onClick={onNavigateToBuyCredits} className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-sm group">
                                <CreditCard size={20} className="mb-2 text-gray-400 group-hover:text-[#ff4d00]" />
                                <div className="text-[9px] font-black uppercase tracking-widest">Buy Credits</div>
                            </button>
                            <button onClick={() => setBonusClaimed(true)} disabled={bonusClaimed} className={`flex flex-col items-center justify-center p-4 transition-all rounded-sm group ${bonusClaimed ? 'bg-[#ff4d00]/10 text-[#ff4d00]' : 'bg-gray-50 hover:bg-[#ff4d00] hover:text-white'}`}>
                                <Gift size={20} className={`mb-2 ${bonusClaimed ? 'text-[#ff4d00]' : 'text-gray-400 group-hover:text-white'}`} />
                                <div className="text-[9px] font-black uppercase tracking-widest">{bonusClaimed ? 'Claimed' : 'Daily Bonus'}</div>
                            </button>
                            <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-600 hover:text-white transition-all rounded-sm group">
                                <MessageSquare size={20} className="mb-2 text-gray-400 group-hover:text-white" />
                                <div className="text-[9px] font-black uppercase tracking-widest">Get Support</div>
                            </button>
                        </div>
                    </div>

                    {/* Streak & Status Dark Card */}
                    <div className="bg-[#111] text-white p-6 rounded-sm shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d00] opacity-10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Activity Streak</div>
                            <div className="text-3xl font-black flex items-center gap-3 mb-6">
                                5 DAYS <Zap size={24} className="text-[#ff4d00] fill-[#ff4d00] animate-pulse" />
                            </div>
                            <div className="flex gap-1.5 h-1.5 mb-3">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-[#ff4d00] flex-1 rounded-full"></div>)}
                                {[6, 7].map(i => <div key={i} className="bg-gray-800 flex-1 rounded-full"></div>)}
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Maintain your streak to earn +10% bonus hits</p>
                        </div>
                    </div>

                    {/* Referral Link Widget */}
                    <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-sm">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2 flex items-center gap-2">
                            <Users size={14} className="text-blue-500" /> Affiliate Portal
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-tight">Earn hits by sharing your link</p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-gray-50 border border-gray-200 text-[10px] px-3 py-2.5 rounded-sm font-mono text-gray-500 truncate">
                                traffic.com/ref/{user?.id || '...'}
                            </div>
                            <button
                                onClick={handleCopyReferral}
                                className={`px-4 rounded-sm border transition-all flex items-center justify-center ${copiedRef ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 hover:border-[#ff4d00] hover:text-[#ff4d00]'}`}
                            >
                                {copiedRef ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Recent History */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Wallet History</h3>
                            <Clock size={12} className="text-gray-400" />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {transactions.length > 0 ? transactions.slice(0, 3).map(t => (
                                <div key={t.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-sm ${t.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-[#ff4d00]'}`}>
                                            {t.type === 'credit' ? <Plus size={10} /> : <ArrowRight size={10} className="rotate-45" />}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight truncate w-32">{t.desc}</div>
                                            <div className="text-[9px] text-gray-400 font-bold uppercase">{t.date}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-black ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(0)}
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No transactions recorded.</div>
                            )}
                        </div>
                        {transactions.length > 0 && (
                            <button onClick={() => db.getTransactions()} className="w-full py-3 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ff4d00] transition-colors border-t border-gray-100">
                                View Full Wallet
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;