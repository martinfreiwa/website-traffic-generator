
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import PricingCard from '../PricingCard';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminTickets from './AdminTickets';
import AdminDemoGen from './AdminDemoGen';
import AdminProjects from './AdminProjects';
import AdminTransactions from './AdminTransactions';
import AdminSettings from './AdminSettings';
import AdminBroadcasts from './AdminBroadcasts';
import AdminLiveUsers from './AdminLiveUsers';
import AdminEditUser from './AdminEditUser';
import AdminEditProject from './AdminEditProject';
import AdminEditTransaction from './AdminEditTransaction';

import { MenuSection, User, Project, PriceClass, Transaction, Ticket, SystemSettings, SystemAlert } from '../../types';
import { db } from '../../services/db';
import { Users, LayoutDashboard, Settings, Layers, CreditCard, MessageSquare, Megaphone, Zap, Radio } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('admin-home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pricing, setPricing] = useState<PriceClass[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    db.init();
    const initData = async () => {
        await db.syncProjects(); // Ensure admin sees latest projects from DB
        refreshData();
    };
    initData();
  }, []);

  const refreshData = () => {
    setUsers(db.getUsers());
    setProjects(db.getProjects());
    setPricing(db.getPricing());
    setTransactions(db.getTransactions());
    setTickets(db.getTickets());
    setSettings(db.getSystemSettings());
    setAlerts(db.getAlerts());
  };

  const handleStartChatFromLive = (ticketId: string) => {
      const updatedTickets = db.getTickets();
      setTickets(updatedTickets);
      setCurrentView('admin-tickets');
  };

  const handleEditUser = (id: string) => {
      setEditId(id);
      setCurrentView('admin-edit-user');
      window.scrollTo(0,0);
  };

  const handleEditProject = (id: string) => {
      setEditId(id);
      setCurrentView('admin-edit-project');
      window.scrollTo(0,0);
  };

  const handleEditTransaction = (id: string) => {
      setEditId(id);
      setCurrentView('admin-edit-transaction');
      window.scrollTo(0,0);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Admin Control',
      items: [
        { label: 'Overview', id: 'admin-home', icon: <LayoutDashboard size={18} /> },
        { label: 'User Management', id: 'admin-users', icon: <Users size={18} /> },
        { label: 'Live Users', id: 'admin-live', icon: <Radio size={18} /> },
        { label: 'All Projects', id: 'admin-projects', icon: <Layers size={18} /> },
      ]
    },
    {
        title: 'Operations',
        items: [
            { label: 'Transactions', id: 'admin-transactions', icon: <CreditCard size={18} /> },
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

  const renderContent = () => {
    switch (currentView) {
      case 'admin-home':
        return (
            <AdminOverview 
                users={users} 
                projects={projects} 
                tickets={tickets} 
                transactions={transactions} 
                onNavigate={setCurrentView} 
            />
        );
      
      case 'admin-users':
        return (
            <AdminUsers 
                users={users} 
                transactions={transactions} 
                tickets={tickets} 
                onRefresh={refreshData} 
                onEditUser={handleEditUser}
            />
        );
      
      case 'admin-edit-user':
          if (!editId) return <div>Error: No User ID selected</div>;
          return <AdminEditUser userId={editId} onBack={() => setCurrentView('admin-users')} onUpdate={refreshData} />;

      case 'admin-live':
          return <AdminLiveUsers onStartChat={handleStartChatFromLive} />;

      case 'admin-tickets':
        return <AdminTickets tickets={tickets} onRefresh={refreshData} />;

      case 'admin-projects':
        return <AdminProjects projects={projects} onEditProject={handleEditProject} />;

      case 'admin-edit-project':
          if (!editId) return <div>Error: No Project ID selected</div>;
          return <AdminEditProject projectId={editId} onBack={() => setCurrentView('admin-projects')} onUpdate={refreshData} />;

      case 'admin-transactions':
        return <AdminTransactions transactions={transactions} onEditTransaction={handleEditTransaction} />;

      case 'admin-edit-transaction':
          if (!editId) return <div>Error: No Transaction ID selected</div>;
          return <AdminEditTransaction trxId={editId} onBack={() => setCurrentView('admin-transactions')} onUpdate={refreshData} />;
      
      case 'admin-create-demo':
          return <AdminDemoGen onSuccess={refreshData} />;

      case 'admin-alerts':
          return <AdminBroadcasts alerts={alerts} onRefresh={refreshData} />;

      case 'admin-pricing':
        return <PricingCard initialData={pricing} onSave={() => setPricing(db.getPricing())} />;
      
      case 'admin-settings':
          if(!settings) return <div>Loading...</div>;
          return <AdminSettings initialSettings={settings} onSave={refreshData} />;

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
                setEditId(null);
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
