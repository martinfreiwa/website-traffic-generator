/// <reference types="vite/client" />
import { Project, PriceClass, ProjectSettings, Transaction, User, Ticket, SystemSettings, Notification, TrafficLog, SystemAlert, LiveVisitor, Broadcast, AdminStats, Coupon, MarketingCampaign, ConversionSettings, ActivityLog, UserSession, ImpersonationLog, BalanceAdjustmentLog, EmailLog, UserNotificationPrefs, UserReferral, AdminUserDetails, UserStats, FraudAlert, ProxyProvider, ProxyProviderConfig, ProxySession, GeoLocation, ProxyUsageStats, ProxyLog, ProxyLogStats } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const SSO_TARGET_DOMAIN = import.meta.env.VITE_SSO_TARGET_DOMAIN || '';

const isSsoEnabled = (): boolean => {
    if (!SSO_TARGET_DOMAIN || typeof window === 'undefined') return false;
    try {
        const ssoOrigin = new URL(SSO_TARGET_DOMAIN).origin;
        return window.location.origin !== ssoOrigin;
    } catch {
        return false;
    }
};

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

const fillMissingDays = (stats: { date: string; visitors: number; pageviews: number }[], days: number = 30): { date: string; visitors: number; pageviews: number }[] => {
    const result: { date: string; visitors: number; pageviews: number }[] = [];
    const statsMap = new Map(stats.map(s => [s.date, s]));

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const existing = statsMap.get(dateStr);
        result.push(existing || { date: dateStr, visitors: 0, pageviews: 0 });
    }
    return result;
};

export const db = {
    init: () => {
        // No-op for API-based DB, but we keep the signature
        console.log("Remote Database Initialized");
    },

    getCurrentUser: (): User | undefined => {
        try {
            const userData = localStorage.getItem('modus_current_user');
            return userData ? JSON.parse(userData) : undefined;
        } catch (e) {
            console.error('Failed to parse user data from localStorage:', e);
            localStorage.removeItem('modus_current_user');
            return undefined;
        }
    },

    refreshCurrentUser: async (): Promise<User | undefined> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
            if (!response.ok) {
                if (response.status === 401) {
                    db.logout();
                    return undefined;
                }
                throw new Error('Failed to fetch user');
            }
            const userData = await response.json();

            const mappedUser: User = {
                id: userData.id,
                email: userData.email,
                name: userData.name || userData.email?.split('@')[0] || 'User',
                role: userData.role,
                balance: userData.balance,
                balanceEconomy: userData.balance_economy,
                balanceProfessional: userData.balance_professional,
                balanceExpert: userData.balance_expert,
                status: userData.status || 'active',
                joinedDate: userData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                projectsCount: userData.projects_count || 0,
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
                recoveryEmail: userData.recovery_email,
                timezone: userData.timezone,
                language: userData.language,
                themeAccentColor: userData.theme_accent_color,
                dateFormat: userData.date_format,
                numberFormat: userData.number_format,
                requirePasswordReset: userData.require_password_reset,
                avatarUrl: userData.avatar_url,
            };

            db.setCurrentUser(mappedUser);
            return mappedUser;
        } catch (e) {
            console.error('Failed to refresh user:', e);
            return undefined;
        }
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
            name: userData.email?.split('@')[0] || userData.name || 'User',
            role: userData.role,
            balance: userData.balance,
            balanceEconomy: userData.balance_economy,
            balanceProfessional: userData.balance_professional,
            balanceExpert: userData.balance_expert,
            status: 'active',
            joinedDate: userData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            projectsCount: userData.projects_count || 0,
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
            requirePasswordReset: userData.require_password_reset,
            gamificationXp: userData.gamification_xp,
            gamificationLevel: userData.gamification_level,
            gamificationTotalSpent: userData.gamification_total_spent,
            gamificationPermanentDiscount: userData.gamification_permanent_discount,
            streakDays: userData.streak_days,
            streakBest: userData.streak_best
        };

        db.setCurrentUser(mappedUser);
        
        if (isSsoEnabled()) {
            const currentPath = window.location.pathname + window.location.search;
            const ssoUrl = `${SSO_TARGET_DOMAIN}/sso?token=${encodeURIComponent(data.access_token)}&return=${encodeURIComponent(currentPath)}`;
            window.location.href = ssoUrl;
        }
        
        return mappedUser;
    },

    validateSsoToken: async (token: string): Promise<{ valid: boolean; user?: User; token?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate-sso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (!response.ok) {
                return { valid: false };
            }
            
            const data = await response.json();
            if (!data.valid || !data.user) {
                return { valid: false };
            }
            
            const userData = data.user;
            const mappedUser: User = {
                id: userData.id,
                email: userData.email,
                name: userData.email?.split('@')[0] || userData.name || 'User',
                role: userData.role,
                balance: userData.balance,
                balanceEconomy: userData.balance_economy,
                balanceProfessional: userData.balance_professional,
                balanceExpert: userData.balance_expert,
                status: 'active',
                joinedDate: userData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                projectsCount: userData.projects_count || 0,
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
                requirePasswordReset: userData.require_password_reset,
                gamificationXp: userData.gamification_xp,
                gamificationLevel: userData.gamification_level,
                gamificationTotalSpent: userData.gamification_total_spent,
                gamificationPermanentDiscount: userData.gamification_permanent_discount,
                streakDays: userData.streak_days,
                streakBest: userData.streak_best
            };
            
            return { valid: true, user: mappedUser, token };
        } catch {
            return { valid: false };
        }
    },

    register: async (name: string, email: string, pass: string): Promise<User | void> => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
        
        if (isSsoEnabled()) {
            return db.login(email, pass);
        }
        
        await response.json();
    },

    verifyEmail: async (code: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
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

            // Fetch stats for all projects
            let statsData: Record<string, any[]> = {};
            try {
                const statsResponse = await fetchWithAuth(`${API_BASE_URL}/projects/stats?days=30`);
                if (statsResponse.ok) {
                    statsData = await statsResponse.json();
                }
            } catch (e) {
                console.error("Failed to fetch project stats:", e);
            }

            const mapped: Project[] = data.map((p: any) => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                plan: p.plan_type || 'Custom',
                tier: p.tier,
                status: p.status,
                startAt: p.start_at,
                expires: p.expires_at || 'Never',
                expiresAt: p.expires_at,
                createdAt: p.created_at,
                settings: p.settings,
                stats: fillMissingDays(statsData[p.id] || [], 30),
                totalHits: p.total_hits || 0,
                hitsToday: p.hits_today || 0,
                dailyLimit: p.daily_limit || 0,
                totalTarget: p.total_target || 0,
                customTarget: {
                    totalVisitors: p.total_target || 0,
                    dailyLimit: p.daily_limit || 0
                }
            }));

            localStorage.setItem('modus_projects_cache', JSON.stringify(mapped));
        } catch (e) {
            console.error("Failed to sync projects:", e);
        }
    },

    syncProjectStats: async (projectId: string, days: number = 30): Promise<{ date: string; visitors: number; pageviews: number }[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/stats?days=${days}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch project stats:", e);
            return [];
        }
    },

    syncProjectStatsHourly: async (projectId: string, hours: number = 24): Promise<{ hour: string; visitors: number; pageviews: number }[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/stats/hourly?hours=${hours}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch hourly project stats:", e);
            return [];
        }
    },

    syncProjectStatsLive: async (projectId: string): Promise<{ time: string; visitors: number; pageviews: number }[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/stats/live`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch live project stats:", e);
            return [];
        }
    },

    getCalculatedExpiry: async (projectId: string): Promise<{
        daysRemaining: number | null;
        expiresDate: string | null;
        balance: number;
        totalDailyConsumption: number;
        message: string | null;
    }> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/expires-calculated`);
            if (!response.ok) {
                return { daysRemaining: null, expiresDate: null, balance: 0, totalDailyConsumption: 0, message: 'Failed to calculate' };
            }
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch calculated expiry:", e);
            return { daysRemaining: null, expiresDate: null, balance: 0, totalDailyConsumption: 0, message: 'Error' };
        }
    },

    getActiveNow: async (): Promise<{ activeNow: number; projects: Record<string, { active: number; lastHit?: string }> }> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/projects/active-now`);
            if (!response.ok) return { activeNow: 0, projects: {} };
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch active now:", e);
            return { activeNow: 0, projects: {} };
        }
    },

    syncAdminProjects: async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects`);
            if (!response.ok) return;
            const data = await response.json();

            let statsData: Record<string, any[]> = {};
            try {
                const statsResponse = await fetchWithAuth(`${API_BASE_URL}/projects/stats?days=30`);
                if (statsResponse.ok) {
                    statsData = await statsResponse.json();
                }
            } catch (e) {
                console.error("Failed to fetch project stats:", e);
            }

            const mapped: Project[] = data.map((p: any) => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                plan: p.plan_type || 'Custom',
                tier: p.tier,
                status: p.status,
                expires: p.expires_at || 'Never',
                expiresAt: p.expires_at,
                createdAt: p.created_at,
                settings: p.settings,
                stats: fillMissingDays(statsData[p.id] || [], 30),
                totalHits: p.total_hits || 0,
                hitsToday: p.hits_today || 0,
                dailyLimit: p.daily_limit || 0,
                totalTarget: p.total_target || 0,
                priority: p.priority || 0,
                forceStopReason: p.force_stop_reason,
                isHidden: p.is_hidden || false,
                internalTags: p.internal_tags || [],
                notes: p.notes,
                isFlagged: p.is_flagged || false,
                userEmail: p.user_email,
                userName: p.user_name,
                userBalance: p.user_balance,
            }));

            localStorage.setItem('modus_admin_projects_cache', JSON.stringify(mapped));
        } catch (e) {
            console.error("Failed to sync admin projects:", e);
        }
    },

    bulkUpdateAdminProjects: async (projectIds: string[], updates: { status?: string; priority?: number }): Promise<void> => {
        try {
            await Promise.all(projectIds.map(async (id) => {
                const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updates)
                });
                if (!response.ok) {
                    console.error(`Failed to update project ${id}`);
                }
            }));
            await db.syncAdminProjects();
        } catch (e) {
            console.error("Failed to bulk update projects:", e);
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
            total_target: project.customTarget?.totalVisitors || 0,
            start_at: project.startAt || null
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to create project");
        }

        const createdProject = await response.json();
        await db.syncProjects();
        return createdProject;
    },

    // Admin: Create project for a user (bypasses email verification and can deduct credits)
    addProjectAdmin: async (project: Project, userEmail: string, deductCredits: boolean = false) => {
        const projectData = {
            name: project.name,
            plan_type: project.plan,
            tier: project.tier,
            settings: project.settings,
            daily_limit: project.customTarget?.dailyLimit || 0,
            total_target: project.customTarget?.totalVisitors || 0,
            start_at: project.startAt || null,
            user_email: userEmail,
            deduct_credits: deductCredits
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects`, {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to create project as admin");
        }

        const createdProject = await response.json();
        await db.syncProjects();
        return createdProject;
    },

    updateProject: async (project: Project) => {
        const dailyLimit = project.settings?.scheduleTrafficAmount || project.customTarget?.dailyLimit || 0;

        const payload = {
            name: project.name,
            settings: project.settings,
            daily_limit: dailyLimit,
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

    cloneProject: async (id: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}/clone`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to clone project');
        await db.syncProjects();
        return db.getProjects();
    },

    // Admin Project Update - bypasses user ownership check
    updateProjectAdmin: async (project: Project) => {
        const payload = {
            name: project.name,
            settings: project.settings,
            daily_limit: project.daily_limit || project.customTarget?.dailyLimit || 0,
            total_target: project.total_target || project.customTarget?.totalVisitors || 0,
            status: project.status,
            tier: project.tier,
            plan_type: project.plan,
            expires: project.expires,
            priority: project.settings?.adminPriority || 0,
            force_stop_reason: project.settings?.forceStopReason || ''
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects/${project.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Failed to update project as admin");
        }

        await db.syncProjects();
        return db.getProjects();
    },

    // Admin: Update project status directly (bypasses user ownership)
    updateProjectStatusAdmin: async (projectId: string, status: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error("Failed to update project status");
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

    getMaxTierBalance: (): number => {
        const user = db.getCurrentUser();
        const balances = [
            user?.balanceEconomy ?? 0,
            user?.balanceProfessional ?? 0,
            user?.balanceExpert ?? 0
        ];
        return Math.max(...balances);
    },

    // Financials
    getBalance: (): number => {
        return db.getMaxTierBalance();
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
            db.syncTickets(),
            db.syncNotifications(),
            db.syncAlerts()
        ]);
    },

    // Users
    getUsers: (): User[] => {
        const data = localStorage.getItem('modus_users_cache');
        return data ? JSON.parse(data) : [];
    },

    getAdmins: (): User[] => {
        const users = db.getUsers();
        return users.filter(u => u.role === 'admin');
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
            lastActive: u.last_active || '',
            spamScore: u.spam_score || 0,
            ipSharedWithCount: u.ip_shared_with_count || 0,
            affiliateEarnings: u.affiliate_earnings || 0
        }));
        localStorage.setItem('modus_users_cache', JSON.stringify(mapped));
        return mapped;
    },

    getUserStats: async (): Promise<UserStats | null> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/stats`);
            if (!response.ok) return null;
            const data = await response.json();
            return {
                totalUsers: data.total_users,
                activeUsers24h: data.active_users_24h,
                activeUsers7d: data.active_users_7d,
                newUsersToday: data.new_users_today,
                newUsers7d: data.new_users_7d,
                newUsers30d: data.new_users_30d,
                highRiskUsers: data.high_risk_users,
                fraudAlertsCount: data.fraud_alerts_count
            };
        } catch (e) {
            console.error('Failed to fetch user stats:', e);
            return null;
        }
    },

    getFraudAlerts: async (): Promise<FraudAlert[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/fraud-alerts`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((a: any) => ({
                id: a.id,
                type: a.type,
                ip: a.ip,
                userIds: a.user_ids,
                userEmails: a.user_emails,
                affiliateEarnings: a.affiliate_earnings,
                hasAffiliateRelation: a.has_affiliate_relation,
                detectedAt: a.detected_at,
                riskLevel: a.risk_level
            }));
        } catch (e) {
            console.error('Failed to fetch fraud alerts:', e);
            return [];
        }
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
                success_url: `${currentOrigin}/dashboard/payment-success?type=subscription&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${currentOrigin}/pricing?subscription=cancelled`
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create checkout session');
        }
        return await response.json();
    },

    createCreditsCheckout: async (params: {
        tier: 'economy' | 'professional' | 'expert';
        visitors: number;
        bulk_months: number;
        currency?: string;
    }) => {
        const token = localStorage.getItem('tgp_token');
        if (!token) throw new Error("Not authenticated");

        const currentOrigin = window.location.origin;
        const response = await fetch(`${API_BASE_URL}/stripe/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tier: params.tier,
                visitors: params.visitors,
                bulk_months: params.bulk_months,
                currency: params.currency || 'eur',
                success_url: `${currentOrigin}/dashboard/payment-success?type=credits&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${currentOrigin}/dashboard/buy-credits?payment=cancelled`
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
    getTickets: (filters?: { status?: string; category?: string; search?: string }): Ticket[] => {
        const data = localStorage.getItem('modus_tickets_cache');
        let tickets: Ticket[] = data ? JSON.parse(data) : [];

        if (filters) {
            if (filters.status) {
                tickets = tickets.filter(t => t.status === filters.status);
            }
            if (filters.category) {
                tickets = tickets.filter(t => t.category === filters.category);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                tickets = tickets.filter(t =>
                    t.subject.toLowerCase().includes(searchLower) ||
                    t.lastMessage?.toLowerCase().includes(searchLower) ||
                    t.messages?.some(m => m.text.toLowerCase().includes(searchLower))
                );
            }
        }

        return tickets;
    },

    syncTickets: async (filters?: { status?: string; category?: string; search?: string }) => {
        let url = `${API_BASE_URL}/tickets`;
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetchWithAuth(url);
        if (!response.ok) return;
        const data = await response.json();
        const mapped: Ticket[] = data.map((t: any) => ({
            id: t.id,
            type: t.type || 'ticket',
            userId: t.user_id,
            userName: t.user_name || t.user_email?.split('@')[0] || 'User',
            userEmail: t.user_email,
            subject: t.subject,
            status: t.status || 'open',
            priority: t.priority || 'low',
            category: t.category || 'general',
            assigneeId: t.assignee_id,
            assigneeName: t.assignee_name,
            tags: t.tags || [],
            projectId: t.project_id,
            projectName: t.project_name,
            attachmentUrls: t.attachment_urls || [],
            date: t.created_at?.split('T')[0] || new Date().toLocaleDateString(),
            lastMessage: t.messages?.length > 0 ? t.messages[t.messages.length - 1].text : 'Ticket created',
            messages: t.messages || [],
            unread: false,
            updatedAt: t.updated_at,
            slaDueAt: t.sla_due_at
        }));
        localStorage.setItem('modus_tickets_cache', JSON.stringify(mapped));
    },

    createTicket: async (ticket: Partial<Ticket>) => {
        const payload = {
            subject: ticket.subject,
            priority: ticket.priority || 'low',
            type: ticket.type || 'ticket',
            category: ticket.category || 'general',
            project_id: ticket.projectId,
            attachment_urls: ticket.attachmentUrls || [],
            messages: ticket.messages || []
        };
        await fetchWithAuth(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        await db.syncTickets();
        return db.getTickets();
    },

    closeTicket: async (ticketId: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/close`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error("Failed to close ticket");
        await db.syncTickets();
    },

    uploadTicketAttachment: async (file: File): Promise<{ url: string; filename: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('tgp_token');
        const response = await fetch(`${API_BASE_URL}/tickets/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        if (!response.ok) throw new Error("Failed to upload file");
        return await response.json();
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

    markAllNotificationsRead: async () => {
        await fetchWithAuth(`${API_BASE_URL}/notifications/mark-all-read`, { method: 'PUT' });
        await db.syncNotifications();
    },

    // System Settings
    getSystemSettings: (): SystemSettings => {
        const data = localStorage.getItem('modus_settings_cache');
        return data ? JSON.parse(data) : { siteName: 'Traffic Creator', maintenanceMode: false, allowRegistrations: true, supportEmail: 'support@traffic-creator.com', minDeposit: 10 };
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
        const sessionToken = localStorage.getItem('modus_session_token');
        fetchWithAuth(`${API_BASE_URL}/users/presence`, {
            method: 'POST',
            body: JSON.stringify({
                session_token: sessionToken,
                current_page: view,
                user_agent: navigator.userAgent,
                device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            })
        }).then(res => res.json()).then(data => {
            if (data.session_token) {
                localStorage.setItem('modus_session_token', data.session_token);
            }
        }).catch(() => { });
    },

    getTicketById: (id: string): Ticket | undefined => {
        const tickets = db.getTickets();
        return tickets.find(t => t.id === id);
    },

    replyToTicket: async (ticketId: string, text: string, sender: 'user' | 'admin' | 'guest', attachments?: string[], isInternalNote?: boolean) => {
        const payload = {
            text,
            sender,
            attachments: attachments || [],
            is_internal_note: isInternalNote || false
        };

        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/reply`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Failed to reply to ticket");
            throw new Error("Failed to send reply");
        }

        await db.syncTickets();
        return await response.json();
    },

    markTicketRead: async (ticketId: string) => {
        // Backend doesn't support read status yet, update specific cache to pretend
        const tickets = db.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.unread = false;
            localStorage.setItem('modus_tickets_cache', JSON.stringify(tickets));
        }
    },

    updateTicketStatus: async (ticketId: string, status: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error("Failed to update ticket status");
        await db.syncTickets();
    },

    updateTicketPriority: async (ticketId: string, priority: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({ priority })
        });
        if (!response.ok) throw new Error("Failed to update ticket priority");
        await db.syncTickets();
    },

    deleteTicket: async (ticketId: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Failed to delete ticket");
        await db.syncTickets();
    },

    bulkUpdateTickets: async (ticketIds: string[], action: 'close' | 'delete' | 'open' | 'archive') => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/bulk-action`, {
            method: 'PUT',
            body: JSON.stringify({ ticket_ids: ticketIds, action })
        });
        if (!response.ok) throw new Error("Failed to perform bulk action");
        await db.syncTickets();
    },

    assignTicket: async (ticketId: string, assigneeId: string | null) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/assign?assignee_id=${assigneeId || ''}`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error("Failed to assign ticket");
        await db.syncTickets();
    },

    updateTicketTags: async (ticketId: string, tags: string[]) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({ tags })
        });
        if (!response.ok) throw new Error("Failed to update ticket tags");
        await db.syncTickets();
    },

    getTicketTemplates: async () => {
        const response = await fetchWithAuth(`${API_BASE_URL}/ticket-templates`);
        if (!response.ok) return [];
        return await response.json();
    },

    createTicketTemplate: async (template: { title: string; content: string; category: string; shortcut?: string }) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/ticket-templates`, {
            method: 'POST',
            body: JSON.stringify({ ...template, is_active: true })
        });
        if (!response.ok) throw new Error("Failed to create template");
        return await response.json();
    },

    deleteTicketTemplate: async (templateId: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/ticket-templates/${templateId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Failed to delete template");
    },

    getUserStatsById: async (userId: string) => {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/stats`);
        if (!response.ok) throw new Error("Failed to get user stats");
        return await response.json();
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

        // Map the response back to frontend User type and update localStorage
        const mappedUser: User = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name || updatedUser.email?.split('@')[0] || 'User',
            role: updatedUser.role,
            balance: updatedUser.balance,
            balanceEconomy: updatedUser.balance_economy,
            balanceProfessional: updatedUser.balance_professional,
            balanceExpert: updatedUser.balance_expert,
            status: updatedUser.status || 'active',
            joinedDate: updatedUser.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            projectsCount: updatedUser.projects_count || 0,
            apiKey: updatedUser.api_key,
            isVerified: updatedUser.is_verified ?? false,
            phone: updatedUser.phone,
            company: updatedUser.company,
            vatId: updatedUser.vat_id,
            address: updatedUser.address,
            city: updatedUser.city,
            country: updatedUser.country,
            zip: updatedUser.zip,
            website: updatedUser.website,
            displayName: updatedUser.display_name,
            bio: updatedUser.bio,
            jobTitle: updatedUser.job_title,
            publicProfile: updatedUser.public_profile,
            twoFactorEnabled: updatedUser.two_factor_enabled,
            emailFrequency: updatedUser.email_frequency,
            loginNotificationEnabled: updatedUser.login_notification_enabled,
            newsletterSub: updatedUser.newsletter_sub,
            soundEffects: updatedUser.sound_effects,
            developerMode: updatedUser.developer_mode,
            apiWhitelist: updatedUser.api_whitelist,
            webhookSecret: updatedUser.webhook_secret,
            accessibility: updatedUser.accessibility,
            socialLinks: updatedUser.social_links,
            recoveryEmail: updatedUser.recovery_email,
            timezone: updatedUser.timezone,
            language: updatedUser.language,
            themeAccentColor: updatedUser.theme_accent_color,
            dateFormat: updatedUser.date_format,
            numberFormat: updatedUser.number_format,
            requirePasswordReset: updatedUser.require_password_reset,
            avatarUrl: updatedUser.avatar_url,
        };

        db.setCurrentUser(mappedUser);
        return mappedUser;
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
        // This is synchronous in current design but backend is async.
        // We rely on syncAlerts (below) to populate cache or we make this async?
        // The component calls it synchronously: setAlerts(db.getAlerts())
        // So we must use cache.
        const data = localStorage.getItem('modus_alerts_cache');
        return data ? JSON.parse(data) : [];
    },

    syncAlerts: async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts`);
            if (!response.ok) return;
            const data = await response.json();
            const mapped: SystemAlert[] = data.map((b: any) => ({
                id: b.id,
                message: b.message,
                type: b.type,
                active: b.is_active,
                date: b.created_at,
                targetType: 'all', // Backend doesn't support this yet
                title: b.title // Extended SystemAlert to include title? It works if interface ignores it or we extend it.
            }));
            localStorage.setItem('modus_alerts_cache', JSON.stringify(mapped));
        } catch (e) {
            console.error("Failed to sync alerts:", e);
        }
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
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/active-users`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((s: any) => ({
                id: s.id,
                userId: s.user?.id,
                name: s.user?.name || 'Guest',
                email: s.user?.email || '',
                role: s.role,
                currentPage: s.currentPage,
                durationMinutes: s.durationMinutes,
                device: s.device,
                browser: s.browser,
                ip: s.ip,
                location: s.location,
                totalVisits: s.totalVisits,
                status: s.status,
                lastActive: s.lastActive
            }));
        } catch (e) {
            console.error("Failed to fetch real-time visitors:", e);
            return [];
        }
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

    // Marketing & Coupons
    getCoupons: async (): Promise<Coupon[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/coupons`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return data.map((c: any) => ({
                id: c.id,
                code: c.code,
                discountType: c.discount_type,
                discountValue: c.discount_value,
                minPurchase: c.min_purchase,
                maxUses: c.max_uses,
                usedCount: c.used_count,
                maxUsesPerUser: c.max_uses_per_user,
                planRestriction: c.plan_restriction,
                duration: c.duration,
                expiryDate: c.expires_at ? c.expires_at.split('T')[0] : null,
                active: c.is_active
            }));
        } catch (e) {
            return [];
        }
    },

    saveCoupon: async (coupon: Coupon): Promise<void> => {
        const payload = {
            code: coupon.code,
            discount_type: coupon.discountType === 'percent' ? 'percentage' : 'fixed',
            discount_value: coupon.discountValue,
            min_purchase: coupon.minPurchase || 0,
            max_uses: coupon.maxUses,
            max_uses_per_user: coupon.maxUsesPerUser || 1,
            plan_restriction: coupon.planRestriction,
            duration: coupon.duration || 'once',
            expires_at: coupon.expiryDate || null
        };

        if (coupon.id) {
            await fetchWithAuth(`${API_BASE_URL}/admin/coupons/${coupon.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await fetchWithAuth(`${API_BASE_URL}/admin/coupons`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
    },

    deleteCoupon: async (id: string): Promise<void> => {
        await fetchWithAuth(`${API_BASE_URL}/admin/coupons/${id}`, {
            method: 'DELETE'
        });
    },

    getMarketingStats: async (): Promise<MarketingCampaign[]> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/marketing`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return data.map((c: any) => ({
                id: c.id,
                name: c.name,
                type: c.campaign_type,
                status: c.status,
                clicks: c.clicks,
                conversions: c.conversions,
                revenue: c.revenue,
                spend: c.spend,
                dateCreated: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            }));
        } catch (e) {
            return [];
        }
    },

    createMarketingCampaign: async (campaign: Partial<MarketingCampaign>): Promise<void> => {
        await fetchWithAuth(`${API_BASE_URL}/admin/marketing`, {
            method: 'POST',
            body: JSON.stringify({
                name: campaign.name,
                campaign_type: campaign.type || 'ad_tracking',
                start_date: campaign.dateCreated || null,
                end_date: null
            })
        });
    },

    sendEmailBlast: async (subject: string, body: string, targetAudience: string = 'all'): Promise<void> => {
        await fetchWithAuth(`${API_BASE_URL}/admin/email-blast`, {
            method: 'POST',
            body: JSON.stringify({
                subject,
                body,
                target_audience: targetAudience
            })
        });
    },

    // Conversion Settings
    getConversionSettings: async (): Promise<ConversionSettings> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/conversion-settings`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return {
                socialProof: {
                    enabled: data.socialProofEnabled,
                    position: data.socialProofPosition,
                    delay: data.socialProofDelay,
                    showRealData: data.socialProofShowSimulated,
                    customMessages: []
                },
                exitIntent: {
                    enabled: data.exitIntentEnabled,
                    headline: data.exitIntentHeadline,
                    subtext: data.exitIntentSubtext,
                    couponCode: data.exitIntentCouponCode,
                    showOncePerSession: true
                },
                promoBar: {
                    enabled: data.promoBarEnabled,
                    message: data.promoBarMessage,
                    buttonText: data.promoBarButtonText,
                    buttonLink: data.promoBarButtonUrl,
                    backgroundColor: data.promoBarBackgroundColor,
                    textColor: data.promoBarTextColor
                }
            };
        } catch (e) {
            const initial: ConversionSettings = {
                socialProof: { enabled: false, position: 'bottom-left', delay: 5, showRealData: false, customMessages: [] },
                exitIntent: { enabled: false, headline: 'Wait! Don\'t miss out.', subtext: 'Get 20% off with code: STAY20', couponCode: 'STAY20', showOncePerSession: true },
                promoBar: { enabled: false, message: 'Limited Time Offer!', buttonText: 'Claim Offer', buttonLink: '/pricing', backgroundColor: '#ff4d00', textColor: '#ffffff' }
            };
            return initial;
        }
    },

    saveConversionSettings: async (settings: ConversionSettings): Promise<void> => {
        await fetchWithAuth(`${API_BASE_URL}/conversion-settings`, {
            method: 'PUT',
            body: JSON.stringify({
                social_proof_enabled: settings.socialProof.enabled,
                social_proof_position: settings.socialProof.position,
                social_proof_delay: settings.socialProof.delay,
                social_proof_show_simulated: settings.socialProof.showRealData,
                exit_intent_enabled: settings.exitIntent.enabled,
                exit_intent_headline: settings.exitIntent.headline,
                exit_intent_subtext: settings.exitIntent.subtext,
                exit_intent_coupon_code: settings.exitIntent.couponCode,
                promo_bar_enabled: settings.promoBar.enabled,
                promo_bar_message: settings.promoBar.message,
                promo_bar_button_text: settings.promoBar.buttonText,
                promo_bar_button_url: settings.promoBar.buttonLink,
                promo_bar_background_color: settings.promoBar.backgroundColor,
                promo_bar_text_color: settings.promoBar.textColor
            })
        });
    },

    // Loyalty & Referrals
    getLoyaltySettings: async (): Promise<import('../types').LoyaltySettings> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/loyalty-settings`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return { enabled: data.enabled, pointsPerDollar: data.pointsPerDollar, redemptionRate: data.redemptionRate, bonusSignupPoints: data.bonusSignupPoints };
        } catch (e) {
            return { enabled: false, pointsPerDollar: 1, redemptionRate: 100, bonusSignupPoints: 50 };
        }
    },

    saveLoyaltySettings: async (settings: import('../types').LoyaltySettings): Promise<void> => {
        await fetchWithAuth(`${API_BASE_URL}/loyalty-settings`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    },

    getReferralSettings: async (): Promise<import('../types').ReferralSettings> => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/referral-settings`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return { enabled: data.enabled, referrerReward: data.referrerRewardValue, refereeReward: data.refereeRewardValue, rewardType: data.referrerRewardType as 'credit' | 'percentage' };
        } catch (e) {
            return { enabled: false, referrerReward: 25, refereeReward: 25, rewardType: 'credit' };
        }
    },

    saveReferralSettings: async (settings: import('../types').ReferralSettings): Promise<void> => {
        await fetchWithAuth(`${API_BASE_URL}/referral-settings`, {
            method: 'PUT',
            body: JSON.stringify({
                enabled: settings.enabled,
                referrer_reward_type: settings.rewardType,
                referrer_reward_value: settings.referrerReward,
                referee_reward_type: settings.rewardType,
                referee_reward_value: settings.refereeReward
            })
        });
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

    getFAQs: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/faqs`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
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
            body: JSON.stringify({
                adjustment_type: adjustment.adjustmentType,
                tier: adjustment.tier,
                amount: adjustment.amount,
                hits: adjustment.hits,
                reason: adjustment.reason,
                notes: adjustment.notes
            })
        });
        if (!response.ok) {
            let errorMsg = 'Failed to adjust balance';
            try {
                const errorData = await response.json();
                errorMsg = errorData.detail || errorMsg;
            } catch { }
            throw new Error(errorMsg);
        }
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
        if (!response.ok) {
            let errorMsg = 'Failed to add bonus hits';
            try {
                const errorData = await response.json();
                errorMsg = errorData.detail || errorMsg;
            } catch { }
            throw new Error(errorMsg);
        }
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
    },

    // Compatibility methods for AdminPanel.tsx
    updateUserStatus: async (userId: string, status: 'active' | 'suspended') => {
        await db.adminUpdateUser(userId, { status });
        // Return updated list for React state update simplicity (although inefficient)
        return db.getUsers();
    },

    adminAdjustBalance: async (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => {
        await db.adjustUserBalance(userId, {
            adjustmentType: type,
            tier: 'general',
            amount: amount,
            reason: reason
        });
    },

    createAlert: async (message: string, type: 'info' | 'warning' | 'error', title: string = 'System Alert') => {
        const payload = {
            title: title,
            message: message,
            type: type,
            is_active: true
        };
        await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        await db.syncAlerts();
    },

    toggleAlert: async (id: string, active: boolean) => {
        // Backend endpoint for update is /admin/broadcasts/{id}
        // Need to fetch existing first or just patch?
        // Main.py has PUT /admin/broadcasts/{id} taking BroadcastCreate.
        // We need extended endpoint for PATCH or full update.
        // Assuming we can just update status?
        // Let's implement full update if needed, but for now we might fail if we don't send all fields.
        // Use a specialized endpoint if available, or fetch-then-update.
        // Logic:
        const alerts = db.getAlerts();
        const alert = alerts.find(a => a.id === id);
        if (!alert) return;

        const payload = {
            title: (alert as any).title || 'System Alert',
            message: alert.message,
            type: alert.type,
            is_active: active
        };

        await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        await db.syncAlerts();
    },

    deleteAlert: async (id: string) => {
        // Backend API doesn't seem to have DELETE for broadcasts in main.py snippet I saw?
        // I saw GET, POST, PUT.
        // If missing, I need to add DELETE endpoint to main.py.
        // Assuming it exists or I will add it.
        await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}`, {
            method: 'DELETE'
        });
        await db.syncAlerts();
    },

    // Benefits API
    getBenefitTypes: async (): Promise<import('../types').BenefitType[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/benefits/types`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((b: any) => ({
            id: b.id,
            type: b.type,
            category: b.category,
            name: b.name,
            value: b.value,
            requirements: b.requirements,
            active: b.active,
            displayOrder: b.display_order
        }));
    },

    getMyBenefitRequests: async (status?: string): Promise<import('../types').BenefitRequest[]> => {
        const url = status ? `${API_BASE_URL}/benefits/my-requests?status=${status}` : `${API_BASE_URL}/benefits/my-requests`;
        const response = await fetchWithAuth(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((b: any) => ({
            id: b.id,
            userId: b.user_id,
            benefitType: b.benefit_type,
            benefitCategory: b.benefit_category,
            url: b.url,
            description: b.description,
            screenshotUrl: b.screenshot_url,
            claimedValue: b.claimed_value,
            approvedValue: b.approved_value,
            status: b.status,
            adminNotes: b.admin_notes,
            fraudFlagged: b.fraud_flagged,
            fraudReason: b.fraud_reason,
            submittedAt: b.submitted_at,
            reviewedAt: b.reviewed_at,
            reviewedBy: b.reviewed_by
        }));
    },

    getBenefitBalance: async (): Promise<import('../types').BenefitBalance> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/benefits/balance`);
        if (!response.ok) return { benefitBalance: 0, totalBenefitsClaimed: 0, pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0 };
        const data = await response.json();
        return {
            benefitBalance: data.benefit_balance,
            totalBenefitsClaimed: data.total_benefits_claimed,
            pendingRequests: data.pending_requests,
            approvedRequests: data.approved_requests,
            rejectedRequests: data.rejected_requests
        };
    },

    submitBenefit: async (benefit: {
        benefit_type: string;
        benefit_category: string;
        url: string;
        description?: string;
        screenshot_url?: string;
        claimed_value: number;
    }): Promise<import('../types').BenefitRequest> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/benefits/submit`, {
            method: 'POST',
            body: JSON.stringify(benefit)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to submit benefit");
        }
        const b = await response.json();
        return {
            id: b.id,
            userId: b.user_id,
            benefitType: b.benefit_type,
            benefitCategory: b.benefit_category,
            url: b.url,
            description: b.description,
            screenshotUrl: b.screenshot_url,
            claimedValue: b.claimed_value,
            approvedValue: b.approved_value,
            status: b.status,
            adminNotes: b.admin_notes,
            fraudFlagged: b.fraud_flagged,
            fraudReason: b.fraud_reason,
            submittedAt: b.submitted_at,
            reviewedAt: b.reviewed_at,
            reviewedBy: b.reviewed_by
        };
    },

    // Affiliate API
    getAffiliateDashboard: async (): Promise<import('../types').AffiliateDashboard> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/affiliate/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch affiliate dashboard');
        const data = await response.json();
        return {
            tier: {
                id: data.tier.id,
                userId: data.tier.user_id,
                tierLevel: data.tier.tier_level,
                tierName: data.tier.tier_name,
                commissionRateL1: data.tier.commission_rate_l1,
                commissionRateL2: data.tier.commission_rate_l2,
                commissionRateL3: data.tier.commission_rate_l3,
                totalReferralsL1: data.tier.total_referrals_l1,
                totalReferralsL2: data.tier.total_referrals_l2,
                totalReferralsL3: data.tier.total_referrals_l3,
                totalEarnings: data.tier.total_earnings,
                pendingPayout: data.tier.pending_payout,
                lifetimePayout: data.tier.lifetime_payout,
                lastTierUpdate: data.tier.last_tier_update
            },
            relations: data.relations.map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                referrerL1Id: r.referrer_l1_id,
                referrerL2Id: r.referrer_l2_id,
                referrerL3Id: r.referrer_l3_id
            })),
            referralLink: data.referral_link,
            totalReferrals: data.total_referrals,
            totalEarnings: data.total_earnings,
            pendingPayout: data.pending_payout,
            benefitBalance: data.benefit_balance
        };
    },

    getAffiliateTier: async (): Promise<import('../types').AffiliateTier> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/affiliate/tier`);
        if (!response.ok) throw new Error('Failed to fetch affiliate tier');
        const data = await response.json();
        return {
            id: data.id,
            userId: data.user_id,
            tierLevel: data.tier_level,
            tierName: data.tier_name,
            commissionRateL1: data.commission_rate_l1,
            commissionRateL2: data.commission_rate_l2,
            commissionRateL3: data.commission_rate_l3,
            totalReferralsL1: data.total_referrals_l1,
            totalReferralsL2: data.total_referrals_l2,
            totalReferralsL3: data.total_referrals_l3,
            totalEarnings: data.total_earnings,
            pendingPayout: data.pending_payout,
            lifetimePayout: data.lifetime_payout,
            lastTierUpdate: data.last_tier_update
        };
    },

    getAffiliateReferrals: async (tier: number = 1): Promise<any[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/affiliate/referrals?tier=${tier}`);
        if (!response.ok) return [];
        return await response.json();
    },

    // Payout API
    requestPayout: async (payout: {
        amount: number;
        method: string;
        payout_details: Record<string, any>;
    }): Promise<import('../types').PayoutRequest> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/affiliate/payouts/request`, {
            method: 'POST',
            body: JSON.stringify(payout)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to request payout");
        }
        const p = await response.json();
        return {
            id: p.id,
            userId: p.user_id,
            amount: p.amount,
            method: p.method,
            payoutDetails: p.payout_details,
            status: p.status,
            adminNotes: p.admin_notes,
            requestedAt: p.requested_at,
            processedAt: p.processed_at,
            processedBy: p.processed_by,
            transactionHash: p.transaction_hash
        };
    },

    getMyPayouts: async (): Promise<import('../types').PayoutRequest[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/affiliate/payouts`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            amount: p.amount,
            method: p.method,
            payoutDetails: p.payout_details,
            status: p.status,
            adminNotes: p.admin_notes,
            requestedAt: p.requested_at,
            processedAt: p.processed_at,
            processedBy: p.processed_by,
            transactionHash: p.transaction_hash
        }));
    },

    // Admin Benefits
    getPendingBenefits: async (): Promise<any[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/benefits/pending`);
        if (!response.ok) return [];
        return await response.json();
    },

    getBenefitsHistory: async (status?: string): Promise<any[]> => {
        const url = status
            ? `${API_BASE_URL}/admin/benefits/history?status=${status}`
            : `${API_BASE_URL}/admin/benefits/history`;
        const response = await fetchWithAuth(url);
        if (!response.ok) return [];
        return await response.json();
    },

    approveBenefit: async (benefitId: string, approvedValue: number, adminNotes?: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/benefits/${benefitId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ approved_value: approvedValue, status: 'approved', admin_notes: adminNotes })
        });
        if (!response.ok) throw new Error('Failed to approve benefit');
    },

    rejectBenefit: async (benefitId: string, adminNotes?: string, fraudFlagged: boolean = false, fraudReason?: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/benefits/${benefitId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ status: 'rejected', admin_notes: adminNotes, fraud_flagged: fraudFlagged, fraud_reason: fraudReason })
        });
        if (!response.ok) throw new Error('Failed to reject benefit');
    },

    // Admin Payouts
    getPendingPayouts: async (): Promise<any[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/payouts/pending`);
        if (!response.ok) return [];
        return await response.json();
    },

    approvePayout: async (payoutId: string, adminNotes?: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/payouts/${payoutId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ status: 'approved', admin_notes: adminNotes })
        });
        if (!response.ok) throw new Error('Failed to approve payout');
    },

    rejectPayout: async (payoutId: string, adminNotes?: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/payouts/${payoutId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ status: 'rejected', admin_notes: adminNotes })
        });
        if (!response.ok) throw new Error('Failed to reject payout');
    },

    markPayoutPaid: async (payoutId: string, transactionHash?: string, adminNotes?: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/payouts/${payoutId}/mark-paid`, {
            method: 'POST',
            body: JSON.stringify({ status: 'paid', transaction_hash: transactionHash, admin_notes: adminNotes })
        });
        if (!response.ok) throw new Error('Failed to mark payout as paid');
    },

    // Admin Affiliates
    getAllAffiliates: async (): Promise<any[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/affiliates`);
        if (!response.ok) return [];
        return await response.json();
    },

    updateAffiliateTier: async (userId: string, tierLevel: number): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/affiliates/${userId}/tier-update`, {
            method: 'POST',
            body: JSON.stringify({ tier_level: tierLevel })
        });
        if (!response.ok) throw new Error('Failed to update affiliate tier');
    },

    // Proxy Provider API
    getProxyConfig: async (): Promise<ProxyProvider | null> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/config`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to fetch proxy config');
        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            providerType: data.provider_type,
            username: data.username,
            serviceName: data.service_name,
            proxyHost: data.proxy_host,
            httpPort: data.http_port_start || data.http_port || 9000,
            httpPortStart: data.http_port_start,
            httpPortEnd: data.http_port_end,
            isActive: data.is_active,
            sessionLifetimeMinutes: data.session_lifetime_minutes,
            bandwidthLimitGb: data.bandwidth_limit_gb,
            bandwidthUsedGb: data.bandwidth_used_gb || 0,
            notificationEmail: data.notification_email,
            warnAt80: data.warn_at_80,
            warnAt50: data.warn_at_50,
            warnAt20: data.warn_at_20,
            lastSyncAt: data.last_sync_at,
            createdAt: data.created_at
        };
    },

    saveProxyConfig: async (config: ProxyProviderConfig): Promise<ProxyProvider> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/config`, {
            method: 'POST',
            body: JSON.stringify({
                username: config.username,
                password: config.password,
                service_name: config.serviceName,
                proxy_host: config.proxyHost,
                http_port: config.httpPort,
                session_lifetime_minutes: config.sessionLifetimeMinutes,
                bandwidth_limit_gb: config.bandwidthLimitGb,
                notification_email: config.notificationEmail,
                is_active: config.isActive,
                warn_at_80: config.warnAt80,
                warn_at_50: config.warnAt50,
                warn_at_20: config.warnAt20
            })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to save proxy config');
        }
        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            providerType: data.provider_type,
            username: data.username,
            serviceName: data.service_name,
            proxyHost: data.proxy_host,
            httpPortStart: data.http_port_start,
            httpPortEnd: data.http_port_end,
            isActive: data.is_active,
            sessionLifetimeMinutes: data.session_lifetime_minutes,
            bandwidthLimitGb: data.bandwidth_limit_gb,
            bandwidthUsedGb: data.bandwidth_used_gb || 0,
            notificationEmail: data.notification_email,
            warnAt80: data.warn_at_80,
            warnAt50: data.warn_at_50,
            warnAt20: data.warn_at_20,
            lastSyncAt: data.last_sync_at,
            createdAt: data.created_at
        };
    },

    testProxyConnection: async (): Promise<{ success: boolean; message: string; bandwidth_used_gb?: number }> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/test`, {
            method: 'POST'
        });
        return await response.json();
    },

    syncProxyLocations: async (): Promise<{ success: boolean; locations_synced: number }> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/sync-locations`, {
            method: 'POST'
        });
        return await response.json();
    },

    getProxyUsage: async (): Promise<ProxyUsageStats> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/usage`);
        return await response.json();
    },

    getGeoLocations: async (): Promise<GeoLocation[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/locations`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((l: any) => ({
            countryCode: l.country_code,
            countryName: l.country_name,
            states: l.states || [],
            cities: l.cities || []
        }));
    },

    getProxySessions: async (activeOnly: boolean = true): Promise<ProxySession[]> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/sessions?active_only=${activeOnly}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((s: any) => ({
            id: s.id,
            sessionId: s.session_id,
            country: s.country,
            countryCode: s.country_code,
            state: s.state,
            city: s.city,
            ipAddress: s.ip_address,
            isActive: s.is_active,
            port: s.port,
            requestCount: s.request_count,
            createdAt: s.created_at,
            expiresAt: s.expires_at,
            lastUsedAt: s.last_used_at
        }));
    },

    releaseProxySession: async (sessionId: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/sessions/${sessionId}/release`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to release session');
    },

    releaseAllProxySessions: async (): Promise<{ success: boolean; sessions_released: number }> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/sessions/release-all`, {
            method: 'POST'
        });
        return await response.json();
    },

    cleanupProxySessions: async (): Promise<{ success: boolean; message: string }> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/cleanup`, {
            method: 'POST'
        });
        return await response.json();
    },

    testProxyTraffic: async (params: { countryCode?: string; countryName?: string; state?: string; city?: string }): Promise<{
        success: boolean;
        message?: string;
        session_id?: string;
        latency_ms?: number;
        detected?: {
            ip: string;
            country: string;
            country_code: string;
            region: string;
            city: string;
            isp: string;
            timezone: string;
            lat: number;
            lon: number;
        };
        requested?: {
            country: string;
            state?: string;
            city?: string;
        };
        geo_match?: boolean;
    }> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/test-traffic`, {
            method: 'POST',
            body: JSON.stringify({
                country_code: params.countryCode,
                country_name: params.countryName,
                state: params.state,
                city: params.city
            })
        });
        return await response.json();
    },

    getProxyLogs: async (params?: { limit?: number; offset?: number; successOnly?: boolean; errorsOnly?: boolean }): Promise<ProxyLog[]> => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set('limit', params.limit.toString());
        if (params?.offset) queryParams.set('offset', params.offset.toString());
        if (params?.successOnly) queryParams.set('success_only', 'true');
        if (params?.errorsOnly) queryParams.set('errors_only', 'true');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/logs?${queryParams.toString()}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((l: any) => ({
            id: l.id,
            sessionId: l.session_id,
            projectId: l.project_id,
            requestUrl: l.request_url,
            responseCode: l.response_code,
            latencyMs: l.latency_ms,
            errorMessage: l.error_message,
            countryCode: l.country_code,
            state: l.state,
            city: l.city,
            ipAddress: l.ip_address,
            success: l.success,
            createdAt: l.created_at
        }));
    },

    getProxyLogStats: async (): Promise<ProxyLogStats> => {
        const response = await fetchWithAuth(`${API_BASE_URL}/admin/proxies/logs/stats`);
        const data = await response.json();
        return {
            total: data.total,
            successful: data.successful,
            failed: data.failed,
            successRate: data.success_rate,
            avgLatencyMs: data.avg_latency_ms
        };
    }
};
