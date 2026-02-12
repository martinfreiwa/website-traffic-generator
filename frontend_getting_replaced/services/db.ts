import { Project, PriceClass, ProjectSettings, Transaction, User, Ticket, SystemSettings, Notification, TrafficLog, SystemAlert, LiveVisitor } from '../types';

const ENV_API_URL = (import.meta as any).env?.VITE_API_URL;
const API_BASE_URL = (ENV_API_URL && !ENV_API_URL.includes('trycloudflare.com'))
    ? ENV_API_URL
    : (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.port === '3000' ||
            window.location.port === '5173')
        ? "http://localhost:8001"
        : window.location.origin);

let authToken = localStorage.getItem('tgp_token');

export const fetchWithAuth = async (url: string, options: any = {}) => {
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            authToken = null;
            localStorage.removeItem('tgp_token');
            window.dispatchEvent(new Event('auth-expired'));
        }
        return response;
    } catch (e) {
        console.error(`[DB] Fetch error for ${url}:`, e);
        throw e;
    }
};

const mapUser = (u: any): User => ({
    id: u.id,
    email: u.email,
    name: u.name || u.email.split('@')[0],
    role: u.role,
    balance: u.balance,
    status: u.status || 'active',
    joinedDate: u.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    projectsCount: u.projects_count || 0,
    apiKey: u.api_key,
    api_access_status: u.api_access_status || 'none',
    api_application_data: u.api_application_data,
    avatarUrl: u.avatar_url,
    phone: u.phone,
    telegram: u.telegram,
    company: u.company,
    vatId: u.vat_id,
    address: u.address,
    city: u.city,
    zip: u.zip,
    country: u.country,
    preferences: u.preferences
});

export const db = {
    init: () => {
        console.log("Remote Database Initialized");
    },

    getCurrentUser: (): User | undefined => {
        try {
            const userData = localStorage.getItem('modus_current_user');
            return userData ? JSON.parse(userData) : undefined;
        } catch (e) {
            return undefined;
        }
    },

    setCurrentUser: (user: User | null) => {
        if (user) {
            localStorage.setItem('modus_current_user', JSON.stringify(user));
            localStorage.setItem('modus_current_user_id', user.id);
        } else {
            localStorage.removeItem('modus_current_user');
            localStorage.removeItem('modus_current_user_id');
        }
    },

    login: async (email: string, pass: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', pass);

        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Invalid email or password");
        }

        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('tgp_token', authToken);

        const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        if (!userRes.ok) throw new Error("Could not fetch user profile");

        const userData = await userRes.json();
        const user = mapUser(userData);
        db.setCurrentUser(user);
        return user;
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

    fetchMe: async (): Promise<number> => {
        const user = db.getCurrentUser();
        if (!user) return 0;

        try {
            const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
            if (!userRes.ok) return user.balance;

            const userData = await userRes.json();
            const updatedUser = mapUser(userData);
            db.setCurrentUser(updatedUser);
            return updatedUser.balance;
        } catch (e) {
            return user.balance;
        }
    },

    changePassword: async (old_password: string, new_password: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            body: JSON.stringify({ old_password, new_password })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to change password");
        }
        return await response.json();
    },

    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to upload avatar");
        }

        const data = await response.json();
        const user = db.getCurrentUser();
        if (user) {
            db.setCurrentUser({ ...user, avatarUrl: data.avatar_url });
        }
        return data.avatar_url;
    },

    updateUserProfile: async (user: User) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            body: JSON.stringify({
                name: user.name,
                phone: user.phone,
                telegram: user.telegram,
                company: user.company,
                vat_id: user.vatId,
                address: user.address,
                city: user.city,
                zip: user.zip,
                country: user.country,
                preferences: user.preferences
            })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to update profile");
        }
        const updatedData = await response.json();
        const updatedUser = mapUser(updatedData);
        db.setCurrentUser(updatedUser);
        return updatedUser;
    },

    generateApiKey: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/api-key`, { method: 'POST' });
        if (!response.ok) throw new Error("Failed to generate API Key");
        await db.fetchMe();
        return db.getCurrentUser()?.apiKey;
    },

    applyForApi: async (usage: string, websites: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/me/apply-api`, {
            method: 'POST',
            body: JSON.stringify({ usage_description: usage, target_websites: websites })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to submit application");
        }
        return await response.json();
    },

    getProjects: (): Project[] => {
        try {
            const data = localStorage.getItem('modus_projects_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    syncProjects: async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects`);
            if (!response.ok) return;
            const data = await response.json();
            const mapped: Project[] = data.map((p: any) => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                plan: p.plan_type,
                status: p.status,
                expires: p.expires_at || 'Never',
                settings: p.settings,
                customTarget: {
                    dailyLimit: p.daily_limit,
                    totalVisitors: p.total_target,
                    durationDays: 0
                },
                stats: []
            }));
            localStorage.setItem('modus_projects_cache', JSON.stringify(mapped));
        } catch (e) { console.error("Failed to sync projects:", e); }
    },

    getProjectById: (id: string): Project | undefined => {
        return db.getProjects().find(p => p.id === id);
    },

    addProject: async (project: Project) => {
        const projectData = {
            name: project.name,
            plan_type: project.plan,
            settings: project.settings,
            daily_limit: project.customTarget?.dailyLimit || 0,
            total_target: project.customTarget?.totalVisitors || 0
        };
        const response = await fetchWithAuth(`${API_BASE_URL}/projects`, { method: 'POST', body: JSON.stringify(projectData) });
        if (!response.ok) throw new Error("Failed to create project");
        await db.syncProjects();
        return db.getProjects();
    },

    updateProject: async (project: Project) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/projects/${project.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: project.name,
                plan_type: project.plan,
                settings: project.settings,
                daily_limit: project.customTarget?.dailyLimit,
                total_target: project.customTarget?.totalVisitors
            })
        });
        if (!response.ok) throw new Error("Failed to update project");
        await db.syncProjects();
        return db.getProjects();
    },

    updateProjectStatus: async (id: string, status: 'active' | 'stopped' | 'completed') => {
        const endpoint = status === 'active' ? 'start' : 'stop';
        await fetchWithAuth(`${API_BASE_URL}/projects/${id}/${endpoint}`, { method: 'POST' });
        await db.syncProjects();
        return db.getProjects();
    },

    getTemplates: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/templates`);
        if (!response.ok) return [];
        return await response.json();
    },

    saveTemplate: async (name: string, settings: ProjectSettings) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/templates`, { method: 'POST', body: JSON.stringify({ name, settings }) });
        if (!response.ok) throw new Error("Failed to save template");
        return await response.json();
    },

    deleteTemplate: async (id: string) => {
        await fetchWithAuth(`${API_BASE_URL}/templates/${id}`, { method: 'DELETE' });
    },

    getBalance: (): number => {
        return db.getCurrentUser()?.balance || 0;
    },

    spendCredits: async (amount: number, description: string): Promise<boolean> => {
        const user = db.getCurrentUser();
        if (!user || user.balance < amount) return false;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/webhooks/deposit`, {
                method: 'POST',
                body: JSON.stringify({ user_email: user.email, amount: -amount, description: description })
            });
            if (!response.ok) return false;
            const data = await response.json();
            db.setCurrentUser({ ...user, balance: data.new_balance });
            await db.syncTransactions();
            return true;
        } catch (e) { return false; }
    },

    purchaseCredits: async (amount: number, description: string) => {
        const user = db.getCurrentUser();
        if (!user) return 0;
        await fetchWithAuth(`${API_BASE_URL}/webhooks/deposit`, { method: 'POST', body: JSON.stringify({ user_email: user.email, amount: amount, description: description }) });
        return await db.fetchMe();
    },

    getTransactions: (): Transaction[] => {
        try {
            const data = localStorage.getItem('modus_transactions_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    syncTransactions: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/transactions`);
        if (!response.ok) return [];
        const data = await response.json();
        const mapped: Transaction[] = data.map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            desc: t.description || t.desc,
            amount: t.amount,
            status: t.status || 'completed',
            type: t.type,
            userId: t.user_id || t.userId
        }));
        localStorage.setItem('modus_transactions_cache', JSON.stringify(mapped));
        return mapped;
    },

    getUsers: (): User[] => {
        try {
            const data = localStorage.getItem('modus_users_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    syncUsers: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`);
        if (!response.ok) return [];
        const data = await response.json();
        const mapped = data.map(mapUser);
        localStorage.setItem('modus_users_cache', JSON.stringify(mapped));
        return mapped;
    },

    updateUserStatus: (id: string, status: User['status']) => {
        const users = db.getUsers();
        const updated = users.map(u => u.id === id ? { ...u, status } : u);
        localStorage.setItem('modus_users_cache', JSON.stringify(updated));
        return updated;
    },

    adminAdjustBalance: async (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => {
        const users = db.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;
        await fetchWithAuth(`${API_BASE_URL}/webhooks/deposit`, {
            method: 'POST',
            body: JSON.stringify({ user_email: user.email, amount: type === 'credit' ? amount : -amount, description: reason })
        });
        await db.syncUsers();
        await db.syncAllTransactions();
    },

    getAllTransactionsAdmin: (): Transaction[] => {
        try {
            const data = localStorage.getItem('modus_admin_transactions_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    syncAllTransactions: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/transactions`);
        if (!response.ok) return [];
        const data = await response.json();
        const mapped: Transaction[] = data.map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            desc: t.description || t.desc,
            amount: t.amount,
            status: t.status || 'completed',
            type: t.type,
            userId: t.user_id || t.userId
        }));
        localStorage.setItem('modus_admin_transactions_cache', JSON.stringify(mapped));
        return mapped;
    },

    getApiApplications: async (status: string = 'pending') => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/api-applications?status=${status}`);
        if (!response.ok) return [];
        return await response.json();
    },

    approveApiAccess: async (userId: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/api-applications/${userId}/approve`, { method: 'POST' });
        if (!response.ok) throw new Error("Failed to approve");
        return await response.json();
    },

    rejectApiAccess: async (userId: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/api-applications/${userId}/reject`, { method: 'POST' });
        if (!response.ok) throw new Error("Failed to reject");
        return await response.json();
    },

    getTickets: (): Ticket[] => {
        try {
            const data = localStorage.getItem('modus_tickets_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    syncTickets: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets`);
        if (!response.ok) return;
        const data = await response.json();
        const mapped: Ticket[] = data.map((t: any) => ({
            id: t.id,
            type: t.type || 'ticket',
            userId: t.user_id,
            userName: t.user_email?.split('@')[0] || 'User',
            subject: t.subject,
            status: t.status || 'open',
            priority: t.priority || 'low',
            date: t.created_at?.split('T')[0] || new Date().toLocaleDateString(),
            lastMessage: t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1].text : 'No messages',
            messages: t.messages || [],
            unread: false
        }));
        localStorage.setItem('modus_tickets_cache', JSON.stringify(mapped));
    },

    updateTicketStatus: (id: string, status: Ticket['status']) => {
        const tickets = db.getTickets();
        const updated = tickets.map(t => t.id === id ? { ...t, status } : t);
        localStorage.setItem('modus_tickets_cache', JSON.stringify(updated));
        return updated;
    },

    replyToTicket: async (ticketId: string, text: string, sender: 'user' | 'admin' | 'guest') => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/reply`, { method: 'POST', body: JSON.stringify({ text, sender }) });
        return response.ok;
    },

    getNotifications: (): Notification[] => {
        try {
            const data = localStorage.getItem('modus_notifications_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
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

    markNotificationRead: async (id: string) => {
        await fetchWithAuth(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' });
        await db.syncNotifications();
    },

    getAlerts: (): SystemAlert[] => {
        try {
            const data = localStorage.getItem('modus_alerts_cache');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    createAlert: (message: string, type: any, targetType: string, targetUserIds: string[], countdownEnds?: string) => {
        const alerts = db.getAlerts();
        const newAlert: SystemAlert = { id: `alert-${Date.now()}`, message, type, active: true, date: new Date().toISOString(), targetType: targetType as any, targetUserIds, countdownEnds };
        localStorage.setItem('modus_alerts_cache', JSON.stringify([newAlert, ...alerts]));
        return [newAlert, ...alerts];
    },

    toggleAlert: (id: string, active: boolean) => {
        const updated = db.getAlerts().map(a => a.id === id ? { ...a, active } : a);
        localStorage.setItem('modus_alerts_cache', JSON.stringify(updated));
        return updated;
    },

    deleteAlert: (id: string) => {
        const updated = db.getAlerts().filter(a => a.id !== id);
        localStorage.setItem('modus_alerts_cache', JSON.stringify(updated));
        return updated;
    },

    getSystemSettings: (): SystemSettings => {
        try {
            const data = localStorage.getItem('modus_settings_cache');
            return data ? JSON.parse(data) : { siteName: 'Traffic Creator', maintenanceMode: false, allowRegistrations: true, supportEmail: 'support@traffic.com', minDeposit: 10 };
        } catch (e) { return { siteName: 'Traffic Creator', maintenanceMode: false, allowRegistrations: true, supportEmail: 'support@traffic.com', minDeposit: 10 }; }
    },

    syncSettings: async () => {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (!response.ok) return;
        const data = await response.json();
        localStorage.setItem('modus_settings_cache', JSON.stringify(data.settings));
    },

    saveSystemSettings: async (settings: SystemSettings) => {
        await fetchWithAuth(`${API_BASE_URL}/settings`, { method: 'PUT', body: JSON.stringify({ settings }) });
        localStorage.setItem('modus_settings_cache', JSON.stringify(settings));
    },

    setGlobalTrafficStatus: async (enabled: boolean) => {
        await fetchWithAuth(`${API_BASE_URL}/admin/system/traffic?enabled=${enabled}`, { method: 'POST' });
    },

    syncAll: async () => {
        await Promise.all([db.syncProjects(), db.syncTransactions(), db.syncSettings(), db.syncUsers(), db.syncAllTransactions(), db.syncTickets(), db.syncNotifications()]);
    },

    trackPresence: () => {},
    logClientError: async () => {},
    findTid: async (url: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/find-tid?url=${encodeURIComponent(url)}`);
        return response.ok ? await response.json() : null;
    },
    getPricing: () => [
        { id: 'foundation', name: 'Foundation', hourlyRate: 0.58, baseFee: 29, examFee: 0 },
        { id: 'momentum', name: 'Momentum', hourlyRate: 0.43, baseFee: 129, examFee: 0 },
        { id: 'breakthrough', name: 'Breakthrough', hourlyRate: 0.40, baseFee: 399, examFee: 0 },
        { id: 'apex', name: 'Apex', hourlyRate: 0.33, baseFee: 999, examFee: 0 },
    ],
    getRealTimeVisitors: async () => []
};
