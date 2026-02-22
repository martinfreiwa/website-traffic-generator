import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectSettings, GeoLocation, GeoTarget, PayloadTemplate } from '../../types';
import { db } from '../../services/db';
import {
    ArrowLeft, Calendar, Save, Copy, RefreshCw, Layers,
    HelpCircle, Globe, Activity, Smartphone, Monitor, CheckCircle2, Zap, Radio, Lock, ToggleLeft, ToggleRight,
    Plus, Trash2, Download, Upload, AlertCircle, FileCode, Search, MapPin, X, Target, BarChart2, Star, Play, Pause,
    Pencil, ChevronDown, ChevronUp, Settings as SettingsIcon
} from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { COUNTRIES_LIST, ALL_LANGUAGES, TRAFFIC_SOURCES, TIME_ON_PAGE_OPTS, TIMEZONES } from '../../constants';

interface AdminEditProjectProps {
    projectId: string;
    onBack: () => void;
    onUpdate: () => void;
}

const URL_ORDER_MODES = [
    { value: "random", label: "Random Selection" },
    { value: "sequential", label: "Sequential Funnel" }
];

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

const AdminEditProject: React.FC<AdminEditProjectProps> = ({ projectId, onBack, onUpdate }) => {
    const [project, setProject] = useState<Project | null>(null);
    const [settings, setSettings] = useState<ProjectSettings | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [projectStats, setProjectStats] = useState<{ date: string; visitors: number; pageviews: number }[]>([]);
    const [hourlyStats, setHourlyStats] = useState<{ hour: string; visitors: number; pageviews: number }[]>([]);
    const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);

    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [systemTemplates, setSystemTemplates] = useState<PayloadTemplate[]>([]);

    const [chartMode, setChartMode] = useState<'visitors' | 'pageviews'>('pageviews');
    const [chartView, setChartView] = useState<'daily' | 'hourly' | 'live'>('daily');
    const [statsLoading, setStatsLoading] = useState(false);
    const [liveStats, setLiveStats] = useState<{ time: string; visitors: number; pageviews: number }[]>([]);
    const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

    const [dailyLimit, setDailyLimit] = useState<number>(0);
    const [totalTarget, setTotalTarget] = useState<number>(0);

    const [calculatedExpiry, setCalculatedExpiry] = useState<{
        daysRemaining: number | null;
        expiresDate: string | null;
        balance: number;
        totalDailyConsumption: number;
        message: string | null;
    } | null>(null);

    const [isScanningGA, setIsScanningGA] = useState(false);

    const [languageSearch, setLanguageSearch] = useState('');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    useEffect(() => {
        const loadGeoLocations = async () => {
            try {
                const locations = await db.getGeoLocations();
                setGeoLocations(locations);
            } catch (e) {
                console.error('Failed to load geo locations:', e);
            }
        };
        loadGeoLocations();
    }, []);

    useEffect(() => {
        const p = db.getProjectById(projectId);
        setProject(p);

        if (p) {
            let currentSettings = p.settings || {
                bounceRate: 0, returnRate: 0,
                deviceSplit: 70, tabletSplit: 0, deviceSpecific: "All", browser: "Random",
                timeOnPage: '3 minutes', timezone: 'UTC', language: 'en-US', languages: ['en-US'], gaId: '',
                entryUrls: '', innerUrls: '', exitUrls: '',
                autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
                innerUrlCount: 0,
                geoTargets: [], countries: ['US'],
                trafficSource: 'Direct', keywords: '', referralUrls: '',
                proxyMode: 'auto', customProxies: '',
                scheduleMode: 'continuous', scheduleTime: '', scheduleDuration: 60,
                urlVisitOrder: 'random',
                sitemap: '', shortener: '',
                autoRenew: false, cacheWebsite: false, minimizeCpu: false,
                randomizeSession: true, antiFingerprint: true,
                pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0,
                adminPriority: 0, adminWeight: 1, forceStopReason: ''
            };

            if ((!currentSettings.geoTargets || currentSettings.geoTargets.length === 0) && currentSettings.countries?.length > 0) {
                const count = currentSettings.countries.length;
                const percentPerCountry = Math.floor(100 / count);
                const remainder = 100 - (percentPerCountry * count);
                currentSettings.geoTargets = currentSettings.countries.map((c: string, i: number) => {
                    return {
                        id: `geo-${Date.now()}-${i}`,
                        country: c,
                        countryCode: c,
                        percent: i === 0 ? percentPerCountry + remainder : percentPerCountry
                    };
                });
            }

            if (!currentSettings.languages) {
                currentSettings.languages = [currentSettings.language || 'en-US'];
            }

            if (!currentSettings.geoTargets || currentSettings.geoTargets.length === 0) {
                currentSettings.geoTargets = [{ id: 'default-geo', country: 'United States', countryCode: 'US', percent: 100 }];
            }
            
            currentSettings.geoTargets = currentSettings.geoTargets.map((t: GeoTarget) => ({
                ...t,
                countryCode: t.countryCode || COUNTRIES_LIST.find(c => c.name === t.country)?.code || ''
            }));

            setSettings(currentSettings);
        }

        const sysSettings = db.getSystemSettings();
        setSystemTemplates(sysSettings.payloadTemplates || []);

        // Load daily_limit and total_target from project
        if (p) {
            setDailyLimit(p.daily_limit || p.customTarget?.dailyLimit || 0);
            setTotalTarget(p.total_target || p.customTarget?.totalVisitors || 0);
        }

        setIsLoading(false);
    }, [projectId]);

    useEffect(() => {
        const fetchExpiry = async () => {
            const expiry = await db.getCalculatedExpiry(projectId);
            setCalculatedExpiry(expiry);
        };
        fetchExpiry();
    }, [projectId]);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            const stats = await db.syncProjectStats(projectId, 30);
            setProjectStats(fillMissingDays(stats, 30));
            setStatsLoading(false);
        };
        fetchStats();
    }, [projectId]);

    useEffect(() => {
        const fetchHourlyStats = async () => {
            if (chartView === 'hourly') {
                setStatsLoading(true);
                const stats = await db.syncProjectStatsHourly(projectId, 24);
                setHourlyStats(stats);
                setStatsLoading(false);
            }
        };
        fetchHourlyStats();
    }, [projectId, chartView]);

    useEffect(() => {
        const fetchLiveStats = async () => {
            if (chartView === 'live') {
                setStatsLoading(true);
                const stats = await db.syncProjectStatsLive(projectId);
                setLiveStats(stats);
                setStatsLoading(false);
            }
        };

        if (chartView === 'live') {
            fetchLiveStats();
            liveIntervalRef.current = setInterval(fetchLiveStats, 5 * 60 * 1000);
        }

        return () => {
            if (liveIntervalRef.current) {
                clearInterval(liveIntervalRef.current);
                liveIntervalRef.current = null;
            }
        };
    }, [projectId, chartView]);

    useEffect(() => {
        const closeDropdowns = () => {
            setShowLangDropdown(false);
            setShowCountryDropdown(false);
        }
        document.addEventListener('click', closeDropdowns);
        return () => document.removeEventListener('click', closeDropdowns);
    }, []);

    if (isLoading || !project || !settings) return <div className="p-12 text-center text-gray-500">Loading Configuration...</div>;

    const handleChange = (key: keyof ProjectSettings, value: any) => {
        setSettings(prev => prev ? ({ ...prev, [key]: value }) : undefined);
    };

    const handleSave = async () => {
        if (!settings.entryUrls || settings.entryUrls.trim() === '') {
            alert("Entry URLs are mandatory. Please provide at least one URL.");
            return;
        }

        if (!dailyLimit || dailyLimit <= 0) {
            alert("Daily Limit must be greater than 0. Please configure traffic targets in the Traffic Schedule section.");
            return;
        }

        if (!totalTarget || totalTarget <= 0) {
            alert("Total Target must be greater than 0. Please configure traffic targets in the Traffic Schedule section.");
            return;
        }

        const totalPercent = (settings.geoTargets || []).reduce((sum, t) => sum + t.percent, 0);
        if (totalPercent !== 100 && (settings.geoTargets || []).length > 0) {
            alert(`Total location percentage must equal 100%. Current total: ${totalPercent}%`);
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        const updatedSettings = {
            ...settings,
            countries: (settings.geoTargets || []).map(t => t.country),
            language: (settings.languages || [])[0] || 'en-US'
        };

        const updatedProject: Project = { 
            ...project, 
            settings: updatedSettings,
            daily_limit: dailyLimit,
            total_target: totalTarget,
            customTarget: {
                ...project?.customTarget,
                dailyLimit,
                totalVisitors: totalTarget
            }
        };
        
        try {
            await db.updateProjectAdmin(updatedProject);
            setProject(updatedProject);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            onUpdate();
        } catch (error) {
            console.error("Failed to save project:", error);
            alert("Failed to save project settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!project) return;
        const newStatus = project.status === 'active' ? 'stopped' : 'active';
        try {
            await db.updateProjectStatusAdmin(project.id, newStatus);
            setProject({ ...project, status: newStatus });
            onUpdate();
        } catch (error) {
            console.error("Failed to update project status:", error);
            alert("Failed to update project status. Please try again.");
        }
    };

    const handleCloneProject = async () => {
        if (!project) return;
        if (!confirm(`Clone "${project.name}"? A copy will be created with status "paused".`)) return;
        try {
            await db.cloneProject(project.id);
            onUpdate();
            alert('Project cloned successfully!');
        } catch (error) {
            console.error("Failed to clone project:", error);
            alert("Failed to clone project. Please try again.");
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) return;
        try {
            await db.deleteProject(project.id);
            onUpdate();
            onBack();
        } catch (error) {
            console.error("Failed to delete project:", error);
            alert("Failed to delete project. Please try again.");
        }
    };

    const handleSaveAsTemplate = () => {
        if (!newTemplateName.trim()) return;
        const sysSettings = db.getSystemSettings();
        const newTemplate: PayloadTemplate = {
            id: `tpl-${Date.now()}`,
            name: newTemplateName,
            json: JSON.stringify(settings)
        };
        const updatedSys = {
            ...sysSettings,
            payloadTemplates: [...(sysSettings.payloadTemplates || []), newTemplate]
        };
        db.saveSystemSettings(updatedSys);
        setSystemTemplates(updatedSys.payloadTemplates || []);
        setNewTemplateName('');
        setShowSaveTemplate(false);
        alert('Template saved successfully!');
    };

    const handleLoadTemplate = (templateId: string) => {
        const template = systemTemplates.find(t => t.id === templateId);
        if (template) {
            try {
                const loadedSettings = JSON.parse(template.json);
                setSettings({ ...settings, ...loadedSettings });
                setShowLoadTemplate(false);
                alert('Template loaded. Please review settings before saving.');
            } catch (e) {
                alert('Failed to parse template data.');
            }
        }
    };

    const handleScanGA = async () => {
        const entryUrl = (settings.entryUrls || '').split('\n')[0]?.trim();
        if (!entryUrl) {
            alert('Please enter an Entry URL first.');
            return;
        }
        setIsScanningGA(true);

        try {
            const tid = await db.scanGA4(entryUrl);
            handleChange('gaId', tid);
            alert(`Found Analytics ID: ${tid}`);
        } catch (e: any) {
            alert(`Scan failed: ${e.message || 'No GA ID found'}`);
        } finally {
            setIsScanningGA(false);
        }
    };

    const handleAddCountry = (isoCode: string) => {
        if ((settings.geoTargets || []).find(t => t.country === isoCode)) return;

        const currentCount = (settings.geoTargets || []).length;
        const newCount = currentCount + 1;
        const newPercent = Math.floor(100 / newCount);

        const updatedTargets = (settings.geoTargets || []).map(t => ({ ...t, percent: newPercent }));
        const remainder = 100 - (newPercent * (newCount - 1));

        const countryInfo = COUNTRIES_LIST.find(c => c.code === isoCode);
        const newTarget: GeoTarget = {
            id: `geo-${Date.now()}`,
            country: countryInfo?.name || isoCode,
            countryCode: isoCode,
            percent: remainder
        };

        handleChange('geoTargets', [...updatedTargets, newTarget]);
        setCountrySearch('');
    };

    const handleRemoveCountry = (id: string) => {
        handleChange('geoTargets', (settings.geoTargets || []).filter(t => t.id !== id));
    };

    const handleGeoPercentChange = (id: string, newPercent: number) => {
        const updated = (settings.geoTargets || []).map(t => t.id === id ? { ...t, percent: newPercent } : t);
        handleChange('geoTargets', updated);
    };

    const handleAddLanguage = (lang: string) => {
        if (!(settings.languages || []).includes(lang)) {
            handleChange('languages', [...(settings.languages || []), lang]);
        }
        setLanguageSearch('');
    }

    const handleRemoveLanguage = (lang: string) => {
        handleChange('languages', (settings.languages || []).filter(l => l !== lang));
    }

    const countUrls = (text: string | undefined) => (text || '').split('\n').filter(line => line.trim().length > 0).length;

    const entryCount = countUrls(settings?.entryUrls);
    const innerCount = countUrls(settings?.innerUrls);
    const exitCount = countUrls(settings?.exitUrls);
    const totalUrlCount = entryCount + innerCount + exitCount;

    const stats = projectStats.length > 0 ? projectStats : (project.stats || []);

    const filteredLanguages = ALL_LANGUAGES.filter(l => l.toLowerCase().includes(languageSearch.toLowerCase()));
    const filteredCountries = COUNTRIES_LIST.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

    const totalVolume = project.customTarget?.totalVisitors || 0;
    const dailySpeed = project.customTarget?.dailyLimit || 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            {/* --- HEADER ACTIONS --- */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 border border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-sm text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Configuration</div>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${project.plan === 'Expert' ? 'bg-green-50 text-green-700 border-green-200' :
                                project.plan === 'Professional' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-orange-50 text-orange-700 border-orange-200'
                                }`}>
                                {project.plan} Plan
                            </span>
                        </div>
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editedName.trim()) {
                                            setProject({ ...project, name: editedName.trim() });
                                            setIsEditingName(false);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsEditingName(false);
                                            setEditedName(project.name);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (editedName.trim()) {
                                            setProject({ ...project, name: editedName.trim() });
                                        }
                                        setIsEditingName(false);
                                    }}
                                    className="text-2xl font-black text-gray-900 bg-gray-100 px-2 py-1 outline-none focus:ring-2 focus:ring-[#ff4d00]"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h2 className="text-2xl font-black text-gray-900">{project.name}</h2>
                                <button
                                    onClick={() => {
                                        setEditedName(project.name);
                                        setIsEditingName(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                    title="Edit project name"
                                >
                                    <Pencil size={16} className="text-[#ff4d00]" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">

                    {/* Template Controls */}
                    <div className="flex items-center gap-2 mr-4 border-r border-gray-200 pr-4">
                        <button
                            onClick={() => setShowSaveTemplate(true)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#ff4d00] hover:bg-orange-50 border border-gray-200 hover:border-[#ff4d00] transition-colors"
                        >
                            <Save size={14} className="text-[#ff4d00]" /> Save Template
                        </button>
                        <button
                            onClick={() => setShowLoadTemplate(true)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#ff4d00] hover:bg-orange-50 border border-gray-200 hover:border-[#ff4d00] transition-colors"
                        >
                            <Upload size={14} className="text-[#ff4d00]" /> Load Template
                        </button>
                    </div>

                    {saveSuccess && (
                        <span className="text-green-600 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-2 mr-4 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Saved
                        </span>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#ff4d00] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-70 shadow-lg">
                        <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={handleCloneProject}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#ff4d00] hover:bg-orange-50 border border-gray-200 hover:border-[#ff4d00] transition-colors"
                    >
                        <Copy size={14} className="text-[#ff4d00]" /> Clone
                    </button>
                    <button 
                        onClick={handleToggleStatus}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#ff4d00] hover:bg-orange-50 border border-gray-200 hover:border-[#ff4d00] transition-colors"
                    >
                        {project.status === 'active' ? <Pause size={14} className="text-[#ff4d00]" /> : <Play size={14} className="text-[#ff4d00]" />} 
                        {project.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button 
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#ff4d00] hover:bg-orange-50 border border-gray-200 hover:border-[#ff4d00] transition-colors"
                    >
                        <Trash2 size={14} className="text-[#ff4d00]" /> Delete
                    </button>
                </div>
            </div>

            {/* --- TEMPLATE MODALS --- */}
            {showSaveTemplate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 w-full max-w-md shadow-xl border border-gray-200">
                        <h3 className="text-sm font-bold uppercase mb-4">Save Configuration as Template</h3>
                        <input
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] mb-4"
                            placeholder="Template Name (e.g. Mobile US Organic)"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowSaveTemplate(false)} className="px-4 py-2 text-xs font-bold uppercase text-gray-500">Cancel</button>
                            <button onClick={handleSaveAsTemplate} className="px-4 py-2 text-xs font-bold uppercase bg-black text-white hover:bg-[#ff4d00]">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showLoadTemplate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 w-full max-w-md shadow-xl border border-gray-200">
                        <h3 className="text-sm font-bold uppercase mb-4">Load Template</h3>
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {systemTemplates.length === 0 ? <p className="text-xs text-gray-400">No templates found.</p> : systemTemplates.map(t => (
                                <button key={t.id} onClick={() => handleLoadTemplate(t.id)} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium border border-transparent hover:border-gray-200">
                                    {t.name}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowLoadTemplate(false)} className="w-full px-4 py-2 text-xs font-bold uppercase bg-black text-white hover:bg-gray-800">Close</button>
                    </div>
                </div>
            )}

            {/* --- ADMIN CONTROLS BAR --- */}
            <div className="bg-gray-900 text-white p-4 flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Plan</span>
                    <select
                        value={project.plan}
                        onChange={(e) => setProject({ ...project, plan: e.target.value })}
                        className="bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs font-bold uppercase"
                    >
                        <option value="Free Trial">Free Trial</option>
                        <option value="Starter">Starter</option>
                        <option value="Growth">Growth</option>
                        <option value="Economy">Economy</option>
                        <option value="Professional">Professional</option>
                        <option value="Expert">Expert</option>
                        <option value="Agency">Agency</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Status</span>
                    <select
                        value={project.status}
                        onChange={(e) => setProject({ ...project, status: e.target.value })}
                        className="bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs font-bold uppercase"
                    >
                        <option value="active">Active</option>
                        <option value="stopped">Stopped</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived (Admin)</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Priority</span>
                    <input
                        type="number"
                        min="-10"
                        max="10"
                        value={settings.adminPriority || 0}
                        onChange={(e) => handleChange('adminPriority', parseInt(e.target.value))}
                        className="w-16 bg-gray-800 border border-gray-700 px-2 py-1.5 text-xs font-bold text-center"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Weight</span>
                    <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="5.0"
                        value={settings.adminWeight || 1}
                        onChange={(e) => handleChange('adminWeight', parseFloat(e.target.value))}
                        className="w-20 bg-gray-800 border border-gray-700 px-2 py-1.5 text-xs font-bold text-center"
                    />
                </div>
                <div className="flex items-center gap-3 flex-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Expires</span>
                    <input
                        type="date"
                        value={project.expires || ''}
                        onChange={(e) => setProject({ ...project, expires: e.target.value })}
                        className="bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs font-bold"
                    />
                </div>
                {project.status === 'stopped' && (
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-[10px] font-bold uppercase text-red-400">Force Stop Reason</span>
                        <input
                            value={settings.forceStopReason || ''}
                            onChange={(e) => handleChange('forceStopReason', e.target.value)}
                            className="flex-1 bg-gray-800 border border-red-900 px-3 py-1.5 text-xs font-bold text-red-100 placeholder-red-700"
                            placeholder="Reason shown to user..."
                        />
                    </div>
                )}
            </div>

            {/* --- STATUS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Target size={14} /> Total Target</div>
                    <div className="text-xl font-bold text-gray-900">{totalVolume > 0 ? totalVolume.toLocaleString() : project.plan}</div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><BarChart2 size={14} /> Daily Speed</div>
                    <div className="text-xl font-bold text-gray-900">{dailySpeed > 0 ? `${dailySpeed.toLocaleString()}/day` : 'N/A'}</div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Activity size={14} /> Hits Total</div>
                    <div className="text-xl font-bold text-gray-900">{project.totalHits?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Radio size={14} /> Status</div>
                    <div className={`text-sm font-black uppercase tracking-wide ${project.status === 'active' ? 'text-green-600' : project.status === 'stopped' ? 'text-red-600' : 'text-gray-500'}`}>
                        {project.status === 'completed' ? 'Expired' : project.status}
                    </div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Calendar size={14} /> Expires</div>
                    {calculatedExpiry ? (
                        <div>
                            {calculatedExpiry.message ? (
                                <div className="text-sm font-bold text-orange-500">{calculatedExpiry.message}</div>
                            ) : calculatedExpiry.daysRemaining !== null ? (
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{calculatedExpiry.expiresDate}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        {calculatedExpiry.daysRemaining.toFixed(1)} days remaining
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm font-bold text-gray-900">{project.expires}</div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm font-bold text-gray-900">{project.expires}</div>
                    )}
                </div>
            </div>

            {/* --- TRAFFIC SCHEDULE --- */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <button
                    onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-[#ff4d00]" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00]">Traffic Schedule</h3>
                    </div>
                    {isScheduleExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>
                
                {isScheduleExpanded && (
                    <div className="p-6 pt-0 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                        {/* Traffic Targets Section */}
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="text-xs font-bold uppercase text-orange-700 mb-4 flex items-center gap-2">
                                <Target size={14} /> Traffic Targets (Required)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Total Target (Total Visitors) *</Label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={totalTarget}
                                        onChange={(e) => setTotalTarget(parseInt(e.target.value) || 0)}
                                        className="w-full bg-white border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                        placeholder="e.g. 10000"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Total number of visitors for this campaign</p>
                                </div>
                                <div>
                                    <Label>Daily Limit (Visitors per Day) *</Label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={dailyLimit}
                                        onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                                        className="w-full bg-white border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                        placeholder="e.g. 500"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        {totalTarget > 0 && dailyLimit > 0 
                                            ? `Duration: ${Math.ceil(totalTarget / dailyLimit)} days`
                                            : 'Maximum visitors per day'}
                                    </p>
                                </div>
                            </div>
                            {(totalTarget === 0 || dailyLimit === 0) && (
                                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 font-bold">
                                    Both Total Target and Daily Limit are required. Traffic will not be delivered without these values.
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                            <div>
                                <Label>Start Date</Label>
                                <input
                                    type="date"
                                    value={settings.scheduleStart || ''}
                                    onChange={(e) => handleChange('scheduleStart', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <input
                                    type="date"
                                    value={settings.scheduleEnd || ''}
                                    onChange={(e) => handleChange('scheduleEnd', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                />
                            </div>
                            <div>
                                <Label>Schedule Traffic Amount</Label>
                                <input
                                    type="number"
                                    value={settings.scheduleTrafficAmount || ''}
                                    onChange={(e) => handleChange('scheduleTrafficAmount', parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                    placeholder="Hits per day"
                                />
                            </div>
                            <div>
                                <Label>Distribution Pattern</Label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleChange('schedulePattern', 'even')}
                                        className={`flex-1 px-3 py-3 text-xs font-bold uppercase tracking-wider border transition-colors ${
                                            settings.schedulePattern === 'even' || !settings.schedulePattern
                                                ? 'border-[#ff4d00] bg-orange-50 text-[#ff4d00]'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        Even
                                    </button>
                                    <button
                                        onClick={() => handleChange('schedulePattern', 'realistic')}
                                        className={`flex-1 px-3 py-3 text-xs font-bold uppercase tracking-wider border transition-colors ${
                                            settings.schedulePattern === 'realistic'
                                                ? 'border-[#ff4d00] bg-orange-50 text-[#ff4d00]'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        Realistic
                                    </button>
                                </div>
                                {settings.schedulePattern === 'realistic' && (
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Traffic varies by time of day and day of week for natural patterns.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- TRAFFIC CHART --- */}
            <div className="bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00]">Traffic Statistics</h3>
                        <div className="flex bg-gray-100 rounded-sm p-1">
                            <button onClick={() => setChartView('daily')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === 'daily' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>30 Days</button>
                            <button onClick={() => setChartView('hourly')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === 'hourly' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>24 Hours</button>
                            <button onClick={() => setChartView('live')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === 'live' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>Live</button>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-bold">
                        Total Views: 
                        <span className="text-gray-900 ml-1">
                            {(chartView === 'daily' ? stats : chartView === 'hourly' ? hourlyStats : liveStats).reduce((a, b) => a + (b.pageviews || b.visitors), 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                {chartView === 'live' && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#ff4d00] rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Live Traffic - Updated every 5 minutes</span>
                    </div>
                )}

                <div className="h-64 flex items-end justify-between gap-1 w-full px-4 border-b border-gray-100 pb-2">
                    {statsLoading ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm animate-pulse">Loading statistics...</div>
                    ) : (chartView === 'daily' ? stats : chartView === 'hourly' ? hourlyStats : liveStats).length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            {chartView === 'live' ? 'No live traffic data available.' : 'No traffic data available.'}
                        </div>
                    ) : (
                        (chartView === 'daily' ? stats : chartView === 'hourly' ? hourlyStats : liveStats).map((stat, i) => {
                            const val = stat.pageviews || stat.visitors;
                            const dataStats = chartView === 'daily' ? stats : chartView === 'hourly' ? hourlyStats : liveStats;
                            const localMax = Math.max(...dataStats.map(s => s.pageviews || s.visitors), 1);
                            const heightPercent = localMax > 0 ? (val / localMax) * 100 : 0;
                            const label = chartView === 'daily' ? (stat as any).date : chartView === 'hourly' ? (stat as any).hour : (stat as any).time;
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                        {label}: {val.toLocaleString()}
                                    </div>
                                    <div className={`w-full opacity-80 hover:opacity-100 transition-opacity rounded-t-sm min-w-[4px] bg-[#ff4d00]`} style={{ height: `${heightPercent}%`, minHeight: '4px' }}></div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* --- BASIC SETTINGS --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <SettingsIcon /> Basic Settings
                    </h3>

                    <div className="space-y-8">
                        <RangeControl label="Bounce Rate" value={settings.bounceRate} onChange={(v) => handleChange('bounceRate', v)} suffix="%" />
                        <RangeControl label="Visitor Returning Rate" value={settings.returnRate} onChange={(v) => handleChange('returnRate', v)} suffix="%" />

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <Label>Device Distribution</Label>
                                <div className="flex gap-2">
                                    <button onClick={() => { handleChange('deviceSplit', 100); handleChange('tabletSplit', 0); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#ff4d00]">Desktop Only</button>
                                    <button onClick={() => { handleChange('deviceSplit', 33); handleChange('tabletSplit', 33); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#ff4d00]">Balanced</button>
                                    <button onClick={() => { handleChange('deviceSplit', 0); handleChange('tabletSplit', 0); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#ff4d00]">Mobile Only</button>
                                </div>
                            </div>

                            {/* Visual Bar */}
                            <div className="relative h-4 bg-gray-100 rounded-sm overflow-hidden flex text-[8px] font-bold text-white uppercase text-center leading-4 shadow-inner">
                                <div className="h-full bg-[#ff4d00]" style={{ width: `${settings.deviceSplit}%` }}>{settings.deviceSplit > 10 && 'Desktop'}</div>
                                <div className="h-full bg-gray-600" style={{ width: `${settings.tabletSplit || 0}%` }}>{(settings.tabletSplit || 0) > 10 && 'Tablet'}</div>
                                <div className="h-full bg-black/80" style={{ width: `${100 - settings.deviceSplit - (settings.tabletSplit || 0)}%` }}>{(100 - settings.deviceSplit - (settings.tabletSplit || 0)) > 10 && 'Mobile'}</div>
                            </div>

                            {/* Desktop Slider */}
                            <div className="relative">
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    <span className="flex items-center gap-1 text-[#ff4d00]"><Monitor size={12} /> Desktop</span>
                                    <span>{settings.deviceSplit}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={settings.deviceSplit}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value);
                                        const max = 100 - (settings.tabletSplit || 0);
                                        handleChange('deviceSplit', Math.min(v, max));
                                    }}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                                />
                            </div>

                            {/* Tablet Slider */}
                            <div className="relative">
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    <span className="flex items-center gap-1 text-gray-600"><Monitor size={12} /> Tablet</span>
                                    <span>{settings.tabletSplit || 0}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={settings.tabletSplit || 0}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value);
                                        const max = 100 - settings.deviceSplit;
                                        handleChange('tabletSplit', Math.min(v, max));
                                    }}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                                />
                            </div>

                            {/* Mobile Display */}
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase bg-gray-50 p-2 rounded-sm border border-gray-100">
                                <span className="flex items-center gap-1 text-black"><Smartphone size={12} /> Mobile Remainder</span>
                                <span className="text-black">{Math.max(0, 100 - settings.deviceSplit - (settings.tabletSplit || 0))}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ADDITIONAL SETTINGS --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <SettingsIcon /> Additional Settings
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <Label>Time On Page</Label>
                            <CustomSelect
                                value={settings.timeOnPage}
                                onChange={(v) => handleChange('timeOnPage', v)}
                                options={TIME_ON_PAGE_OPTS}
                            />
                        </div>

                        <div>
                            <Label>Timezone</Label>
                            <CustomSelect
                                value={settings.timezone}
                                onChange={(v) => handleChange('timezone', v)}
                                options={TIMEZONES}
                            />
                        </div>

                        {/* Multi-Select Language */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <Label>Browser Languages</Label>
                            <div className="bg-[#f9fafb] border border-gray-200 p-2 min-h-[48px] flex flex-wrap gap-2">
                                {(settings.languages || []).map(lang => (
                                    <span key={lang} className="bg-white border border-gray-200 text-xs font-bold uppercase px-2 py-1 flex items-center gap-1 rounded-sm">
                                        {lang} <button onClick={() => handleRemoveLanguage(lang)} className="hover:text-red-500"><X size={10} /></button>
                                    </span>
                                ))}
                                <input
                                    value={languageSearch}
                                    onChange={(e) => {
                                        setLanguageSearch(e.target.value);
                                        setShowLangDropdown(true);
                                    }}
                                    onFocus={() => setShowLangDropdown(true)}
                                    className="flex-1 bg-transparent text-sm outline-none min-w-[80px]"
                                    placeholder={(settings.languages || []).length === 0 ? "Select Language..." : ""}
                                />
                            </div>
                            {showLangDropdown && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto z-50">
                                    {filteredLanguages.map(l => (
                                        <div
                                            key={l}
                                            className="p-3 text-sm hover:bg-orange-50 cursor-pointer"
                                            onClick={() => {
                                                handleAddLanguage(l);
                                                setShowLangDropdown(false);
                                            }}
                                        >
                                            {l}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* GA ID Tool */}
                        <div>
                            <Label>Google Analytics ID</Label>
                            <div className="relative flex items-center">
                                <input
                                    value={settings.gaId}
                                    onChange={(e) => handleChange('gaId', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium text-gray-900 pr-10"
                                    placeholder="G-XXXXXXXXXX"
                                />
                                <button
                                    onClick={handleScanGA}
                                    className="absolute right-2 text-xs font-bold text-gray-400 hover:text-[#ff4d00] uppercase tracking-wide flex items-center gap-1"
                                    title="Scan Entry URL for GA ID"
                                    disabled={isScanningGA}
                                >
                                    {isScanningGA ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- URL CONFIGURATION --- */}
            <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                    <Globe size={16} /> URL Configuration
                </h3>

                <div className="space-y-8">
                    <RangeControl label="Inner URLs Limit" value={settings.innerUrlCount} onChange={(v) => handleChange('innerUrlCount', v)} max={10} />

                    <div className="flex items-end justify-between border-b border-gray-100 pb-2 mb-2">
                        <Label>Visit Behavior</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Visit Order</label>
                            <CustomSelect
                                value={settings.urlVisitOrder || 'random'}
                                onChange={(v) => handleChange('urlVisitOrder', v)}
                                options={URL_ORDER_MODES}
                            />
                            <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                                <strong>Sequential:</strong> Landing &rarr; Inner 1 &rarr; Inner 2.<br />
                                <strong>Random:</strong> Picks random pages from pool.
                            </p>
                        </div>
                    </div>

                    <UrlInput
                        label="Entry URLs"
                        value={settings.entryUrls}
                        onChange={(v) => handleChange('entryUrls', v)}
                        checked={settings.autoCrawlEntry}
                        onCheck={(v) => handleChange('autoCrawlEntry', v)}
                        countLabel={`Total: ${totalUrlCount}/10`}
                        required
                    />

                    <UrlInput
                        label="Inner URLs"
                        value={settings.innerUrls}
                        onChange={(v) => handleChange('innerUrls', v)}
                        checked={settings.autoCrawlInner}
                        onCheck={(v) => handleChange('autoCrawlInner', v)}
                        countLabel={`Total: ${totalUrlCount}/10`}
                    />

                    <UrlInput
                        label="Exit URLs"
                        value={settings.exitUrls}
                        onChange={(v) => handleChange('exitUrls', v)}
                        checked={settings.autoCrawlExit}
                        onCheck={(v) => handleChange('autoCrawlExit', v)}
                        countLabel={`Total: ${totalUrlCount}/10`}
                    />

                    <div>
                        <Label>Sitemap / RSS Feed</Label>
                        <input
                            value={settings.sitemap || ''}
                            onChange={(e) => handleChange('sitemap', e.target.value)}
                            className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                            placeholder="https://example.com/sitemap.xml"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Automatically discover URLs from your sitemap</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* --- ADVANCED LOCATION --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <MapPin size={16} /> Location Targeting
                    </h3>

                    <div className="mb-4">
                        <Label>Search Countries</Label>
                        <div className="relative">
                            <input
                                value={countrySearch}
                                onChange={(e) => {
                                    setCountrySearch(e.target.value);
                                    setShowCountryDropdown(true);
                                }}
                                onFocus={() => setShowCountryDropdown(true)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="Type to search (e.g. United States)"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        {showCountryDropdown && countrySearch && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto z-50 mt-1">
                                {filteredCountries.map(c => (
                                    <div
                                        key={c.code}
                                        className="p-3 text-sm hover:bg-orange-50 cursor-pointer font-medium flex items-center gap-2"
                                        onClick={() => {
                                            handleAddCountry(c.code);
                                            setShowCountryDropdown(false);
                                        }}
                                    >
                                        <img 
                                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                                            alt={c.code} 
                                            className="w-4 h-auto rounded-sm"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Countries */}
                    {(settings.geoTargets || []).length > 0 && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Selected ({(settings.geoTargets || []).length})</span>
                            </div>
                            <div className="space-y-2">
                                {(settings.geoTargets || []).map(target => {
                                    const country = COUNTRIES_LIST.find(c => c.code === target.country);
                                    const othersTotal = (settings.geoTargets || []).reduce((sum, t) => t.id !== target.id ? sum + t.percent : sum, 0);
                                    const maxPercent = 100 - othersTotal;
                                    
                                    return (
                                        <div key={target.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100">
                                            <img 
                                                src={`https://flagcdn.com/w24/${target.country.toLowerCase()}.png`} 
                                                alt={target.country} 
                                                className="w-6 h-auto rounded-sm"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <span className="flex-1 font-bold text-sm text-gray-900">{country?.name || target.country}</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max={maxPercent}
                                                value={target.percent}
                                                onChange={(e) => handleGeoPercentChange(target.id, parseInt(e.target.value))}
                                                className="w-24 accent-[#ff4d00]"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                max={maxPercent}
                                                value={target.percent}
                                                onChange={(e) => handleGeoPercentChange(target.id, parseInt(e.target.value) || 0)}
                                                className="w-16 p-1 text-center text-sm font-bold border border-gray-200 outline-none focus:border-[#ff4d00]"
                                            />
                                            <span className="text-sm font-bold text-gray-400">%</span>
                                            <button onClick={() => handleRemoveCountry(target.id)} className="text-gray-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`text-right mt-2 text-sm font-bold ${(settings.geoTargets || []).reduce((a, b) => a + b.percent, 0) === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                                Total: {(settings.geoTargets || []).reduce((a, b) => a + b.percent, 0)}%
                            </div>
                        </div>
                    )}

                    {(settings.geoTargets || []).length === 0 && (
                        <div className="text-center p-4 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200">
                            No countries selected. Traffic will be global.
                        </div>
                    )}
                </div>

                {/* --- TRAFFIC SOURCE --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <Activity size={16} /> Traffic Source
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Source Type</Label>
                            <CustomSelect
                                value={settings.trafficSource}
                                onChange={(v) => handleChange('trafficSource', v)}
                                options={TRAFFIC_SOURCES}
                            />
                        </div>

                        {((settings.trafficSource || '')).includes('Organic') && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label>Keywords (One per line)</Label>
                                <textarea
                                    value={settings.keywords || ''}
                                    onChange={(e) => handleChange('keywords', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium h-32 resize-none"
                                    placeholder="keyword 1&#10;keyword 2"
                                />
                            </div>
                        )}

                        {((settings.trafficSource || '').includes('Social') || (settings.trafficSource || '').includes('Referral')) && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label>Referrer URLs (One per line)</Label>
                                <textarea
                                    value={settings.referralUrls || ''}
                                    onChange={(e) => handleChange('referralUrls', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium h-32 resize-none"
                                    placeholder="https://referrer-site.com/post&#10;https://social-media.com/share"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- UTM SETTINGS --- */}
            <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 mt-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                    <Target size={16} /> Tracking & Attribution (UTM)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Campaign Source</Label>
                        <input value={settings.utmSource || ''} onChange={(e) => handleChange('utmSource', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. google, newsletter" />
                    </div>
                    <div>
                        <Label>Campaign Medium</Label>
                        <input value={settings.utmMedium || ''} onChange={(e) => handleChange('utmMedium', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. cpc, banner" />
                    </div>
                    <div>
                        <Label>Campaign Name</Label>
                        <input value={settings.utmCampaign || ''} onChange={(e) => handleChange('utmCampaign', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. spring_sale" />
                    </div>
                    <div>
                        <Label>Campaign Term</Label>
                        <input value={settings.utmTerm || ''} onChange={(e) => handleChange('utmTerm', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. running shoes" />
                    </div>
                    <div className="md:col-span-2">
                        <Label>Campaign Content</Label>
                        <input value={settings.utmContent || ''} onChange={(e) => handleChange('utmContent', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. logolink, textlink" />
                        <div className="mt-2 flex gap-2">
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{`{{random_keyword}}`}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{`{{timestamp}}`}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{`{{device_type}}`}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- GENERAL SETTINGS --- */}
            <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 mb-20 mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                    <SettingsIcon /> General Settings
                </h3>

                {/* Auto Renew Toggle */}
                <div className={`flex items-center justify-between p-6 mb-8 border-2 rounded-sm transition-all duration-300 relative overflow-hidden
                ${settings.autoRenew ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white'} 
            `}>
                    <div className="relative z-10 max-w-xl">
                        <span className="text-lg font-bold text-gray-900 flex items-center gap-3">
                            <Zap size={20} className={settings.autoRenew ? 'text-green-600' : 'text-gray-400'} />
                            Auto Renew Campaign
                        </span>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            Automatically renew this campaign using wallet credits when it expires.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <button
                            onClick={() => handleChange('autoRenew', !settings.autoRenew)}
                            className={`w-14 h-8 flex items-center p-1 transition-colors duration-300 rounded-full ${settings.autoRenew ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.autoRenew ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.autoRenew ? 'text-green-600' : 'text-gray-400'}`}>
                            {settings.autoRenew ? 'Active' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-8"></div>

                {/* System Features */}
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <Zap size={14} className="text-[#ff4d00]" /> System Features
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Toggle label="Cache Website" checked={settings.cacheWebsite || false} onChange={(v) => handleChange('cacheWebsite', v)} />
                    <Toggle label="Minimize CPU" checked={settings.minimizeCpu || false} onChange={(v) => handleChange('minimizeCpu', v)} />
                    <Toggle label="Anti-Fingerprint" checked={settings.antiFingerprint !== false} onChange={(v) => handleChange('antiFingerprint', v)} />
                    <Toggle label="Randomize Session" checked={settings.randomizeSession !== false} onChange={(v) => handleChange('randomizeSession', v)} />
                </div>
            </div>

        </div>
    );
};

// --- SUB COMPONENTS ---

const SettingsIconComponent = () => (
    <div className="w-1 h-3 bg-[#ff4d00] mr-1"></div>
)

const Label: React.FC<{ children: React.ReactNode, required?: boolean }> = ({ children, required }) => (
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
)

const RangeControl: React.FC<{ label: string, value: number, onChange: (v: number) => void, suffix?: string, max?: number }> = ({ label, value, onChange, suffix = '', max = 100 }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-end">
            <Label>{label}</Label>
            <span className="text-xs font-bold text-[#ff4d00]">{value}{suffix}</span>
        </div>
        <input
            type="range"
            min="0" max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
        />
    </div>
)

const UrlInput: React.FC<{ label: string, value: string, onChange: (v: string) => void, checked: boolean, onCheck: (v: boolean) => void, countLabel?: string, placeholder?: string, required?: boolean }> = ({ label, value, onChange, checked, onCheck, countLabel, placeholder, required }) => (
    <div className="flex items-start gap-4">
        <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} className="accent-[#ff4d00] w-4 h-4" />
                    <Label required={required}>{label}</Label>
                </div>
                {countLabel && <span className="text-[10px] font-bold text-gray-400">{countLabel}</span>}
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className={`w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium text-gray-900 transition-colors resize-y ${!checked ? 'opacity-50' : ''}`}
                placeholder={placeholder || "https://example.com/page"}
                disabled={!checked}
            />
        </div>
    </div>
)

const Toggle: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 ${checked ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
        >
            <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </button>
    </div>
)

export default AdminEditProject;
