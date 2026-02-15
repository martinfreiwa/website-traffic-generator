import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project } from './types';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('fetch', vi.fn());

describe('Project Management Logic', () => {
    let db: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Setup default behavior for localStorage
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

        // Dynamic import to ensure global mocks are picked up
        const module = await import('./services/db');
        db = module.db;
    });

    describe('Project Creation', () => {
        it('should add a new project locally', async () => {
            const newProject: Project = {
                id: '123',
                userId: 'user1',
                name: 'Test Project',
                plan: 'Custom',
                settings: { trafficSpeed: 100 } as any,
                status: 'active',
                createdAt: new Date().toISOString(),
                expires: '2024-12-31'
            };

            // Mock successful API responses
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([{
                        id: '123',
                        user_id: 'user1',
                        name: 'Test Project',
                        plan_type: 'Custom',
                        status: 'active',
                        created_at: new Date().toISOString(),
                        expires_at: '2024-12-31',
                        settings: { trafficSpeed: 100 }
                    }])
                });

            await db.addProject(newProject);

            const projects = db.getProjects();
            expect(projects).toHaveLength(1);
            expect(projects[0].name).toBe('Test Project');
        });

        it('should allow admin to create project for specific user', async () => {
            const adminProject: Project = {
                id: '456',
                userId: 'target_user_id', // Explicitly set different user
                name: 'Admin Created Project',
                plan: 'Pro',
                settings: { trafficSpeed: 500 } as any,
                status: 'active',
                createdAt: new Date().toISOString(),
                expires: 'Never'
            };

            // Mock successful API response
            (fetch as any)
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([{
                        ...adminProject,
                        user_id: 'target_user_id', // Backend returns snake_case
                    }])
                });

            await db.addProject(adminProject);

            // In our mock implementation logic for 'addProject' in db.ts, 
            // we rely on syncProjects to update the cache. 
            // The syncProjects mock above returns the project with user_id 'target_user_id'
            // which maps to userId 'target_user_id' in frontend.

            const projects = db.getProjects();
            // Note: getProjects() returns from localStorage cache. 
            // If previous test ran, we might have 2 projects now if we didn't clear storage? 
            // beforeEach clears mocks and storage (if implemented correctly)
            // Let's check projects length logic.
            // In db.ts getProjects merely reads cache.

            // The previous test added 1 project. beforeEach clears mocks, does it clear localStorage?
            // Yes, our beforeEach does `store = {}`.

            expect(projects).toHaveLength(1);
            expect(projects[0].userId).toBe('target_user_id');
        });
    });

    describe('Bulk Actions', () => {
        it('should delete multiple projects', async () => {
            const initialProjects = [
                { id: '1', name: 'P1', status: 'active' },
                { id: '2', name: 'P2', status: 'active' },
                { id: '3', name: 'P3', status: 'active' }
            ];

            localStorage.setItem('modus_projects_cache', JSON.stringify(initialProjects));

            // Re-import or re-get projects to see the seeded data if db caches heavily?
            // db.getProjects() reads from localStorage every time, so it should be fine.
            expect(db.getProjects()).toHaveLength(3);

            (fetch as any)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([
                        { id: '3', name: 'P3', status: 'active' }
                    ].map(p => ({ ...p, user_id: 'u1', plan_type: 'basic', created_at: 'now' })))
                });

            await db.bulkDeleteProjects(['1', '2']);

            const remaining = db.getProjects();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe('3');
        });

        it('should pause multiple projects', async () => {
            const initialProjects = [
                { id: '1', name: 'P1', status: 'active' },
                { id: '2', name: 'P2', status: 'active' }
            ];
            localStorage.setItem('modus_projects_cache', JSON.stringify(initialProjects));

            (fetch as any)
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({ ok: true })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([
                        { id: '1', name: 'P1', status: 'stopped' },
                        { id: '2', name: 'P2', status: 'stopped' }
                    ].map(p => ({ ...p, user_id: 'u1', plan_type: 'basic', created_at: 'now' })))
                });

            await db.bulkUpdateProjectStatus(['1', '2'], 'stopped');

            const projects = db.getProjects();
            expect(projects[0].status).toBe('stopped');
            expect(projects[1].status).toBe('stopped');
        });
    });
});
