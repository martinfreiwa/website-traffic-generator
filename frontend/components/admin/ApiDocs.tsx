
import React, { useState } from 'react';
import { FileCode, Terminal, Play, CheckCircle, AlertCircle, Trash2, Copy, Send, Database, Zap, Key, Activity, Clock, Server } from 'lucide-react';

const ApiDocs: React.FC = () => {
    const [testEndpoint, setTestEndpoint] = useState('GET /stats');
    const [testPayload, setTestPayload] = useState('{}');
    const [logs, setLogs] = useState<{ id: string, type: 'req' | 'res' | 'err', msg: string, time: string, duration?: number }[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const endpoints = [
        { method: 'GET', path: '/health', desc: 'Check system health and mode' },
        { method: 'GET', path: '/stats', desc: 'Global traffic throughput statistics' },
        { method: 'GET', path: '/events', desc: 'Recent 50 page-view events with metadata' },
        { method: 'GET', path: '/projects', desc: 'List all running and saved projects' },
        { method: 'POST', path: '/projects', desc: 'Create a new traffic project' },
        { method: 'DELETE', path: '/projects/{id}', desc: 'Remove a project and stop traffic' },
        { method: 'POST', path: '/start', desc: 'Immediate ad-hoc traffic burst' },
        { method: 'POST', path: '/stop', desc: 'Halt all active user simulations' },
        { method: 'GET', path: '/proxies', desc: 'List active proxy rotation pool' },
        { method: 'POST', path: '/proxies', desc: 'Add a new proxy to the pool' },
        { method: 'GET', path: '/admin/stats', desc: 'SaaS Business Metrics (Revenue, Users)' },
    ];

    const addLog = (type: 'req' | 'res' | 'err', msg: string, duration?: number) => {
        const newLog = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            msg,
            time: new Date().toLocaleTimeString(),
            duration
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
    };

    const handleRunTest = async () => {
        setIsTesting(true);
        const [method, path] = testEndpoint.split(' ');
        const baseUrl = 'http://localhost:8001';

        const startTime = performance.now();
        addLog('req', `${method} ${path}\nPayload: ${testPayload}`);

        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ADMIN_MOCK_TOKEN'
                }
            };

            if (method !== 'GET' && testPayload !== '{}') {
                options.body = testPayload;
            }

            const response = await fetch(`${baseUrl}${path}`, options);
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { error: 'Failed to parse JSON response' };
            }

            if (response.ok) {
                addLog('res', JSON.stringify(data, null, 2), duration);
            } else {
                addLog('err', `Error ${response.status}: ${JSON.stringify(data, null, 2)}`, duration);
            }
        } catch (error: any) {
            const endTime = performance.now();
            addLog('err', `Network Failure: ${error.message}`, Math.round(endTime - startTime));
        } finally {
            setIsTesting(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const clearLogs = () => setLogs([]);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-end gap-3">
                    <div className="bg-black p-2 rounded-sm text-white shadow-lg">
                        <FileCode size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Developer Hub</div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">API Documentation & Debugger</h2>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white border border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm rounded-sm">
                        <Server size={14} className="text-green-500" />
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Backend Status: <span className="text-green-600">ONLINE</span></div>
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm rounded-sm">
                        <Clock size={14} className="text-blue-500" />
                        <div className="text-[10px] font-bold text-gray-400 uppercase">API Version: <span className="text-blue-600">v1.2.0</span></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">

                {/* Left Column: Documentation */}
                <div className="bg-white border border-gray-200 flex flex-col overflow-hidden shadow-sm rounded-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                            <Database size={14} /> Endpoints Reference
                        </h3>
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">FastAPI Engine</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="space-y-6">
                            {endpoints.map((ep, i) => (
                                <div key={i} className="group border-b border-gray-100 pb-6 last:border-0 hover:bg-gray-50/50 p-2 -m-2 transition-colors rounded-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm ${ep.method === 'GET' ? 'bg-blue-600 text-white' :
                                            ep.method === 'POST' ? 'bg-green-600 text-white' :
                                                ep.method === 'DELETE' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                                            }`}>
                                            {ep.method}
                                        </span>
                                        <code className="text-xs font-bold text-gray-900">{ep.path}</code>
                                        <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleCopy(ep.path, `path-${i}`)}
                                                className="p-1 px-2 bg-gray-100 hover:bg-black hover:text-white text-[9px] font-bold uppercase rounded-sm border border-gray-200 transition-all"
                                            >
                                                {copiedId === `path-${i}` ? 'Copied' : 'Copy'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setTestEndpoint(`${ep.method} ${ep.path}`);
                                                    if (ep.method === 'POST') setTestPayload('{\n  "demo": true\n}');
                                                }}
                                                className="p-1 px-2 bg-[#ff4d00]/10 hover:bg-[#ff4d00] text-[#ff4d00] hover:text-white text-[9px] font-bold uppercase rounded-sm border border-[#ff4d00]/20 transition-all"
                                            >
                                                Test
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-[11px] leading-relaxed">{ep.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-sm">
                            <h4 className="text-xs font-bold text-orange-800 uppercase mb-3 flex items-center gap-2">
                                <Key size={14} /> Security Headers
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white p-2 border border-orange-100 rounded-sm overflow-hidden">
                                    <code className="text-[10px] text-gray-600">Authorization: Bearer [token]</code>
                                    <button onClick={() => handleCopy('Authorization: Bearer YOUR_TOKEN', 'auth-header')} className="text-[9px] font-bold text-orange-600 hover:underline">Copy</button>
                                </div>
                                <div className="flex items-center justify-between bg-white p-2 border border-orange-100 rounded-sm overflow-hidden">
                                    <code className="text-[10px] text-gray-600">X-API-KEY: [your-key]</code>
                                    <button onClick={() => handleCopy('X-API-KEY: YOUR_KEY', 'x-key')} className="text-[9px] font-bold text-orange-600 hover:underline">Copy</button>
                                </div>
                                <p className="text-[10px] text-orange-700/70 italic mt-2">
                                    Admin requests bypass standard rate limits for maintenance purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interactive Tester & Logs */}
                <div className="flex flex-col gap-6 overflow-hidden">

                    {/* Tester Box */}
                    <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Zap size={14} className="text-[#ff4d00]" /> API Scratchpad
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => setTestPayload('{\n  "demo": true\n}')} className="text-[9px] font-bold text-gray-400 hover:text-black uppercase">Sample</button>
                                <button onClick={() => setTestPayload('{}')} className="text-[9px] font-bold text-gray-400 hover:text-black uppercase">Reset</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1 relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#ff4d00] transition-colors">
                                        <Activity size={14} />
                                    </div>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 text-xs font-mono outline-none focus:border-[#ff4d00] focus:bg-white transition-all rounded-sm"
                                        value={testEndpoint}
                                        onChange={(e) => setTestEndpoint(e.target.value)}
                                        placeholder="METHOD /path (e.g. GET /health)"
                                    />
                                </div>
                                <button
                                    onClick={handleRunTest}
                                    disabled={isTesting}
                                    className="bg-black text-white px-8 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:shadow-[#ff4d00]/30 transition-all disabled:opacity-50 flex items-center gap-2 rounded-sm"
                                >
                                    {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                    Execute
                                </button>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Request Body (JSON)</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full bg-[#111] text-green-400 font-mono text-xs p-6 h-40 outline-none border border-gray-800 rounded-sm shadow-inner"
                                        value={testPayload}
                                        onChange={(e) => setTestPayload(e.target.value)}
                                        spellCheck={false}
                                    />
                                    <div className="absolute right-4 bottom-4 text-[9px] font-bold text-gray-600 bg-[#1a1a1a] px-2 py-1 rounded-sm border border-gray-800">
                                        UTF-8
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logs Box */}
                    <div className="flex-1 bg-[#0a0a0a] border border-gray-800 flex flex-col overflow-hidden shadow-2xl rounded-sm">
                        <div className="p-3 px-6 border-b border-gray-800 bg-[#111] flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] flex items-center gap-2">
                                <Terminal size={12} /> Live Trace Diagnostic
                            </h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleCopy(logs.map(l => `[${l.time}] ${l.type.toUpperCase()}: ${l.msg}`).join('\n'), 'copy-logs')}
                                    className="text-[10px] font-bold text-gray-500 hover:text-white uppercase flex items-center gap-1"
                                >
                                    <Copy size={10} /> {copiedId === 'copy-logs' ? 'Copied' : 'Export'}
                                </button>
                                <button onClick={clearLogs} className="text-[10px] font-bold text-gray-500 hover:text-red-500 uppercase flex items-center gap-1">
                                    <Trash2 size={10} /> Clear
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4 font-mono">
                            {logs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-700 text-[10px] uppercase font-bold tracking-[0.2em] italic opacity-50">
                                    Waiting for telemetry...
                                </div>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className="animate-in slide-in-from-left-2 duration-300 border-l-2 border-gray-800 pl-4 py-1">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs ${log.type === 'req' ? 'bg-blue-500 text-white' :
                                                log.type === 'res' ? 'bg-green-500 text-white' :
                                                    'bg-red-500 text-white'
                                                }`}>
                                                {log.type === 'req' ? 'REQUEST' : log.type === 'res' ? 'SUCCESS' : 'FAILURE'}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-600">{log.time}</span>
                                            {log.duration && (
                                                <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Clock size={8} /> {log.duration}ms
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleCopy(log.msg, `copy-${log.id}`)}
                                                className="ml-auto text-[8px] font-bold text-gray-600 hover:text-white uppercase transition-colors"
                                            >
                                                {copiedId === `copy-${log.id}` ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <div className={`text-[11px] leading-relaxed p-3 rounded-sm ${log.type === 'req' ? 'bg-blue-950/20 text-blue-300/80' :
                                            log.type === 'res' ? 'bg-green-950/20 text-green-300' :
                                                'bg-red-950/20 text-red-300'
                                            }`}>
                                            <pre className="whitespace-pre-wrap break-all">{log.msg}</pre>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Simple Icon component for Save As Input close button
const RefreshCw: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
    </svg>
)

export default ApiDocs;
