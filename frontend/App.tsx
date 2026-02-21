
import React, { useEffect, ReactNode, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './components/landing/LandingPage';
import OrganicWebsiteTraffic from './components/landing/OrganicWebsiteTraffic';
import ModernLandingPage from './components/landing/ModernLandingPage';
import ConversionLandingPage from './components/landing/ConversionLandingPage';
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
import SSOHandler from './components/SSOHandler';
import { db } from './services/db';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
    const [state, setState] = useState<ErrorBoundaryState>({ hasError: false, error: null });

    const handleError = (error: Error) => {
        setState({ hasError: true, error });
    };

    React.useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            handleError(event.reason);
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    if (state.hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                    <p className="text-gray-600 mb-4">{state.error?.message}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-[#ff4d00] text-white px-6 py-2 rounded font-bold"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

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
        <ErrorBoundary>
            <Routes>
                <Route path="/" element={<LandingPage onLogin={() => navigate('/login')} onNavigate={(page) => navigate(`/${page}`)} />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Auth view="login" onLogin={handleLogin} onNavigate={(v) => navigate(`/${v}`)} />} />
                <Route path="/signup" element={<Auth view="signup" onLogin={handleLogin} onNavigate={(v) => navigate(`/${v}`)} />} />
                <Route path="/forgot" element={<Auth view="forgot" onLogin={handleLogin} onNavigate={(v) => navigate(`/${v}`)} />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/sso" element={<SSOHandler />} />

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
                <Route path="/free-website-traffic" element={<ConversionLandingPage onLogin={() => navigate('/login')} onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="/landing2" element={<ConversionLandingPage onLogin={() => navigate('/login')} onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* <ChatWidget /> */}
            <CookieConsent />
        </ErrorBoundary>
    );
};

export default App;
