
import React from 'react';
import { Transaction } from '../../types';
import { Download, Edit2 } from 'lucide-react';

interface AdminTransactionsProps {
    transactions: Transaction[];
    onEditTransaction: (id: string) => void;
}

const AdminTransactions: React.FC<AdminTransactionsProps> = ({ transactions, onEditTransaction }) => {
    
    return (
        <div className="animate-in fade-in">
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tight">Global Transactions</h2>
                <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00]">
                    <Download size={14} /> Export CSV
                </button>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Trx ID</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User ID</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(trx => (
                            <tr key={trx.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{trx.id}</td>
                                <td className="px-6 py-4 text-xs font-bold text-gray-500">{trx.date}</td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-400">{trx.userId || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{trx.desc}</td>
                                <td className={`px-6 py-4 text-sm font-black text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                    {trx.type === 'credit' ? '+' : '-'}€{trx.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onEditTransaction(trx.id)}
                                        className="bg-gray-100 hover:bg-black hover:text-white text-gray-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm flex items-center gap-2 ml-auto"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminTransactions;