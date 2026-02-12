
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ConversionSettings } from '../../types';
import { MessageSquare, MousePointer, LayoutTemplate, Save, CheckCircle } from 'lucide-react';

const AdminConversion: React.FC = () => {
    const [settings, setSettings] = useState<ConversionSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const data = db.getConversionSettings();
        setSettings(data);
    }, []);

    const handleSave = () => {
        if (!settings) return;
        setIsSaving(true);
        db.saveConversionSettings(settings);

        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 800);
    };

    if (!settings) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Conversion Boosters</h2>
                    <p className="text-sm text-gray-500">Tools to increase visitor engagement and sales.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-[#ff4d00] text-white font-bold rounded shadow-lg shadow-orange-500/30 hover:bg-[#e64600] transition-all"
                >
                    {isSaving ? (
                        <span>Saving...</span>
                    ) : saveSuccess ? (
                        <>
                            <CheckCircle size={18} />
                            <span>Saved!</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Social Proof */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MessageSquare size={120} />
                    </div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Social Proof Notifications</h3>
                            <p className="text-xs text-gray-500">Show recent sales popups to build trust.</p>
                        </div>
                        <div className="ml-auto">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.socialProof.enabled}
                                    onChange={e => setSettings({
                                        ...settings,
                                        socialProof: { ...settings.socialProof, enabled: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4d00]"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Position</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setSettings({ ...settings, socialProof: { ...settings.socialProof, position: 'bottom-left' } })}
                                    className={`p-2 border rounded text-sm font-medium transition-all ${settings.socialProof.position === 'bottom-left' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    Bottom Left
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, socialProof: { ...settings.socialProof, position: 'bottom-right' } })}
                                    className={`p-2 border rounded text-sm font-medium transition-all ${settings.socialProof.position === 'bottom-right' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    Bottom Right
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Delay (Seconds)</label>
                                <input
                                    type="number"
                                    value={settings.socialProof.delay}
                                    onChange={e => setSettings({ ...settings, socialProof: { ...settings.socialProof, delay: Number(e.target.value) } })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Data Source</label>
                                <select
                                    value={settings.socialProof.showRealData ? 'real' : 'mock'}
                                    onChange={e => setSettings({ ...settings, socialProof: { ...settings.socialProof, showRealData: e.target.value === 'real' } })}
                                    className="w-full p-2 border border-gray-300 rounded bg-white"
                                >
                                    <option value="mock">Simulated (Mock)</option>
                                    <option value="real">Real Sales Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exit Intent */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MousePointer size={120} />
                    </div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <MousePointer size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Exit Intent Popup</h3>
                            <p className="text-xs text-gray-500">Capture users before they leave.</p>
                        </div>
                        <div className="ml-auto">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.exitIntent.enabled}
                                    onChange={e => setSettings({
                                        ...settings,
                                        exitIntent: { ...settings.exitIntent, enabled: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4d00]"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Headline</label>
                            <input
                                type="text"
                                value={settings.exitIntent.headline}
                                onChange={e => setSettings({ ...settings, exitIntent: { ...settings.exitIntent, headline: e.target.value } })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Subtext</label>
                            <input
                                type="text"
                                value={settings.exitIntent.subtext}
                                onChange={e => setSettings({ ...settings, exitIntent: { ...settings.exitIntent, subtext: e.target.value } })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Coupon Code</label>
                                <input
                                    type="text"
                                    value={settings.exitIntent.couponCode || ''}
                                    onChange={e => setSettings({ ...settings, exitIntent: { ...settings.exitIntent, couponCode: e.target.value } })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                            <div className="flex items-end pb-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.exitIntent.showOncePerSession}
                                        onChange={e => setSettings({ ...settings, exitIntent: { ...settings.exitIntent, showOncePerSession: e.target.checked } })}
                                        className="rounded text-black focus:ring-black"
                                    />
                                    Show once per session
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Promo Bar */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutTemplate size={120} />
                    </div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <LayoutTemplate size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Global Promo Bar</h3>
                            <p className="text-xs text-gray-500">Top-of-page banner for announcements.</p>
                        </div>
                        <div className="ml-auto">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.promoBar.enabled}
                                    onChange={e => setSettings({
                                        ...settings,
                                        promoBar: { ...settings.promoBar, enabled: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4d00]"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Banner Message</label>
                            <input
                                type="text"
                                value={settings.promoBar.message}
                                onChange={e => setSettings({ ...settings, promoBar: { ...settings.promoBar, message: e.target.value } })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Button Text</label>
                                <input
                                    type="text"
                                    value={settings.promoBar.buttonText || ''}
                                    onChange={e => setSettings({ ...settings, promoBar: { ...settings.promoBar, buttonText: e.target.value } })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Button Link</label>
                                <input
                                    type="text"
                                    value={settings.promoBar.buttonLink || ''}
                                    onChange={e => setSettings({ ...settings, promoBar: { ...settings.promoBar, buttonLink: e.target.value } })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={settings.promoBar.backgroundColor}
                                        onChange={e => setSettings({ ...settings, promoBar: { ...settings.promoBar, backgroundColor: e.target.value } })}
                                        className="h-[38px] w-[50px] p-0 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.promoBar.backgroundColor}
                                        onChange={e => setSettings({ ...settings, promoBar: { ...settings.promoBar, backgroundColor: e.target.value } })}
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Countdown Timer End Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={settings.promoBar.endDate || ''}
                                onChange={e => setSettings({ ...settings, promoBar: { ...settings.promoBar, endDate: e.target.value } })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Set a date to show a countdown timer within the banner.</p>
                        </div>

                        {/* Preview */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Live Preview</label>
                            <div
                                className="rounded-lg p-3 text-center text-sm font-medium flex items-center justify-center gap-4 shadow-sm"
                                style={{ backgroundColor: settings.promoBar.backgroundColor, color: settings.promoBar.textColor }}
                            >
                                <span>{settings.promoBar.message}</span>
                                {settings.promoBar.buttonText && (
                                    <span className="px-3 py-1 bg-white text-black text-xs font-bold rounded shadow-sm opacity-90">
                                        {settings.promoBar.buttonText}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminConversion;
