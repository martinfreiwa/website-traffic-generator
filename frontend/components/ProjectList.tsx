
import React, { useState } from 'react';
import { Project } from '../types';
import { Settings, Filter, ChevronDown, Plus, ExternalLink, ChevronLeft, ChevronRight, Calendar, X, Play, Pause, Trash2, CheckSquare, Square } from 'lucide-react';
import { db } from '../services/db';

interface ProjectListProps {
  projects: Project[];
  onUpdate: () => void;
  onNavigateToProject: (projectId: string) => void;
  onAddProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdate, onNavigateToProject, onAddProject }) => {
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'bg-gray-900 text-white';
      case 'active': return 'bg-[#ff4d00] text-white';
      case 'stopped': return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    const matchesId = p.id.toLowerCase().includes(filterId.toLowerCase());
    const matchesName = p.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesPlan = p.plan.toLowerCase().includes(filterPlan.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const projectDate = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
      const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity; // End of day

      if (projectDate === 0) matchesDate = false; // Filter out if no date and date filter active
      else matchesDate = projectDate >= start && projectDate < end;
    }

    return matchesId && matchesName && matchesPlan && matchesStatus && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusChange = (id: string, newStatus: Project['status']) => {
    db.updateProjectStatus(id, newStatus).then(() => onUpdate());
    setOpenSettingsId(null);
  };

  // Bulk Handler
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

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]); // Clear selection on filter change
  }, [filterId, filterName, filterPlan, filterStatus, dateRange]);

  // Table Header Checkbox Logic
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <button
          onClick={() => { setFilterId(''); setFilterName(''); setFilterPlan(''); setFilterStatus('all'); }}
          className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} /> Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-gray-200">
                <th className="w-16 px-6 py-4 text-left">
                  <button onClick={toggleSelectAll} className="flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                    {allPageSelected ? (
                      <CheckSquare size={16} className="text-[#ff4d00]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="w-32 px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                <th className="w-28 px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="w-32 px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Expires</th>
                <th className="w-32 px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="w-24 px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No campaigns found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => (
                  <tr key={project.id} className={`transition-colors group relative ${selectedIds.includes(project.id) ? 'bg-orange-50/50' : 'hover:bg-orange-50/30'}`}>
                    <td className="px-6 py-5">
                      <button onClick={(e) => { e.stopPropagation(); toggleSelectOne(project.id); }} className="flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                        {selectedIds.includes(project.id) ? (
                          <CheckSquare size={16} className="text-[#ff4d00]" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-black text-[#ff4d00] font-mono tracking-tighter uppercase truncate" title={project.id}>
                      {project.id.substring(0, 10)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">{project.name}</span>
                        {project.settings?.entryUrls && (
                          <a href={project.settings.entryUrls} target="_blank" rel="noreferrer" className="ml-2 inline-block text-gray-300 hover:text-[#ff4d00]" onClick={e => e.stopPropagation()}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-600">{project.plan}</td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-500">{project.expires}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm ${getStatusColor(project.status)}`}>
                        {project.status === 'stopped' && <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>}
                        {project.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse"></span>}
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToProject(project.id);
                        }}
                        className="text-gray-400 hover:text-[#ff4d00] transition-colors p-2 hover:bg-orange-50 rounded-sm"
                      >
                        <Settings size={18} />
                      </button>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>

        {/* Pagination (Static for now) */}
        <div className="p-4 border-t border-gray-200 bg-[#f9fafb] flex items-center justify-between mt-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)} - {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {/* Visual Page Indicator */}
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
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Floating) */}
      {
        selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
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
        )
      }
    </div >
  );
};

export default ProjectList;
