
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Link, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import Header from './Header';
import BroadcastBanner from './BroadcastBanner';
import VerificationBanner from './VerificationBanner';
import ProjectList from './ProjectList';
import ProjectDetails from './ProjectDetails';
import AddProject from './AddProject';
import BuyCredits from './BuyCredits';
import Profile from './Profile';
import Balance from './Balance';
import Affiliate from './Affiliate';
import HomeDashboard from './HomeDashboard';
import Support from './Support';
import PricingPage from './PricingPage';
import Billing from './Billing';
import Gamification from './Gamification';
import PaymentSuccess from './PaymentSuccess';
import FreeTraffic from './FreeTraffic';
import { MenuSection, Project } from '../types';
import { MessageSquare, TrendingUp, Users, CreditCard, Activity, Construction, LayoutDashboard, Layers, User, Banknote, Share2, HelpCircle, Receipt, Star, Gift } from 'lucide-react';
import { db } from '../services/db';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (viewId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current view from path for Sidebar highlighting
  const currentPath = location.pathname.replace('/dashboard', '').substring(1) || 'home';

  // Database State
  const [projects, setProjects] = useState<Project[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize DB and fetch data
  useEffect(() => {
    db.init();
    const initData = async () => {
      await db.syncProjects(); // Sync projects from Firestore
      setProjects(db.getProjects());
      setBalance(db.getMaxTierBalance());
      setLoading(false);
    };
    initData();
  }, []);

  // Handler to refresh data when changes occur in child components
  const handleDataChange = () => {
    setProjects(db.getProjects());
    setBalance(db.getBalance());
  };

  const handleNavigateToProject = (id: string) => {
    if (id === '') {
      navigate('/dashboard/campaigns');
    } else {
      navigate(`/dashboard/campaigns/${id}`);
    }
    window.scrollTo(0, 0);
  };

  // Updated Menu Configuration
  const menuSections: MenuSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', id: 'home', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Campaigns', id: 'campaigns', path: '/dashboard/campaigns', icon: <Layers size={18} />, active: currentPath.startsWith('campaigns') },
        { label: 'Free Traffic', id: 'free-traffic', path: '/dashboard/free-traffic', icon: <Gift size={18} /> },
      ]
    },
    {
      title: 'Finance',
      items: [
        { label: 'Billing', id: 'billing', path: '/dashboard/billing', icon: <Receipt size={18} /> },
        { label: 'Buy Credits', id: 'buy-credits', path: '/dashboard/buy-credits', icon: <CreditCard size={18} /> },
        { label: 'Balance', id: 'balance', path: '/dashboard/balance', icon: <Banknote size={18} /> },
      ]
    },
    {
      title: 'Account',
      items: [
        { label: 'Gamification', id: 'gamification', path: '/dashboard/gamification', icon: <Star size={18} /> },
        { label: 'Support Tickets', id: 'support', path: '/dashboard/support', icon: <HelpCircle size={18} /> },
        { label: 'Profile', id: 'profile', path: '/dashboard/profile', icon: <User size={18} /> },
        { label: 'Affiliate', id: 'affiliate', path: '/dashboard/affiliate', icon: <Share2 size={18} /> },
      ]
    }
  ];

  const getPageTitle = () => {
    if (currentPath === 'home' || currentPath === '') return 'Dashboard';
    if (currentPath.startsWith('campaigns')) return 'Campaigns';
    if (currentPath === 'free-traffic') return 'Free Traffic';
    if (currentPath === 'billing') return 'Billing & Payments';
    if (currentPath === 'buy-credits') return 'Wallet Top-Up';
    if (currentPath === 'gamification') return 'Gamification';
    if (currentPath === 'profile') return 'My Profile';
    if (currentPath === 'balance') return 'Balance';
    if (currentPath === 'affiliate') return 'Affiliate Program';
    if (currentPath === 'support') return 'Support Helpdesk';
    if (currentPath === 'payment-success') return 'Payment Successful';
    return currentPath.replace(/-/g, ' ');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-400 animate-pulse bg-[#f3f4f6]">
      <div className="w-8 h-8 bg-gray-200 mb-4 rounded-sm"></div>
      <div className="text-xs font-bold uppercase tracking-widest">Loading Database...</div>
    </div>
  );



  return (
    <div className="bg-[#f3f4f6] min-h-screen flex font-sans text-gray-900">
      <Sidebar
        menuSections={menuSections}
        currentView={currentPath.startsWith('campaigns') ? 'campaigns' : (currentPath === '' ? 'home' : currentPath)}
        onNavigate={(viewId) => {
          // Find the item in menuSections to get its path
          const allItems = menuSections.flatMap(s => s.items);
          const item = allItems.find(i => i.id === viewId);
          if (item?.path) {
            navigate(item.path);
          } else {
            // Fallback for home or if path is missing
            navigate('/dashboard');
          }
          setMobileMenuOpen(false);
          window.scrollTo(0, 0);
        }}
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
              <span className="text-xl font-black tracking-tighter">TRAFFIC BOT</span>
            </div>
            {menuSections.map((section, idx) => (
              <div key={idx} className="py-6 border-b border-gray-900">
                <ul>
                  {section.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          navigate(item.path || '/dashboard');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-8 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-3
                                        ${currentPath === item.id ? 'text-[#ff4d00] bg-gray-900' : 'text-gray-400'}`}
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
        <BroadcastBanner />

        {!db.getCurrentUser()?.isVerified && db.getCurrentUser()?.email && (
          <VerificationBanner
            email={db.getCurrentUser()!.email}
            onVerified={() => {
              const user = db.getCurrentUser();
              if (user) {
                user.isVerified = true;
                localStorage.setItem('modus_current_user', JSON.stringify(user));
              }
            }}
          />
        )}

        {/* Impersonation Banner */}
        {localStorage.getItem('tgp_admin_token') && (
          <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-lg relative z-50">
            <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
              <User size={18} />
              <span>Viewing as User Mode</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await db.stopImpersonation();
                  window.location.href = '/admin';
                } catch (e) {
                  alert('Failed to return to admin');
                }
              }}
              className="bg-white text-red-600 px-4 py-1.5 rounded text-xs font-bold uppercase hover:bg-red-50"
            >
              Return to Admin
            </button>
          </div>
        )}

        <Header
          title={getPageTitle()}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />

        <div className="flex-1 p-6 md:p-12 overflow-y-auto relative">
          <div className="max-w-screen-2xl mx-auto">
            <Routes>
              <Route path="/" element={
                <HomeDashboard
                  projects={projects}
                  balance={balance}
                  onNavigateToProject={handleNavigateToProject}
                  onNavigateToBuyCredits={() => navigate('/dashboard/buy-credits')}
                  onNavigateToSupport={() => navigate('/dashboard/support')}
                />
              } />

              <Route path="/campaigns" element={
                <ProjectList
                  projects={projects}
                  onUpdate={handleDataChange}
                  onNavigateToProject={handleNavigateToProject}
                  onAddProject={() => navigate('/dashboard/campaigns/new')}
                />
              } />

              <Route path="/campaigns/new" element={
                <AddProject
                  onBack={() => navigate('/dashboard/campaigns')}
                  onCreated={handleDataChange}
                />
              } />

              <Route path="/campaigns/:projectId" element={<ProjectDetailsWrapper onUpdate={handleDataChange} />} />

              <Route path="/buy-credits" element={<BuyCredits onBack={() => navigate('/dashboard')} onPurchase={handleDataChange} />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/balance" element={<Balance />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/affiliate" element={<Affiliate />} />
              <Route path="/support" element={<Support />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/free-traffic" element={<FreeTraffic />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
              © 2024 EasyTrafficBot UG
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

// Wrapper component to handle useParams for ProjectDetails
const ProjectDetailsWrapper: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  if (!projectId) return <div>Invalid Project ID</div>;

  return (
    <ProjectDetails
      projectId={projectId}
      onBack={() => navigate('/dashboard/campaigns')}
      onUpdate={onUpdate}
    />
  );
};

export default Dashboard;
