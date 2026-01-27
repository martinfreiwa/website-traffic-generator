
import React from 'react';
import { Project } from '../../types';
import { Edit2 } from 'lucide-react';

interface AdminProjectsProps {
    projects: Project[];
    onEditProject: (id: string) => void;
}

const AdminProjects: React.FC<AdminProjectsProps> = ({ projects, onEditProject }) => {
    
    return (
        <div className="animate-in fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Global Projects</h2>
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Expires</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {projects.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{p.name}</div>
                                    <div className="text-xs text-gray-400 font-mono">ID: {p.id}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-gray-600">{p.plan}</td>
                                <td className="px-6 py-4 text-xs text-gray-500">{p.expires}</td>
                                <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                                            p.status === 'active' ? 'bg-[#ff4d00] text-white' : 
                                            p.status === 'completed' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {p.status}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onEditProject(p.id)}
                                        className="bg-gray-100 hover:bg-black hover:text-white text-gray-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm flex items-center gap-2 ml-auto"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProjects;