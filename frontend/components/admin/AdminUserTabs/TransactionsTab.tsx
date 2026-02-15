import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { db } from '../../../services/db';
import { DollarSign, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionsTabProps {
    userId: string;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ userId }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
    const [filterTier, setFilterTier] = useState<'all' | 'economy' | 'professional' | 'expert'>('all');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    useEffect(() => {
        loadTransactions();
    }, [userId]);

    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await db.getUserTransactions(userId);
            setTransactions(data);
        } catch (e) {
            console.error('Failed to load transactions:', e);
            setError('Failed to load transactions.');
        }
        setLoading(false);
    };

    const filteredTransactions = transactions.filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterTier !== 'all' && t.tier !== filterTier) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

    const getTierBadge = (tier?: string) => {
        if (!tier) return <span className="text-gray-400">-</span>;
        const colors: Record<string, string> = {
            economy: 'bg-gray-100 text-gray-600',
            professional: 'bg-orange-100 text-orange-600',
            expert: 'bg-[#ff4d00]/10 text-[#ff4d00]'
        };
        return (
            <span className={`px-2 py-1 text-[9px] font-bold uppercase ${colors[tier] || 'bg-gray-100 text-gray-600'}`}>
                {tier}
            </span>
        );
    };

    const handleExport = () => {
        const headers = ['Date', 'Description', 'Tier', 'Hits', 'Amount', 'Status'];
        const rows = filteredTransactions.map(t => [
            t.date,
            t.desc,
            t.tier || '',
            t.hits || '',
            t.amount.toFixed(2),
            t.status
        ]);

        const csv = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = `transactions_${userId}.csv`;
        link.click();
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
                    onClick={loadTransactions}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-bold uppercase"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Filters:</span>
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value as any); setPage(1); }}
                        className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase"
                    >
                        <option value="all">All Types</option>
                        <option value="credit">Credits</option>
                        <option value="debit">Debits</option>
                    </select>

                    <select
                        value={filterTier}
                        onChange={(e) => { setFilterTier(e.target.value as any); setPage(1); }}
                        className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase"
                    >
                        <option value="all">All Tiers</option>
                        <option value="economy">Economy</option>
                        <option value="professional">Professional</option>
                        <option value="expert">Expert</option>
                    </select>

                    <div className="flex-1"></div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-bold uppercase hover:bg-gray-900"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Tier</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Hits</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Amount</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No transactions found</td>
                            </tr>
                        ) : (
                            paginatedTransactions.map(trx => (
                                <tr key={trx.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs text-gray-600 font-mono">{trx.date}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-900">{trx.desc}</td>
                                    <td className="px-6 py-4">{getTierBadge(trx.tier)}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-900">
                                        {trx.hits ? (
                                            <span className={trx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                                {trx.type === 'credit' ? '+' : '-'}{trx.hits.toLocaleString()}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-bold text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {trx.type === 'credit' ? '+' : '-'}€{trx.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-[9px] font-bold uppercase ${trx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            trx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {trx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredTransactions.length)} of {filteredTransactions.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-200 disabled:opacity-50"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-bold">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-200 disabled:opacity-50"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsTab;
