import React, { useState, useEffect } from 'react';
import {
    Star, Zap, Gift, Trophy, TrendingUp, Target, Flame, CheckCircle2,
    Lock, Unlock, Sparkles, Award, ChevronRight, Info, CreditCard, UserCheck, FolderPlus, Users
} from 'lucide-react';
import { db } from '../services/db';

interface GamificationData {
    level: number;
    level_name: string;
    xp: number;
    xp_to_next: number;
    total_spent: number;
    discount_percent: number;
    pending_bonus_hits: number;
    pending_bonus_claimed: boolean;
    streak_days: number;
    streak_best: number;
    next_reward: string;
}

interface DailyBonusResult {
    success: boolean;
    hits: number;
    streak_days: number;
    streak_best: number;
    message: string;
    tier: string;
}

const LEVELS = [
    { level: 1, name: 'Novice', xp_required: 0, spend_required: 0, bonus_hits: 0, discount: 0, color: '#9ca3af' },
    { level: 2, name: 'Rookie', xp_required: 100, spend_required: 10, bonus_hits: 2000, discount: 0, color: '#6b7280' },
    { level: 3, name: 'Explorer', xp_required: 250, spend_required: 25, bonus_hits: 3000, discount: 0, color: '#6b7280' },
    { level: 4, name: 'Starter', xp_required: 500, spend_required: 50, bonus_hits: 5000, discount: 1, color: '#22c55e' },
    { level: 5, name: 'Builder', xp_required: 1000, spend_required: 100, bonus_hits: 8000, discount: 2, color: '#22c55e' },
    { level: 6, name: 'Achiever', xp_required: 2000, spend_required: 200, bonus_hits: 12000, discount: 2, color: '#22c55e' },
    { level: 7, name: 'Strategist', xp_required: 3500, spend_required: 350, bonus_hits: 15000, discount: 3, color: '#3b82f6' },
    { level: 8, name: 'Professional', xp_required: 5000, spend_required: 500, bonus_hits: 20000, discount: 4, color: '#3b82f6' },
    { level: 9, name: 'Expert', xp_required: 7500, spend_required: 750, bonus_hits: 30000, discount: 5, color: '#3b82f6' },
    { level: 10, name: 'Master', xp_required: 10000, spend_required: 1000, bonus_hits: 40000, discount: 6, color: '#8b5cf6' },
    { level: 11, name: 'Veteran', xp_required: 15000, spend_required: 1500, bonus_hits: 50000, discount: 7, color: '#8b5cf6' },
    { level: 12, name: 'Champion', xp_required: 20000, spend_required: 2000, bonus_hits: 60000, discount: 8, color: '#8b5cf6' },
    { level: 13, name: 'Elite', xp_required: 30000, spend_required: 3000, bonus_hits: 80000, discount: 9, color: '#ec4899' },
    { level: 14, name: 'Premier', xp_required: 40000, spend_required: 4000, bonus_hits: 100000, discount: 10, color: '#ec4899' },
    { level: 15, name: 'Supreme', xp_required: 60000, spend_required: 6000, bonus_hits: 120000, discount: 11, color: '#ec4899' },
    { level: 16, name: 'Titan', xp_required: 80000, spend_required: 8000, bonus_hits: 150000, discount: 12, color: '#f59e0b' },
    { level: 17, name: 'Legend', xp_required: 120000, spend_required: 12000, bonus_hits: 180000, discount: 13, color: '#f59e0b' },
    { level: 18, name: 'Mythic', xp_required: 180000, spend_required: 18000, bonus_hits: 220000, discount: 14, color: '#f59e0b' },
    { level: 19, name: 'Immortal', xp_required: 250000, spend_required: 25000, bonus_hits: 280000, discount: 15, color: '#ef4444' },
    { level: 20, name: 'Apex', xp_required: 500000, spend_required: 50000, bonus_hits: 500000, discount: 20, color: '#ff4d00' },
];

const STREAK_BONUSES = [
    { days: '1-2', hits: 1000 },
    { days: '3-4', hits: 2000 },
    { days: '5-6', hits: 3000 },
    { days: '7', hits: 10000, milestone: true },
    { days: '8-13', hits: 10000 },
    { days: '14', hits: 15000, milestone: true },
    { days: '15-29', hits: 15000 },
    { days: '30+', hits: 20000, milestone: true },
];

const XP_SOURCES = [
    { action: '€1 Spent', xp: 10, icon: <CreditCard size={24} className="text-[#ff4d00]" /> },
    { action: 'Daily Login', xp: 5, icon: <UserCheck size={24} className="text-[#ff4d00]" /> },
    { action: 'Create Project', xp: 20, icon: <FolderPlus size={24} className="text-[#ff4d00]" /> },
    { action: '7-Day Streak', xp: 50, icon: <Flame size={24} className="text-[#ff4d00]" /> },
    { action: 'Referral Payout', xp: 100, icon: <Users size={24} className="text-[#ff4d00]" /> },
];

const Gamification: React.FC = () => {
    const [data, setData] = useState<GamificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [claimingLevel, setClaimingLevel] = useState(false);
    const [claimingDaily, setClaimingDaily] = useState(false);
    const [dailyResult, setDailyResult] = useState<DailyBonusResult | null>(null);
    const [showDailyPopup, setShowDailyPopup] = useState(false);
    const [canClaimDaily, setCanClaimDaily] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/users/me/gamification`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('tgp_token')}` }
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }

            const streakResponse = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/users/me/streak`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('tgp_token')}` }
            });
            if (streakResponse.ok) {
                const streakData = await streakResponse.json();
                setCanClaimDaily(streakData.can_claim_today);
            }
        } catch (e) {
            console.error('Failed to fetch gamification data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimLevelBonus = async () => {
        if (claimingLevel) return;
        setClaimingLevel(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/users/me/claim-level-bonus`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('tgp_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                fetchData();
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to claim bonus');
            }
        } catch (e) {
            alert('Failed to claim bonus');
        } finally {
            setClaimingLevel(false);
        }
    };

    const handleClaimDailyBonus = async () => {
        if (claimingDaily || !canClaimDaily) return;
        setClaimingDaily(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/users/me/daily-bonus`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('tgp_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            setDailyResult(result);
            setShowDailyPopup(true);

            if (result.success) {
                setCanClaimDaily(false);
                fetchData();
            }
        } catch (e) {
            console.error('Failed to claim daily bonus:', e);
        } finally {
            setClaimingDaily(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-[#ff4d00] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const currentLevelData = LEVELS[data?.level ? data.level - 1 : 0] || LEVELS[0];
    const xpProgress = data?.xp_to_next ? Math.round((data.xp / (data.xp + data.xp_to_next)) * 100) : 100;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Rewards Program</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gamification</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 px-6 py-3 shadow-sm text-center">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total XP</div>
                        <div className="text-2xl font-black text-gray-900">{data?.xp?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-[#ff4d00] text-white px-6 py-4 shadow-sm text-center">
                        <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">Your Discount</div>
                        <div className="text-2xl font-black">{data?.discount_percent || 0}% OFF</div>
                    </div>
                </div>
            </div>

            {/* Current Level Progress */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Star size={14} className="text-[#ff4d00]" /> Your Progress
                    </h3>
                </div>
                <div className="p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d00] opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full flex items-center justify-center text-white font-black text-3xl" style={{ backgroundColor: currentLevelData.color }}>
                                Lv{data?.level || 1}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                                {currentLevelData.name}
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500">{data?.xp?.toLocaleString() || 0} XP</span>
                                <span className="text-xs font-bold text-[#ff4d00]">{xpProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-[#ff4d00] to-[#ff8c00] transition-all duration-1000 rounded-full"
                                    style={{ width: `${xpProgress}%` }}
                                ></div>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Next: {LEVELS[Math.min((data?.level || 1), 19)]?.name || 'Apex'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">
                                    {data?.xp_to_next?.toLocaleString() || 0} XP needed
                                </span>
                            </div>
                            {data?.pending_bonus_hits && data.pending_bonus_hits > 0 && !data.pending_bonus_claimed && (
                                <button
                                    onClick={handleClaimLevelBonus}
                                    disabled={claimingLevel}
                                    className="mt-4 w-full bg-[#ff4d00] text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    <Sparkles size={14} /> {claimingLevel ? 'Claiming...' : `Claim Level ${data.level} Bonus: +${data.pending_bonus_hits.toLocaleString()} Hits`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Bonus & Streak */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Bonus */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-black text-white p-8 shadow-2xl relative overflow-hidden rounded-lg border border-gray-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff4d00] opacity-10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff4d00] opacity-5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-gray-300">
                                <Gift size={18} className="text-[#ff4d00]" /> Daily Rewards
                            </h3>
                            {canClaimDaily && (
                                <span className="bg-[#ff4d00] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,77,0,0.5)]">
                                    Ready to Claim
                                </span>
                            )}
                        </div>

                        <div className="flex items-end gap-4 mb-6">
                            <div className="text-5xl font-black text-white leading-none">
                                {data?.streak_days || 0}
                            </div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                Day Streak <Flame size={14} className="text-[#ff4d00]" />
                            </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded-lg mb-6 backdrop-blur-sm border border-white/5">
                            <div className="flex gap-2 mb-2">
                                {[1, 2, 3, 4, 5, 6, 7].map(i => {
                                    const isCompleted = (data?.streak_days || 0) % 7 >= i || ((data?.streak_days || 0) >= 7 && i <= 7);
                                    const isToday = (data?.streak_days || 0) % 7 === i - 1 && canClaimDaily;

                                    return (
                                        <div
                                            key={i}
                                            className={`flex-1 h-3 rounded-full transition-all duration-300 ${isCompleted
                                                ? 'bg-gradient-to-r from-[#ff4d00] to-[#ff8c00] shadow-[0_0_10px_rgba(255,77,0,0.3)]'
                                                : 'bg-gray-800'
                                                } ${isToday ? 'animate-pulse ring-2 ring-[#ff4d00] ring-offset-2 ring-offset-black' : ''}`}
                                        ></div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mt-2 px-1">
                                <span>Day 1</span>
                                <span>Day 7 (Bonus)</span>
                            </div>
                        </div>

                        <button
                            onClick={handleClaimDailyBonus}
                            disabled={!canClaimDaily || claimingDaily}
                            className={`w-full py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 rounded flex items-center justify-center gap-3 shadow-lg ${canClaimDaily
                                ? 'bg-gradient-to-r from-[#ff4d00] to-[#ff6b00] hover:from-[#ff3300] hover:to-[#ff5500] text-white shadow-[#ff4d00]/20 transform hover:-translate-y-1'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                }`}
                        >
                            <Gift size={18} className={canClaimDaily ? 'animate-bounce' : ''} />
                            {claimingDaily ? 'Claiming Reward...' : canClaimDaily ? 'Claim Daily Bonus' : 'Come Back Tomorrow'}
                        </button>
                    </div>
                </div>

                {/* Streak Info */}
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-4">
                        <Flame size={14} className="text-[#ff4d00]" /> Streak Rewards
                    </h3>
                    <div className="space-y-3">
                        {STREAK_BONUSES.map((bonus, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-sm ${bonus.milestone ? 'bg-[#ff4d00]/5 border border-[#ff4d00]/20' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    {bonus.milestone && <Trophy size={14} className="text-[#ff4d00]" />}
                                    <span className="text-xs font-bold text-gray-700">Day {bonus.days}</span>
                                </div>
                                <span className="text-xs font-black text-[#ff4d00]">+{bonus.hits.toLocaleString()} Hits</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-sm">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Best Streak: <span className="text-gray-900">{data?.streak_best || 0} Days</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Level Table */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Trophy size={14} className="text-[#ff4d00]" /> All 20 Levels
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Required</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Bonus Hits</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Discount</th>
                                <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {LEVELS.map((level) => {
                                const isCurrent = data?.level === level.level;
                                const isUnlocked = (data?.level || 1) >= level.level;
                                return (
                                    <tr key={level.level} className={`hover:bg-gray-50 transition-colors ${isCurrent ? 'bg-[#ff4d00]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                                                    style={{ backgroundColor: level.color }}
                                                >
                                                    {level.level}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-900">{level.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-500">
                                                <span className="font-bold">{level.xp_required.toLocaleString()} XP</span>
                                                <span className="text-gray-400 ml-2">or €{level.spend_required.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-black ${level.bonus_hits > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {level.bonus_hits > 0 ? `+${level.bonus_hits.toLocaleString()}` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-black ${level.discount > 0 ? 'text-[#ff4d00]' : 'text-gray-400'}`}>
                                                {level.discount > 0 ? `${level.discount}%` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isCurrent ? (
                                                <span className="inline-flex items-center gap-1 bg-[#ff4d00] text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                                                    <Star size={10} /> Current
                                                </span>
                                            ) : isUnlocked ? (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                                                    <CheckCircle2 size={10} /> Unlocked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                                                    <Lock size={10} /> Locked
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* How to Earn XP */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-6">
                    <Target size={14} className="text-[#ff4d00]" /> How to Earn XP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {XP_SOURCES.map((source, i) => (
                        <div key={i} className="bg-white border border-gray-100 p-6 text-center rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                            <div className="flex justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                <div className="p-3 bg-gray-50 rounded-full group-hover:bg-[#ff4d00]/10 transition-colors">
                                    {source.icon}
                                </div>
                            </div>
                            <div className="text-xs font-black text-gray-900 uppercase tracking-wide mb-1">{source.action}</div>
                            <div className="text-base font-black text-[#ff4d00]">+{source.xp} XP</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Bonus Popup */}
            {showDailyPopup && dailyResult && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-300 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-[#ff4d00] to-[#ff8c00]"></div>

                        <div className="p-8 pb-0 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-50 to-white -z-10"></div>
                            <div className="inline-flex p-4 rounded-full bg-[#ff4d00]/10 mb-4 animate-bounce">
                                <Gift size={48} className="text-[#ff4d00]" />
                            </div>

                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                                {dailyResult.success ? 'Bonus Unlocked!' : 'Already Claimed'}
                            </h2>

                            {dailyResult.success ? (
                                <p className="text-gray-500 font-medium">Keep your streak alive for bigger rewards!</p>
                            ) : (
                                <p className="text-gray-500 font-medium">{dailyResult.message}</p>
                            )}
                        </div>

                        <div className="p-8 text-center">
                            {dailyResult.success && (
                                <>
                                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-br from-gray-900 to-black text-white rounded-lg mb-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[#ff4d00] opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
                                        <div className="relative z-10">
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                You Received
                                            </p>
                                            <p className="text-5xl font-black text-[#ff4d00] mb-1">
                                                +{dailyResult.hits.toLocaleString()}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                Economy Hits
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Streak</div>
                                            <div className="text-2xl font-black text-gray-900 flex justify-center items-center gap-1">
                                                {dailyResult.streak_days} <Flame size={16} className="text-[#ff4d00]" />
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Best Streak</div>
                                            <div className="text-2xl font-black text-gray-900 flex justify-center items-center gap-1">
                                                {dailyResult.streak_best} <Trophy size={16} className="text-[#fbbf24]" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="px-8 pb-8">
                            <button
                                onClick={() => setShowDailyPopup(false)}
                                className="w-full bg-[#ff4d00] text-white py-4 text-sm font-black uppercase tracking-widest hover:bg-black transition-all duration-300 rounded shadow-lg shadow-[#ff4d00]/20 hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gamification;