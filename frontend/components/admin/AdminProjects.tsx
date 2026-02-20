import React, { useState, useMemo, useRef } from 'react';
import { Project } from '../../types';
import {
    Edit2, Search, Globe, PauseCircle, PlayCircle, AlertTriangle, Mail,
    Calendar, Download, Settings, ChevronDown, Flag, Clock, Zap,
    CheckSquare, Square, Trash2, MoreVertical, Copy, ExternalLink,
    RefreshCw, X, Filter, ChevronUp
} from 'lucide-react';

interface AdminProjectsProps {
    projects: Project[];
    onEditProject: (id: string) => void;
    onEditUser?: (userId: string) => void;
    onBulkUpdate?: (projectIds: string[], updates: Partial<Project>) => void;
}

type TabType = 'all' | 'active' | 'stopped' | 'completed' | 'flagged' | 'expiring' | 'priority';

interface ColumnConfig {
    key: string;
    label: string;
    visible: boolean;
    required?: boolean;
}

const AdminProjects: React.FC<AdminProjectsProps> = ({ projects, onEditProject, onEditUser, onBulkUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        dateFrom: '',
        dateTo: '',
        tier: '',
        minHits: '',
        maxHits: '',
        minBalance: '',
        maxBalance: '',
    });
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: 'campaign', label: 'Campaign', visible: true, required: true },
        { key: 'email', label: 'User Email', visible: true },
        { key: 'created', label: 'Created', visible: true },
        { key: 'hits', label: 'Total Hits', visible: true },
        { key: 'today', label: 'Today', visible: true },
        { key: 'balance', label: 'User Balance', visible: true },
        { key: 'tier', label: 'Tier', visible: true },
        { key: 'expires', label: 'Expires', visible: true },
        { key: 'status', label: 'Status', visible: true, required: true },
        { key: 'actions', label: 'Actions', visible: true, required: true },
    ]);
    const tableRef = useRef<HTMLDivElement>(null);

    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatNumber = (num?: number) => {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString();
    };

    const getDaysUntilExpiry = (expiresAt?: string, expires?: string) => {
        const dateStr = expiresAt || expires;
        if (!dateStr) return null;
        const expiry = new Date(dateStr);
        const now = new Date();
        const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const isExpiringSoon = (project: Project) => {
        const days = getDaysUntilExpiry(project.expiresAt, project.expires);
        return days !== null && days >= 0 && days <= 7;
    };

    const getProgressPercent = (project: Project) => {
        if (!project.totalTarget || project.totalTarget === 0) return 0;
        return Math.min(100, Math.round(((project.totalHits || 0) / project.totalTarget) * 100));
    };

    const getTierBalanceLabel = (tier?: string) => {
        const t = (tier || '').toLowerCase();
        if (t === 'economy') return 'Economy';
        if (t === 'professional') return 'Professional';
        if (t === 'expert') return 'Expert';
        return 'Standard';
    };

    const getTierBadgeClass = (tier?: string) => {
        const t = (tier || '').toLowerCase();
        if (t === 'economy') return 'bg-green-100 text-green-700';
        if (t === 'professional') return 'bg-blue-100 text-blue-700';
        if (t === 'expert') return 'bg-purple-100 text-purple-700';
        return 'bg-gray-100 text-gray-600';
    };

    const tabs: { key: TabType; label: string; count: number; icon?: React.ReactNode }[] = [
        { key: 'all', label: 'All', count: projects.length },
        { key: 'active', label: 'Active', count: projects.filter(p => p.status === 'active').length, icon: <PlayCircle size={14} /> },
        { key: 'stopped', label: 'Stopped', count: projects.filter(p => p.status === 'stopped').length, icon: <PauseCircle size={14} /> },
        { key: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
        { key: 'flagged', label: 'Flagged', count: projects.filter(p => p.isFlagged).length, icon: <Flag size={14} /> },
        { key: 'expiring', label: 'Expiring Soon', count: projects.filter(isExpiringSoon).length, icon: <Clock size={14} /> },
        { key: 'priority', label: 'High Priority', count: projects.filter(p => (p.priority || 0) >= 5).length, icon: <Zap size={14} /> },
    ];

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.userEmail && p.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.settings?.entryUrls && p.settings.entryUrls.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.tier && p.tier.toLowerCase().includes(searchTerm.toLowerCase()));

            let matchesTab = true;
            switch (activeTab) {
                case 'active':
                    matchesTab = p.status === 'active';
                    break;
                case 'stopped':
                    matchesTab = p.status === 'stopped';
                    break;
                case 'completed':
                    matchesTab = p.status === 'completed';
                    break;
                case 'flagged':
                    matchesTab = !!p.isFlagged;
                    break;
                case 'expiring':
                    matchesTab = isExpiringSoon(p);
                    break;
                case 'priority':
                    matchesTab = (p.priority || 0) >= 5;
                    break;
            }

            let matchesAdvanced = true;
            if (advancedFilters.dateFrom) {
                const created = p.createdAt ? new Date(p.createdAt) : null;
                if (created && created < new Date(advancedFilters.dateFrom)) matchesAdvanced = false;
            }
            if (advancedFilters.dateTo) {
                const created = p.createdAt ? new Date(p.createdAt) : null;
                if (created && created > new Date(advancedFilters.dateTo)) matchesAdvanced = false;
            }
            if (advancedFilters.tier && p.tier?.toLowerCase() !== advancedFilters.tier.toLowerCase()) {
                matchesAdvanced = false;
            }
            if (advancedFilters.minHits) {
                if ((p.totalHits || 0) < parseInt(advancedFilters.minHits)) matchesAdvanced = false;
            }
            if (advancedFilters.maxHits) {
                if ((p.totalHits || 0) > parseInt(advancedFilters.maxHits)) matchesAdvanced = false;
            }
            if (advancedFilters.minBalance) {
                if ((p.userBalance || 0) < parseFloat(advancedFilters.minBalance)) matchesAdvanced = false;
            }
            if (advancedFilters.maxBalance) {
                if ((p.userBalance || 0) > parseFloat(advancedFilters.maxBalance)) matchesAdvanced = false;
            }

            return matchesSearch && matchesTab && matchesAdvanced;
        });
    }, [projects, searchTerm, activeTab, advancedFilters]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProjects.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProjects.map(p => p.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBulkAction = (action: 'pause' | 'activate' | 'delete' | 'priority') => {
        if (selectedIds.size === 0) return;
        const updates: Partial<Project> = {};
        switch (action) {
            case 'pause':
                updates.status = 'stopped';
                break;
            case 'activate':
                updates.status = 'active';
                break;
            case 'delete':
                break;
            case 'priority':
                updates.priority = 5;
                break;
        }
        if (onBulkUpdate) {
            onBulkUpdate(Array.from(selectedIds), updates);
        }
        setSelectedIds(new Set());
    };

    const exportCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Domain', 'Status', 'Tier', 'Total Hits', 'Today', 'Balance', 'Created', 'Expires'];
        const rows = filteredProjects.map(p => [
            p.id,
            p.name,
            p.userEmail || '',
            p.settings?.entryUrls ? getDomain(p.settings.entryUrls) : '',
            p.status,
            p.tier || '',
            p.totalHits || 0,
            p.hitsToday || 0,
            p.userBalance || 0,
            p.createdAt || '',
            p.expiresAt || p.expires || '',
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const toggleColumn = (key: string) => {
        setColumns(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };

    const clearAdvancedFilters = () => {
        setAdvancedFilters({
            dateFrom: '',
            dateTo: '',
            tier: '',
            minHits: '',
            maxHits: '',
            minBalance: '',
            maxBalance: '',
        });
    };

    const hasActiveFilters = Object.values(advancedFilters).some(v => v !== '');

    const visibleColumns = columns.filter(c => c.visible);

    return (
        <div className="animate-in fade-in space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tight">Mission Control</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            <Settings size={14} /> Columns
                            {showColumnSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showColumnSettings && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 p-3 min-w-[180px]">
                                {columns.map(col => (
                                    <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1">
                                        <input
                                            type="checkbox"
                                            checked={col.visible}
                                            disabled={col.required}
                                            onChange={() => toggleColumn(col.key)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-xs font-medium">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-[#ff4d00] text-[#ff4d00] bg-[#ff4d00]/5'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        <span className={`px-1.5 py-0.5 text-[10px] rounded ${activeTab === tab.key ? 'bg-[#ff4d00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#ff4d00]" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Email, Domain, Name, ID, Tier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 text-sm font-bold w-full sm:w-72 outline-none focus:border-[#ff4d00] transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2 border text-sm font-bold transition-colors ${
                            hasActiveFilters
                                ? 'border-[#ff4d00] text-[#ff4d00] bg-[#ff4d00]/5'
                                : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <Filter size={14} /> Advanced
                        {hasActiveFilters && <span className="w-2 h-2 bg-[#ff4d00] rounded-full" />}
                    </button>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#ff4d00]/5 border border-[#ff4d00]/20">
                        <span className="text-xs font-bold text-[#ff4d00]">{selectedIds.size} selected</span>
                        <button
                            onClick={() => handleBulkAction('activate')}
                            className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 hover:bg-green-200"
                        >
                            Activate
                        </button>
                        <button
                            onClick={() => handleBulkAction('pause')}
                            className="px-2 py-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        >
                            Pause
                        </button>
                        <button
                            onClick={() => handleBulkAction('priority')}
                            className="px-2 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                            High Priority
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-1 hover:bg-gray-100"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {showAdvancedFilters && (
                <div className="bg-gray-50 border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Created From</label>
                        <input
                            type="date"
                            value={advancedFilters.dateFrom}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateFrom: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Created To</label>
                        <input
                            type="date"
                            value={advancedFilters.dateTo}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateTo: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tier</label>
                        <select
                            value={advancedFilters.tier}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, tier: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 text-xs bg-white"
                        >
                            <option value="">All Tiers</option>
                            <option value="economy">Economy</option>
                            <option value="professional">Professional</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Hits</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={advancedFilters.minHits}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, minHits: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Hits</label>
                        <input
                            type="number"
                            placeholder="999999"
                            value={advancedFilters.maxHits}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, maxHits: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Balance</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={advancedFilters.minBalance}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, minBalance: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-200 text-xs"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={clearAdvancedFilters}
                            className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-white"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden" ref={tableRef}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-[#f9fafb] border-b border-gray-200">
                            <tr>
                                <th className="w-10 px-3 py-3">
                                    <button onClick={toggleSelectAll} className="p-0.5">
                                        {selectedIds.size === filteredProjects.length && filteredProjects.length > 0 ? (
                                            <CheckSquare size={16} className="text-[#ff4d00]" />
                                        ) : (
                                            <Square size={16} className="text-gray-400" />
                                        )}
                                    </button>
                                </th>
                                {visibleColumns.map(col => (
                                    <th key={col.key} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        No campaigns found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(p => {
                                    const daysUntilExpiry = getDaysUntilExpiry(p.expiresAt, p.expires);
                                    const progressPercent = getProgressPercent(p);
                                    
                                    return (
                                        <tr key={p.id} className={`hover:bg-gray-50 group transition-colors ${selectedIds.has(p.id) ? 'bg-[#ff4d00]/5' : ''}`}>
                                            <td className="w-10 px-3 py-3">
                                                <button onClick={() => toggleSelect(p.id)} className="p-0.5">
                                                    {selectedIds.has(p.id) ? (
                                                        <CheckSquare size={16} className="text-[#ff4d00]" />
                                                    ) : (
                                                        <Square size={16} className="text-gray-300" />
                                                    )}
                                                </button>
                                            </td>
                                            {columns.find(c => c.key === 'campaign')?.visible && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-start gap-2">
                                                        <div className="mt-0.5 p-1.5 bg-gray-100 rounded text-gray-500">
                                                            <Globe size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm font-bold text-gray-900 group-hover:text-[#ff4d00] transition-colors truncate">
                                                                    {p.name}
                                                                </span>
                                                                {p.isFlagged && <Flag size={12} className="text-red-500 fill-current" />}
                                                                {(p.priority || 0) >= 5 && <Zap size={12} className="text-yellow-500 fill-current" />}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono mt-0.5 max-w-[200px] truncate" title={p.settings?.entryUrls}>
                                                                {p.settings?.entryUrls ? getDomain(p.settings.entryUrls) : 'No URL'}
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <span className="text-[10px] text-gray-400 font-mono cursor-pointer hover:text-gray-600" onClick={() => copyToClipboard(p.id)} title="Click to copy">
                                                                    ID: {p.id.substring(0, 8)}...
                                                                </span>
                                                                <button onClick={() => copyToClipboard(p.id)} className="p-0.5 hover:bg-gray-100 rounded">
                                                                    <Copy size={10} className="text-gray-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'email')?.visible && (
                                                <td className="px-4 py-3">
                                                    {p.userEmail ? (
                                                        <button
                                                            onClick={() => onEditUser && onEditUser(p.userId)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-[#ff4d00] transition-colors"
                                                            title="Click to view user"
                                                        >
                                                            <Mail size={12} className="text-gray-400" />
                                                            <span className="truncate max-w-[150px]">{p.userEmail}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'created')?.visible && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        <span title={formatDateTime(p.createdAt)}>{formatDate(p.createdAt)}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'hits')?.visible && (
                                                <td className="px-4 py-3">
                                                    <div className="min-w-[100px]">
                                                        <div className="text-xs font-bold text-gray-700">
                                                            {formatNumber(p.totalHits)} / {formatNumber(p.totalTarget)}
                                                        </div>
                                                        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${progressPercent >= 100 ? 'bg-green-500' : progressPercent >= 75 ? 'bg-blue-500' : 'bg-[#ff4d00]'}`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">{progressPercent}%</div>
                                                    </div>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'today')?.visible && (
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-gray-700">{formatNumber(p.hitsToday)}</span>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'balance')?.visible && (
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        ${(p.userBalance || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'tier')?.visible && (
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${getTierBadgeClass(p.tier)}`}>
                                                        {getTierBalanceLabel(p.tier)}
                                                    </span>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'expires')?.visible && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className={`${daysUntilExpiry !== null && daysUntilExpiry <= 7 ? 'text-yellow-500' : 'text-gray-400'}`} />
                                                        <span className={`text-xs ${daysUntilExpiry !== null && daysUntilExpiry <= 7 ? 'text-yellow-700 font-bold' : 'text-gray-600'}`}>
                                                            {formatDate(p.expiresAt || p.expires)}
                                                        </span>
                                                        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">
                                                                {daysUntilExpiry}d
                                                            </span>
                                                        )}
                                                        {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                                                            <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">
                                                                Expired
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'status')?.visible && (
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                                                        p.status === 'active' ? 'bg-[#ff4d00]/10 text-[#ff4d00] ring-1 ring-[#ff4d00]/20' :
                                                        p.status === 'completed' ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                                                    }`}>
                                                        {p.status === 'active' ? <PlayCircle size={10} className="fill-current" /> :
                                                            p.status === 'stopped' ? <PauseCircle size={10} /> : null}
                                                        {p.status}
                                                    </span>
                                                </td>
                                            )}
                                            {columns.find(c => c.key === 'actions')?.visible && (
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => onEditProject(p.id)}
                                                        className="bg-white border border-gray-200 hover:border-black hover:bg-black hover:text-white text-gray-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm inline-flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <Edit2 size={12} /> Manage
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Showing {filteredProjects.length} of {projects.length} projects</span>
                {selectedIds.size > 0 && (
                    <span>{selectedIds.size} selected for bulk action</span>
                )}
            </div>
        </div>
    );
};

export default AdminProjects;
