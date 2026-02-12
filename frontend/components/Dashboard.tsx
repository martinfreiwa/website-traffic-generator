
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import Header from './Header';
import BroadcastBanner from './BroadcastBanner';
import ProjectList from './ProjectList';
import ProjectDetails from './ProjectDetails';
import AddProject from './AddProject';
import BuyCredits from './BuyCredits';
import Profile from './Profile';
import Balance from './Balance';
import Affiliate from './Affiliate';
import HomeDashboard from './HomeDashboard';
import Support from './Support';
import { MenuSection, Project } from '../types';
import { MessageSquare, TrendingUp, Users, CreditCard, Activity, Construction, LayoutDashboard, Layers, User, Banknote, Share2, HelpCircle } from 'lucide-react';
import { db } from '../services/db';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (viewId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

  const handleNavigateToProject = (id: string) => {
    if (id === '') {
      setCurrentView('overview');
    } else {
      setSelectedProjectId(id);
      setCurrentView('project-details');
    }
    window.scrollTo(0, 0);
  };

  // Updated Menu Configuration
  const menuSections: MenuSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', id: 'home', icon: <LayoutDashboard size={18} /> },
        { label: 'Campaigns', id: 'overview', icon: <Layers size={18} />, active: currentView === 'overview' || currentView === 'project-details' || currentView === 'add-project' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { label: 'Buy Credits', id: 'buy-credits', icon: <CreditCard size={18} /> },
        { label: 'Wallet & History', id: 'balance', icon: <Banknote size={18} /> },
      ]
    },
    {
      title: 'User',
      items: [
        { label: 'Support Tickets', id: 'support', icon: <HelpCircle size={18} /> },
        { label: 'Profile & Billing', id: 'profile', icon: <User size={18} /> },
        { label: 'Affiliate', id: 'affiliate', icon: <Share2 size={18} /> },
      ]
    }
  ];

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 mb-4 rounded-sm"></div>
        <div className="text-xs font-bold uppercase tracking-widest">Loading Database...</div>
      </div>
    );

    switch (currentView) {
      case 'home':
        return (
          <HomeDashboard
            projects={projects}
            balance={balance}
            onNavigateToProject={handleNavigateToProject}
            onNavigateToBuyCredits={() => {
              setCurrentView('buy-credits');
              window.scrollTo(0, 0);
            }}
          />
        );
      case 'overview':
        return (
          <ProjectList
            projects={projects}
            onUpdate={handleDataChange}
            onNavigateToProject={handleNavigateToProject}
            onAddProject={() => {
              setCurrentView('add-project');
              window.scrollTo(0, 0);
            }}
          />
        );
      case 'project-details':
        if (!selectedProjectId) return <div>No Project Selected</div>;
        return (
          <ProjectDetails
            projectId={selectedProjectId}
            onBack={() => setCurrentView('overview')}
            onUpdate={handleDataChange}
          />
        );
      case 'add-project':
        return (
          <AddProject
            onBack={() => setCurrentView('overview')}
            onCreated={handleDataChange}
          />
        );
      case 'buy-credits':
        return <BuyCredits onBack={() => setCurrentView('home')} onPurchase={handleDataChange} />;
      case 'profile':
        return <Profile />;
      case 'balance':
        return <Balance />;
      case 'affiliate':
        return <Affiliate />;
      case 'support':
        return <Support />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-12 bg-white border border-gray-200 shadow-sm border-dashed">
            <div className="bg-orange-50 p-6 rounded-full mb-6">
              <Construction className="w-12 h-12 text-[#ff4d00]" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Under Construction</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              The <span className="font-bold text-gray-900">{currentView.replace(/-/g, ' ')}</span> module is currently being upgraded to our new V2 architecture.
            </p>
            <button
              onClick={() => setCurrentView('overview')}
              className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'overview': return 'Campaigns';
      case 'home': return 'Dashboard';
      case 'project-details': return 'Campaign Configuration';
      case 'add-project': return 'New Campaign';
      case 'buy-credits': return 'Wallet Top-Up';
      case 'profile': return 'My Profile';
      case 'balance': return 'Wallet & Transactions';
      case 'affiliate': return 'Affiliate Program';
      case 'support': return 'Support Helpdesk';
      default: return currentView.replace(/-/g, ' ');
    }
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen flex font-sans text-gray-900">
      <Sidebar
        menuSections={menuSections}
        currentView={currentView === 'project-details' || currentView === 'add-project' ? 'overview' : currentView}
        onNavigate={(id) => {
          setCurrentView(id);
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
              <span className="text-xl font-black tracking-tighter">TRAFFIC</span>
            </div>
            {menuSections.map((section, idx) => (
              <div key={idx} className="py-6 border-b border-gray-900">
                <ul>
                  {section.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setCurrentView(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-8 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-3
                                        ${currentView === item.id ? 'text-[#ff4d00] bg-gray-900' : 'text-gray-400'}`}
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
        <Header
          title={getPageTitle()}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />

        <div className="flex-1 p-6 md:p-12 overflow-y-auto relative">
          <div className="max-w-screen-2xl mx-auto">
            {renderContent()}
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
