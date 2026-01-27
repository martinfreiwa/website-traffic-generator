
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/landing/LandingPage';
import Auth from './components/Auth';
import AdminPanel from './components/admin/AdminPanel';
import Legal from './components/Legal';
import HelpDesk from './components/helpdesk/HelpDesk';
import Blog from './components/blog/Blog';
import ChatWidget from './components/ChatWidget';
import { db } from './services/db';

type View = 'landing' | 'dashboard' | 'admin' | 'login' | 'signup' | 'forgot' | 'privacy' | 'terms' | 'impressum' | 'agb' | 'refund' | 'delivery' | 'helpdesk' | 'blog';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');

  // Initialize DB on mount
  useEffect(() => {
      db.init();
  }, []);

  // Track Presence (Only if logged in check handled within db service)
  useEffect(() => {
      const user = db.getCurrentUser();
      // We pass the local user object, but the db service will validate firebase auth
      if (user) {
          db.trackPresence(currentView, user);
      }
  }, [currentView]);

  const handleLogin = (role: 'user' | 'admin') => {
    if (role === 'admin') {
        setCurrentView('admin');
    } else {
        setCurrentView('dashboard');
    }
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setCurrentView('landing');
    window.scrollTo(0, 0);
  };

  const handleLegalBack = () => {
      // Smart back button: if logged in, go to dashboard, else landing
      const user = db.getCurrentUser();
      if (user && (user.role === 'user' || user.role === 'admin')) {
          setCurrentView('dashboard');
      } else {
          setCurrentView('landing');
      }
      window.scrollTo(0, 0);
  };

  const renderView = () => {
      switch(currentView) {
          case 'landing':
              return <LandingPage onLogin={() => setCurrentView('login')} onNavigate={(page) => setCurrentView(page as View)} />;
          case 'dashboard':
              return <Dashboard onLogout={handleLogout} onNavigate={(page) => setCurrentView(page as View)} />;
          case 'admin':
              return <AdminPanel onLogout={handleLogout} />;
          case 'login':
          case 'signup':
          case 'forgot':
              return <Auth view={currentView} onLogin={handleLogin} onNavigate={(v) => setCurrentView(v)} />;
          case 'privacy':
          case 'terms':
          case 'impressum':
          case 'agb':
          case 'refund':
          case 'delivery':
              return <Legal type={currentView} onBack={handleLegalBack} />;
          case 'helpdesk':
              return <HelpDesk onBack={handleLegalBack} />;
          case 'blog':
              return <Blog onBack={handleLegalBack} />;
          default:
              return <LandingPage onLogin={() => setCurrentView('login')} onNavigate={(page) => setCurrentView(page as View)} />;
      }
  }

  return (
    <>
      {renderView()}
      <ChatWidget />
    </>
  );
};

export default App;
