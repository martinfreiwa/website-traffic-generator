




import React, { useState, useEffect } from 'react';
import { Project, ProjectSettings, SystemSettings, ApiConfig, PayloadTemplate } from '../../types';
import { db, fetchWithAuth } from '../../services/db';
import { sparkTrafficService } from '../../services/sparkTraffic';
import { Zap, Globe, Play, FileCode, Key, Save, RefreshCw, Plus, Trash2, CheckCircle, Database, LayoutTemplate, Terminal, AlertTriangle, Dice5, AlertCircle, BarChart3, Info, Search } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface AdminDemoGenProps {
    onSuccess: () => void;
}

// Clean Default Payload - Only 1 URL
const DEFAULT_PAYLOAD = {
    "size": "demo", // This will be overwritten by the volume selector
    "traffic_type": "Direct",
    "bounce_rate": 0,
    "return_rate": 0,
    "time_on_page": "5sec",
    "desktop_rate": 100,
    "auto_renew": "true",
    "geo_type": "global",
    "keywords": "",
    "ga_id": ""
};

const AdminDemoGen: React.FC<AdminDemoGenProps> = ({ onSuccess }) => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    // Project Form
    const [demoName, setDemoName] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [demoGaId, setDemoGaId] = useState('');
    const [isScanningGA, setIsScanningGA] = useState(false);
    const [selectedVolume, setSelectedVolume] = useState('demo');
    const [isCreatingDemo, setIsCreatingDemo] = useState(false);
    const [urlWarning, setUrlWarning] = useState('');

    // API Config State
    const [selectedApiId, setSelectedApiId] = useState<string>('');
    const [newApiName, setNewApiName] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const [showAddApi, setShowAddApi] = useState(false);

    // Template State
    const [jsonSchema, setJsonSchema] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 4));
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [newTemplateName, setNewTemplateName] = useState('');
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);

    // Response State
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    useEffect(() => {
        const s = db.getSystemSettings();
        setSettings(s);

        // Init Defaults if they exist
        if (s.apiConfigs && s.apiConfigs.length > 0) {
            setSelectedApiId(s.apiConfigs[0].id);
        } else if (s.sparkTrafficApiKey) {
            // Legacy handling
        }
    }, []);

    // URL Validation Effect
    useEffect(() => {
        if (!demoUrl) {
            setUrlWarning('');
            return;
        }
        try {
            const hostname = new URL(demoUrl).hostname;
            const parts = hostname.split('.');
            // Rough check for 3rd level domain (e.g., sub.domain.com)
            if (parts.length > 2 && parts[0] !== 'www') {
                setUrlWarning('Note: Subdomains are sometimes rejected on Free/Demo plans.');
            } else {
                setUrlWarning('');
            }
        } catch (e) {
            // Invalid URL
        }
    }, [demoUrl]);

    const handleSaveSettings = (updated: SystemSettings) => {
        db.saveSystemSettings(updated);
        setSettings(updated);
    }

    const handleGenerateRandom = () => {
        const randomId = Math.floor(Math.random() * 10000);
        setDemoName(`Test Campaign ${randomId}`);
        // Use a safe, known domain for testing connection
        setDemoUrl(`https://example.com/test-${randomId}`);
    };

    // --- API MANAGEMENT ---

    const handleAddApi = () => {
        if (!newApiName || !newApiKey || !settings) return;

        const newConfig: ApiConfig = {
            id: `api_${Date.now()}`,
            name: newApiName,
            key: newApiKey
        };

        const updatedSettings = {
            ...settings,
            apiConfigs: [...(settings.apiConfigs || []), newConfig]
        };

        handleSaveSettings(updatedSettings);
        setSelectedApiId(newConfig.id);
        setNewApiName('');
        setNewApiKey('');
        setShowAddApi(false);
    };

    const handleDeleteApi = (id: string) => {
        if (!settings || !confirm('Delete this API configuration?')) return;
        const updatedSettings = {
            ...settings,
            apiConfigs: (settings.apiConfigs || []).filter(c => c.id !== id)
        };
        handleSaveSettings(updatedSettings);
        if (selectedApiId === id) setSelectedApiId('');
    };

    // --- TEMPLATE MANAGEMENT ---

    const handleSaveTemplate = () => {
        if (!newTemplateName || !jsonSchema || !settings) return;

        const newTemplate: PayloadTemplate = {
            id: `tpl_${Date.now()}`,
            name: newTemplateName,
            json: jsonSchema
        };

        const updatedSettings = {
            ...settings,
            payloadTemplates: [...(settings.payloadTemplates || []), newTemplate]
        };

        handleSaveSettings(updatedSettings);
        setSelectedTemplateId(newTemplate.id);
        setNewTemplateName('');
        setShowSaveTemplate(false);
    };

    const handleLoadTemplate = (id: string) => {
        if (!settings) return;

        if (!id) {
            // Reset to Default if empty selection
            setJsonSchema(JSON.stringify(DEFAULT_PAYLOAD, null, 4));
            setSelectedTemplateId('');
            return;
        }

        const tpl = settings.payloadTemplates?.find(t => t.id === id);
        if (tpl) {
            setJsonSchema(tpl.json);
            setSelectedTemplateId(id);
        }
    };

    const handleDeleteTemplate = (id: string) => {
        if (!settings || !confirm('Delete this template?')) return;
        const updatedSettings = {
            ...settings,
            payloadTemplates: (settings.payloadTemplates || []).filter(t => t.id !== id)
        };
        handleSaveSettings(updatedSettings);
        if (selectedTemplateId === id) setSelectedTemplateId('');
    };

    // --- GENERATION LOGIC ---

    const handleScanGA = async () => {
        if (!demoUrl) {
            alert('Please enter a Target URL first');
            return;
        }
        setIsScanningGA(true);
        try {
            const result = await db.findTid(demoUrl);
            if (result && result.tid) {
                setDemoGaId(result.tid);
            } else {
                alert('No GA ID found.');
            }
        } catch (e: any) {
            alert(e.message || 'Scan failed');
        } finally {
            setIsScanningGA(false);
        }
    };

    const handleCreateProject = async () => {
        setApiResponse(null);
        setLastError(null);

        if (!demoName || !demoUrl) {
            setLastError('Please enter a Project Name and Target URL');
            return;
        }

        setIsCreatingDemo(true);

        try {
            // Updated to use our internal FastAPI backend
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin;

            // Build the settings object as expected by our backend
            let parsedPayload: any = {};
            try {
                parsedPayload = JSON.parse(jsonSchema);
            } catch (e) {
                setLastError('Invalid JSON Schema. Please check syntax.');
                setIsCreatingDemo(false);
                return;
            }

            const projectPayload = {
                name: demoName,
                plan_type: "Demo",
                daily_limit: 1000, // Reasonable daily limit for a 10k total
                total_target: 10000, // The requested 10,000 visitor limit
                settings: {
                    ...parsedPayload,
                    target_url: demoUrl,
                    ga_id: demoGaId || parsedPayload.ga_id,
                    demo_mode: true
                }
            };

            const response = await fetchWithAuth(`${baseUrl}/projects`, {
                method: 'POST',
                body: JSON.stringify(projectPayload)
            });

            const raw = await response.json();
            setApiResponse(raw);

            if (!response.ok) {
                throw new Error(raw.detail || 'Failed to create project on backend');
            }

            // Save to Local DB (for UI persistence if needed, though syncing is better)
            const newProject: Project = {
                id: `demo-${raw.id.substring(0, 6)}`,
                externalId: raw.id,
                name: demoName,
                plan: 'Demo (10k Limit)',
                expires: 'One Year', // Flexible as requested
                status: 'active',
                settings: projectPayload.settings as any,
                userId: db.getCurrentUser()?.id || 'admin'
            };

            await db.addProject(newProject);
            onSuccess();

        } catch (e: any) {
            console.error(e);
            setLastError(e.message);
            if (!apiResponse) {
                setApiResponse({ error: e.message });
            }
        } finally {
            setIsCreatingDemo(false);
        }
    };

    if (!settings) return <div>Loading...</div>;

    // Prepare API Options
    const apiOptions = settings.apiConfigs?.map(api => ({
        value: api.id,
        label: api.name
    })) || [];
    if (!settings.apiConfigs?.length && settings.sparkTrafficApiKey) {
        apiOptions.push({ value: 'legacy', label: 'Legacy Key' });
    }

    // Prepare Template Options
    const templateOptions = settings.payloadTemplates?.map(t => ({
        value: t.id,
        label: t.name
    })) || [];

    return (
        <div className="animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-end gap-3 mb-6 flex-shrink-0">
                <div className="bg-[#ff4d00] p-2 rounded-sm text-white">
                    <Zap size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Project Tool</div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Quick Launcher</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">

                {/* --- COLUMN 1: CONFIGURATION & DETAILS --- */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">

                    {/* API SELECTOR CARD */}
                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                            <Key size={14} /> API Provider
                        </h3>

                        <div className="mb-4">
                            {!showAddApi ? (
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <CustomSelect
                                            value={selectedApiId}
                                            onChange={setSelectedApiId}
                                            options={apiOptions}
                                            placeholder="Select API..."
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowAddApi(true)}
                                        className="bg-gray-100 hover:bg-black hover:text-white text-gray-600 px-3 transition-colors rounded-sm"
                                        title="Add New API"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    {selectedApiId && selectedApiId !== 'legacy' && (
                                        <button
                                            onClick={() => handleDeleteApi(selectedApiId)}
                                            className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-3 transition-colors rounded-sm"
                                            title="Delete API"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 bg-gray-50 p-3 border border-gray-200 animate-in fade-in">
                                    <input
                                        placeholder="Provider Name (e.g. Production)"
                                        value={newApiName}
                                        onChange={(e) => setNewApiName(e.target.value)}
                                        className="w-full bg-white border border-gray-200 p-2 text-xs outline-none focus:border-[#ff4d00]"
                                    />
                                    <input
                                        placeholder="API Key"
                                        type="password"
                                        value={newApiKey}
                                        onChange={(e) => setNewApiKey(e.target.value)}
                                        className="w-full bg-white border border-gray-200 p-2 text-xs outline-none focus:border-[#ff4d00] font-mono"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleAddApi} className="flex-1 bg-black text-white py-2 text-xs font-bold uppercase">Save</button>
                                        <button onClick={() => setShowAddApi(false)} className="px-3 bg-white border border-gray-200 text-gray-500 text-xs font-bold uppercase">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-[10px] text-gray-400">
                            {selectedApiId ? (
                                <span className="flex items-center gap-1 text-green-600"><CheckCircle size={10} /> API Key Ready</span>
                            ) : (
                                <span className="text-orange-500">Please select an API provider.</span>
                            )}
                        </div>
                    </div>

                    {/* PROJECT DETAILS CARD */}
                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Play size={14} /> Production Details
                            </h3>
                            <button
                                onClick={handleGenerateRandom}
                                className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-[#ff4d00] transition-colors"
                                title="Generate random name and URL to test connection"
                            >
                                <Dice5 size={12} /> Test Data
                            </button>
                        </div>

                        <div className="space-y-4">

                            {/* Template Selector */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Traffic Template</label>
                                <div className="relative">
                                    <CustomSelect
                                        value={selectedTemplateId}
                                        onChange={handleLoadTemplate}
                                        options={[
                                            { value: "", label: "Default Configuration" },
                                            ...templateOptions
                                        ]}
                                        placeholder="Select Template..."
                                    />
                                </div>
                            </div>

                            {/* Plan / Size Selector (NEW FOR PRODUCTION) */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Traffic Volume (Plan)</label>
                                <div className="relative">
                                    <CustomSelect
                                        value={selectedVolume}
                                        onChange={setSelectedVolume}
                                        options={[
                                            { value: "demo", label: "Demo (Free Trial) - 6,000 hits" },
                                            { value: "nano", label: "Nano - 2,500 hits" },
                                            { value: "micro", label: "Micro - 5,000 hits" },
                                            { value: "standard", label: "Standard - 10,000 hits" },
                                            { value: "professional", label: "Professional - 25,000 hits" },
                                            { value: "business", label: "Business - 50,000 hits" }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Project Name</label>
                                <input
                                    value={demoName}
                                    onChange={(e) => setDemoName(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                    placeholder="Client Campaign A"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Target URL (One only)</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={demoUrl}
                                        onChange={(e) => setDemoUrl(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-medium font-mono text-gray-900 focus:border-[#ff4d00] outline-none"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                {urlWarning && (
                                    <div className="mt-2 text-[10px] text-orange-600 flex items-center gap-1 font-bold bg-orange-50 p-2 border border-orange-200 rounded-sm">
                                        <Info size={12} /> {urlWarning}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Google Analytics ID (Optional)</label>
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={demoGaId}
                                        onChange={(e) => setDemoGaId(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 pr-24 text-sm font-mono text-gray-900 focus:border-[#ff4d00] outline-none"
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

                            <button
                                onClick={handleCreateProject}
                                disabled={isCreatingDemo}
                                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {isCreatingDemo ? 'Processing...' : 'Launch Project'}
                            </button>
                        </div>
                    </div>

                    {/* API RESPONSE CARD */}
                    {apiResponse && (
                        <div className={`border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 ${lastError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${lastError ? 'text-red-600' : 'text-green-700'}`}>
                                    <Terminal size={14} /> {lastError ? 'Request Failed' : 'Request Successful'}
                                </h3>
                                {lastError && <AlertCircle size={16} className="text-red-500" />}
                            </div>

                            {lastError ? (
                                <div className="mb-4">
                                    <p className="text-sm font-bold text-red-800 mb-2">{lastError}</p>
                                    {lastError.includes("domain is not allowed") && (
                                        <p className="text-xs text-red-600">Tip: Try a different URL or upgrade the Volume plan. Major domains (like google.com) are often blocked on Demo plans.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-4 text-sm font-bold text-green-800">
                                    Project created successfully! ID: {apiResponse['new-id']}
                                </div>
                            )}

                            <div className="bg-[#111] p-4 rounded-sm border border-gray-800 overflow-auto max-h-64 custom-scrollbar">
                                <pre className={`text-[10px] font-mono whitespace-pre-wrap ${lastError ? 'text-red-300' : 'text-green-400'}`}>
                                    {JSON.stringify(apiResponse, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- COLUMN 2: JSON EDITOR --- */}
                <div className="lg:col-span-2 flex flex-col h-full bg-[#1e1e1e] border border-gray-800 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-3 border-b border-gray-800 bg-[#252526] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] flex items-center gap-2 mr-2">
                                <FileCode size={14} /> Payload Editor
                            </h3>

                            {/* Management Tools */}
                            {selectedTemplateId && (
                                <button onClick={() => handleDeleteTemplate(selectedTemplateId)} className="text-gray-500 hover:text-red-500 text-xs flex items-center gap-1">
                                    <Trash2 size={12} /> Delete Current
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {!showSaveTemplate ? (
                                <>
                                    <button
                                        onClick={() => handleLoadTemplate('')} // Reset
                                        className="text-[10px] uppercase font-bold text-gray-500 hover:text-white flex items-center gap-1 px-2"
                                    >
                                        <RefreshCw size={10} /> Reset
                                    </button>
                                    <button
                                        onClick={() => setShowSaveTemplate(true)}
                                        className="bg-[#333] hover:bg-[#444] text-white px-3 py-1.5 text-xs border border-gray-700 flex items-center gap-1"
                                    >
                                        <Save size={12} /> Save As Template
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                    <input
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="Template Name..."
                                        className="bg-[#111] border border-gray-600 text-white text-xs p-1.5 outline-none focus:border-[#ff4d00]"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveTemplate} className="bg-[#ff4d00] text-white px-2 py-1.5 text-xs font-bold uppercase">Save</button>
                                    <button onClick={() => setShowSaveTemplate(false)} className="text-gray-400 hover:text-white px-1"><X size={14} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 relative">
                        <textarea
                            value={jsonSchema}
                            onChange={(e) => setJsonSchema(e.target.value)}
                            className="w-full h-full bg-[#1e1e1e] text-green-400 font-mono text-xs p-6 outline-none resize-none leading-relaxed"
                            spellCheck={false}
                        />
                    </div>

                    <div className="p-3 bg-[#252526] border-t border-gray-800 text-[10px] text-gray-500 flex justify-between">
                        <span>JSON payload for API request body. Use Project Details to set Title/URL.</span>
                        <span>{jsonSchema.length} chars</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Icon component for Save As Input close button
const X: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
)

export default AdminDemoGen;
