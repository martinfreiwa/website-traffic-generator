import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Save, Camera, Mail, Terminal, Eye, EyeOff, RefreshCw, Copy, Phone, MapPin, Building2, Globe, Hash, CreditCard, Trash2, Plus, Home } from 'lucide-react';
import { db } from '../services/db';
import { User as UserType, PaymentMethod } from '../types';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'billing'>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [user, setUser] = useState<UserType | undefined>(undefined);
  
  // New Card State
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');

  useEffect(() => {
      const currentUser = db.getCurrentUser();
      setUser(currentUser);
  }, []);

  const handleSave = () => {
    if (!user) return;
    setIsLoading(true);
    
    // Simulate API save
    setTimeout(() => {
      db.updateUserProfile(user);
      setIsLoading(false);
      alert('Profile settings saved successfully.');
    }, 800);
  };

  const handleInputChange = (field: keyof UserType, value: string) => {
      if (user) {
          setUser({ ...user, [field]: value });
      }
  };

  const handleRegenerateKey = () => {
      if(confirm('Are you sure? This will invalidate your old key.')) {
          const newKey = db.regenerateApiKey('u1');
          if (user) setUser({...user, apiKey: newKey});
      }
  }

  const handleCopyKey = () => {
      if(user?.apiKey) {
          navigator.clipboard.writeText(user.apiKey);
          alert('API Key copied to clipboard');
      }
  }
  
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
            <div className="bg-white border border-gray-200 p-8 text-center shadow-sm">
                <div className="relative inline-block mb-6 group">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg mx-auto overflow-hidden">
                        <span className="text-4xl font-black text-gray-300">
                            {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>
                    <button className="absolute bottom-0 right-0 bg-[#ff4d00] text-white p-2 rounded-full hover:bg-black transition-colors shadow-md">
                        <Camera size={16} />
                    </button>
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
                    onClick={() => setActiveTab('account')}
                    className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${
                        activeTab === 'account' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <User size={16} /> Account Details
                </button>
                <button 
                    onClick={() => setActiveTab('billing')}
                    className={`w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 border-l-4 transition-colors ${
                        activeTab === 'billing' ? 'border-[#ff4d00] bg-gray-50 text-[#ff4d00]' : 'border-transparent text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <CreditCard size={16} /> Billing & Payments
                </button>
            </div>
            
             {/* Developer Settings (Always visible) */}
             <div className="bg-white border border-gray-200 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mt-16 -mr-16 z-0"></div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2 relative z-10">
                    <Terminal size={14} /> Developer Settings
                </h3>
                <div className="relative z-10">
                    <p className="text-sm text-gray-500 mb-4">Use this key to access the Modus Traffic API for programmatic campaign management.</p>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 flex justify-between items-center font-mono text-sm">
                            <span className="text-gray-800 font-bold">
                                {showApiKey ? user.apiKey : '••••••••••••••••••••••••••••••'}
                            </span>
                            <button onClick={() => setShowApiKey(!showApiKey)} className="text-gray-400 hover:text-black">
                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button 
                            onClick={handleCopyKey}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-3 border border-gray-200" title="Copy Key"
                        >
                            <Copy size={16} />
                        </button>
                        <button 
                            onClick={handleRegenerateKey}
                            className="bg-black hover:bg-[#ff4d00] text-white p-3 shadow-sm transition-colors" title="Regenerate Key"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
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
                                    value={user.name} 
                                    onChange={(v) => handleInputChange('name', v)} 
                                    icon={<User size={16} />}
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
                    <div className="bg-white border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Bell size={14} /> Notifications
                        </h3>
                        <div className="space-y-4">
                            <Toggle label="Campaign Alerts" checked={true} />
                            <Toggle label="Low Balance Warning" checked={true} />
                            <Toggle label="Marketing Emails" checked={false} />
                            <Toggle label="Weekly Reports" checked={true} />
                        </div>
                    </div>
                </>
            ) : (
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
                                <Plus size={12} /> Add New
                            </button>
                        </div>

                        {showAddCard && (
                            <div className="mb-6 p-6 bg-gray-50 border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <Label>Card Number</Label>
                                        <Input value={newCardNumber} onChange={setNewCardNumber} placeholder="0000 0000 0000 0000" />
                                    </div>
                                    <div>
                                        <Label>Expiry</Label>
                                        <Input value={newCardExpiry} onChange={setNewCardExpiry} placeholder="MM/YY" />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddCard}
                                    className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors"
                                >
                                    Save Card
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {(user.paymentMethods && user.paymentMethods.length > 0) ? (
                                user.paymentMethods.map(pm => (
                                    <div key={pm.id} className="border border-gray-200 p-6 flex justify-between items-center bg-[#f9fafb]">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-8 rounded-sm flex items-center justify-center text-white text-[10px] font-bold ${pm.type === 'visa' ? 'bg-[#1a1f71]' : 'bg-[#eb001b]'}`}>
                                                {pm.type === 'visa' ? 'VISA' : 'MC'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">•••• •••• •••• {pm.last4}</div>
                                                <div className="text-xs text-gray-400 font-medium">Expires {pm.expiry}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {pm.isDefault && <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm">Default</span>}
                                            <button onClick={() => handleDeleteCard(pm.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 text-gray-400 text-sm">No payment methods saved.</div>
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
            )}

        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{label: string, checked: boolean}> = ({label, checked: initialChecked}) => {
    const [checked, setChecked] = useState(initialChecked);
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">{label}</span>
            <button 
                onClick={() => setChecked(!checked)}
                className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 ${checked ? 'bg-[#ff4d00]' : 'bg-gray-200'}`}
            >
                <div className={`w-4 h-4 bg-white shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
        </div>
    )
}

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
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