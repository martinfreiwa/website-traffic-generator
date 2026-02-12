
import { Project, PriceClass, ProjectSettings, Transaction, User, Ticket, SystemSettings, Notification, TrafficLog, SystemAlert, LiveVisitor, Broadcast, AdminStats, Coupon, MarketingCampaign } from '../types';

const API_BASE_URL = "http://127.0.0.1:8001";

let authToken = localStorage.getItem('tgp_token');
let currentUserId = localStorage.getItem('modus_current_user_id');

const fetchWithAuth = async (url: string, options: any = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        authToken = null;
        localStorage.removeItem('tgp_token');
        window.dispatchEvent(new Event('auth-expired'));
    }
    return response;
};

export const db = {
    init: () => {
        // No-op for API-based DB, but we keep the signature
        console.log("Remote Database Initialized");
    },

    getCurrentUser: (): User | undefined => {
        const userData = localStorage.getItem('modus_current_user');
        return userData ? JSON.parse(userData) : undefined;
    },

    setCurrentUser: (user: User | null) => {
        if (user) {
            localStorage.setItem('modus_current_user', JSON.stringify(user));
            localStorage.setItem('modus_current_user_id', user.id);
            currentUserId = user.id;
        } else {
            localStorage.removeItem('modus_current_user');
            localStorage.removeItem('modus_current_user_id');
            currentUserId = null;
        }
    },

    // Auth
    login: async (email: string, pass: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', pass);

        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!response.ok) throw new Error('Invalid email or password');
        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('tgp_token', data.access_token);

        // Fetch user details
        const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        const userData = await userRes.json();

        // Map backend response to frontend User type
        const mappedUser: User = {
            id: userData.id,
            email: userData.email,
            name: userData.email.split('@')[0],
            role: userData.role,
            balance: userData.balance,
            status: 'active',
            joinedDate: userData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            projectsCount: 0,
            apiKey: userData.api_key
        };

        db.setCurrentUser(mappedUser);
        return mappedUser;
    },

    register: async (name: string, email: string, pass: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
        return await response.json();
    },

    // Projects
    getProjects: (): Project[] => {
        // In the dashboard, this is called after syncProjects or initData.
        // For a real API, we should probably make this async, but the dashboard expects sync.
        // We'll return the cached projects and provide a separate sync function.
        const data = localStorage.getItem('modus_projects_cache');
        return data ? JSON.parse(data) : [];
    },

    syncProjects: async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects`);
            if (!response.ok) return;
            const data = await response.json();

            // Map backend ProjectResponse to frontend Project type
            const mapped: Project[] = data.map((p: any) => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                plan: p.plan_type,
                status: p.status,
                expires: p.expires_at || 'Never',
                settings: p.settings,
                stats: [] // Would need a separate endpoint for stats history
            }));

            localStorage.setItem('modus_projects_cache', JSON.stringify(mapped));
        } catch (e) {
            console.error("Failed to sync projects:", e);
        }
    },

    getProjectById: (id: string): Project | undefined => {
        const projects = db.getProjects();
        return projects.find(p => p.id === id);
    },

    addProject: async (project: Project) => {
        const projectData = {
            name: project.name,
            plan_type: project.plan,
            settings: project.settings,
            daily_limit: project.customTarget?.dailyLimit || 0,
            total_target: project.customTarget?.totalVisitors || 0
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        if (!response.ok) throw new Error("Failed to create project");
        await db.syncProjects();
        return db.getProjects();
    },

    updateProject: async (project: Project) => {
        // Backend needs a PUT /projects/{id} endpoint, but we can reuse POST if we update logic
        // For now, let's assume we update status or settings
        const response = await fetchWithAuth(`${API_BASE_URL}/projects/${project.id}`, {
            method: 'POST', // or PUT if added
            body: JSON.stringify(project)
        });
        await db.syncProjects();
        return db.getProjects();
    },

    updateProjectStatus: async (id: string, status: 'active' | 'stopped' | 'completed') => {
        const endpoint = status === 'active' ? 'start' : 'stop';
        await fetchWithAuth(`${API_BASE_URL}/projects/${id}/${endpoint}`, { method: 'POST' });
        await db.syncProjects();
        return db.getProjects();
    },

    // Financials
    getBalance: (): number => {
        const user = db.getCurrentUser();
        return user ? user.balance : 0;
    },

    // Unified Syncing
    syncAll: async () => {
        await Promise.all([
            db.syncProjects(),
            db.syncTransactions(),
            db.syncSettings(),
            db.syncUsers(),
            db.syncAllTransactions(),
            db.syncTickets(),
            db.syncNotifications()
        ]);
    },

    // Users
    getUsers: (): User[] => {
        const data = localStorage.getItem('modus_users_cache');
        return data ? JSON.parse(data) : [];
    },

    syncUsers: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`);
        if (!response.ok) return [];
        const data = await response.json();
        const mapped = data.map((u: any) => ({
            id: u.id,
            email: u.email,
            name: u.name || u.email.split('@')[0],
            role: u.role,
            balance: u.balance,
            status: u.status || 'active',
            joinedDate: u.created_at?.split('T')[0] || u.joinedDate || new Date().toISOString().split('T')[0],
            projectsCount: u.projects_count || 0
        }));
        localStorage.setItem('modus_users_cache', JSON.stringify(mapped));
        return mapped;
    },

    updateUser: async (user: User) => {
        console.log("Updating user:", user);
        return user;
    },

    adminAdjustBalance: async (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => {
        const users = db.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;

        await fetchWithAuth(`${API_BASE_URL}/webhooks/deposit`, {
            method: 'POST',
            body: JSON.stringify({
                user_email: user.email,
                amount: type === 'credit' ? amount : -amount,
                description: reason
            })
        });
        await db.syncUsers();
        await db.syncAllTransactions();
    },

    // Transactions
    getTransactions: (): Transaction[] => {
        const data = localStorage.getItem('modus_transactions_cache');
        return data ? JSON.parse(data) : [];
    },

    syncTransactions: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/transactions`);
        if (!response.ok) return [];
        const data = await response.json();
        const mapped: Transaction[] = data.map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || t.date || new Date().toISOString().split('T')[0],
            desc: t.description || t.desc,
            amount: t.amount,
            status: t.status || 'completed',
            type: t.type,
            userId: t.user_id || t.userId
        }));
        localStorage.setItem('modus_transactions_cache', JSON.stringify(mapped));
        return mapped;
    },

    getAllTransactionsAdmin: (): Transaction[] => {
        const data = localStorage.getItem('modus_admin_transactions_cache');
        return data ? JSON.parse(data) : [];
    },

    syncAllTransactions: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/transactions`);
        if (!response.ok) return [];
        const data = await response.json();
        const mapped = data.map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || t.date || new Date().toISOString().split('T')[0],
            desc: t.description || t.desc,
            amount: t.amount,
            status: t.status || 'completed',
            type: t.type,
            userId: t.user_id || t.userId
        }));
        localStorage.setItem('modus_admin_transactions_cache', JSON.stringify(mapped));
        return mapped;
    },

    purchaseCredits: async (amount: number, description: string) => {
        const user = db.getCurrentUser();
        if (!user) return 0;

        await fetchWithAuth(`${API_BASE_URL}/webhooks/deposit`, {
            method: 'POST',
            body: JSON.stringify({
                user_email: user.email,
                amount: amount,
                description: description
            })
        });

        const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        const userData = await userRes.json();
        db.setCurrentUser({ ...user, balance: userData.balance });
        await db.syncTransactions();
        return userData.balance;
    },

    // Tickets
    getTickets: (): Ticket[] => {
        const data = localStorage.getItem('modus_tickets_cache');
        return data ? JSON.parse(data) : [];
    },

    syncTickets: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets`);
        if (!response.ok) return;
        const data = await response.json();
        const mapped: Ticket[] = data.map((t: any) => ({
            id: t.id,
            type: 'ticket',
            userId: t.user_id,
            userName: t.user_email?.split('@')[0] || 'User',
            subject: t.subject,
            status: 'open',
            priority: t.priority,
            date: t.created_at?.split('T')[0] || new Date().toLocaleDateString(),
            lastMessage: 'Ticket created',
            unread: false
        }));
        localStorage.setItem('modus_tickets_cache', JSON.stringify(mapped));
    },

    createTicket: async (ticket: Partial<Ticket>) => {
        await fetchWithAuth(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            body: JSON.stringify(ticket)
        });
        await db.syncTickets();
        return db.getTickets();
    },

    // Notifications
    getNotifications: (): Notification[] => {
        const data = localStorage.getItem('modus_notifications_cache');
        return data ? JSON.parse(data) : [];
    },

    syncNotifications: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/notifications`);
        if (!response.ok) return;
        const data = await response.json();
        const mapped = data.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            date: n.created_at?.split('T')[0] || new Date().toLocaleDateString(),
            read: n.is_read,
            type: n.type || 'info'
        }));
        localStorage.setItem('modus_notifications_cache', JSON.stringify(mapped));
    },

    getAdminNotifications: (): Notification[] => {
        return db.getNotifications();
    },

    markNotificationRead: async (id: string) => {
        await fetchWithAuth(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' });
        await db.syncNotifications();
    },

    // System Settings
    getSystemSettings: (): SystemSettings => {
        const data = localStorage.getItem('modus_settings_cache');
        return data ? JSON.parse(data) : { siteName: 'Traffic Creator', maintenanceMode: false, allowRegistrations: true, supportEmail: 'support@traffic.com', minDeposit: 10 };
    },

    syncSettings: async () => {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (!response.ok) return;
        const data = await response.json();
        localStorage.setItem('modus_settings_cache', JSON.stringify(data.settings));
    },

    saveSystemSettings: async (settings: SystemSettings) => {
        await fetchWithAuth(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            body: JSON.stringify({ settings })
        });
        localStorage.setItem('modus_settings_cache', JSON.stringify(settings));
    },

    // Misc
    trackPresence: (view: string, user: User) => {
        console.log(`User ${user.email} is viewing ${view}`);
    },

    getTicketById: (id: string): Ticket | undefined => {
        const tickets = db.getTickets();
        return tickets.find(t => t.id === id);
    },

    replyToTicket: async (ticketId: string, text: string, sender: 'user' | 'admin' | 'guest', attachments?: string[]) => {
        console.log(`Replying to ticket ${ticketId}: ${text}`);
        return {};
    },

    savePricing: async (pricing: PriceClass[]) => {
        const settings = db.getSystemSettings();
        settings.pricingPlans = pricing;
        await db.saveSystemSettings(settings);
    },

    updateUserProfile: async (user: User) => {
        console.log("Updating profile:", user);
        db.setCurrentUser(user);
    },

    getPricing: (): PriceClass[] => {
        const settings = db.getSystemSettings();
        if (settings.pricingPlans && settings.pricingPlans.length > 0) {
            return settings.pricingPlans;
        }
        return [
            { id: 'foundation', name: 'Foundation', hourlyRate: 0.58, baseFee: 29, examFee: 0 },
            { id: 'momentum', name: 'Momentum', hourlyRate: 0.43, baseFee: 129, examFee: 0 },
            { id: 'breakthrough', name: 'Breakthrough', hourlyRate: 0.40, baseFee: 399, examFee: 0 },
            { id: 'apex', name: 'Apex', hourlyRate: 0.33, baseFee: 999, examFee: 0 },
        ];
    },

    getAlerts: (): SystemAlert[] => {
        const data = localStorage.getItem('modus_alerts_cache');
        return data ? JSON.parse(data) : [];
    },

    checkBroadcastTarget: (alert: SystemAlert, user?: User): boolean => {
        if (!alert.active) return false;
        if (!user) return alert.targetType === 'all';

        switch (alert.targetType) {
            case 'all': return true;
            case 'paying': return user.projectsCount > 0;
            case 'active_7d':
                const joinTime = new Date(user.joinedDate).getTime();
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                return (Date.now() - joinTime) > sevenDaysMs;
            case 'specific':
                return alert.targetUserIds ? alert.targetUserIds.includes(user.id) : false;
            default: return false;
        }
    },

    getRealTimeVisitors: async (): Promise<LiveVisitor[]> => {
        return [];
    },

    scanGA4: async (url: string): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tools/scan-ga4?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error('GA4 ID not found');
        }
        const data = await response.json();
        return data.tid;
    },

    spendCredits: (amount: number, description: string): boolean => {
        const user = db.getCurrentUser();
        if (!user || user.balance < amount) return false;

        // Optimistic update
        user.balance -= amount;
        db.setCurrentUser(user);

        // Async sync with backend (fire and forget)
        db.purchaseCredits(-amount, description).catch(console.error);

        return true;
    },

    // Broadcasts
    getActiveBroadcasts: async (): Promise<Broadcast[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/broadcasts/active`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((b: any) => ({
                id: b.id,
                title: b.title,
                message: b.message,
                type: b.type,
                isActive: b.is_active,
                createdAt: b.created_at,
                expiresAt: b.expires_at,
                actionUrl: b.action_url,
                actionText: b.action_text
            }));
        } catch (e) {
            console.error("Failed to fetch active broadcasts", e);
            return [];
        }
    },

    getAdminBroadcasts: async (): Promise<Broadcast[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((b: any) => ({
                id: b.id,
                title: b.title,
                message: b.message,
                type: b.type,
                isActive: b.is_active,
                createdAt: b.created_at,
                expiresAt: b.expires_at,
                actionUrl: b.action_url,
                actionText: b.action_text
            }));
        } catch (e) {
            console.error("Failed to fetch admin broadcasts", e);
            return [];
        }
    },

    createBroadcast: async (broadcast: Partial<Broadcast>) => {
        const payload = {
            title: broadcast.title,
            message: broadcast.message,
            type: broadcast.type,
            is_active: broadcast.isActive,
            expires_at: broadcast.expiresAt ? new Date(broadcast.expiresAt).toISOString() : null,
            action_url: broadcast.actionUrl,
            action_text: broadcast.actionText
        };
        await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    updateBroadcast: async (id: string, broadcast: Partial<Broadcast>) => {
        const payload = {
            title: broadcast.title,
            message: broadcast.message,
            type: broadcast.type,
            is_active: broadcast.isActive,
            expires_at: broadcast.expiresAt ? new Date(broadcast.expiresAt).toISOString() : null,
            action_url: broadcast.actionUrl,
            action_text: broadcast.actionText
        };
        await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },

    deleteBroadcast: async (id: string) => {
        await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}`, {
            method: 'DELETE'
        });
    },

    getAdminStats: async (): Promise<AdminStats | null> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch admin stats", e);
            return null;
        }
    },

    // Marketing & Coupons (MOCK / LocalStorage)
    getCoupons: (): Coupon[] => {
        const data = localStorage.getItem('modus_coupons_cache');
        if (data) return JSON.parse(data);

        // Return some dummy data if empty
        const initial: Coupon[] = [
            { id: '1', code: 'WELCOME20', discountType: 'percent', discountValue: 20, active: true, usedCount: 45 },
            { id: '2', code: 'BLACKFRIDAY', discountType: 'fixed', discountValue: 50, active: false, usedCount: 120, expiryDate: '2025-11-29' }
        ];
        localStorage.setItem('modus_coupons_cache', JSON.stringify(initial));
        return initial;
    },

    saveCoupon: (coupon: Coupon) => {
        const coupons = db.getCoupons();
        const index = coupons.findIndex(c => c.id === coupon.id);
        if (index >= 0) {
            coupons[index] = coupon;
        } else {
            coupons.push(coupon);
        }
        localStorage.setItem('modus_coupons_cache', JSON.stringify(coupons));
    },

    deleteCoupon: (id: string) => {
        const coupons = db.getCoupons().filter(c => c.id !== id);
        localStorage.setItem('modus_coupons_cache', JSON.stringify(coupons));
    },

    getMarketingStats: (): MarketingCampaign[] => {
        const data = localStorage.getItem('modus_marketing_cache');
        if (data) return JSON.parse(data);

        // Dummy Data
        const initial: MarketingCampaign[] = [
            { id: '1', name: 'Welcome Email Sequence', type: 'email', status: 'active', sentCount: 12500, openRate: 45, clickRate: 12, dateCreated: '2024-01-15' },
            { id: '2', name: 'Google Ads Q1', type: 'ad_tracking', status: 'active', utmSource: 'google_ads', clicks: 8500, conversions: 320, revenue: 14500, dateCreated: '2024-01-01' },
            { id: '3', name: 'Newsletter: Feb Update', type: 'email', status: 'ended', sentCount: 5000, openRate: 38, clickRate: 5, dateCreated: '2024-02-01' }
        ];
        localStorage.setItem('modus_marketing_cache', JSON.stringify(initial));
        return initial;
    }
};
