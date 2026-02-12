
import React, { useState, useEffect } from 'react';
import { Broadcast } from '../../types';
import { db } from '../../services/db';
import { Megaphone, ToggleRight, ToggleLeft, Trash2, Clock, CheckCircle, AlertTriangle, Info, XCircle, Copy, ExternalLink } from 'lucide-react';

interface AdminBroadcastsProps {
    alerts?: any; // Legacy prop, we fetch our own data now
    onRefresh?: () => void;
}

const AdminBroadcasts: React.FC<AdminBroadcastsProps> = ({ onRefresh }) => {
    // Data State
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'critical' | 'success'>('info');
    const [actionUrl, setActionUrl] = useState('');
    const [actionText, setActionText] = useState('');

    // Countdown / Expiry State
    const [hasExpiry, setHasExpiry] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [expiryTime, setExpiryTime] = useState('');

    // Field Limits
    const TITLE_LIMIT = 60;
    const MSG_LIMIT = 250;

    const fetchData = async () => {
        setLoading(true);
        const data = await db.getAdminBroadcasts();
        setBroadcasts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateBroadcast = async () => {
        if (!title.trim() || !message.trim()) return;

        let expiresAt: string | undefined = undefined;
        if (hasExpiry && expiryDate && expiryTime) {
            expiresAt = new Date(`${expiryDate}T${expiryTime}`).toISOString();
        }

        await db.createBroadcast({
            title: title.substring(0, TITLE_LIMIT),
            message: message.substring(0, MSG_LIMIT),
            type,
            isActive: true,
            expiresAt,
            actionUrl: actionUrl.trim() || undefined,
            actionText: actionText.trim() || undefined
        });

        // Reset Form
        setTitle('');
        setMessage('');
        setType('info');
        setActionUrl('');
        setActionText('');
        setHasExpiry(false);
        setExpiryDate('');
        setExpiryTime('');

        fetchData();
        if (onRefresh) onRefresh();
    };

    const handleToggleActive = async (item: Broadcast) => {
        await db.updateBroadcast(item.id, { ...item, isActive: !item.isActive });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this broadcast?')) {
            await db.deleteBroadcast(id);
            fetchData();
        }
    }

    const handleDuplicate = (item: Broadcast) => {
        setTitle(item.title);
        setMessage(item.message);
        setType(item.type);
        setActionUrl(item.actionUrl || '');
        setActionText(item.actionText || '');
        if (item.expiresAt) {
            const date = new Date(item.expiresAt);
            setHasExpiry(true);
            setExpiryDate(date.toISOString().split('T')[0]);
            setExpiryTime(date.toTimeString().split(' ')[0].substring(0, 5));
        } else {
            setHasExpiry(false);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const getTypeColor = (t: string) => {
        switch (t) {
            case 'success': return 'bg-green-500 border-green-500';
            case 'warning': return 'bg-orange-500 border-orange-500';
            case 'critical': return 'bg-red-500 border-red-500';
            default: return 'bg-blue-500 border-blue-500';
        }
    }

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'success': return <CheckCircle size={14} className="text-white" />;
            case 'warning': return <AlertTriangle size={14} className="text-white" />;
            case 'critical': return <XCircle size={14} className="text-white" />;
            default: return <Info size={14} className="text-white" />;
        }
    }

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
                            {/* Title */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label>Title / Headline</Label>
                                    <span className={`text-[9px] font-bold ${title.length > TITLE_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                                        {title.length}/{TITLE_LIMIT}
                                    </span>
                                </div>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] font-bold"
                                    placeholder="e.g. Scheduled Maintenance"
                                    maxLength={TITLE_LIMIT + 10}
                                />
                            </div>

                            {/* Message & Type */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <Label>Message Body</Label>
                                        <span className={`text-[9px] font-bold ${message.length > MSG_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                                            {message.length}/{MSG_LIMIT}
                                        </span>
                                    </div>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] font-medium h-24 resize-none"
                                        placeholder="Detailed explanation..."
                                        maxLength={MSG_LIMIT + 20}
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <Label>Type</Label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="success">Success (Green)</option>
                                        <option value="warning">Warning (Orange)</option>
                                        <option value="critical">Critical (Red)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Action Button Config */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                                <div>
                                    <Label>Action URL (Optional)</Label>
                                    <input
                                        value={actionUrl}
                                        onChange={(e) => setActionUrl(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                        placeholder="https://example.com/blog"
                                    />
                                </div>
                                <div>
                                    <Label>Action Button Text</Label>
                                    <input
                                        value={actionText}
                                        onChange={(e) => setActionText(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                        placeholder="Read More"
                                    />
                                </div>
                            </div>

                            {/* Expiry Configuration */}
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Label>Auto-Expire (Hidden after)</Label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setHasExpiry(!hasExpiry)}
                                            className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 ${hasExpiry ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${hasExpiry ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </button>
                                        <span className="text-xs font-bold text-gray-500 uppercase">{hasExpiry ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </div>

                                {hasExpiry && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Expiry Date</label>
                                            <input
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Expiry Time</label>
                                            <input
                                                type="time"
                                                value={expiryTime}
                                                onChange={(e) => setExpiryTime(e.target.value)}
                                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleCreateBroadcast}
                                disabled={title.length > TITLE_LIMIT || message.length > MSG_LIMIT}
                                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-black"
                            >
                                <Megaphone size={14} /> Publish Broadcast
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: ACTIVE BROADCASTS LIST --- */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Archived & Active</h3>
                        <button onClick={fetchData} className="text-[10px] font-bold text-[#ff4d00] underline uppercase">Refresh</button>
                    </div>

                    <div className="space-y-4">
                        {loading && <div className="text-center p-4 text-gray-400 text-xs">Loading...</div>}

                        {!loading && broadcasts.length === 0 && (
                            <div className="p-8 text-center text-gray-400 border border-gray-200 border-dashed bg-gray-50">No broadcasts found.</div>
                        )}

                        {broadcasts.map(item => (
                            <div key={item.id} className={`p-6 border-l-4 shadow-sm bg-white relative group ${!item.isActive ? 'opacity-60 grayscale' : getTypeColor(item.type).split(' ')[1]
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm text-white ${getTypeColor(item.type).split(' ')[0]}`}>
                                            {getTypeIcon(item.type)} {item.type}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDuplicate(item)}
                                            className="text-gray-300 hover:text-black transition-colors"
                                            title="Duplicate Broadcast"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h4 className="font-black text-sm uppercase mb-1">{item.title}</h4>
                                <p className="text-xs font-medium text-gray-600 mb-3">{item.message}</p>

                                {item.actionUrl && (
                                    <div className="mb-3 flex items-center gap-1 text-[10px] font-bold text-[#ff4d00] uppercase tracking-wider">
                                        <ExternalLink size={10} /> {item.actionText || 'Action'}: <span className="text-gray-400 font-medium normal-case">{item.actionUrl}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 pt-3 border-t border-gray-50 text-[10px] text-gray-500 font-bold uppercase transition-colors">
                                    {item.expiresAt && (
                                        <div className="flex items-center gap-1 text-[#ff4d00]">
                                            <Clock size={12} /> Expires: {new Date(item.expiresAt).toLocaleString()}
                                        </div>
                                    )}
                                    {!item.expiresAt && (
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Clock size={12} /> No Expiration
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <button
                                        onClick={() => handleToggleActive(item)}
                                        className={`text-xs font-bold uppercase flex items-center gap-2 ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                        {item.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        {item.isActive ? 'Live' : 'Hidden'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">{children}</label>
)

export default AdminBroadcasts;