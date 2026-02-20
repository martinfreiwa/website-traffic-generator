import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../services/db';
import { Loader2, AlertTriangle } from 'lucide-react';

const SSOHandler: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const returnPath = searchParams.get('return') || '/dashboard';

        if (!token) {
            setError('No token provided');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        db.validateSsoToken(token).then(async (result) => {
            if (result.valid && result.user && result.token) {
                localStorage.setItem('tgp_token', result.token);
                db.setCurrentUser(result.user);
                await db.syncAll();
                navigate(returnPath);
            } else {
                setError('Session validation failed. Please login again.');
                setTimeout(() => navigate('/login'), 2000);
            }
        }).catch(() => {
            setError('Session validation failed. Please login again.');
            setTimeout(() => navigate('/login'), 2000);
        });
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 mb-6">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <span className="text-red-700 text-xs font-bold">{error}</span>
                    </div>
                    <p className="text-gray-500 text-xs">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-[#ff4d00]" size={32} />
                <p className="text-sm text-gray-500 font-medium">Logging you in...</p>
            </div>
        </div>
    );
};

export default SSOHandler;
