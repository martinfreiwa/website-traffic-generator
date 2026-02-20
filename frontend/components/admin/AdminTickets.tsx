import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User } from '../../types';
import { db } from '../../services/db';
import { 
    User as UserIcon, MessageSquare, Send, Search, Trash2, Paperclip, X, 
    CheckSquare, Square, Tag, Users, Bold, Italic, 
    List, Link as LinkIcon, Eye, EyeOff, Archive, RotateCcw, Clock, Play, Hourglass,
    ChevronDown, AlertTriangle
} from 'lucide-react';

interface AdminTicketsProps {
    tickets: Ticket[];
    onRefresh: () => void;
    admins?: User[];
}

interface TicketTemplate {
    id: string;
    title: string;
    content: string;
    category: string;
    shortcut: string;
}

interface UserStats {
    user_id: string;
    plan: string;
    created_at: string;
    lifetime_value: number;
    total_tickets: number;
    open_tickets: number;
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    billing: { bg: 'bg-red-100', text: 'text-red-600' },
    technical: { bg: 'bg-blue-100', text: 'text-blue-600' },
    urgent: { bg: 'bg-orange-100', text: 'text-orange-600' },
    feature: { bg: 'bg-purple-100', text: 'text-purple-600' },
    bug: { bg: 'bg-red-100', text: 'text-red-600' },
    default: { bg: 'bg-gray-100', text: 'text-gray-600' }
};

const AdminTickets: React.FC<AdminTicketsProps> = ({ tickets, onRefresh, admins: propAdmins }) => {
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'open' | 'pending' | 'in-progress' | 'closed' | 'archived'>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templates, setTemplates] = useState<TicketTemplate[]>([]);
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [showCustomerPanel, setShowCustomerPanel] = useState(true);
    const [ticketTags, setTicketTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [admins, setAdmins] = useState<User[]>(propAdmins || []);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const safeTickets = tickets || [];
    const selectedTicket = safeTickets.find(t => t.id === selectedTicketId);

    const getWaitingTime = (ticket: Ticket): { minutes: number; color: string; label: string } => {
        const lastMessage = ticket.messages?.filter(m => m.sender !== 'admin').pop();
        const referenceDate = lastMessage ? new Date(lastMessage.date) : new Date(ticket.date);
        const now = new Date();
        const diffMs = now.getTime() - referenceDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return { minutes: diffMins, color: 'bg-green-500', label: `${diffMins}m` };
        } else if (diffMins < 240) {
            const hours = Math.floor(diffMins / 60);
            return { minutes: diffMins, color: 'bg-yellow-500', label: `${hours}h` };
        } else {
            const hours = Math.floor(diffMins / 60);
            return { minutes: diffMins, color: 'bg-red-500', label: `${hours}h` };
        }
    };

    const filteredTickets = safeTickets
        .filter(t => {
            if (showArchived) return t.status === 'archived';
            if (activeTab === 'all') return t.status !== 'archived';
            if (activeTab === 'open') return t.status === 'open';
            if (activeTab === 'pending') return t.status === 'pending';
            if (activeTab === 'in-progress') return t.status === 'in-progress';
            if (activeTab === 'closed') return t.status === 'closed';
            return true;
        })
        .filter(t => 
            searchTerm === '' || 
            t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.userName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    useEffect(() => {
        if (selectedTicketId) {
            db.markTicketRead(selectedTicketId);
            const ticket = safeTickets.find(t => t.id === selectedTicketId);
            if (ticket) {
                setTicketTags(ticket.tags || []);
                loadUserStats(ticket.userId);
            }
            onRefresh();
        }
    }, [selectedTicketId]);

    useEffect(() => {
        loadTemplates();
        loadAdmins();
    }, []);

    const loadAdmins = () => {
        try {
            const adminUsers = db.getAdmins();
            setAdmins(adminUsers);
        } catch {
            setAdmins([]);
        }
    };

    const loadTemplates = async () => {
        const data = await db.getTicketTemplates();
        setTemplates(data);
    };

    const loadUserStats = async (userId: string) => {
        try {
            const stats = await db.getUserStatsById(userId);
            setUserStats(stats);
        } catch {
            setUserStats(null);
        }
    };

    const handleSendMessage = async () => {
        if ((!replyText.trim() && attachments.length === 0) || !selectedTicketId) return;
        try {
            await db.replyToTicket(selectedTicketId, replyText, 'admin', attachments, isInternalNote);
            setReplyText('');
            setAttachments([]);
            setIsInternalNote(false);
            onRefresh();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handlePriorityChange = async (priority: Ticket['priority']) => {
        if (!selectedTicketId) return;
        try {
            await db.updateTicketPriority(selectedTicketId, priority);
            onRefresh();
        } catch (error) {
            console.error('Failed to update priority:', error);
        }
    };

    const handleDelete = async () => {
        if (!selectedTicketId) return;
        if (confirm('Are you sure you want to permanently delete this ticket?')) {
            try {
                await db.deleteTicket(selectedTicketId);
                setSelectedTicketId(null);
                onRefresh();
            } catch (error) {
                console.error('Failed to delete ticket:', error);
            }
        }
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachments([...attachments, e.target.files[0].name]);
        }
    };

    const toggleTicketSelection = (id: string) => {
        setSelectedTickets(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedTickets.length === filteredTickets.length) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(filteredTickets.map(t => t.id));
        }
    };

    const handleBulkAction = async (action: 'close' | 'delete' | 'open' | 'archive') => {
        if (selectedTickets.length === 0) return;
        try {
            await db.bulkUpdateTickets(selectedTickets, action);
            setSelectedTickets([]);
            onRefresh();
        } catch (error) {
            console.error('Bulk action failed:', error);
            alert('Failed to perform action. Please try again.');
        }
    };

    const handleStatusChange = async (status: Ticket['status']) => {
        if (!selectedTicketId) return;
        try {
            await db.updateTicketStatus(selectedTicketId, status);
            onRefresh();
        } catch (error) {
            console.error('Status change failed:', error);
        }
    };

    const handleArchive = async () => {
        if (!selectedTicketId) return;
        try {
            await db.updateTicketStatus(selectedTicketId, 'archived');
            onRefresh();
        } catch (error) {
            console.error('Archive failed:', error);
        }
    };

    const handleUnarchive = async () => {
        if (!selectedTicketId) return;
        try {
            await db.updateTicketStatus(selectedTicketId, 'open');
            onRefresh();
        } catch (error) {
            console.error('Unarchive failed:', error);
        }
    };

    const handleAssignTicket = async (assigneeId: string | null) => {
        if (!selectedTicketId) return;
        try {
            await db.assignTicket(selectedTicketId, assigneeId);
            onRefresh();
        } catch (error) {
            console.error('Failed to assign ticket:', error);
        }
    };

    const handleAddTag = async () => {
        if (!newTag.trim() || !selectedTicketId) return;
        const updatedTags = [...ticketTags, newTag.trim().toLowerCase()];
        setTicketTags(updatedTags);
        try {
            await db.updateTicketTags(selectedTicketId, updatedTags);
            setNewTag('');
            onRefresh();
        } catch (error) {
            console.error('Failed to add tag:', error);
        }
    };

    const handleRemoveTag = async (tag: string) => {
        if (!selectedTicketId) return;
        const updatedTags = ticketTags.filter(t => t !== tag);
        setTicketTags(updatedTags);
        try {
            await db.updateTicketTags(selectedTicketId, updatedTags);
            onRefresh();
        } catch (error) {
            console.error('Failed to remove tag:', error);
        }
    };

    const insertTemplate = (content: string) => {
        setReplyText(prev => prev + content);
        setShowTemplates(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === '/' && replyText === '') {
            e.preventDefault();
            setShowTemplates(true);
        }
    };

    const getTagColor = (tag: string) => TAG_COLORS[tag] || TAG_COLORS.default;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });
    };

    return (
        <div className="animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Support Tickets</h2>
                    {selectedTickets.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">{selectedTickets.length} selected</span>
                            <button 
                                onClick={() => handleBulkAction('close')}
                                className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold uppercase hover:bg-green-600 rounded-sm"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => handleBulkAction('archive')}
                                className="px-3 py-1.5 bg-gray-500 text-white text-xs font-bold uppercase hover:bg-gray-600 rounded-sm"
                            >
                                Archive
                            </button>
                            <button 
                                onClick={() => handleBulkAction('delete')}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold uppercase hover:bg-red-600 rounded-sm"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-sm w-fit">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'open', label: 'Open' },
                    { id: 'in-progress', label: 'In Progress' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'closed', label: 'Closed' },
                    { id: 'archived', label: 'Archived' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setShowArchived(tab.id === 'archived'); }}
                        className={`px-4 py-2 text-xs font-bold uppercase transition-colors rounded-sm ${
                            activeTab === tab.id 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                    <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search tickets..." 
                        className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-[#ff4d00]" 
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200 shadow-sm flex overflow-hidden">
                <div className="w-[400px] border-r border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                        >
                            {selectedTickets.length === filteredTickets.length && filteredTickets.length > 0 ? (
                                <CheckSquare size={16} />
                            ) : (
                                <Square size={16} />
                            )}
                            Select All
                        </button>
                        <span className="text-xs font-bold text-gray-400">{filteredTickets.length} tickets</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs">No conversations found.</div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                                        selectedTicketId === ticket.id ? 'bg-orange-50 border-l-4 border-l-[#ff4d00]' : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleTicketSelection(ticket.id); }}
                                            className="mt-1 text-gray-400 hover:text-gray-600"
                                        >
                                            {selectedTickets.includes(ticket.id) ? (
                                                <CheckSquare size={16} className="text-[#ff4d00]" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${ticket.type === 'chat' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                                                        {ticket.type}
                                                    </span>
                                                    {ticket.assigneeName && (
                                                        <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                                                            <UserIcon size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold">{ticket.date}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-1 truncate">{ticket.subject}</h4>
                                            <p className="text-xs text-gray-500 truncate mb-2">{ticket.lastMessage}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {ticket.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getTagColor(tag).bg} ${getTagColor(tag).text}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                                    <UserIcon size={10} /> {ticket.userName}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ticket.status !== 'closed' && ticket.status !== 'archived' && (
                                                        <div 
                                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${getWaitingTime(ticket).color}`}
                                                            title={`Waiting for ${getWaitingTime(ticket).label}`}
                                                        >
                                                            <Clock size={10} />
                                                            {getWaitingTime(ticket).label}
                                                        </div>
                                                    )}
                                                    {ticket.priority === 'high' && <span className="text-[9px] font-bold text-red-500 uppercase">HIGH</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedTicket ? (
                    <div className="flex-1 flex flex-col h-full bg-[#fafafa]">
                        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-start shadow-sm z-10">
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                    <span className="flex items-center gap-1"><UserIcon size={14} /> {selectedTicket.userName || 'User'}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-mono text-gray-400">ID: {selectedTicket.id.slice(0, 8)}</span>
                                    {selectedTicket.projectName && (
                                        <>
                                            <span className="text-gray-300">|</span>
                                            <span>{selectedTicket.projectName}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {ticketTags.map(tag => (
                                        <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${getTagColor(tag).bg} ${getTagColor(tag).text}`}>
                                            {tag}
                                            <button onClick={() => handleRemoveTag(tag)}><X size={10} /></button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1">
                                        <input 
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder="+ tag"
                                            className="w-16 text-[10px] px-1 py-0.5 border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1">
                                    {selectedTicket.status !== 'archived' && (
                                        <>
                                            <button 
                                                onClick={() => handleStatusChange('open')}
                                                className={`p-1.5 rounded-sm transition-colors ${
                                                    selectedTicket.status === 'open' 
                                                        ? 'bg-red-100 text-red-600' 
                                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                }`}
                                                title="Open"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange('in-progress')}
                                                className={`p-1.5 rounded-sm transition-colors ${
                                                    selectedTicket.status === 'in-progress' 
                                                        ? 'bg-blue-100 text-blue-600' 
                                                        : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                                                }`}
                                                title="In Progress"
                                            >
                                                <Play size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange('pending')}
                                                className={`p-1.5 rounded-sm transition-colors ${
                                                    selectedTicket.status === 'pending' 
                                                        ? 'bg-amber-100 text-amber-600' 
                                                        : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                                                }`}
                                                title="Pending"
                                            >
                                                <Hourglass size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange('closed')}
                                                className={`p-1.5 rounded-sm transition-colors ${
                                                    selectedTicket.status === 'closed' 
                                                        ? 'bg-green-100 text-green-600' 
                                                        : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                                                }`}
                                                title="Close"
                                            >
                                                <CheckSquare size={14} />
                                            </button>
                                            <div className="h-4 w-px bg-gray-200 mx-1"></div>
                                            <button 
                                                onClick={handleArchive}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm"
                                                title="Archive"
                                            >
                                                <Archive size={14} />
                                            </button>
                                        </>
                                    )}
                                    {selectedTicket.status === 'archived' && (
                                        <button 
                                            onClick={handleUnarchive}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-sm"
                                            title="Unarchive"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase border border-gray-200 rounded-sm hover:bg-gray-50"
                                        >
                                            {selectedTicket.assigneeName ? (
                                                <>
                                                    <div className="w-4 h-4 rounded-full bg-[#ff4d00] flex items-center justify-center">
                                                        <UserIcon size={8} className="text-white" />
                                                    </div>
                                                    {selectedTicket.assigneeName}
                                                </>
                                            ) : (
                                                <>
                                                    <UserIcon size={12} />
                                                    Assign
                                                </>
                                            )}
                                            <ChevronDown size={10} />
                                        </button>
                                        {showAssigneeDropdown && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-sm z-50">
                                                <div className="p-1">
                                                    <button
                                                        onClick={() => { handleAssignTicket(null); setShowAssigneeDropdown(false); }}
                                                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 rounded-sm"
                                                    >
                                                        Unassigned
                                                    </button>
                                                    {admins.map(admin => (
                                                        <button
                                                            key={admin.id}
                                                            onClick={() => { handleAssignTicket(admin.id); setShowAssigneeDropdown(false); }}
                                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 rounded-sm flex items-center gap-2 ${
                                                                selectedTicket.assigneeId === admin.id ? 'bg-orange-50 text-[#ff4d00]' : ''
                                                            }`}
                                                        >
                                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <UserIcon size={10} />
                                                            </div>
                                                            {admin.name || admin.email}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <select 
                                        value={selectedTicket.priority} 
                                        onChange={(e) => handlePriorityChange(e.target.value as any)}
                                        className={`text-[10px] font-bold uppercase border border-gray-200 rounded-sm px-2 py-1 outline-none cursor-pointer ${
                                            selectedTicket.priority === 'high' ? 'text-red-500 border-red-200' : 'text-gray-500'
                                        }`}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setShowCustomerPanel(!showCustomerPanel)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm"
                                        title="Toggle Customer Panel"
                                    >
                                        <Users size={14} />
                                    </button>
                                    <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {selectedTicket.messages?.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] ${msg.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {msg.isInternalNote && (
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase mb-1 flex items-center gap-1">
                                                        <EyeOff size={10} /> Internal Note
                                                    </span>
                                                )}
                                                <div className={`p-4 shadow-sm text-sm leading-relaxed ${
                                                    msg.isInternalNote 
                                                        ? 'bg-amber-50 text-gray-900 border border-amber-200 rounded-lg'
                                                        : msg.sender === 'admin' 
                                                            ? 'bg-black text-white rounded-l-lg rounded-tr-lg' 
                                                            : 'bg-white text-gray-900 border border-gray-200 rounded-r-lg rounded-tl-lg'
                                                }`}>
                                                    {msg.text}
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200/20 space-y-1">
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

                                <div className="p-4 bg-white border-t border-gray-200">
                                    {showTemplates && templates.length > 0 && (
                                        <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-sm max-h-40 overflow-y-auto">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Quick Responses</div>
                                            {templates.map(tpl => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => insertTemplate(tpl.content)}
                                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded-sm"
                                                >
                                                    <span className="font-bold">{tpl.title}</span>
                                                    <span className="text-gray-400 ml-2">/{tpl.shortcut}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {attachments.length > 0 && (
                                        <div className="flex gap-2 mb-2 flex-wrap">
                                            {attachments.map((f, i) => (
                                                <div key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                                                    {f} <button onClick={() => setAttachments(attachments.filter(x => x !== f))}><X size={12}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-2 text-xs">
                                        <button
                                            onClick={() => setIsInternalNote(!isInternalNote)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-sm transition-colors ${
                                                isInternalNote ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            {isInternalNote ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {isInternalNote ? 'Internal Note' : 'Reply'}
                                        </button>
                                        <div className="h-3 w-px bg-gray-200"></div>
                                        <button className="p-1 text-gray-400 hover:text-gray-600"><Bold size={14} /></button>
                                        <button className="p-1 text-gray-400 hover:text-gray-600"><Italic size={14} /></button>
                                        <button className="p-1 text-gray-400 hover:text-gray-600"><List size={14} /></button>
                                        <button className="p-1 text-gray-400 hover:text-gray-600"><LinkIcon size={14} /></button>
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <label className="p-2 text-gray-400 hover:text-black cursor-pointer transition-colors">
                                            <Paperclip size={18} />
                                            <input type="file" className="hidden" onChange={handleFileAttach} />
                                        </label>
                                        <textarea 
                                            ref={textareaRef}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === '/' && replyText === '') {
                                                    e.preventDefault();
                                                    setShowTemplates(true);
                                                }
                                                if(e.key === 'Enter' && !e.shiftKey && !showTemplates) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder={isInternalNote ? "Internal note (not visible to customer)..." : "Type your reply... (type / for templates)"}
                                            className={`flex-1 bg-[#f9fafb] border p-2 text-sm outline-none resize-none h-16 min-h-[48px] max-h-32 transition-colors ${
                                                isInternalNote ? 'border-amber-200 focus:border-amber-400' : 'border-gray-200 focus:border-[#ff4d00]'
                                            }`}
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!replyText && attachments.length === 0}
                                            className={`p-2.5 hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                isInternalNote ? 'bg-amber-500 text-white' : 'bg-[#ff4d00] text-white'
                                            }`}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {showCustomerPanel && userStats && (
                                <div className="w-64 border-l border-gray-200 bg-white p-4 overflow-y-auto">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Info</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Plan</div>
                                            <div className={`inline-block px-2 py-1 rounded-sm text-xs font-bold ${
                                                userStats.plan === 'enterprise' ? 'bg-purple-100 text-purple-600' :
                                                userStats.plan === 'professional' ? 'bg-blue-100 text-blue-600' :
                                                userStats.plan === 'pro' ? 'bg-green-100 text-green-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {userStats.plan?.toUpperCase() || 'FREE'}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Member Since</div>
                                            <div className="text-sm font-medium">{formatDate(userStats.created_at)}</div>
                                        </div>

                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Lifetime Value</div>
                                            <div className="text-sm font-bold text-green-600">{formatCurrency(userStats.lifetime_value)}</div>
                                        </div>

                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Total Tickets</div>
                                            <div className="text-sm font-medium">{userStats.total_tickets}</div>
                                        </div>

                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Open Tickets</div>
                                            <div className="text-sm font-medium">{userStats.open_tickets}</div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase hover:bg-gray-200 rounded-sm">
                                                View All Tickets
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
