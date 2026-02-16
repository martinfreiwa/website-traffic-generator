import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { db } from '../services/db';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'input' | 'loading' | 'success' | 'error'>('input');
    const [message, setMessage] = useState('');
    const [code, setCode] = useState(['', '', '', '']);
    const [email, setEmail] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

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

    const verifyCode = async (code: string) => {
        setStatus('loading');
        try {
            await db.verifyEmail(code);
            setStatus('success');
            setMessage('Your email has been verified successfully! You can now log in and create projects.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Verification failed. The code may have expired.');
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setResendStatus('sending');
        try {
            await db.resendVerificationEmail(email);
            setResendStatus('sent');
        } catch {
            setResendStatus('idle');
        }
    };

    const resetInput = () => {
        setCode(['', '', '', '']);
        setStatus('input');
        setMessage('');
        inputRefs.current[0]?.focus();
    };

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

                {status === 'input' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="text-[#ff4d00]" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Enter Verification Code</h1>
                        <p className="text-gray-500 mb-8">
                            We've sent a 4-digit code to your email. Enter it below to verify your account.
                        </p>
                        
                        <div className="flex justify-center gap-3 mb-6">
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
                                    className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#ff4d00] focus:outline-none transition-colors"
                                />
                            ))}
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            The code expires in 24 hours
                        </p>

                        {email && (
                            <button
                                onClick={handleResend}
                                disabled={resendStatus !== 'idle'}
                                className="text-sm text-[#ff4d00] hover:text-[#e64500] font-medium disabled:text-gray-400"
                            >
                                {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Code sent!' : "Didn't receive a code? Resend"}
                            </button>
                        )}
                    </div>
                )}

                {status === 'loading' && (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin mx-auto mb-4 text-[#ff4d00]" size={48} />
                        <p className="text-gray-500 font-medium">Verifying your code...</p>
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
                                onClick={resetInput}
                                className="w-full bg-[#ff4d00] text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                Try Again
                            </button>
                            <Link to="/login" className="block text-center text-sm font-bold text-gray-400 hover:text-[#ff4d00]">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
