import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { db } from '../services/db';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. No token provided.');
            return;
        }

        const verifyToken = async () => {
            try {
                await db.verifyEmail(token);
                setStatus('success');
                setMessage('Your email has been verified successfully! You can now log in and create projects.');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Verification failed. The link may have expired.');
            }
        };

        verifyToken();
    }, [searchParams]);

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

                {status === 'loading' && (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin mx-auto mb-4 text-[#ff4d00]" size={48} />
                        <p className="text-gray-500 font-medium">Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-500" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Email Verified!</h1>
                        <p className="text-gray-500 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Continue to Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-red-500" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Verification Failed</h1>
                        <p className="text-gray-500 mb-8">{message}</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                Back to Login
                            </button>
                            <Link to="/signup" className="block text-center text-sm font-bold text-gray-400 hover:text-[#ff4d00]">
                                Create a new account
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
