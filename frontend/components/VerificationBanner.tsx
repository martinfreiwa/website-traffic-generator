import React, { useState } from 'react';
import { AlertTriangle, Mail, Loader2, X } from 'lucide-react';
import { db } from '../services/db';

interface VerificationBannerProps {
    email: string;
    onDismiss?: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ email, onDismiss }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleResend = async () => {
        setIsLoading(true);
        setError('');
        try {
            await db.resendVerificationEmail(email);
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        if (onDismiss) onDismiss();
    };

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="shrink-0" size={20} />
                        <div className="flex-1">
                            <p className="text-sm font-bold">
                                {sent ? (
                                    'Verification email sent! Check your inbox.'
                                ) : (
                                    <>
                                        Please verify your email address to create projects. Check your inbox or 
                                    </>
                                )}
                            </p>
                        </div>
                        {!sent && (
                            <button
                                onClick={handleResend}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={14} /> Resend Email
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
                {error && (
                    <div className="pb-3 text-xs font-medium text-white/90">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationBanner;
