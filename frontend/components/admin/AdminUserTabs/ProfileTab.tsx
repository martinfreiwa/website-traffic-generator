import React, { useState, useEffect } from 'react';
import { db } from '../../../services/db';
import { Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { User } from '../../../types';

interface ProfileTabProps {
    userId: string;
    onUpdate?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userId, onUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<User | null>(null);

    // Form States
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('user');
    const [status, setStatus] = useState('active');
    const [plan, setPlan] = useState('free');
    const [password, setPassword] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await db.getUserDetails(userId);
            if (data && data.user) {
                const u = data.user;
                setUserDetails(u);
                setEmail(u.email || '');
                setName(u.name || '');
                setRole(u.role || 'user');
                setStatus(u.status || 'active');
                setPlan(u.plan || 'free');
                setIsVerified(u.isVerified || false);
            }
        } catch (e) {
            console.error('Failed to load user profile:', e);
            setError('Failed to load user profile.');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatePayload: any = {
                email,
                name,
                role,
                status,
                plan,
                is_verified: isVerified
            };

            if (password) {
                updatePayload.password = password;
            }

            await db.adminUpdateUser(userId, updatePayload);

            // Clear password field after save
            setPassword('');
            if (onUpdate) onUpdate();
            alert('Profile updated successfully');
        } catch (e) {
            console.error('Failed to update profile:', e);
            alert('Failed to update profile');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (error) return (
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

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Main Profile Card */}
            <div className="bg-white border boundary-gray-200 p-6 shadow-sm rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-[#ff4d00]">👤</span> User Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User ID (Read Only) */}
                    <div className="col-span-2">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">User ID</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={userId}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-200 p-2 text-sm text-gray-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 p-2 text-sm focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] outline-none"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 p-2 text-sm focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] outline-none"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border border-gray-300 p-2 text-sm focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] outline-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Account Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 p-2 text-sm focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] outline-none"
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="banned">Banned</option>
                        </select>
                    </div>

                    {/* Plan */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Subscription Plan</label>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full border border-gray-300 p-2 text-sm focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] outline-none"
                        >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="agency">Agency</option>
                        </select>
                    </div>

                    {/* Verification Status */}
                    <div className="flex items-center mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isVerified}
                                onChange={(e) => setIsVerified(e.target.checked)}
                                className="w-4 h-4 text-[#ff4d00] focus:ring-[#ff4d00] border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-900">Email Verified</span>
                        </label>
                    </div>

                    {/* Password Management */}
                    <div className="col-span-2 border-t border-gray-100 pt-6 mt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            🔐 Password Management
                        </h4>
                        <div className="bg-orange-50 p-4 rounded border border-orange-100">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Set New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password to change..."
                                    className="w-full border border-gray-300 p-2 pr-10 text-sm focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Leave blank to keep current password. Providing a value will update the password immediately upon save.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#ff4d00] text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#e64500] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
