
import { Project, PriceClass, ProjectSettings, Transaction, User, Ticket, SystemSettings, Notification, ProjectStats, TrafficLog, SystemAlert, TicketMessage, LiveVisitor } from '../types';
import { firestore, auth } from './firebase';

// ==========================================
// LOCAL STORAGE DATABASE IMPLEMENTATION
// ==========================================

const STORAGE_KEYS = {
    PROJECTS: 'modus_traffic_projects',
    PRICING: 'modus_traffic_pricing',
    BALANCE: 'modus_traffic_balance',
    TRANSACTIONS: 'modus_traffic_transactions',
    USERS: 'modus_traffic_users',
    TICKETS: 'modus_traffic_tickets',
    SETTINGS: 'modus_traffic_settings',
    NOTIFICATIONS: 'modus_traffic_notifications',
    ALERTS: 'modus_traffic_alerts',
    CURRENT_USER: 'modus_current_user_id',
    SESSION_ID: 'modus_session_id', // For visitor tracking
    INIT: 'modus_db_initialized_v24' // Bumped version for ISO migration
};

const DEFAULT_SETTINGS: ProjectSettings = {
    bounceRate: 0,
    returnRate: 0,
    deviceSplit: 70,
    deviceSpecific: "All",
    timeOnPage: '3 minutes',
    timezone: 'UTC',
    language: 'en-US',
    languages: ['en-US'],
    gaId: '',
    entryUrls: 'http://example.com',
    innerUrls: '',
    exitUrls: '',
    autoCrawlEntry: false,
    autoCrawlInner: false,
    autoCrawlExit: false,
    innerUrlCount: 0,
    geoTargets: [{ id: '1', country: 'US', percent: 100 }], // ISO Code 'US'
    countries: ['US'],
    trafficSource: 'Direct',
    keywords: '',
    referralUrls: '',
    sitemap: '',
    shortener: '',
    autoRenew: false,
    cacheWebsite: false, minimizeCpu: false,
    randomizeSession: true,
    antiFingerprint: true,
    pageViewsWithScroll: 0,
    clickExternal: 0,
    clickInternal: 0
};

// Helper to generate mock stats
const generateStats = (base: number): ProjectStats[] => {
    const stats: ProjectStats[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        // Random variance +/- 20%
        const variance = (Math.random() * 0.4) + 0.8;
        const visitors = Math.floor(base * variance);
        // Pageviews are usually 1.5x to 3x of visitors
        const pageviews = Math.floor(visitors * (Math.random() * 1.5 + 1.2));

        stats.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            visitors: visitors,
            pageviews: pageviews
        });
    }
    return stats;
}

const SEED_PROJECTS: Project[] = [
    { id: '2819', userId: 'u2', name: 'dutchheatingproducts', plan: 'Custom', customTarget: { totalVisitors: 50000, durationDays: 30, dailyLimit: 1666 }, expires: '2025-12-01', status: 'completed', settings: { ...DEFAULT_SETTINGS, entryUrls: 'https://dutchheating.com' }, stats: generateStats(500) },
    { id: '3344', userId: 'u2', name: 'Traffic bot1', plan: 'Free Trial', expires: '2024-11-15', status: 'stopped', settings: { ...DEFAULT_SETTINGS, bounceRate: 50 }, stats: generateStats(100) },
    { id: '4102', userId: 'u1', name: 'CryptoNews Daily', plan: 'Custom', customTarget: { totalVisitors: 1000000, durationDays: 60, dailyLimit: 16666 }, expires: '2025-02-28', status: 'active', settings: { ...DEFAULT_SETTINGS, trafficSource: 'Social, Facebook' }, stats: generateStats(5000) },
    { id: '4103', userId: 'u2', name: 'TechReview 24', plan: 'Custom', customTarget: { totalVisitors: 150000, durationDays: 30, dailyLimit: 5000 }, expires: '2025-03-10', status: 'active', settings: DEFAULT_SETTINGS, stats: generateStats(1200) },
    { id: '4105', userId: 'u1', name: 'LocalBakery NY', plan: 'Custom', customTarget: { totalVisitors: 10000, durationDays: 30, dailyLimit: 333 }, expires: '2024-12-20', status: 'stopped', settings: DEFAULT_SETTINGS, stats: generateStats(200) },
];

const SEED_PRICING: PriceClass[] = [
    { id: 'foundation', name: 'Foundation', hourlyRate: 0.58, baseFee: 29, examFee: 0 },
    { id: 'momentum', name: 'Momentum', hourlyRate: 0.43, baseFee: 129, examFee: 0 },
    { id: 'breakthrough', name: 'Breakthrough', hourlyRate: 0.40, baseFee: 399, examFee: 0 },
    { id: 'apex', name: 'Apex', hourlyRate: 0.33, baseFee: 999, examFee: 0 },
    { id: 'agency_pro', name: 'Agency Pro', hourlyRate: 0.25, baseFee: 1249, examFee: 0 },
    { id: 'agency_scale', name: 'Agency Scale', hourlyRate: 0.20, baseFee: 2999, examFee: 0 },
];

const SEED_TRANSACTIONS: Transaction[] = [
    { id: 'TRX-9825', date: 'Oct 25, 2025', desc: 'Wallet Top-up', amount: 1200.00, status: 'completed', type: 'credit', userId: 'u2' },
];

const SEED_USERS: User[] = [
    {
        id: 'u1', name: 'John Doe', email: 'user@modus.com', role: 'user', balance: 0.00, status: 'active', joinedDate: '2025-10-27', projectsCount: 2, apiKey: 'sk_live_new_user',
        phone: '', telegram: '', company: '', vatId: '', website: '', address: '', city: '', zip: '', country: '',
        paymentMethods: [
            { id: 'pm_1', type: 'visa', last4: '4242', expiry: '12/26', isDefault: true }
        ]
    },
    {
        id: 'u2', name: 'Sarah Connor', email: 'sarah@skynet.com', role: 'user', balance: 1200.50, status: 'active', joinedDate: '2024-03-10', projectsCount: 3,
        phone: '+1 (555) 987-6543', company: 'Cyberdyne', city: 'Los Angeles', country: 'United States',
        paymentMethods: []
    },
    { id: 'u3', name: 'Super Admin', email: 'admin@modus.com', role: 'admin', balance: 0, status: 'active', joinedDate: '2023-11-01', projectsCount: 0 },
];

const SEED_TICKETS: Ticket[] = [
    {
        id: 'T-102',
        type: 'ticket',
        userId: 'u2',
        userName: 'Sarah Connor',
        subject: 'Traffic speed issue',
        status: 'open',
        priority: 'high',
        date: '2025-10-24',
        lastMessage: 'Traffic seems slower than usual today.',
        unread: true,
        messages: [
            { id: 'm1', sender: 'user', text: 'Traffic seems slower than usual today.', date: '2025-10-24 10:30' }
        ]
    },
    {
        id: 'C-882',
        type: 'chat',
        userId: 'u1',
        userName: 'John Doe',
        subject: 'Live Chat Session',
        status: 'closed',
        priority: 'low',
        date: '2025-10-26',
        lastMessage: 'Thanks for the help!',
        unread: false,
        messages: [
            { id: 'm1', sender: 'user', text: 'Hi, I have a quick question about pricing.', date: '2025-10-26 14:20' },
            { id: 'm2', sender: 'admin', text: 'Hello John! Sure, what would you like to know?', date: '2025-10-26 14:21' },
            { id: 'm3', sender: 'user', text: 'Thanks for the help!', date: '2025-10-26 14:25' }
        ]
    }
];

const SEED_SETTINGS: SystemSettings = {
    siteName: 'Modus Traffic',
    maintenanceMode: false,
    allowRegistrations: true,
    supportEmail: 'support@traffic-creator.com',
    minDeposit: 10,
    sparkTrafficApiKey: '777e916aa9c89a6f16a9faef7bf39a9e',
    apiConfigs: [
        { id: 'default', name: 'Default Provider', key: '777e916aa9c89a6f16a9faef7bf39a9e' },
        { id: 'backup', name: 'Backup Server', key: '' }
    ],
    payloadTemplates: [
        {
            id: 'default_template',
            name: 'Default Direct Traffic',
            json: JSON.stringify({
                "size": "demo",
                "traffic_type": "Direct",
                "bounce_rate": 0,
                "return_rate": 0,
                "time_on_page": "5sec",
                "desktop_rate": 100,
                "auto_renew": "true",
                "geo_type": "global",
                "keywords": "",
                "ga_id": ""
            }, null, 4)
        },
        {
            id: 'mobile_heavy',
            name: 'Mobile High Retention',
            json: JSON.stringify({
                "size": "demo",
                "traffic_type": "Social, Facebook",
                "bounce_rate": 10,
                "return_rate": 20,
                "time_on_page": "60sec",
                "desktop_rate": 20,
                "auto_renew": "false",
                "geo_type": "global",
                "keywords": ""
            }, null, 4)
        }
    ]
};

const SEED_NOTIFICATIONS: Notification[] = [
    { id: 'n1', userId: 'u1', title: 'Welcome to Modus', message: 'Your account is ready. Start by creating a campaign.', date: '2025-10-27', read: false, type: 'success' },
];

const SEED_ALERTS: SystemAlert[] = [
    { id: 'a1', message: 'Scheduled maintenance: Oct 30th, 02:00 UTC.', type: 'info', active: true, date: '2025-10-26', targetType: 'all' },
];

export const db = {
    // Initialize DB if empty
    init: () => {
        if (typeof window === 'undefined') return;

        // Check for initialization or re-seed on version bump
        if (!localStorage.getItem(STORAGE_KEYS.INIT)) {
            localStorage.clear();

            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
            localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(SEED_PRICING));
            localStorage.setItem(STORAGE_KEYS.BALANCE, '0.00');
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
            localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(SEED_TICKETS));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
            localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(SEED_ALERTS));
            localStorage.setItem(STORAGE_KEYS.INIT, 'true');

            // Init Session ID for tracking
            if (!localStorage.getItem(STORAGE_KEYS.SESSION_ID)) {
                localStorage.setItem(STORAGE_KEYS.SESSION_ID, `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`);
            }

            console.log('Database seeded successfully (V24 - ISO Update).');
        }

        // Ensure current user is set (default to u1 if none)
        if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'u1');
        }

        // Attempt to sync global settings (API keys etc) from Firebase
        db.syncSettings();
    },

    // Projects CRUD
    getProjects: (): Project[] => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const all: Project[] = data ? JSON.parse(data) : [];

        const currentUser = db.getCurrentUser();
        // For regular users, filter by their ID. For admins, return all.
        if (currentUser?.role !== 'admin') {
            return all.filter(p => p.userId === currentUser?.id);
        }
        return all;
    },

    getProjectById: (id: string): Project | undefined => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const all: Project[] = data ? JSON.parse(data) : [];
        return all.find(p => p.id === id);
    },

    syncProjects: async () => {
        if (!firestore) return;
        try {
            const snapshot = await firestore.collection('projects').get();
            if (!snapshot.empty) {
                const remoteProjects: Project[] = [];
                snapshot.forEach(doc => {
                    remoteProjects.push(doc.data() as Project);
                });

                // Merge: Remote takes precedence if newer (simplification: just overwrite by ID)
                const localRaw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
                const localProjects: Project[] = localRaw ? JSON.parse(localRaw) : [];

                // Create a map of local projects for easy lookup
                const projectMap = new Map(localProjects.map(p => [p.id, p]));

                // Update/Add remote projects
                remoteProjects.forEach(p => {
                    projectMap.set(p.id, p);
                });

                const merged = Array.from(projectMap.values());
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(merged));
            }
        } catch (e: any) {
            if (e.code !== 'permission-denied') {
                console.error("Failed to sync projects from Cloud:", e);
            }
        }
    },

    updateProjectStatus: (id: string, status: Project['status']) => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const all: Project[] = data ? JSON.parse(data) : [];
        const updated = all.map(p => p.id === id ? { ...p, status } : p);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));

        // Firebase Sync
        try {
            if (firestore) {
                firestore.collection('projects').doc(id).update({ status: status })
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase Project Status Update Error:", err);
                    });
            }
        } catch (e) { console.error(e); }

        return updated;
    },

    updateProject: (project: Project) => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const all: Project[] = data ? JSON.parse(data) : [];
        const updated = all.map(p => p.id === project.id ? project : p);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));

        // Firebase Sync
        try {
            if (firestore) {
                // Use set with merge to ensure it creates if missing or updates if present
                firestore.collection('projects').doc(project.id).set(project, { merge: true })
                    .then(() => console.log('Project updated in Firebase'))
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase Project Update Error:", err);
                    });
            }
        } catch (e) { console.error(e); }

        return updated;
    },

    addProject: (project: Project) => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const all: Project[] = data ? JSON.parse(data) : [];

        // Ensure userId is attached
        const currentUser = db.getCurrentUser();
        project.userId = currentUser?.id || 'unknown';
        if (!project.stats) project.stats = generateStats(0);

        const newProjects = [project, ...all];
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));

        // Update User Project Count
        if (currentUser) {
            const users = db.getUsers();
            const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, projectsCount: u.projectsCount + 1 } : u);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        }

        db.createNotification({
            id: `n-${Date.now()}`,
            userId: currentUser?.id || 'u1',
            title: 'Project Created',
            message: `Campaign ${project.name} has been created successfully.`,
            date: new Date().toISOString().split('T')[0],
            read: false,
            type: 'success'
        });

        // Firebase Sync
        try {
            if (firestore) {
                firestore.collection('projects').doc(project.id).set(project)
                    .then(() => console.log('Project created in Firebase'))
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase Project Create Error:", err);
                    });
            }
        } catch (e) { console.error(e); }

        return newProjects;
    },

    getProjectLogs: (projectId: string): TrafficLog[] => {
        const project = db.getProjectById(projectId);
        if (!project) return [];

        const logs: TrafficLog[] = [];
        const countries = project.settings?.countries || ['US'];
        const isMobileHeavy = (project.settings?.deviceSplit || 50) < 50;

        for (let i = 0; i < 20; i++) {
            const isMobile = isMobileHeavy ? Math.random() > 0.3 : Math.random() > 0.7;
            logs.push({
                id: `log-${Math.random().toString(36).substr(2, 9)}`,
                ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                country: countries[Math.floor(Math.random() * countries.length)],
                device: isMobile ? 'Mobile' : 'Desktop',
                os: isMobile ? (Math.random() > 0.5 ? 'iOS' : 'Android') : (Math.random() > 0.3 ? 'Windows' : 'MacOS'),
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString(),
                path: '/'
            });
        }
        return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },

    // Pricing CRUD
    getPricing: (): PriceClass[] => {
        const data = localStorage.getItem(STORAGE_KEYS.PRICING);
        return data ? JSON.parse(data) : [];
    },

    savePricing: (pricing: PriceClass[]) => {
        localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(pricing));
        return pricing;
    },

    // Wallet / Balance
    getBalance: (): number => {
        const user = db.getCurrentUser();
        return user ? user.balance : 0;
    },

    getTransactions: (): Transaction[] => {
        const t = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const all: Transaction[] = t ? JSON.parse(t) : [];
        const user = db.getCurrentUser();
        if (user && user.role !== 'admin') {
            return all.filter(trx => trx.userId === user.id);
        }
        return all;
    },

    addTransaction: (transaction: Transaction) => {
        const t = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const all: Transaction[] = t ? JSON.parse(t) : [];
        const newTs = [transaction, ...all];
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTs));

        try {
            if (firestore) {
                firestore.collection('transactions').doc(transaction.id).set(transaction)
                    .then(() => console.log('Transaction tracked in Firebase'))
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase Transaction Sync Error:", err);
                    });
            }
        } catch (e) {
            console.warn("Firebase not available for transactions");
        }

        return newTs;
    },

    updateTransaction: (transaction: Transaction) => {
        const t = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const all: Transaction[] = t ? JSON.parse(t) : [];
        const updated = all.map(tx => tx.id === transaction.id ? transaction : tx);
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

        try {
            if (firestore) {
                firestore.collection('transactions').doc(transaction.id).set(transaction, { merge: true })
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase Transaction Update Error:", err);
                    });
            }
        } catch (e) { console.error(e); }

        return updated;
    },

    syncTransactions: async (userId: string, role: string) => {
        if (!firestore) return;
        try {
            let query;
            if (role === 'admin') {
                query = firestore.collection('transactions').limit(500);
            } else {
                query = firestore.collection('transactions').where('userId', '==', userId);
            }

            const snapshot = await query.get();
            if (!snapshot.empty) {
                const remoteTrxs: Transaction[] = [];
                snapshot.forEach(doc => {
                    remoteTrxs.push(doc.data() as Transaction);
                });
                const localRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
                const localTrxs: Transaction[] = localRaw ? JSON.parse(localRaw) : [];
                const existingIds = new Set(localTrxs.map(t => t.id));
                const toAdd = remoteTrxs.filter(t => !existingIds.has(t.id));

                if (toAdd.length > 0) {
                    const combined = [...toAdd, ...localTrxs];
                    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(combined));
                }
            }
        } catch (e: any) {
            if (e.code !== 'permission-denied') {
                console.error("Failed to sync transactions from Cloud:", e);
            }
        }
    },

    updateBalance: (amount: number) => {
        const user = db.getCurrentUser();
        if (!user) return 0;

        const users = db.getUsers();
        const updatedUsers = users.map(u => u.id === user.id ? { ...u, balance: amount } : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

        return amount;
    },

    adminAdjustBalance: (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => {
        const users = db.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return false;

        let newBalance = user.balance;
        if (type === 'credit') newBalance += amount;
        else newBalance -= amount;

        const updatedUsers = users.map(u => u.id === userId ? { ...u, balance: newBalance } : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

        const trx: Transaction = {
            id: `ADM-${Math.floor(Math.random() * 8999) + 1000}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            desc: `Admin Adjustment: ${reason}`,
            amount: amount,
            status: 'completed',
            type: type,
            userId: userId
        };
        db.addTransaction(trx);

        db.createNotification({
            id: `n-${Date.now()}`,
            userId: userId,
            title: 'Balance Adjustment',
            message: `An administrator has ${type === 'credit' ? 'added' : 'deducted'} €${amount} from your wallet. Reason: ${reason}`,
            date: new Date().toISOString().split('T')[0],
            read: false,
            type: type === 'credit' ? 'success' : 'warning'
        });

        return true;
    },

    purchaseCredits: (amount: number, description: string) => {
        const user = db.getCurrentUser();
        if (!user) return 0;

        const current = user.balance;
        const newBalance = parseFloat((current + amount).toFixed(2));
        db.updateBalance(newBalance);

        const trx: Transaction = {
            id: `TRX-${Math.floor(Math.random() * 8999) + 1000}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            desc: description,
            amount: amount,
            status: 'completed',
            type: 'credit',
            userId: user.id
        };
        db.addTransaction(trx);

        db.createNotification({
            id: `n-${Date.now()}`,
            userId: user.id,
            title: 'Credits Added',
            message: `Successfully added €${amount} to your wallet.`,
            date: new Date().toISOString().split('T')[0],
            read: false,
            type: 'success'
        });

        return newBalance;
    },

    spendCredits: (amount: number, description: string): boolean => {
        const user = db.getCurrentUser();
        if (!user) return false;

        const current = user.balance;
        if (current < amount) return false;

        const newBalance = parseFloat((current - amount).toFixed(2));
        db.updateBalance(newBalance);

        const trx: Transaction = {
            id: `INV-${Math.floor(Math.random() * 8999) + 1000}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            desc: description,
            amount: amount,
            status: 'completed',
            type: 'debit',
            userId: user.id
        };
        db.addTransaction(trx);
        return true;
    },

    // User Management
    getUsers: (): User[] => {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : [];
    },

    setCurrentUser: (id: string) => {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, id);
    },

    getCurrentUser: (): User | undefined => {
        const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'u1';
        const users = db.getUsers();
        return users.find(u => u.id === id);
    },

    syncUser: (user: User) => {
        const users = db.getUsers();
        const existing = users.findIndex(u => u.id === user.id);
        if (existing >= 0) {
            users[existing] = { ...users[existing], ...user };
        } else {
            users.push(user);
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        db.setCurrentUser(user.id);
        return user;
    },

    updateUser: (user: User) => {
        const users = db.getUsers();
        const updated = users.map(u => u.id === user.id ? user : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));

        try {
            if (firestore) {
                firestore.collection('users').doc(user.id).set(user, { merge: true })
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase User Update Error:", err);
                    });
            }
        } catch (e) { console.error(e); }

        return updated;
    },

    updateUserStatus: (id: string, status: User['status']) => {
        const users = db.getUsers();
        const updated = users.map(u => u.id === id ? { ...u, status } : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        return updated;
    },

    updateUserProfile: (user: User) => {
        const users = db.getUsers();
        const updated = users.map(u => u.id === user.id ? user : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        db.setCurrentUser(user.id); // Ensure local session stays updated
        return updated;
    },

    regenerateApiKey: (userId: string): string => {
        const users = db.getUsers();
        const newKey = `sk_live_${Math.random().toString(36).substr(2, 18)}_${Date.now()}`;
        const updated = users.map(u => u.id === userId ? { ...u, apiKey: newKey } : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        return newKey;
    },

    // ==========================================
    // TICKET SYSTEM
    // ==========================================

    getTickets: (): Ticket[] => {
        const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
        const tickets: Ticket[] = data ? JSON.parse(data) : [];
        return tickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    getTicketById: (id: string): Ticket | undefined => {
        const tickets = db.getTickets();
        return tickets.find(t => t.id === id);
    },

    createTicket: (ticket: Ticket) => {
        const tickets = db.getTickets();
        if (!ticket.messages) ticket.messages = [];
        if (!ticket.type) ticket.type = 'ticket';

        if (ticket.messages.length > 0) {
            ticket.lastMessage = ticket.messages[ticket.messages.length - 1].text;
        }

        const newTickets = [ticket, ...tickets];
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(newTickets));

        if (ticket.type === 'ticket') {
            db.createNotification({
                id: `n-${Date.now()}`,
                userId: 'admin',
                title: 'New Support Ticket',
                message: `User ${ticket.userName} created ticket ${ticket.id}`,
                date: new Date().toISOString().split('T')[0],
                read: false,
                type: 'warning'
            });
        }

        return newTickets;
    },

    deleteTicket: (id: string) => {
        const tickets = db.getTickets();
        const filtered = tickets.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(filtered));
        return filtered;
    },

    updateTicketStatus: (id: string, status: Ticket['status']) => {
        const tickets = db.getTickets();
        const updated = tickets.map(t => t.id === id ? { ...t, status } : t);
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
        return updated;
    },

    updateTicketPriority: (id: string, priority: Ticket['priority']) => {
        const tickets = db.getTickets();
        const updated = tickets.map(t => t.id === id ? { ...t, priority } : t);
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
        return updated;
    },

    replyToTicket: (id: string, messageText: string, sender: 'admin' | 'user' | 'guest', attachments: string[] = []) => {
        const tickets = db.getTickets();
        let targetUserId = '';

        const newMessage: TicketMessage = {
            id: `m-${Date.now()}`,
            sender,
            text: messageText,
            date: new Date().toLocaleString(),
            attachments
        };

        const updated = tickets.map(t => {
            if (t.id === id) {
                targetUserId = t.userId;
                const newMessages = [...(t.messages || []), newMessage];
                return {
                    ...t,
                    lastMessage: messageText,
                    messages: newMessages,
                    status: sender === 'admin' ? 'in-progress' : 'open',
                    unread: true
                } as Ticket;
            }
            return t;
        });
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));

        if (sender === 'admin' && targetUserId) {
            // Try to notify registered users, might fail for guests if not handled, but that's ok for now
            db.createNotification({
                id: `n-${Date.now()}`,
                userId: targetUserId,
                title: 'Ticket Reply',
                message: `New message in ticket ${id}`,
                date: new Date().toISOString().split('T')[0],
                read: false,
                type: 'info'
            });
        }

        return updated;
    },

    markTicketRead: (id: string) => {
        const tickets = db.getTickets();
        const updated = tickets.map(t => t.id === id ? { ...t, unread: false } : t);
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
    },

    // System Settings
    getSystemSettings: (): SystemSettings => {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : SEED_SETTINGS;
    },

    saveSystemSettings: (settings: SystemSettings) => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

        // FIREBASE SYNC: Save settings (including API keys and templates) to 'settings/system' doc
        try {
            if (firestore) {
                firestore.collection('settings').doc('system').set(settings, { merge: true })
                    .then(() => console.log('Settings synced to Firebase'))
                    .catch(err => {
                        if (err.code !== 'permission-denied') console.error("Firebase Settings Sync Error:", err);
                    });
            }
        } catch (e) { console.error(e); }

        return settings;
    },

    // Sync Settings from Firebase (Run on init)
    syncSettings: async () => {
        if (!firestore) return;
        try {
            const doc = await firestore.collection('settings').doc('system').get();
            if (doc.exists) {
                const remoteSettings = doc.data() as SystemSettings;
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteSettings));
            }
        } catch (e: any) {
            if (e.code !== 'permission-denied') {
                console.error("Failed to sync settings from Cloud:", e);
            }
        }
    },

    // Alerts Management
    getAlerts: (): SystemAlert[] => {
        const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
        return data ? JSON.parse(data) : [];
    },

    createAlert: (message: string, type: SystemAlert['type'], targetType: SystemAlert['targetType'] = 'all', targetUserIds: string[] = [], countdownEnds?: string) => {
        const alerts = db.getAlerts();
        const newAlert: SystemAlert = {
            id: `a-${Date.now()}`,
            message,
            type,
            active: true,
            date: new Date().toISOString().split('T')[0],
            targetType,
            targetUserIds,
            countdownEnds
        };
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([newAlert, ...alerts]));
        return [newAlert, ...alerts];
    },

    toggleAlert: (id: string, active: boolean) => {
        const alerts = db.getAlerts();
        const updated = alerts.map(a => a.id === id ? { ...a, active } : a);
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
        return updated;
    },

    deleteAlert: (id: string) => {
        const alerts = db.getAlerts();
        const updated = alerts.filter(a => a.id !== id);
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
        return updated;
    },

    // Alert Targeting Helper
    checkBroadcastTarget: (alert: SystemAlert, user?: User): boolean => {
        if (!alert.active) return false;
        if (!user) return alert.targetType === 'all'; // Show general alerts to guests if targeted 'all'

        switch (alert.targetType) {
            case 'all':
                return true;
            case 'paying':
                return user.projectsCount > 0; // Simple heuristic for now
            case 'active_7d':
                // Check if user joined MORE than 7 days ago
                const joinTime = new Date(user.joinedDate).getTime();
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                return (Date.now() - joinTime) > sevenDaysMs;
            case 'specific':
                return alert.targetUserIds ? alert.targetUserIds.includes(user.id) : false;
            default:
                return false;
        }
    },

    // Notification System
    getNotifications: (userId: string = 'u1'): Notification[] => {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        const all: Notification[] = data ? JSON.parse(data) : [];
        return all.filter(n => n.userId === userId || (userId === 'admin' ? false : false)).sort((a, b) => b.id.localeCompare(a.id));
    },

    getAdminNotifications: (): Notification[] => {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        const all: Notification[] = data ? JSON.parse(data) : [];
        return all.filter(n => n.userId === 'admin').sort((a, b) => b.id.localeCompare(a.id));
    },

    createNotification: (notif: Notification) => {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        const all: Notification[] = data ? JSON.parse(data) : [];
        all.push(notif);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    },

    markNotificationRead: (id: string) => {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        let all: Notification[] = data ? JSON.parse(data) : [];
        all = all.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
        return all;
    },

    markAllNotificationsRead: (userId: string) => {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        let all: Notification[] = data ? JSON.parse(data) : [];
        all = all.map(n => n.userId === userId ? { ...n, read: true } : n);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    },

    // ==========================================
    // LIVE VISITOR TRACKING (REAL DATA)
    // ==========================================

    trackPresence: async (page: string, user?: User) => {
        // Security Check: Only track if user is authenticated in Firebase
        // This prevents permission errors for guests
        if (!firestore || !auth.currentUser || !user || !user.id) return;

        try {
            const timestamp = new Date().toISOString();
            // Use set with merge to update heartbeat
            await firestore.collection('live_visitors').doc(user.id).set({
                id: user.id,
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentPage: page,
                lastActive: timestamp,
                device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                status: 'active',
                durationMinutes: 0,
                browser: 'Chrome', // Simplification
                ip: '127.0.0.1', // Client can't reliably get own IP without external service
                location: 'Unknown',
                totalVisits: 1
            }, { merge: true });
        } catch (e) {
            // Ignore errors
        }
    },

    getRealTimeVisitors: async (): Promise<LiveVisitor[]> => {
        // Security Check: Only read if authenticated (Admin Panel usage)
        if (!firestore || !auth.currentUser) return [];

        try {
            // Cleanup old visitors logic would typically be server-side, 
            // here we just fetch all and filter in memory for the view
            const snapshot = await firestore.collection('live_visitors').get();
            const visitors: LiveVisitor[] = [];
            const now = new Date().getTime();
            const cutoff = now - (5 * 60 * 1000); // 5 minutes

            snapshot.forEach(doc => {
                const data = doc.data() as LiveVisitor;
                if (new Date(data.lastActive).getTime() > cutoff) {
                    visitors.push(data);
                }
            });
            return visitors;
        } catch (e) {
            return [];
        }
    },

    // Reset DB (Helper)
    reset: () => {
        localStorage.clear();
        location.reload();
    }
};
