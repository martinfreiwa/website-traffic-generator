import React, { useState, useEffect } from 'react';
import { Ticket } from '../../types';
import { db } from '../../services/db';
import { User, MessageSquare, Send, Search, Filter, Trash2, AlertCircle, CheckCircle, Paperclip, MoreVertical, X } from 'lucide-react';

interface AdminTicketsProps {
    tickets: Ticket[];
    onRefresh: () => void;
}

const AdminTickets: React.FC<AdminTicketsProps> = ({ tickets, onRefresh }) => {
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'ticket' | 'chat'>('all');
    const [attachments, setAttachments] = useState<string[]>([]);
    
    // Derived Data
    const selectedTicket = tickets.find(t => t.id === selectedTicketId);
    
    // Sort tickets: chats with recent activity first, then tickets
    const sortedTickets = [...tickets].sort((a,b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
    }).filter(t => activeFilter === 'all' ? true : t.type === activeFilter);

    useEffect(() => {
        // Mark as read when opening
        if(selectedTicketId) {
            db.markTicketRead(selectedTicketId);
            onRefresh();
        }
    }, [selectedTicketId]);

    const handleSendMessage = () => {
        if((!replyText.trim() && attachments.length === 0) || !selectedTicketId) return;
        
        db.replyToTicket(selectedTicketId, replyText, 'admin', attachments);
        setReplyText('');
        setAttachments([]);
        onRefresh();
    };

    const handleStatusChange = (status: Ticket['status']) => {
        if(!selectedTicketId) return;
        db.updateTicketStatus(selectedTicketId, status);
        onRefresh();
    };

    const handlePriorityChange = (priority: Ticket['priority']) => {
        if(!selectedTicketId) return;
        db.updateTicketPriority(selectedTicketId, priority);
        onRefresh();
    };

    const handleDelete = () => {
        if(!selectedTicketId) return;
        if(confirm('Are you sure you want to permanently delete this ticket?')) {
            db.deleteTicket(selectedTicketId);
            setSelectedTicketId(null);
            onRefresh();
        }
    }

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const fileName = e.target.files[0].name;
            setAttachments([...attachments, fileName]);
        }
    }

    return (
        <div className="animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tight">Unified Inbox</h2>
                <div className="flex bg-white border border-gray-200 rounded-sm overflow-hidden">
                    <button 
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 text-xs font-bold uppercase ${activeFilter === 'all' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setActiveFilter('ticket')}
                        className={`px-4 py-2 text-xs font-bold uppercase ${activeFilter === 'ticket' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Tickets
                    </button>
                    <button 
                        onClick={() => setActiveFilter('chat')}
                        className={`px-4 py-2 text-xs font-bold uppercase ${activeFilter === 'chat' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Live Chats
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 shadow-sm flex overflow-hidden">
                {/* Left Sidebar: List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <input 
                                placeholder="Search..." 
                                className="w-full bg-[#f9fafb] border border-gray-200 pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-[#ff4d00]" 
                            />
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {sortedTickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs">No conversations found.</div>
                        ) : (
                            sortedTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                                        selectedTicketId === ticket.id ? 'bg-orange-50 border-l-4 border-l-[#ff4d00]' : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${ticket.type === 'chat' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {ticket.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">{ticket.date}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 truncate">{ticket.subject}</h4>
                                    <p className="text-xs text-gray-500 truncate mb-2">{ticket.lastMessage}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                            <User size={10} /> {ticket.userName}
                                        </div>
                                        {ticket.status === 'open' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Conversation */}
                {selectedTicket ? (
                    <div className="flex-1 flex flex-col h-full bg-[#fafafa]">
                        {/* Header */}
                        <div className="bg-white p-6 border-b border-gray-200 flex justify-between items-start shadow-sm z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><User size={14} /> {selectedTicket.userName}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-mono text-gray-400">ID: {selectedTicket.id}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={selectedTicket.priority} 
                                    onChange={(e) => handlePriorityChange(e.target.value as any)}
                                    className={`text-[10px] font-bold uppercase border-none outline-none cursor-pointer ${
                                        selectedTicket.priority === 'high' ? 'text-red-500' : 'text-gray-500'
                                    }`}
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                                <div className="h-4 w-px bg-gray-200"></div>
                                <select 
                                    value={selectedTicket.status}
                                    onChange={(e) => handleStatusChange(e.target.value as any)}
                                    className="bg-gray-100 text-gray-700 text-xs font-bold uppercase px-3 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-gray-200"
                                >
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedTicket.messages?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] ${msg.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`p-4 shadow-sm text-sm leading-relaxed ${
                                            msg.sender === 'admin' 
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
                                            {msg.sender === 'admin' ? 'You' : selectedTicket.userName} • {msg.date}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            {attachments.length > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {attachments.map((f, i) => (
                                        <div key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                                            {f} <button onClick={() => setAttachments(attachments.filter(x => x !== f))}><X size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2 items-end">
                                <label className="p-3 text-gray-400 hover:text-black cursor-pointer transition-colors">
                                    <Paperclip size={20} />
                                    <input type="file" className="hidden" onChange={handleFileAttach} />
                                </label>
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] resize-none h-12 min-h-[48px] max-h-32 transition-colors"
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!replyText && attachments.length === 0}
                                    className="p-3 bg-[#ff4d00] text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <MessageSquare size={64} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">Select a conversation to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTickets;