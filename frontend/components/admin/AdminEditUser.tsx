import React, { useState, useEffect } from 'react';
import { User, Transaction, Ticket } from '../../types';
import { db } from '../../services/db';
import { ArrowLeft, Save, Plus, Minus, DollarSign, Layers } from 'lucide-react';
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
                                    onChange={(e) => setUser({...user, name: e.target.value})}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address</label>
                                <input 
                                    value={user.email}
                                    onChange={(e) => setUser({...user, email: e.target.value})}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Role</label>
                                <CustomSelect 
                                    value={user.role}
                                    onChange={(val) => setUser({...user, role: val as 'user' | 'admin'})}
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
                                    onChange={(val) => setUser({...user, status: val as 'active' | 'suspended'})}
                                    options={[
                                        { value: "active", label: "Active" },
                                        { value: "suspended", label: "Suspended" }
                                    ]}
                                />
                            </div>
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
                </div>
            </div>
        </div>
    );
}

export default AdminEditUser;