import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { Edit2, Search, Filter, Globe, User, PauseCircle, PlayCircle, AlertTriangle } from 'lucide-react';

interface AdminProjectsProps {
    projects: Project[];
    onEditProject: (id: string) => void;
}

const AdminProjects: React.FC<AdminProjectsProps> = ({ projects, onEditProject }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'stopped' | 'completed'>('all');

    // Extract domain helper
    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.settings?.entryUrls && p.settings.entryUrls.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [projects, searchTerm, filterStatus]);

    return (
        <div className="animate-in fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tight">Mission Control</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#ff4d00]" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Domain, Name, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 text-sm font-bold w-full sm:w-64 outline-none focus:border-[#ff4d00] transition-colors"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="border border-gray-200 px-4 py-2 text-sm font-bold bg-white outline-none focus:border-[#ff4d00]"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="stopped">Stopped/Paused</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f9fafb] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign Target</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan & Traffic</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        No campaigns found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-500">
                                                    <Globe size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 group-hover:text-[#ff4d00] transition-colors">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono mt-0.5 max-w-[200px] truncate" title={p.settings?.entryUrls}>
                                                        {p.settings?.entryUrls ? getDomain(p.settings.entryUrls) : 'No URL'}
                                                    </div>
                                                    <div className="mt-1 text-[10px] text-gray-400 font-mono">ID: {p.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                                                <User size={12} className="text-gray-400" />
                                                <span>{(p.userId || 'Unknown User').split('-')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded mb-1 ${p.plan.toLowerCase().includes('agency') ? 'bg-purple-100 text-purple-700' :
                                                p.plan.toLowerCase().includes('pro') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {p.plan}
                                            </span>
                                            <div className="text-xs text-gray-500">
                                                Expires: <span className="font-mono text-gray-700">{p.expires}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${p.status === 'active' ? 'bg-[#ff4d00]/10 text-[#ff4d00] ring-1 ring-[#ff4d00]/20' :
                                                p.status === 'completed' ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                                                }`}>
                                                {p.status === 'active' ? <PlayCircle size={10} className="fill-current" /> :
                                                    p.status === 'stopped' ? <PauseCircle size={10} /> : null}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => onEditProject(p.id)}
                                                className="bg-white border border-gray-200 hover:border-black hover:bg-black hover:text-white text-gray-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm flex items-center gap-2 ml-auto shadow-sm"
                                            >
                                                <Edit2 size={12} /> Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminProjects;