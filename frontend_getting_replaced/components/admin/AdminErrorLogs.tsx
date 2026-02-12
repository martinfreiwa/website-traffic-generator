
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';

const AdminErrorLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await db.getAdminErrors(100);
            setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const headers = "ID,Timestamp,Level,Message,User ID\n";
        const rows = logs.map(e =>
            `${e.id},${e.timestamp},${e.level},"${e.message.replace(/"/g, '""')}",${e.user_id || ''}`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error_logs_${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div className="animate-in fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">System Error Logs</h2>
                    <p className="text-sm text-gray-500">View and analyze recent system errors</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadLogs} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors">
                        <Download size={16} /> CSV
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Message</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-xs text-gray-500 font-mono">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.level === 'ERROR' ? 'bg-red-100 text-red-700' :
                                            log.level === 'WARNING' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {log.level}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-800 break-all max-w-md">
                                    {log.message}
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                                    {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <AlertTriangle className="mb-2 opacity-50" size={32} />
                        <p className="text-sm">No errors found in the last 100 logs.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminErrorLogs;
