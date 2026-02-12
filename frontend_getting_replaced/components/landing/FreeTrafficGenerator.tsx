
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Mail, Zap, CheckCircle, Loader2, Copy } from 'lucide-react';

interface FreeTrafficGeneratorProps {
    onSuccess?: () => void;
}

const FreeTrafficGenerator: React.FC<FreeTrafficGeneratorProps> = ({ onSuccess }) => {
    const [visitors, setVisitors] = useState<number>(1000);
    const [email, setEmail] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ password?: string, email: string } | null>(null);
    const navigate = useNavigate();

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVisitors(parseInt(e.target.value));
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate inputs
            if (!email || !url) {
                throw new Error("Please fill in all fields");
            }

            let finalUrl = url;
            if (!url.startsWith('http')) {
                finalUrl = 'https://' + url;
            }

            const response = await fetch(`${API_URL}/auth/quick-start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    url: finalUrl,
                    visitors
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to start campaign");
            }

            const data = await response.json();

            // Store token
            localStorage.setItem('token', data.access_token);

            if (data.is_new_user && data.generated_password) {
                setSuccessData({
                    email: data.user_email,
                    password: data.generated_password
                });
            } else {
                // Existing user or no password returned (shouldn't happen for new user)
                // Direct redirect
                if (onSuccess) onSuccess();
                navigate('/dashboard');
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPassword = () => {
        if (successData?.password) {
            navigator.clipboard.writeText(successData.password);
        }
    };

    const handleContinue = () => {
        if (onSuccess) onSuccess();
        navigate('/dashboard');
    };

    if (successData) {
        return (
            <div className="w-full max-w-md mx-auto bg-white border border-green-100 rounded-sm shadow-xl p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Account Created!</h3>
                    <p className="text-gray-500 mb-6">Your free traffic campaign has started successfully.</p>

                    <div className="w-full bg-gray-50 border border-gray-200 p-4 rounded-sm mb-6 text-left">
                        <div className="text-xs uppercase font-bold text-gray-400 mb-1">Your Login Credentials</div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Email:</span>
                            <span className="text-sm font-bold text-gray-900">{successData.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Password:</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-[#ff4d00] bg-orange-50 px-2 py-0.5 rounded">{successData.password}</span>
                                <button onClick={handleCopyPassword} className="text-gray-400 hover:text-gray-900" title="Copy Password">
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded">
                            Please save this password! We cannot recover it for you comfortably yet.
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="w-full bg-black text-white hover:bg-[#ff4d00] py-4 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
                    >
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-sm shadow-2xl p-8 relative overflow-hidden group hover:border-[#ff4d00] transition-colors duration-500">
            <div className="absolute top-0 right-0 bg-[#ff4d00] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                Free Tool
            </div>

            <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
                    Get Free Traffic
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                    Instantly send up to 10,000 real visitors to your site.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Visitors Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#ff4d00]">Daily Visitors</label>
                        <div className="text-2xl font-black text-gray-900">{visitors.toLocaleString()}</div>
                    </div>
                    <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={visitors}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                    />
                    <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                        <span>100</span>
                        <span>5K</span>
                        <span>10K</span>
                    </div>
                </div>

                {/* URL Input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Target URL</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold pl-10 pr-4 py-3 focus:outline-none focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] transition-all"
                        />
                    </div>
                </div>

                {/* Email Input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Your Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold pl-10 pr-4 py-3 focus:outline-none focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] transition-all"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
                        <div className="w-1 h-3 bg-red-500"></div>
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ff4d00] text-white hover:bg-black py-4 text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group-hover:scale-[1.02]"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                        <>
                            Start Free Campaign <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>

                <p className="text-[10px] text-center text-gray-400 font-medium">
                    By clicking Start, you agree to our Terms. No credit card required.
                </p>
            </form>
        </div>
    );
};

export default FreeTrafficGenerator;
