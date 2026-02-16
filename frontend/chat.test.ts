import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ticket } from './types';

const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

const windowMock = {
    location: { origin: 'http://localhost:3000' }
};

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', windowMock);
vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('importMeta', { env: { VITE_API_URL: 'http://localhost:8000' } });

describe('Ticket/Chat Functions', () => {
    let db: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        let store: Record<string, string> = {};

        localStorageMock.getItem.mockImplementation((key: string) => store[key] || null);
        localStorageMock.setItem.mockImplementation((key: string, value: string) => {
            store[key] = value.toString();
        });
        localStorageMock.removeItem.mockImplementation((key: string) => {
            delete store[key];
        });
        localStorageMock.clear.mockImplementation(() => {
            store = {};
        });

        const module = await import('./services/db');
        db = module.db;
    });

    describe('getTickets', () => {
        it('should return empty array when no tickets cached', () => {
            const tickets = db.getTickets();
            expect(tickets).toEqual([]);
            expect(localStorage.getItem).toHaveBeenCalledWith('modus_tickets_cache');
        });

        it('should return cached tickets', () => {
            const mockTickets: Ticket[] = [
                { id: '1', type: 'chat', subject: 'Chat 1', status: 'open', priority: 'high' } as Ticket,
                { id: '2', type: 'ticket', subject: 'Ticket 1', status: 'closed', priority: 'low' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const tickets = db.getTickets();
            expect(tickets).toHaveLength(2);
            expect(tickets[0].subject).toBe('Chat 1');
            expect(tickets[1].type).toBe('ticket');
        });
    });

    describe('createTicket', () => {
        it('should create a new chat ticket', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{
                        id: 'chat_123',
                        type: 'chat',
                        user_id: 'user_1',
                        subject: 'New Chat',
                        priority: 'high',
                        created_at: '2024-01-01',
                        user_email: 'test@example.com'
                    }]
                });

            const newTicket: Partial<Ticket> = {
                subject: 'New Chat',
                type: 'chat',
                priority: 'high',
                messages: []
            };

            await db.createTicket(newTicket);

            expect(fetch).toHaveBeenCalledTimes(2);
            const createCall = (fetch as any).mock.calls[0];
            expect(createCall[0]).toContain('/tickets');
            expect(createCall[1].method).toBe('POST');
            expect(JSON.parse(createCall[1].body).subject).toBe('New Chat');
        });

        it('should create a regular ticket', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{
                        id: 'ticket_456',
                        type: 'ticket',
                        user_id: 'user_1',
                        subject: 'Support Request',
                        priority: 'medium',
                        created_at: '2024-01-01',
                        user_email: 'test@example.com'
                    }]
                });

            const newTicket: Partial<Ticket> = {
                subject: 'Support Request',
                type: 'ticket',
                priority: 'medium'
            };

            await db.createTicket(newTicket);

            const createCall = (fetch as any).mock.calls[0];
            expect(JSON.parse(createCall[1].body).type).toBe('ticket');
        });
    });

    describe('replyToTicket', () => {
        it('should reply to an existing ticket', async () => {
            (fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        id: 'ticket_1',
                        messages: [
                            { id: '1', sender: 'user', text: 'Original message', date: '2024-01-01' },
                            { id: '2', sender: 'user', text: 'Reply message', date: '2024-01-02' }
                        ]
                    })
                })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            await db.replyToTicket('ticket_1', 'Reply message', 'user');

            expect(fetch).toHaveBeenCalledTimes(2);
            const replyCall = (fetch as any).mock.calls[0];
            expect(replyCall[0]).toContain('/tickets/ticket_1/reply');
            expect(replyCall[1].method).toBe('POST');
            expect(JSON.parse(replyCall[1].body).text).toBe('Reply message');
            expect(JSON.parse(replyCall[1].body).sender).toBe('user');
        });

        it('should include attachments when provided', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            await db.replyToTicket('ticket_1', 'Message with file', 'user', ['document.pdf']);

            const replyCall = (fetch as any).mock.calls[0];
            expect(JSON.parse(replyCall[1].body).attachments).toEqual(['document.pdf']);
        });

        it('should throw error on failed reply', async () => {
            (fetch as any).mockResolvedValueOnce({ ok: false });

            await expect(db.replyToTicket('ticket_1', 'Test', 'user')).rejects.toThrow('Failed to send reply');
        });
    });

    describe('updateTicketStatus', () => {
        it('should update ticket status', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            await db.updateTicketStatus('ticket_1', 'closed');

            const updateCall = (fetch as any).mock.calls[0];
            expect(updateCall[0]).toContain('/tickets/ticket_1');
            expect(updateCall[1].method).toBe('PUT');
            expect(JSON.parse(updateCall[1].body).status).toBe('closed');
        });

        it('should throw error on failure', async () => {
            (fetch as any).mockResolvedValueOnce({ ok: false });

            await expect(db.updateTicketStatus('ticket_1', 'open')).rejects.toThrow('Failed to update ticket status');
        });
    });

    describe('updateTicketPriority', () => {
        it('should update ticket priority', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            await db.updateTicketPriority('ticket_1', 'high');

            const updateCall = (fetch as any).mock.calls[0];
            expect(JSON.parse(updateCall[1].body).priority).toBe('high');
        });
    });

    describe('deleteTicket', () => {
        it('should delete a ticket', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            await db.deleteTicket('ticket_1');

            const deleteCall = (fetch as any).mock.calls[0];
            expect(deleteCall[0]).toContain('/tickets/ticket_1');
            expect(deleteCall[1].method).toBe('DELETE');
        });

        it('should throw error on failure', async () => {
            (fetch as any).mockResolvedValueOnce({ ok: false });

            await expect(db.deleteTicket('ticket_1')).rejects.toThrow('Failed to delete ticket');
        });
    });

    describe('markTicketRead', () => {
        it('should mark ticket as read in local cache', async () => {
            const mockTickets: Ticket[] = [
                { id: 'ticket_1', type: 'chat', subject: 'Chat', status: 'open', unread: true } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            await db.markTicketRead('ticket_1');

            const tickets = db.getTickets();
            expect(tickets[0].unread).toBe(false);
        });
    });

    describe('getTicketById', () => {
        it('should return ticket by ID', () => {
            const mockTickets: Ticket[] = [
                { id: 'ticket_1', type: 'chat', subject: 'Chat 1', status: 'open' } as Ticket,
                { id: 'ticket_2', type: 'ticket', subject: 'Ticket 1', status: 'closed' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const ticket = db.getTicketById('ticket_1');
            expect(ticket).toBeDefined();
            expect(ticket?.subject).toBe('Chat 1');
        });

        it('should return undefined for non-existent ticket', () => {
            localStorage.setItem('modus_tickets_cache', JSON.stringify([]));

            const ticket = db.getTicketById('nonexistent');
            expect(ticket).toBeUndefined();
        });
    });
});
