import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Users, Globe, AlertCircle, TrendingUp,
  Clock, Server, Zap, RefreshCw, AlertTriangle,
  CheckCircle, PauseCircle, PlayCircle, BarChart3,
  Monitor, Smartphone, Tablet
} from 'lucide-react';
import { db } from '../services/db';
import { Project, ProjectStats } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

interface TrafficMonitorProps {
  projects: Project[];
}

interface RealTimeStats {
  activeVisitors: number;
  totalVisitorsToday: number;
  activeCampaigns: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: Date;
  campaignId?: string;
}

interface CampaignStatus {
  projectId: string;
  projectName: string;
  status: 'active' | 'paused' | 'error';
  visitorsLastHour: number;
  visitorsToday: number;
  completionRate: number;
  lastError?: string;
}

const COLORS = ['#ff4d00', '#111111', '#888888', '#e0e0e0'];

const TrafficMonitor: React.FC<TrafficMonitorProps> = ({ projects }) => {
  const [stats, setStats] = useState<RealTimeStats>({
    activeVisitors: 0,
    totalVisitorsToday: 0,
    activeCampaigns: 0,
    avgSessionDuration: 0,
    bounceRate: 0
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [campaignStatuses, setCampaignStatuses] = useState<CampaignStatus[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<any[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([]);
  const [geoDistribution, setGeoDistribution] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Real-time Data
  const fetchRealTimeData = useCallback(async () => {
    try {
      const data = await db.getRealTimeAnalytics(selectedTimeRange);

      setStats({
        activeVisitors: data.stats.activeVisitors,
        totalVisitorsToday: data.stats.totalVisitorsToday,
        activeCampaigns: data.stats.activeCampaigns,
        avgSessionDuration: data.stats.avgSessionDuration,
        bounceRate: data.stats.bounceRate
      });

      setTrafficHistory(data.history);
      setDeviceBreakdown(data.devices);
      setGeoDistribution(data.geo);
      setCampaignStatuses(data.campaigns);

      // Simple alert logic for empty/stalled campaigns (optional)
      const newAlerts: Alert[] = [];
      data.campaigns.forEach((c: any) => {
        if (c.status === 'active' && c.visitorsLastHour === 0 && c.completionRate < 100) {
          newAlerts.push({
            id: `stalled-${c.projectId}`,
            type: 'warning',
            message: `Campaign "${c.projectName}" has no hits in the last hour.`,
            timestamp: new Date(),
            campaignId: c.projectId
          });
        }
      });
      if (newAlerts.length > 0) setAlerts(newAlerts.slice(0, 5));

    } catch (error) {
      console.error("Failed to fetch traffic monitor data", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    fetchRealTimeData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchRealTimeData, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchRealTimeData, autoRefresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRealTimeData();
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return <AlertCircle className="text-red-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={18} />;
      case 'success': return <CheckCircle className="text-green-500" size={18} />;
      default: return <Activity className="text-blue-500" size={18} />;
    }
  };

  const getAlertBg = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: CampaignStatus['status']) => {
    switch (status) {
      case 'active': return <PlayCircle className="text-green-500" size={16} />;
      case 'paused': return <PauseCircle className="text-orange-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">
            Live Monitoring
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Traffic Monitor
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${autoRefresh
              ? 'bg-[#ff4d00] text-white border-[#ff4d00]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#ff4d00]'
              }`}
          >
            <Zap size={14} className={autoRefresh ? 'animate-pulse' : ''} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-4 border rounded-sm ${getAlertBg(alert.type)}`}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-[#ff4d00]" />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Active Visitors
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {stats.activeVisitors.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-green-500 flex items-center gap-1">
            <TrendingUp size={12} /> Live
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={48} className="text-[#ff4d00]" />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Visitors Today
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {stats.totalVisitorsToday.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-gray-500">Total count</div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server size={48} className="text-[#ff4d00]" />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Active Campaigns
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {stats.activeCampaigns}
          </div>
          <div className="text-xs font-bold text-gray-500">
            of {projects.length} total
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={48} className="text-[#ff4d00]" />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Avg Session
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {Math.floor(stats.avgSessionDuration / 60)}m {stats.avgSessionDuration % 60}s
          </div>
          <div className="text-xs font-bold text-gray-500">Per visitor</div>
        </div>

        <div className="bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#ff4d00] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={48} className="text-[#ff4d00]" />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Bounce Rate
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {stats.bounceRate}%
          </div>
          <div className="text-xs font-bold text-gray-500">Average</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#ff4d00]" />
              Traffic Overview
            </h3>
            <div className="flex gap-2">
              {(['1h', '24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedTimeRange === range
                    ? 'bg-[#ff4d00] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff4d00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#ff4d00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  stroke="#111111"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ff4d00] rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Visitors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#111111] rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Page Views</span>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white border border-gray-200 shadow-sm p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-6">
            <Monitor size={14} className="text-[#ff4d00]" />
            Device Breakdown
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {deviceBreakdown.map((device, index) => (
              <div key={device.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {device.name === 'Desktop' && <Monitor size={14} className="text-gray-400" />}
                  {device.name === 'Mobile' && <Smartphone size={14} className="text-gray-400" />}
                  {device.name === 'Tablet' && <Tablet size={14} className="text-gray-400" />}
                  <span className="text-xs font-medium text-gray-600">{device.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  ></div>
                  <span className="text-xs font-bold text-gray-900">{device.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Campaigns Monitor */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
            <Server size={14} className="text-[#ff4d00]" />
            Active Campaign Monitor
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb] border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Campaign
                </th>
                <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Last Hour
                </th>
                <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Today
                </th>
                <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaignStatuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-gray-400">
                    No active campaigns to monitor
                  </td>
                </tr>
              ) : (
                campaignStatuses.map(campaign => (
                  <tr key={campaign.projectId} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(campaign.status)}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                          campaign.status === 'paused' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-900">{campaign.projectName}</div>
                      <div className="text-[9px] text-gray-400 font-mono">{campaign.projectId}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-xs font-bold text-gray-900">
                        {campaign.visitorsLastHour.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-xs font-bold text-gray-900">
                        {campaign.visitorsToday.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${campaign.completionRate >= 90 ? 'bg-green-500' :
                              campaign.completionRate >= 50 ? 'bg-[#ff4d00]' :
                                'bg-gray-400'
                              }`}
                            style={{ width: `${campaign.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 w-8 text-right">
                          {campaign.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white border border-gray-200 shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-6">
          <Globe size={14} className="text-[#ff4d00]" />
          Geographic Distribution (Top 5)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {geoDistribution.length === 0 ? (
            <div className="col-span-5 p-4 text-center text-xs text-gray-400">
              No geographic data collected yet.
            </div>
          ) : (
            geoDistribution.map((geo, index) => (
              <div key={geo.country} className="bg-[#f9fafb] p-4 border border-gray-100">
                <div className="text-2xl mb-2">{geo.flag}</div>
                <div className="text-xs font-bold text-gray-900 truncate">{geo.country}</div>
                <div className="text-[10px] font-medium text-gray-500 mt-1">
                  {geo.visitors.toLocaleString()} visitors
                </div>
                <div className="mt-2 bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#ff4d00] h-full rounded-full"
                    style={{ width: `${Math.min(100, (geo.visitors / (geoDistribution[0]?.visitors || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )))}
        </div>
      </div>
    </div>
  );
};

export default TrafficMonitor;
