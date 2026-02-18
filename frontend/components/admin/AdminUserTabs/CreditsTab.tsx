import React, { useState, useEffect } from 'react';
import { BalanceAdjustmentLog, AdminUserDetails } from '../../../types';
import { db } from '../../../services/db';
import { Layers, Award, Zap, Plus, Minus, AlertCircle, History, RefreshCw } from 'lucide-react';

interface CreditsTabProps {
    userId: string;
    onUpdate: () => void;
}

const CreditsTab: React.FC<CreditsTabProps> = ({ userId, onUpdate }) => {
    const [details, setDetails] = useState<AdminUserDetails | null>(null);
    const [adjustments, setAdjustments] = useState<BalanceAdjustmentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [tier, setTier] = useState('economy');
    const [operation, setOperation] = useState<'credit' | 'debit'>('credit');
    const [hits, setHits] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [detailsData, adjustmentsData] = await Promise.all([
                db.getUserDetails(userId),
                db.getBalanceAdjustments(userId)
            ]);
            setDetails(detailsData);
            setAdjustments(adjustmentsData);
        } catch (e) {
            console.error('Failed to load credits data:', e);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!hits || parseInt(hits) <= 0) {
            setError('Please enter a valid hit count');
            return;
        }
        if (!reason.trim()) {
            setError('Please provide a reason');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await db.adjustUserBalance(userId, {
                adjustmentType: operation,
                tier: tier,
                amount: 0,
                hits: parseInt(hits),
                reason: reason.trim(),
                notes: notes.trim() || undefined
            });

            setHits('');
            setReason('');
            setNotes('');
            await loadData();
            onUpdate();
        } catch (e: any) {
            setError(e.message || 'Failed to adjust balance. Please try again.');
        }

        setSubmitting(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (!details) {
        return <div className="p-8 text-center text-gray-500">No user details found.</div>;
    }

    const { tierBalances } = details;

    const getTierIcon = (tierName: string) => {
        switch (tierName) {
            case 'economy': return <Layers size={16} className="text-gray-400" />;
            case 'professional': return <Award size={16} className="text-orange-500" />;
            case 'expert': return <Zap size={16} className="text-[#ff4d00]" />;
            default: return null;
        }
    };

    const getTierLabel = (tierName: string) => {
        switch (tierName) {
            case 'economy': return 'Economy';
            case 'professional': return 'Professional';
            case 'expert': return 'Expert';
            default: return tierName;
        }
    };

    const getTierStyle = (tierName: string) => {
        switch (tierName) {
            case 'economy': return 'border-gray-200';
            case 'professional': return 'border-orange-200';
            case 'expert': return 'border-[#ff4d00]/30 bg-[#111]';
            default: return 'border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                {(['economy', 'professional', 'expert'] as const).map((tierName) => (
                    <div
                        key={tierName}
                        className={`bg-white border ${getTierStyle(tierName)} p-6 shadow-sm ${tierName === 'expert' ? '' : ''}`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {getTierIcon(tierName)}
                            <span className={`text-xs font-bold uppercase ${tierName === 'expert' ? 'text-[#ff4d00]' : tierName === 'professional' ? 'text-orange-500' : 'text-gray-400'}`}>
                                {getTierLabel(tierName)}
                            </span>
                        </div>
                        <div className={`text-2xl font-black ${tierName === 'expert' ? 'text-white' : 'text-gray-900'}`}>
                            {tierBalances[tierName].toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">hits available</div>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                    {operation === 'credit' ? <Plus size={14} /> : <Minus size={14} />}
                    Adjust Balance
                </h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-6 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tier</label>
                        <select
                            value={tier}
                            onChange={(e) => setTier(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-200 focus:border-[#ff4d00] focus:outline-none"
                        >
                            <option value="economy">Economy</option>
                            <option value="professional">Professional</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Operation</label>
                        <select
                            value={operation}
                            onChange={(e) => setOperation(e.target.value as 'credit' | 'debit')}
                            className="w-full p-2 text-sm border border-gray-200 focus:border-[#ff4d00] focus:outline-none"
                        >
                            <option value="credit">Add</option>
                            <option value="debit">Remove</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Hits</label>
                        <input
                            type="number"
                            value={hits}
                            onChange={(e) => setHits(e.target.value)}
                            placeholder="10000"
                            min="1"
                            className="w-full p-2 text-sm border border-gray-200 focus:border-[#ff4d00] focus:outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Reason *</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Compensation for bug"
                            className="w-full p-2 text-sm border border-gray-200 focus:border-[#ff4d00] focus:outline-none"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`w-full py-2 text-white text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2
                                ${operation === 'credit'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : operation === 'credit' ? (
                                <Plus size={14} />
                            ) : (
                                <Minus size={14} />
                            )}
                            {operation === 'credit' ? 'Add Hits' : 'Remove Hits'}
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Notes (optional)</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional details about this adjustment..."
                        className="w-full p-2 text-sm border border-gray-200 focus:border-[#ff4d00] focus:outline-none"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <History size={14} /> Adjustment History
                    </h3>
                    <span className="text-xs text-gray-400">{adjustments.length} records</span>
                </div>

                {adjustments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No adjustments yet</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-left">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-left">Type</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-left">Tier</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Hits</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-left">Reason</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-left">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {adjustments.map((adj) => (
                                <tr key={adj.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-xs text-gray-600 font-mono">
                                        {adj.createdAt ? new Date(adj.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-xs">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                            adj.adjustmentType === 'credit'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {adj.adjustmentType === 'credit' ? 'Added' : 'Removed'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs font-bold uppercase">
                                        {adj.tier || '-'}
                                    </td>
                                    <td className={`px-6 py-3 text-xs font-bold text-right ${
                                        adj.adjustmentType === 'credit' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {adj.adjustmentType === 'credit' ? '+' : '-'}{adj.hits?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-900 max-w-[200px] truncate">
                                        {adj.reason || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-500">
                                        {adj.adminEmail || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CreditsTab;
