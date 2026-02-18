








import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectSettings, TrafficLog, GeoTarget, PayloadTemplate } from '../types';
import { db } from '../services/db';
import {
    ArrowLeft, Calendar, Save, Copy, RefreshCw, Layers,
    HelpCircle, Globe, Activity, Smartphone, Monitor, CheckCircle2, Zap, Radio, Lock, ToggleLeft, ToggleRight,
    Plus, Trash2, Download, Upload, AlertCircle, FileCode, Search, MapPin, X, Target, BarChart2, Star, Play, Pause,
    Pencil, ChevronDown, ChevronUp
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import { COUNTRY_MAP, COUNTRIES_LIST, ALL_LANGUAGES, TRAFFIC_SOURCES, TIME_ON_PAGE_OPTS, TIMEZONES } from '../constants';

interface ProjectDetailsProps {
    projectId: string;
    onBack: () => void;
    onUpdate?: () => void;
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

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack, onUpdate }) => {
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<ProjectSettings | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [projectStats, setProjectStats] = useState<{ date: string; visitors: number; pageviews: number }[]>([]);
    const [hourlyStats, setHourlyStats] = useState<{ hour: string; visitors: number; pageviews: number }[]>([]);

    // Template State
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [systemTemplates, setSystemTemplates] = useState<PayloadTemplate[]>([]);

    // Chart State
    const [chartMode, setChartMode] = useState<'visitors' | 'pageviews'>('pageviews');
    const [chartView, setChartView] = useState<'daily' | 'hourly' | 'live'>('daily');
    const [statsLoading, setStatsLoading] = useState(false);
    const [liveStats, setLiveStats] = useState<{ time: string; visitors: number; pageviews: number }[]>([]);
    const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Name Edit State
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    // Schedule State
    const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

    // Calculated Expiry State
    const [calculatedExpiry, setCalculatedExpiry] = useState<{
        daysRemaining: number | null;
        expiresDate: string | null;
        balance: number;
        totalDailyConsumption: number;
        message: string | null;
    } | null>(null);

    // GA Scanner State
    const [isScanningGA, setIsScanningGA] = useState(false);

    // Search States
    const [languageSearch, setLanguageSearch] = useState('');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    useEffect(() => {
        const p = db.getProjectById(projectId);
        setProject(p);

        // Initialize settings from DB or defaults if missing
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
                utmSource: '', utmMedium: '', utmCampaign: '', utmTerm: '', utmContent: '',
                proxyMode: 'auto', customProxies: '',
                scheduleMode: 'continuous', scheduleTime: '', scheduleDuration: 60,
                urlVisitOrder: 'random',
                sitemap: '', shortener: '',
                autoRenew: false, cacheWebsite: false, minimizeCpu: false,
                randomizeSession: true, antiFingerprint: true,
                pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0
            };

            // Migration: Map old countries to geoTargets with ISO if possible
            if ((!currentSettings.geoTargets || currentSettings.geoTargets.length === 0) && currentSettings.countries?.length > 0) {
                const count = currentSettings.countries.length;
                const percentPerCountry = Math.floor(100 / count);
                const remainder = 100 - (percentPerCountry * count);

                // Try to map full names to ISO if they exist, else assume ISO
                currentSettings.geoTargets = currentSettings.countries.map((c, i) => {
                    // Check if 'c' is a name like "United States" and find key
                    const iso = Object.keys(COUNTRY_MAP).find(key => COUNTRY_MAP[key] === c) || c;
                    return {
                        id: `geo-${Date.now()}-${i}`,
                        country: iso, // Store ISO
                        percent: i === 0 ? percentPerCountry + remainder : percentPerCountry
                    };
                });
            }

            // Initialize languages array if missing
            if (!currentSettings.languages) {
                currentSettings.languages = [currentSettings.language || 'en-US'];
            }

            // Migration: Map daily_limit from customTarget to scheduleTrafficAmount in settings
            if (!currentSettings.scheduleTrafficAmount && p.customTarget?.dailyLimit) {
                currentSettings.scheduleTrafficAmount = p.customTarget.dailyLimit;
            }

            setSettings(currentSettings);
        }

        // Load Templates
        const sysSettings = db.getSystemSettings();
        setSystemTemplates(sysSettings.payloadTemplates || []);

        setLoading(false);
    }, [projectId]);

    // Fetch calculated expiry
    useEffect(() => {
        const fetchExpiry = async () => {
            const expiry = await db.getCalculatedExpiry(projectId);
            setCalculatedExpiry(expiry);
        };
        fetchExpiry();
    }, [projectId]);

    // Fetch project stats
    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            const stats = await db.syncProjectStats(projectId, 30);
            setProjectStats(fillMissingDays(stats, 30));
            setStatsLoading(false);
        };
        fetchStats();
    }, [projectId]);

    // Fetch hourly stats when chartView changes
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

    // Live stats polling
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

    // Click Outside Handler for Dropdowns
    useEffect(() => {
        const closeDropdowns = () => {
            setShowLangDropdown(false);
            setShowCountryDropdown(false);
        }
        document.addEventListener('click', closeDropdowns);
        return () => document.removeEventListener('click', closeDropdowns);
    }, []);

    if (loading || !project || !settings) return <div className="p-12 text-center text-gray-500">Loading Configuration...</div>;

    const isFreeTrial = project.plan === 'Free Trial';

    const handleChange = (key: keyof ProjectSettings, value: any) => {
        if (isFreeTrial) return;
        setSettings(prev => prev ? ({ ...prev, [key]: value }) : undefined);
    };

    const handleSave = async () => {
        if (isFreeTrial) return;

        if (!settings.entryUrls || settings.entryUrls.trim() === '') {
            alert("Entry URLs are mandatory. Please provide at least one URL.");
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

        const updatedProject: Project = { ...project, settings: updatedSettings };
        
        try {
            await db.updateProject(updatedProject);
            setProject(updatedProject);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to save project:", error);
            alert("Failed to save project settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- PROJECT CONTROL HANDLERS ---
    const handleToggleStatus = async () => {
        if (!project) return;
        const newStatus = project.status === 'active' ? 'stopped' : 'active';
        try {
            await db.updateProjectStatus(project.id, newStatus);
            setProject({ ...project, status: newStatus });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to update project status:", error);
            alert("Failed to update project status. Please try again.");
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) return;
        try {
            await db.deleteProject(project.id);
            if (onUpdate) onUpdate();
            navigate('/dashboard/campaigns');
        } catch (error) {
            console.error("Failed to delete project:", error);
            alert("Failed to delete project. Please try again.");
        }
    };

    // --- TEMPLATE HANDLERS ---
    const handleSaveAsTemplate = () => {
        if (!newTemplateName.trim()) return;
        const sysSettings = db.getSystemSettings();
        const newTemplate: PayloadTemplate = {
            id: `tpl-${Date.now()}`,
            name: newTemplateName,
            json: JSON.stringify(settings) // Storing full settings object as JSON
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
    }

    // --- GA SCANNER ---
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
    }

    // --- GEO HANDLERS (With ISO mapping) ---
    const handleAddCountry = (isoCode: string) => {
        if (isFreeTrial) return;
        if ((settings.geoTargets || []).find(t => t.country === isoCode)) return;

        const currentCount = (settings.geoTargets || []).length;
        const newCount = currentCount + 1;
        const newPercent = Math.floor(100 / newCount);

        const updatedTargets = (settings.geoTargets || []).map(t => ({ ...t, percent: newPercent }));
        const remainder = 100 - (newPercent * (newCount - 1));

        const newTarget: GeoTarget = {
            id: `geo-${Date.now()}`,
            country: isoCode, // Store ISO
            percent: remainder
        };

        handleChange('geoTargets', [...updatedTargets, newTarget]);
        setCountrySearch('');
    };

    const handleRemoveCountry = (id: string) => {
        if (isFreeTrial) return;
        handleChange('geoTargets', (settings.geoTargets || []).filter(t => t.id !== id));
    };

    const handleGeoPercentChange = (id: string, newPercent: number) => {
        if (isFreeTrial) return;
        const updated = (settings.geoTargets || []).map(t => t.id === id ? { ...t, percent: newPercent } : t);
        handleChange('geoTargets', updated);
    };

    // --- LANGUAGE HANDLERS ---
    const handleAddLanguage = (lang: string) => {
        if (isFreeTrial) return;
        if (!(settings.languages || []).includes(lang)) {
            handleChange('languages', [...(settings.languages || []), lang]);
        }
        setLanguageSearch('');
    }

    const handleRemoveLanguage = (lang: string) => {
        if (isFreeTrial) return;
        handleChange('languages', (settings.languages || []).filter(l => l !== lang));
    }

    // --- URL COUNTING LOGIC ---
    const countUrls = (text: string | undefined) => (text || '').split('\n').filter(line => line.trim().length > 0).length;

    const entryCount = countUrls(settings?.entryUrls);
    const innerCount = countUrls(settings?.innerUrls);
    const exitCount = countUrls(settings?.exitUrls);
    const totalUrlCount = entryCount + innerCount + exitCount;

    const stats = projectStats.length > 0 ? projectStats : (project.stats || []);
    const currentMax = stats.length > 0 ? Math.max(...stats.map(s => chartMode === 'visitors' ? s.visitors : (s.pageviews || s.visitors))) : 100;

    const filteredLanguages = ALL_LANGUAGES.filter(l => l.toLowerCase().includes(languageSearch.toLowerCase()));
    const filteredCountries = COUNTRIES_LIST.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

    // Determine Volume Display
    const totalVolume = project.customTarget?.totalVisitors || 0;
    const dailySpeed = project.customTarget?.dailyLimit || 0;

    // Resolve Country Name helper
    const getCountryName = (iso: string) => COUNTRY_MAP[iso] || iso;

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
                    {!isFreeTrial ? (
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#ff4d00] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-70 shadow-lg">
                            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-gray-200 cursor-not-allowed">
                            <Lock size={14} /> Read Only
                        </div>
                    )}
                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors">
                        <Copy size={14} /> Clone
                    </button>
                    <button 
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                            project.status === 'active' 
                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100' 
                                : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                        }`}
                    >
                        {project.status === 'active' ? <Pause size={14} /> : <Play size={14} />} 
                        {project.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button 
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={14} /> Delete
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

            {isFreeTrial && (
                <div className="bg-orange-50 border-l-4 border-[#ff4d00] p-4 flex items-start gap-3 shadow-sm">
                    <Zap className="text-[#ff4d00] shrink-0" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-orange-900 uppercase tracking-wide">Free Trial Mode</h4>
                        <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                            This project is running on a high-speed demonstration plan (6,000 hits/4h). Settings are locked.
                        </p>
                    </div>
                </div>
            )}

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
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Activity size={14} /> Hits Today</div>
                    <div className="text-xl font-bold text-gray-900">{project.hitsToday?.toLocaleString() || 0}</div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                            <div>
                                <Label>Start Date</Label>
                                <input
                                    type="date"
                                    value={settings.scheduleStart || ''}
                                    onChange={(e) => handleChange('scheduleStart', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                    disabled={isFreeTrial}
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <input
                                    type="date"
                                    value={settings.scheduleEnd || ''}
                                    onChange={(e) => handleChange('scheduleEnd', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                    disabled={isFreeTrial}
                                />
                            </div>
                            <div>
                                <Label>Daily Traffic (Hits per Day)</Label>
                                <input
                                    type="number"
                                    value={settings.scheduleTrafficAmount || ''}
                                    onChange={(e) => handleChange('scheduleTrafficAmount', parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                    placeholder="Hits per day"
                                    disabled={isFreeTrial}
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
                                        disabled={isFreeTrial}
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
                                        disabled={isFreeTrial}
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
                            <button onClick={() => setChartMode('visitors')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartMode === 'visitors' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>Visitors</button>
                            <button onClick={() => setChartMode('pageviews')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartMode === 'pageviews' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>Pageviews</button>
                        </div>
                        <div className="flex bg-gray-100 rounded-sm p-1">
                            <button onClick={() => setChartView('daily')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === 'daily' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>30 Days</button>
                            <button onClick={() => setChartView('hourly')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === 'hourly' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>24 Hours</button>
                            <button onClick={() => setChartView('live')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === 'live' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}>Live</button>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-bold">
                        Total {chartMode === 'visitors' ? 'Visits' : 'Views'}: 
                        <span className="text-gray-900 ml-1">
                            {(chartView === 'daily' ? stats : chartView === 'hourly' ? hourlyStats : liveStats).reduce((a, b) => a + (chartMode === 'visitors' ? b.visitors : (b.pageviews || b.visitors)), 0).toLocaleString()}
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
                            const val = chartMode === 'visitors' ? stat.visitors : (stat.pageviews || stat.visitors);
                            const dataStats = chartView === 'daily' ? stats : chartView === 'hourly' ? hourlyStats : liveStats;
                            const localMax = Math.max(...dataStats.map(s => chartMode === 'visitors' ? s.visitors : (s.pageviews || s.visitors)), 1);
                            const heightPercent = localMax > 0 ? (val / localMax) * 100 : 0;
                            const label = chartView === 'daily' ? (stat as any).date : chartView === 'hourly' ? (stat as any).hour : (stat as any).time;
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                        {label}: {val.toLocaleString()}
                                    </div>
                                    <div className={`w-full opacity-80 hover:opacity-100 transition-opacity rounded-t-sm min-w-[4px] ${chartView === 'live' ? 'bg-[#ff4d00]' : 'bg-[#ff4d00]'}`} style={{ height: `${heightPercent}%`, minHeight: '4px' }}></div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isFreeTrial ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>

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
                                    disabled={isFreeTrial}
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
                                    disabled={isFreeTrial}
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
                                disabled={isFreeTrial}
                            />
                        </div>

                        <div>
                            <Label>Timezone</Label>
                            <CustomSelect
                                value={settings.timezone}
                                onChange={(v) => handleChange('timezone', v)}
                                options={TIMEZONES}
                                disabled={isFreeTrial}
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
                                    disabled={isFreeTrial}
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
                                    disabled={isFreeTrial}
                                />
                                <button
                                    onClick={handleScanGA}
                                    className="absolute right-2 text-xs font-bold text-gray-400 hover:text-[#ff4d00] uppercase tracking-wide flex items-center gap-1"
                                    title="Scan Entry URL for GA ID"
                                    disabled={isScanningGA || isFreeTrial}
                                >
                                    {isScanningGA ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {project.plan === 'Economy' && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mx-6 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-orange-600" />
                        <div>
                            <p className="text-sm font-bold text-orange-900 uppercase tracking-tight">Tier Limitation: Economy</p>
                            <p className="text-[10px] text-orange-700 font-medium">Organic/Social sources, Residential IPs, and GA4 Automation are disabled on this plan.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={isFreeTrial ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}>
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
                                    disabled={isFreeTrial}
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

                        <div className={project.plan === 'Economy' ? 'opacity-50 pointer-events-none' : ''}>
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

                {/* --- UTM SETTINGS --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 mt-6" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <Target size={16} /> Tracking & Attribution (UTM)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Campaign Source</Label>
                            <input value={settings.utmSource || ''} onChange={(e) => handleChange('utmSource', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. google, newsletter" disabled={isFreeTrial} />
                        </div>
                        <div>
                            <Label>Campaign Medium</Label>
                            <input value={settings.utmMedium || ''} onChange={(e) => handleChange('utmMedium', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. cpc, banner" disabled={isFreeTrial} />
                        </div>
                        <div>
                            <Label>Campaign Name</Label>
                            <input value={settings.utmCampaign || ''} onChange={(e) => handleChange('utmCampaign', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. spring_sale" disabled={isFreeTrial} />
                        </div>
                        <div>
                            <Label>Campaign Term</Label>
                            <input value={settings.utmTerm || ''} onChange={(e) => handleChange('utmTerm', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. running shoes" disabled={isFreeTrial} />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Campaign Content</Label>
                            <input value={settings.utmContent || ''} onChange={(e) => handleChange('utmContent', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" placeholder="e.g. logolink, textlink" disabled={isFreeTrial} />
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{`{{random_keyword}}`}</span>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{`{{timestamp}}`}</span>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{`{{device_type}}`}</span>
                            </div>
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
                                    disabled={isFreeTrial}
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

                        {/* Selected Countries - AddProject Style */}
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
                                    disabled={isFreeTrial}
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
                                        disabled={isFreeTrial}
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
                                        disabled={isFreeTrial}
                                    />
                                </div>
                            )}
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
                                disabled={isFreeTrial}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.autoRenew ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.autoRenew ? 'text-green-600' : 'text-gray-400'}`}>
                                {settings.autoRenew ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-8"></div>

                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Star size={14} className="text-yellow-500" /> Premium Expert Features
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Expert ONLY Feature */}
                        <div className={`relative ${project.plan !== 'Expert' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="Automatic Website Crawler"
                                checked={settings.websiteCrawler || false}
                                onChange={(v) => project.plan === 'Expert' && handleChange('websiteCrawler', v)}
                            />
                            {project.plan !== 'Expert' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Expert Tier Required"></div>}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

// --- SUB COMPONENTS ---

const SettingsIcon = () => (
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

export default ProjectDetails;
