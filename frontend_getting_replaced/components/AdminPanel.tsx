import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import PricingCard from './PricingCard';
import { MenuSection, User, Project, PriceClass, Transaction, Ticket, SystemSettings, SystemAlert, ProjectSettings } from '../types';
import { db } from '../services/db';
import { sparkTrafficService } from '../services/sparkTraffic';
import { Users, LayoutDashboard, Settings, Layers, CreditCard, Ban, CheckCircle, Search, MessageSquare, AlertCircle, ArrowLeft, Download, User as UserIcon, Save, DollarSign, Plus, Minus, Megaphone, Trash2, ToggleLeft, ToggleRight, X, Key, Zap, Globe, Play, FileCode, Terminal } from 'lucide-react';

// Sub-components
import AdminApiApplications from './admin/AdminApiApplications';
import AdminTickets from './admin/AdminTickets';
import AdminBroadcasts from './admin/AdminBroadcasts';
import AdminDemoGen from './admin/AdminDemoGen';

interface AdminPanelProps {
  onLogout: () => void;
}

const RevenueChart = ({ transactions }: { transactions: Transaction[] }) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    const data = days.map(dayStr => {
        return transactions
            .filter(t => t.type === 'credit' && t.date === dayStr)
            .reduce((sum, t) => sum + t.amount, 0);
    });

    const max = Math.max(...data, 100);

    return (
        <div className="h-48 flex items-end justify-between gap-2">
            {data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group">
                    <div 
                        className="bg-black group-hover:bg-[#ff4d00] transition-colors rounded-t-sm w-full relative" 
                        style={{ height: `${(val / max) * 100}%`, minHeight: '4px' }}
                    >
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             €{val}
                         </div>
                    </div>
                    <div className="text-[9px] text-gray-400 text-center mt-2 font-mono">{days[i]}</div>
                </div>
            ))}
        </div>
    )
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('admin-home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pricing, setPricing] = useState<PriceClass[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // UI State for Fund Management
  const [fundAmount, setFundAmount] = useState('');
  const [fundReason, setFundReason] = useState('');

  useEffect(() => {
    db.init();
    refreshData();
  }, []);

  const refreshData = async () => {
    await db.syncAll();
    setUsers(db.getUsers());
    setProjects(db.getProjects());
    setPricing(db.getPricing());
    setTransactions(db.getTransactions());
    setTickets(db.getTickets());
    setSettings(db.getSystemSettings());
    setAlerts(db.getAlerts());
  };

  const handleUpdateUserStatus = (id: string, status: User['status']) => {
    const updated = db.updateUserStatus(id, status);
    setUsers(updated);
  };

  const handleSaveSettings = () => {
      if(settings) {
          db.saveSystemSettings(settings);
          alert('System settings updated.');
      }
  }

  const handleFundAdjustment = (type: 'credit' | 'debit') => {
      if (!selectedUserId || !fundAmount) return;
      const amount = parseFloat(fundAmount);
      if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

      db.adminAdjustBalance(selectedUserId, amount, type, fundReason || 'Manual Adjustment');
      setFundAmount('');
      setFundReason('');
      refreshData();
      alert(`Successfully ${type === 'credit' ? 'added' : 'removed'} funds.`);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Admin Control',
      items: [
        { label: 'Overview', id: 'admin-home', icon: <LayoutDashboard size={18} /> },
        { label: 'User Management', id: 'admin-users', icon: <Users size={18} /> },
        { label: 'All Projects', id: 'admin-projects', icon: <Layers size={18} /> },
      ]
    },
    {
        title: 'Operations',
        items: [
            { label: 'Transactions', id: 'admin-transactions', icon: <CreditCard size={18} /> },
            { label: 'API Requests', id: 'admin-api-apps', icon: <Terminal size={18} /> },
            { label: 'Support Tickets', id: 'admin-tickets', icon: <MessageSquare size={18} /> },
            { label: 'Broadcasts', id: 'admin-alerts', icon: <Megaphone size={18} /> },
            { label: 'Demo Generator', id: 'admin-create-demo', icon: <Zap size={18} /> },
        ]
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Global Pricing', id: 'admin-pricing', icon: <CreditCard size={18} /> },
        { label: 'System Settings', id: 'admin-settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  const renderUserDetails = () => {
      const user = users.find(u => u.id === selectedUserId);
      if (!user) return <div>User not found</div>;
      
      return (
          <div className="animate-in fade-in">
              <button onClick={() => setSelectedUserId(null)} className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black">
                  <ArrowLeft size={16} /> Back to Users
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white border border-gray-200 p-8 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 mb-6">User Profile: {user.name}</h3>
                          <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
                                  <div className="font-bold">{user.email}</div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">ID</label>
                                  <div className="font-mono text-gray-500">{user.id}</div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Role</label>
                                  <div className="uppercase font-bold">{user.role}</div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                                  <div className={`uppercase font-bold ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{user.status}</div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white border border-gray-200 p-8 shadow-sm">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                              <DollarSign size={14} /> Fund Management
                          </h3>
                          <div className="flex gap-4 items-end">
                              <div className="flex-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Amount</label>
                                  <input 
                                      type="number" 
                                      value={fundAmount} 
                                      onChange={(e) => setFundAmount(e.target.value)}
                                      className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold outline-none focus:border-[#ff4d00]"
                                      placeholder="0.00"
                                  />
                              </div>
                              <div className="flex-[2]">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Reason</label>
                                  <input 
                                      type="text" 
                                      value={fundReason} 
                                      onChange={(e) => setFundReason(e.target.value)}
                                      className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                      placeholder="Adjustment reason..."
                                  />
                              </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                              <button onClick={() => handleFundAdjustment('credit')} className="flex-1 bg-green-600 text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-green-700">Add Credit</button>
                              <button onClick={() => handleFundAdjustment('debit')} className="flex-1 bg-red-600 text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-red-700">Deduct Balance</button>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-[#111] text-white p-8">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</div>
                          <div className="text-4xl font-black text-[#ff4d00]">€{user.balance.toFixed(2)}</div>
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  const renderContent = () => {
    if (selectedUserId) {
        return renderUserDetails();
    }

    switch (currentView) {
      case 'admin-home':
        const totalRevenue = transactions.filter(t => t.type === 'credit').reduce((a,b) => a + b.amount, 0);
        return (
            <div className="space-y-6 animate-in fade-in">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Admin Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Users</div>
                        <div className="text-4xl font-black text-gray-900">{users.length}</div>
                    </div>
                    <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Active Projects</div>
                        <div className="text-4xl font-black text-gray-900">{projects.filter(p => p.status === 'active').length}</div>
                    </div>
                    <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Open Tickets</div>
                        <div className="text-4xl font-black text-gray-900">{tickets.filter(t => t.status === 'open').length}</div>
                    </div>
                    <div className="bg-white p-8 border border-gray-200 shadow-sm hover:border-[#ff4d00] transition-colors">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Revenue</div>
                        <div className="text-4xl font-black text-[#ff4d00]">€{totalRevenue.toFixed(0)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white p-8 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                             <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00]">Revenue Trend (7 Days)</h3>
                        </div>
                        <RevenueChart transactions={transactions} />
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Recent Registrations</h3>
                        </div>
                        <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-64">
                            {users.slice(0, 5).map(u => (
                                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                            {u.name ? u.name.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-900">{u.name}</div>
                                            <div className="text-[9px] text-gray-400">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{u.joinedDate}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
      
      case 'admin-users':
        return (
            <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">User Management</h2>
                    <div className="relative">
                        <input type="text" placeholder="Search users..." className="bg-white border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-[#ff4d00]" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#f9fafb] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Info</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-sm ${user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono font-bold">€{user.balance.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {user.status === 'active' ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Active</span>
                                        ) : (
                                            <span className="text-red-600 text-xs font-bold flex items-center gap-1"><Ban size={12}/> Suspended</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                                        <button 
                                            onClick={() => setSelectedUserId(user.id)}
                                            className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wide"
                                        >
                                            View Details
                                        </button>
                                        {user.role !== 'admin' && (
                                            <>
                                                <div className="w-px bg-gray-300 h-4"></div>
                                                {user.status === 'active' ? (
                                                    <button 
                                                        onClick={() => handleUpdateUserStatus(user.id, 'suspended')}
                                                        className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wide"
                                                    >
                                                        Ban User
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleUpdateUserStatus(user.id, 'active')}
                                                        className="text-xs font-bold text-green-500 hover:text-green-700 uppercase tracking-wide"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

      case 'admin-transactions':
        return (
            <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Global Transactions</h2>
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00]">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#f9fafb] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Trx ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map(trx => (
                                <tr key={trx.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{trx.id}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{trx.date}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{trx.userId || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{trx.desc}</td>
                                    <td className={`px-6 py-4 text-sm font-black text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                        {trx.type === 'credit' ? '+' : '-'}€{trx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

      case 'admin-api-apps': return <AdminApiApplications />;
      case 'admin-tickets': return <AdminTickets tickets={tickets} onRefresh={refreshData} />;
      case 'admin-alerts': return <AdminBroadcasts alerts={alerts} onRefresh={refreshData} />;
      case 'admin-create-demo': return <AdminDemoGen onSuccess={refreshData} />;
      case 'admin-pricing': return <PricingCard initialData={pricing} onSave={() => setPricing(db.getPricing())} />;
      
      case 'admin-settings':
          if(!settings) return <div>Loading...</div>;
          return (
              <div className="animate-in fade-in max-w-2xl">
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-6">System Settings</h2>
                  <div className="bg-white border border-gray-200 shadow-sm p-8 space-y-6">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Site Name</label>
                          <input 
                            value={settings.siteName}
                            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Support Email</label>
                          <input 
                            value={settings.supportEmail}
                            onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                          />
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                           <button 
                            onClick={handleSaveSettings}
                            className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
                           >
                               <Save size={14} /> Save Configuration
                           </button>
                      </div>
                  </div>
              </div>
          );

      case 'admin-projects':
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
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
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
                                    <td className="px-6 py-4 text-right">
                                         <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                                             p.status === 'active' ? 'bg-[#ff4d00] text-white' : 
                                             p.status === 'completed' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                                         }`}>
                                             {p.status}
                                         </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="bg-[#f3f4f6] min-h-screen flex font-sans text-gray-900">
        <Sidebar 
            menuSections={menuSections} 
            currentView={currentView}
            onNavigate={(id) => {
                setCurrentView(id);
                setMobileMenuOpen(false);
                window.scrollTo(0,0);
            }}
            onLogout={onLogout} 
        />
        <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
            <Header title="Super Admin Panel" onMobileMenuClick={() => setMobileMenuOpen(true)} isAdmin={true} />
            <div className="flex-1 p-6 md:p-12 overflow-y-auto">
                <div className="max-w-screen-2xl mx-auto h-full">
                    {renderContent()}
                </div>
            </div>
        </main>
    </div>
  );
};

export default AdminPanel;