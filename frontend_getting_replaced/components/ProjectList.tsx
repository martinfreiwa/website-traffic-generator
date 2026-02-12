import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { Settings, Filter, ChevronDown, Plus, ExternalLink, Play, Pause, Square, CheckSquare, Download, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { db } from '../services/db';

interface ProjectListProps {
  projects: Project[];
  onUpdate: () => void;
  onNavigateToProject: (projectId: string) => void;
  onAddProject: () => void;
}

type SortField = 'name' | 'status' | 'id' | 'plan';
type SortDirection = 'asc' | 'desc';

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdate, onNavigateToProject, onAddProject }) => {
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'stopped' | 'completed'>('all');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({ field: 'id', direction: 'desc' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await db.syncProjects();
    onUpdate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'bg-gray-900 text-white';
      case 'active': return 'bg-[#ff4d00] text-white';
      case 'stopped': return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const handleStatusChange = async (id: string, newStatus: Project['status']) => {
    await db.updateProjectStatus(id, newStatus);
    onUpdate();
  };

  // Filter & Sort Logic
  const processedProjects = useMemo(() => {
    let result = projects.filter(p => {
      const matchesSearch = (
        (p.id || "").toLowerCase().includes((filterId || "").toLowerCase()) &&
        (p.name || "").toLowerCase().includes((filterName || "").toLowerCase()) &&
        (p.plan || "").toLowerCase().includes((filterPlan || "").toLowerCase())
      );
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      const aValue = a[sortConfig.field]?.toString().toLowerCase() || '';
      const bValue = b[sortConfig.field]?.toString().toLowerCase() || '';

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, filterId, filterName, filterPlan, filterStatus, sortConfig]);

  // Bulk Selection Handlers
  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === processedProjects.length) {
      setSelectedProjects(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProjects(new Set(processedProjects.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = async (action: 'start' | 'stop' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action} ${selectedProjects.size} campaigns?`)) return;

    const promises = Array.from(selectedProjects).map(id => {
      if (action === 'delete') {
        return db.updateProjectStatus(id, 'stopped'); // Mock delete
      }
      return db.updateProjectStatus(id, action === 'start' ? 'active' : 'stopped');
    });

    await Promise.all(promises);
    setSelectedProjects(new Set());
    setShowBulkActions(false);
    onUpdate();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Plan', 'Status', 'Expires'];
    const rows = processedProjects.map(p => [p.id, p.name, p.plan, p.status, p.expires]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns.csv';
    a.click();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-[#ff4d00]" /> : <ArrowDown size={12} className="text-[#ff4d00]" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        {/* Title / Info */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">All Campaigns</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-1">Manage and monitor your active traffic sources</p>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-gray-100 transition-all ${isRefreshing ? 'animate-spin text-[#ff4d00]' : 'text-gray-400'}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Add Button */}
        <button
          onClick={onAddProject}
          className="bg-black text-white pl-4 pr-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Filter size={14} /> Filter Campaigns
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#ff4d00] transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search by ID..."
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-all placeholder:text-gray-400 rounded-sm"
            />
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search by Name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-all placeholder:text-gray-400 rounded-sm"
            />
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search by Plan..."
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-all placeholder:text-gray-400 rounded-sm"
            />
          </div>
          <div className="relative group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-all uppercase tracking-wide appearance-none cursor-pointer rounded-sm"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="stopped">Status: Stopped</option>
              <option value="completed">Status: Completed</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#ff4d00] transition-colors" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-[#111] text-white p-4 rounded-sm shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{selectedProjects.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('start')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
            >
              <Play size={14} /> Start All
            </button>
            <button
              onClick={() => handleBulkAction('stop')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
            >
              <Pause size={14} /> Pause All
            </button>
            <button
              onClick={() => { setSelectedProjects(new Set()); setShowBulkActions(false); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[400px] rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-gray-200">
                <th className="px-6 py-4 text-left w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 hover:text-[#ff4d00] transition-colors"
                  >
                    {selectedProjects.size === processedProjects.length && processedProjects.length > 0 ? (
                      <CheckSquare size={16} className="text-[#ff4d00]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    ID <SortIcon field="id" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Name <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('plan')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Plan <SortIcon field="plan" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Expires</th>
                <th className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Status <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gray-100 p-4 rounded-full text-gray-300">
                        <Filter size={32} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase">No campaigns found</h3>
                        <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or create a new campaign.</p>
                      </div>
                      <button
                        onClick={onAddProject}
                        className="mt-2 text-[#ff4d00] text-xs font-bold uppercase tracking-wider hover:underline"
                      >
                        + Create New Campaign
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedProjects.map((project) => (
                  <tr
                    key={project.id}
                    className={`hover:bg-orange-50/30 transition-colors group relative border-l-4 ${selectedProjects.has(project.id) ? 'bg-orange-50/50 border-l-[#ff4d00]' :
                      project.status === 'active' ? 'border-l-green-500' :
                        project.status === 'stopped' ? 'border-l-orange-300' : 'border-l-transparent'
                      }`}
                  >
                    <td className="px-6 py-5">
                      <button
                        onClick={() => toggleProjectSelection(project.id)}
                        className="text-gray-400 hover:text-[#ff4d00] transition-colors"
                      >
                        {selectedProjects.size === processedProjects.length ? (
                          <CheckSquare size={18} className="text-[#ff4d00]" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-400 font-mono">{project.id.substring(0, 8)}...</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-[#ff4d00] transition-colors">
                          {project.name}
                        </span>
                        {project.settings?.entryUrls && (
                          <a href={project.settings.entryUrls} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-[#ff4d00] transition-colors opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-sm uppercase tracking-wider">
                        {project.plan}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-500">{project.expires}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm ${getStatusColor(project.status)}`}>
                        {project.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                        {project.status === 'stopped' && <Pause size={8} />}
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right relative">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {project.status === 'stopped' ? (
                          <button
                            onClick={() => handleStatusChange(project.id, 'active')}
                            className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-sm shadow-sm transition-all transform hover:scale-105"
                            title="Start Campaign"
                          >
                            <Play size={14} fill="currentColor" />
                          </button>
                        ) : project.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(project.id, 'stopped')}
                            className="p-2 text-white bg-orange-500 hover:bg-orange-600 rounded-sm shadow-sm transition-all transform hover:scale-105"
                            title="Pause Campaign"
                          >
                            <Pause size={14} fill="currentColor" />
                          </button>
                        ) : null}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToProject(project.id);
                          }}
                          className="text-gray-500 hover:text-white hover:bg-black transition-colors p-2 rounded-sm"
                          title="Settings"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>

        {/* Pagination (Static for now) */}
        <div className="p-4 border-t border-gray-200 bg-[#f9fafb] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Showing {processedProjects.length} of {projects.length}</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;