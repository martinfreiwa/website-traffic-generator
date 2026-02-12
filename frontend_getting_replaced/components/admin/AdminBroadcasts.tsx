

import React, { useState, useEffect } from 'react';
import { SystemAlert, User } from '../../types';
import { db } from '../../services/db';
import { Megaphone, ToggleRight, ToggleLeft, Trash2, Calendar, Target, User as UserIcon, X, Clock } from 'lucide-react';

interface AdminBroadcastsProps {
    alerts: SystemAlert[];
    onRefresh: () => void;
}

const AdminBroadcasts: React.FC<AdminBroadcastsProps> = ({ alerts, onRefresh }) => {
    // Form State
    const [newAlertMsg, setNewAlertMsg] = useState('');
    const [newAlertType, setNewAlertType] = useState<'info' | 'warning' | 'error' | 'promo'>('info');
    const [targetType, setTargetType] = useState<'all' | 'paying' | 'active_7d' | 'specific'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    
    // Countdown State
    const [hasCountdown, setHasCountdown] = useState(false);
    const [countdownDate, setCountdownDate] = useState('');
    const [countdownTime, setCountdownTime] = useState('');

    // Data Selection State
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        setUsers(db.getUsers());
    }, []);

    const handleCreateAlert = () => {
        if(!newAlertMsg.trim()) return;
        
        let countdownEnds: string | undefined = undefined;
        if (hasCountdown && countdownDate && countdownTime) {
            countdownEnds = new Date(`${countdownDate}T${countdownTime}`).toISOString();
        }

        db.createAlert(newAlertMsg, newAlertType, targetType, selectedUserIds, countdownEnds);
        
        // Reset Form
        setNewAlertMsg('');
        setNewAlertType('info');
        setTargetType('all');
        setSelectedUserIds([]);
        setHasCountdown(false);
        setCountdownDate('');
        setCountdownTime('');
        onRefresh();
    };

    const handleToggleAlert = (id: string, active: boolean) => {
        db.toggleAlert(id, active);
        onRefresh();
    };

    const handleDeleteAlert = (id: string) => {
        db.deleteAlert(id);
        onRefresh();
    }

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const toggleUserSelection = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    return (
        <div className="animate-in fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">System Broadcasts</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- LEFT: CONFIGURATION FORM --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 p-8 shadow-sm mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <Megaphone size={14} /> Create New Broadcast
                        </h3>
                        
                        <div className="space-y-6">
                            {/* Message & Type */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <Label>Message</Label>
                                    <input 
                                        value={newAlertMsg}
                                        onChange={(e) => setNewAlertMsg(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] font-medium"
                                        placeholder="e.g. Flash Sale! 50% Bonus on all deposits."
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <Label>Alert Type</Label>
                                    <select 
                                        value={newAlertType}
                                        onChange={(e) => setNewAlertType(e.target.value as any)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="warning">Warning (Orange)</option>
                                        <option value="error">Critical (Red)</option>
                                        <option value="promo">Promo (Gold)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Targeting */}
                            <div>
                                <Label>Target Audience</Label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[
                                        { id: 'all', label: 'All Users' },
                                        { id: 'paying', label: 'Paying Users' },
                                        { id: 'active_7d', label: 'Active > 7 Days' },
                                        { id: 'specific', label: 'Specific Users' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setTargetType(type.id as any)}
                                            className={`px-4 py-2 text-xs font-bold uppercase border transition-colors ${
                                                targetType === type.id 
                                                    ? 'bg-black text-white border-black' 
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Specific User Selector */}
                                {targetType === 'specific' && (
                                    <div className="bg-gray-50 p-4 border border-gray-200 mb-4 animate-in fade-in slide-in-from-top-2">
                                        <input 
                                            placeholder="Search users to select..." 
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="w-full bg-white border border-gray-200 p-2 text-xs mb-3 outline-none focus:border-[#ff4d00]"
                                        />
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {filteredUsers.map(u => (
                                                <div 
                                                    key={u.id} 
                                                    onClick={() => toggleUserSelection(u.id)}
                                                    className={`flex items-center justify-between p-2 cursor-pointer text-xs ${selectedUserIds.includes(u.id) ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <span className="font-bold">{u.name} ({u.email})</span>
                                                    {selectedUserIds.includes(u.id) && <X size={12}/>}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase">{selectedUserIds.length} Users Selected</div>
                                    </div>
                                )}
                            </div>

                            {/* Countdown Configuration */}
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Label>Countdown Timer</Label>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setHasCountdown(!hasCountdown)}
                                            className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 ${hasCountdown ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${hasCountdown ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </button>
                                        <span className="text-xs font-bold text-gray-500 uppercase">{hasCountdown ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </div>

                                {hasCountdown && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">End Date</label>
                                            <input 
                                                type="date" 
                                                value={countdownDate}
                                                onChange={(e) => setCountdownDate(e.target.value)}
                                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">End Time</label>
                                            <input 
                                                type="time" 
                                                value={countdownTime}
                                                onChange={(e) => setCountdownTime(e.target.value)}
                                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleCreateAlert}
                                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors flex items-center justify-center gap-2"
                            >
                                <Megaphone size={14} /> Publish Broadcast
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: ACTIVE BROADCASTS LIST --- */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Active Broadcasts</h3>
                    <div className="space-y-4">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 border border-gray-200 border-dashed bg-gray-50">No broadcasts active.</div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className={`p-6 border-l-4 shadow-sm bg-white relative ${
                                    !alert.active ? 'opacity-50 border-gray-300' :
                                    alert.type === 'error' ? 'border-red-500' : 
                                    alert.type === 'warning' ? 'border-orange-500' : 
                                    alert.type === 'promo' ? 'border-yellow-500' : 'border-blue-500'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm text-white ${
                                                alert.type === 'error' ? 'bg-red-500' : 
                                                alert.type === 'warning' ? 'bg-orange-500' : 
                                                alert.type === 'promo' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}>
                                                {alert.type}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{alert.date}</span>
                                        </div>
                                        <button onClick={() => handleDeleteAlert(alert.id)} className="text-gray-300 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    
                                    <p className="text-sm font-bold text-gray-900 mb-3">{alert.message}</p>
                                    
                                    <div className="flex flex-col gap-2 pt-3 border-t border-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                                        <div className="flex items-center gap-1">
                                            <Target size={12}/> Target: {alert.targetType.replace('_', ' ')}
                                            {alert.targetType === 'specific' && ` (${alert.targetUserIds?.length})`}
                                        </div>
                                        {alert.countdownEnds && (
                                            <div className="flex items-center gap-1 text-[#ff4d00]">
                                                <Clock size={12}/> Countdown: {new Date(alert.countdownEnds).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <button 
                                            onClick={() => handleToggleAlert(alert.id, !alert.active)}
                                            className={`text-xs font-bold uppercase flex items-center gap-2 ${alert.active ? 'text-green-600' : 'text-gray-400'}`}
                                        >
                                            {alert.active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                                            {alert.active ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">{children}</label>
)

export default AdminBroadcasts;