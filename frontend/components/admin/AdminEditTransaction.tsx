
import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { db } from '../../services/db';
import { ArrowLeft, Save } from 'lucide-react';

interface AdminEditTransactionProps {
    trxId: string;
    onBack: () => void;
    onUpdate: () => void;
}

const AdminEditTransaction: React.FC<AdminEditTransactionProps> = ({ trxId, onBack, onUpdate }) => {
    const [trx, setTrx] = useState<Transaction | null>(null);

    useEffect(() => {
        const loadTransaction = async () => {
            await db.syncAllTransactions();
            const transactions = db.getAllTransactionsAdmin();
            const found = transactions.find(t => t.id === trxId);
            setTrx(found || null);
        };
        loadTransaction();
    }, [trxId]);

    const handleSave = async () => {
        if (!trx) return;
        try {
            await db.updateTransaction(trx);
            onUpdate();
            alert('Transaction updated.');
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    if (!trx) return <div>Transaction not found.</div>;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black text-xs font-bold uppercase tracking-wide">
                    <ArrowLeft size={14} /> Back to Transactions
                </button>
                <button 
                    onClick={handleSave}
                    className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                >
                    <Save size={14} /> Save Changes
                </button>
            </div>

            <div className="bg-white border border-gray-200 p-8 shadow-sm max-w-3xl mx-auto">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8">Edit Transaction: {trx.id}</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Description</label>
                        <input 
                            value={trx.desc}
                            onChange={(e) => setTrx({...trx, desc: e.target.value})}
                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Amount (€)</label>
                            <input 
                                type="number"
                                value={trx.amount}
                                onChange={(e) => setTrx({...trx, amount: parseFloat(e.target.value) || 0})}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Type</label>
                            <select 
                                value={trx.type}
                                onChange={(e) => setTrx({...trx, type: e.target.value as 'credit' | 'debit'})}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            >
                                <option value="credit">Credit (+)</option>
                                <option value="debit">Debit (-)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Status</label>
                            <select 
                                value={trx.status}
                                onChange={(e) => setTrx({...trx, status: e.target.value as any})}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            >
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Date</label>
                            <input 
                                value={trx.date}
                                onChange={(e) => setTrx({...trx, date: e.target.value})}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Balance Tier</label>
                            <select 
                                value={trx.tier || ''}
                                onChange={(e) => setTrx({...trx, tier: e.target.value || undefined})}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            >
                                <option value="">General</option>
                                <option value="economy">Economy</option>
                                <option value="professional">Professional</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Reference</label>
                            <input 
                                value={trx.reference || ''}
                                onChange={(e) => setTrx({...trx, reference: e.target.value || undefined})}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="TGP-XXXXXXXX-XXXXXX"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminEditTransaction;
