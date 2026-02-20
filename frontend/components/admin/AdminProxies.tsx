import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ProxyProvider, ProxyProviderConfig, ProxySession, ProxyUsageStats, GeoLocation, ProxyLog, ProxyLogStats } from '../../types';
import { Save, RefreshCw, Wifi, WifiOff, Trash2, Activity, HardDrive, Mail, Clock, Eye, EyeOff, AlertCircle, CheckCircle, Globe, MapPin, Zap, FileText, TrendingUp, TrendingDown } from 'lucide-react';

const AdminProxies: React.FC = () => {
    const [config, setConfig] = useState<ProxyProviderConfig>({
        username: '',
        password: '',
        serviceName: 'RESIDENTIAL-PREMIUM',
        sessionLifetimeMinutes: 30,
        bandwidthLimitGb: undefined,
        notificationEmail: 'support@traffic-creator.com',
        isActive: true,
        warnAt80: true,
        warnAt50: true,
        warnAt20: true
    });
    const [provider, setProvider] = useState<ProxyProvider | null>(null);
    const [sessions, setSessions] = useState<ProxySession[]>([]);
    const [usage, setUsage] = useState<ProxyUsageStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
    const [testCountry, setTestCountry] = useState('');
    const [testState, setTestState] = useState('');
    const [testCity, setTestCity] = useState('');
    const [isTestingTraffic, setIsTestingTraffic] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    
    const [proxyLogs, setProxyLogs] = useState<ProxyLog[]>([]);
    const [logStats, setLogStats] = useState<ProxyLogStats | null>(null);
    const [showErrorsOnly, setShowErrorsOnly] = useState(false);

    useEffect(() => {
        loadData();
        loadGeoLocations();
        loadProxyLogs();
    }, []);
    
    const loadGeoLocations = async () => {
        try {
            const locations = await db.getGeoLocations();
            setGeoLocations(locations);
        } catch (e) {
            console.error('Failed to load geo locations:', e);
        }
    };

    const loadProxyLogs = async (errorsOnly: boolean = false) => {
        try {
            const [logs, stats] = await Promise.all([
                db.getProxyLogs({ limit: 50, errorsOnly: errorsOnly }),
                db.getProxyLogStats()
            ]);
            setProxyLogs(logs);
            setLogStats(stats);
        } catch (e) {
            console.error('Failed to load proxy logs:', e);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const providerData = await db.getProxyConfig();
            if (providerData) {
                setProvider(providerData);
                setConfig({
                    username: providerData.username,
                    password: '',
                    serviceName: providerData.serviceName,
                    sessionLifetimeMinutes: providerData.sessionLifetimeMinutes,
                    bandwidthLimitGb: providerData.bandwidthLimitGb,
                    notificationEmail: providerData.notificationEmail,
                    isActive: providerData.isActive,
                    warnAt80: providerData.warnAt80,
                    warnAt50: providerData.warnAt50,
                    warnAt20: providerData.warnAt20
                });
            }
            const [sessionsData, usageData] = await Promise.all([
                db.getProxySessions(true),
                db.getProxyUsage()
            ]);
            setSessions(sessionsData);
            setUsage(usageData);
        } catch (e) {
            console.error('Failed to load proxy data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config.username || !config.password) {
            setMessage({ type: 'error', text: 'Username and password are required' });
            return;
        }

        setIsSaving(true);
        setMessage(null);
        try {
            const saved = await db.saveProxyConfig(config);
            setProvider(saved);
            setMessage({ type: 'success', text: 'Proxy configuration saved successfully' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to save configuration' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setMessage(null);
        try {
            const result = await db.testProxyConnection();
            if (result.success) {
                setMessage({ type: 'success', text: `Connection successful! Bandwidth: ${result.bandwidth_used_gb || 0} GB used` });
                const usageData = await db.getProxyUsage();
                setUsage(usageData);
            } else {
                setMessage({ type: 'error', text: result.message || 'Connection failed' });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Test failed' });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setMessage(null);
        try {
            const result = await db.syncProxyLocations();
            setMessage({ type: 'success', text: `Synced ${result.locations_synced} geo locations` });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Sync failed' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReleaseSession = async (sessionId: string) => {
        try {
            await db.releaseProxySession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            setMessage({ type: 'success', text: 'Session released' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to release session' });
        }
    };

    const handleReleaseAll = async () => {
        try {
            const result = await db.releaseAllProxySessions();
            setSessions([]);
            setMessage({ type: 'success', text: `Released ${result.sessions_released} sessions` });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to release sessions' });
        }
    };

    const handleTestTraffic = async () => {
        if (!testCountry) {
            setMessage({ type: 'error', text: 'Please select a country for testing' });
            return;
        }
        
        setIsTestingTraffic(true);
        setTestResult(null);
        setMessage(null);
        
        try {
            const countryLoc = geoLocations.find(l => l.countryCode === testCountry);
            const result = await db.testProxyTraffic({
                countryCode: testCountry,
                countryName: countryLoc?.countryName,
                state: testState || undefined,
                city: testCity || undefined
            });
            setTestResult(result);
            
            if (result.success) {
                setMessage({ type: 'success', text: `Test successful! IP: ${result.detected?.ip} (${result.detected?.country})` });
            } else {
                setMessage({ type: 'error', text: result.message || 'Test failed' });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Test failed' });
        } finally {
            setIsTestingTraffic(false);
        }
    };

    const bandwidthPercent = usage?.bandwidthLimitGb && usage.bandwidthUsedGb 
        ? (usage.bandwidthUsedGb / usage.bandwidthLimitGb) * 100 
        : (provider?.bandwidthLimitGb && provider.bandwidthUsedGb 
            ? (provider.bandwidthUsedGb / provider.bandwidthLimitGb) * 100 
            : 0);

    const getBandwidthColor = (percent: number) => {
        if (percent >= 100) return 'bg-red-500';
        if (percent >= 80) return 'bg-orange-500';
        if (percent >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading proxy configuration...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Proxy Provider</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure Geonode Residential Proxies for geo-targeted traffic</p>
                </div>
                <div className="flex items-center gap-2">
                    {provider?.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-bold">
                            <Wifi size={16} /> Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-sm font-bold">
                            <WifiOff size={16} /> Inactive
                        </span>
                    )}
                </div>
            </div>

            {message && (
                <div className={`p-4 border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                        <HardDrive size={14} /> Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Username</label>
                            <input
                                type="text"
                                value={config.username}
                                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="geonode_username"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={config.password}
                                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 pr-10 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Service Name</label>
                            <input
                                type="text"
                                value={config.serviceName}
                                onChange={(e) => setConfig({ ...config, serviceName: e.target.value })}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                placeholder="RESIDENTIAL-PREMIUM"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Session Lifetime (min)</label>
                                <input
                                    type="number"
                                    value={config.sessionLifetimeMinutes}
                                    onChange={(e) => setConfig({ ...config, sessionLifetimeMinutes: parseInt(e.target.value) || 30 })}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Bandwidth Limit (GB)</label>
                                <input
                                    type="number"
                                    value={config.bandwidthLimitGb || ''}
                                    onChange={(e) => setConfig({ ...config, bandwidthLimitGb: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2 flex items-center gap-1">
                                <Mail size={12} /> Notification Email
                            </label>
                            <input
                                type="email"
                                value={config.notificationEmail}
                                onChange={(e) => setConfig({ ...config, notificationEmail: e.target.value })}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Bandwidth Alerts</label>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={config.warnAt80}
                                        onChange={(e) => setConfig({ ...config, warnAt80: e.target.checked })}
                                        className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded"
                                    />
                                    80%
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={config.warnAt50}
                                        onChange={(e) => setConfig({ ...config, warnAt50: e.target.checked })}
                                        className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded"
                                    />
                                    50%
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={config.warnAt20}
                                        onChange={(e) => setConfig({ ...config, warnAt20: e.target.checked })}
                                        className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded"
                                    />
                                    20%
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                            <input
                                type="checkbox"
                                checked={config.isActive}
                                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                                className="w-4 h-4 text-[#ff4d00] border-gray-300 rounded"
                            />
                            <span className="text-sm font-bold">Proxy Active</span>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleTest}
                                disabled={isTesting || !config.username}
                                className="bg-gray-100 text-gray-700 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} Test
                            </button>
                            <button
                                onClick={handleSync}
                                disabled={isSyncing || !provider}
                                className="bg-gray-100 text-gray-700 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw size={14} /> Sync
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <HardDrive size={14} /> Usage & Status
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold">Bandwidth</span>
                                    <span className="text-gray-500">
                                        {usage?.bandwidthUsedGb || provider?.bandwidthUsedGb || 0} GB / {usage?.bandwidthLimitGb || provider?.bandwidthLimitGb || '?'} GB
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all ${getBandwidthColor(bandwidthPercent)}`}
                                        style={{ width: `${Math.min(bandwidthPercent, 100)}%` }}
                                    />
                                </div>
                                <div className="text-right text-xs text-gray-400 mt-1">
                                    {bandwidthPercent.toFixed(1)}%
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 border border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Active Sessions</div>
                                    <div className="text-2xl font-black text-gray-900">{sessions.length}</div>
                                </div>
                                <div className="bg-gray-50 p-4 border border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Last Sync</div>
                                    <div className="text-sm font-bold text-gray-900">
                                        {provider?.lastSyncAt 
                                            ? new Date(provider.lastSyncAt).toLocaleString()
                                            : 'Never'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleReleaseAll}
                                disabled={sessions.length === 0}
                                className="w-full bg-red-50 text-red-600 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-red-200"
                            >
                                <Trash2 size={14} /> Release All Sessions
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <Clock size={14} /> Active Sessions
                        </h3>
                        {sessions.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">No active sessions</div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {sessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100">
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">
                                                {session.country || 'Unknown'}
                                                {session.state && ` / ${session.state}`}
                                                {session.city && ` / ${session.city}`}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {session.sessionId} • {session.requestCount} requests
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-gray-400">
                                                {session.expiresAt 
                                                    ? `${Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 60000))}m`
                                                    : '—'}
                                            </div>
                                            <button
                                                onClick={() => handleReleaseSession(session.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                    <Zap size={14} /> Test Proxy Traffic
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Country</label>
                                <select
                                    value={testCountry}
                                    onChange={(e) => {
                                        setTestCountry(e.target.value);
                                        setTestState('');
                                        setTestCity('');
                                    }}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium"
                                    disabled={!provider?.isActive}
                                >
                                    <option value="">Select Country...</option>
                                    {geoLocations.map(loc => (
                                        <option key={loc.countryCode} value={loc.countryCode}>{loc.countryName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">State (optional)</label>
                                <select
                                    value={testState}
                                    onChange={(e) => {
                                        setTestState(e.target.value);
                                        setTestCity('');
                                    }}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium"
                                    disabled={!testCountry}
                                >
                                    <option value="">Any State</option>
                                    {testCountry && geoLocations.find(l => l.countryCode === testCountry)?.states.map(s => (
                                        <option key={s.code} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">City (optional)</label>
                                <select
                                    value={testCity}
                                    onChange={(e) => setTestCity(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium"
                                    disabled={!testState}
                                >
                                    <option value="">Any City</option>
                                    {testState && geoLocations.find(l => l.countryCode === testCountry)?.cities
                                        .filter(c => c.code.startsWith(testState.substring(0, 2).toUpperCase()))
                                        .map(c => (
                                            <option key={c.code} value={c.name}>{c.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleTestTraffic}
                            disabled={isTestingTraffic || !testCountry || !provider?.isActive}
                            className="bg-[#ff4d00] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#e64500] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTestingTraffic ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" /> Testing...
                                </>
                            ) : (
                                <>
                                    <Zap size={14} /> Run Test
                                </>
                            )}
                        </button>
                        {geoLocations.length === 0 && (
                            <p className="text-xs text-yellow-600 mt-2">No geo locations loaded. Sync from Geonode first.</p>
                        )}
                    </div>
                    <div>
                        {testResult ? (
                            <div className={`p-4 border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {testResult.success ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-green-700 font-bold">
                                            <CheckCircle size={16} /> Test Successful
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">IP Address:</span>
                                                <span className="font-mono font-bold ml-2">{testResult.detected?.ip}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Latency:</span>
                                                <span className="font-bold ml-2">{testResult.latency_ms}ms</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Country:</span>
                                                <span className="font-bold ml-2">{testResult.detected?.country} ({testResult.detected?.country_code})</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Region:</span>
                                                <span className="font-bold ml-2">{testResult.detected?.region}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">City:</span>
                                                <span className="font-bold ml-2">{testResult.detected?.city}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">ISP:</span>
                                                <span className="font-bold ml-2">{testResult.detected?.isp}</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 text-sm ${testResult.geo_match ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {testResult.geo_match ? (
                                                <>
                                                    <CheckCircle size={14} /> Geo-location matches request
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={14} /> Geo-location does not match request
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-700">
                                        <AlertCircle size={16} />
                                        <span>{testResult.message}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 p-8 text-center text-gray-400">
                                <Globe size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Select a country and run a test to verify proxy geo-location</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] flex items-center gap-2">
                        <FileText size={14} /> Proxy Logs
                    </h3>
                    <div className="flex items-center gap-4">
                        {logStats && (
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                    <TrendingUp size={12} className="text-green-500" />
                                    <span className="font-bold">{logStats.successRate}%</span>
                                    <span className="text-gray-400">success</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold">{logStats.avgLatencyMs}ms</span>
                                    <span className="text-gray-400">avg latency</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-red-500">{logStats.failed}</span>
                                    <span className="text-gray-400">errors</span>
                                </div>
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-xs font-medium">
                            <input
                                type="checkbox"
                                checked={showErrorsOnly}
                                onChange={(e) => {
                                    setShowErrorsOnly(e.target.checked);
                                    loadProxyLogs(e.target.checked);
                                }}
                                className="w-3 h-3"
                            />
                            Errors only
                        </label>
                        <button
                            onClick={() => loadProxyLogs(showErrorsOnly)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
                
                {proxyLogs.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No proxy logs yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase">Time</th>
                                    <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase">Status</th>
                                    <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase">Location</th>
                                    <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase">IP</th>
                                    <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase">Latency</th>
                                    <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proxyLogs.map((log) => (
                                    <tr key={log.id} className={`border-b border-gray-100 ${!log.success ? 'bg-red-50' : ''}`}>
                                        <td className="py-2 px-2 text-gray-500">
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                                        </td>
                                        <td className="py-2 px-2">
                                            {log.success ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle size={12} /> {log.responseCode || 'OK'}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <AlertCircle size={12} /> {log.responseCode || 'Error'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2">
                                            {log.countryCode && (
                                                <span className="flex items-center gap-1">
                                                    <img 
                                                        src={`https://flagcdn.com/w16/${log.countryCode.toLowerCase()}.png`} 
                                                        alt={log.countryCode} 
                                                        className="w-4 h-auto" 
                                                    />
                                                    {log.countryCode}
                                                    {log.state && <span className="text-gray-400">/{log.state}</span>}
                                                    {log.city && <span className="text-gray-300">/{log.city}</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 font-mono text-gray-500">{log.ipAddress || '—'}</td>
                                        <td className="py-2 px-2">{log.latencyMs ? `${log.latencyMs}ms` : '—'}</td>
                                        <td className="py-2 px-2 text-red-600 max-w-xs truncate">{log.errorMessage || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProxies;
