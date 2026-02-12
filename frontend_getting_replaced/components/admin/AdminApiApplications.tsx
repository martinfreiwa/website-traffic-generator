import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { User, Terminal, CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

const AdminApiApplications: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await db.getApiApplications(filter);
      setApplications(data);
    } catch (e) {
      console.error("Failed to load applications", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
      if (!confirm("Are you sure you want to APPROVE this user for API access?")) return;
      try {
          await db.approveApiAccess(userId);
          loadApplications();
      } catch (e: any) {
          alert(e.message || "Failed to approve");
      }
  };

  const handleReject = async (userId: string) => {
      if (!confirm("Are you sure you want to REJECT this application?")) return;
      try {
          await db.rejectApiAccess(userId);
          loadApplications();
      } catch (e: any) {
          alert(e.message || "Failed to reject");
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
            <Terminal className="text-[#ff4d00]" size={24} /> API Access Requests
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-sm">
            {['pending', 'approved', 'rejected'].map(s => (
                <button 
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${filter === s ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {s}
                </button>
            ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 p-20 text-center rounded-sm">
            <ShieldCheck size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No {filter} applications found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {applications.map(app => (
                <div key={app.id} className="bg-white border border-gray-200 p-6 shadow-sm hover:border-[#ff4d00] transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                                    {app.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-gray-900">{app.email}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">User ID: {app.id}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#ff4d00] block mb-2">Usage Description</label>
                                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 border border-gray-100 italic">
                                        "{app.api_application_data?.usage_description}"
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#ff4d00] block mb-2">Target Websites</label>
                                    <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 border border-gray-100 font-mono">
                                        {app.api_application_data?.target_websites}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pt-2">
                                <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Clock size={12} /> Applied: {new Date(app.api_application_data?.applied_at).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {filter === 'pending' && (
                            <div className="flex md:flex-col gap-2 justify-center">
                                <button 
                                    onClick={() => handleApprove(app.id)}
                                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors"
                                >
                                    <CheckCircle2 size={16} /> Approve
                                </button>
                                <button 
                                    onClick={() => handleReject(app.id)}
                                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                            </div>
                        )}
                        
                        {filter === 'approved' && (
                            <div className="flex items-center text-green-600 font-black text-[10px] uppercase tracking-widest gap-2">
                                <ShieldCheck size={16} /> Approved Access
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminApiApplications;
