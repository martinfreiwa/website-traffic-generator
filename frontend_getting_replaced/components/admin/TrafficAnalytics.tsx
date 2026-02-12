
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Users, RefreshCw, Layers } from 'lucide-react';
import { fetchWithAuth } from '../../services/db';

const TrafficAnalytics: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'30m' | '24h' | '7d' | '30d'>('24h');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const ranges = [
        { label: '30 Min', id: '30m', refresh: 30000 },
        { label: '24 Hours', id: '24h', refresh: 300000 },
        { label: '7 Days', id: '7d', refresh: 300000 },
        { label: '30 Days', id: '30d', refresh: 300000 },
    ];

    const currentRange = ranges.find(r => r.id === timeRange);

    const fetchData = async () => {
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin;
            const response = await fetchWithAuth(`${baseUrl}/admin/traffic-stats?range=${timeRange}`);
            if (response.ok) {
                const stats = await response.json();
                setData(stats);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch traffic stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, currentRange?.refresh || 300000);

        return () => clearInterval(interval);
    }, [timeRange]);

    const formatXAxis = (tick: string) => {
        if (!tick) return '';
        const d = new Date(tick);
        if (timeRange === '30m') return d.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        if (timeRange === '24h') return d.getHours() + ':00';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);
    const peakVisitors = Math.max(...data.map(d => d.visitors), 0);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-end gap-3">
                    <div className="bg-[#ff4d00] p-2 rounded-sm text-white shadow-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Global Network</div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Traffic Analytics</h2>
                    </div>
                </div>

                <div className="flex bg-white border border-gray-200 p-1 rounded-sm shadow-sm">
                    {ranges.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setTimeRange(r.id as any)}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-sm ${timeRange === r.id ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users size={12} className="text-[#ff4d00]" /> Combined Sessions
                    </div>
                    <div className="text-3xl font-black text-gray-900">{totalVisitors.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400 font-bold mt-1">Total across all active nodes</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity size={12} className="text-[#ff4d00]" /> Peak Throughput
                    </div>
                    <div className="text-3xl font-black text-gray-900">{peakVisitors.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400 font-bold mt-1">Maximum visitors per bucket</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Clock size={12} className="text-[#ff4d00]" /> Telemetry Health
                    </div>
                    <div className="text-3xl font-black text-green-600">LIVE</div>
                    <div className="text-[9px] text-gray-400 font-bold mt-1">Sync: {lastUpdated.toLocaleTimeString()}</div>
                </div>
            </div>

            {/* Main Chart Card */}
            <div className="bg-white border border-gray-200 p-8 shadow-sm relative overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <RefreshCw size={24} className="animate-spin text-[#ff4d00]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00]">Syncing...</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#ff4d00] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,77,0,0.5)]"></div>
                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Active Traffic Stream</span>
                        </div>
                        <div className="h-4 w-[1px] bg-gray-200"></div>
                        <span className="text-[10px] font-medium text-gray-400 font-mono">Telemetry: AGGREGATED_GLOBAL_HITS</span>
                    </div>

                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Force Refresh"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#ff4d00" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }}
                                axisLine={{ stroke: '#e5e7eb' }}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val.toLocaleString()}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#111',
                                    border: 'none',
                                    borderRadius: '2px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                labelStyle={{ color: '#ff4d00', fontSize: '9px', fontWeight: 700, marginBottom: '4px' }}
                                formatter={(value: number) => [value.toLocaleString(), 'Combined Visitors']}
                                labelFormatter={(label) => new Date(label).toLocaleString()}
                            />
                            <Area
                                type="monotone"
                                dataKey="visitors"
                                stroke="#ff4d00"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorVisits)"
                                animationDuration={1000}
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="bg-gray-50 border border-gray-200 p-4 flex items-center gap-3">
                <div className="bg-blue-100 p-1.5 rounded-sm text-blue-600">
                    <Clock size={14} />
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    The {timeRange === '30m' ? '30-minute' : 'historical'} stream is currently refreshing every {ranges.find(r => r.id === timeRange)?.refresh! / 1000} seconds.
                    Targeting: {timeRange === '30m' ? 'Near-Realtime' : 'Global Aggregation'}.
                </p>
            </div>
        </div>
    );
};

export default TrafficAnalytics;
