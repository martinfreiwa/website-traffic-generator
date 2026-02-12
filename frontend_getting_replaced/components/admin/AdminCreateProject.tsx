import React, { useState, useEffect } from 'react';
import { User, Project, ProjectSettings, ProjectTemplate } from '../../types';
import { db } from '../../services/db';
import { RefreshCw, Save, ArrowLeft, Search, Settings, Activity, MapPin, MousePointer, Zap, Monitor, Smartphone, LayoutTemplate, Download, Trash2, X } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface AdminCreateProjectProps {
    onBack: () => void;
    onSuccess: () => void;
}

const AdminCreateProject: React.FC<AdminCreateProjectProps> = ({ onBack, onSuccess }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isScanningGA, setIsScanningGA] = useState(false);
    
    // Template State
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    // Full Project Settings State
    const [name, setName] = useState('');
    const [settings, setSettings] = useState<ProjectSettings>({
        bounceRate: 0, returnRate: 0, deviceSplit: 70,
        deviceSpecific: "All",
        timeOnPage: '3 minutes', timezone: 'UTC', language: 'en-US', languages: ['en-US'], gaId: '',
        entryUrls: '', innerUrls: '', exitUrls: '',
        autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
        innerUrlCount: 0, countries: ['United States'],
        geoTargets: [{ id: 'default-geo', country: 'United States', percent: 100 }],
        trafficSource: 'organic',
        keywords: '', referralUrls: '', sitemap: '', shortener: '',
        autoRenew: false, cacheWebsite: false, minimizeCpu: false,
        randomizeSession: true, antiFingerprint: true,
        pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0
    });

    useEffect(() => {
        loadUsers();
        loadTemplates();
    }, []);

    const loadUsers = async () => {
        const data = await db.syncUsers();
        setUsers(data);
    };

    const loadTemplates = async () => {
        try {
            const data = await db.getTemplates();
            setTemplates(data);
        } catch (e) {
            console.error("Failed to load templates", e);
        }
    };

    const handleSaveTemplate = async () => {
        if (!newTemplateName) return;
        try {
            await db.saveTemplate(newTemplateName, settings);
            setShowSaveTemplate(false);
            setNewTemplateName('');
            loadTemplates();
            alert('Template saved successfully!');
        } catch (e: any) {
            alert('Failed to save template: ' + e.message);
        }
    };

    const handleLoadTemplate = (templateId: string) => {
        const t = templates.find(t => t.id === templateId);
        if (t) {
            // Merge defaults with template settings to ensure all fields exist
            setSettings(prev => ({ ...prev, ...t.settings }));
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await db.deleteTemplate(templateId);
            loadTemplates();
        } catch (e: any) {
            alert('Failed to delete: ' + e.message);
        }
    }

    const updateSetting = (key: keyof ProjectSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleScanGA = async () => {
        const url = settings.entryUrls.split(',')[0]?.trim() || settings.entryUrls.split('\n')[0]?.trim();
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

    const handleCreate = async () => {
        if (!selectedUserId || !name || !settings.entryUrls) {
            alert("Please fill in required fields (User, Name, Target URL)");
            return;
        }

        setLoading(true);
        try {
            // Prepare the payload for backend
            const projectData = {
                user_id: selectedUserId,
                name: name,
                plan_type: "Custom",
                // Calculate simplistic limits if needed, or set defaults
                daily_limit: 0, 
                total_target: 1000,
                
                // IMPORTANT: Send the FULL settings object
                settings: {
                    ...settings,
                    // Ensure backend compatibility for traffic generation
                    targets: [
                        { url: settings.entryUrls, tid: settings.gaId }
                    ],
                    targetUrl: settings.entryUrls, // Legacy
                    ga4Tid: settings.gaId // Legacy
                }
            };

            await db.adminCreateProject(projectData);
            alert("Project successfully created!");
            onSuccess();
        } catch (err: any) {
            alert("Error creating project: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 sticky top-0 bg-[#f3f4f6] z-10 pt-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Project</h2>
                        <p className="text-sm text-gray-500">Configure a new project for a specific user</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={loading || !selectedUserId}
                    className="bg-black text-white px-6 py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Create Project
                </button>
            </div>

            {/* Template Management Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                        <LayoutTemplate size={16} className="text-[#ff4d00]" />
                        TEMPLATES:
                    </div>
                    <div className="flex items-center gap-2">
                         <select 
                            className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-[#ff4d00]"
                            onChange={(e) => {
                                if(e.target.value) handleLoadTemplate(e.target.value);
                            }}
                            value=""
                         >
                            <option value="">Load Template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                         </select>
                         
                         {/* Quick delete for selected template? Only if we tracked selected template ID, but select resets to "" */}
                         {/* Instead, list templates with delete in a modal or just keep it simple for now */}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {showSaveTemplate ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Template Name..." 
                                className="border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                            />
                            <button onClick={handleSaveTemplate} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">SAVE</button>
                            <button onClick={() => setShowSaveTemplate(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowSaveTemplate(true)}
                            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#ff4d00] flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded hover:border-[#ff4d00] transition-all"
                        >
                            <Download size={14} /> Save as Template
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* User Selection Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">1. Select User</h3>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUserId(user.id)}
                                    className={`p-3 flex items-center justify-between cursor-pointer border-b border-gray-50 transition-colors ${selectedUserId === user.id ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <div className="font-bold text-sm">{user.email}</div>
                                        <div className={`text-xs ${selectedUserId === user.id ? 'text-gray-400' : 'text-gray-500'}`}>{user.role} • {user.id.substring(0, 8)}...</div>
                                    </div>
                                    {selectedUserId === user.id && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Template List Side Panel (optional better view) */}
                     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                             <LayoutTemplate size={14}/> Saved Templates
                        </h3>
                        {templates.length === 0 ? (
                            <div className="text-xs text-gray-400 italic">No saved templates yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {templates.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 group">
                                        <span className="text-xs font-bold text-gray-700">{t.name}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleLoadTemplate(t.id)}
                                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                                            >
                                                LOAD
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTemplate(t.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Main Settings Area */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* --- CORE SETTINGS --- */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-lg">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <Settings size={14} /> 2. Core Configuration
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <Label>Project Name</Label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00] rounded"
                                    placeholder="e.g. Client Campaign A"
                                />
                            </div>
                            <div>
                                <Label>Target URL (Entry)</Label>
                                <input
                                    value={settings.entryUrls}
                                    onChange={(e) => updateSetting('entryUrls', e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00] rounded"
                                    placeholder="https://example.com"
                                />
                            </div>
                            
                            <div>
                                <Label>Google Analytics ID</Label>
                                <div className="relative flex items-center">
                                    <input
                                        value={settings.gaId}
                                        onChange={(e) => updateSetting('gaId', e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 pr-24 text-sm font-mono text-gray-900 outline-none focus:border-[#ff4d00] rounded"
                                        placeholder="G-XXXXXXXXXX"
                                    />
                                    <button 
                                        onClick={handleScanGA}
                                        disabled={isScanningGA || !settings.entryUrls}
                                        className="absolute right-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ff4d00] flex items-center gap-1 bg-white border border-gray-100 px-2 py-1 shadow-sm transition-all rounded"
                                    >
                                        {isScanningGA ? <RefreshCw size={10} className="animate-spin" /> : <Search size={10} />}
                                        {isScanningGA ? 'Scanning' : 'Find ID'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- BEHAVIOR METRICS --- */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-lg">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <Activity size={14} /> 3. Visitor Behavior
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Bounce Rate (%)</Label>
                                    <input
                                        type="number"
                                        value={settings.bounceRate}
                                        onChange={(e) => updateSetting('bounceRate', parseInt(e.target.value))}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00] rounded"
                                    />
                                </div>
                                <div>
                                    <Label>Return Rate (%)</Label>
                                    <input
                                        type="number"
                                        value={settings.returnRate}
                                        onChange={(e) => updateSetting('returnRate', parseInt(e.target.value))}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00] rounded"
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

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <Label>Device Split</Label>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase flex gap-3">
                                        <span className="flex items-center gap-1"><Monitor size={10} /> Desktop: {settings.deviceSplit}%</span>
                                        <span className="flex items-center gap-1"><Smartphone size={10} /> Mobile: {100 - settings.deviceSplit}%</span>
                                    </div>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={settings.deviceSplit}
                                    onChange={(e) => updateSetting('deviceSplit', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- GEOLOCATION --- */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-lg">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <MapPin size={14} /> 4. Geolocation & Tech
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <Label>Countries</Label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {settings.countries.map(c => (
                                        <span key={c} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs font-bold uppercase rounded-sm flex items-center gap-2">
                                            {c} <button onClick={() => updateSetting('countries', settings.countries.filter(x => x !== c))} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <CustomSelect
                                    value=""
                                    onChange={(val) => {
                                        if (val && !settings.countries.includes(val)) {
                                            updateSetting('countries', [...settings.countries, val]);
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
                        </div>
                    </div>

                    {/* --- ADVANCED INTERACTIONS --- */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-lg">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <MousePointer size={14} /> 5. Advanced Interactions
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <Label>Traffic Source Type</Label>
                                <CustomSelect
                                    value={settings.trafficSource}
                                    onChange={(val) => updateSetting('trafficSource', val)}
                                    options={[
                                        { value: "organic", label: "Organic (Search)" },
                                        { value: "direct", label: "Direct" },
                                        { value: "social", label: "Social" }
                                    ]}
                                />
                            </div>

                            {settings.trafficSource === 'organic' && (
                                <div>
                                    <Label>Keywords (One per line)</Label>
                                    <textarea
                                        value={settings.keywords}
                                        onChange={(e) => updateSetting('keywords', e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24 rounded"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- TOGGLES --- */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-lg">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <Zap size={14} /> 6. System Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Toggle label="Auto Renew" checked={settings.autoRenew} onChange={(v) => updateSetting('autoRenew', v)} />
                            <Toggle label="Cache Website" checked={settings.cacheWebsite} onChange={(v) => updateSetting('cacheWebsite', v)} />
                            <Toggle label="Minimize CPU" checked={settings.minimizeCpu} onChange={(v) => updateSetting('minimizeCpu', v)} />
                            <Toggle label="Anti-Fingerprint" checked={settings.antiFingerprint} onChange={(v) => updateSetting('antiFingerprint', v)} />
                            <Toggle label="Randomize Session" checked={settings.randomizeSession} onChange={(v) => updateSetting('randomizeSession', v)} />
                            <Toggle label="Auto Crawl" checked={settings.autoCrawlEntry} onChange={(v) => updateSetting('autoCrawlEntry', v)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">{children}</label>
)

const Toggle: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 rounded-full ${checked ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
        >
            <div className={`w-4 h-4 bg-white shadow-sm rounded-full transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </button>
    </div>
)

export default AdminCreateProject;
