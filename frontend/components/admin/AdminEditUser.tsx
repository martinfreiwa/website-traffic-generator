import React, { useState, useEffect } from 'react';
import { User, Transaction, Ticket } from '../../types';
import { db } from '../../services/db';
import { ArrowLeft, Save, Plus, Minus, DollarSign, Layers, LogIn, Lock, CheckCircle, AlertTriangle, FileText, Tag } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface AdminEditUserProps {
    userId: string;
    onBack: () => void;
    onUpdate: () => void;
}

const AdminEditUser: React.FC<AdminEditUserProps> = ({ userId, onBack, onUpdate }) => {
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [fundAmount, setFundAmount] = useState('');
    const [fundReason, setFundReason] = useState('');

    useEffect(() => {
        const users = db.getUsers();
        const foundUser = users.find(u => u.id === userId);
        setUser(foundUser || null);

        const allTrx = db.getTransactions();
        setTransactions(allTrx.filter(t => t.userId === userId));

        const allTickets = db.getTickets();
        setTickets(allTickets.filter(t => t.userId === userId));
    }, [userId]);

    const handleSaveUser = () => {
        if (!user) return;
        db.updateUser(user);
        onUpdate();
        alert('User updated successfully.');
    };

    const handleFundAdjustment = (type: 'credit' | 'debit') => {
        if (!user || !fundAmount) return;
        const amount = parseFloat(fundAmount);
        if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

        db.adminAdjustBalance(user.id, amount, type, fundReason || 'Manual Adjustment');

        // Refresh local user state
        const updatedUsers = db.getUsers();
        const updatedUser = updatedUsers.find(u => u.id === user.id);
        setUser(updatedUser || null);

        setFundAmount('');
        setFundReason('');
        onUpdate();
        alert(`Successfully ${type === 'credit' ? 'added' : 'removed'} funds.`);
    };

    if (!user) return <div>User not found.</div>;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black text-xs font-bold uppercase tracking-wide">
                    <ArrowLeft size={14} /> Back to List
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (confirm(`Are you sure you want to login as ${user.name}? You will be signed out of your admin account.`)) {
                                db.setCurrentUser(user);
                                window.location.href = '/dashboard';
                            }
                        }}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <LogIn size={14} /> Login As User
                    </button>
                    <button
                        onClick={handleSaveUser}
                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6">User Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Name</label>
                                <input
                                    value={user.name}
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address</label>
                                <input
                                    value={user.email}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Role</label>
                                <CustomSelect
                                    value={user.role}
                                    onChange={(val) => setUser({ ...user, role: val as 'user' | 'admin' })}
                                    options={[
                                        { value: "user", label: "User" },
                                        { value: "admin", label: "Admin" }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Account Status</label>
                                <CustomSelect
                                    value={user.status}
                                    onChange={(val) => setUser({ ...user, status: val as 'active' | 'suspended' })}
                                    options={[
                                        { value: "active", label: "Active" },
                                        { value: "suspended", label: "Suspended" }
                                    ]}
                                />
                            </div>
                            <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Internal Tags (Comma Separated)</label>
                                <div className="relative">
                                    <input
                                        value={user.tags?.join(', ') || ''}
                                        onChange={(e) => setUser({ ...user, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-9 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                        placeholder="e.g. VIP, High Risk, Old Client"
                                    />
                                    <Tag className="absolute left-3 top-3.5 text-gray-400" size={14} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Account Plan</label>
                                <CustomSelect
                                    value={user.plan || 'free'}
                                    onChange={(val) => setUser({ ...user, plan: val as 'free' | 'pro' | 'agency' })}
                                    options={[
                                        { value: "free", label: "Free Tier" },
                                        { value: "pro", label: "Pro ($29/mo)" },
                                        { value: "agency", label: "Agency ($99/mo)" }
                                    ]}
                                />
                            </div>
                            {user.status === 'suspended' && (
                                <div className="md:col-span-2 bg-red-50 p-3 border border-red-100 rounded">
                                    <label className="text-[10px] font-bold text-red-400 uppercase tracking-wide block mb-2">Reason for Suspension</label>
                                    <input
                                        value={user.banReason || ''}
                                        onChange={(e) => setUser({ ...user, banReason: e.target.value })}
                                        className="w-full bg-white border border-red-200 p-2 text-sm text-red-900 outline-none focus:border-red-500"
                                        placeholder="e.g. Violation of ToS..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                            <DollarSign size={14} /> Fund Management
                        </h3>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono font-medium outline-none focus:border-[#ff4d00]"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex-[2] w-full">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Reason</label>
                                <input
                                    type="text"
                                    value={fundReason}
                                    onChange={(e) => setFundReason(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                    placeholder="e.g. Bonus, Refund, Adjustment"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleFundAdjustment('credit')}
                                    className="bg-green-600 text-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={14} /> Add
                                </button>
                                <button
                                    onClick={() => handleFundAdjustment('debit')}
                                    className="bg-red-600 text-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Minus size={14} /> Deduct
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Risk & Compliance */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 mb-6 flex items-center gap-2">
                            <AlertTriangle size={14} /> Risk Control
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">Shadow Ban</div>
                                    <div className="text-[10px] text-gray-500">User appears active but campaigns adhere to "Ghost Mode".</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={user.shadowBanned || false}
                                        onChange={e => setUser({ ...user, shadowBanned: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">Email Verified</div>
                                    <div className="text-[10px] text-gray-500">Manually override verification status.</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={user.isVerified || false}
                                        onChange={e => setUser({ ...user, isVerified: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">Last Known IP</div>
                                    <div className="text-[10px] text-gray-500">{user.lastIp || 'Unknown'}</div>
                                </div>
                                <div className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-mono rounded">
                                    {user.lastIp ? user.lastIp : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                            <FileText size={14} /> Admin Notes (Private)
                        </h3>
                        <textarea
                            value={user.notes || ''}
                            onChange={(e) => setUser({ ...user, notes: e.target.value })}
                            className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-sm outline-none focus:border-[#ff4d00] min-h-[120px]"
                            placeholder="Add private notes about this user (e.g. 'Refunded on 12/12', 'VIP client')..."
                        />
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-[#111] text-white p-8">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</div>
                        <div className="text-4xl font-black text-[#ff4d00]">€{user.balance.toFixed(2)}</div>
                    </div>

                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Transactions</span>
                                <span className="font-bold">{transactions.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tickets</span>
                                <span className="font-bold">{tickets.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Projects</span>
                                <span className="font-bold">{user.projectsCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History (Credit History) */}
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <DollarSign size={14} /> Credit History
                            </h3>
                            <button className="text-[10px] font-bold text-gray-400 hover:text-black uppercase">View All</button>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Desc</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-xs text-gray-400">No transactions found.</td></tr>
                                ) : (
                                    transactions.slice(0, 5).map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-xs text-gray-600 font-mono">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-xs text-gray-900 font-medium">{t.desc}</td>
                                            <td className={`px-6 py-3 text-xs font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                                {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminEditUser;