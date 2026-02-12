import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Link, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import Header from './Header';
import ProjectList from './ProjectList';
import ProjectDetails from './ProjectDetails';
import AddProject from './AddProject';
import BuyCredits from './BuyCredits';
import Profile from './Profile';
import DeveloperSettings from './DeveloperSettings';
import Balance from './Balance';
import EnhancedBalance from './EnhancedBalance';
import Affiliate from './Affiliate';
import HomeDashboard from './HomeDashboard';
import Support from './Support';
import TrafficMonitor from './TrafficMonitor';
import { MenuSection, Project } from '../types';
import { LayoutDashboard, Layers, CreditCard, Banknote, BarChart3, HelpCircle, User, Share2, Activity as ActivityIcon, Construction, Terminal } from 'lucide-react';
import { db } from '../services/db';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (viewId: string) => void;
}

// Wrapper to extract ID from URL and pass to ProjectDetails
const ProjectDetailsWrapper: React.FC<{ onBack: () => void, onUpdate: () => void }> = ({ onBack, onUpdate }) => {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return <div>Invalid Project ID</div>;
  return <ProjectDetails projectId={projectId} onBack={onBack} onUpdate={onUpdate} />;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Database State
  const [projects, setProjects] = useState<Project[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize DB and fetch data
  useEffect(() => {
    db.init();
    const initData = async () => {
      await db.syncProjects();
      setProjects(db.getProjects());
      setBalance(db.getBalance());
      setLoading(false);
    };
    initData();
  }, []);

  // Handler to refresh data when changes occur in child components
  const handleDataChange = () => {
    setProjects(db.getProjects());
    setBalance(db.getBalance());
  };

  // Map URL path to "Current View" ID for Sidebar highlighting
  const getCurrentViewId = () => {
    const path = location.pathname.split('/').pop() || 'home';
    // Manual mapping for nested routes
    if (location.pathname.includes('/campaigns')) return 'overview';
    if (location.pathname.includes('/wallet')) return 'balance';
    if (location.pathname.includes('/billing')) return 'enhanced-balance';
    if (location.pathname.includes('/monitor')) return 'traffic-monitor';
    return path;
  };

  const handleSidebarNavigate = (id: string) => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);

    switch (id) {
      case 'home': navigate('/dashboard/home'); break;
      case 'overview': navigate('/dashboard/campaigns'); break;
      case 'traffic-monitor': navigate('/dashboard/monitor'); break;
      case 'buy-credits': navigate('/dashboard/buy-credits'); break;
      case 'balance': navigate('/dashboard/wallet'); break;
      case 'enhanced-balance': navigate('/dashboard/billing'); break;
      case 'support': navigate('/dashboard/support'); break;
      case 'profile': navigate('/dashboard/profile'); break;
      case 'developer': navigate('/dashboard/developer'); break;
      case 'affiliate': navigate('/dashboard/affiliate'); break;
      default: navigate('/dashboard/home');
    }
  };

  // Updated Menu Configuration
  const menuSections: MenuSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', id: 'home', icon: <LayoutDashboard size={18} /> },
        { label: 'Campaigns', id: 'overview', icon: <Layers size={18} />, active: location.pathname.includes('/campaigns') },
        { label: 'Traffic Monitor', id: 'traffic-monitor', icon: <ActivityIcon size={18} /> },
      ]
    },
    {
      title: 'Finance',
      items: [
        { label: 'Buy Credits', id: 'buy-credits', icon: <CreditCard size={18} /> },
        { label: 'Wallet & History', id: 'balance', icon: <Banknote size={18} /> },
        { label: 'Enhanced Billing', id: 'enhanced-balance', icon: <BarChart3 size={18} /> },
      ]
    },
    {
      title: 'User',
      items: [
        { label: 'Support Tickets', id: 'support', icon: <HelpCircle size={18} /> },
        { label: 'Profile & Billing', id: 'profile', icon: <User size={18} /> },
        { label: 'API & Developers', id: 'developer', icon: <Terminal size={18} /> },
        { label: 'Affiliate', id: 'affiliate', icon: <Share2 size={18} /> },
      ]
    }
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/campaigns/new')) return 'New Campaign';
    if (path.includes('/campaigns/')) return 'Campaign Details'; // Or specific name if we had it easily accessible
    if (path.includes('/campaigns')) return 'Campaigns';
    if (path.includes('/buy-credits')) return 'Wallet Top-Up';
    if (path.includes('/wallet')) return 'Wallet & Transactions';
    if (path.includes('/billing')) return 'Enhanced Billing';
    if (path.includes('/monitor')) return 'Real-time Traffic Monitor';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/developer')) return 'API & Developer Console';
    if (path.includes('/support')) return 'Support Helpdesk';
    if (path.includes('/affiliate')) return 'Affiliate Program';
    return 'Dashboard';
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#f3f4f6] text-gray-400 animate-pulse">
      <div className="w-8 h-8 bg-gray-300 mb-4 rounded-sm"></div>
      <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Database...</div>
    </div>
  );

  return (
    <div className="bg-[#f3f4f6] min-h-screen flex font-sans text-gray-900">
      <Sidebar
        menuSections={menuSections}
        currentView={getCurrentViewId()}
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="bg-[#111] text-white w-72 h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8 pb-8 flex items-center gap-3 border-b border-gray-800">
              <div className="w-8 h-8 bg-[#ff4d00] flex items-center justify-center">
                <span className="font-black text-black">T</span>
              </div>
              <span className="text-xl font-black tracking-tighter">TRAFFIC</span>
            </div>
            {menuSections.map((section, idx) => (
              <div key={idx} className="py-6 border-b border-gray-900">
                <ul>
                  {section.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSidebarNavigate(item.id)}
                        className={`w-full text-left px-8 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-3
                                        ${getCurrentViewId() === item.id ? 'text-[#ff4d00] bg-gray-900' : 'text-gray-400'}`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        <Header
          title={getPageTitle()}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />

        <div className="flex-1 p-6 md:p-12 overflow-y-auto relative">
          <div className="max-w-screen-2xl mx-auto">
            <Routes>
              <Route index element={<Navigate to="home" replace />} />

              <Route path="home" element={
                <HomeDashboard
                  projects={projects}
                  balance={balance}
                  onNavigateToProject={(id) => navigate(id ? `/dashboard/campaigns/${id}` : '/dashboard/campaigns')}
                  onNavigateToBuyCredits={() => navigate('/dashboard/buy-credits')}
                  onNavigateToAddProject={() => navigate('/dashboard/campaigns/new')}
                  onNavigateToCampaigns={() => navigate('/dashboard/campaigns')}
                />
              } />

              <Route path="campaigns" element={
                <ProjectList
                  projects={projects}
                  onUpdate={handleDataChange}
                  onNavigateToProject={(id) => navigate(`/dashboard/campaigns/${id}`)}
                  onAddProject={() => navigate('/dashboard/campaigns/new')}
                />
              } />

              <Route path="campaigns/new" element={
                <AddProject
                  onBack={() => navigate('/dashboard/campaigns')}
                  onCreated={() => {
                    handleDataChange();
                    navigate('/dashboard/campaigns');
                  }}
                />
              } />

              <Route path="campaigns/:projectId" element={
                <ProjectDetailsWrapper
                  onBack={() => navigate('/dashboard/campaigns')}
                  onUpdate={handleDataChange}
                />
              } />

              <Route path="buy-credits" element={
                <BuyCredits
                  onBack={() => navigate('/dashboard/home')}
                  onPurchase={handleDataChange}
                />
              } />

              <Route path="wallet" element={<Balance />} />
              <Route path="billing" element={<EnhancedBalance onBack={() => navigate('/dashboard/home')} />} />
              <Route path="monitor" element={<TrafficMonitor projects={projects} />} />
              <Route path="profile" element={<Profile />} />
              <Route path="developer" element={<DeveloperSettings />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="support" element={<Support />} />

              {/* Catch all for dashboard sub-routes */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-12 bg-white border border-gray-200 shadow-sm border-dashed">
                  <div className="bg-orange-50 p-6 rounded-full mb-6">
                    <Construction className="w-12 h-12 text-[#ff4d00]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Under Construction</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                    The requested module is not found or under construction.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard/home')}
                    className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              } />
            </Routes>
          </div>
        </div>

        {/* Dashboard Footer */}
        <footer className="px-12 py-8 border-t border-gray-200 mt-auto bg-white">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <Link to="/helpdesk" className="hover:text-[#ff4d00] transition-colors uppercase">Helpdesk</Link>
              <Link to="/legal/refund" className="hover:text-[#ff4d00] transition-colors uppercase">Refund Policy</Link>
              <Link to="/legal/delivery" className="hover:text-[#ff4d00] transition-colors uppercase">Delivery Policy</Link>
              <Link to="/legal/privacy" className="hover:text-[#ff4d00] transition-colors uppercase">Privacy Policy</Link>
              <Link to="/legal/terms" className="hover:text-[#ff4d00] transition-colors uppercase">Terms of Service</Link>
              <Link to="/legal/agb" className="hover:text-[#ff4d00] transition-colors uppercase">AGB</Link>
              <Link to="/legal/impressum" className="hover:text-[#ff4d00] transition-colors uppercase">Impressum</Link>
            </div>
            <div className="text-[10px] font-medium text-gray-400">
              © 2025 Traffic Creator Inc.
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default Dashboard;