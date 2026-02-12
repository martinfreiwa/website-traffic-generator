


import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { sparkTrafficService } from '../services/sparkTraffic';
import { Project, ProjectSettings } from '../types';
import { ArrowLeft, Save, Globe, Info, Zap, Calculator, Calendar, BarChart2 } from 'lucide-react';

interface AddProjectProps {
    onBack: () => void;
    onCreated: () => void;
}

const AddProject: React.FC<AddProjectProps> = ({ onBack, onCreated }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [gaId, setGaId] = useState('');
    const [isScanningGA, setIsScanningGA] = useState(false);

    const handleScanGA = async () => {
        if (!url) return;
        setIsScanningGA(true);
        try {
            const tid = await db.scanGA4(url);
            if (tid) setGaId(tid);
        } catch (e) {
            console.error("GA Scan failed", e);
        } finally {
            setIsScanningGA(false);
        }
    };

    // Custom Calculator State
    const [totalVisitors, setTotalVisitors] = useState<number>(1000);
    const [durationDays, setDurationDays] = useState<number>(30);
    const [dailyVisitors, setDailyVisitors] = useState<number>(0);
    const [totalCost, setTotalCost] = useState<number>(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // UTM State
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');

    // Pricing Logic
    useEffect(() => {
        // Avoid division by zero
        const days = durationDays > 0 ? durationDays : 1;
        const daily = Math.ceil(totalVisitors / days);
        setDailyVisitors(daily);

        // CPM (Cost Per Mille) Calculation
        // Volume Discounts:
        // < 50k: €0.60 CPM
        // 50k - 250k: €0.50 CPM
        // 250k - 1M: €0.40 CPM
        // > 1M: €0.30 CPM

        let cpm = 0.60;
        if (totalVisitors >= 1000000) cpm = 0.30;
        else if (totalVisitors >= 250000) cpm = 0.40;
        else if (totalVisitors >= 50000) cpm = 0.50;

        const calculatedCost = (totalVisitors / 1000) * cpm;
        // Minimum cost check (e.g. €1.00 minimum per campaign)
        setTotalCost(Math.max(calculatedCost, 1.00));

    }, [totalVisitors, durationDays]);

    const handleCreate = async () => {
        setError('');

        if (!name || !url) {
            setError('Please provide both a Project Name and a Target URL.');
            return;
        }

        if (totalVisitors < 100) {
            setError('Minimum traffic volume is 100 visitors.');
            return;
        }

        if (durationDays < 1) {
            setError('Minimum duration is 1 day.');
            return;
        }

        const currentBalance = db.getBalance();

        if (totalCost > 0 && currentBalance < totalCost) {
            setError(`Insufficient funds. This campaign costs €${totalCost.toFixed(2)}, but your balance is €${currentBalance.toFixed(2)}.`);
            return;
        }

        setIsSubmitting(true);

        // Simulate network delay for local operations
        setTimeout(() => {
            // Attempt to charge wallet
            const success = db.spendCredits(totalCost, `New Campaign: ${name} (${totalVisitors.toLocaleString()} Visitors)`);
            if (!success) {
                setIsSubmitting(false);
                setError('Transaction failed during processing. Please try again.');
                return;
            }

            const newId = Math.floor(Math.random() * 9000 + 1000).toString();
            const today = new Date();
            const expiresDate = new Date(today.getTime() + (durationDays * 24 * 60 * 60 * 1000));

            const defaultSettings: ProjectSettings = {
                trafficSpeed: 80,
                bounceRate: 0, returnRate: 0,
                deviceSplit: 70, tabletSplit: 0, deviceSpecific: "All", browser: "Random",
                timeOnPage: '3 minutes',
                timezone: 'UTC', language: 'en-US', languages: ['en-US'], gaId: '',
                urlVisitOrder: 'random',
                entryUrls: url, innerUrls: '', exitUrls: '',
                autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
                innerUrlCount: 0,
                countries: ['US'], // Default ISO
                geoTargets: [{ id: 'geo-1', country: 'US', percent: 100 }], // Default ISO
                trafficSource: 'Direct',
                keywords: '', referralUrls: '',
                utmSource: '', utmMedium: '', utmCampaign: '', utmTerm: '', utmContent: '',
                proxyMode: 'auto', customProxies: '',
                scheduleMode: 'continuous', scheduleTime: '', scheduleDuration: 60,
                sitemap: '', shortener: '',
                autoRenew: false,
                cacheWebsite: false, minimizeCpu: false,
                randomizeSession: true, antiFingerprint: true,
                pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0
            };

            const newProject: Project = {
                id: newId,
                userId: db.getCurrentUser()?.id || 'unknown',
                name: name,
                plan: 'Custom',
                customTarget: {
                    totalVisitors: totalVisitors,
                    durationDays: durationDays,
                    dailyLimit: dailyVisitors
                },
                expires: expiresDate.toISOString().split('T')[0],
                status: 'active',
                settings: {
                    ...defaultSettings,
                    utmSource,
                    utmMedium,
                    utmCampaign,
                    gaId
                }
            };

            db.addProject(newProject);
            setIsSubmitting(false);
            onCreated();
            onBack();
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-white rounded-sm text-gray-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">New Campaign</div>
                    <h2 className="text-3xl font-black text-gray-900">Configure Project</h2>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm p-8 md:p-12">

                {error && (
                    <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={20} />
                        <span className="text-red-700 text-sm font-bold">{error}</span>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Project Name */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="e.g. Q4 Growth Campaign"
                            className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-lg font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none transition-colors"
                        />
                    </div>

                    {/* Target URL */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Target Website URL</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError('');
                                }}
                                onBlur={() => {
                                    if (url && !gaId) handleScanGA();
                                }}
                                placeholder="https://example.com"
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-lg font-medium font-mono text-gray-700 focus:border-[#ff4d00] focus:ring-0 outline-none transition-colors"
                            />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">We will auto-crawl this URL for sub-pages.</p>
                    </div>

                    {/* GA ID (Optional Auto-Scan) */}
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Google Analytics ID (Optional)</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">ID</div>
                            <input
                                type="text"
                                value={gaId}
                                onChange={(e) => setGaId(e.target.value)}
                                placeholder="G-XXXXXXXXXX"
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-lg font-medium font-mono text-gray-700 focus:border-[#ff4d00] focus:ring-0 outline-none transition-colors"
                            />
                            <button
                                onClick={handleScanGA}
                                disabled={!url || isScanningGA}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00]"
                            >
                                {isScanningGA ? 'Scanning...' : 'Scan URL'}
                            </button>
                        </div>
                    </div>

                    {/* UTM / Attribution */}
                    <div className="bg-white border border-gray-100 p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Zap size={14} /> Tracking & Attribution (Optional)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Campaign Source</label>
                                <input
                                    type="text"
                                    value={utmSource}
                                    onChange={(e) => setUtmSource(e.target.value)}
                                    placeholder="e.g. google"
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Campaign Medium</label>
                                <input
                                    type="text"
                                    value={utmMedium}
                                    onChange={(e) => setUtmMedium(e.target.value)}
                                    placeholder="e.g. cpc"
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Campaign Name</label>
                                <input
                                    type="text"
                                    value={utmCampaign}
                                    onChange={(e) => setUtmCampaign(e.target.value)}
                                    placeholder="e.g. launch_burst"
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 mt-4 uppercase tracking-wider">Dynamic tags: {"{{random_keyword}}, {{timestamp}}, {{device_type}}"}</p>
                    </div>

                    {/* Volume & Duration Calculator */}
                    <div className="bg-gray-50 p-8 border border-gray-100">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
                            <Calculator size={14} /> Campaign Volume & Duration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Total Visitors Goal</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="100"
                                        step="100"
                                        value={totalVisitors}
                                        onChange={(e) => setTotalVisitors(parseInt(e.target.value) || 0)}
                                        className="w-full bg-white border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Hits</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Duration (Days)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                                        className="w-full bg-white border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Days</div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="bg-white border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Zap size={10} /> Daily Volume
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {dailyVisitors.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ day</span>
                                    </div>
                                </div>
                                <div className="w-px bg-gray-200 h-10 hidden md:block"></div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> End Date
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {new Date(Date.now() + (durationDays * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Cost</div>
                                <div className="text-3xl font-black text-[#ff4d00]">€{totalCost.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 flex items-start gap-3 border border-gray-100">
                        <Info className="text-gray-400 flex-shrink-0" size={18} />
                        <p className="text-xs text-gray-500 leading-relaxed">
                            By clicking "Launch Campaign", <span className="font-bold text-gray-900">€{totalCost.toFixed(2)}</span> will be deducted from your wallet balance. You can adjust behavior settings (geo, bounce rate, etc.) immediately after creation.
                        </p>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-8 border-t border-gray-100 flex justify-end gap-4">
                        <button
                            onClick={onBack}
                            className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? 'Processing...' : (
                                <>
                                    <Save size={16} /> Launch Campaign
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Helper for alert icon (since it was missing in imports in previous context but used here)
const AlertCircle: React.FC<{ className?: string, size?: number }> = ({ className, size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
)

export default AddProject;
