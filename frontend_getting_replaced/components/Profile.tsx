import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Save, Camera, Mail, Phone, MapPin, Building2, Hash, CreditCard, Trash2, Plus, Home, RefreshCw, ChevronRight, X } from 'lucide-react';
import { db } from '../services/db';
import { User as UserType, PaymentMethod } from '../types';

const Profile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'security'>('account');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<UserType | undefined>(undefined);

    // Avatar State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // New Card State
    const [showAddCard, setShowAddCard] = useState(false);
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    // Password Change State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const currentUser = db.getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            await db.updateUserProfile(user);
            alert('Profile settings saved successfully.');
        } catch (e: any) {
            alert(e.message || 'Failed to save profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const avatarUrl = await db.uploadAvatar(file);
            if (user) setUser({ ...user, avatarUrl });
            alert("Avatar uploaded successfully!");
        } catch (e: any) {
            alert(e.message || "Upload failed");
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    const handleInputChange = (field: keyof UserType, value: string) => {
        if (user) {
            setUser({ ...user, [field]: value });
        }
    };

    const handlePreferenceChange = (key: string, value: boolean) => {
        if (user) {
            const newPrefs = { ...(user.preferences || {}), [key]: value };
            setUser({ ...user, preferences: newPrefs as any });
        }
    }

    const handlePasswordChange = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert("All password fields are required");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match");
            return;
        }
        setIsChangingPassword(true);
        try {
            await db.changePassword(oldPassword, newPassword);
            alert("Password changed successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            alert(e.message || "Failed to change password");
        } finally {
            setIsChangingPassword(false);
        }
    }

    // Payment Method Handlers
    const handleAddCard = () => {
        if (!cardNumber || !cardExpiry || !user) return;

        const newPaymentMethod: PaymentMethod = {
            id: `pm_${Date.now()}`,
            type: cardNumber.startsWith('4') ? 'visa' : 'mastercard',
            last4: cardNumber.slice(-4),
            expiry: cardExpiry,
            isDefault: user.paymentMethods && user.paymentMethods.length === 0 ? true : false
        };

        const updatedMethods = [...(user.paymentMethods || []), newPaymentMethod];
        setUser({ ...user, paymentMethods: updatedMethods });
        setShowAddCard(false);
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
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
                    disabled={isLoading}
                    className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                    <Save size={14} /> {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Avatar & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar Card */}
                    <div className="bg-white border border-gray-200 p-8 text-center shadow-sm relative overflow-hidden">
                        {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                                <RefreshCw size={24} className="animate-spin text-[#ff4d00] mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Uploading...</span>
                            </div>
                        )}
                        <div className="relative inline-block mb-6 group">
                            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg mx-auto overflow-hidden">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-gray-300">
                                        {user.name ? user.name.split(' ').map(n => n[0]).join('') : user.email[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-[#ff4d00] text-white p-2 rounded-full hover:bg-black transition-colors shadow-md z-10"
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h3>
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
                            onClick={() => setActiveTab('account')}
                            className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${activeTab === 'account' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <User size={16} /> Account Details
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${activeTab === 'billing' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <CreditCard size={16} /> Billing & Payments
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${activeTab === 'security' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Lock size={16} /> Security & Privacy
                        </button>
                    </div>
                </div>

                {/* Right Column: Forms based on Tab */}
                <div className="lg:col-span-2 space-y-6">

                    {activeTab === 'account' ? (
                        <>
                            {/* Contact & Identity */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <User size={14} /> Identity & Contact
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Full Name</Label>
                                        <Input
                                            value={user.name || ''}
                                            onChange={(v) => handleInputChange('name', v)}
                                            icon={<User size={16} />}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email Address (ReadOnly)</Label>
                                        <div className="bg-gray-50 border border-gray-200 p-3 text-sm font-bold text-gray-400 flex items-center gap-2">
                                            <Mail size={16} /> {user.email}
                                        </div>
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
                                        <Label>Telegram / Messenger</Label>
                                        <Input
                                            value={user.telegram || ''}
                                            onChange={(v) => handleInputChange('telegram', v)}
                                            icon={<Hash size={16} />}
                                            placeholder="@username"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notification Settings */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-8 flex items-center gap-2">
                                    <Bell size={14} /> Enhanced Notifications
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Campaign Updates</h4>
                                        <Toggle
                                            label="Campaign Completion"
                                            checked={user.preferences?.campaign_alerts ?? true}
                                            onChange={(v) => handlePreferenceChange('campaign_alerts', v)}
                                        />
                                        <Toggle
                                            label="Daily Hit Reports"
                                            checked={user.preferences?.daily_reports ?? false}
                                            onChange={(v) => handlePreferenceChange('daily_reports', v)}
                                        />
                                        <Toggle
                                            label="Error & System Alerts"
                                            checked={user.preferences?.system_alerts ?? true}
                                            onChange={(v) => handlePreferenceChange('system_alerts', v)}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Billing & Account</h4>
                                        <Toggle
                                            label="Low Balance (Below €10)"
                                            checked={user.preferences?.low_balance_warning ?? true}
                                            onChange={(v) => handlePreferenceChange('low_balance_warning', v)}
                                        />
                                        <Toggle
                                            label="New Login Alerts"
                                            checked={user.preferences?.login_alerts ?? true}
                                            onChange={(v) => handlePreferenceChange('login_alerts', v)}
                                        />
                                        <Toggle
                                            label="Marketing & Promos"
                                            checked={user.preferences?.marketing_emails ?? false}
                                            onChange={(v) => handlePreferenceChange('marketing_emails', v)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'billing' ? (
                        <>
                            {/* Payment Methods */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] flex items-center gap-2">
                                        <CreditCard size={14} /> Saved Payment Methods
                                    </h3>
                                    <button
                                        onClick={() => setShowAddCard(!showAddCard)}
                                        className="text-[#ff4d00] text-[10px] font-bold uppercase tracking-widest hover:text-black flex items-center gap-1"
                                    >
                                        {showAddCard ? <X size={12} /> : <Plus size={12} />} {showAddCard ? 'Cancel' : 'Add New'}
                                    </button>
                                </div>

                                {showAddCard && (
                                    <div className="mb-8 p-8 bg-gray-50 border border-gray-200 animate-in fade-in slide-in-from-top-2 rounded-sm shadow-inner">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div className="md:col-span-2">
                                                <Label>Cardholder Name</Label>
                                                <Input value={cardName} onChange={setCardName} placeholder="JOHN DOE" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Card Number</Label>
                                                <Input value={cardNumber} onChange={setCardNumber} placeholder="4242 4242 4242 4242" icon={<CreditCard size={16} />} />
                                            </div>
                                            <div>
                                                <Label>Expiry Date</Label>
                                                <Input value={cardExpiry} onChange={setCardExpiry} placeholder="MM / YY" />
                                            </div>
                                            <div>
                                                <Label>CVV / CVC</Label>
                                                <Input value={cardCvv} onChange={setCardCvv} placeholder="123" type="password" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleAddCard}
                                            className="w-full bg-black text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-[#ff4d00] transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Lock size={14} /> Save Securely
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    {(user.paymentMethods && user.paymentMethods.length > 0) ? (
                                        user.paymentMethods.map(pm => (
                                            <div key={pm.id} className="border border-gray-200 p-6 flex justify-between items-center bg-[#f9fafb] hover:border-gray-300 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-10 rounded-sm flex items-center justify-center text-white text-[10px] font-black tracking-tighter ${pm.type === 'visa' ? 'bg-[#1a1f71]' : 'bg-[#eb001b]'}`}>
                                                        {pm.type === 'visa' ? 'VISA' : 'MC'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">•••• •••• •••• {pm.last4}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expires {pm.expiry}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {pm.isDefault && <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm">Default</span>}
                                                    <button onClick={() => handleDeleteCard(pm.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-12 text-gray-400 bg-gray-50 border border-dashed border-gray-200">
                                            <div className="mb-4 flex justify-center"><CreditCard size={32} className="opacity-20" /></div>
                                            <p className="text-xs font-bold uppercase tracking-widest">No payment methods saved</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Home size={14} /> Billing Address
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
                                        <select
                                            value={user.country || ''}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none appearance-none"
                                        >
                                            <option value="">Select Country</option>
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Germany">Germany</option>
                                            <option value="Canada">Canada</option>
                                            <option value="France">France</option>
                                            <option value="Australia">Australia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Security Tab */}
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                                    <Lock size={14} /> Change Password
                                </h3>
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <Label>Current Password</Label>
                                        <Input type="password" value={oldPassword} onChange={setOldPassword} icon={<Lock size={16} />} />
                                    </div>
                                    <div className="h-px bg-gray-100 my-4"></div>
                                    <div>
                                        <Label>New Password</Label>
                                        <Input type="password" value={newPassword} onChange={setNewPassword} icon={<Lock size={16} />} />
                                    </div>
                                    <div>
                                        <Label>Confirm New Password</Label>
                                        <Input type="password" value={confirmPassword} onChange={setConfirmPassword} icon={<Lock size={16} />} />
                                    </div>
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={isChangingPassword}
                                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors disabled:opacity-70 mt-4"
                                    >
                                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 p-8 shadow-sm mt-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                    <Bell size={14} /> Session Management
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">You are currently logged in from this browser. No other active sessions detected.</p>
                                <button className="text-red-500 text-xs font-bold uppercase tracking-widest hover:underline">
                                    Log out from all other devices
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

const Toggle: React.FC<{ label: string, checked: boolean, onChange?: (v: boolean) => void }> = ({ label, checked, onChange }) => {
    return (
        <div className="flex items-center justify-between group">
            <span className="text-xs font-bold text-gray-600 group-hover:text-black transition-colors">{label}</span>
            <button
                onClick={() => onChange && onChange(!checked)}
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

