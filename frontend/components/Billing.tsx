import React, { useState, useEffect } from 'react';
import {
    CreditCard, Download, Filter, ArrowUpRight, ArrowDownLeft,
    Calendar, FileText, Wallet, Zap, Loader2, Shield
} from 'lucide-react';
import { db } from '../services/db';
import { User, Transaction } from '../types';

const Billing: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = db.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setTransactions(db.getTransactions());
                try {
                    const sub = await db.getCurrentSubscription();
                    setSubscription(sub);
                } catch (e) {
                    // No subscription
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        try {
            const result = await db.createPortalSession();
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Error opening portal:', error);
            alert('Failed to open billing portal. Please try again.');
        } finally {
            setPortalLoading(false);
        }
    };

    const handleDownloadInvoice = async (transactionId: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/users/me/invoices/${transactionId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('tgp_token')}` }
            });
            if (response.ok) {
                const htmlContent = await response.text();
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.write(htmlContent);
                    newWindow.document.close();
                } else {
                    alert('Please allow popups to view invoices');
                }
            } else {
                alert('Invoice not available. Please try again later.');
            }
        } catch (e) {
            alert('Failed to load invoice');
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'starter': return 'bg-gray-500';
            case 'professional': return 'bg-[#ff4d00]';
            case 'agency': return 'bg-purple-600';
            default: return 'bg-gray-500';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'past_due': return 'bg-yellow-500';
            case 'canceled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#ff4d00]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Finance</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Billing & Payments</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 px-6 py-3 shadow-sm">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Wallet Balance</div>
                        <div className="text-2xl font-black text-gray-900">{formatCurrency(user?.balance || 0)}</div>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard/buy-credits'}
                        className="bg-[#ff4d00] text-white px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2"
                    >
                        <Wallet size={14} /> Top Up
                    </button>
                </div>
            </div>

            {/* Current Subscription */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Zap size={14} className="text-[#ff4d00]" /> Current Subscription
                    </h3>
                </div>
                <div className="p-6">
                    {subscription && subscription.status !== 'inactive' ? (
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`px-4 py-2 text-white font-black text-sm uppercase ${getPlanBadgeColor(subscription.plan)}`}>
                                    {subscription.plan || 'Free'}
                                </div>
                                <div className={`px-3 py-1 text-white text-xs font-bold uppercase ${getStatusBadgeColor(subscription.status)}`}>
                                    {subscription.status}
                                </div>
                                {subscription.current_period_end && (
                                    <span className="text-xs text-gray-500">
                                        Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                                className="bg-black text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {portalLoading && <Loader2 className="animate-spin" size={14} />}
                                Manage Subscription
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-gray-500 mb-4">No active subscription</p>
                            <a
                                href="/pricing"
                                className="inline-block bg-[#ff4d00] text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                View Plans
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <CreditCard size={14} className="text-[#ff4d00]" /> Payment Methods
                    </h3>
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#f9fafb] p-4 rounded-full">
                                <Shield size={24} className="text-[#ff4d00]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Secure Payment Management</h4>
                                <p className="text-xs text-gray-500 max-w-md">Manage your payment methods securely through our payment provider. Add, remove, or update cards anytime.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {portalLoading && <Loader2 className="animate-spin" size={14} />}
                            <CreditCard size={14} /> Manage Payment Methods
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <FileText size={14} className="text-[#ff4d00]" /> Transaction History
                    </h3>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as 'all' | 'credit' | 'debit')}
                            className="bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#ff4d00]"
                        >
                            <option value="all">All Transactions</option>
                            <option value="credit">Credits Only</option>
                            <option value="debit">Debits Only</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-gray-400" />
                                                <span className="text-xs font-bold text-gray-700">{formatDate(t.date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-900">{t.desc}</span>
                                            {t.tier && (
                                                <span className="ml-2 text-[8px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{t.tier}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${
                                                t.type === 'credit' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-[#ff4d00]'
                                            }`}>
                                                {t.type === 'credit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                                {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDownloadInvoice(t.id)}
                                                className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-[#ff4d00] uppercase tracking-widest transition-colors"
                                            >
                                                <Download size={12} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <FileText size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-bold">No transactions found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Spent</div>
                    <div className="text-2xl font-black text-gray-900">
                        {formatCurrency(transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0))}
                    </div>
                </div>
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Top-ups</div>
                    <div className="text-2xl font-black text-green-600">
                        {formatCurrency(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
                    </div>
                </div>
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Transactions</div>
                    <div className="text-2xl font-black text-gray-900">{transactions.length}</div>
                </div>
            </div>
        </div>
    );
};

export default Billing;
