import React, { useState, useEffect } from 'react';
import { Project, ProjectSettings } from '../../types';
import { db } from '../../services/db';
import { ArrowLeft, Save, Globe, Smartphone, Monitor, Activity, MousePointer, Settings, MapPin, Zap, Search, RefreshCw, Split } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface AdminEditProjectProps {
    projectId: string;
    onBack: () => void;
    onUpdate: () => void;
}

const AdminEditProject: React.FC<AdminEditProjectProps> = ({ projectId, onBack, onUpdate }) => {
    const [project, setProject] = useState<Project | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isScanningGA, setIsScanningGA] = useState(false);

    useEffect(() => {
        const p = db.getProjectById(projectId);
        if (p) {
            // Define defaults
            const defaults: ProjectSettings = {
                bounceRate: 0, returnRate: 0, deviceSplit: 70,
                deviceSpecific: "All",
                timeOnPage: '3 minutes', timezone: 'UTC', language: 'en-US', languages: ['en-US'], gaId: '',
                entryUrls: '', innerUrls: '', exitUrls: '',
                autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
                innerUrlCount: 0, countries: ['United States'],
                geoTargets: [{ id: 'default-geo', country: 'United States', percent: 100 }],
                trafficSource: 'organic',
                keywords: '', referralUrls: '', 
                sitemap: '', sitemapAutoCrawl: false, shortener: '',
                pagesPerVisitor: 3, customSubpages: [],
                autoRenew: false, cacheWebsite: false, minimizeCpu: false,
                randomizeSession: true, antiFingerprint: true,
                pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0
            };

            // Merge existing settings with defaults
            const mergedSettings = { ...defaults, ...p.settings };

            // Ensure array fields are definitely arrays
            if (!Array.isArray(mergedSettings.countries)) mergedSettings.countries = [defaults.countries[0]];
            if (!Array.isArray(mergedSettings.languages)) mergedSettings.languages = [defaults.languages[0]];
            
            // Ensure customSubpages is an array and correct length
            if (!Array.isArray(mergedSettings.customSubpages)) mergedSettings.customSubpages = [];
            
            // Pad array if needed based on pagesPerVisitor
            const targetDepth = mergedSettings.pagesPerVisitor || 3;
            while (mergedSettings.customSubpages.length < targetDepth) {
                mergedSettings.customSubpages.push('');
            }

            setProject({ ...p, settings: mergedSettings });
        }
    }, [projectId]);

    const handleSave = async () => {
        if (!project) return;
        setIsSaving(true);
        try {
            await db.updateProject(project);
            onUpdate();
            alert('Project configuration saved successfully.');
        } catch (err: any) {
            alert('Error saving project: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleScanGA = async () => {
        const url = project?.settings?.entryUrls.split(',')[0]?.trim() || project?.settings?.entryUrls.split('\n')[0]?.trim();
        if (!url) {
            alert('Please enter a Target URL first.');
            return;
        }
        setIsScanningGA(true);
        try {
            const result = await db.findTid(url);
            if (result && result.tid) {
                updateSetting('gaId', result.tid);
                alert(`Found Analytics ID: ${result.tid}`);
            } else {
                alert('No Analytics ID found on page.');
            }
        } catch (e: any) {
            alert(e.message || 'Failed to scan URL');
        } finally {
            setIsScanningGA(false);
        }
    };

    const updateSetting = (key: keyof ProjectSettings, value: any) => {
        if (!project || !project.settings) return;
        
        // Special logic for pagesPerVisitor to resize subpages array
        if (key === 'pagesPerVisitor') {
            const newDepth = parseInt(value);
            const currentSubpages = [...(project.settings.customSubpages || [])];
            
            if (newDepth > currentSubpages.length) {
                while (currentSubpages.length < newDepth) currentSubpages.push('');
            } else if (newDepth < currentSubpages.length) {
                currentSubpages.splice(newDepth);
            }
            
            setProject({
                ...project,
                settings: {
                    ...project.settings,
                    pagesPerVisitor: newDepth,
                    customSubpages: currentSubpages
                }
            });
            return;
        }

        setProject({
            ...project,
            settings: {
                ...project.settings,
                [key]: value
            }
        });
    };

    const updateSubpage = (index: number, value: string) => {
        if (!project || !project.settings) return;
        const newArr = [...(project.settings.customSubpages || [])];
        newArr[index] = value;
        updateSetting('customSubpages', newArr);
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
                                        { value: "completed", label: "Completed" }
                                    ]}
                                />
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
                            <div className="relative flex items-center">
                                <input
                                    value={s.gaId}
                                    onChange={(e) => updateSetting('gaId', e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 pr-24 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00]"
                                    placeholder="G-XXXXXXXXXX"
                                />
                                <button 
                                    onClick={handleScanGA}
                                    disabled={isScanningGA}
                                    className="absolute right-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ff4d00] flex items-center gap-1 bg-white border border-gray-100 px-2 py-1 shadow-sm transition-all"
                                >
                                    {isScanningGA ? <RefreshCw size={10} className="animate-spin" /> : <Search size={10} />}
                                    {isScanningGA ? 'Scanning' : 'Find ID'}
                                </button>
                            </div>
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
                                    onChange={(e) => updateSetting('languages', e.target.value.split(', ')).split(', ')}
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
                    </div>
                </div>

                {/* --- JOURNEY & CONTENT (New) --- */}
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <Split size={14} /> Journey & Content
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <Label>Pages per Visitor</Label>
                                <span className="text-xs font-bold text-gray-900">{s.pagesPerVisitor || 3} Pages</span>
                            </div>
                            <input
                                type="range" min="1" max="15"
                                value={s.pagesPerVisitor || 3}
                                onChange={(e) => updateSetting('pagesPerVisitor', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                            />
                        </div>

                        <div>
                            <Label>Sitemap URL</Label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="url"
                                    value={s.sitemap} 
                                    onChange={(e) => updateSetting('sitemap', e.target.value)}
                                    placeholder="https://example.com/sitemap.xml"
                                    className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Auto-Crawl</span>
                                    <Toggle label="" checked={s.sitemapAutoCrawl || false} onChange={(v) => updateSetting('sitemapAutoCrawl', v)} />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <label className="text-xs font-bold text-gray-900 uppercase tracking-wide block mb-3">Custom Funnel Steps</label>
                            <p className="text-[10px] text-gray-400 mb-4">
                                Define specific URLs for each step of the journey. One per line. Max 500 URLs per step.
                            </p>
                            
                            <div className="space-y-6">
                                {(s.customSubpages || []).map((page: string, index: number) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <span className="text-xs font-bold text-gray-400 w-12 flex-shrink-0 pt-3">Step {index + 1}</span>
                                        <textarea
                                            value={page}
                                            onChange={(e) => updateSubpage(index, e.target.value)}
                                            placeholder={index === 0 ? "https://example.com/features" : "https://example.com/pricing"}
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none h-24 resize-y"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
        {label && <span className="text-sm font-bold text-gray-700">{label}</span>}
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 ${checked ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
        >
            <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </button>
    </div>
)

export default AdminEditProject;