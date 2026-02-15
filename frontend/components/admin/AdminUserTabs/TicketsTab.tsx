import React, { useState, useEffect } from 'react';
import { Ticket, TicketMessage } from '../../../types';
import { db } from '../../../services/db';
import { MessageSquare, Send, ChevronDown, ChevronUp, X } from 'lucide-react';

interface TicketsTabProps {
    userId: string;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ userId }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-progress' | 'closed'>('all');

    useEffect(() => {
        loadTickets();
    }, [userId]);

    const loadTickets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await db.getUserTickets(userId);
            setTickets(data);
        } catch (e) {
            console.error('Failed to load tickets:', e);
            setError('Failed to load tickets.');
        }
        setLoading(false);
    };

    const filteredTickets = tickets.filter(t => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        return true;
    });

    const getStatusBadge = (status?: string) => {
        const colors: Record<string, string> = {
            open: 'bg-green-100 text-green-700',
            'in-progress': 'bg-blue-100 text-blue-700',
            closed: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-1 text-[9px] font-bold uppercase ${colors[status || ''] || 'bg-gray-100 text-gray-700'}`}>
                {status || 'open'}
            </span>
        );
    };

    const getPriorityBadge = (priority?: string) => {
        const colors: Record<string, string> = {
            low: 'bg-gray-100 text-gray-600',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 text-[9px] font-bold uppercase ${colors[priority || ''] || 'bg-gray-100 text-gray-600'}`}>
                {priority || 'low'}
            </span>
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <div className="font-bold mb-2">Error</div>
                {error}
                <button
                    onClick={loadTickets}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-bold uppercase"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">Filter:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="closed">Closed</option>
                    </select>
                    <div className="flex-1"></div>
                    <span className="text-xs text-gray-500">{filteredTickets.length} tickets</span>
                </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                    <div className="bg-white border border-gray-200 p-8 text-center text-gray-400">No tickets found</div>
                ) : (
                    filteredTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white border border-gray-200 shadow-sm">
                            {/* Ticket Header */}
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <MessageSquare size={16} className="text-gray-400" />
                                    <div>
                                        <div className="font-bold text-gray-900">{ticket.subject}</div>
                                        <div className="text-xs text-gray-400">Created: {ticket.date}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {getPriorityBadge(ticket.priority)}
                                    {getStatusBadge(ticket.status)}
                                    {expandedTicket === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>

                            {/* Expanded Messages */}
                            {expandedTicket === ticket.id && (
                                <div className="border-t border-gray-100">
                                    <div className="p-4 max-h-96 overflow-y-auto space-y-4">
                                        {ticket.messages && ticket.messages.length > 0 ? (
                                            ticket.messages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded ${msg.sender === 'admin'
                                                        ? 'bg-blue-50 ml-8'
                                                        : 'bg-gray-50 mr-8'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase ${msg.sender === 'admin' ? 'text-blue-600' : 'text-gray-600'
                                                            }`}>
                                                            {msg.sender === 'admin' ? 'Support' : 'User'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">{msg.date}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-700">{msg.text}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-400 text-sm">No messages yet</div>
                                        )}
                                    </div>

                                    {/* Reply Box */}
                                    {ticket.status !== 'closed' && (
                                        <div className="p-4 border-t border-gray-100 flex gap-2">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your reply..."
                                                className="flex-1 p-3 border border-gray-200 text-sm"
                                            />
                                            <button className="px-4 py-2 bg-[#ff4d00] text-white text-xs font-bold uppercase hover:bg-orange-700">
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TicketsTab;
