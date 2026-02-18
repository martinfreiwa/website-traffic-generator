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

describe('Support Ticket Functions', () => {
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

    describe('getTickets with filters', () => {
        it('should return all tickets when no filters', () => {
            const mockTickets: Ticket[] = [
                { id: '1', type: 'ticket', subject: 'Ticket 1', status: 'open', priority: 'high', category: 'billing' } as Ticket,
                { id: '2', type: 'ticket', subject: 'Ticket 2', status: 'closed', priority: 'low', category: 'technical' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const tickets = db.getTickets();
            expect(tickets).toHaveLength(2);
        });

        it('should filter by status', () => {
            const mockTickets: Ticket[] = [
                { id: '1', type: 'ticket', subject: 'Open Ticket', status: 'open', priority: 'high' } as Ticket,
                { id: '2', type: 'ticket', subject: 'Closed Ticket', status: 'closed', priority: 'low' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const tickets = db.getTickets({ status: 'open' });
            expect(tickets).toHaveLength(1);
            expect(tickets[0].status).toBe('open');
        });

        it('should filter by category', () => {
            const mockTickets: Ticket[] = [
                { id: '1', type: 'ticket', subject: 'Billing', status: 'open', priority: 'high', category: 'billing' } as Ticket,
                { id: '2', type: 'ticket', subject: 'Technical', status: 'open', priority: 'low', category: 'technical' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const tickets = db.getTickets({ category: 'billing' });
            expect(tickets).toHaveLength(1);
            expect(tickets[0].category).toBe('billing');
        });

        it('should filter by search query', () => {
            const mockTickets: Ticket[] = [
                { id: '1', type: 'ticket', subject: 'Payment Issue', status: 'open', priority: 'high', lastMessage: 'Need help' } as Ticket,
                { id: '2', type: 'ticket', subject: 'Bug Report', status: 'open', priority: 'low', lastMessage: 'Found a bug' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const tickets = db.getTickets({ search: 'Payment' });
            expect(tickets).toHaveLength(1);
            expect(tickets[0].subject).toBe('Payment Issue');
        });
    });

    describe('createTicket with new fields', () => {
        it('should create ticket with category', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{
                        id: 'ticket_123',
                        type: 'ticket',
                        user_id: 'user_1',
                        subject: 'Billing Issue',
                        priority: 'high',
                        category: 'billing',
                        created_at: '2024-01-01',
                        user_email: 'test@example.com'
                    }]
                });

            const newTicket: Partial<Ticket> = {
                subject: 'Billing Issue',
                category: 'billing',
                priority: 'high'
            };

            await db.createTicket(newTicket);

            const createCall = (fetch as any).mock.calls[0];
            expect(createCall[0]).toContain('/tickets');
            expect(createCall[1].method).toBe('POST');
            const body = JSON.parse(createCall[1].body);
            expect(body.category).toBe('billing');
        });

        it('should create ticket with project association', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{
                        id: 'ticket_456',
                        type: 'ticket',
                        user_id: 'user_1',
                        subject: 'Project Issue',
                        project_id: 'project_123',
                        project_name: 'My Project',
                        created_at: '2024-01-01',
                        user_email: 'test@example.com'
                    }]
                });

            const newTicket: Partial<Ticket> = {
                subject: 'Project Issue',
                projectId: 'project_123'
            };

            await db.createTicket(newTicket);

            const createCall = (fetch as any).mock.calls[0];
            const body = JSON.parse(createCall[1].body);
            expect(body.project_id).toBe('project_123');
        });

        it('should create ticket with attachments', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{
                        id: 'ticket_789',
                        type: 'ticket',
                        subject: 'Attachment Test',
                        attachment_urls: ['/static/file1.pdf', '/static/file2.png'],
                        created_at: '2024-01-01',
                        user_email: 'test@example.com'
                    }]
                });

            const newTicket: Partial<Ticket> = {
                subject: 'Attachment Test',
                attachmentUrls: ['/static/file1.pdf', '/static/file2.png']
            };

            await db.createTicket(newTicket);

            const createCall = (fetch as any).mock.calls[0];
            const body = JSON.parse(createCall[1].body);
            expect(body.attachment_urls).toHaveLength(2);
        });
    });

    describe('closeTicket', () => {
        it('should close a ticket', async () => {
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'closed' }) })
                .mockResolvedValueOnce({ ok: true, json: async () => [] });

            await db.closeTicket('ticket_123');

            const closeCall = (fetch as any).mock.calls[0];
            expect(closeCall[0]).toContain('/tickets/ticket_123/close');
            expect(closeCall[1].method).toBe('POST');
        });

        it('should throw error on failure', async () => {
            (fetch as any).mockResolvedValueOnce({ ok: false });

            await expect(db.closeTicket('ticket_123')).rejects.toThrow('Failed to close ticket');
        });
    });

    describe('uploadTicketAttachment', () => {
        it('should upload a file and return url', async () => {
            (fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    url: '/static/ticket_attachments/user_1/file.pdf',
                    filename: 'document.pdf'
                })
            });

            localStorage.setItem('tgp_token', 'test_token');

            const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
            const result = await db.uploadTicketAttachment(file);

            expect(result.url).toBe('/static/ticket_attachments/user_1/file.pdf');
            expect(result.filename).toBe('document.pdf');

            const uploadCall = (fetch as any).mock.calls[0];
            expect(uploadCall[0]).toContain('/tickets/upload');
            expect(uploadCall[1].method).toBe('POST');
        });

        it('should throw error on upload failure', async () => {
            (fetch as any).mockResolvedValueOnce({ ok: false });

            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            await expect(db.uploadTicketAttachment(file)).rejects.toThrow('Failed to upload file');
        });
    });

    describe('syncTickets with filters', () => {
        it('should sync with status filter', async () => {
            (fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => [{
                    id: 'ticket_1',
                    type: 'ticket',
                    user_id: 'user_1',
                    subject: 'Open Ticket',
                    status: 'open',
                    priority: 'high',
                    category: 'billing',
                    created_at: '2024-01-01T00:00:00',
                    user_email: 'test@example.com'
                }]
            });

            await db.syncTickets({ status: 'open' });

            const syncCall = (fetch as any).mock.calls[0];
            expect(syncCall[0]).toContain('status=open');
        });

        it('should sync with category filter', async () => {
            (fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => []
            });

            await db.syncTickets({ category: 'technical' });

            const syncCall = (fetch as any).mock.calls[0];
            expect(syncCall[0]).toContain('category=technical');
        });

        it('should sync with search query', async () => {
            (fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => []
            });

            await db.syncTickets({ search: 'billing issue' });

            const syncCall = (fetch as any).mock.calls[0];
            expect(syncCall[0]).toContain('search=billing');
        });

        it('should map new fields correctly', async () => {
            (fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => [{
                    id: 'ticket_full',
                    type: 'ticket',
                    user_id: 'user_1',
                    subject: 'Full Ticket',
                    status: 'open',
                    priority: 'high',
                    category: 'billing',
                    project_id: 'proj_1',
                    project_name: 'My Project',
                    attachment_urls: ['/static/file.pdf'],
                    messages: [{ id: '1', sender: 'user', text: 'Hello', date: '2024-01-01' }],
                    created_at: '2024-01-01T00:00:00',
                    updated_at: '2024-01-02T00:00:00',
                    user_email: 'test@example.com'
                }]
            });

            await db.syncTickets();

            const tickets = db.getTickets();
            expect(tickets[0].category).toBe('billing');
            expect(tickets[0].projectId).toBe('proj_1');
            expect(tickets[0].projectName).toBe('My Project');
            expect(tickets[0].attachmentUrls).toContain('/static/file.pdf');
            expect(tickets[0].updatedAt).toBe('2024-01-02T00:00:00');
        });
    });

    describe('combined filters', () => {
        it('should apply multiple filters locally', () => {
            const mockTickets: Ticket[] = [
                { id: '1', subject: 'Billing Open', status: 'open', category: 'billing', priority: 'high' } as Ticket,
                { id: '2', subject: 'Billing Closed', status: 'closed', category: 'billing', priority: 'low' } as Ticket,
                { id: '3', subject: 'Tech Open', status: 'open', category: 'technical', priority: 'medium' } as Ticket,
            ];
            localStorage.setItem('modus_tickets_cache', JSON.stringify(mockTickets));

            const tickets = db.getTickets({ status: 'open', category: 'billing' });
            expect(tickets).toHaveLength(1);
            expect(tickets[0].subject).toBe('Billing Open');
        });
    });
});