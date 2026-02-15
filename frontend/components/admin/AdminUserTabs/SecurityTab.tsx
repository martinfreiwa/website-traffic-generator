import React, { useState, useEffect } from 'react';
import { UserSession, ImpersonationLog, BalanceAdjustmentLog } from '../../types';
import { db } from '../../../services/db';
import { Shield, Monitor, Key, Clock, Trash2, RefreshCw } from 'lucide-react';

interface SecurityTabProps {
    userId: string;
    onUpdate: () => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ userId, onUpdate }) => {
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [impersonationLogs, setImpersonationLogs] = useState<ImpersonationLog[]>([]);
    const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustmentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sessionsData, impersonationData, adjustmentsData] = await Promise.all([
                db.getUserSessions(userId),
                db.getImpersonationLog(userId),
                db.getBalanceAdjustments(userId)
            ]);
            setSessions(sessionsData);
            setImpersonationLogs(impersonationData);
            setBalanceAdjustments(adjustmentsData);
        } catch (e) {
            console.error('Failed to load security data:', e);
            setError('Failed to load security data.');
        }
        setLoading(false);
    };

    const handleTerminateSession = async (sessionId: string) => {
        if (!confirm('Terminate this session? User will be logged out.')) return;
        try {
            await db.terminateUserSession(userId, sessionId);
            loadData();
        } catch (e) {
            alert('Failed to terminate session');
        }
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
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-bold uppercase"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Sessions */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Monitor size={14} /> Active Sessions
                    </h3>
                    <span className="text-xs text-gray-400">{sessions.length} active</span>
                </div>
                {sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No active sessions</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">IP Address</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Device</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Last Activity</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Expires</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sessions.map(session => (
                                <tr key={session.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs font-mono text-gray-900">{session.ipAddress || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-600 truncate max-w-[200px]">
                                        {session.userAgent ? session.userAgent.substring(0, 50) + '...' : 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600">{session.location || '-'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {session.expiresAt ? new Date(session.expiresAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleTerminateSession(session.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Terminate Session"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Impersonation Log */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Shield size={14} /> Impersonation Log
                    </h3>
                </div>
                {impersonationLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No impersonation history</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Admin</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {impersonationLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-900">{log.adminEmail || log.adminId}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className={`px-2 py-1 text-[9px] font-bold uppercase ${log.action === 'start' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{log.ipAddress || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Balance Adjustment History */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                        <Key size={14} /> Balance Adjustment History
                    </h3>
                </div>
                {balanceAdjustments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No balance adjustments</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Admin</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Tier</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Hits</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {balanceAdjustments.map(adj => (
                                <tr key={adj.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {adj.createdAt ? new Date(adj.createdAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-900">{adj.adminEmail || 'System'}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className={`px-2 py-1 text-[9px] font-bold uppercase ${adj.adjustmentType === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {adj.adjustmentType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 uppercase">{adj.tier || '-'}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-900">
                                        {adj.hits ? `${adj.adjustmentType === 'credit' ? '+' : '-'}${adj.hits.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600">{adj.reason || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SecurityTab;
