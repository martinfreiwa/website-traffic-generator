
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
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
import AdminCreateProject from './AdminCreateProject';
import AdminErrorLogs from './AdminErrorLogs';
import AdminSimulatorTest from './AdminSimulatorTest'; // NEW
import ApiDocs from './ApiDocs';
import TrafficAnalytics from './TrafficAnalytics';

import { MenuSection, User, Project, PriceClass, Transaction, Ticket, SystemSettings, SystemAlert } from '../../types';
import { db } from '../../services/db';
import { Users, LayoutDashboard, Settings, Layers, CreditCard, MessageSquare, Megaphone, Zap, Radio, FileCode, AlertTriangle, Activity } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive currentView from pathname
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'admin-home';
    if (path.startsWith('/admin/users/edit/')) return 'admin-edit-user';
    if (path === '/admin/users') return 'admin-users';
    if (path === '/admin/live') return 'admin-live';
    if (path === '/admin/tickets') return 'admin-tickets';
    if (path.startsWith('/admin/projects/edit/')) return 'admin-edit-project';
    if (path === '/admin/projects') return 'admin-projects';
    if (path.startsWith('/admin/transactions/edit/')) return 'admin-edit-transaction';
    if (path === '/admin/transactions') return 'admin-transactions';
    if (path === '/admin/alerts') return 'admin-alerts';
    if (path === '/admin/demo') return 'admin-demo';
    if (path === '/admin/simulator') return 'admin-simulator'; // NEW
    if (path === '/admin/pricing') return 'admin-pricing';
    if (path === '/admin/settings') return 'admin-settings';
    if (path === '/admin/traffic') return 'admin-traffic';
    if (path === '/admin/api-docs') return 'admin-api-docs';
    if (path === '/admin/errors') return 'admin-errors'; // NEW
    if (path === '/admin/projects/create') return 'admin-projects'; // NEW
    return 'admin-home';
  };

  const currentView = getCurrentView();

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pricing, setPricing] = useState<PriceClass[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.init();
    const initData = async () => {
      await db.syncProjects();
      await refreshData();
      setLoading(false);
    };
    initData();
  }, []);

  const refreshData = async () => {
    try {
      const [usersData, projectsData, transactionsData, ticketsData, settingsData] = await Promise.all([
        db.getUsers(),
        db.getProjects(), // returns sync cache
        db.getAllTransactionsAdmin(),
        db.getTickets(),
        db.getSystemSettings()
      ]);

      setUsers(usersData);
      setProjects(projectsData);
      setTransactions(transactionsData);
      setTickets(ticketsData);
      if (settingsData) setSettings(settingsData);

      // These might still be sync or handled separately
      setPricing(db.getPricing());
      setAlerts(db.getAlerts());
    } catch (e) {
      console.error("Failed to refresh admin data:", e);
    }
  };

  const handleStartChatFromLive = (ticketId: string) => {
    const updatedTickets = db.getTickets();
    setTickets(updatedTickets);
    navigate('/admin/tickets');
  };

  const handleEditUser = (id: string) => {
    navigate(`/admin/users/edit/${id}`);
    window.scrollTo(0, 0);
  };

  const handleEditProject = (id: string) => {
    navigate(`/admin/projects/edit/${id}`);
    window.scrollTo(0, 0);
  };

  const handleEditTransaction = (id: string) => {
    navigate(`/admin/transactions/edit/${id}`);
    window.scrollTo(0, 0);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Admin Control',
      items: [
        { label: 'Overview', id: 'admin-home', path: '', icon: <LayoutDashboard size={18} /> },
        { label: 'Traffic Analytics', id: 'admin-traffic', path: 'traffic', icon: <Activity size={18} /> },
        { label: 'User Management', id: 'admin-users', path: 'users', icon: <Users size={18} /> },
        { label: 'Live Users', id: 'admin-live', path: 'live', icon: <Radio size={18} /> },
        { label: 'All Projects', id: 'admin-projects', path: 'projects', icon: <Layers size={18} /> },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Transactions', id: 'admin-transactions', path: 'transactions', icon: <CreditCard size={18} /> },
        { label: 'Support Tickets', id: 'admin-tickets', path: 'tickets', icon: <MessageSquare size={18} /> },
        { label: 'Broadcasts', id: 'admin-alerts', path: 'alerts', icon: <Megaphone size={18} /> },
        { label: 'Demo Generator', id: 'admin-demo', path: 'demo', icon: <Zap size={18} /> },
        { label: 'Simulator Test', id: 'admin-simulator', path: 'simulator', icon: <Radio size={18} /> }, // NEW
        { label: 'Error Logs', id: 'admin-errors', path: 'errors', icon: <AlertTriangle size={18} /> },
        { label: 'API Documentation', id: 'admin-api-docs', path: 'api-docs', icon: <FileCode size={18} /> },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Global Pricing', id: 'admin-pricing', path: 'pricing', icon: <CreditCard size={18} /> },
        { label: 'System Settings', id: 'admin-settings', path: 'settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  const AdminEditUserWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Error: No User ID selected</div>;
    return <AdminEditUser userId={id} onBack={() => navigate('/admin/users')} onUpdate={refreshData} />;
  };

  const AdminEditProjectWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Error: No Project ID selected</div>;
    return <AdminEditProject projectId={id} onBack={() => navigate('/admin/projects')} onUpdate={refreshData} />;
  };

  const AdminEditTransactionWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Error: No Transaction ID selected</div>;
    return <AdminEditTransaction trxId={id} onBack={() => navigate('/admin/transactions')} onUpdate={refreshData} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-gray-500 font-bold animate-pulse">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen flex font-sans text-gray-900">
      <Sidebar
        menuSections={menuSections}
        currentView={currentView}
        onNavigate={(id) => {
          // Map ID to sub-route
          const idToPath: Record<string, string> = {
            'admin-home': '',
            'admin-users': 'users',
            'admin-live': 'live',
            'admin-projects': 'projects',
            'admin-transactions': 'transactions',
            'admin-tickets': 'tickets',
            'admin-alerts': 'alerts',
            'admin-demo': 'demo',
            'admin-simulator': 'simulator', // NEW
            'admin-pricing': 'pricing',
            'admin-settings': 'settings',
            'admin-api-docs': 'api-docs',
            'admin-errors': 'errors', // NEW
            'admin-traffic': 'traffic'
          };
          navigate(`/admin/${idToPath[id] || ''}`);
          setMobileMenuOpen(false);
          window.scrollTo(0, 0);
        }}
        onLogout={onLogout}
      />
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        <Header title="Super Admin Panel" onMobileMenuClick={() => setMobileMenuOpen(true)} isAdmin={true} />
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto h-full">
            <Routes>
              <Route index element={
                <AdminOverview
                  users={users}
                  projects={projects}
                  tickets={tickets}
                  transactions={transactions}
                  onNavigate={(viewId) => {
                    const idToPath: Record<string, string> = {
                      'admin-users': 'users',
                      'admin-projects': 'projects',
                      'admin-tickets': 'tickets',
                      'admin-transactions': 'transactions'
                    };
                    navigate(`/admin/${idToPath[viewId] || ''}`);
                  }}
                />
              } />
              <Route path="users" element={
                <AdminUsers
                  users={users}
                  transactions={transactions}
                  tickets={tickets}
                  onRefresh={refreshData}
                  onEditUser={handleEditUser}
                />
              } />
              <Route path="users/edit/:id" element={<AdminEditUserWrapper />} />
              <Route path="live" element={<AdminLiveUsers onStartChat={handleStartChatFromLive} />} />
              <Route path="tickets" element={<AdminTickets tickets={tickets} onRefresh={refreshData} />} />
              <Route path="projects" element={
                <AdminProjects
                  projects={projects}
                  onEditProject={handleEditProject}
                  onCreateProject={() => navigate('/admin/projects/create')} // NEW
                />
              } />
              <Route path="projects/edit/:id" element={<AdminEditProjectWrapper />} />
              <Route path="projects/create" element={<AdminCreateProject onBack={() => navigate('/admin/projects')} onSuccess={() => { refreshData(); navigate('/admin/projects'); }} />} /> {/* NEW */}
              <Route path="transactions" element={<AdminTransactions transactions={transactions} onEditTransaction={handleEditTransaction} />} />
              <Route path="transactions/edit/:id" element={<AdminEditTransactionWrapper />} />
              <Route path="demo" element={<AdminDemoGen onSuccess={refreshData} />} />
              <Route path="simulator" element={<AdminSimulatorTest />} /> {/* NEW */}
              <Route path="alerts" element={<AdminBroadcasts alerts={alerts} onRefresh={refreshData} />} />
              <Route path="errors" element={<AdminErrorLogs />} /> {/* NEW */}
              <Route path="pricing" element={<PricingCard initialData={pricing} onSave={() => setPricing(db.getPricing())} />} />
              <Route path="settings" element={
                !settings ? <div>Loading...</div> : <AdminSettings initialSettings={settings} onSave={refreshData} />
              } />
              <Route path="api-docs" element={<ApiDocs />} />
              <Route path="traffic" element={<TrafficAnalytics />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
