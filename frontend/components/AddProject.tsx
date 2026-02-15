import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Project, ProjectSettings, GeoTarget, PayloadTemplate, Transaction } from '../types';
import { ArrowLeft, Save, Globe, Info, Zap, Calculator, Calendar, BarChart2, Check, ExternalLink, MapPin, Search, Upload, X, Layers, Award } from 'lucide-react';
import CustomSelect from './CustomSelect';

interface AddProjectProps {
    onBack: () => void;
    onCreated: () => void;
}

const steps = [
    { id: 1, label: 'Identity', icon: Globe },
    { id: 2, label: 'Audience', icon: MapPin },
    { id: 3, label: 'Behavior', icon: Zap },
    { id: 4, label: 'Volume', icon: Calculator },
    { id: 5, label: 'Run', icon: Check }
];

const AddProject: React.FC<AddProjectProps> = ({ onBack, onCreated }) => {
    // State: Wizard Steps
    const [currentStep, setCurrentStep] = useState(1);
    // State: Configuration & Tier
    const [selectedTier, setSelectedTier] = useState<'economy' | 'professional' | 'expert'>('expert');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [gaId, setGaId] = useState('');
    const [isScanningGA, setIsScanningGA] = useState(false);

    // State: Transactions for balance lookup
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const loadTransactions = async () => {
            await db.syncTransactions();
            setTransactions(db.getTransactions());
        };
        loadTransactions();
    }, []);

    const calculateAvailableHits = (tier: string): number => {
        const purchasedHits = transactions
            .filter(t => t.type === 'credit' && t.tier === tier && t.hits)
            .reduce((sum, t) => sum + (t.hits || 0), 0);
        
        const usedHits = transactions
            .filter(t => t.type === 'debit' && t.tier === tier && t.hits)
            .reduce((sum, t) => sum + (t.hits || 0), 0);
        
        return purchasedHits - usedHits;
    };

    // Template State
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);
    const [systemTemplates, setSystemTemplates] = useState<PayloadTemplate[]>([]);

    useEffect(() => {
        const sys = db.getSystemSettings();
        setSystemTemplates(sys.payloadTemplates || []);
    }, []);

    const handleApplyTemplate = (json: string) => {
        try {
            const tpl: ProjectSettings = JSON.parse(json);
            // Apply major settings to state
            if (tpl.entryUrls) setUrl(tpl.entryUrls);
            if (tpl.gaId) setGaId(tpl.gaId);
            if (tpl.countries) setSelectedCountries(tpl.countries);
            if (tpl.deviceSplit) setDeviceSplit(tpl.deviceSplit);
            if (tpl.bounceRate !== undefined) setBounceRate(tpl.bounceRate);
            if (tpl.timeOnPage) setTimeOnPage(tpl.timeOnPage);
            if (tpl.trafficSource) setTrafficSource(tpl.trafficSource);
            if (tpl.utmSource) setUtmSource(tpl.utmSource);
            if (tpl.utmMedium) setUtmMedium(tpl.utmMedium);
            if (tpl.utmCampaign) setUtmCampaign(tpl.utmCampaign);

            setShowLoadTemplate(false);
            alert('Template applied! Please verify details.');
        } catch (e) {
            alert('Failed to apply template.');
        }
    };

    // State: Geo-Targeting
    const [selectedCountries, setSelectedCountries] = useState<string[]>(['US']);
    const [deviceSplit, setDeviceSplit] = useState(70); // Default 70% Desktop

    // State: Traffic Behavior
    const [bounceRate, setBounceRate] = useState(0); // 0-100%
    const [timeOnPage, setTimeOnPage] = useState('3 minutes');
    const [trafficSource, setTrafficSource] = useState('Direct');

    // State: Volume & Duration
    const [totalVisitors, setTotalVisitors] = useState<number>(1000);
    const [durationDays, setDurationDays] = useState<number>(30);
    const [dailyVisitors, setDailyVisitors] = useState<number>(0);
    const [totalCost, setTotalCost] = useState<number>(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // UTM State (Optional in Identity Step)
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');

    // Pricing Logic
    useEffect(() => {
        const days = durationDays > 0 ? durationDays : 1;
        const daily = Math.ceil(totalVisitors / days);
        setDailyVisitors(daily);

        // Curve fitting logic from BuyCredits
        let cpm = 0.50;
        if (totalVisitors >= 50000000) cpm = 0.20;
        else if (totalVisitors >= 10000000) cpm = 0.21;
        else if (totalVisitors >= 1000000) cpm = 0.30;
        else if (totalVisitors >= 500000) cpm = 0.35;
        else if (totalVisitors >= 100000) cpm = 0.45;

        // Apply Tier Factor
        const factor = selectedTier === 'expert' ? 1.0 : (selectedTier === 'professional' ? 0.65 : 0.35);
        const calculatedCost = (totalVisitors / 1000) * cpm * factor;

        setTotalCost(Math.max(calculatedCost, 1.00));
    }, [totalVisitors, durationDays, selectedTier]);

    const handleNext = () => {
        setError('');

        // Step 1 Validation
        if (currentStep === 1) {
            if (!title) return setError('Please verify project name.');
            if (!url) return setError('Please verify target URL.');
        }

        // Step 2 Validation
        if (currentStep === 2) {
            if (selectedCountries.length === 0) return setError('Select at least one country.');
        }

        // Step 3 Validation (Defaults often work, maybe specific checks later)
        if (currentStep === 3) {
            // Feature gating check
            if (selectedTier === 'economy' && trafficSource !== 'Direct') {
                return setError('Economy tier only supports Direct traffic. Upgrade to Growth or Business for Organic/Social.');
            }
        }

        // Step 4 Validation
        if (currentStep === 4) {
            if (totalVisitors < 1000) return setError('Minimum 1,000 visitors required for this tier.');
            if (durationDays < 1) return setError('Minimum 1 day duration.');
            
            const availableHits = calculateAvailableHits(selectedTier);
            if (totalVisitors > availableHits) {
                return setError(`Insufficient ${selectedTier} hits. Required: ${totalVisitors.toLocaleString()}, Available: ${availableHits.toLocaleString()}`);
            }
        }

        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
        else onBack();
    };

    const handleScanGA = async () => {
        if (!url) return;
        setIsScanningGA(true);
        setError('');
        try {
            const tid = await db.scanGA4(url);
            if (tid) {
                setGaId(tid);
                alert(`Found Analytics ID: ${tid}`);
            } else {
                setError('No GA4 ID found on this page. Please enter manually.');
            }
        } catch (e: any) {
            console.error("GA Scan failed", e);
            const errorMsg = e?.message || 'Failed to scan for GA4. Please enter manually.';
            setError(errorMsg);
        } finally {
            setIsScanningGA(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const success = db.spendCredits(totalCost, `New Campaign: ${title} (${selectedTier.toUpperCase()})`);
            if (!success) {
                setIsSubmitting(false);
                setError('Transaction failed. Please try again.');
                return;
            }

            const newId = Math.floor(Math.random() * 9000 + 1000).toString();
            const today = new Date();
            const expiresDate = new Date(today.getTime() + (durationDays * 24 * 60 * 60 * 1000));

            // Construct Geo Targets
            const geoTargets: GeoTarget[] = selectedCountries.map(code => ({
                id: `geo-${code}`,
                country: code,
                percent: Math.floor(100 / selectedCountries.length) // Even split for now
            }));

            const defaultSettings: ProjectSettings = {
                trafficSpeed: 80,
                bounceRate: bounceRate,
                returnRate: 0,
                deviceSplit: deviceSplit,
                tabletSplit: 0,
                deviceSpecific: "All",
                browser: "Random",
                timeOnPage: timeOnPage,
                timezone: 'UTC',
                language: 'en-US',
                languages: ['en-US'],
                gaId: gaId,
                urlVisitOrder: 'random',
                entryUrls: url, innerUrls: '', exitUrls: '',
                autoCrawlEntry: true, autoCrawlInner: false, autoCrawlExit: false,
                innerUrlCount: 0,
                countries: selectedCountries,
                geoTargets: geoTargets,
                trafficSource: trafficSource,
                keywords: '', referralUrls: '',
                utmSource, utmMedium, utmCampaign, utmTerm: '', utmContent: '',
                proxyMode: selectedTier === 'expert' ? 'auto' : 'auto', // Placeholder logic 
                customProxies: '',
                scheduleMode: 'continuous', scheduleTime: '', scheduleDuration: 60,
                sitemap: '', shortener: '',
                autoRenew: false,
                cacheWebsite: false, minimizeCpu: false,
                randomizeSession: true, antiFingerprint: true,
                pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0,
                // New Expert Defaults
                residentialIps: selectedTier !== 'economy',
                citiesGeoTargeting: selectedTier !== 'economy',
                nightDayVolume: selectedTier === 'expert',
                websiteCrawler: selectedTier === 'expert',
                ga4NaturalEvents: selectedTier === 'expert',
                randomizeDailyVolume: selectedTier === 'expert'
            };

            const newProject: Project = {
                id: newId,
                userId: db.getCurrentUser()?.id || 'unknown',
                name: title,
                plan: selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1),
                tier: selectedTier,
                customTarget: {
                    totalVisitors: totalVisitors,
                    durationDays: durationDays,
                    dailyLimit: dailyVisitors
                },
                expires: expiresDate.toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                status: 'active',
                settings: defaultSettings
            };

            db.addProject(newProject);
            setIsSubmitting(false);
            onCreated();
            onBack();
        }, 800);
    };

    // Helper: Country List (Simplified)
    const availableCountries = [
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'CA', name: 'Canada' },
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'AU', name: 'Australia' },
        { code: 'BR', name: 'Brazil' },
        { code: 'IN', name: 'India' },
        { code: 'JP', name: 'Japan' },
        { code: 'CN', name: 'China' },
    ];

    const toggleCountry = (code: string) => {
        if (selectedCountries.includes(code)) {
            // Prevent removing last country
            if (selectedCountries.length > 1) {
                setSelectedCountries(prev => prev.filter(c => c !== code));
            }
        } else {
            if (selectedCountries.length < 5) {
                setSelectedCountries(prev => [...prev, code]);
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold text-xs uppercase tracking-wider">
                    <ArrowLeft size={16} /> Back to Projects
                </button>
                <div className="flex items-center gap-2">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                                ${currentStep === step.id ? 'bg-[#ff4d00] text-white shadow-lg scale-110' :
                                    currentStep > step.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}
                                transition-all duration-300
                            `}>
                                {currentStep > step.id ? <Check size={14} /> : step.id}
                            </div>
                            {step.id !== 5 && <div className={`w-8 h-1 mx-2 ${currentStep > step.id ? 'bg-black' : 'bg-gray-100'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Form */}
                <div className="lg:col-span-2 space-y-6">

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <Info className="text-red-500" size={20} />
                            <span className="text-red-700 text-sm font-bold">{error}</span>
                        </div>
                    )}

                    {/* Step 1: Identity */}
                    {currentStep === 1 && (
                        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Project Configuration</h2>
                                    <p className="text-sm text-gray-500">Basic details about your campaign target and quality.</p>
                                </div>
                                <button
                                    onClick={() => setShowLoadTemplate(true)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ff4d00] transition-colors bg-gray-50 px-3 py-2 border border-gray-100"
                                >
                                    <Upload size={14} /> Load Template
                                </button>
                            </div>

                            {/* Template Modal */}
                            {showLoadTemplate && (
                                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white p-6 w-full max-w-md shadow-2xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest">Select Template</h3>
                                            <button onClick={() => setShowLoadTemplate(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
                                        </div>
                                        <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                            {systemTemplates.length === 0 ? (
                                                <div className="text-center py-8 text-gray-400 text-xs italic">No templates saved yet. Create a project and save it as a template first.</div>
                                            ) : (
                                                systemTemplates.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleApplyTemplate(t.json)}
                                                        className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all group"
                                                    >
                                                        <div className="font-bold text-gray-900 group-hover:text-[#ff4d00]">{t.name}</div>
                                                        <div className="text-[10px] text-gray-400 mt-1 uppercase">Apply configuration</div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        <button onClick={() => setShowLoadTemplate(false)} className="w-full py-4 text-xs font-black uppercase bg-black text-white hover:bg-gray-800 transition-colors">Close</button>
                                    </div>
                                </div>
                            )}

                            {/* Tier Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Select Traffic Quality</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['economy', 'professional', 'expert'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedTier(t)}
                                            className={`p-4 border-2 transition-all flex flex-col gap-1 text-left rounded-lg
                                                ${selectedTier === t ? 'border-[#ff4d00] bg-orange-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}
                                            `}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00]">
                                                {t === 'expert' ? '★ Premium' : (t === 'professional' ? 'Standard' : 'Value')}
                                            </span>
                                            <span className="font-bold text-gray-900 capitalize">{t}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{t === 'expert' ? '1.0x Price' : (t === 'professional' ? '0.65x Price' : '0.35x Price')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Project Name</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Q4 Marketing Push"
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-lg font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Target URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onBlur={() => { if (url && !gaId) handleScanGA(); }}
                                        placeholder="https://example.com"
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-lg font-medium font-mono text-gray-700 focus:border-[#ff4d00] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tracking (Optional)</label>
                                    <button
                                        onClick={handleScanGA}
                                        disabled={!url || isScanningGA}
                                        className="text-[10px] font-bold uppercase tracking-wider text-[#ff4d00] hover:underline disabled:opacity-50"
                                    >
                                        {isScanningGA ? 'Scanning...' : 'Auto-Detect GA4'}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={gaId}
                                    onChange={(e) => setGaId(e.target.value)}
                                    placeholder="G-XXXXXXXXXX"
                                    className="w-full bg-white border border-gray-200 p-3 text-sm font-mono text-gray-700 outline-none focus:border-[#ff4d00] mb-4"
                                />
                                <div className="grid grid-cols-3 gap-4">
                                    <input type="text" placeholder="utm_source" value={utmSource} onChange={e => setUtmSource(e.target.value)} className="bg-white p-2 text-xs border border-gray-200 outline-none focus:border-[#ff4d00]" />
                                    <input type="text" placeholder="utm_medium" value={utmMedium} onChange={e => setUtmMedium(e.target.value)} className="bg-white p-2 text-xs border border-gray-200 outline-none focus:border-[#ff4d00]" />
                                    <input type="text" placeholder="utm_campaign" value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} className="bg-white p-2 text-xs border border-gray-200 outline-none focus:border-[#ff4d00]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Audience (Geo & Device) */}
                    {currentStep === 2 && (
                        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Audience Targeting</h2>
                                <p className="text-sm text-gray-500">Where should your visitors come from?</p>
                            </div>

                            {/* Geo Map */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Geographic Location (Max 5)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {availableCountries.map((c) => (
                                        <button
                                            key={c.code}
                                            onClick={() => toggleCountry(c.code)}
                                            className={`p-3 text-left border text-sm font-bold flex justify-between items-center transition-all ${selectedCountries.includes(c.code)
                                                ? 'border-[#ff4d00] bg-orange-50 text-[#ff4d00]'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.code} className="w-5 h-auto rounded-sm" />
                                                {c.name}
                                            </span>
                                            {selectedCountries.includes(c.code) && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Device Split */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-4">Device Distribution</label>
                                <div className="bg-gray-100 h-4 rounded-full overflow-hidden flex mb-4">
                                    <div className="bg-gray-900 h-full transition-all duration-500" style={{ width: `${deviceSplit}%` }}></div>
                                    <div className="bg-[#ff4d00] h-full transition-all duration-500" style={{ width: `${100 - deviceSplit}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                                        <span className="text-sm font-bold text-gray-900">Desktop ({deviceSplit}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#ff4d00]">Mobile ({100 - deviceSplit}%)</span>
                                        <div className="w-3 h-3 bg-[#ff4d00] rounded-full"></div>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={deviceSplit}
                                    onChange={(e) => setDeviceSplit(Number(e.target.value))}
                                    className="w-full mt-4 accent-black"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Behavior */}
                    {currentStep === 3 && (
                        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">User Behavior</h2>
                                <p className="text-sm text-gray-500">How should visitors interact with your site?</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Bounce Rate Control</label>
                                    <div className="bg-gray-50 p-6 border border-gray-200 text-center relative overflow-hidden">
                                        {selectedTier === 'economy' && (
                                            <div className="absolute top-0 right-0 p-1 bg-yellow-100 text-yellow-700 text-[8px] font-black uppercase tracking-tighter">Economy: Basic</div>
                                        )}
                                        <div className="text-4xl font-black text-gray-900 mb-2">{bounceRate}%</div>
                                        <p className="text-xs text-gray-500 font-medium mb-4">Visitors leaving immediately</p>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={bounceRate}
                                            onChange={(e) => setBounceRate(Number(e.target.value))}
                                            className="w-full accent-[#ff4d00]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Time on Page</label>
                                    <CustomSelect
                                        value={timeOnPage}
                                        onChange={setTimeOnPage}
                                        options={[
                                            { value: '30 seconds', label: '30 Seconds (Pulse)' },
                                            { value: '1 minute', label: '1 Minute (Standard)' },
                                            { value: '3 minutes', label: '3 Minutes (Engaged)' },
                                            { value: '5 minutes', label: '5 Minutes (Deep Read)' },
                                        ]}
                                    />
                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Traffic Source Simulation</label>
                                        {selectedTier === 'economy' ? (
                                            <div className="p-4 bg-orange-50 border border-orange-100 text-xs font-bold text-orange-700 flex items-center justify-between">
                                                <span>DIRECT TRAFFIC ONLY (Economy)</span>
                                                <div className="flex items-center gap-1 text-[8px] bg-white px-2 py-0.5 rounded border border-orange-200">
                                                    <Zap size={8} /> TIER LOCKED
                                                </div>
                                            </div>
                                        ) : (
                                            <CustomSelect
                                                value={trafficSource}
                                                onChange={setTrafficSource}
                                                options={[
                                                    { value: 'Direct', label: 'Direct (Type-in)' },
                                                    { value: 'Google Search', label: 'Organic Search (Google)' },
                                                    { value: 'Social Media', label: 'Social Media (FB/Twitter)' },
                                                    { value: 'Referral', label: 'Referral Link' },
                                                ]}
                                            />
                                        )}
                                        {selectedTier === 'economy' && (
                                            <div className="mt-2 text-[10px] text-gray-400 italic">
                                                Upgrade to Growth or Business for Organic & Social sources.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Volume & Duration (Existing logic) */}
                    {currentStep === 4 && (
                        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Volume & Budget</h2>
                                <p className="text-sm text-gray-500">Define the scale of your campaign.</p>
                            </div>

                            {/* Available Hits Display */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className={`p-4 border-2 transition-all ${selectedTier === 'economy' ? 'border-[#ff4d00] bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Layers size={14} className={selectedTier === 'economy' ? 'text-[#ff4d00]' : 'text-gray-400'} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Economy Balance</span>
                                    </div>
                                    <div className={`text-xl font-black ${selectedTier === 'economy' ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {calculateAvailableHits('economy').toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase">hits available</div>
                                </div>
                                <div className={`p-4 border-2 transition-all ${selectedTier === 'professional' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award size={14} className={selectedTier === 'professional' ? 'text-orange-500' : 'text-gray-400'} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Professional Balance</span>
                                    </div>
                                    <div className={`text-xl font-black ${selectedTier === 'professional' ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {calculateAvailableHits('professional').toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase">hits available</div>
                                </div>
                                <div className={`p-4 border-2 transition-all ${selectedTier === 'expert' ? 'border-[#ff4d00] bg-[#ff4d00]/5' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={14} className={selectedTier === 'expert' ? 'text-[#ff4d00]' : 'text-gray-400'} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Expert Balance</span>
                                    </div>
                                    <div className={`text-xl font-black ${selectedTier === 'expert' ? 'text-[#ff4d00]' : 'text-gray-400'}`}>
                                        {calculateAvailableHits('expert').toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase">hits available</div>
                                </div>
                            </div>

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
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none"
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
                                            className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Days</div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Zap size={10} /> Daily Volume
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {dailyVisitors.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ day</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Cost</div>
                                    <div className="text-3xl font-black text-[#ff4d00]">€{totalCost.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Review Campaign</h2>
                                <p className="text-sm text-gray-500">Confirm details before launching.</p>
                            </div>

                            {/* Hits Balance Check */}
                            <div className={`p-4 border-2 ${calculateAvailableHits(selectedTier) >= totalVisitors ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Balance Check
                                        </div>
                                        <div className="text-lg font-black text-gray-900">
                                            {calculateAvailableHits(selectedTier).toLocaleString()} available
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 font-bold">Required</div>
                                        <div className={`text-xl font-black ${calculateAvailableHits(selectedTier) >= totalVisitors ? 'text-green-600' : 'text-red-600'}`}>
                                            {totalVisitors.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                {calculateAvailableHits(selectedTier) < totalVisitors && (
                                    <div className="mt-3 text-xs font-bold text-red-600">
                                        Insufficient hits! Please purchase more {selectedTier} hits or reduce your volume.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <ReviewRow label="Project Name" value={title} />
                                <ReviewRow label="Target URL" value={url} isUrl />
                                <div className="h-px bg-gray-100 my-4"></div>
                                <ReviewRow label="Geo Targets" value={selectedCountries.join(', ')} />
                                <ReviewRow label="Device Split" value={`Desktop: ${deviceSplit}%, Mobile: ${100 - deviceSplit}%`} />
                                <div className="h-px bg-gray-100 my-4"></div>
                                <ReviewRow label="Total Volume" value={`${totalVisitors.toLocaleString()} Visitors`} />
                                <ReviewRow label="Duration" value={`${durationDays} Days`} />
                                <ReviewRow label="Daily Pace" value={`~${dailyVisitors.toLocaleString()} / day`} />
                                <ReviewRow label="Total Cost" value={`€${totalCost.toFixed(2)}`} highlight />
                            </div>

                            <div className="mt-8 bg-blue-50 p-4 flex items-start gap-3 border border-blue-100">
                                <Info className="text-blue-500 flex-shrink-0" size={18} />
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    Your campaign will start automatically within 5 minutes of launch. You can pause or edit settings at any time from the dashboard.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4">
                        <button
                            onClick={handleBack}
                            className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                        >
                            {currentStep === 1 ? 'Cancel' : 'Previous Step'}
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                        >
                            {isSubmitting ? 'Processing...' : (currentStep === 5 ? 'Launch Campaign' : 'Next Step')}
                            {!isSubmitting && currentStep < 5 && <ArrowLeft className="rotate-180" size={16} />}
                        </button>
                    </div>

                </div>

                {/* Vertical Summary Sidebar (Sticky) */}
                <div className="hidden lg:block">
                    <div className="sticky top-8 bg-gray-50 border border-gray-200 p-6 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Campaign Summary</h3>

                        <SummaryItem label="Target" value={url || 'Not set'} isLink={!!url} />
                        <SummaryItem label="Locations" value={selectedCountries.length > 0 ? `${selectedCountries.length} Countries` : 'Global'} />
                        <SummaryItem label="Volume" value={totalVisitors > 0 ? totalVisitors.toLocaleString() : '-'} />
                        <SummaryItem label="Duration" value={`${durationDays} Days`} />

                        <div className="pt-6 border-t border-gray-200 mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Estimated Cost</span>
                                <span className="text-xl font-black text-gray-900">€{totalCost.toFixed(2)}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                                * Final price logic applied
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryItem = ({ label, value, isLink = false }: { label: string, value: string, isLink?: boolean }) => (
    <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
        {isLink ? (
            <span className="text-xs font-bold text-gray-900 truncate max-w-[120px] block" title={value}>{value}</span>
        ) : (
            <span className="text-xs font-bold text-gray-900">{value}</span>
        )}
    </div>
);

const ReviewRow = ({ label, value, isUrl = false, highlight = false }: { label: string, value: string, isUrl?: boolean, highlight?: boolean }) => (
    <div className={`flex justify-between items-center p-3 ${highlight ? 'bg-orange-50 border border-orange-100' : 'border-b border-gray-50 last:border-0'}`}>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        {isUrl ? (
            <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-[#ff4d00] hover:underline">
                {value} <ExternalLink size={12} />
            </a>
        ) : (
            <span className={`text-sm font-bold ${highlight ? 'text-[#ff4d00] text-lg' : 'text-gray-900'}`}>{value}</span>
        )}
    </div>
);

export default AddProject;
