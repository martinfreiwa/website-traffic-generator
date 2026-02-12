import React, { useState, useEffect } from 'react';
import { SystemSettings, User } from '../../types';
import { db } from '../../services/db';
import { Save, Key, Eye, EyeOff, RefreshCw, Copy, Check, ShieldAlert, Power, PlayCircle } from 'lucide-react';

interface AdminSettingsProps {
    initialSettings: SystemSettings;
    onSave: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ initialSettings, onSave }) => {
    const [settings, setSettings] = useState<SystemSettings>(initialSettings);
    const [user, setUser] = useState<User | undefined>(db.getCurrentUser());
    const [showKey, setShowKey] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSave = () => {
        db.saveSystemSettings(settings);
        onSave();
        alert('System settings updated.');
    };

    const handleRegenerateKey = async () => {
        if (!confirm('Are you sure you want to regenerate your API key? The old one will stop working immediately.')) return;

        setIsRegenerating(true);
        try {
            await db.generateApiKey();
            setUser(db.getCurrentUser());
            alert('New API Key generated successfully.');
        } catch (e) {
            alert('Failed to regenerate API Key');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleCopyKey = () => {
        if (user?.apiKey) {
            navigator.clipboard.writeText(user.apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="animate-in fade-in max-w-2xl pb-20">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">System & Account Settings</h2>

            {/* My API Key Section */}
            <div className="bg-black text-white p-8 mb-8 border border-gray-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Key size={80} />
                </div>

                <div className="relative z-10">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4d00] mb-2 flex items-center gap-2">
                        <Key size={12} /> Personal Secret Credentials
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-4">My API Key</h3>
                    <p className="text-[11px] text-gray-400 mb-6 max-w-md leading-relaxed">
                        Use this key to authenticate automated requests to the Traffic Creator API.
                        Include it as a <code className="text-[#ff4d00] font-bold">X-API-KEY</code> header in your requests.
                    </p>

                    <div className="flex gap-2 mb-6">
                        <div className="flex-1 bg-[#1a1a1a] border border-gray-800 p-3 flex items-center justify-between">
                            <code className="text-xs font-mono text-green-400">
                                {showKey ? (user?.apiKey || 'No Key Generated') : '••••••••••••••••••••••••••••••••'}
                            </code>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-1 hover:text-[#ff4d00] transition-colors"
                                    title={showKey ? "Hide Key" : "Show Key"}
                                >
                                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                    onClick={handleCopyKey}
                                    className="p-1 hover:text-[#ff4d00] transition-colors"
                                    title="Copy to Clipboard"
                                    disabled={!user?.apiKey}
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleRegenerateKey}
                            disabled={isRegenerating}
                            className="bg-[#1a1a1a] border border-gray-800 px-4 flex items-center justify-center hover:bg-white hover:text-black transition-all group"
                        >
                            <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm p-8 space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Site Name</label>
                    <input
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Support Email</label>
                    <input
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2 flex items-center gap-1">
                        <Key size={12} /> Global SparkTraffic Key (Shared)
                    </label>
                    <div className="relative">
                        <input
                            value={settings.sparkTrafficApiKey || ''}
                            onChange={(e) => setSettings({ ...settings, sparkTrafficApiKey: e.target.value })}
                            type="password"
                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-mono text-gray-900 focus:border-[#ff4d00] outline-none"
                            placeholder="Enter API Key from v2.sparktraffic.com"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Key size={16} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50">
                    <span className="text-sm font-bold text-gray-700">Maintenance Mode</span>
                    <button
                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                        className={`w-12 h-6 flex items-center p-1 transition-colors duration-300 ${settings.maintenanceMode ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50">
                    <span className="text-sm font-bold text-gray-700">Allow New Registrations</span>
                    <button
                        onClick={() => setSettings({ ...settings, allowRegistrations: !settings.allowRegistrations })}
                        className={`w-12 h-6 flex items-center p-1 transition-colors duration-300 ${settings.allowRegistrations ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${settings.allowRegistrations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Emergency Traffic Control - Premium Design */}
                <div className="bg-[#111] text-white p-8 mt-12 border border-red-900/30 shadow-2xl relative overflow-hidden group rounded-sm">
                    {/* Background Ambient Icon */}
                    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <ShieldAlert size={180} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full">
                                <ShieldAlert className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">
                                    Global Kill Switch
                                </h3>
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">
                                    Emergency Traffic Control
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-8 max-w-xl leading-relaxed font-light">
                            Instantly halt all traffic generation across the entire platform.
                            This is a catastrophic action: all active campaigns will effectively pause until traffic is manually resumed.
                        </p>

                        <div className="flex items-center gap-4 max-w-lg">
                            <button
                                onClick={async () => {
                                    if (!confirm('Are you sure you want to PAUSE all traffic? This will stop all active hits immediately.')) return;
                                    try {
                                        await db.setGlobalTrafficStatus(false);
                                        setSettings({ ...settings, traffic_enabled: false });
                                        alert("TRAFFIC PAUSED GLOBALLY.");
                                    } catch (e) { alert("Failed to pause traffic"); }
                                }}
                                disabled={settings.traffic_enabled === false}
                                className={`flex-1 group relative overflow-hidden p-4 border transition-all duration-300 flex flex-col items-center justify-center gap-3
                                    ${settings.traffic_enabled === false
                                        ? 'bg-[#1a1a1a] border-gray-800 opacity-50 cursor-not-allowed text-gray-500'
                                        : 'bg-red-600 border-red-500 hover:bg-red-700 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]'}`}
                            >
                                <Power size={24} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Stop All Traffic</span>
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        await db.setGlobalTrafficStatus(true);
                                        setSettings({ ...settings, traffic_enabled: true });
                                        alert("TRAFFIC RESUMED.");
                                    } catch (e) { alert("Failed to resume traffic"); }
                                }}
                                disabled={settings.traffic_enabled !== false}
                                className={`flex-1 group relative overflow-hidden p-4 border transition-all duration-300 flex flex-col items-center justify-center gap-3
                                    ${settings.traffic_enabled !== false
                                        ? 'bg-[#1a1a1a] border-gray-800 opacity-50 cursor-not-allowed text-gray-500'
                                        : 'bg-green-600 border-green-500 hover:bg-green-700 text-white shadow-[0_0_30px_rgba(22,163,74,0.3)]'}`}
                            >
                                <PlayCircle size={24} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Resume Operations</span>
                            </button>
                        </div>

                        {/* Status Indicator */}
                        <div className="mt-8 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${settings.traffic_enabled !== false ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-mono text-gray-500 uppercase">
                                Current System Status: <span className={settings.traffic_enabled !== false ? 'text-green-500' : 'text-red-500'}>
                                    {settings.traffic_enabled !== false ? 'OPERATIONAL' : 'HALTED'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                    >
                        <Save size={14} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
