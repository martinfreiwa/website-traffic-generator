








import React, { useState, useEffect, useMemo } from 'react';
import { Project, ProjectSettings, TrafficLog, GeoTarget, PayloadTemplate } from '../types';
import { db } from '../services/db';
import {
    ArrowLeft, Calendar, Save, Copy, RefreshCw, Layers,
    HelpCircle, Globe, Activity, Smartphone, Monitor, CheckCircle2, Zap, Radio, Lock, ToggleLeft, ToggleRight,
    Plus, Trash2, Download, Upload, AlertCircle, FileCode, Search, MapPin, X, Target, BarChart2, Star
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import { COUNTRY_MAP, COUNTRIES_LIST, ALL_LANGUAGES, TRAFFIC_SOURCES, TIME_ON_PAGE_OPTS, TIMEZONES } from '../constants';

interface ProjectDetailsProps {
    projectId: string;
    onBack: () => void;
    onUpdate?: () => void;
}

// --- DEVICE / OS LIST ---
const DEVICE_OS_LIST = [
    { value: "All", label: "All Devices (Use Slider)" },
    { value: "Desktop, Windows", label: "Desktop - Windows" },
    { value: "Desktop, MacOS", label: "Desktop - MacOS" },
    { value: "Desktop, Linux", label: "Desktop - Linux" },
    { value: "Mobile, iPhone", label: "Mobile - iPhone" },
    { value: "Mobile, Android", label: "Mobile - Android" }
];

const BROWSERS = [
    { value: "Random", label: "Random (Default)" },
    { value: "Chrome", label: "Chrome" },
    { value: "Firefox", label: "Firefox" },
    { value: "Safari", label: "Safari" },
    { value: "Edge", label: "Microsoft Edge" }
];

const PROXY_MODES = [
    { value: "auto", label: "Auto-Rotate by Location" },
    { value: "sticky", label: "Sticky Session (Keep IP)" },
    { value: "custom", label: "Custom Proxy List" }
];

const SCHEDULE_MODES = [
    { value: "continuous", label: "Continuous (Daily Limits)" },
    { value: "burst", label: "Scheduled Burst" }
];

const URL_ORDER_MODES = [
    { value: "random", label: "Random Selection" },
    { value: "sequential", label: "Sequential Funnel" }
];

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack, onUpdate }) => {
    const [project, setProject] = useState<Project | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<ProjectSettings | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Template State
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [systemTemplates, setSystemTemplates] = useState<PayloadTemplate[]>([]);

    // Chart State
    const [chartMode, setChartMode] = useState<'visitors' | 'pageviews'>('visitors');

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
                trafficSpeed: 100, bounceRate: 0, returnRate: 0,

                deviceSplit: 70, tabletSplit: 0, deviceSpecific: "All", browser: "Random",
                timeOnPage: '3 minutes', timezone: 'UTC', language: 'en-US', languages: ['en-US'], gaId: '',
                entryUrls: '', innerUrls: '', exitUrls: '',
                autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
                innerUrlCount: 0,
                geoTargets: [], countries: ['US'], // Default ISO 'US'
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

            setSettings(currentSettings);
        }

        // Load Templates
        const sysSettings = db.getSystemSettings();
        setSystemTemplates(sysSettings.payloadTemplates || []);

        setLoading(false);
    }, [projectId]);

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

        let updates: Partial<ProjectSettings> = { [key]: value };

        // Device Logic: If specific mobile OS selected, force split to 0 (100% Mobile)
        if (key === 'deviceSpecific') {
            const val = value as string;
            if (val.includes('Mobile')) {
                updates.deviceSplit = 0;
                updates.tabletSplit = 0;
            } else if (val.includes('Desktop')) {
                updates.deviceSplit = 100;
                updates.tabletSplit = 0;
            }
        }

        setSettings(prev => prev ? ({ ...prev, ...updates }) : undefined);
    };

    const handleSave = async () => {
        if (isFreeTrial) return;

        if (!settings.entryUrls || settings.entryUrls.trim() === '') {
            alert("Entry URLs are mandatory. Please provide at least one URL.");
            return;
        }

        const totalPercent = settings.geoTargets.reduce((sum, t) => sum + t.percent, 0);
        if (totalPercent !== 100 && settings.geoTargets.length > 0) {
            alert(`Total location percentage must equal 100%. Current total: ${totalPercent}%`);
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        const updatedSettings = {
            ...settings,
            countries: settings.geoTargets.map(t => t.country),
            language: settings.languages[0] || 'en-US'
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
        const entryUrl = settings.entryUrls.split('\n')[0]?.trim();
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
        if (settings.geoTargets.find(t => t.country === isoCode)) return;

        const currentCount = settings.geoTargets.length;
        const newCount = currentCount + 1;
        const newPercent = Math.floor(100 / newCount);

        const updatedTargets = settings.geoTargets.map(t => ({ ...t, percent: newPercent }));
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
        handleChange('geoTargets', settings.geoTargets.filter(t => t.id !== id));
    };

    const handleGeoPercentChange = (id: string, newPercent: number) => {
        if (isFreeTrial) return;
        const updated = settings.geoTargets.map(t => t.id === id ? { ...t, percent: newPercent } : t);
        handleChange('geoTargets', updated);
    };

    // --- LANGUAGE HANDLERS ---
    const handleAddLanguage = (lang: string) => {
        if (isFreeTrial) return;
        if (!settings.languages.includes(lang)) {
            handleChange('languages', [...settings.languages, lang]);
        }
        setLanguageSearch('');
    }

    const handleRemoveLanguage = (lang: string) => {
        if (isFreeTrial) return;
        handleChange('languages', settings.languages.filter(l => l !== lang));
    }

    // --- URL COUNTING LOGIC ---
    const countUrls = (text: string) => text.split('\n').filter(line => line.trim().length > 0).length;

    const entryCount = countUrls(settings.entryUrls);
    const innerCount = countUrls(settings.innerUrls);
    const exitCount = countUrls(settings.exitUrls);
    const totalUrlCount = entryCount + innerCount + exitCount;

    const stats = project.stats || [];
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
                        <h2 className="text-2xl font-black text-gray-900">{project.name}</h2>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">

                    {/* Template Controls */}
                    <div className="flex items-center gap-1 mr-4 border-r border-gray-200 pr-4">
                        <button onClick={() => setShowSaveTemplate(true)} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-sm" title="Save as Template">
                            <Save size={16} />
                        </button>
                        <button onClick={() => setShowLoadTemplate(true)} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-sm" title="Load Template">
                            <Upload size={16} />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Target size={14} /> Total Target</div>
                    <div className="text-xl font-bold text-gray-900">{totalVolume > 0 ? totalVolume.toLocaleString() : project.plan}</div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><BarChart2 size={14} /> Daily Speed</div>
                    <div className="text-xl font-bold text-gray-900">{dailySpeed > 0 ? `${dailySpeed.toLocaleString()}/day` : 'N/A'}</div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Activity size={14} /> Status</div>
                    <div className={`text-sm font-black uppercase tracking-wide ${project.status === 'active' ? 'text-[#ff4d00]' : 'text-gray-500'}`}>
                        {project.status === 'completed' ? 'Expired' : project.status}
                    </div>
                </div>
                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><Calendar size={14} /> Expires</div>
                    <div className="text-sm font-bold text-gray-900">{project.expires}</div>
                </div>
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
                    </div>
                    <div className="text-xs text-gray-500 font-bold">Total {chartMode === 'visitors' ? 'Visits' : 'Views'}: <span className="text-gray-900">{stats.reduce((a, b) => a + (chartMode === 'visitors' ? b.visitors : (b.pageviews || b.visitors)), 0).toLocaleString()}</span></div>
                </div>

                <div className="h-64 flex items-end justify-between gap-1 w-full px-4 border-b border-gray-100 pb-2">
                    {stats.length === 0 ? <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No traffic data available.</div> :
                        stats.map((stat, i) => {
                            const val = chartMode === 'visitors' ? stat.visitors : (stat.pageviews || stat.visitors);
                            const heightPercent = currentMax > 0 ? (val / currentMax) * 100 : 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">{stat.date}: {val.toLocaleString()}</div>
                                    <div className="w-full bg-[#ff4d00] opacity-80 hover:opacity-100 transition-opacity rounded-t-sm min-w-[4px]" style={{ height: `${heightPercent}%`, minHeight: '4px' }}></div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isFreeTrial ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>

                {/* --- BASIC SETTINGS --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <SettingsIcon /> Basic Settings
                    </h3>

                    <div className="space-y-8">
                        <div>
                            <Label>Project Name</Label>
                            <input
                                value={project.name}
                                onChange={(e) => setProject({ ...project, name: e.target.value })}
                                className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-bold text-gray-900 transition-colors"
                                disabled={isFreeTrial}
                            />
                        </div>

                        <RangeControl label="Traffic Speed" value={settings.trafficSpeed} onChange={(v) => handleChange('trafficSpeed', v)} />
                        <RangeControl label="Bounce Rate" value={settings.bounceRate} onChange={(v) => handleChange('bounceRate', v)} suffix="%" />
                        <RangeControl label="Visitor Returning Rate" value={settings.returnRate} onChange={(v) => handleChange('returnRate', v)} suffix="%" />

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <Label>Platform & Operating System</Label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <CustomSelect
                                    value={settings.deviceSpecific || 'All'}
                                    onChange={(v) => handleChange('deviceSpecific', v)}
                                    options={DEVICE_OS_LIST}
                                    disabled={isFreeTrial}
                                />
                                <CustomSelect
                                    value={settings.browser || 'Random'}
                                    onChange={(v) => handleChange('browser', v)}
                                    options={BROWSERS}
                                    disabled={isFreeTrial}
                                />
                            </div>

                            <div className="flex justify-between items-end">
                                <Label>Device Distribution</Label>
                                <div className="flex gap-2">
                                    <button onClick={() => { handleChange('deviceSplit', 100); handleChange('tabletSplit', 0); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#ff4d00]">Desktop Only</button>
                                    <button onClick={() => { handleChange('deviceSplit', 33); handleChange('tabletSplit', 33); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#ff4d00]">Balanced</button>
                                    <button onClick={() => { handleChange('deviceSplit', 0); handleChange('tabletSplit', 0); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-[#ff4d00]">Mobile Only</button>
                                </div>
                            </div>

                            {/* Improved Sliders for Desktop / Tablet / Mobile */}
                            <div className={`space-y-4 pt-1 ${settings.deviceSpecific !== 'All' ? 'opacity-50 pointer-events-none' : ''}`}>

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
                                {settings.languages.map(lang => (
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
                                    placeholder={settings.languages.length === 0 ? "Select Language..." : ""}
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

                {/* --- SCHEDULE SETTINGS --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <Calendar size={16} /> Schedule & Duration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Operation Mode</Label>
                            <CustomSelect
                                value={settings.scheduleMode || 'continuous'}
                                onChange={(v) => handleChange('scheduleMode', v)}
                                options={SCHEDULE_MODES}
                                disabled={isFreeTrial}
                            />
                        </div>
                        {settings.scheduleMode === 'burst' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <Label>Start Time</Label>
                                    <input type="datetime-local" value={settings.scheduleTime || ''} onChange={(e) => handleChange('scheduleTime', e.target.value)} className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium" disabled={isFreeTrial} />
                                </div>
                                <RangeControl label="Run Duration (Minutes)" value={settings.scheduleDuration || 60} onChange={(v) => handleChange('scheduleDuration', v)} max={1440} />
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PROXY SETTINGS --- */}
                <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                        <Lock size={16} /> Proxy Configuration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Proxy Mode</Label>
                            <CustomSelect
                                value={settings.proxyMode || 'auto'}
                                onChange={(v) => handleChange('proxyMode', v)}
                                options={PROXY_MODES}
                                disabled={isFreeTrial}
                            />
                        </div>
                        {settings.proxyMode === 'custom' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label>Custom Proxies (ip:port:user:pass)</Label>
                                <textarea
                                    value={settings.customProxies || ''}
                                    onChange={(e) => handleChange('customProxies', e.target.value)}
                                    className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium h-32 resize-none font-mono"
                                    placeholder="192.168.1.1:8080:user:pass&#10;192.168.1.2:8080:user:pass"
                                    disabled={isFreeTrial}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* --- ADVANCED LOCATION --- */}
                    <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                            <MapPin size={16} /> Advanced Location
                        </h3>

                        <div className="mb-6 relative">
                            <Label>Add Country (Search)</Label>
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
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto z-50">
                                    {filteredCountries.map(c => (
                                        <div
                                            key={c.code}
                                            className="p-3 text-sm hover:bg-orange-50 cursor-pointer font-medium"
                                            onClick={() => {
                                                handleAddCountry(c.code);
                                                setShowCountryDropdown(false);
                                            }}
                                        >
                                            {c.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {settings.geoTargets.map(target => (
                                <div key={target.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 bg-[#f9fafb] p-3 border border-gray-100">
                                    <div className="flex-1 font-bold text-sm text-gray-800 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px]">{target.country}</span>
                                        {getCountryName(target.country)}
                                    </div>

                                    {/* City & State Inputs */}
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <input
                                            placeholder="State (Opt)"
                                            value={target.state || ''}
                                            onChange={(e) => {
                                                const updated = settings.geoTargets.map(t => t.id === target.id ? { ...t, state: e.target.value } : t);
                                                handleChange('geoTargets', updated);
                                            }}
                                            className="w-24 bg-white border border-gray-200 p-1 text-xs outline-none focus:border-[#ff4d00]"
                                        />
                                        <input
                                            placeholder="City (Opt)"
                                            value={target.city || ''}
                                            onChange={(e) => {
                                                const updated = settings.geoTargets.map(t => t.id === target.id ? { ...t, city: e.target.value } : t);
                                                handleChange('geoTargets', updated);
                                            }}
                                            className="w-24 bg-white border border-gray-200 p-1 text-xs outline-none focus:border-[#ff4d00]"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-32 justify-end">
                                        <input
                                            type="number"
                                            value={target.percent}
                                            onChange={(e) => handleGeoPercentChange(target.id, parseInt(e.target.value) || 0)}
                                            className="w-16 p-1 text-center font-bold border border-gray-300 outline-none focus:border-[#ff4d00] text-sm"
                                            min="0" max="100"
                                        />
                                        <span className="text-xs text-gray-500 font-bold">%</span>
                                    </div>
                                    <button onClick={() => handleRemoveCountry(target.id)} className="text-gray-400 hover:text-red-500 ml-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {settings.geoTargets.length === 0 && (
                                <div className="text-center p-4 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200">
                                    No countries selected. Traffic will be global.
                                </div>
                            )}
                            <div className="text-right text-[10px] font-black uppercase tracking-wide">
                                Total: <span className={`${settings.geoTargets.reduce((a, b) => a + b.percent, 0) === 100 ? 'text-green-600' : 'text-red-500'}`}>
                                    {settings.geoTargets.reduce((a, b) => a + b.percent, 0)}%
                                </span>
                            </div>
                        </div>
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

                            {settings.trafficSource.includes('Organic') && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label>Keywords (One per line)</Label>
                                    <textarea
                                        value={settings.keywords}
                                        onChange={(e) => handleChange('keywords', e.target.value)}
                                        className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium h-32 resize-none"
                                        placeholder="keyword 1&#10;keyword 2"
                                        disabled={isFreeTrial}
                                    />
                                </div>
                            )}

                            {(settings.trafficSource.includes('Social') || settings.trafficSource.includes('Referral')) && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label>Referrer URLs (One per line)</Label>
                                    <textarea
                                        value={settings.referralUrls}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Toggle
                            label="Cache Website"
                            checked={settings.cacheWebsite}
                            onChange={(v) => handleChange('cacheWebsite', v)}
                        />
                        <Toggle
                            label="Minimize CPU Load"
                            checked={settings.minimizeCpu}
                            onChange={(v) => handleChange('minimizeCpu', v)}
                        />
                        <Toggle
                            label="Randomize Session"
                            checked={settings.randomizeSession}
                            onChange={(v) => handleChange('randomizeSession', v)}
                        />
                        <Toggle
                            label="Anti-Fingerprint"
                            checked={settings.antiFingerprint}
                            onChange={(v) => handleChange('antiFingerprint', v)}
                        />
                    </div>

                    <div className="h-px bg-gray-100 my-8"></div>

                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Star size={14} className="text-yellow-500" /> Premium Expert Features
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Professional + Expert Features */}
                        <div className={`relative ${project.plan === 'Economy' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="Residential IP Network"
                                checked={settings.residentialIps || false}
                                onChange={(v) => project.plan !== 'Economy' && handleChange('residentialIps', v)}
                            />
                            {project.plan === 'Economy' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Professional Tier Required"></div>}
                        </div>

                        <div className={`relative ${project.plan === 'Economy' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="Cities Geo-Targeting"
                                checked={settings.citiesGeoTargeting || false}
                                onChange={(v) => project.plan !== 'Economy' && handleChange('citiesGeoTargeting', v)}
                            />
                            {project.plan === 'Economy' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Professional Tier Required"></div>}
                        </div>

                        {/* Expert ONLY Features */}
                        <div className={`relative ${project.plan !== 'Expert' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="Night & Day Volume"
                                checked={settings.nightDayVolume || false}
                                onChange={(v) => project.plan === 'Expert' && handleChange('nightDayVolume', v)}
                            />
                            {project.plan !== 'Expert' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Expert Tier Required"></div>}
                        </div>

                        <div className={`relative ${project.plan !== 'Expert' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="Automatic Website Crawler"
                                checked={settings.websiteCrawler || false}
                                onChange={(v) => project.plan === 'Expert' && handleChange('websiteCrawler', v)}
                            />
                            {project.plan !== 'Expert' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Expert Tier Required"></div>}
                        </div>

                        <div className={`relative ${project.plan !== 'Expert' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="GA4 Natural Events"
                                checked={settings.ga4NaturalEvents || false}
                                onChange={(v) => project.plan === 'Expert' && handleChange('ga4NaturalEvents', v)}
                            />
                            {project.plan !== 'Expert' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Expert Tier Required"></div>}
                        </div>

                        <div className={`relative ${project.plan !== 'Expert' ? 'opacity-50' : ''}`}>
                            <Toggle
                                label="Randomize Daily Volume"
                                checked={settings.randomizeDailyVolume || false}
                                onChange={(v) => project.plan === 'Expert' && handleChange('randomizeDailyVolume', v)}
                            />
                            {project.plan !== 'Expert' && <div className="absolute inset-0 flex items-center justify-center bg-white/10 cursor-not-allowed pointer-events-auto" title="Expert Tier Required"></div>}
                        </div>

                        <div className={project.plan === 'Economy' ? 'opacity-50 pointer-events-none' : ''}>
                            <Label>Sitemap / RSS Feed</Label>
                            <input
                                value={settings.sitemap || ''}
                                onChange={(e) => handleChange('sitemap', e.target.value)}
                                className="w-full bg-[#f9fafb] border-b-2 border-transparent focus:border-[#ff4d00] p-3 outline-none text-sm font-medium"
                                placeholder="https://example.com/sitemap.xml"
                            />
                        </div>

                        <div className={project.plan === 'Economy' ? 'opacity-50 pointer-events-none' : ''}>
                            <Label>URL Shortener</Label>
                            <CustomSelect
                                value={settings.shortener || 'None'}
                                onChange={(v) => handleChange('shortener', v)}
                                options={[
                                    { value: 'None', label: 'None (Direct)' },
                                    { value: 'bit.ly', label: 'Bit.ly' },
                                    { value: 'cutt.ly', label: 'Cutt.ly' },
                                    { value: 't.co', label: 'X/Twitter (t.co)' }
                                ]}
                            />
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
