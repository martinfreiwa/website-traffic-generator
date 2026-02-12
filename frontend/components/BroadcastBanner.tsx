
import React, { useState, useEffect } from 'react';
import { Broadcast } from '../types';
import { db } from '../services/db';
import { Info, AlertTriangle, XCircle, CheckCircle, X } from 'lucide-react';

const BroadcastBanner: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

    useEffect(() => {
        const fetchBroadcasts = async () => {
            const data = await db.getActiveBroadcasts();
            // Filter out dismissed broadcasts from local storage
            const dismissed = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
            setBroadcasts(data.filter(b => !dismissed.includes(b.id)));
        };
        fetchBroadcasts();

        // Poll every minute
        const interval = setInterval(fetchBroadcasts, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = (id: string) => {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
        if (!dismissed.includes(id)) {
            dismissed.push(id);
            localStorage.setItem('dismissed_broadcasts', JSON.stringify(dismissed));
        }
        setBroadcasts(broadcasts.filter(b => b.id !== id));
    };

    if (broadcasts.length === 0) return null;

    return (
        <div className="flex flex-col w-full z-50 sticky top-0">
            {broadcasts.map(b => (
                <div key={b.id} className={`w-full px-4 py-3 flex items-center justify-between shadow-sm relative animate-in slide-in-from-top duration-300 ${b.type === 'critical' ? 'bg-red-600 text-white' :
                    b.type === 'warning' ? 'bg-orange-500 text-white' :
                        b.type === 'success' ? 'bg-green-600 text-white' :
                            'bg-blue-600 text-white'
                    }`}>
                    <div className="flex items-center gap-3 container max-w-screen-2xl mx-auto px-6 md:px-12">
                        {b.type === 'critical' && <XCircle size={20} />}
                        {b.type === 'warning' && <AlertTriangle size={20} />}
                        {b.type === 'success' && <CheckCircle size={20} />}
                        {b.type === 'info' && <Info size={20} />}

                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1">
                            <span className="font-black uppercase tracking-wider text-xs">{b.title}</span>
                            <span className="hidden md:inline w-1 h-1 bg-white rounded-full opacity-50"></span>
                            <span className="font-medium text-sm">{b.message}</span>

                            {b.actionUrl && (
                                <a
                                    href={b.actionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-gray-100 transition-colors ml-0 md:ml-4 self-start md:self-auto"
                                >
                                    {b.actionText || 'Read More'}
                                </a>
                            )}
                        </div>

                        <button onClick={() => handleDismiss(b.id)} className="text-white/80 hover:text-white transition-colors p-1">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BroadcastBanner;
