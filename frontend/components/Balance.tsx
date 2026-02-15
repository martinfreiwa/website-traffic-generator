import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Clock, CreditCard, X, Printer, Share2, Layers, Award, Zap, Filter } from 'lucide-react';
import { db } from '../services/db';
import { Transaction, User } from '../types';

const Balance: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
    const [user, setUser] = useState<User | undefined>(undefined);
    const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
    const [tierFilter, setTierFilter] = useState<string>('all');

    useEffect(() => {
        const refreshData = async () => {
            setUser(db.getCurrentUser());
            await db.syncTransactions();
            setTransactions(db.getTransactions());
        };
        refreshData();

        const interval = setInterval(() => {
            setUser(db.getCurrentUser());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const calculateAvailableHits = (tier: string): number => {
        const purchasedHits = transactions
            .filter(t => t.type === 'credit' && t.tier === tier && t.hits)
            .reduce((sum, t) => sum + (t.hits || 0), 0);
        
        const usedHits = transactions
            .filter(t => t.type === 'debit' && t.tier === tier && t.hits)
            .reduce((sum, t) => sum + (t.hits || 0), 0);
        
        return purchasedHits - usedHits;
    };

    const getTierLabel = (tier?: string): string => {
        if (!tier) return 'General';
        const tierMap: Record<string, string> = {
            'economy': 'Economy',
            'professional': 'Professional',
            'expert': 'Expert'
        };
        return tierMap[tier] || tier;
    };

    const getTierColor = (tier?: string): string => {
        if (!tier) return 'bg-gray-100 text-gray-600';
        const colorMap: Record<string, string> = {
            'economy': 'bg-gray-100 text-gray-600',
            'professional': 'bg-orange-100 text-orange-600',
            'expert': 'bg-[#ff4d00]/10 text-[#ff4d00]'
        };
        return colorMap[tier] || 'bg-gray-100 text-gray-600';
    };

    const filteredTransactions = transactions.filter(t => {
        if (tierFilter !== 'all' && t.tier !== tierFilter) return false;
        
        if (dateFilter !== 'all') {
            const txDate = new Date(t.date);
            const now = new Date();
            const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
            const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            if (txDate < cutoff) return false;
        }
        return true;
    });

    const handleDownloadStatement = () => {
        if (filteredTransactions.length === 0) {
            alert('No transactions to download.');
            return;
        }

        const headers = ['ID', 'Date', 'Description', 'Type', 'Amount', 'Status', 'Balance Tier', 'Hits', 'Reference'];
        const rows = filteredTransactions.map(t => [
            t.id,
            t.date,
            `"${t.desc.replace(/"/g, '""')}"`,
            t.type,
            t.amount.toFixed(2),
            t.status,
            getTierLabel(t.tier),
            t.hits ? (t.type === 'credit' ? '+' : '-') + t.hits.toString() : '',
            t.reference || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `traffic_statement_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const InvoiceModal = ({ trx, onClose }: { trx: Transaction, onClose: () => void }) => (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#ff4d00] flex items-center justify-center">
                                <span className="font-black text-black text-xs">M</span>
                            </div>
                            <span className="font-black text-lg tracking-tight">TRAFFIC GEN</span>
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest">Receipt</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 mb-1">€{trx.amount.toFixed(2)}</div>
                        {trx.hits && (
                            <div className={`text-sm font-bold mb-1 ${trx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                ({trx.type === 'credit' ? '+' : '-'}{trx.hits.toLocaleString()} hits)
                            </div>
                        )}
                        <div className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 inline-block ${trx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                            {trx.status}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Date</label>
                            <div className="text-sm font-bold text-gray-900">{trx.date}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Transaction ID</label>
                            <div className="text-sm font-mono text-gray-600">{trx.id}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Type</label>
                            <div className="text-sm font-bold text-gray-900 capitalize">{trx.type === 'credit' ? 'Deposit' : 'Purchase'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Balance Tier</label>
                            <div className="text-sm font-bold text-gray-900">{getTierLabel(trx.tier)}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Reference</label>
                            <div className="text-sm font-mono text-gray-600">{trx.reference || '-'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">User</label>
                            <div className="text-sm font-bold text-gray-900">{user?.name || 'User'}</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 border border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Description</label>
                        <div className="text-sm font-medium text-gray-900">{trx.desc}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase hover:bg-gray-100">
                        <Printer size={14} /> Print
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff4d00]">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {selectedInvoice && <InvoiceModal trx={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Financial Overview</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Balances</h2>
                </div>
                <button
                    onClick={handleDownloadStatement}
                    className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                >
                    <Download size={14} /> Statement
                </button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Economy Balance */}
                <div className="bg-white border-b-4 border-gray-200 p-8 shadow-sm hover:translate-y-[-2px] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-gray-100 rounded-sm text-gray-600">
                            <Layers size={20} />
                        </div>
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 uppercase tracking-widest text-gray-500">Economy</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{calculateAvailableHits('economy').toLocaleString()}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Hits Available</div>
                </div>

                {/* Professional Balance */}
                <div className="bg-white border-b-4 border-orange-300 p-8 shadow-sm hover:translate-y-[-2px] transition-transform relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-orange-50 rounded-sm text-orange-500">
                            <Award size={20} />
                        </div>
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 uppercase tracking-widest">Professional</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1 relative z-10">{calculateAvailableHits('professional').toLocaleString()}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide relative z-10">Hits Available</div>
                    <Award className="absolute -bottom-4 -right-4 text-orange-50 w-32 h-32 rotate-12" />
                </div>

                {/* Expert Balance */}
                <div className="bg-[#111] border-b-4 border-[#ff4d00] text-white p-8 shadow-lg hover:translate-y-[-2px] transition-transform relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-[#ff4d00] rounded-sm text-white">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-bold bg-[#ff4d00] text-white px-2 py-1 uppercase tracking-widest">Expert</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1 relative z-10">{calculateAvailableHits('expert').toLocaleString()}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide relative z-10">Hits Available</div>
                    <Zap className="absolute -bottom-4 -right-4 text-gray-800 w-32 h-32 rotate-12 opacity-20" />
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Clock size={14} className="text-[#ff4d00]" /> Transaction History
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase tracking-wide"
                        >
                            <option value="all">All Time</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                        <select
                            value={tierFilter}
                            onChange={(e) => setTierFilter(e.target.value)}
                            className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase tracking-wide"
                        >
                            <option value="all">All Balances</option>
                            <option value="economy">Economy</option>
                            <option value="professional">Professional</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f9fafb] border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hits</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan={8} className="text-center p-8 text-sm text-gray-400">No transactions found.</td></tr>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{trx.date}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-900">{trx.desc}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${getTierColor(trx.tier)}`}>
                                                {getTierLabel(trx.tier)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-900">
                                            {trx.hits ? (
                                                <span className={trx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                                    {trx.type === 'credit' ? '+' : '-'}{trx.hits.toLocaleString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{trx.reference || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-sm">
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-black text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {trx.type === 'debit' ? '-' : '+'}€{trx.amount.toFixed(2)}
                                            {trx.hits ? (
                                                <span className={`block text-[10px] ${trx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                                    ({trx.type === 'credit' ? '+' : '-'}{trx.hits.toLocaleString()} hits)
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedInvoice(trx)}
                                                className="text-gray-400 hover:text-[#ff4d00] transition-colors"
                                            >
                                                <Download size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Balance;