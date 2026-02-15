



import React, { useState, useEffect } from 'react';
import { Project, ProjectSettings } from '../../types';
import { db } from '../../services/db';
import { ArrowLeft, Save, Globe, Smartphone, Monitor, Activity, MousePointer, Settings, MapPin, Zap } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface AdminEditProjectProps {
    projectId: string;
    onBack: () => void;
    onUpdate: () => void;
}

const AdminEditProject: React.FC<AdminEditProjectProps> = ({ projectId, onBack, onUpdate }) => {
    const [project, setProject] = useState<Project | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const p = db.getProjectById(projectId);
        if (p) {
            // Create a copy to avoid mutating cached object
            const projectCopy = JSON.parse(JSON.stringify(p));

            // Ensure settings object exists with defaults if missing
            if (!projectCopy.settings) {
                projectCopy.settings = {
                    trafficSpeed: 100, bounceRate: 0, returnRate: 0, deviceSplit: 70,
                    deviceSpecific: "All",
                    timeOnPage: '3 minutes', timezone: 'UTC', language: 'en-US', languages: ['en-US'], gaId: '',
                    entryUrls: '', innerUrls: '', exitUrls: '',
                    autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
                    innerUrlCount: 0, countries: ['United States'],
                    geoTargets: [{ id: 'default-geo', country: 'United States', percent: 100 }],
                    trafficSource: 'organic',
                    keywords: '', referralUrls: '',
                    utmSource: '', utmMedium: '', utmCampaign: '', utmTerm: '', utmContent: '',
                    sitemap: '', shortener: '',
                    autoRenew: false, cacheWebsite: false, minimizeCpu: false,
                    randomizeSession: true, antiFingerprint: true,
                    pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0,
                    // Hidden Params (Admin Only)
                    adminPriority: 0,
                    adminWeight: 1,
                    forceStopReason: ''
                };
            }
            // Ensure languages array
            if (!projectCopy.settings.languages) {
                projectCopy.settings.languages = [projectCopy.settings.language || 'en-US'];
            }
            // Ensure countries array
            if (!projectCopy.settings.countries) {
                projectCopy.settings.countries = ['United States'];
            }
            setProject(projectCopy);
        }
        setIsLoading(false);
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading project...</div>
            </div>
        );
    }

    if (!project || !project.settings) return <div>Project not found.</div>;

    const handleSave = () => {
        if (!project) return;
        setIsSaving(true);
        // Simulate a small delay for better UX even if local save is fast, or to wait for firestore
        setTimeout(() => {
            db.updateProject(project);
            setIsSaving(false);
            onUpdate();
            alert('Project configuration saved successfully.');
        }, 500);
    };

    const updateSetting = (key: keyof ProjectSettings, value: any) => {
        if (!project || !project.settings) return;
        setProject({
            ...project,
            settings: {
                ...project.settings,
                [key]: value
            }
        });
    };

    if (!project || !project.settings) return <div>Project not found.</div>;

    const s = project.settings;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-12">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#f3f4f6] z-10 py-4 border-b border-gray-200">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black text-xs font-bold uppercase tracking-wide">
                    <ArrowLeft size={14} /> Back to Projects
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Editing Campaign</div>
                        <div className="text-sm font-black text-gray-900">{project.name}</div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={14} /> {isSaving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- CORE SETTINGS --- */}
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Settings size={14} /> Core Configuration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <Label>Project Name</Label>
                            <input
                                value={project.name}
                                onChange={(e) => setProject({ ...project, name: e.target.value })}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                        <div>
                            <Label>Target URL (Entry)</Label>
                            <input
                                value={s.entryUrls}
                                onChange={(e) => updateSetting('entryUrls', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Plan Tier</Label>
                                <CustomSelect
                                    value={project.plan}
                                    onChange={(val) => setProject({ ...project, plan: val })}
                                    options={[
                                        { value: "Free Trial", label: "Free Trial" },
                                        { value: "Starter", label: "Starter" },
                                        { value: "Growth", label: "Growth" },
                                        { value: "Agency", label: "Agency" }
                                    ]}
                                />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <CustomSelect
                                    value={project.status}
                                    onChange={(val) => setProject({ ...project, status: val })}
                                    options={[
                                        { value: "active", label: "Active" },
                                        { value: "stopped", label: "Stopped" },
                                        { value: "completed", label: "Completed" },
                                        { value: "archived", label: "Archived (Admin)" }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Force Stop / Status Reason */}
                        {project.status === 'stopped' && (
                            <div className="bg-red-50 border border-red-100 p-4">
                                <Label>Force Stop Reason (Visible to User)</Label>
                                <input
                                    value={s.forceStopReason || ''}
                                    onChange={(e) => updateSetting('forceStopReason', e.target.value)}
                                    className="w-full bg-white border border-red-200 p-3 text-sm font-medium text-red-900 outline-none focus:border-red-500 placeholder-red-300"
                                    placeholder="e.g. Violation of TOS, Payment Failed..."
                                />
                            </div>
                        )}

                        {/* Admin Hidden Parameters */}
                        <div className="bg-gray-50 border border-gray-200 p-4 border-l-4 border-l-gray-400">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={12} className="text-gray-500" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Admin Controls</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Queue Priority (-10 to 10)</Label>
                                    <input
                                        type="number"
                                        min="-10"
                                        max="10"
                                        value={s.adminPriority || 0}
                                        onChange={(e) => updateSetting('adminPriority', parseInt(e.target.value))}
                                        className="w-full bg-white border border-gray-200 p-2 text-sm font-bold text-gray-900 outline-none focus:border-gray-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">Higher = processed first.</p>
                                </div>
                                <div>
                                    <Label>Traffic Weight (0.1 - 5.0)</Label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        max="5.0"
                                        value={s.adminWeight || 1}
                                        onChange={(e) => updateSetting('adminWeight', parseFloat(e.target.value))}
                                        className="w-full bg-white border border-gray-200 p-2 text-sm font-bold text-gray-900 outline-none focus:border-gray-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">Multiplier for resource allocation.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>Expiration Date</Label>
                            <input
                                value={project.expires}
                                onChange={(e) => setProject({ ...project, expires: e.target.value })}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                        <div>
                            <Label>Google Analytics ID</Label>
                            <input
                                value={s.gaId}
                                onChange={(e) => updateSetting('gaId', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="G-XXXXXXXXXX"
                            />
                        </div>
                    </div>
                </div>

                {/* --- BEHAVIOR METRICS --- */}
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
                                    value={s.bounceRate}
                                    onChange={(e) => updateSetting('bounceRate', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Return Rate (%)</Label>
                                <input
                                    type="number"
                                    value={s.returnRate}
                                    onChange={(e) => updateSetting('returnRate', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Time On Page</Label>
                            <CustomSelect
                                value={s.timeOnPage}
                                onChange={(val) => updateSetting('timeOnPage', val)}
                                options={[
                                    { value: "30 seconds", label: "30 seconds" },
                                    { value: "1 minute", label: "1 minute" },
                                    { value: "3 minutes", label: "3 minutes" },
                                    { value: "5 minutes", label: "5 minutes" }
                                ]}
                            />
                        </div>

                        <div>
                            <Label>Traffic Speed (Priority)</Label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range" min="0" max="100"
                                    value={s.trafficSpeed}
                                    onChange={(e) => updateSetting('trafficSpeed', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                                />
                                <span className="text-sm font-bold w-12">{s.trafficSpeed}%</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <Label>Device Split</Label>
                                <div className="text-[10px] font-bold text-gray-400 uppercase flex gap-3">
                                    <span className="flex items-center gap-1"><Monitor size={10} /> Desktop: {s.deviceSplit}%</span>
                                    <span className="flex items-center gap-1"><Smartphone size={10} /> Mobile: {100 - s.deviceSplit}%</span>
                                </div>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                value={s.deviceSplit}
                                onChange={(e) => updateSetting('deviceSplit', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                            />
                        </div>
                    </div>
                </div>

                {/* --- GEOLOCATION --- */}
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <MapPin size={14} /> Geolocation & Tech
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <Label>Countries</Label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {s.countries.map(c => (
                                    <span key={c} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs font-bold uppercase rounded-sm flex items-center gap-2">
                                        {c} <button onClick={() => updateSetting('countries', s.countries.filter(x => x !== c))} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                            <CustomSelect
                                value=""
                                onChange={(val) => {
                                    if (val && !s.countries.includes(val)) {
                                        updateSetting('countries', [...s.countries, val]);
                                    }
                                }}
                                placeholder="Add Country..."
                                options={[
                                    { value: "United States", label: "United States" },
                                    { value: "United Kingdom", label: "United Kingdom" },
                                    { value: "Germany", label: "Germany" },
                                    { value: "France", label: "France" },
                                    { value: "Canada", label: "Canada" },
                                    { value: "India", label: "India" },
                                    { value: "Brazil", label: "Brazil" }
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Browser Language</Label>
                                <input
                                    value={s.languages.join(', ')}
                                    onChange={(e) => updateSetting('languages', e.target.value.split(', '))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Timezone</Label>
                                <CustomSelect
                                    value={s.timezone}
                                    onChange={(val) => updateSetting('timezone', val)}
                                    options={[
                                        { value: "UTC", label: "UTC" },
                                        { value: "EST", label: "EST" },
                                        { value: "PST", label: "PST" },
                                        { value: "CET", label: "CET" }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ADVANCED INTERACTIONS --- */}
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <MousePointer size={14} /> Advanced Interactions
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <Label>Traffic Source Type</Label>
                            <CustomSelect
                                value={s.trafficSource}
                                onChange={(val) => updateSetting('trafficSource', val)}
                                options={[
                                    { value: "organic", label: "Organic (Search)" },
                                    { value: "direct", label: "Direct" },
                                    { value: "social", label: "Social" }
                                ]}
                            />
                        </div>

                        {s.trafficSource === 'organic' && (
                            <div>
                                <Label>Keywords (One per line)</Label>
                                <textarea
                                    value={s.keywords}
                                    onChange={(e) => updateSetting('keywords', e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Inner URLs Count</Label>
                                <input
                                    type="number"
                                    value={s.innerUrlCount}
                                    onChange={(e) => updateSetting('innerUrlCount', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Scroll Events (%)</Label>
                                <input
                                    type="number"
                                    value={s.pageViewsWithScroll}
                                    onChange={(e) => updateSetting('pageViewsWithScroll', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <Label>Internal Clicks</Label>
                                <input
                                    type="number"
                                    value={s.clickInternal}
                                    onChange={(e) => updateSetting('clickInternal', parseInt(e.target.value))}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Inner URLs (CSV)</Label>
                            <input
                                value={s.innerUrls}
                                onChange={(e) => updateSetting('innerUrls', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-600 outline-none focus:border-[#ff4d00]"
                                placeholder="http://..., http://..."
                            />
                        </div>
                    </div>
                </div>

                {/* --- UTM & ATTRIBUTION --- */}
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Settings size={14} /> UTM & Attribution
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Campaign Source</Label>
                            <input
                                value={s.utmSource || ''}
                                onChange={(e) => updateSetting('utmSource', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                placeholder="e.g. google"
                            />
                        </div>
                        <div>
                            <Label>Campaign Medium</Label>
                            <input
                                value={s.utmMedium || ''}
                                onChange={(e) => updateSetting('utmMedium', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                placeholder="e.g. cpc"
                            />
                        </div>
                        <div>
                            <Label>Campaign Name</Label>
                            <input
                                value={s.utmCampaign || ''}
                                onChange={(e) => updateSetting('utmCampaign', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                placeholder="e.g. winter_sale"
                            />
                        </div>
                        <div>
                            <Label>Campaign Term</Label>
                            <input
                                value={s.utmTerm || ''}
                                onChange={(e) => updateSetting('utmTerm', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                placeholder="e.g. running_shoes"
                            />
                        </div>
                        <div>
                            <Label>Campaign Content</Label>
                            <input
                                value={s.utmContent || ''}
                                onChange={(e) => updateSetting('utmContent', e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                placeholder="e.g. banner_wide"
                            />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Supports: {"{{random_keyword}}, {{timestamp}}, {{device_type}}"}
                    </p>
                </div>

                {/* --- TOGGLES --- */}
                <div className="bg-white border border-gray-200 p-8 shadow-sm lg:col-span-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Zap size={14} /> System Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Toggle label="Auto Renew" checked={s.autoRenew} onChange={(v) => updateSetting('autoRenew', v)} />
                        <Toggle label="Cache Website" checked={s.cacheWebsite} onChange={(v) => updateSetting('cacheWebsite', v)} />
                        <Toggle label="Minimize CPU" checked={s.minimizeCpu} onChange={(v) => updateSetting('minimizeCpu', v)} />
                        <Toggle label="Anti-Fingerprint" checked={s.antiFingerprint} onChange={(v) => updateSetting('antiFingerprint', v)} />
                        <Toggle label="Randomize Session" checked={s.randomizeSession} onChange={(v) => updateSetting('randomizeSession', v)} />
                        <Toggle label="Auto Crawl" checked={s.autoCrawlEntry} onChange={(v) => updateSetting('autoCrawlEntry', v)} />
                    </div>
                </div>

            </div>
        </div>
    );
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">{children}</label>
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
