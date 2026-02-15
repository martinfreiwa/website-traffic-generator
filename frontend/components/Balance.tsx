import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Clock, CreditCard, X, Printer, Share2, Layers, Award, Zap } from 'lucide-react';
import { db } from '../services/db';
import { Transaction, User } from '../types';

const Balance: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
    const [user, setUser] = useState<User | undefined>(undefined);

    useEffect(() => {
        // Force refresh user data to ensure balances are up to date
        const refreshData = async () => {
            // We can't easily call backend here directly without duplicating logic/constants
            // But db.purchaseCredits updates the local user object.
            // For now, let's trust db.getCurrentUser() but ideally we'd have a db.refreshUser()
            setUser(db.getCurrentUser());
            setTransactions(db.getTransactions());
        };
        refreshData();

        // Set interval to check for changes (e.g. if updated elsewhere)
        const interval = setInterval(() => {
            setUser(db.getCurrentUser());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleDownloadStatement = () => {
        if (transactions.length === 0) {
            alert('No transactions to download.');
            return;
        }

        const headers = ['ID', 'Date', 'Description', 'Type', 'Amount', 'Status'];
        const rows = transactions.map(t => [
            t.id,
            t.date,
            `"${t.desc.replace(/"/g, '""')}"`, // Escape quotes
            t.type,
            t.amount.toFixed(2),
            t.status
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
                    <div className="text-3xl font-black text-gray-900 mb-1">€{(user?.balanceEconomy || 0).toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Available Credits</div>
                </div>

                {/* Professional Balance */}
                <div className="bg-white border-b-4 border-orange-300 p-8 shadow-sm hover:translate-y-[-2px] transition-transform relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-orange-50 rounded-sm text-orange-500">
                            <Award size={20} />
                        </div>
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 uppercase tracking-widest">Professional</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1 relative z-10">€{(user?.balanceProfessional || 0).toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide relative z-10">Available Credits</div>
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
                    <div className="text-3xl font-black text-white mb-1 relative z-10">€{(user?.balanceExpert || 0).toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide relative z-10">Available Credits</div>
                    <Zap className="absolute -bottom-4 -right-4 text-gray-800 w-32 h-32 rotate-12 opacity-20" />
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Clock size={14} className="text-[#ff4d00]" /> Transaction History
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f9fafb] border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-sm text-gray-400">No transactions found.</td></tr>
                            ) : (
                                transactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{trx.date}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-900">{trx.desc}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-sm">
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-black text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {trx.type === 'debit' ? '-' : '+'}€{trx.amount.toFixed(2)}
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