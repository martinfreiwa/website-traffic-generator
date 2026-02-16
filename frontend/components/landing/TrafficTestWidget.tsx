import React, { useState } from 'react';
import { Globe, Zap, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

interface TrafficTestWidgetProps {
    onComplete: (email: string, url: string) => void;
}

const TrafficTestWidget: React.FC<TrafficTestWidgetProps> = ({ onComplete }) => {
    const [url, setUrl] = useState('');
    const [country, setCountry] = useState('US');
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'connecting' | 'ready'>('idle');

    const countries = [
        { code: 'US', name: 'United States' },
        { code: 'DE', name: 'Germany' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'FR', name: 'France' },
        { code: 'CA', name: 'Canada' },
        { code: 'AU', name: 'Australia' },
        { code: 'NL', name: 'Netherlands' },
        { code: 'ES', name: 'Spain' },
        { code: 'IT', name: 'Italy' },
        { code: 'BR', name: 'Brazil' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            return;
        }

        setStatus('analyzing');
        await new Promise(r => setTimeout(r, 1200));
        
        setStatus('connecting');
        await new Promise(r => setTimeout(r, 1500));
        
        setStatus('ready');
        await new Promise(r => setTimeout(r, 800));
        
        onComplete('', url);
    };

    const statusMessages = {
        analyzing: { text: 'Analyzing URL...', icon: <Loader2 className="animate-spin" size={20} /> },
        connecting: { text: 'Connecting to servers...', icon: <Loader2 className="animate-spin" size={20} /> },
        ready: { text: 'Traffic ready!', icon: <CheckCircle size={20} /> },
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#ff4d00]/10 rounded-xl flex items-center justify-center">
                    <Zap size={20} className="text-[#ff4d00]" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Quick Traffic Test</h3>
                    <p className="text-xs text-gray-500">No signup required to start</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Your Website URL</label>
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="url"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            disabled={status !== 'idle'}
                            className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Target Country</label>
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={status !== 'idle'}
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                    >
                        {countries.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {status !== 'idle' && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className={`text-[#ff4d00] ${status === 'ready' ? 'text-green-500' : ''}`}>
                            {statusMessages[status].icon}
                        </div>
                        <span className={`text-sm font-bold ${status === 'ready' ? 'text-green-600' : 'text-gray-600'}`}>
                            {statusMessages[status].text}
                        </span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status !== 'idle' || !url}
                    className="w-full bg-[#ff4d00] text-white p-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === 'idle' ? (
                        <>Start Free Traffic <ArrowRight size={18} /></>
                    ) : (
                        'Processing...'
                    )}
                </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
                Free 2,000 visitors • No credit card required
            </p>
        </div>
    );
};

export default TrafficTestWidget;
