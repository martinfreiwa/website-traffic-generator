import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../types';
import { db } from '../../../services/db';
import { Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface ActivityTabProps {
    userId: string;
}

const actionTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
    login: { label: 'Login', icon: '🔑', color: 'bg-green-50' },
    logout: { label: 'Logout', icon: '🚪', color: 'bg-gray-50' },
    project_created: { label: 'Project Created', icon: '📁', color: 'bg-blue-50' },
    project_started: { label: 'Project Started', icon: '▶️', color: 'bg-green-50' },
    project_stopped: { label: 'Project Stopped', icon: '⏹️', color: 'bg-yellow-50' },
    project_deleted: { label: 'Project Deleted', icon: '🗑️', color: 'bg-red-50' },
    purchase: { label: 'Purchase', icon: '💳', color: 'bg-green-50' },
    balance_adjusted: { label: 'Balance Adjusted', icon: '💰', color: 'bg-orange-50' },
    api_key_regenerated: { label: 'API Key Regenerated', icon: '🔐', color: 'bg-purple-50' },
    settings_change: { label: 'Settings Changed', icon: '⚙️', color: 'bg-gray-50' },
    password_change: { label: 'Password Changed', icon: '🔒', color: 'bg-blue-50' },
    ticket_created: { label: 'Ticket Created', icon: '🎫', color: 'bg-indigo-50' },
    ticket_reply: { label: 'Ticket Reply', icon: '💬', color: 'bg-indigo-50' },
    impersonation_start: { label: 'Impersonation Started', icon: '👤', color: 'bg-red-50' },
    impersonation_end: { label: 'Impersonation Ended', icon: '👤', color: 'bg-red-50' },
};

const ActivityTab: React.FC<ActivityTabProps> = ({ userId }) => {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterAction, setFilterAction] = useState<string>('all');
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

    useEffect(() => {
        loadActivities();
    }, [userId]);

    const loadActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await db.getUserActivity(userId, 100, 0, filterAction !== 'all' ? filterAction : undefined);
            setActivities(data);
        } catch (e) {
            console.error('Failed to load activities:', e);
            setError('Failed to load activities.');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadActivities();
    }, [filterAction]);

    const filteredActivities = activities;

    const getActionInfo = (actionType: string) => {
        return actionTypeLabels[actionType] || { label: actionType, icon: '📌', color: 'bg-gray-50' };
    };

    const uniqueActionTypes = Array.from(new Set(activities.map(a => a.actionType)));

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <div className="font-bold mb-2">Error</div>
                {error}
                <button
                    onClick={loadActivities}
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
                        <span className="text-xs font-bold text-gray-400 uppercase">Filter:</span>
                    </div>

                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-bold uppercase"
                    >
                        <option value="all">All Activities</option>
                        {uniqueActionTypes.map(type => (
                            <option key={type} value={type}>
                                {getActionInfo(type).label}
                            </option>
                        ))}
                    </select>

                    <div className="flex-1"></div>

                    <span className="text-xs text-gray-500">{filteredActivities.length} activities</span>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white border border-gray-200 shadow-sm">
                {filteredActivities.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No activity recorded yet</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredActivities.map(activity => {
                            const actionInfo = getActionInfo(activity.actionType);
                            return (
                                <div
                                    key={activity.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${actionInfo.color}`}>
                                            {actionInfo.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-gray-900">{actionInfo.label}</span>
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
                                                    </span>
                                                </div>
                                                {expandedActivity === activity.id ? (
                                                    <ChevronUp size={16} className="text-gray-400" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-gray-400" />
                                                )}
                                            </div>

                                            {activity.ipAddress && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    IP: {activity.ipAddress}
                                                </div>
                                            )}

                                            {/* Expanded Details */}
                                            {expandedActivity === activity.id && activity.actionDetail && Object.keys(activity.actionDetail).length > 0 && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                                                    <div className="font-bold text-gray-500 mb-1">Details:</div>
                                                    <pre className="text-gray-600 whitespace-pre-wrap">
                                                        {JSON.stringify(activity.actionDetail, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {expandedActivity === activity.id && activity.userAgent && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                                                    <div className="font-bold text-gray-500 mb-1">User Agent:</div>
                                                    <div className="text-gray-600 truncate">{activity.userAgent}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTab;
