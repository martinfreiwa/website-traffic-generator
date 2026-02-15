import React, { useState, useEffect } from 'react';
import { Project } from '../../../types';
import { db } from '../../../services/db';
import { Filter, ChevronRight } from 'lucide-react';

interface ProjectsTabProps {
    userId: string;
    onNavigateToProject: (projectId: string) => void;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ userId, onNavigateToProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'stopped' | 'completed'>('all');
    const [filterTier, setFilterTier] = useState<'all' | 'economy' | 'professional' | 'expert'>('all');

    useEffect(() => {
        loadProjects();
    }, [userId]);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await db.getUserProjects(userId);
            setProjects(data);
        } catch (e) {
            console.error('Failed to load projects:', e);
            setError('Failed to load projects.');
        }
        setLoading(false);
    };

    const filteredProjects = projects.filter(p => {
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        if (filterTier !== 'all' && p.tier !== filterTier) return false;
        return true;
    });

    const getStatusBadge = (status?: string) => {
        const colors: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            stopped: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-1 text-[9px] font-bold uppercase ${colors[status || ''] || 'bg-gray-100 text-gray-700'}`}>
                {status || 'unknown'}
            </span>
        );
    };

    const getTierBadge = (tier?: string) => {
        if (!tier) return <span className="text-gray-400">-</span>;
        const colors: Record<string, string> = {
            economy: 'bg-gray-100 text-gray-600',
            professional: 'bg-orange-100 text-orange-600',
            expert: 'bg-[#ff4d00]/10 text-[#ff4d00]'
        };
        return (
            <span className={`px-2 py-1 text-[9px] font-bold uppercase ${colors[tier] || 'bg-gray-100 text-gray-600'}`}>
                {tier}
            </span>
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <div className="font-bold mb-2">Error</div>
                {error}
                <button
                    onClick={loadProjects}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-bold uppercase"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Filters:</span>
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="stopped">Stopped</option>
                        <option value="completed">Completed</option>
                    </select>

                    <select
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value as any)}
                        className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase"
                    >
                        <option value="all">All Tiers</option>
                        <option value="economy">Economy</option>
                        <option value="professional">Professional</option>
                        <option value="expert">Expert</option>
                    </select>

                    <div className="flex-1"></div>

                    <span className="text-xs text-gray-500">{filteredProjects.length} projects</span>
                </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                {filteredProjects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No projects found</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Tier</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Hits Sent</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Target</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Created</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Expires</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProjects.map(project => (
                                <tr
                                    key={project.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => onNavigateToProject(project.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{project.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(project.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getTierBadge(project.tier)}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-900">
                                        {project.customTarget?.totalVisitors ? project.customTarget.totalVisitors.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {project.customTarget?.dailyLimit ? `${project.customTarget.dailyLimit.toLocaleString()}/day` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                        {project.createdAt?.split('T')[0] || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                        {project.expires || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProjectsTab;
