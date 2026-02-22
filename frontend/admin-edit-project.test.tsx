import { describe, it, expect, vi } from 'vitest';

vi.mock('./services/db', () => ({
    db: {
        getProjectById: vi.fn(),
        getGeoLocations: vi.fn().mockResolvedValue([]),
        getSystemSettings: vi.fn().mockReturnValue({ payloadTemplates: [] }),
        updateProject: vi.fn().mockResolvedValue(true),
        updateProjectStatus: vi.fn().mockResolvedValue(true),
        cloneProject: vi.fn().mockResolvedValue(true),
        deleteProject: vi.fn().mockResolvedValue(true),
        scanGA4: vi.fn().mockResolvedValue('G-TEST123'),
        getCalculatedExpiry: vi.fn().mockResolvedValue({
            daysRemaining: 30,
            expiresDate: '2026-03-22',
            balance: 100,
            totalDailyConsumption: 10,
            message: null
        }),
        syncProjectStats: vi.fn().mockResolvedValue([]),
        syncProjectStatsHourly: vi.fn().mockResolvedValue([]),
        syncProjectStatsLive: vi.fn().mockResolvedValue([])
    }
}));

describe('AdminEditProject Module', () => {
    it('should export a valid React component', async () => {
        const module = await import('./components/admin/AdminEditProject');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });

    it('should import all required icons from lucide-react', async () => {
        const icons = await import('lucide-react');
        expect(icons.ArrowLeft).toBeDefined();
        expect(icons.Calendar).toBeDefined();
        expect(icons.Save).toBeDefined();
        expect(icons.Copy).toBeDefined();
        expect(icons.Play).toBeDefined();
        expect(icons.Pause).toBeDefined();
        expect(icons.Trash2).toBeDefined();
        expect(icons.Globe).toBeDefined();
        expect(icons.Activity).toBeDefined();
        expect(icons.MapPin).toBeDefined();
        expect(icons.Target).toBeDefined();
        expect(icons.Zap).toBeDefined();
    });

    it('should import required constants', async () => {
        const { COUNTRIES_LIST, ALL_LANGUAGES, TRAFFIC_SOURCES, TIME_ON_PAGE_OPTS, TIMEZONES } = await import('./constants');
        expect(COUNTRIES_LIST).toBeDefined();
        expect(Array.isArray(COUNTRIES_LIST)).toBe(true);
        expect(ALL_LANGUAGES).toBeDefined();
        expect(TRAFFIC_SOURCES).toBeDefined();
        expect(TIME_ON_PAGE_OPTS).toBeDefined();
        expect(TIMEZONES).toBeDefined();
    });

    it('should import CustomSelect component', async () => {
        const module = await import('./components/CustomSelect');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });
});
