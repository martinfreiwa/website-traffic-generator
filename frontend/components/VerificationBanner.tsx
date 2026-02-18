import React, { useState, useRef } from 'react';
import { AlertTriangle, Mail, Loader2, X, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../services/db';

interface VerificationBannerProps {
    email: string;
    onDismiss?: () => void;
    onVerified?: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ email, onDismiss, onVerified }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [dismissed, setDismissed] = useState(false);
    const [code, setCode] = useState(['', '', '', '']);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newCode.every(digit => digit !== '') && newCode.join('').length === 4) {
            verifyCode(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        const newCode = [...code];
        pastedData.split('').forEach((char, i) => {
            if (i < 4) newCode[i] = char;
        });
        setCode(newCode);
        if (newCode.every(digit => digit !== '')) {
            verifyCode(newCode.join(''));
        }
    };

    const verifyCode = async (codeStr: string) => {
        setStatus('loading');
        setMessage('');
        try {
            await db.verifyEmail(codeStr);
            setStatus('success');
            setMessage('Email verified successfully!');
            if (onVerified) onVerified();
            setTimeout(() => {
                setDismissed(true);
            }, 2000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Invalid code. Please try again.');
            setCode(['', '', '', '']);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    };

    const resetInput = () => {
        setCode(['', '', '', '']);
        setStatus('idle');
        setMessage('');
        inputRefs.current[0]?.focus();
    };

    if (status === 'success') {
        return (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center py-3 gap-3">
                        <CheckCircle className="shrink-0" size={20} />
                        <p className="text-sm font-bold">{message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="shrink-0" size={20} />
                        <div className="flex-1">
                            <p className="text-sm font-bold">
                                {sent ? (
                                    'Verification email sent! Check your inbox.'
                                ) : (
                                    'Please verify your email address to create projects.'
                                )}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex gap-1.5">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleCodeChange(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    disabled={status === 'loading'}
                                    className="w-9 h-10 text-center text-lg font-bold border-2 border-white/40 rounded-lg focus:border-white focus:outline-none bg-white/20 text-white placeholder-white/50 disabled:opacity-50"
                                    placeholder="0"
                                />
                            ))}
                        </div>

                        {status === 'loading' && (
                            <Loader2 className="animate-spin" size={18} />
                        )}

                        {status === 'error' && (
                            <button
                                onClick={resetInput}
                                className="flex items-center gap-1 bg-red-500/80 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                                <XCircle size={14} /> Retry
                            </button>
                        )}

                        {status === 'idle' && (
                            <button
                                onClick={handleResend}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={14} /> Resend
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
                
                {error && (
                    <div className="pt-2 text-xs font-medium text-white/90">
                        {error}
                    </div>
                )}
                
                {status === 'error' && message && (
                    <div className="pt-2 text-xs font-medium text-white/90">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationBanner;
