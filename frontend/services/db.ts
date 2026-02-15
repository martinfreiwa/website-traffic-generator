
import { Project, PriceClass, ProjectSettings, Transaction, User, Ticket, SystemSettings, Notification, TrafficLog, SystemAlert, LiveVisitor, Broadcast, AdminStats, Coupon, MarketingCampaign, ConversionSettings, ActivityLog, UserSession, ImpersonationLog, BalanceAdjustmentLog, EmailLog, UserNotificationPrefs, UserReferral, AdminUserDetails } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;


const getStorageItem = (key: string) => {
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
    }
    return null;
};

let authToken = getStorageItem('tgp_token');
let currentUserId = getStorageItem('modus_current_user_id');

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

    logout: () => {
        authToken = null;
        currentUserId = null;
        localStorage.removeItem('tgp_token');
        localStorage.removeItem('modus_current_user');
        localStorage.removeItem('modus_current_user_id');
        window.localStorage.clear();
        window.location.href = '/login';
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
            balanceEconomy: userData.balance_economy,
            balanceProfessional: userData.balance_professional,
            balanceExpert: userData.balance_expert,
            status: 'active',
            joinedDate: userData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            projectsCount: 0,
            apiKey: userData.api_key,
            isVerified: userData.is_verified ?? false,

            phone: userData.phone,
            company: userData.company,
            vatId: userData.vat_id,
            address: userData.address,
            city: userData.city,
            country: userData.country,
            zip: userData.zip,
            website: userData.website,
            displayName: userData.display_name,
            bio: userData.bio,
            jobTitle: userData.job_title,
            publicProfile: userData.public_profile,
            twoFactorEnabled: userData.two_factor_enabled,
            emailFrequency: userData.email_frequency,
            loginNotificationEnabled: userData.login_notification_enabled,
            newsletterSub: userData.newsletter_sub,
            soundEffects: userData.sound_effects,
            developerMode: userData.developer_mode,
            apiWhitelist: userData.api_whitelist,
            webhookSecret: userData.webhook_secret,
            accessibility: userData.accessibility,
            socialLinks: userData.social_links,
            loginHistory: userData.login_history,
            recoveryEmail: userData.recovery_email,
            timezone: userData.timezone,
            language: userData.language,
            themeAccentColor: userData.theme_accent_color,
            skillsBadges: userData.skills_badges,
            referralCode: userData.referral_code,
            supportPin: userData.support_pin,
            dateFormat: userData.date_format,
            numberFormat: userData.number_format,
            requirePasswordReset: userData.require_password_reset
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

    verifyEmail: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Email verification failed');
        }
        return await response.json();
    },

    resendVerificationEmail: async (email: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to resend verification email');
        }
        return await response.json();
    },

    forgotPassword: async (email: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to send reset email');
        }
        return await response.json();
    },

    resetPassword: async (token: string, newPassword: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Password reset failed');
        }
        return await response.json();
    },

    // Projects
    getProjects: (): Project[] => {
        const data = localStorage.getItem('modus_projects_cache');
        return data ? JSON.parse(data) : [];
    },

    getAdminProjects: (): Project[] => {
        const data = localStorage.getItem('modus_admin_projects_cache');
        return data ? JSON.parse(data) : [];
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
                plan: p.plan_type || 'Custom',
                tier: p.tier,
                status: p.status,
                expires: p.expires_at || 'Never',
                createdAt: p.created_at,
                settings: p.settings,
                stats: []
            }));

            localStorage.setItem('modus_projects_cache', JSON.stringify(mapped));
        } catch (e) {
            console.error("Failed to sync projects:", e);
        }
    },

    syncAdminProjects: async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects`);
            if (!response.ok) return;
            const data = await response.json();

            const mapped: Project[] = data.map((p: any) => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                plan: p.plan_type || 'Custom',
                tier: p.tier,
                status: p.status,
                expires: p.expires_at || 'Never',
                createdAt: p.created_at,
                settings: p.settings,
                stats: []
            }));

            localStorage.setItem('modus_admin_projects_cache', JSON.stringify(mapped));
        } catch (e) {
            console.error("Failed to sync admin projects:", e);
        }
    },

    getProjectById: (id: string): Project | undefined => {
        const projects = db.getProjects();
        let project = projects.find(p => p.id === id);
        if (!project) {
            const adminProjects = db.getAdminProjects();
            project = adminProjects.find(p => p.id === id);
        }
        return project;
    },

    addProject: async (project: Project) => {
        const projectData = {
            name: project.name,
            plan_type: project.plan,
            tier: project.tier,
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
        const payload = {
            name: project.name,
            settings: project.settings,
            daily_limit: project.customTarget?.dailyLimit || 0,
            total_target: project.customTarget?.totalVisitors || 0,
            status: project.status,
            tier: project.tier
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/projects/${project.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error("Failed to update project");
        }
        
        await db.syncProjects();
        return db.getProjects();
    },

    updateProjectStatus: async (id: string, status: 'active' | 'stopped' | 'completed') => {
        const endpoint = status === 'active' ? 'start' : 'stop';
        await fetchWithAuth(`${API_BASE_URL}/projects/${id}/${endpoint}`, { method: 'POST' });
        await db.syncProjects();
        return db.getProjects();
    },

    deleteProject: async (id: string) => {
        await fetchWithAuth(`${API_BASE_URL}/projects/${id}`, {
            method: 'DELETE'
        });
        await db.syncProjects();
        return db.getProjects();
    },

    // Bulk Actions
    bulkUpdateProjectStatus: async (ids: string[], status: 'active' | 'stopped') => {
        await Promise.all(ids.map(id =>
            fetchWithAuth(`${API_BASE_URL}/projects/${id}/${status === 'active' ? 'start' : 'stop'}`, { method: 'POST' })
        ));
        await db.syncProjects();
        return db.getProjects();
    },

    bulkDeleteProjects: async (ids: string[]) => {
        await Promise.all(ids.map(id =>
            fetchWithAuth(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' })
        ));
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
            balanceEconomy: u.balance_economy,
            balanceProfessional: u.balance_professional,
            balanceExpert: u.balance_expert,
            status: u.status || 'active',
            joinedDate: u.created_at?.split('T')[0] || u.joinedDate || new Date().toISOString().split('T')[0],
            projectsCount: u.projects_count || 0,
            plan: u.plan || 'free',
            shadowBanned: u.shadow_banned || false,
            isVerified: u.is_verified || false,
            notes: u.notes || '',
            tags: u.tags || [],
            banReason: u.ban_reason || '',
            lastIp: u.last_ip || '',
            lastActive: u.last_active || ''
        }));
        localStorage.setItem('modus_users_cache', JSON.stringify(mapped));
        return mapped;
    },

    updateUser: async (user: User) => {
        const users = db.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index >= 0) {
            users[index] = user;
            localStorage.setItem('modus_users_cache', JSON.stringify(users));
        }
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
            userId: t.user_id || t.userId,
            tier: t.tier,
            hits: t.hits,
            reference: t.reference
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
            userId: t.user_id || t.userId,
            tier: t.tier,
            hits: t.hits,
            reference: t.reference
        }));
        localStorage.setItem('modus_admin_transactions_cache', JSON.stringify(mapped));
        return mapped;
    },

    createPaymentIntent: async (amount: number, currency: string = 'eur') => {
        const token = localStorage.getItem('tgp_token');
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_BASE_URL}/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, currency })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create payment intent');
        }
        return await response.json();
    },

    // Stripe Subscriptions
    createCheckoutSession: async (priceId: string) => {
        const token = localStorage.getItem('tgp_token');
        if (!token) throw new Error("Not authenticated");

        const currentOrigin = window.location.origin;
        const response = await fetch(`${API_BASE_URL}/subscriptions/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                price_id: priceId,
                success_url: `${currentOrigin}/dashboard?subscription=success`,
                cancel_url: `${currentOrigin}/pricing?subscription=cancelled`
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create checkout session');
        }
        return await response.json();
    },

    createPortalSession: async () => {
        const token = localStorage.getItem('tgp_token');
        if (!token) throw new Error("Not authenticated");

        const currentOrigin = window.location.origin;
        const response = await fetch(`${API_BASE_URL}/subscriptions/portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                return_url: `${currentOrigin}/dashboard`
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create portal session');
        }
        return await response.json();
    },

    getCurrentSubscription: async () => {
        const token = localStorage.getItem('tgp_token');
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get subscription');
        }
        return await response.json();
    },

    purchaseCredits: async (amount: number, description: string, tier?: string, hits?: number) => {
        const user = db.getCurrentUser();
        if (!user) return 0;

        await fetchWithAuth(`${API_BASE_URL}/webhooks/deposit`, {
            method: 'POST',
            body: JSON.stringify({
                user_email: user.email,
                amount: amount,
                description: description,
                tier: tier,
                hits: hits
            })
        });

        const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        const userData = await userRes.json();
        db.setCurrentUser({
            ...user,
            balance: userData.balance,
            balanceEconomy: userData.balance_economy,
            balanceProfessional: userData.balance_professional,
            balanceExpert: userData.balance_expert
        });
        await db.syncTransactions();
        return userData.balance; // We might want to return the specific balance but keeping signature for now
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
        console.log("Updating profile on backend:", user);

        // Map camelCase to snake_case for backend
        const updatePayload = {
            name: user.name,
            email: user.email,
            phone: user.phone,
            company: user.company,
            vat_id: user.vatId,
            address: user.address,
            city: user.city,
            country: user.country,
            zip: user.zip,
            website: user.website,
            display_name: user.displayName,
            bio: user.bio,
            job_title: user.jobTitle,
            public_profile: user.publicProfile,
            two_factor_enabled: user.twoFactorEnabled,
            email_frequency: user.emailFrequency,
            login_notification_enabled: user.loginNotificationEnabled,
            newsletter_sub: user.newsletterSub,
            sound_effects: user.soundEffects,
            developer_mode: user.developerMode,
            api_whitelist: user.apiWhitelist,
            webhook_secret: user.webhookSecret,
            accessibility: user.accessibility,
            social_links: user.socialLinks,
            recovery_email: user.recoveryEmail,
            timezone: user.timezone,
            language: user.language,
            theme_accent_color: user.themeAccentColor,
            date_format: user.dateFormat,
            number_format: user.numberFormat,
            require_password_reset: user.requirePasswordReset
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to update profile");
        }

        const updatedUser = await response.json();
        // Update local state with the returned mapped user if needed,
        // but for now we'll just update localStorage with the current frontend object
        // assuming it's consistent.
        db.setCurrentUser(user);
    },

    regenerateApiKey: async (): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/api-key`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error("Failed to regenerate key");
        const data = await response.json();

        const user = db.getCurrentUser();
        if (user) {
            user.apiKey = data.api_key;
            db.setCurrentUser(user);
        }
        return data.api_key;
    },

    changePassword: async (current: string, newPass: string, confirm: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/password`, {
            method: 'PUT',
            body: JSON.stringify({ current_password: current, new_password: newPass, confirm_password: confirm })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Password update failed");
        }
        return await response.json();
    },

    logoutAllSessions: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout-all`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error("Failed to logout all sessions");
        return await response.json();
    },

    exportUserData: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/me/export`);
        if (!response.ok) throw new Error("Export failed");
        return await response.json();
    },

    uploadAvatar: async (file: File): Promise<string> => {
        const token = localStorage.getItem('tgp_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) throw new Error("Avatar upload failed");

        const data = await response.json();
        const user = db.getCurrentUser();
        if (user) {
            user.avatarUrl = data.avatar_url;
            db.setCurrentUser(user);
        }
        return data.avatar_url;
    },

    deleteAccount: async (): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Account deletion failed");
        db.logout();
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'GA4 ID not found');
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
    },

    // Conversion Settings
    getConversionSettings: (): ConversionSettings => {
        const data = localStorage.getItem('modus_conversion_settings');
        if (data) return JSON.parse(data);

        const initial: ConversionSettings = {
            socialProof: {
                enabled: true,
                position: 'bottom-left',
                delay: 5,
                showRealData: false,
                customMessages: ['Someone in New York purchased Momentum Plan', 'New user joined from London']
            },
            exitIntent: {
                enabled: false,
                headline: 'Wait! Don\'t miss out.',
                subtext: 'Get 20% off your first month with code: STAY20',
                couponCode: 'STAY20',
                showOncePerSession: true
            },
            promoBar: {
                enabled: false,
                message: 'Limited Time Offer: Get 50% off all annual plans!',
                buttonText: 'Claim Offer',
                buttonLink: '/pricing',
                backgroundColor: '#ff4d00',
                textColor: '#ffffff'
            }
        };
        localStorage.setItem('modus_conversion_settings', JSON.stringify(initial));
        return initial;
    },

    saveConversionSettings: (settings: ConversionSettings) => {
        localStorage.setItem('modus_conversion_settings', JSON.stringify(settings));
    },

    // Loyalty & Referrals
    getLoyaltySettings: (): import('../types').LoyaltySettings => {
        const data = localStorage.getItem('modus_loyalty_settings');
        if (data) return JSON.parse(data);
        const initial = { enabled: false, pointsPerDollar: 1, redemptionRate: 100, bonusSignupPoints: 50 };
        localStorage.setItem('modus_loyalty_settings', JSON.stringify(initial));
        return initial;
    },

    saveLoyaltySettings: (settings: import('../types').LoyaltySettings) => {
        localStorage.setItem('modus_loyalty_settings', JSON.stringify(settings));
    },

    getReferralSettings: (): import('../types').ReferralSettings => {
        const data = localStorage.getItem('modus_referral_settings');
        if (data) return JSON.parse(data);
        const initial = { enabled: false, referrerReward: 25, refereeReward: 25, rewardType: 'credit' as const };
        localStorage.setItem('modus_referral_settings', JSON.stringify(initial));
        return initial;
    },

    saveReferralSettings: (settings: import('../types').ReferralSettings) => {
        localStorage.setItem('modus_referral_settings', JSON.stringify(settings));
    },

    getBankTransfers: async (statusFilter: string = 'all'): Promise<any[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/bank-transfers?status_filter=${statusFilter}`);
        if (!response.ok) return [];
        return await response.json();
    },

    getMyBankTransfers: async (): Promise<any[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/bank-transfer/my-proofs`);
        if (!response.ok) return [];
        return await response.json();
    },

    approveBankTransfer: async (proofId: string, approved: boolean, adminNotes?: string): Promise<any> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/bank-transfers/${proofId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ approved, admin_notes: adminNotes })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to process transfer");
        }
        return await response.json();
    },

    updateTransaction: async (trx: Transaction): Promise<Transaction> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/transactions/${trx.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                description: trx.desc,
                amount: trx.amount,
                type: trx.type,
                status: trx.status,
                tier: trx.tier,
                reference: trx.reference
            })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to update transaction");
        }
        const updated = await response.json();
        await db.syncAllTransactions();
        return {
            id: updated.id,
            date: updated.created_at?.split('T')[0] || trx.date,
            desc: updated.description || trx.desc,
            amount: updated.amount,
            status: updated.status,
            type: updated.type,
            userId: updated.user_id,
            tier: updated.tier,
            reference: updated.reference
        };
    },

    // Admin User Details
    getUserDetails: async (userId: string): Promise<any> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/details`);
        if (!response.ok) throw new Error('Failed to fetch user details');
        const data = await response.json();

        return {
            user: {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                balance: data.user.balance,
                balanceEconomy: data.user.balance_economy,
                balanceProfessional: data.user.balance_professional,
                balanceExpert: data.user.balance_expert,
                status: data.user.status,
                plan: data.user.plan,
                isVerified: data.user.is_verified,
                shadowBanned: data.user.shadow_banned,
                notes: data.user.notes,
                tags: data.user.tags || [],
                banReason: data.user.ban_reason,
                lastIp: data.user.last_ip,
                joinedDate: data.user.created_at?.split('T')[0]
            },
            tierBalances: data.tier_balances,
            totalSpent: data.total_spent,
            totalHitsPurchased: data.total_hits_purchased,
            totalHitsUsed: data.total_hits_used,
            transactionsCount: data.transactions_count,
            projectsCount: data.projects_count,
            ticketsCount: data.tickets_count,
            referralsCount: data.referrals_count,
            referralEarnings: data.referral_earnings,
            notificationPrefs: data.notification_prefs
        };
    },

    getUserActivity: async (userId: string, limit = 50, offset = 0, actionType?: string): Promise<ActivityLog[]> => {
        let url = `${API_BASE_URL}/admin/users/${userId}/activity?limit=${limit}&offset=${offset}`;
        if (actionType) url += `&action_type=${actionType}`;

        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error('Failed to fetch activity');
        const data = await response.json();

        return data.map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            actionType: a.action_type,
            actionDetail: a.action_detail,
            ipAddress: a.ip_address,
            userAgent: a.user_agent,
            createdAt: a.created_at
        }));
    },

    getUserSessions: async (userId: string): Promise<UserSession[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/sessions`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data = await response.json();

        return data.map((s: any) => ({
            id: s.id,
            userId: s.user_id,
            ipAddress: s.ip_address,
            userAgent: s.user_agent,
            deviceInfo: s.device_info,
            location: s.location,
            createdAt: s.created_at,
            lastActivity: s.last_activity,
            expiresAt: s.expires_at,
            isActive: s.is_active
        }));
    },

    terminateUserSession: async (userId: string, sessionId: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to terminate session');
    },

    getImpersonationLog: async (userId: string): Promise<ImpersonationLog[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/impersonation-log`);
        if (!response.ok) throw new Error('Failed to fetch impersonation log');
        const data = await response.json();

        return data.map((l: any) => ({
            id: l.id,
            adminId: l.admin_id,
            targetUserId: l.target_user_id,
            action: l.action,
            ipAddress: l.ip_address,
            createdAt: l.created_at,
            adminEmail: l.admin_email
        }));
    },

    getBalanceAdjustments: async (userId: string): Promise<BalanceAdjustmentLog[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/balance-adjustments`);
        if (!response.ok) throw new Error('Failed to fetch balance adjustments');
        const data = await response.json();

        return data.map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            adminId: a.admin_id,
            adjustmentType: a.adjustment_type,
            tier: a.tier,
            amount: a.amount,
            hits: a.hits,
            reason: a.reason,
            notes: a.notes,
            createdAt: a.created_at,
            adminEmail: a.admin_email
        }));
    },

    adjustUserBalance: async (userId: string, adjustment: {
        adjustmentType: string;
        tier: string;
        amount: number;
        hits?: number;
        reason: string;
        notes?: string;
    }): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/adjust-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adjustment)
        });
        if (!response.ok) throw new Error('Failed to adjust balance');
    },

    addBonusHits: async (userId: string, request: {
        tier: string;
        hits: number;
        reason: string;
    }): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/add-bonus-hits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        if (!response.ok) throw new Error('Failed to add bonus hits');
    },

    getUserEmails: async (userId: string, limit = 50): Promise<EmailLog[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/emails?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch emails');
        const data = await response.json();

        return data.map((e: any) => ({
            id: e.id,
            userId: e.user_id,
            emailType: e.email_type,
            toEmail: e.to_email,
            subject: e.subject,
            status: e.status,
            errorMessage: e.error_message,
            sentAt: e.sent_at,
            deliveredAt: e.delivered_at
        }));
    },

    getUserReferrals: async (userId: string): Promise<{ referrals: UserReferral[]; totalReferrals: number; totalEarnings: number }> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/referrals`);
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();

        return {
            referrals: (data.referrals || []).map((r: any) => ({
                id: r.id,
                email: r.email,
                name: r.name,
                status: r.status,
                createdAt: r.created_at,
                totalSpent: r.total_spent,
                earningsFromRef: r.earnings_from_ref
            })),
            totalReferrals: data.total_referrals,
            totalEarnings: data.total_earnings
        };
    },

    getUserNotificationPrefs: async (userId: string): Promise<UserNotificationPrefs> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/notification-prefs`);
        if (!response.ok) throw new Error('Failed to fetch notification prefs');
        const data = await response.json();

        return {
            id: data.id,
            userId: data.user_id,
            emailMarketing: data.email_marketing,
            emailTransactional: data.email_transactional,
            emailAlerts: data.email_alerts,
            browserNotifications: data.browser_notifications,
            newsletterSub: data.newsletter_sub,
            emailFrequency: data.email_frequency,
            updatedAt: data.updated_at
        };
    },

    updateUserNotificationPrefs: async (userId: string, prefs: Partial<UserNotificationPrefs>): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/notification-prefs`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefs)
        });
        if (!response.ok) throw new Error('Failed to update notification prefs');
    },

    sendPasswordReset: async (userId: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/send-password-reset`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to send password reset');
    },

    resendVerification: async (userId: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/resend-verification`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to resend verification');
    },

    adminRegenerateApiKey: async (userId: string): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/regenerate-api-key`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to regenerate API key');
        const data = await response.json();
        return data.api_key;
    },

    startImpersonation: async (userId: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/impersonate/${userId}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to start impersonation');
        const data = await response.json();

        // 0. Backup Admin Token
        if (authToken) {
            localStorage.setItem('tgp_admin_token', authToken);
        }

        // 1. Set new token
        localStorage.setItem('tgp_token', data.token);
        authToken = data.token; // Update module-scope variable

        // 2. Fetch User Details with new token
        const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        if (!userRes.ok) throw new Error('Failed to fetch impersonated user details');
        const userData = await userRes.json();

        // 3. Map and Set Current User
        const mappedUser: User = {
            id: userData.id,
            email: userData.email,
            name: (userData.name || userData.email.split('@')[0]),
            role: userData.role,
            balance: userData.balance,
            balanceEconomy: userData.balance_economy,
            balanceProfessional: userData.balance_professional,
            balanceExpert: userData.balance_expert,
            status: userData.status,
            plan: userData.plan,
            isVerified: userData.is_verified,
            shadowBanned: userData.shadow_banned,
            notes: userData.notes,
            tags: userData.tags,
            banReason: userData.ban_reason,
            createdAt: userData.created_at,
            joinedDate: userData.created_at || new Date().toISOString(),
            projectsCount: 0,
            lastIp: userData.last_ip,
            lastActive: userData.last_active,

            // Extended Profile
            phone: userData.phone,
            company: userData.company,
            vatId: userData.vat_id,
            address: userData.address,
            city: userData.city,
            country: userData.country,
            zip: userData.zip,
            website: userData.website,
            displayName: userData.display_name,
            bio: userData.bio,
            jobTitle: userData.job_title,
            publicProfile: userData.public_profile,
            twoFactorEnabled: userData.two_factor_enabled,
            emailFrequency: userData.email_frequency,
            loginNotificationEnabled: userData.login_notification_enabled,
            newsletterSub: userData.newsletter_sub,
            soundEffects: userData.sound_effects,
            developerMode: userData.developer_mode,
            apiWhitelist: userData.api_whitelist,
            webhookSecret: userData.webhook_secret,
            accessibility: userData.accessibility,
            socialLinks: userData.social_links,
            recoveryEmail: userData.recovery_email,
            timezone: userData.timezone,
            language: userData.language,
            themeAccentColor: userData.theme_accent_color,
            dateFormat: userData.date_format,
            numberFormat: userData.number_format,
            requirePasswordReset: userData.require_password_reset
        };

        db.setCurrentUser(mappedUser);
    },

    stopImpersonation: async (): Promise<void> => {
        const adminToken = localStorage.getItem('tgp_admin_token');
        if (!adminToken) throw new Error('No admin session found');

        // 1. Restore Admin Token
        localStorage.setItem('tgp_token', adminToken);
        authToken = adminToken;
        localStorage.removeItem('tgp_admin_token');

        // 2. Fetch Admin User Details
        const userRes = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        if (!userRes.ok) throw new Error('Failed to restore admin user details');
        const userData = await userRes.json();

        // 3. Map and Set Current User (can reuse login logic but duplicative here for now)
        const mappedUser: User = {
            id: userData.id,
            email: userData.email,
            name: (userData.name || userData.email.split('@')[0]),
            role: userData.role,
            balance: userData.balance,
            balanceEconomy: userData.balance_economy,
            balanceProfessional: userData.balance_professional,
            balanceExpert: userData.balance_expert,
            status: userData.status,
            plan: userData.plan,
            isVerified: userData.is_verified,
            shadowBanned: userData.shadow_banned,
            notes: userData.notes,
            tags: userData.tags,
            banReason: userData.ban_reason,
            createdAt: userData.created_at,
            joinedDate: userData.created_at || new Date().toISOString(),
            projectsCount: 0,
            lastIp: userData.last_ip,
            lastActive: userData.last_active,
            // ... minimal fields sufficient for redirect, complete mapping ideally
        };

        db.setCurrentUser(mappedUser);
    },

    adminExportUserData: async (userId: string): Promise<any> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/export`);
        if (!response.ok) throw new Error('Failed to export user data');
        return response.json();
    },

    // Get admin user transactions with hits
    getUserTransactions: async (userId: string): Promise<Transaction[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/transactions`);
        if (!response.ok) return [];

        // Filter transactions for this user from the cached/local response
        const data = await response.json();
        const userTransactions = data.filter((t: any) => t.user_id === userId);

        return userTransactions.map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            desc: t.description || '',
            amount: t.amount,
            status: t.status || 'completed',
            type: t.type,
            userId: t.user_id,
            tier: t.tier,
            hits: t.hits,
            reference: t.reference
        }));
    },

    // Get admin user projects
    getUserProjects: async (userId: string): Promise<Project[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects`);
        if (!response.ok) return [];

        const data = await response.json();
        const userProjects = data.filter((p: any) => p.user_id === userId);

        return userProjects.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            plan: p.plan_type || 'Custom',
            tier: p.tier,
            status: p.status,
            customTarget: {
                totalVisitors: p.total_target || 0,
                durationDays: 30,
                dailyLimit: p.daily_limit || 0
            },
            expires: p.expires_at?.split('T')[0] || '',
            createdAt: p.created_at,
            settings: p.settings
        }));
    },

    // Get admin user tickets
    getUserTickets: async (userId: string): Promise<Ticket[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets`);
        if (!response.ok) return [];

        const data = await response.json();
        const userTickets = data.filter((t: any) => t.user_id === userId);

        return userTickets.map((t: any) => ({
            id: t.id,
            type: t.type || 'ticket',
            userId: t.user_id,
            userName: '',
            subject: t.subject,
            status: t.status || 'open',
            priority: t.priority || 'low',
            date: t.created_at?.split('T')[0] || '',
            lastMessage: t.messages?.length > 0 ? t.messages[t.messages.length - 1].text : '',
            messages: t.messages || [],
            unread: false
        }));
    },

    adminUpdateUser: async (userId: string, data: any): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update user');
    }
};
