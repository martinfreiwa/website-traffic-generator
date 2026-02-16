import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '../../services/db';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
    onSuccess: (role: 'user' | 'admin') => void;
    message?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', onSuccess, message }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'signup') {
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }
                await db.register(name, email, password);
                onClose();
                window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
            } else {
                const userData = await db.login(email, password);
                if (userData.status === 'suspended') {
                    throw new Error('Account suspended. Contact support.');
                }
                await db.syncAll();
                onSuccess(userData.role);
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
                >
                    <X size={18} className="text-gray-500" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl font-black text-[#ff4d00]">TRAFFIC</span>
                        <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded uppercase">Creator</span>
                    </div>

                    {message && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                            <span className="text-green-700 text-sm font-bold">{message}</span>
                        </div>
                    )}

                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMode('signup'); setError(''); }}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${mode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <AlertTriangle className="text-red-500 shrink-0" size={18} />
                            <span className="text-red-700 text-sm font-bold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'signup' && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {mode === 'signup' && password.length > 0 && password.length < 6 && (
                                <p className="text-red-500 text-xs mt-2 font-bold">Minimum 6 characters required</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#ff4d00] text-white p-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Processing...
                                </>
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
