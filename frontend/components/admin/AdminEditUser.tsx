import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { db } from '../../services/db';
import { ArrowLeft, Save, LogIn, User as UserIcon, CreditCard, Folder, Ticket, Shield, Activity as ActivityIcon } from 'lucide-react';
import OverviewTab from './AdminUserTabs/OverviewTab';
import TransactionsTab from './AdminUserTabs/TransactionsTab';
import ProjectsTab from './AdminUserTabs/ProjectsTab';
import TicketsTab from './AdminUserTabs/TicketsTab';
import SecurityTab from './AdminUserTabs/SecurityTab';
import ActivityTab from './AdminUserTabs/ActivityTab';
import ProfileTab from './AdminUserTabs/ProfileTab';

interface AdminEditUserProps {
    userId: string;
    onBack: () => void;
    onUpdate: () => void;
}

const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserIcon size={16} /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard size={16} /> },
    { id: 'projects', label: 'Projects', icon: <Folder size={16} /> },
    { id: 'tickets', label: 'Tickets', icon: <Ticket size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'activity', label: 'Activity', icon: <ActivityIcon size={16} /> },
];

const AdminEditUser: React.FC<AdminEditUserProps> = ({ userId, onBack, onUpdate }) => {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, [userId]);

    const loadUser = async () => {
        setLoading(true);
        try {
            const data = await db.getUserDetails(userId);
            if (data && data.user) {
                setUser(data.user);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleNavigateToProject = (projectId: string) => {
        window.location.href = `/admin/projects/edit/${projectId}`;
    };

    const handleImpersonate = async () => {
        if (!user) return;
        try {
            await db.startImpersonation(user.id);
            window.location.href = '/dashboard';
        } catch (e) {
            console.error("Failed to impersonate", e);
            alert("Failed to start impersonation session. Please try again.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading user details...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">User not found</div>;

    return (
        <div className="animate-in fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#ff4d00] text-xs font-bold uppercase tracking-wide transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Users
                </button>
                <div className="flex items-center gap-2">
                    {/* Action buttons can go here if needed generically */}
                </div>
            </div>

            {/* User Identity Bar */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#ff4d00] rounded-full flex items-center justify-center shadow-md">
                        <span className="font-black text-white text-xl">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-xl">{user.name || 'Unnamed User'}</div>
                        <div className="text-sm text-gray-500 font-mono">{user.email}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${user.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                                }`}>
                                {user.status}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                {user.role}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-blue-50 text-blue-600 border-blue-200">
                                {user.plan} Plan
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleImpersonate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-colors border border-black shadow-sm"
                    >
                        <LogIn size={14} /> Login As User
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                <div className="flex overflow-x-auto border-b border-gray-100">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-[#ff4d00] text-[#ff4d00] bg-orange-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <span className={activeTab === tab.id ? "text-[#ff4d00]" : "text-gray-400"}>
                                {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 bg-gray-50/30 min-h-[400px]">
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                userId={userId}
                                onNavigateToProject={handleNavigateToProject}
                                onUpdate={onUpdate}
                            />
                        )}
                        {activeTab === 'profile' && (
                            <ProfileTab userId={userId} onUpdate={() => {
                                loadUser();
                                onUpdate();
                            }} />
                        )}
                        {activeTab === 'transactions' && (
                            <TransactionsTab userId={userId} />
                        )}
                        {activeTab === 'projects' && (
                            <ProjectsTab
                                userId={userId}
                                onNavigateToProject={handleNavigateToProject}
                            />
                        )}
                        {activeTab === 'tickets' && (
                            <TicketsTab userId={userId} />
                        )}
                        {activeTab === 'security' && (
                            <SecurityTab
                                userId={userId}
                                onUpdate={onUpdate}
                            />
                        )}
                        {activeTab === 'activity' && (
                            <ActivityTab userId={userId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEditUser;
