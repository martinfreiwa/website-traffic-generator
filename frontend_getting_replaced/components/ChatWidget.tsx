import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { db } from '../services/db';
import { User } from '../types';

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | undefined>(undefined);

    useEffect(() => {
        try {
            const currentUser = db.getCurrentUser();
            setUser(currentUser);
        } catch (e) {
            console.error("Failed to load user in ChatWidget");
        }
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 h-[450px] bg-white shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="bg-black text-white p-4 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest">Live Support</span>
                        <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <MessageSquare size={48} className="text-gray-200" />
                        <p className="text-sm text-gray-500">Our support team is currently offline. Please open a ticket from your dashboard.</p>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="bg-[#ff4d00] text-white px-6 py-2 text-xs font-bold uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#ff4d00] text-white p-4 shadow-xl rounded-full hover:scale-110 transition-transform"
            >
                <MessageSquare size={24} />
            </button>
        </div>
    );
};

export default ChatWidget;
