import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { CheckCircle, XCircle, Clock, Eye, ExternalLink, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface BankTransferProof {
    id: string;
    user_id: string;
    user_email: string;
    amount: number;
    tier: string;
    currency: string;
    status: 'pending' | 'approved' | 'rejected';
    file_url: string;
    file_name: string;
    reference: string;
    notes: string;
    admin_notes: string;
    created_at: string;
    processed_at: string;
}

const AdminBankTransfers: React.FC = () => {
    const [transfers, setTransfers] = useState<BankTransferProof[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTransfer, setSelectedTransfer] = useState<BankTransferProof | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTransfers();
    }, [statusFilter]);

    const loadTransfers = async () => {
        setLoading(true);
        try {
            const data = await db.getBankTransfers(statusFilter);
            setTransfers(data);
        } catch (e) {
            console.error('Failed to load transfers', e);
        }
        setLoading(false);
    };

    const handleApprove = async (approved: boolean) => {
        if (!selectedTransfer) return;
        
        setProcessing(true);
        try {
            await db.approveBankTransfer(selectedTransfer.id, approved, adminNotes);
            setSelectedTransfer(null);
            setAdminNotes('');
            await loadTransfers();
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
        setProcessing(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-sm flex items-center gap-1"><CheckCircle size={10} /> Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider rounded-sm flex items-center gap-1"><XCircle size={10} /> Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase tracking-wider rounded-sm flex items-center gap-1"><Clock size={10} /> Pending</span>;
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-in fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Payment Verification</div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Bank Transfer Proofs</h2>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs border border-gray-200 px-4 py-2 bg-white font-bold uppercase tracking-wide"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button
                        onClick={loadTransfers}
                        className="bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="animate-spin text-[#ff4d00]" size={32} />
                </div>
            ) : transfers.length === 0 ? (
                <div className="bg-white border border-gray-200 p-12 text-center">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No bank transfer proofs found.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#f9fafb] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tier</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transfers.map(transfer => (
                                <tr key={transfer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{formatDate(transfer.created_at)}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-900">{transfer.user_email}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{transfer.reference}</td>
                                    <td className="px-6 py-4 text-sm font-black text-gray-900">€{transfer.amount.toFixed(2)} <span className="text-xs text-gray-400">({transfer.currency})</span></td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-600 capitalize">{transfer.tier || 'General'}</td>
                                    <td className="px-6 py-4">{getStatusBadge(transfer.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedTransfer(transfer)}
                                            className="bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2 ml-auto"
                                        >
                                            <Eye size={12} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedTransfer && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTransfer(null)}>
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Transfer Details</div>
                                <h3 className="text-xl font-black text-gray-900">{selectedTransfer.reference}</h3>
                            </div>
                            {getStatusBadge(selectedTransfer.status)}
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">User Email</label>
                                    <p className="text-sm font-bold text-gray-900">{selectedTransfer.user_email}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">Amount</label>
                                    <p className="text-2xl font-black text-gray-900">€{selectedTransfer.amount.toFixed(2)} <span className="text-sm text-gray-400">({selectedTransfer.currency})</span></p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">Tier</label>
                                    <p className="text-sm font-bold text-gray-900 capitalize">{selectedTransfer.tier || 'General'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">Submitted</label>
                                    <p className="text-sm font-bold text-gray-900">{formatDate(selectedTransfer.created_at)}</p>
                                </div>
                                {selectedTransfer.notes && (
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">User Notes</label>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 border border-gray-200">{selectedTransfer.notes}</p>
                                    </div>
                                )}
                                {selectedTransfer.admin_notes && (
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">Admin Notes</label>
                                        <p className="text-sm text-gray-700 bg-yellow-50 p-3 border border-yellow-200">{selectedTransfer.admin_notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-1">Proof Document</label>
                                    <div className="bg-gray-50 border border-gray-200 p-4">
                                        {selectedTransfer.file_url.endsWith('.pdf') ? (
                                            <div className="flex items-center gap-3">
                                                <FileText size={32} className="text-red-500" />
                                                <div>
                                                    <p className="text-sm font-bold">{selectedTransfer.file_name}</p>
                                                    <a href={`http://127.0.0.1:8001${selectedTransfer.file_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ff4d00] hover:underline flex items-center gap-1">
                                                        Open PDF <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={`http://127.0.0.1:8001${selectedTransfer.file_url}`} alt="Proof" className="w-full h-auto max-h-64 object-contain" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedTransfer.status === 'pending' && (
                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                                <div className="mb-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block mb-2">Admin Notes (Optional)</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full border border-gray-200 p-3 text-sm"
                                        rows={3}
                                        placeholder="Add notes about this transfer..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(true)}
                                        disabled={processing}
                                        className="flex-1 bg-green-500 text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processing ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                        Approve & Credit
                                    </button>
                                    <button
                                        onClick={() => handleApprove(false)}
                                        disabled={processing}
                                        className="flex-1 bg-red-500 text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processing ? <RefreshCw className="animate-spin" size={14} /> : <XCircle size={14} />}
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedTransfer.status !== 'pending' && (
                            <div className="p-6 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={() => setSelectedTransfer(null)}
                                    className="bg-gray-100 hover:bg-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-wider"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBankTransfers;