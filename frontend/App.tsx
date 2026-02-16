
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './components/landing/LandingPage';
import OrganicWebsiteTraffic from './components/landing/OrganicWebsiteTraffic';
import ModernLandingPage from './components/landing/ModernLandingPage';
import Auth from './components/Auth';
import AdminPanel from './components/admin/AdminPanel';
import Legal from './components/Legal';
import HelpDesk from './components/helpdesk/HelpDesk';
import Blog from './components/blog/Blog';
import ChatWidget from './components/ChatWidget';
import PricingPage from './components/PricingPage';
import CookieConsent from './components/CookieConsent';
import VerifyEmail from './components/VerifyEmail';
import ResetPassword from './components/ResetPassword';
import { db } from './services/db';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
    const user = db.getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const LegalWrapper: React.FC = () => {
    const { type } = useParams<{ type: string }>();
    const navigate = useNavigate();

    const handleBack = () => {
        const user = db.getCurrentUser();
        if (user && (user.role === 'user' || user.role === 'admin')) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    };

    return <Legal type={type as any} onBack={handleBack} />;
};

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize DB on mount
    useEffect(() => {
        db.init();
    }, []);

    // Track Presence based on location
    useEffect(() => {
        const user = db.getCurrentUser();
        if (user) {
            // Map path to "view" for legacy support in presence tracking
            const path = location.pathname.substring(1) || 'landing';
            db.trackPresence(path, user);
        }
    }, [location]);

    const handleLogin = (role: 'user' | 'admin') => {
        if (role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
        window.scrollTo(0, 0);
    };

    const handleLogout = () => {
        navigate('/');
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        navigate('/');
        window.scrollTo(0, 0);
    };

    return (
        <>
            <Routes>
                <Route path="/" element={<LandingPage onLogin={() => navigate('/login')} onNavigate={(page) => navigate(`/${page}`)} />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Auth view="login" onLogin={handleLogin} onNavigate={(v) => navigate(`/${v}`)} />} />
                <Route path="/signup" element={<Auth view="signup" onLogin={handleLogin} onNavigate={(v) => navigate(`/${v}`)} />} />
                <Route path="/forgot" element={<Auth view="forgot" onLogin={handleLogin} onNavigate={(v) => navigate(`/${v}`)} />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route path="/dashboard/*" element={
                    <ProtectedRoute>
                        <Dashboard onLogout={handleLogout} onNavigate={(page) => navigate(`/${page}`)} />
                    </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                    <ProtectedRoute adminOnly>
                        <AdminPanel onLogout={handleLogout} />
                    </ProtectedRoute>
                } />

                {/* Other Pages */}
                <Route path="/helpdesk" element={<HelpDesk onBack={handleBack} />} />
                <Route path="/blog" element={<Blog onBack={handleBack} />} />
                <Route path="/blog/:slug" element={<Blog onBack={handleBack} />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Legal Routes */}
                <Route path="/legal/:type" element={<LegalWrapper />} />
                {/* Legacy legal paths for SEO mapping if needed, but parameter is better */}
                <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
                <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
                <Route path="/impressum" element={<Navigate to="/legal/impressum" replace />} />
                <Route path="/agb" element={<Navigate to="/legal/agb" replace />} />
                <Route path="/refund" element={<Navigate to="/legal/refund" replace />} />
                <Route path="/delivery" element={<Navigate to="/legal/delivery" replace />} />

                {/* Catch-all */}
                <Route path="/organic-website-traffic" element={<OrganicWebsiteTraffic onLogin={() => navigate('/login')} onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="/modern-traffic" element={<ModernLandingPage onLogin={() => navigate('/login')} onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ChatWidget />
            <CookieConsent />
        </>
    );
};

export default App;
