import React, { useState } from 'react';
import { User, Transaction, Project, Ticket, AdminUserDetails } from '../../../types';
import { db } from '../../../services/db';
import {
    DollarSign, Layers, Award, Zap, Plus, Minus, Send,
    RefreshCw, AlertTriangle, Shield, Key, Download, Trash2,
    LogIn, Tag, FileText, Users, ChevronRight
} from 'lucide-react';
import CustomSelect from '../../CustomSelect';

interface OverviewTabProps {
    userId: string;
    onNavigateToProject: (projectId: string) => void;
    onUpdate: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ userId, onNavigateToProject, onUpdate }) => {
    const [details, setDetails] = useState<AdminUserDetails | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bonusHitsAmount, setBonusHitsAmount] = useState('');
    const [bonusHitsTier, setBonusHitsTier] = useState('economy');
    const [bonusHitsReason, setBonusHitsReason] = useState('');
    const [showBonusForm, setShowBonusForm] = useState(false);

    React.useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [detailsData, trxData, projData] = await Promise.all([
                db.getUserDetails(userId),
                db.getUserTransactions(userId),
                db.getUserProjects(userId)
            ]);
            setDetails(detailsData);
            setTransactions(trxData);
            setProjects(projData);
        } catch (e) {
            console.error('Failed to load user data:', e);
            setError('Failed to load user data. Please try again.');
        }
        setLoading(false);
    };

    const handleAddBonusHits = async () => {
        if (!bonusHitsAmount || !bonusHitsReason) {
            alert('Please enter amount and reason');
            return;
        }
        try {
            await db.addBonusHits(userId, {
                tier: bonusHitsTier,
                hits: parseInt(bonusHitsAmount),
                reason: bonusHitsReason
            });
            alert('Bonus hits added successfully');
            setShowBonusForm(false);
            setBonusHitsAmount('');
            setBonusHitsReason('');
            loadData();
            onUpdate();
        } catch (e) {
            alert('Failed to add bonus hits');
        }
    };

    const handleSendPasswordReset = async () => {
        if (!confirm('Send password reset email to user?')) return;
        try {
            await db.sendPasswordReset(userId);
            alert('Password reset email sent');
        } catch (e) {
            alert('Failed to send password reset');
        }
    };

    const handleResendVerification = async () => {
        if (!confirm('Resend verification email to user?')) return;
        try {
            await db.resendVerification(userId);
            alert('Verification email sent');
        } catch (e) {
            alert('Failed to send verification email');
        }
    };

    const handleRegenerateApiKey = async () => {
        if (!confirm('Regenerate API key? This will invalidate the old key.')) return;
        try {
            const newKey = await db.adminRegenerateApiKey(userId);
            alert(`New API Key: ${newKey}`);
            loadData();
        } catch (e) {
            alert('Failed to regenerate API key');
        }
    };

    const handleExportData = async () => {
        try {
            const data = await db.adminExportUserData(userId);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user_${userId}_export.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Failed to export user data');
        }
    };

    const handleSuspendAccount = async () => {
        if (!details?.user) return;
        const reason = prompt('Enter suspension reason:');
        if (!reason) return;

        const updatedUser = { ...details.user, status: 'suspended', banReason: reason };
        await db.updateUser(updatedUser);
        loadData();
        onUpdate();
    };

    const handleImpersonate = async () => {
        if (!confirm('Log in as this user?')) return;
        try {
            await db.startImpersonation(userId);
            window.location.href = '/dashboard';
        } catch (e) {
            alert('Failed to start impersonation');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <div className="font-bold mb-2">Error</div>
                {error}
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-bold uppercase"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!details) {
        return <div className="p-8 text-center text-gray-500">No user details found.</div>;
    }

    const { user, tierBalances, totalSpent, totalHitsPurchased, totalHitsUsed, referralsCount, referralEarnings } = details;

    return (
        <div className="space-y-6">
            {/* Tier Balance Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Layers size={16} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Economy</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{tierBalances.economy.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">hits available</div>
                </div>
                <div className="bg-white border border-orange-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Award size={16} className="text-orange-500" />
                        <span className="text-xs font-bold text-orange-500 uppercase">Professional</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{tierBalances.professional.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">hits available</div>
                </div>
                <div className="bg-[#111] p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-[#ff4d00]" />
                        <span className="text-xs font-bold text-[#ff4d00] uppercase">Expert</span>
                    </div>
                    <div className="text-2xl font-black text-white">{tierBalances.expert.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">hits available</div>
                </div>
            </div>

            {/* Spending Summary */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">Spending Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Total Deposited</div>
                        <div className="text-xl font-black text-green-600">€{totalSpent.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Hits Purchased</div>
                        <div className="text-xl font-black text-gray-900">{totalHitsPurchased.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Hits Used</div>
                        <div className="text-xl font-black text-gray-900">{totalHitsUsed.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Referrals</div>
                        <div className="text-xl font-black text-gray-900">{referralsCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Referral Earnings</div>
                        <div className="text-xl font-black text-green-600">€{referralEarnings.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowBonusForm(!showBonusForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-700 transition-colors"
                    >
                        <Plus size={14} /> Add Bonus Hits
                    </button>
                    <button
                        onClick={handleSendPasswordReset}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase hover:bg-blue-700 transition-colors"
                    >
                        <Key size={14} /> Send Password Reset
                    </button>
                    <button
                        onClick={handleResendVerification}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-bold uppercase hover:bg-purple-700 transition-colors"
                    >
                        <RefreshCw size={14} /> Resend Verification
                    </button>
                    <button
                        onClick={handleRegenerateApiKey}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-xs font-bold uppercase hover:bg-gray-700 transition-colors"
                    >
                        <Key size={14} /> Regenerate API Key
                    </button>
                    <button
                        onClick={handleImpersonate}
                        className="flex items-center gap-2 px-4 py-2 bg-[#ff4d00] text-white text-xs font-bold uppercase hover:bg-orange-700 transition-colors"
                    >
                        <LogIn size={14} /> Login As User
                    </button>
                    <button
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-bold uppercase hover:bg-gray-900 transition-colors"
                    >
                        <Download size={14} /> Export Data
                    </button>
                    {user.status === 'active' ? (
                        <button
                            onClick={handleSuspendAccount}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors"
                        >
                            <AlertTriangle size={14} /> Suspend Account
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                const updatedUser = { ...user, status: 'active', banReason: '' };
                                await db.updateUser(updatedUser);
                                loadData();
                                onUpdate();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-700 transition-colors"
                        >
                            <Shield size={14} /> Reactivate Account
                        </button>
                    )}
                </div>

                {/* Bonus Hits Form */}
                {showBonusForm && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200">
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tier</label>
                                <select
                                    value={bonusHitsTier}
                                    onChange={(e) => setBonusHitsTier(e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-200"
                                >
                                    <option value="economy">Economy</option>
                                    <option value="professional">Professional</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Hits</label>
                                <input
                                    type="number"
                                    value={bonusHitsAmount}
                                    onChange={(e) => setBonusHitsAmount(e.target.value)}
                                    placeholder="50000"
                                    className="w-full p-2 text-sm border border-gray-200"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={bonusHitsReason}
                                    onChange={(e) => setBonusHitsReason(e.target.value)}
                                    placeholder="Bonus for testing"
                                    className="w-full p-2 text-sm border border-gray-200"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleAddBonusHits}
                                    className="w-full py-2 bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-700"
                                >
                                    Add Hits
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Projects */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <FileText size={14} /> Recent Projects ({projects.length})
                    </h3>
                </div>
                {projects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No projects found</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {projects.slice(0, 5).map(project => (
                            <div
                                key={project.id}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                                onClick={() => onNavigateToProject(project.id)}
                            >
                                <div>
                                    <div className="font-bold text-gray-900">{project.name}</div>
                                    <div className="text-xs text-gray-400">
                                        {project.tier} • Created {project.createdAt?.split('T')[0]}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                        project.status === 'stopped' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {project.status}
                                    </span>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <DollarSign size={14} /> Recent Transactions ({transactions.length})
                    </h3>
                </div>
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No transactions found</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Tier</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Hits</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.slice(0, 5).map(trx => (
                                <tr key={trx.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-xs text-gray-600 font-mono">{trx.date}</td>
                                    <td className="px-6 py-3 text-xs text-gray-900">{trx.desc}</td>
                                    <td className="px-6 py-3 text-xs font-bold uppercase">{trx.tier || '-'}</td>
                                    <td className="px-6 py-3 text-xs font-bold">{trx.hits ? trx.hits.toLocaleString() : '-'}</td>
                                    <td className={`px-6 py-3 text-xs font-bold text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {trx.type === 'credit' ? '+' : '-'}€{trx.amount.toFixed(2)}
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

export default OverviewTab;
