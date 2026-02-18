import React, { useState, useEffect, useRef } from 'react';
import {
    User, Lock, Bell, Save, Camera, Mail, Phone, MapPin, Building2, Globe, Hash,
    Shield, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { db } from '../services/db';
import { User as UserType, PaymentMethod } from '../types';

type ProfileTab = 'contact' | 'security' | 'notifications';

const Profile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('contact');
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [user, setUser] = useState<UserType | undefined>(undefined);

    // New Card State
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCardNumber, setNewCardNumber] = useState('');
    const [newCardExpiry, setNewCardExpiry] = useState('');

    // Password Change State
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Avatar Upload
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const url = await db.uploadAvatar(e.target.files[0]);
                if (user) setUser({ ...user, avatarUrl: url });
                alert("Avatar updated successfully!");
            } catch (err: any) {
                alert("Failed to upload avatar: " + err.message);
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm("DANGER: Are you sure you want to delete your account? This action is irreversible.")) {
            const extraConfirm = prompt("Type 'DELETE' to confirm account deletion:");
            if (extraConfirm === 'DELETE') {
                try {
                    await db.deleteAccount();
                    alert("Account deleted. Goodbye.");
                } catch (err: any) {
                    alert(err.message);
                }
            }
        }
    };

    useEffect(() => {
        const currentUser = db.getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        setSaveStatus('idle');
        try {
            const freshUser = await db.updateUserProfile(user);
            if (freshUser) setUser(freshUser);

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e: any) {
            console.error(e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof UserType, value: string) => {
        if (user) {
            setUser({ ...user, [field]: value });
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError('');
        setPasswordSuccess('');
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError("New passwords do not match.");
            return;
        }
        try {
            await db.changePassword(passwordForm.current, passwordForm.new, passwordForm.confirm);
            setPasswordSuccess("Password updated successfully.");
            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (e: any) {
            setPasswordError(e.message);
        }
    };

    const handleLogoutAll = async () => {
        if (confirm("Log out of all other sessions? You will need to log in again on other devices.")) {
            try {
                await db.logoutAllSessions();
                alert("All other sessions invalidted.");
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    // Payment Method Handlers
    const handleAddCard = () => {
        if (!newCardNumber || !newCardExpiry || !user) return;

        const newPaymentMethod: PaymentMethod = {
            id: `pm_${Date.now()}`,
            type: newCardNumber.startsWith('4') ? 'visa' : 'mastercard',
            last4: newCardNumber.slice(-4),
            expiry: newCardExpiry,
            isDefault: user.paymentMethods && user.paymentMethods.length === 0 ? true : false
        };

        const updatedMethods = [...(user.paymentMethods || []), newPaymentMethod];
        setUser({ ...user, paymentMethods: updatedMethods });
        setShowAddCard(false);
        setNewCardNumber('');
        setNewCardExpiry('');
    }

    const handleDeleteCard = (id: string) => {
        if (!user || !confirm('Are you sure you want to remove this payment method?')) return;
        const updatedMethods = (user.paymentMethods || []).filter(pm => pm.id !== id);
        setUser({ ...user, paymentMethods: updatedMethods });
    }

    if (!user) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Account Management</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">My Profile</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isLoading || saveStatus === 'success'}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${saveStatus === 'success'
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : saveStatus === 'error'
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-black text-white hover:bg-[#ff4d00]'
                        } disabled:opacity-70`}
                >
                    {saveStatus === 'success' ? (
                        <>
                            <CheckCircle2 size={14} className="animate-in zoom-in spin-in-90 duration-300" /> Saved!
                        </>
                    ) : saveStatus === 'error' ? (
                        <>
                            <AlertTriangle size={14} /> Failed
                        </>
                    ) : (
                        <>
                            <Save size={14} /> {isLoading ? 'Saving...' : 'Save Changes'}
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Avatar & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar Card */}
                    <div className="bg-white border border-gray-200 p-8 text-center shadow-sm">
                        <div className="relative inline-block mb-6 group">
                            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg mx-auto overflow-hidden">
                                {user.avatarUrl ? (
                                    <img src={`http://127.0.0.1:8001${user.avatarUrl}`} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-gray-300">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleAvatarClick}
                                className="absolute bottom-0 right-0 bg-[#ff4d00] text-white p-2 rounded-full hover:bg-black transition-colors shadow-md"
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{user.role}</p>

                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center gap-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-gray-900">{user.projectsCount}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Campaigns</div>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-600">{user.status}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs (Vertical for Desktop) */}
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${activeTab === 'contact' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <User size={16} /> Contact Details
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${activeTab === 'security' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Shield size={16} /> Security & 2FA
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${activeTab === 'notifications' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Bell size={16} /> Notifications
                        </button>
                    </div>
                </div>

                {/* Right Column: Forms based on Tab */}
                <div className="lg:col-span-2 space-y-6">

                    {activeTab === 'contact' ? (
                        <>
                            {/* Contact & Identity */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <User size={14} /> Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Full Name</Label>
                                        <Input
                                            value={user.name}
                                            onChange={(v) => handleInputChange('name', v)}
                                            icon={<User size={16} />}
                                        />
                                    </div>
                                    <div>
                                        <Label>Display Name (Nickname)</Label>
                                        <Input
                                            value={user.displayName || ''}
                                            onChange={(v) => handleInputChange('displayName', v)}
                                            icon={<Hash size={16} />}
                                            placeholder="The Traffic King"
                                        />
                                    </div>
                                    <div>
                                        <Label>Email Address</Label>
                                        <Input
                                            value={user.email}
                                            onChange={(v) => handleInputChange('email', v)}
                                            icon={<Mail size={16} />}
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={user.phone || ''}
                                            onChange={(v) => handleInputChange('phone', v)}
                                            icon={<Phone size={16} />}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div>
                                        <Label>Job Title</Label>
                                        <Input
                                            value={user.jobTitle || ''}
                                            onChange={(v) => handleInputChange('jobTitle', v)}
                                            icon={<Building2 size={16} />}
                                            placeholder="SEO Manager"
                                        />
                                    </div>
                                    <div>
                                        <Label>Website</Label>
                                        <Input
                                            value={user.website || ''}
                                            onChange={(v) => handleInputChange('website', v)}
                                            icon={<Globe size={16} />}
                                            placeholder="https://yourpage.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Personal Bio</Label>
                                        <textarea
                                            value={user.bio || ''}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none min-h-[100px]"
                                            placeholder="Tell us a bit about yourself..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Company & Address */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Building2 size={14} /> Company & Address
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Company Name</Label>
                                        <Input
                                            value={user.company || ''}
                                            onChange={(v) => handleInputChange('company', v)}
                                            icon={<Building2 size={16} />}
                                        />
                                    </div>
                                    <div>
                                        <Label>VAT ID / Tax ID</Label>
                                        <Input
                                            value={user.vatId || ''}
                                            onChange={(v) => handleInputChange('vatId', v)}
                                            icon={<Hash size={16} />}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Street Address</Label>
                                        <Input
                                            value={user.address || ''}
                                            onChange={(v) => handleInputChange('address', v)}
                                            icon={<MapPin size={16} />}
                                        />
                                    </div>
                                    <div>
                                        <Label>City</Label>
                                        <Input
                                            value={user.city || ''}
                                            onChange={(v) => handleInputChange('city', v)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Zip / Postal Code</Label>
                                        <Input
                                            value={user.zip || ''}
                                            onChange={(v) => handleInputChange('zip', v)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Country</Label>
                                        <Input
                                            value={user.country || ''}
                                            onChange={(v) => handleInputChange('country', v)}
                                            placeholder="e.g. Germany"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profile Visibility */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Globe size={14} /> Visibility
                                </h3>
                                <Toggle
                                    label="Public Profile Visibility"
                                    checked={user.publicProfile || false}
                                    onChange={(v) => setUser({ ...user, publicProfile: v })}
                                />
                                <p className="text-[10px] text-gray-400 mt-2">When enabled, other users can see your shared campaign stats and badges.</p>
                            </div>
                        </>
                    ) : activeTab === 'security' ? (
                        <>
                            {/* Security Settings */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Shield size={14} /> Security & Authentication
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-600">Two-Factor Authentication (2FA)</span>
                                        <button className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors">
                                            Enable 2FA
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Add an extra layer of security to your account by requiring a verification code from your phone.
                                    </p>
                                    <div className="border-t border-gray-100 pt-6">
                                        <Toggle
                                            label="Require password on all devices every 30 days"
                                            checked={user.requirePasswordReset || false}
                                            onChange={(v) => handleInputChange('requirePasswordReset', v.toString())}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password Change */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Lock size={14} /> Change Password
                                </h3>
                                {passwordError && <p className="text-red-500 text-xs mb-4">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-500 text-xs mb-4">{passwordSuccess}</p>}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <Label>Current Password</Label>
                                        <Input type="password" value={passwordForm.current} onChange={(v) => setPasswordForm({ ...passwordForm, current: v })} icon={<Lock size={16} />} />
                                    </div>
                                    <div>
                                        <Label>New Password</Label>
                                        <Input type="password" value={passwordForm.new} onChange={(v) => setPasswordForm({ ...passwordForm, new: v })} icon={<Lock size={16} />} />
                                    </div>
                                    <div>
                                        <Label>Confirm New Password</Label>
                                        <Input type="password" value={passwordForm.confirm} onChange={(v) => setPasswordForm({ ...passwordForm, confirm: v })} icon={<Lock size={16} />} />
                                    </div>
                                    <button onClick={handlePasswordChange} className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors self-start">
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            {/* Recent Login History */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Clock size={14} /> Recent Login History
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-bold">
                                        <thead>
                                            <tr className="border-b border-gray-100 pb-2">
                                                <th className="py-2 text-gray-400 uppercase tracking-widest">Date & Time</th>
                                                <th className="py-2 text-gray-400 uppercase tracking-widest">IP Address</th>
                                                <th className="py-2 text-gray-400 uppercase tracking-widest">Device / Browser</th>
                                                <th className="py-2 text-gray-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(user.loginHistory || []).length > 0 ? (
                                                user.loginHistory?.map((log, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 text-gray-900">{log.date}</td>
                                                        <td className="py-4 text-gray-500 font-mono">{log.ip}</td>
                                                        <td className="py-4 text-gray-600">{log.device}</td>
                                                        <td className="py-4 text-right">
                                                            {idx === 0 ? <span className="text-green-600">Current Session</span> : <span className="text-gray-400">Previous</span>}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-gray-400">No recent login history found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={handleLogoutAll} className="mt-6 w-full py-3 border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
                                    Log out of all other sessions
                                </button>

                                <div className="mt-12 pt-12 border-t border-gray-200">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} /> Danger Zone
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                                    <button onClick={handleDeleteAccount} className="bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors">
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'notifications' ? (
                        <>
                            {/* Notification Settings */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] flex items-center gap-2">
                                        <Bell size={14} /> Notification Preferences
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Label>Email Frequency</Label>
                                        <select
                                            value={user.emailFrequency || 'instant'}
                                            onChange={(e) => handleInputChange('emailFrequency', e.target.value)}
                                            className="bg-gray-100 border-none p-2 text-[10px] font-black uppercase tracking-widest outline-none"
                                        >
                                            <option value="instant">Instant</option>
                                            <option value="daily">Daily Digest</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Toggle label="Campaign Status Alerts" checked={true} />
                                        <Toggle label="Low Balance Warnings" checked={true} />
                                        <Toggle label="New Login Notifications" checked={user.loginNotificationEnabled || false} onChange={(v) => handleInputChange('loginNotificationEnabled', v.toString())} />
                                    </div>
                                    <div className="space-y-6">
                                        <Toggle label="Marketing & Product Updates" checked={user.newsletterSub || false} onChange={(v) => handleInputChange('newsletterSub', v.toString())} />
                                        <Toggle label="Weekly Performance Reports" checked={true} />
                                        <Toggle label="Sound Effects (UI)" checked={user.soundEffects || false} onChange={(v) => handleInputChange('soundEffects', v.toString())} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}

                </div>
            </div>
        </div>
    );
};

const Toggle: React.FC<{ label: string, checked: boolean, onChange?: (val: boolean) => void }> = ({ label, checked: initialChecked, onChange }) => {
    const [checked, setChecked] = useState(initialChecked);

    useEffect(() => {
        setChecked(initialChecked);
    }, [initialChecked]);

    const handleToggle = () => {
        const newVal = !checked;
        setChecked(newVal);
        if (onChange) onChange(newVal);
    };

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">{label}</span>
            <button
                onClick={handleToggle}
                className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 ${checked ? 'bg-[#ff4d00]' : 'bg-gray-200'}`}
            >
                <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
        </div>
    )
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">{children}</label>
)

const Input: React.FC<{
    value: string;
    onChange: (val: string) => void;
    icon?: React.ReactNode;
    type?: string;
    placeholder?: string;
}> = ({ value, onChange, icon, type = "text", placeholder }) => (
    <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none transition-colors ${icon ? 'pl-10' : ''}`}
            placeholder={placeholder}
        />
    </div>
)

export default Profile;