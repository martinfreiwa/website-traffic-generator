
import React, { useState } from 'react';
import { Project } from '../types';
import { Settings, Filter, ChevronDown, Plus, ExternalLink } from 'lucide-react';
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
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'bg-gray-900 text-white';
      case 'active': return 'bg-[#ff4d00] text-white';
      case 'stopped': return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const handleStatusChange = (id: string, newStatus: Project['status']) => {
    db.updateProjectStatus(id, newStatus);
    setOpenSettingsId(null);
    onUpdate();
  };

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    return (
        p.id.toLowerCase().includes(filterId.toLowerCase()) &&
        p.name.toLowerCase().includes(filterName.toLowerCase()) &&
        p.plan.toLowerCase().includes(filterPlan.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        {/* Title / Info */}
        <div>
             <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">All Campaigns</h2>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-1">Manage and monitor your active traffic sources</p>
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
      <div className="bg-white p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Filter size={14} /> Filter Campaigns
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ID"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-colors placeholder:text-gray-400"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-colors placeholder:text-gray-400"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Plan"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00] focus:ring-0 transition-colors placeholder:text-gray-400"
            />
          </div>
          <div className="relative">
            <button className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-500 flex justify-between items-center outline-none focus:border-[#ff4d00] transition-colors uppercase tracking-wide">
              <span>Status: Any</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-gray-200">
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Expires</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No campaigns found matching your filters.
                    </td>
                 </tr>
              ) : (
                filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-orange-50/30 transition-colors group relative">
                  <td className="px-6 py-5 text-sm font-bold text-gray-500 font-mono">{project.id}</td>
                  <td className="px-6 py-5 text-sm font-bold text-gray-900">
                    {project.name}
                    {project.settings?.entryUrls && (
                        <a href={project.settings.entryUrls} target="_blank" rel="noreferrer" className="ml-2 inline-block text-gray-300 hover:text-[#ff4d00]" onClick={e => e.stopPropagation()}>
                            <ExternalLink size={12} />
                        </a>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-600">{project.plan}</td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-500">{project.expires}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm ${getStatusColor(project.status)}`}>
                        {project.status === 'stopped' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>}
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
        <div className="p-4 border-t border-gray-200 bg-[#f9fafb] flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Showing {filteredProjects.length} of {projects.length}</span>
            <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50">Prev</button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase text-gray-500 hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
