
import React, { useState } from 'react';
import { Project, ProjectSettings, User } from '../../types';
import { db } from '../../services/db';
import { Globe, Save, ArrowLeft, Settings, Activity, MapPin, MousePointer, Search, CheckCircle, AlertCircle, Smartphone, Monitor, Link, Sliders, Shield, Zap, Globe2, MousePointer2, FileText, User as UserIcon, X } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { COUNTRIES_LIST, TRAFFIC_SOURCES, TIME_ON_PAGE_OPTS, TIMEZONES } from '../../constants';

interface AdminCreateProjectProps {
    onBack: () => void;
    onSuccess: () => void;
}

const DEFAULT_SETTINGS: ProjectSettings = {
    trafficSpeed: 100,
    bounceRate: 0,
    returnRate: 0,
    deviceSplit: 70,
    tabletSplit: 0,
    deviceSpecific: 'All',
    browser: 'Random',
    timeOnPage: '3 minutes',
    timezone: 'UTC',
    language: 'en-US',
    languages: ['en-US'],
    gaId: '',
    entryUrls: '',
    innerUrls: '',
    exitUrls: '',
    autoCrawlEntry: false,
    autoCrawlInner: false,
    autoCrawlExit: false,
    innerUrlCount: 0,
    countries: ['United States'],
    geoTargets: [{ id: 'default-geo', country: 'United States', percent: 100 }],
    trafficSource: 'organic',
    keywords: '',
    referralUrls: '',
    utmSource: '', utmMedium: '', utmCampaign: '', utmTerm: '', utmContent: '',
    proxyMode: 'auto', customProxies: '',
    scheduleMode: 'continuous', scheduleTime: '', scheduleDuration: 60,
    urlVisitOrder: 'random',
    sitemap: '',
    shortener: '',
    autoRenew: false,
    cacheWebsite: false,
    minimizeCpu: false,
    randomizeSession: true,
    antiFingerprint: true,
    pageViewsWithScroll: 0,
    clickExternal: 0,
    clickInternal: 0
};

const AdminCreateProject: React.FC<AdminCreateProjectProps> = ({ onBack, onSuccess }) => {
    const [name, setName] = useState('');
    const [entryUrls, setEntryUrls] = useState('');
    const [totalVisitors, setTotalVisitors] = useState<number>(1000);
    const [durationDays, setDurationDays] = useState<number>(7);
    const [settings, setSettings] = useState<ProjectSettings>({ ...DEFAULT_SETTINGS });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDetectingGA, setIsDetectingGA] = useState(false);
    const [gaDetectionStatus, setGaDetectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // User Selection State
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [countrySearch, setCountrySearch] = useState('');

    React.useEffect(() => {
        const loadUsers = async () => {
            const allUsers = await db.syncUsers(); // Ensure fresh list
            setUsers(allUsers);
            // Default to self if no selection, or just leave empty to force choice?
            // Let's default to current admin
            const me = db.getCurrentUser();
            if (me) setSelectedUserId(me.id);
        };
        loadUsers();
    }, []);

    const dailyLimit = Math.round(totalVisitors / durationDays);

    const updateSetting = (key: keyof ProjectSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const detectGAId = async () => {
        if (!entryUrls) {
            setError('Please enter a target URL first');
            return;
        }

        setIsDetectingGA(true);
        setGaDetectionStatus('idle');

        try {
            const tid = await db.scanGA4(entryUrls);
            if (tid) {
                updateSetting('gaId', tid);
                setGaDetectionStatus('success');
            } else {
                setGaDetectionStatus('error');
            }
        } catch (e: any) {
            setGaDetectionStatus('error');
        } finally {
            setIsDetectingGA(false);
        }
    };

    const handleCreate = async () => {
        if (!name || !entryUrls) {
            setError('Please enter a project name and target URL');
            return;
        }

        if (totalVisitors < 100 || durationDays < 1) {
            setError('Minimum 100 visitors and 1 day required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const settingsWithUrl = {
                ...settings,
                entryUrls: entryUrls
            };

            const newProject: Project = {
                id: 'proj_' + Date.now(),
                userId: selectedUserId || db.getCurrentUser()?.id || 'admin',
                name,
                plan: 'Custom',
                customTarget: {
                    totalVisitors,
                    durationDays,
                    dailyLimit: dailyLimit
                },
                expires: 'Never',
                status: 'active',
                settings: settingsWithUrl,
                stats: []
            };

            await db.addProject(newProject);
            onSuccess();
            onBack();
        } catch (e: any) {
            setError(e.message || 'Failed to create project');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-12">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#f3f4f6] z-10 py-4 border-b border-gray-200">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black text-xs font-bold uppercase tracking-wide">
                    <ArrowLeft size={14} /> Back to Projects
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Campaign</div>
                        <div className="text-sm font-black text-gray-900">Create Project</div>
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={isSaving}
                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={14} /> {isSaving ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 text-red-700 text-sm font-bold">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Settings size={14} /> Core Configuration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Project Name</Label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="My Traffic Campaign"
                            />
                        </div>

                        <div>
                            <Label>Project Owner (User)</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00] appearance-none"
                                >
                                    <option value="">Select a User...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.email}) - {u.role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Target URL (Entry)</Label>
                            <input
                                value={entryUrls}
                                onChange={(e) => setEntryUrls(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div>
                            <Label>Total Visitors</Label>
                            <input
                                type="number"
                                min="100"
                                value={totalVisitors}
                                onChange={(e) => setTotalVisitors(parseInt(e.target.value) || 0)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="1000"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Duration (Days)</Label>
                                <input
                                    type="number"
                                    min="1"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Daily Visitors</Label>
                                <div className="w-full bg-[#f3f4f6] border border-gray-200 p-3 text-sm font-bold text-[#ff4d00]">
                                    {dailyLimit.toLocaleString()} /day
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>Google Analytics ID</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        value={settings.gaId}
                                        onChange={(e) => updateSetting('gaId', e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00]"
                                        placeholder="G-XXXXXXXXXX"
                                    />
                                    {gaDetectionStatus === 'success' && (
                                        <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                                    )}
                                    {gaDetectionStatus === 'error' && (
                                        <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                                    )}
                                </div>
                                <button
                                    onClick={detectGAId}
                                    disabled={isDetectingGA || !entryUrls}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors disabled:opacity-50"
                                    title="Auto-detect GA ID from website"
                                >
                                    {isDetectingGA ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Search size={14} />
                                    )}
                                    Detect
                                </button>
                            </div>
                            {gaDetectionStatus === 'error' && (
                                <p className="text-[10px] text-red-500 mt-1">No Google Analytics ID found on this website</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Activity size={14} /> Visitor Behavior
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Bounce Rate (%)</Label>
                                <input
                                    type="number"
                                    value={settings.bounceRate}
                                    onChange={(e) => updateSetting('bounceRate', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Return Rate (%)</Label>
                                <input
                                    type="number"
                                    value={settings.returnRate}
                                    onChange={(e) => updateSetting('returnRate', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Time On Page</Label>
                            <CustomSelect
                                value={settings.timeOnPage}
                                onChange={(val) => updateSetting('timeOnPage', val)}
                                options={[
                                    { value: "30 seconds", label: "30 seconds" },
                                    { value: "1 minute", label: "1 minute" },
                                    { value: "3 minutes", label: "3 minutes" },
                                    { value: "5 minutes", label: "5 minutes" }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <MapPin size={14} /> Geolocation
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Countries</Label>
                            {/* Selected Countries */}
                            {settings.countries.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {settings.countries.map(c => {
                                        const countryInfo = COUNTRIES_LIST.find(ct => ct.name === c || ct.code === c);
                                        return (
                                            <span key={c} className="bg-[#ff4d00]/10 text-[#ff4d00] px-2 py-1 text-xs font-bold flex items-center gap-1">
                                                {countryInfo && (
                                                    <img src={`https://flagcdn.com/w16/${countryInfo.code.toLowerCase()}.png`} alt={c} className="w-4 h-auto" />
                                                )}
                                                {countryInfo?.name || c}
                                                <button onClick={() => updateSetting('countries', settings.countries.filter(x => x !== c))} className="ml-1 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Search Input */}
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search countries..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 text-xs outline-none focus:border-[#ff4d00]"
                                />
                                {countrySearch && (
                                    <button
                                        onClick={() => setCountrySearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            {/* Country Dropdown */}
                            <div className="border border-gray-200 max-h-[150px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-px p-1">
                                    {COUNTRIES_LIST
                                        .filter(c => 
                                            !settings.countries.includes(c.name) && 
                                            (countrySearch === '' || 
                                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                                c.code.toLowerCase().includes(countrySearch.toLowerCase()))
                                        )
                                        .slice(0, 50)
                                        .map(c => (
                                            <button
                                                key={c.code}
                                                onClick={() => updateSetting('countries', [...settings.countries, c.name])}
                                                className="p-2 text-left text-xs font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                            >
                                                <img src={`https://flagcdn.com/w16/${c.code.toLowerCase()}.png`} alt={c.name} className="w-4 h-auto" />
                                                <span className="truncate">{c.name}</span>
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{settings.countries.length} countries selected</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Browser Language</Label>
                                <input
                                    value={settings.languages.join(', ')}
                                    onChange={(e) => updateSetting('languages', e.target.value.split(', '))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Timezone</Label>
                                <CustomSelect
                                    value={settings.timezone}
                                    onChange={(val) => updateSetting('timezone', val)}
                                    options={TIMEZONES.slice(0, 10)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <MousePointer size={14} /> Traffic Source
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Traffic Source Type</Label>
                            <CustomSelect
                                value={settings.trafficSource}
                                onChange={(val) => updateSetting('trafficSource', val)}
                                options={TRAFFIC_SOURCES.slice(0, 15)}
                            />
                        </div>

                        {settings.trafficSource === 'organic' && (
                            <div>
                                <Label>Keywords (One per line)</Label>
                                <textarea
                                    value={settings.keywords}
                                    onChange={(e) => updateSetting('keywords', e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                    placeholder="keyword1&#10;keyword2"
                                />
                            </div>
                        )}

                        {settings.trafficSource === 'social' && (
                            <div>
                                <Label>Referral URLs (One per line)</Label>
                                <textarea
                                    value={settings.referralUrls}
                                    onChange={(e) => updateSetting('referralUrls', e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                    placeholder="https://facebook.com&#10;https://twitter.com"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Settings size={14} /> UTM & Attribution
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Campaign Source</Label>
                            <input value={settings.utmSource || ''} onChange={(e) => updateSetting('utmSource', e.target.value)} className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]" placeholder="e.g. google" />
                        </div>
                        <div>
                            <Label>Campaign Medium</Label>
                            <input value={settings.utmMedium || ''} onChange={(e) => updateSetting('utmMedium', e.target.value)} className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]" placeholder="e.g. cpc" />
                        </div>
                        <div>
                            <Label>Campaign Name</Label>
                            <input value={settings.utmCampaign || ''} onChange={(e) => updateSetting('utmCampaign', e.target.value)} className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]" placeholder="e.g. split_test" />
                        </div>
                        <div>
                            <Label>Campaign Term</Label>
                            <input value={settings.utmTerm || ''} onChange={(e) => updateSetting('utmTerm', e.target.value)} className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]" placeholder="e.g. keyword" />
                        </div>
                        <div>
                            <Label>Campaign Content</Label>
                            <input value={settings.utmContent || ''} onChange={(e) => updateSetting('utmContent', e.target.value)} className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]" placeholder="e.g. sidebar_ad" />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Supports: {"{{random_keyword}}, {{timestamp}}, {{device_type}}"}
                    </p>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <MapPin size={14} /> Proxy & Schedule
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Proxy Mode</Label>
                                <CustomSelect
                                    value={settings.proxyMode || 'auto'}
                                    onChange={(val) => updateSetting('proxyMode', val)}
                                    options={[
                                        { value: "auto", label: "Auto-Rotate" },
                                        { value: "sticky", label: "Sticky Session" },
                                        { value: "custom", label: "Custom List" }
                                    ]}
                                />
                            </div>
                            <div>
                                <Label>Visit Order</Label>
                                <CustomSelect
                                    value={settings.urlVisitOrder || 'random'}
                                    onChange={(val) => updateSetting('urlVisitOrder', val)}
                                    options={[
                                        { value: "random", label: "Random" },
                                        { value: "sequential", label: "Sequential Funnel" }
                                    ]}
                                />
                            </div>
                        </div>
                        {settings.proxyMode === 'custom' && (
                            <div>
                                <Label>Custom Proxies</Label>
                                <textarea
                                    value={settings.customProxies}
                                    onChange={(e) => updateSetting('customProxies', e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono outline-none focus:border-[#ff4d00] h-20"
                                    placeholder="ip:port:user:pass"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Smartphone size={14} /> Device Targeting
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Device Specific</Label>
                                <CustomSelect
                                    value={settings.deviceSpecific}
                                    onChange={(val) => {
                                        if (val.includes('Mobile')) updateSetting('deviceSplit', 0);
                                        if (val.includes('Desktop')) updateSetting('deviceSplit', 100);
                                        updateSetting('deviceSpecific', val);
                                    }}
                                    options={[
                                        { value: "All", label: "All Devices" },
                                        { value: "Desktop, Windows", label: "Windows Desktop" },
                                        { value: "Desktop, Mac", label: "Mac Desktop" },
                                        { value: "Mobile, iPhone", label: "iPhone" },
                                        { value: "Mobile, Android", label: "Android" }
                                    ]}
                                />
                            </div>
                            <div>
                                <Label>Browser</Label>
                                <CustomSelect
                                    value={settings.browser || 'Random'}
                                    onChange={(val) => updateSetting('browser', val)}
                                    options={[
                                        { value: "Random", label: "Random" },
                                        { value: "Chrome", label: "Chrome" },
                                        { value: "Firefox", label: "Firefox" },
                                        { value: "Safari", label: "Safari" },
                                        { value: "Edge", label: "Edge" }
                                    ]}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Device Split (Desktop/Tablet/Mobile)</Label>

                            {/* Desktop */}
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-[10px] font-bold w-12 text-gray-500">Desktop</span>
                                <input
                                    type="range" min="0" max="100"
                                    value={settings.deviceSplit}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const max = 100 - (settings.tabletSplit || 0);
                                        updateSetting('deviceSplit', Math.min(val, max));
                                    }}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                                />
                                <span className="text-sm font-bold w-8">{settings.deviceSplit}%</span>
                            </div>

                            {/* Tablet */}
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-[10px] font-bold w-12 text-gray-500">Tablet</span>
                                <input
                                    type="range" min="0" max="100"
                                    value={settings.tabletSplit || 0}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const max = 100 - settings.deviceSplit;
                                        updateSetting('tabletSplit', Math.min(val, max));
                                    }}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
                                />
                                <span className="text-sm font-bold w-8">{settings.tabletSplit || 0}%</span>
                            </div>

                            <p className="text-[10px] text-gray-400 mt-2 text-right">Mobile Remainder: {100 - settings.deviceSplit - (settings.tabletSplit || 0)}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Link size={14} /> Crawling Options
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Entry URLs (One per line)</Label>
                            <textarea
                                value={settings.entryUrls}
                                onChange={(e) => updateSetting('entryUrls', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                placeholder="https://example.com&#10;https://example.com/about"
                            />
                        </div>

                        <div>
                            <Label>Inner URLs (One per line)</Label>
                            <textarea
                                value={settings.innerUrls}
                                onChange={(e) => updateSetting('innerUrls', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                placeholder="https://example.com/page1&#10;https://example.com/page2"
                            />
                        </div>

                        <div>
                            <Label>Exit URLs (One per line)</Label>
                            <textarea
                                value={settings.exitUrls}
                                onChange={(e) => updateSetting('exitUrls', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                placeholder="https://example.com/thank-you"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.autoCrawlEntry}
                                    onChange={(e) => updateSetting('autoCrawlEntry', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Auto-crawl Entry</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.autoCrawlInner}
                                    onChange={(e) => updateSetting('autoCrawlInner', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Auto-crawl Inner</Label>
                            </div>
                        </div>

                        <div>
                            <Label>Inner URL Count</Label>
                            <input
                                type="number"
                                min="0"
                                value={settings.innerUrlCount}
                                onChange={(e) => updateSetting('innerUrlCount', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Sliders size={14} /> Advanced Options
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Sitemap URL</Label>
                            <input
                                value={settings.sitemap}
                                onChange={(e) => updateSetting('sitemap', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="https://example.com/sitemap.xml"
                            />
                        </div>

                        <div>
                            <Label>URL Shortener</Label>
                            <input
                                value={settings.shortener}
                                onChange={(e) => updateSetting('shortener', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="https://short.url/..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.autoRenew}
                                    onChange={(e) => updateSetting('autoRenew', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Auto-renew</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.cacheWebsite}
                                    onChange={(e) => updateSetting('cacheWebsite', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Cache Website</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.minimizeCpu}
                                    onChange={(e) => updateSetting('minimizeCpu', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Minimize CPU</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Shield size={14} /> Session Behavior
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.randomizeSession}
                                    onChange={(e) => updateSetting('randomizeSession', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Randomize Session</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.antiFingerprint}
                                    onChange={(e) => updateSetting('antiFingerprint', e.target.checked)}
                                    className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded focus:ring-[#ff4d00]"
                                />
                                <Label className="!mb-0">Anti-fingerprinting</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <MousePointer2 size={14} /> Interaction Settings
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Page Views with Scroll (%)</Label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.pageViewsWithScroll}
                                onChange={(e) => updateSetting('pageViewsWithScroll', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Click External Links</Label>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.clickExternal}
                                    onChange={(e) => updateSetting('clickExternal', parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Click Internal Links</Label>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.clickInternal}
                                    onChange={(e) => updateSetting('clickInternal', parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Label: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2 ${className}`}>{children}</label>
);

export default AdminCreateProject;
