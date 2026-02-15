import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { db } from '../services/db';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Invalid reset link. No token provided.');
            return;
        }

        setIsLoading(true);

        try {
            await db.resetPassword(token, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Password reset failed. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors mb-8 text-xs font-bold uppercase tracking-wider">
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-2 mb-8">
                        <span className="text-3xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                        <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
                    </div>

                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-500" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Invalid Link</h1>
                        <p className="text-gray-500 mb-8">This password reset link is invalid or has expired.</p>
                        <Link to="/forgot" className="block w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors text-center">
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors mb-8 text-xs font-bold uppercase tracking-wider">
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-2 mb-8">
                        <span className="text-3xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                        <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
                    </div>

                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-500" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Password Reset!</h1>
                        <p className="text-gray-500 mb-8">Your password has been successfully reset. You can now log in with your new password.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Continue to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors mb-8 text-xs font-bold uppercase tracking-wider">
                    Back to Home
                </Link>

                <div className="flex items-center gap-2 mb-8">
                    <span className="text-3xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                    <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-500 mb-8">Enter your new password below.</p>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <span className="text-red-700 text-xs font-bold leading-relaxed">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 pr-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                placeholder="Min. 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-sm font-medium text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
                                placeholder="Confirm your password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} /> Resetting...
                            </>
                        ) : (
                            <>
                                Reset Password <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
