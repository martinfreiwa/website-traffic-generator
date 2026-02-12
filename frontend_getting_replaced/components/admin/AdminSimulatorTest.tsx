
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Play, Globe, Search, RefreshCw, Clock, Users, Zap, Terminal, Activity, CheckCircle, AlertCircle, Database } from 'lucide-react';

const AdminSimulatorTest: React.FC = () => {
    const [targetUrl, setTargetUrl] = useState('');
    const [gaId, setGaId] = useState('');
    const [vpm, setVpm] = useState(10);
    const [durationMins, setDurationMins] = useState(5);
    const [isScanningGA, setIsScanningGA] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    // Engine State
    const [engineLogs, setEngineLogs] = useState<any[]>([]);
    const [engineStats, setEngineStats] = useState<any>({});
    const [isEngineRunning, setIsEngineRunning] = useState(false);
    const [lastProjectId, setLastProjectId] = useState<string | null>(null);

    // Polling for logs and stats
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await db.getSimulatorStatus();
                setEngineLogs(data.logs || []);
                setEngineStats(data.stats || {});
                setIsEngineRunning(data.is_running);
            } catch (e) {
                console.error("Failed to poll simulator status", e);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleScanGA = async () => {
        if (!targetUrl) {
            alert('Please enter a Target URL first');
            return;
        }
        setIsScanningGA(true);
        setStatus(null);
        try {
            const result = await db.findTid(targetUrl);
            if (result && result.tid) {
                setGaId(result.tid);
                setStatus({ type: 'success', message: `Found Tracking ID: ${result.tid}` });
            } else {
                alert('No GA ID found on page.');
            }
        } catch (e: any) {
            alert(e.message || 'Scan failed');
        } finally {
            setIsScanningGA(false);
        }
    };

    const handleStartTest = async () => {
        if (!targetUrl) {
            setStatus({ type: 'error', message: 'Target URL is required' });
            return;
        }

        setIsStarting(true);
        setStatus(null);

        try {
            const payload = {
                targets: [
                    { 
                        url: targetUrl, 
                        title: 'Simulator Test', 
                        tid: gaId 
                    }
                ],
                visitors_per_min: vpm,
                duration_mins: durationMins,
                mode: 'direct_hit',
                traffic_source_preset: 'direct'
            };

            const result = await db.startSimulator(payload);
            setLastProjectId(result.project_id);
            setStatus({ type: 'success', message: 'Simulator command sent! Check the log below for activity.' });
        } catch (e: any) {
            setStatus({ type: 'error', message: e.message || 'Failed to start simulator' });
        } finally {
            setIsStarting(false);
        }
    };

    const currentProjectStats = lastProjectId ? engineStats[lastProjectId] : null;

    return (
        <div className="animate-in fade-in space-y-6">
            <div className="flex items-end justify-between mb-8">
                <div className="flex items-end gap-3">
                    <div className="bg-black p-3 rounded-sm text-white shadow-lg shadow-black/20">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Testing Tool</div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Hit Simulator Test</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Engine Status</div>
                        <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${isEngineRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                             <span className="text-xs font-black uppercase tracking-tight">{isEngineRunning ? 'Operational' : 'Stopped'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Card */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                            <Terminal size={14} /> Test Configuration
                        </h3>

                        <div className="space-y-6">
                            {/* Target URL */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Target URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-medium font-mono text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            {/* GA ID */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Google Analytics Tracking ID (Optional)</label>
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={gaId}
                                        onChange={(e) => setGaId(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 pr-24 text-sm font-mono text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
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

                            <div className="grid grid-cols-2 gap-4">
                                {/* VPM */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Visitors Per Minute</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            value={vpm}
                                            onChange={(e) => setVpm(parseInt(e.target.value))}
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Duration (Minutes)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            value={durationMins}
                                            onChange={(e) => setDurationMins(parseInt(e.target.value))}
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 pl-10 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleStartTest}
                                disabled={isStarting}
                                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/10"
                            >
                                {isStarting ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" /> Starting...
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} /> Launch Simulation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 border-l-4 ${status.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'} animate-in slide-in-from-top-2`}>
                            <div className="flex items-center gap-2">
                                {status.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                                <p className="text-xs font-bold uppercase tracking-tight">{status.message}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Log & Live Stats */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Live Counter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#111] text-white p-6 border-b-2 border-[#ff4d00]">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Successful Hits</div>
                            <div className="text-3xl font-black text-[#ff4d00] font-mono">
                                {currentProjectStats?.success || 0}
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-gray-200">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Failed Hits</div>
                            <div className="text-3xl font-black text-gray-900 font-mono">
                                {currentProjectStats?.failure || 0}
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-gray-200">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current VPM Rate</div>
                            <div className="text-3xl font-black text-gray-900 font-mono">
                                {isEngineRunning ? vpm : 0}
                            </div>
                        </div>
                    </div>

                    {/* Live Engine Log */}
                    <div className="bg-white border border-gray-200 shadow-sm flex flex-col h-[500px]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Database size={14} /> Real-time Engine Log
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">Auto-refreshing every 3s</span>
                                <RefreshCw size={10} className="text-gray-400 animate-spin-slow" />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] bg-[#1a1a1a] text-gray-300 custom-scrollbar">
                            {engineLogs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 italic">
                                    Waiting for engine activity...
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {engineLogs.map((log, i) => (
                                        <div key={i} className="flex gap-3 border-b border-white/5 pb-1 last:border-0">
                                            <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
                                            <span className={
                                                log.level === 'success' ? 'text-green-400' : 
                                                log.level === 'error' ? 'text-red-400' : 
                                                'text-blue-300'
                                            }>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSimulatorTest;
