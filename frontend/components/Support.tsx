import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { db } from '../services/db';
import { MessageSquare, Plus, Send, X, User, Paperclip, ChevronRight, Search, Clock, CheckCircle2 } from 'lucide-react';

const Support: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

    // Create Modal
    const [isCreating, setIsCreating] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [newPriority, setNewPriority] = useState<Ticket['priority']>('medium');
    const [newAttachments, setNewAttachments] = useState<string[]>([]);

    // Reply
    const [replyText, setReplyText] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<string[]>([]);

    const currentUser = db.getCurrentUser();
    const activeTicket = tickets.find(t => t.id === activeTicketId);

    useEffect(() => {
        refreshTickets();
    }, []);

    const refreshTickets = async () => {
        if (!currentUser) return;
        try {
            const all = await db.getTickets();
            setTickets(all.filter(t => t.userId === currentUser.id));
        } catch (e) {
            console.error("Failed to refresh tickets");
        }
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject || !newMessage || !currentUser) return;

        const newTicket: Partial<Ticket> = {
            subject: newSubject,
            priority: newPriority,
            messages: [{
                id: Date.now().toString(),
                sender: 'user',
                text: newMessage,
                date: new Date().toLocaleString(),
                attachments: newAttachments
            }]
        };

        await db.createTicket(newTicket);
        setIsCreating(false);
        setNewSubject('');
        setNewMessage('');
        setNewAttachments([]);
        await refreshTickets();
    };

    const handleReply = async () => {
        if (!activeTicketId || (!replyText && replyAttachments.length === 0)) return;
        await db.replyToTicket(activeTicketId, replyText, 'user', replyAttachments);
        setReplyText('');
        setReplyAttachments([]);
        await refreshTickets();
    };

    const handleAttach = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
        if (e.target.files && e.target.files[0]) {
            const name = e.target.files[0].name;
            if (isReply) setReplyAttachments([...replyAttachments, name]);
            else setNewAttachments([...newAttachments, name]);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 flex-shrink-0">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Helpdesk</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Support Tickets</h2>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                >
                    <Plus size={14} /> New Ticket
                </button>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-sm font-bold uppercase tracking-wide">Create New Request</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Subject</label>
                                <input
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                    placeholder="Brief description"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Priority</label>
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as any)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                >
                                    <option value="low">Low - General Question</option>
                                    <option value="medium">Medium - Technical Issue</option>
                                    <option value="high">High - Billing / Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Message</label>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none h-32 resize-none"
                                    placeholder="Describe your issue..."
                                    required
                                />
                            </div>
                            {newAttachments.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {newAttachments.map((f, i) => (
                                        <div key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-sm text-gray-600 flex items-center gap-1">
                                            <Paperclip size={10} /> {f}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#ff4d00] cursor-pointer uppercase tracking-wide">
                                    <Paperclip size={16} /> Attach File
                                    <input type="file" className="hidden" onChange={(e) => handleAttach(e, false)} />
                                </label>
                                <button type="submit" className="bg-[#ff4d00] text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2">
                                    <Send size={14} /> Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 bg-white border border-gray-200 shadow-sm flex overflow-hidden">
                {/* List View */}
                <div className={`${activeTicket ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200 flex-col`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input placeholder="Search tickets..." className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-[#ff4d00]" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {tickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No tickets found.</div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setActiveTicketId(ticket.id)}
                                    className={`p-5 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 group ${activeTicketId === ticket.id ? 'bg-orange-50' : ''}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                                            ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">{ticket.date}</span>
                                    </div>
                                    <h4 className={`text-sm font-bold mb-1 truncate ${activeTicketId === ticket.id ? 'text-[#ff4d00]' : 'text-gray-900'}`}>{ticket.subject}</h4>
                                    <p className="text-xs text-gray-500 truncate">{ticket.lastMessage}</p>
                                    {ticket.type === 'chat' && <div className="mt-2 text-[9px] font-bold text-blue-500 uppercase tracking-wide flex items-center gap-1"><MessageSquare size={10} /> Live Chat Log</div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View */}
                {activeTicket ? (
                    <div className="flex-1 flex flex-col h-full bg-[#fafafa]">
                        <div className="bg-white p-6 border-b border-gray-200 shadow-sm flex justify-between items-center z-10">
                            <div>
                                <button onClick={() => setActiveTicketId(null)} className="md:hidden text-gray-500 mb-2 flex items-center gap-1 text-xs font-bold uppercase"><ChevronRight className="rotate-180" size={12} /> Back</button>
                                <h2 className="text-lg font-bold text-gray-900">{activeTicket.subject}</h2>
                                <div className="text-xs text-gray-400 font-mono mt-1">ID: {activeTicket.id}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                {activeTicket.status === 'open' && <div className="flex items-center gap-1 text-xs font-bold text-green-600 uppercase"><Clock size={14} /> Open</div>}
                                {activeTicket.status === 'closed' && <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><CheckCircle2 size={14} /> Closed</div>}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeTicket.messages?.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`p-4 shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                            ? 'bg-black text-white rounded-l-lg rounded-tr-lg'
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-r-lg rounded-tl-lg'
                                            }`}>
                                            {msg.text}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                                                    {msg.attachments.map((file, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs opacity-80 bg-white/10 p-2 rounded-sm">
                                                            <Paperclip size={12} /> {file}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wide">
                                            {msg.sender === 'user' ? 'You' : 'Support Team'} • {msg.date}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {activeTicket.status !== 'closed' && (
                            <div className="p-4 bg-white border-t border-gray-200">
                                {replyAttachments.length > 0 && (
                                    <div className="flex gap-2 mb-2 flex-wrap">
                                        {replyAttachments.map((f, i) => (
                                            <div key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                                                {f} <button onClick={() => setReplyAttachments(replyAttachments.filter(x => x !== f))}><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 items-end">
                                    <label className="p-3 text-gray-400 hover:text-black cursor-pointer transition-colors">
                                        <Paperclip size={20} />
                                        <input type="file" className="hidden" onChange={(e) => handleAttach(e, true)} />
                                    </label>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] resize-none h-12 min-h-[48px] max-h-32 transition-colors"
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText && replyAttachments.length === 0}
                                        className="p-3 bg-[#ff4d00] text-white hover:bg-black transition-colors disabled:opacity-50"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-300 bg-gray-50/50">
                        <MessageSquare size={64} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;