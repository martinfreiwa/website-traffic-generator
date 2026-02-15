import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, ArrowRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';

interface AuthProps {
    onLogin: (role: 'user' | 'admin') => void;
    onNavigate: (view: 'landing' | 'signup' | 'login' | 'forgot') => void;
    view: 'login' | 'signup' | 'forgot';
}

const Auth: React.FC<AuthProps> = ({ onLogin, onNavigate, view }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showResendOption, setShowResendOption] = useState(false);

    const handleResendVerification = async () => {
        if (!email) return;
        setIsLoading(true);
        try {
            await db.resendVerificationEmail(email);
            setSuccess('Verification email sent! Check your inbox.');
            setShowResendOption(false);
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        setShowResendOption(false);

        try {
            if (view === 'signup') {
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }

                await db.register(name, email, password);
                setSuccess('Account created! Please check your email to verify your account before logging in.');
                setEmail('');
                setPassword('');
                setName('');

            } else if (view === 'login') {
                const userData = await db.login(email, password);

                if (userData.status === 'suspended') {
                    throw new Error('Your account has been suspended. Please contact support.');
                }

                await db.syncAll();
                onLogin(userData.role);

            } else if (view === 'forgot') {
                await db.forgotPassword(email);
                setSuccess('Password reset link sent! Check your email.');
                setEmail('');
            }
        } catch (err: any) {
            const errorMsg = err.message || 'An error occurred';
            setError(errorMsg);

            if (errorMsg.toLowerCase().includes('verify') || errorMsg.toLowerCase().includes('verification')) {
                setShowResendOption(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">

                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors mb-8 text-xs font-bold uppercase tracking-wider">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="flex items-center gap-2 mb-8">
                    <span className="text-3xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                    <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div className="flex-1">
                            <span className="text-red-700 text-xs font-bold leading-relaxed">{error}</span>
                            {showResendOption && (
                                <button
                                    onClick={handleResendVerification}
                                    className="block mt-2 text-[#ff4d00] text-xs font-bold underline hover:no-underline"
                                >
                                    Resend verification email
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 flex items-center gap-3">
                        <CheckCircle className="text-green-500 shrink-0" size={20} />
                        <span className="text-green-700 text-xs font-bold leading-relaxed">{success}</span>
                    </div>
                )}

                {view === 'forgot' ? (
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Reset Password</h1>
                        <p className="text-gray-500 mb-8">Enter your email address and we'll send you a link to reset your password.</p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} /> Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                            <div className="text-center">
                                <Link to="/login" className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-black">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <p className="text-gray-500 mb-8">
                            {view === 'login' ? 'Enter your credentials to access your dashboard.' : 'Start your first traffic campaign today.'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {view === 'signup' && (
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Password</label>
                                    {view === 'login' && (
                                        <Link to="/forgot" className="text-[10px] font-bold text-[#ff4d00] uppercase tracking-wider hover:text-black">Forgot?</Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                        placeholder={view === 'signup' ? 'Min. 6 characters' : '••••••••'}
                                    />
                                </div>
                                {view === 'signup' && password.length > 0 && password.length < 6 && (
                                    <p className="text-red-500 text-xs mt-1 font-bold">Password must be at least 6 characters</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} /> Processing...
                                    </>
                                ) : (
                                    <>
                                        {view === 'login' ? 'Sign In' : 'Get Started'} <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center pt-8 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                                {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                            </p>
                            <Link
                                to={view === 'login' ? '/signup' : '/login'}
                                className="text-sm font-black text-gray-900 hover:text-[#ff4d00] uppercase tracking-wide block"
                            >
                                {view === 'login' ? 'Create Account' : 'Login Here'}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
