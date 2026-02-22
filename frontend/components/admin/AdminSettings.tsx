import React, { useState } from 'react';
import { SystemSettings } from '../../types';
import { db } from '../../services/db';
import { Save, Key, Shield } from 'lucide-react';

interface AdminSettingsProps {
    initialSettings: SystemSettings;
    onSave: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ initialSettings, onSave }) => {
    const [settings, setSettings] = useState<SystemSettings>(initialSettings);

    const handleSave = () => {
        db.saveSystemSettings(settings);
        onSave();
        alert('System settings updated.');
    };

    return (
        <div className="animate-in fade-in max-w-2xl">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">System Settings</h2>
            <div className="bg-white border border-gray-200 shadow-sm p-8 space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Site Name</label>
                    <input 
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Support Email</label>
                    <input 
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2 flex items-center gap-1">
                        <Key size={12} /> SparkTraffic API Key
                    </label>
                    <div className="relative">
                        <input 
                        value={settings.sparkTrafficApiKey || ''}
                        onChange={(e) => setSettings({...settings, sparkTrafficApiKey: e.target.value})}
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
                    onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                    className={`w-12 h-6 flex items-center p-1 transition-colors duration-300 ${settings.maintenanceMode ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
                >
                    <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50">
                    <span className="text-sm font-bold text-gray-700">Allow New Registrations</span>
                    <button 
                        onClick={() => setSettings({...settings, allowRegistrations: !settings.allowRegistrations})}
                        className={`w-12 h-6 flex items-center p-1 transition-colors duration-300 ${settings.allowRegistrations ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${settings.allowRegistrations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
                <div className="pt-4 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2 flex items-center gap-1">
                        <Shield size={12} /> Blocked Domains (Free Tier)
                    </label>
                    <textarea
                        value={(settings.blockedDomainsForFree || []).join('\n')}
                        onChange={(e) => setSettings({
                            ...settings,
                            blockedDomainsForFree: e.target.value.split('\n').map(d => d.trim()).filter(Boolean)
                        })}
                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-mono text-gray-900 focus:border-[#ff4d00] outline-none h-32 resize-y"
                        placeholder="competitor1.com&#10;spammy-site.net&#10;malware-domain.xyz"
                    />
                    <p className="text-xs text-gray-400 mt-1">One domain per line. These domains will be blocked for free tier users (in addition to URL shorteners, free subdomain services, and rotating link services which are blocked by default).</p>
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
