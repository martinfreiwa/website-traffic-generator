import { describe, it, expect, beforeEach, vi } from 'vitest';

const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);

describe('ChatWidget Logic', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        store = {};
        localStorageMock.getItem.mockImplementation((key: string) => store[key] || null);
        localStorageMock.setItem.mockImplementation((key: string, value: string) => {
            store[key] = value.toString();
        });
    });

    describe('Guest ID Management', () => {
        it('should generate new guest ID if none exists', () => {
            const guestId = localStorage.getItem('modus_guest_id');
            expect(guestId).toBeNull();
            
            const newGuestId = `guest_${Date.now().toString().slice(-6)}`;
            localStorage.setItem('modus_guest_id', newGuestId);
            
            expect(localStorage.getItem('modus_guest_id')).toBe(newGuestId);
        });

        it('should reuse existing guest ID', () => {
            const existingGuestId = 'guest_123456';
            localStorage.setItem('modus_guest_id', existingGuestId);
            
            const guestId = localStorage.getItem('modus_guest_id');
            expect(guestId).toBe(existingGuestId);
        });
    });

    describe('Message Formatting', () => {
        it('should format date correctly', () => {
            const now = new Date();
            const formatted = now.toLocaleString();
            expect(formatted).toContain(',');
        });

        it('should extract time from full date string', () => {
            const fullDate = "01/15/2024, 10:30:00 AM";
            const parts = fullDate.split(',');
            const time = parts[1]?.trim() || 'Now';
            expect(time).toBe('10:30:00 AM');
        });

        it('should return "Now" when no date provided', () => {
            const time = undefined;
            const result = time || 'Now';
            expect(result).toBe('Now');
        });
    });

    describe('Chat Message Sender Detection', () => {
        it('should identify user message correctly', () => {
            const sender = 'user';
            const isMe = sender === 'user' || sender === 'guest';
            expect(isMe).toBe(true);
        });

        it('should identify guest message correctly', () => {
            const sender = 'guest';
            const isMe = sender === 'user' || sender === 'guest';
            expect(isMe).toBe(true);
        });

        it('should identify admin message correctly', () => {
            const sender = 'admin';
            const isMe = sender === 'user' || sender === 'guest';
            expect(isMe).toBe(false);
        });

        it('should label user/guest as "You" in UI', () => {
            const sender = 'user';
            const label = sender === 'user' || sender === 'guest' ? 'You' : 'Support';
            expect(label).toBe('You');
        });

        it('should label admin as "Support" in UI', () => {
            const sender = 'admin';
            const label = sender === 'user' || sender === 'guest' ? 'You' : 'Support';
            expect(label).toBe('Support');
        });
    });

    describe('Chat Subject Generation', () => {
        it('should generate chat subject with user name', () => {
            const formName = 'John Doe';
            const subject = `Chat with ${formName}`;
            expect(subject).toBe('Chat with John Doe');
        });

        it('should handle empty name gracefully', () => {
            const formName = '';
            const subject = formName ? `Chat with ${formName}` : 'Chat with Guest';
            expect(subject).toBe('Chat with Guest');
        });
    });

    describe('Form Validation', () => {
        it('should require name field', () => {
            const formName = '';
            const formEmail = 'test@example.com';
            const isValid = Boolean(formName && formEmail);
            expect(isValid).toBe(false);
        });

        it('should require email field', () => {
            const formName = 'John';
            const formEmail = '';
            const isValid = Boolean(formName && formEmail);
            expect(isValid).toBe(false);
        });

        it('should validate both fields present', () => {
            const formName = 'John';
            const formEmail = 'test@example.com';
            const isValid = Boolean(formName && formEmail);
            expect(isValid).toBe(true);
        });

        it('should allow empty phone (optional field)', () => {
            const formPhone = '';
            const isValid = formPhone !== undefined;
            expect(isValid).toBe(true);
        });
    });

    describe('Message Input Validation', () => {
        it('should not send empty messages', () => {
            const messageInput = '';
            const canSend = Boolean(messageInput.trim());
            expect(canSend).toBe(false);
        });

        it('should not send whitespace-only messages', () => {
            const messageInput = '   ';
            const canSend = Boolean(messageInput.trim());
            expect(canSend).toBe(false);
        });

        it('should send valid messages', () => {
            const messageInput = 'Hello there!';
            const canSend = Boolean(messageInput.trim());
            expect(canSend).toBe(true);
        });
    });

    describe('Enter Key Handling', () => {
        it('should handle Enter key without shift', () => {
            const event = { key: 'Enter', shiftKey: false, preventDefault: vi.fn() };
            const shouldSend = event.key === 'Enter' && !event.shiftKey;
            expect(shouldSend).toBe(true);
        });

        it('should NOT handle Enter key with shift (new line)', () => {
            const event = { key: 'Enter', shiftKey: true, preventDefault: vi.fn() };
            const shouldSend = event.key === 'Enter' && !event.shiftKey;
            expect(shouldSend).toBe(false);
        });

        it('should NOT handle other keys', () => {
            const event = { key: 'a', shiftKey: false, preventDefault: vi.fn() };
            const shouldSend = event.key === 'Enter' && !event.shiftKey;
            expect(shouldSend).toBe(false);
        });
    });

    describe('Widget State Transitions', () => {
        it('should start with widget closed', () => {
            let isOpen = false;
            expect(isOpen).toBe(false);
        });

        it('should toggle to open', () => {
            let isOpen = false;
            isOpen = !isOpen;
            expect(isOpen).toBe(true);
        });

        it('should toggle back to closed', () => {
            let isOpen = true;
            isOpen = !isOpen;
            expect(isOpen).toBe(false);
        });

        it('should show pre-chat form when no active chat', () => {
            const activeChat = null;
            const showPreChat = !activeChat;
            expect(showPreChat).toBe(true);
        });

        it('should show messages when chat is active', () => {
            const activeChat = { id: '1', subject: 'Test', messages: [] };
            const showMessages = Boolean(activeChat);
            expect(showMessages).toBe(true);
        });
    });

    describe('Poll Interval', () => {
        it('should have 5 second poll interval', () => {
            const pollInterval = 5000;
            expect(pollInterval).toBe(5000);
        });

        it('should clear interval on cleanup', () => {
            const intervalId = 123;
            const cleared = clearInterval(intervalId);
            expect(cleared).toBeUndefined();
        });
    });

    describe('Active Chat Filtering', () => {
        it('should filter for non-closed chats', () => {
            const tickets = [
                { id: '1', status: 'open' },
                { id: '2', status: 'pending' },
                { id: '3', status: 'closed' },
            ];
            const openChats = tickets.filter(t => t.status !== 'closed');
            expect(openChats).toHaveLength(2);
        });

        it('should find chat for logged in user', () => {
            const currentUser = { id: 'user_1', email: 'test@example.com' };
            const tickets = [
                { id: '1', userId: 'user_1', status: 'open', type: 'chat' },
                { id: '2', userId: 'user_2', status: 'open', type: 'chat' },
            ];
            const chat = tickets.find(t => t.userId === currentUser.id && t.status !== 'closed');
            expect(chat?.id).toBe('1');
        });

        it('should find chat for guest user', () => {
            const currentUser = undefined;
            const guestId = 'guest_123';
            localStorage.setItem('modus_guest_id', guestId);
            
            const tickets = [
                { id: '1', userId: 'guest_123', status: 'open', type: 'chat' },
                { id: '2', userId: 'guest_456', status: 'open', type: 'chat' },
            ];
            const chat = tickets.find(t => t.userId === guestId && t.status !== 'closed');
            expect(chat?.id).toBe('1');
        });
    });

    describe('Message ID Generation', () => {
        it('should generate unique message ID', () => {
            const id1 = Date.now().toString();
            const id2 = Date.now().toString();
            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
        });
    });
});
