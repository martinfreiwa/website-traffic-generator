import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Project } from '../types';
import { db } from '../services/db';
import { MessageSquare, Plus, Send, X, User, Paperclip, ChevronRight, Search, Clock, CheckCircle2, ExternalLink, Upload, Trash2, Loader2 } from 'lucide-react';

const Support: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sendingReply, setSendingReply] = useState(false);
    const [creatingTicket, setCreatingTicket] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'closed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal
    const [isCreating, setIsCreating] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [newPriority, setNewPriority] = useState<Ticket['priority']>('medium');
    const [newCategory, setNewCategory] = useState<Ticket['category']>('general');
    const [newProjectId, setNewProjectId] = useState<string>('');
    const [newAttachments, setNewAttachments] = useState<{ url: string; filename: string }[]>([]);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Reply
    const [replyText, setReplyText] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<{ url: string; filename: string }[]>([]);
    const [replyingWithFile, setReplyingWithFile] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    const currentUser = db.getCurrentUser();
    const activeTicket = tickets.find(t => t.id === activeTicketId);

    useEffect(() => {
        refreshData();
    }, []);

    useEffect(() => {
        if (activeTicket) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [activeTicket?.messages?.length]);

    const refreshData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await db.syncProjects();
            await db.syncTickets();
            setProjects(db.getProjects());
            setTickets(db.getTickets());
        } catch (e) {
            console.error("Failed to refresh data", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return t.subject.toLowerCase().includes(q) || 
                t.lastMessage?.toLowerCase().includes(q) ||
                t.messages?.some(m => m.text.toLowerCase().includes(q));
        }
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const setter = isReply ? setReplyAttachments : setNewAttachments;
        const currentFiles = isReply ? replyAttachments : newAttachments;
        const setUploading = isReply ? setReplyingWithFile : setUploadingFile;

        setUploading(true);
        try {
            const result = await db.uploadTicketAttachment(file);
            setter([...currentFiles, result]);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload file. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject || !newMessage || !currentUser) return;

        setCreatingTicket(true);
        try {
            const newTicket: Partial<Ticket> = {
                subject: newSubject,
                priority: newPriority,
                category: newCategory,
                projectId: newProjectId || undefined,
                attachmentUrls: newAttachments.map(a => a.url),
                messages: [{
                    id: Date.now().toString(),
                    sender: 'user',
                    text: newMessage,
                    date: new Date().toLocaleString(),
                    attachments: newAttachments.map(a => a.url)
                }]
            };

            await db.createTicket(newTicket);
            setIsCreating(false);
            setNewSubject('');
            setNewMessage('');
            setNewPriority('medium');
            setNewCategory('general');
            setNewProjectId('');
            setNewAttachments([]);
            await refreshData();
        } catch (err) {
            console.error("Failed to create ticket", err);
            alert("Failed to create ticket. Please try again.");
        } finally {
            setCreatingTicket(false);
        }
    };

    const handleReply = async () => {
        if (!activeTicketId || (!replyText && replyAttachments.length === 0)) return;

        setSendingReply(true);
        try {
            await db.replyToTicket(activeTicketId, replyText, 'user', replyAttachments.map(a => a.url));
            setReplyText('');
            setReplyAttachments([]);
            await refreshData();
        } catch (err) {
            console.error("Failed to reply", err);
            alert("Failed to send reply. Please try again.");
        } finally {
            setSendingReply(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!activeTicketId) return;
        if (!confirm("Are you sure you want to close this ticket?")) return;

        try {
            await db.closeTicket(activeTicketId);
            await refreshData();
        } catch (err) {
            console.error("Failed to close ticket", err);
            alert("Failed to close ticket. Please try again.");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleReply();
        }
    };

    const getCategoryBadge = (category?: string) => {
        const colors: Record<string, string> = {
            billing: 'bg-yellow-100 text-yellow-700',
            technical: 'bg-blue-100 text-blue-700',
            sales: 'bg-green-100 text-green-700',
            general: 'bg-gray-100 text-gray-600'
        };
        return colors[category || 'general'] || colors.general;
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            open: 'bg-green-100 text-green-700',
            'in-progress': 'bg-blue-100 text-blue-700',
            closed: 'bg-gray-200 text-gray-500'
        };
        return colors[status] || colors.open;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 flex-shrink-0">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Helpdesk</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Support Tickets</h2>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/helpdesk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-gray-200 text-gray-600 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors flex items-center gap-2 bg-white"
                    >
                        <ExternalLink size={14} /> FAQ / Help
                    </a>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                    >
                        <Plus size={14} /> New Ticket
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h3 className="text-sm font-bold uppercase tracking-wide">Create New Ticket</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Subject *</label>
                                <input
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                    placeholder="Brief description of your issue"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Category</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                    >
                                        <option value="general">General</option>
                                        <option value="billing">Billing</option>
                                        <option value="technical">Technical</option>
                                        <option value="sales">Sales</option>
                                    </select>
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
                                        <option value="high">High - Urgent / Billing</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Related Project (Optional)</label>
                                <select
                                    value={newProjectId}
                                    onChange={(e) => setNewProjectId(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                >
                                    <option value="">None</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Message *</label>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none h-32 resize-none"
                                    placeholder="Describe your issue in detail..."
                                    required
                                />
                            </div>
                            
                            {/* Attachments */}
                            {newAttachments.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Attachments</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {newAttachments.map((f, i) => (
                                            <div key={i} className="text-xs bg-gray-100 px-3 py-2 rounded-sm text-gray-600 flex items-center gap-2">
                                                <Paperclip size={10} /> {f.filename}
                                                <button type="button" onClick={() => setNewAttachments(newAttachments.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, false)} accept="image/*,.pdf,.doc,.docx,.txt" />

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingFile}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#ff4d00] uppercase tracking-wide disabled:opacity-50"
                                >
                                    {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                                    {uploadingFile ? 'Uploading...' : 'Attach File'}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={creatingTicket || uploadingFile}
                                    className="bg-[#ff4d00] text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {creatingTicket ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
                                    {creatingTicket ? 'Creating...' : 'Submit Ticket'}
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
                    {/* Filters */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                        {/* Status Tabs */}
                        <div className="flex bg-white border border-gray-200 rounded-sm overflow-hidden">
                            {(['all', 'open', 'in-progress', 'closed'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase ${statusFilter === s ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {s === 'all' ? 'All' : s}
                                </button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tickets..." 
                                className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-[#ff4d00]" 
                            />
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Loading...
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                {searchQuery || statusFilter !== 'all' ? 'No tickets match your filters.' : 'No tickets found. Create one to get started.'}
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setActiveTicketId(ticket.id)}
                                    className={`p-5 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 group ${activeTicketId === ticket.id ? 'bg-orange-50' : ''}`}
                                >
                                    <div className="flex justify-between mb-2">
                                        <div className="flex gap-2">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            {ticket.category && (
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${getCategoryBadge(ticket.category)}`}>
                                                    {ticket.category}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold">{ticket.date}</span>
                                    </div>
                                    <h4 className={`text-sm font-bold mb-1 truncate ${activeTicketId === ticket.id ? 'text-[#ff4d00]' : 'text-gray-900'}`}>{ticket.subject}</h4>
                                    <p className="text-xs text-gray-500 truncate">{ticket.lastMessage}</p>
                                    {ticket.projectName && (
                                        <div className="mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                            Project: {ticket.projectName}
                                        </div>
                                    )}
                                    {ticket.type === 'chat' && (
                                        <div className="mt-2 text-[9px] font-bold text-blue-500 uppercase tracking-wide flex items-center gap-1">
                                            <MessageSquare size={10} /> Live Chat Log
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View */}
                {activeTicket ? (
                    <div className="flex-1 flex flex-col h-full bg-[#fafafa]">
                        {/* Header */}
                        <div className="bg-white p-6 border-b border-gray-200 shadow-sm flex justify-between items-start z-10">
                            <div>
                                <button 
                                    onClick={() => setActiveTicketId(null)} 
                                    className="md:hidden text-gray-500 mb-2 flex items-center gap-1 text-xs font-bold uppercase"
                                >
                                    <ChevronRight className="rotate-180" size={12} /> Back
                                </button>
                                <h2 className="text-lg font-bold text-gray-900">{activeTicket.subject}</h2>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                    <span className="font-mono">ID: {activeTicket.id}</span>
                                    {activeTicket.projectName && (
                                        <>
                                            <span>•</span>
                                            <span>Project: {activeTicket.projectName}</span>
                                        </>
                                    )}
                                    {activeTicket.category && (
                                        <>
                                            <span>•</span>
                                            <span className={`${getCategoryBadge(activeTicket.category)} px-1.5 py-0.5 rounded-sm font-bold uppercase`}>
                                                {activeTicket.category}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {activeTicket.status !== 'closed' ? (
                                    <button
                                        onClick={handleCloseTicket}
                                        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 uppercase transition-colors"
                                    >
                                        <CheckCircle2 size={14} /> Close Ticket
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase">
                                        <CheckCircle2 size={14} /> Closed
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeTicket.messages?.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`p-4 shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                            ? 'bg-black text-white rounded-l-lg rounded-tr-lg'
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-r-lg rounded-tl-lg'
                                        }`}>
                                            {msg.text}
                                            {(msg.attachments?.length || 0) > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                                                    {msg.attachments?.map((file, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={file} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-xs opacity-80 bg-white/10 p-2 rounded-sm hover:bg-white/20 transition-colors"
                                                        >
                                                            <Paperclip size={12} /> {file.split('/').pop()}
                                                        </a>
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
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Area */}
                        {activeTicket.status !== 'closed' && (
                            <div className="p-4 bg-white border-t border-gray-200">
                                {replyAttachments.length > 0 && (
                                    <div className="flex gap-2 mb-2 flex-wrap">
                                        {replyAttachments.map((f, i) => (
                                            <div key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                                                {f.filename} 
                                                <button onClick={() => setReplyAttachments(replyAttachments.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input ref={replyFileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} accept="image/*,.pdf,.doc,.docx,.txt" />
                                <div className="flex gap-2 items-end">
                                    <button 
                                        onClick={() => replyFileInputRef.current?.click()}
                                        disabled={replyingWithFile}
                                        className="p-3 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                                    >
                                        {replyingWithFile ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                                    </button>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Type your reply..."
                                        className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] resize-none h-12 min-h-[48px] max-h-32 transition-colors"
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={(!replyText && replyAttachments.length === 0) || sendingReply}
                                        className="p-3 bg-[#ff4d00] text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sendingReply ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
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