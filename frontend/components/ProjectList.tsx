
import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { Settings, Filter, ChevronDown, Plus, ExternalLink, ChevronLeft, ChevronRight, X, Play, Pause, Trash2, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Clock, Zap, Globe } from 'lucide-react';
import { db } from '../services/db';

interface ProjectListProps {
  projects: Project[];
  onUpdate: () => void;
  onNavigateToProject: (projectId: string) => void;
  onAddProject: () => void;
}

type SortField = 'name' | 'startAt' | 'expiresAt' | 'totalHits' | 'status' | 'dailyLimit';
type SortDirection = 'asc' | 'desc';

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '-';
  }
};

const getDaysRemaining = (expiresAt: string | undefined): number | null => {
  if (!expiresAt) return null;
  try {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
};

const getExpiryWarningClass = (expiresAt: string | undefined): string => {
  const days = getDaysRemaining(expiresAt);
  if (days === null) return '';
  if (days < 0) return 'text-red-600 bg-red-50 px-2 py-1 rounded';
  if (days <= 3) return 'text-red-600 bg-red-50 px-2 py-1 rounded';
  if (days <= 7) return 'text-amber-600 bg-amber-50 px-2 py-1 rounded';
  return '';
};

const getTrafficSourceLabel = (project: Project): string => {
  const source = project.settings?.trafficSource;
  if (!source) return 'Direct';
  
  const sourceMap: Record<string, string> = {
    'organic': 'Organic',
    'social': 'Social',
    'referral': 'Referral',
    'direct': 'Direct',
    'custom': 'Custom'
  };
  
  return sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1);
};

const getTrafficSourceColor = (project: Project): string => {
  const source = project.settings?.trafficSource;
  switch (source) {
    case 'organic': return 'bg-green-100 text-green-700';
    case 'social': return 'bg-blue-100 text-blue-700';
    case 'referral': return 'bg-purple-100 text-purple-700';
    case 'direct': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdate, onNavigateToProject, onAddProject }) => {
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterExpiring, setFilterExpiring] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [sortField, setSortField] = useState<SortField>('startAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'bg-gray-900 text-white';
      case 'active': return 'bg-[#ff4d00] text-white';
      case 'stopped': return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="ml-1 text-[#ff4d00]" />
      : <ArrowDown size={12} className="ml-1 text-[#ff4d00]" />;
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(p => {
      const matchesId = p.id.toLowerCase().includes(filterId.toLowerCase());
      const matchesName = p.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesPlan = p.plan.toLowerCase().includes(filterPlan.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

      let matchesExpiring = true;
      if (filterExpiring === '7days') {
        const days = getDaysRemaining(p.expiresAt);
        matchesExpiring = days !== null && days >= 0 && days <= 7;
      } else if (filterExpiring === 'expired') {
        const days = getDaysRemaining(p.expiresAt);
        matchesExpiring = days !== null && days < 0;
      }

      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const projectDate = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
        const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity;
        if (projectDate === 0) matchesDate = false;
        else matchesDate = projectDate >= start && projectDate < end;
      }

      return matchesId && matchesName && matchesPlan && matchesStatus && matchesExpiring && matchesDate;
    });

    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'startAt':
          aVal = a.startAt || a.createdAt ? new Date(a.startAt || a.createdAt || 0).getTime() : 0;
          bVal = b.startAt || b.createdAt ? new Date(b.startAt || b.createdAt || 0).getTime() : 0;
          break;
        case 'expiresAt':
          aVal = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
          bVal = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
          break;
        case 'totalHits':
          aVal = a.totalHits || 0;
          bVal = b.totalHits || 0;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'dailyLimit':
          aVal = a.dailyLimit || 0;
          bVal = b.dailyLimit || 0;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [projects, filterId, filterName, filterPlan, filterStatus, filterExpiring, dateRange, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleQuickStatusToggle = async (project: Project) => {
    const newStatus = project.status === 'active' ? 'stopped' : 'active';
    await db.updateProjectStatus(project.id, newStatus);
    onUpdate();
  };

  const handleBulkAction = async (action: 'pause' | 'resume' | 'delete') => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedIds.length} campaigns?`)) {
        await db.bulkDeleteProjects(selectedIds);
        setSelectedIds([]);
        onUpdate();
      }
    } else {
      const status = action === 'resume' ? 'active' : 'stopped';
      await db.bulkUpdateProjectStatus(selectedIds, status);
      setSelectedIds([]);
      onUpdate();
    }
  };

  const toggleSelectAll = () => {
    const currentPageIds = paginatedProjects.map(p => p.id);
    const allSelected = currentPageIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const clearFilters = () => {
    setFilterId('');
    setFilterName('');
    setFilterPlan('');
    setFilterStatus('all');
    setFilterExpiring('all');
    setDateRange({ start: '', end: '' });
  };

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filterId, filterName, filterPlan, filterStatus, filterExpiring, dateRange]);

  const allPageSelected = paginatedProjects.length > 0 && paginatedProjects.every(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Campaign Manager</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your traffic sources</p>
        </div>
        <button
          onClick={onAddProject}
          className="bg-[#ff4d00] hover:bg-[#e64600] text-white px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <Plus size={16} strokeWidth={3} />
          Create Project
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by ID..."
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#ff4d00] placeholder-gray-400"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by Name..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full px-4 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#ff4d00] placeholder-gray-400"
          />
          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-500 focus:outline-none focus:border-[#ff4d00] appearance-none"
            >
              <option value="">All Plans</option>
              <option value="Free Trial">Free Trial</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Agency">Agency</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-500 focus:outline-none focus:border-[#ff4d00] appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="stopped">Stopped</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterExpiring}
              onChange={(e) => setFilterExpiring(e.target.value)}
              className="w-full px-4 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-500 focus:outline-none focus:border-[#ff4d00] appearance-none"
            >
              <option value="all">All Dates</option>
              <option value="7days">Expiring in 7 days</option>
              <option value="expired">Already expired</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <input
            type="date"
            placeholder="Start date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-full px-3 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-500 focus:outline-none focus:border-[#ff4d00]"
          />
          <input
            type="date"
            placeholder="End date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-full px-3 py-2 bg-[#f9fafb] border border-gray-200 text-xs font-bold text-gray-500 focus:outline-none focus:border-[#ff4d00]"
          />
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <X size={14} /> Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-gray-200">
                <th className="w-12 px-4 py-4 text-left">
                  <button onClick={toggleSelectAll} className="flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                    {allPageSelected ? (
                      <CheckSquare size={16} className="text-[#ff4d00]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="w-28 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                <th 
                  className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center">Name <SortIcon field="name" /></span>
                </th>
                <th className="w-24 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th 
                  className="w-28 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('startAt')}
                >
                  <span className="flex items-center">Start <SortIcon field="startAt" /></span>
                </th>
                <th 
                  className="w-28 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('expiresAt')}
                >
                  <span className="flex items-center">End <SortIcon field="expiresAt" /></span>
                </th>
                <th className="w-32 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                <th 
                  className="w-24 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('dailyLimit')}
                >
                  <span className="flex items-center">Daily <SortIcon field="dailyLimit" /></span>
                </th>
                <th className="w-20 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th 
                  className="w-24 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('totalHits')}
                >
                  <span className="flex items-center">Hits <SortIcon field="totalHits" /></span>
                </th>
                <th 
                  className="w-28 px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('status')}
                >
                  <span className="flex items-center">Status <SortIcon field="status" /></span>
                </th>
                <th className="w-20 px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Globe size={32} className="text-gray-300" />
                      <span className="text-gray-400 text-sm font-medium">No campaigns found</span>
                      <span className="text-gray-300 text-xs">Try adjusting your filters or create a new campaign</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => {
                  const progress = project.totalTarget && project.totalTarget > 0 
                    ? Math.min(100, Math.round(((project.totalHits || 0) / project.totalTarget) * 100))
                    : null;
                  const daysRemaining = getDaysRemaining(project.expiresAt);
                  const expiryClass = getExpiryWarningClass(project.expiresAt);
                  
                  return (
                    <tr 
                      key={project.id} 
                      className={`transition-colors group ${selectedIds.includes(project.id) ? 'bg-orange-50/50' : 'hover:bg-gray-50'} ${project.status === 'active' ? 'border-l-2 border-l-[#ff4d00]' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSelectOne(project.id); }} 
                          className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {selectedIds.includes(project.id) ? (
                            <CheckSquare size={16} className="text-[#ff4d00]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-black text-[#ff4d00] font-mono tracking-tighter uppercase" title={project.id}>
                          {project.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900 truncate max-w-[200px]" title={project.name}>{project.name}</span>
                          {project.settings?.entryUrls && (
                            <a 
                              href={project.settings.entryUrls} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-gray-300 hover:text-[#ff4d00] flex-shrink-0" 
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-gray-600">{project.plan}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">{formatDate(project.startAt || project.createdAt)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className={`text-xs ${expiryClass || 'text-gray-500'}`}>
                            {formatDate(project.expiresAt)}
                          </span>
                          {daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 && (
                            <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={10} />
                              {daysRemaining === 0 ? 'Expires today' : `${daysRemaining}d left`}
                            </span>
                          )}
                          {daysRemaining !== null && daysRemaining < 0 && (
                            <span className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={10} />
                              Expired {Math.abs(daysRemaining)}d ago
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {progress !== null ? (
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-gray-600">{progress}%</span>
                              <span className="text-[10px] text-gray-400">{(project.totalHits || 0).toLocaleString()} / {(project.totalTarget || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  project.status === 'completed' ? 'bg-gray-600' :
                                  project.status === 'active' ? 'bg-[#ff4d00]' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Zap size={12} />
                            <span className="text-xs">{(project.totalHits || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">
                          {project.dailyLimit ? `${project.dailyLimit.toLocaleString()}/d` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded ${getTrafficSourceColor(project)}`}>
                          {getTrafficSourceLabel(project)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {(project.totalHits || 0).toLocaleString()}
                          </span>
                          {project.status === 'active' && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm ${getStatusColor(project.status)}`}>
                          {project.status === 'stopped' && <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>}
                          {project.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse"></span>}
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickStatusToggle(project);
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              project.status === 'active' 
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={project.status === 'active' ? 'Pause campaign' : 'Start campaign'}
                          >
                            {project.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToProject(project.id);
                            }}
                            className="text-gray-400 hover:text-[#ff4d00] transition-colors p-1.5 hover:bg-orange-50 rounded"
                            title="Settings"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 bg-[#f9fafb] flex items-center justify-between mt-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Showing {filteredAndSortedProjects.length === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedProjects.length)} - {Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} of {filteredAndSortedProjects.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  p = currentPage - 2 + i;
                }
                if (p > totalPages) return null;

                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold border ${currentPage === p ? 'border-[#ff4d00] text-[#ff4d00] bg-orange-50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-gray-800">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 border-r border-gray-700 pr-6 mr-2">
              {selectedIds.length} Selected
            </span>

            <button
              onClick={() => handleBulkAction('resume')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#ff4d00] transition-colors"
            >
              <Play size={14} /> Resume
            </button>

            <button
              onClick={() => handleBulkAction('pause')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#ff4d00] transition-colors"
            >
              <Pause size={14} /> Pause
            </button>

            <div className="w-px h-4 bg-gray-700 mx-2"></div>

            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="ml-4 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
