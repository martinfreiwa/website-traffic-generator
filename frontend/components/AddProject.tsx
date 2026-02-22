import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Project, ProjectSettings, GeoTarget, Transaction, SystemSettings } from '../types';
import { ArrowLeft, Globe, Info, Zap, MapPin, Search, X, Check, AlertCircle, Settings, Layers } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { COUNTRIES_LIST, TRAFFIC_SOURCES, TIME_ON_PAGE_OPTS } from '../constants';
import { validateDomainForEconomy } from '../services/domainValidator';

interface AddProjectProps {
    onBack: () => void;
    onCreated: () => void;
}

const steps = [
    { id: 1, label: 'Identity', icon: Globe },
    { id: 2, label: 'Volume', icon: Layers },
    { id: 3, label: 'Geo', icon: MapPin },
    { id: 4, label: 'Behavior', icon: Zap },
    { id: 5, label: 'Review', icon: Check }
];

const SOCIAL_PLATFORMS = [
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'X (Twitter)' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'pinterest', label: 'Pinterest' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'reddit', label: 'Reddit' },
];

const AddProject: React.FC<AddProjectProps> = ({ onBack, onCreated }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    
    useEffect(() => {
        const loadData = async () => {
            await db.syncTransactions();
            setTransactions(db.getTransactions());
            const settings = db.getSystemSettings();
            if (settings) setSystemSettings(settings);
        };
        loadData();
    }, []);

    const calculateAvailableHits = (tier: string): number => {
        const purchasedHits = transactions
            .filter(t => t.type !== 'debit' && t.tier === tier && t.hits)
            .reduce((sum, t) => sum + (t.hits || 0), 0);

        const usedHits = transactions
            .filter(t => t.type === 'debit' && t.tier === tier && t.hits)
            .reduce((sum, t) => sum + (t.hits || 0), 0);

        return purchasedHits - usedHits;
    };

    const availableTiers = useMemo(() => {
        const tiers: ('expert' | 'professional' | 'economy')[] = ['expert', 'professional', 'economy'];
        return tiers.filter(t => calculateAvailableHits(t) > 0);
    }, [transactions]);

    const getDefaultTier = (): 'expert' | 'professional' | 'economy' => {
        if (calculateAvailableHits('expert') > 0) return 'expert';
        if (calculateAvailableHits('professional') > 0) return 'professional';
        if (calculateAvailableHits('economy') > 0) return 'economy';
        return 'expert';
    };

    const [selectedTier, setSelectedTier] = useState<'expert' | 'professional' | 'economy'>(getDefaultTier());
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [gaId, setGaId] = useState('');
    const [isScanningGA, setIsScanningGA] = useState(false);

    const [totalHits, setTotalHits] = useState<number>(1000);
    const [dailyLimit, setDailyLimit] = useState<number>(100);
    const [startAt, setStartAt] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [durationDays, setDurationDays] = useState<number>(10);

    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [countryPercents, setCountryPercents] = useState<Record<string, number>>({});
    const [countrySearch, setCountrySearch] = useState('');

    const [bounceRate, setBounceRate] = useState(35);
    const [timeOnPage, setTimeOnPage] = useState('3 minutes');
    const [trafficSource, setTrafficSource] = useState('Direct');
    const [keywords, setKeywords] = useState('');
    const [referralUrls, setReferralUrls] = useState('');
    const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState<string[]>([]);

    const domainValidationError = useMemo(() => {
        if (selectedTier !== 'economy' || !url) return null;
        const result = validateDomainForEconomy(url, systemSettings?.blockedDomainsForFree);
        return result.isValid ? null : result.errorMessage;
    }, [url, selectedTier, systemSettings]);

    const handleScanGA = async () => {
        if (!url) return;
        setIsScanningGA(true);
        setError('');
        try {
            const tid = await db.scanGA4(url);
            if (tid) {
                setGaId(tid);
            } else {
                setError('No GA4 ID found on this page. Please enter manually.');
            }
        } catch (e: any) {
            if (e?.message?.includes('credentials') || e?.message?.includes('401')) {
                setError('Session expired. Please enter GA-ID manually or refresh the page.');
            } else {
                setError(e?.message || 'Failed to scan for GA4. Please enter manually.');
            }
        } finally {
            setIsScanningGA(false);
        }
    };

    const toggleCountry = (code: string) => {
        if (selectedCountries.includes(code)) {
            const newSelected = selectedCountries.filter(c => c !== code);
            setSelectedCountries(newSelected);
            
            setCountryPercents(prev => {
                const newPercents = { ...prev };
                delete newPercents[code];
                
                if (newSelected.length > 0) {
                    const percent = Math.floor(100 / newSelected.length);
                    newSelected.forEach(c => {
                        newPercents[c] = percent;
                    });
                    const remainder = 100 - (percent * newSelected.length);
                    if (remainder > 0 && newSelected.length > 0) {
                        newPercents[newSelected[0]] += remainder;
                    }
                }
                return newPercents;
            });
        } else {
            const newSelected = [...selectedCountries, code];
            setSelectedCountries(newSelected);
            
            const percent = Math.floor(100 / newSelected.length);
            const newPercents: Record<string, number> = {};
            newSelected.forEach(c => {
                newPercents[c] = percent;
            });
            const remainder = 100 - (percent * newSelected.length);
            if (remainder > 0) {
                newPercents[code] += remainder;
            }
            setCountryPercents(newPercents);
        }
    };

    const updateCountryPercent = (code: string, percent: number) => {
        setCountryPercents(prev => {
            const othersTotal = Object.entries(prev)
                .filter(([c]) => c !== code)
                .reduce((sum: number, [, p]) => sum + (p as number), 0);
            
            const maxPercent = Math.max(0, 100 - othersTotal);
            const clampedPercent = Math.max(0, Math.min(maxPercent, percent));
            
            return { ...prev, [code]: clampedPercent };
        });
    };

    const totalCountryPercent = useMemo(() => {
        return Object.values(countryPercents).reduce((sum: number, p: number) => sum + p, 0);
    }, [countryPercents]);

    const distributeEvenly = () => {
        if (selectedCountries.length === 0) return;
        const percent = Math.floor(100 / selectedCountries.length);
        const newPercents: Record<string, number> = {};
        selectedCountries.forEach(code => {
            newPercents[code] = percent;
        });
        const remainder = 100 - (percent * selectedCountries.length);
        if (remainder > 0 && selectedCountries.length > 0) {
            newPercents[selectedCountries[0]] += remainder;
        }
        setCountryPercents(newPercents);
    };

    const toggleSocialPlatform = (id: string) => {
        if (selectedSocialPlatforms.includes(id)) {
            setSelectedSocialPlatforms(prev => prev.filter(p => p !== id));
        } else {
            setSelectedSocialPlatforms(prev => [...prev, id]);
        }
    };

    const handleNext = () => {
        setError('');

        if (currentStep === 1) {
            if (!title.trim()) return setError('Please enter a project name.');
            if (!url.trim()) return setError('Please enter a target URL.');
            if (!gaId.trim()) return setError('Google Analytics ID is required.');
        }

        if (currentStep === 2) {
            if (totalHits < 100) return setError('Minimum 100 hits required.');
            if (dailyLimit < 1) return setError('Minimum 1 hit per day required.');
            if (durationDays < 1) return setError('Minimum 1 day duration required.');
            
            const available = calculateAvailableHits(selectedTier);
            if (totalHits > available) {
                return setError(`Insufficient ${selectedTier} hits. Available: ${available.toLocaleString()}`);
            }
        }

        if (currentStep === 3) {
            if (selectedCountries.length === 0) return setError('Please select at least one country.');
            if (totalCountryPercent !== 100) return setError('Country distribution must total 100%.');
        }

        if (currentStep === 4) {
            if (trafficSource === 'Organic (General)' || trafficSource.startsWith('Organic')) {
                if (!keywords.trim()) return setError('Please enter keywords for organic traffic.');
            }
            if (trafficSource === 'Social (General)' || trafficSource.startsWith('Social')) {
                if (selectedSocialPlatforms.length === 0) return setError('Please select at least one social platform.');
            }
            if (trafficSource === 'Referral') {
                if (!referralUrls.trim()) return setError('Please enter referral URLs.');
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            const startDate = new Date(startAt);
            const endDate = new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));

            const geoTargets: GeoTarget[] = selectedCountries.map(code => ({
                id: `geo-${code}`,
                country: code,
                percent: countryPercents[code] || 0
            }));

            const settings: ProjectSettings = {
                bounceRate,
                returnRate: 0,
                deviceSplit: 70,
                tabletSplit: 0,
                deviceSpecific: 'All',
                browser: 'Random',
                timeOnPage,
                timezone: 'UTC',
                language: 'en-US',
                languages: ['en-US'],
                gaId,
                urlVisitOrder: 'random',
                entryUrls: url,
                innerUrls: '',
                exitUrls: '',
                autoCrawlEntry: true,
                autoCrawlInner: false,
                autoCrawlExit: false,
                innerUrlCount: 0,
                countries: selectedCountries,
                geoTargets,
                trafficSource,
                keywords,
                referralUrls,
                socialPlatforms: selectedSocialPlatforms,
                proxyMode: 'auto',
                customProxies: '',
                scheduleMode: 'continuous',
                scheduleTime: '',
                scheduleDuration: 60,
                sitemap: '',
                shortener: '',
                autoRenew: false,
                cacheWebsite: false,
                minimizeCpu: false,
                randomizeSession: true,
                antiFingerprint: true,
                pageViewsWithScroll: 0,
                clickExternal: 0,
                clickInternal: 0,
                residentialIps: selectedTier !== 'economy',
                citiesGeoTargeting: selectedTier !== 'economy',
                nightDayVolume: selectedTier === 'expert',
                websiteCrawler: selectedTier === 'expert',
                ga4NaturalEvents: selectedTier === 'expert',
                randomizeDailyVolume: selectedTier === 'expert'
            };

            const newProject: Project = {
                id: 'proj_' + Date.now(),
                userId: db.getCurrentUser()?.id || 'unknown',
                name: title,
                plan: selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1),
                tier: selectedTier,
                customTarget: {
                    totalVisitors: totalHits,
                    durationDays: durationDays,
                    dailyLimit
                },
                startAt: startDate.toISOString(),
                expires: endDate.toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                status: 'active',
                settings
            };

            const createdProject = await db.addProject(newProject);
            onCreated();
            
            const projectId = createdProject?.id || newProject.id;
            navigate(`/dashboard/campaigns/${projectId}`);
            
        } catch (e: any) {
            console.error('Project creation error:', e);
            setError(e.message || 'Failed to create project. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCountries = countrySearch 
        ? COUNTRIES_LIST.filter(c => 
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
            c.code.toLowerCase().includes(countrySearch.toLowerCase()))
        : COUNTRIES_LIST;

    const renderStepHint = () => {
        const hints: Record<number, string[]> = {
            1: ['UTM Tracking', 'Sitemap Crawling'],
            2: ['Night/Day Volume', 'Auto-Renew', 'Schedule Burst Mode'],
            3: ['City-Level Targeting', 'Language Settings', 'Device Split'],
            4: ['Device Targeting', 'Browser Selection', 'Session Randomization']
        };
        return hints[currentStep] || [];
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold text-xs uppercase tracking-wider"
                >
                    <ArrowLeft size={16} /> Back to Projects
                </button>
                <div className="flex items-center gap-2">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-xs font-black
                                ${currentStep === step.id 
                                    ? 'bg-[#ff4d00] text-white shadow-lg scale-110' 
                                    : currentStep > step.id 
                                        ? 'bg-black text-white' 
                                        : 'bg-gray-100 text-gray-400'}
                                transition-all duration-300
                            `}>
                                {currentStep > step.id ? <Check size={14} /> : step.id}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`w-8 h-1 mx-1 ${currentStep > step.id ? 'bg-black' : 'bg-gray-100'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center mb-4">
                <span className="text-sm font-bold text-gray-500">
                    Step {currentStep}: {steps[currentStep - 1].label}
                </span>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 mb-6 animate-in fade-in">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-red-700 text-sm font-bold">{error}</span>
                </div>
            )}

            <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {currentStep === 1 && (
                    <>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Project Identity</h2>
                            <p className="text-sm text-gray-500">Configure the basic details of your traffic campaign.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Select Traffic Quality Tier</label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['expert', 'professional', 'economy'] as const).map(t => {
                                    const available = calculateAvailableHits(t);
                                    const isSelected = selectedTier === t;
                                    const isDisabled = available === 0;
                                    return (
                                        <button
                                            key={t}
                                            onClick={() => !isDisabled && setSelectedTier(t)}
                                            disabled={isDisabled}
                                            className={`p-4 border-2 transition-all flex flex-col gap-1 text-left rounded-lg
                                                ${isSelected ? 'border-[#ff4d00] bg-orange-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}
                                                ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00]">
                                                {t === 'expert' ? '★ Premium' : (t === 'professional' ? 'Standard' : 'Value')}
                                            </span>
                                            <span className="font-bold text-gray-900 capitalize">{t}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{available.toLocaleString()} hits</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Project Name *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Q4 Marketing Campaign"
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-lg font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Target URL *</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onBlur={() => { if (url && !gaId) handleScanGA(); }}
                                    placeholder="https://example.com"
                                    className={`w-full bg-[#f9fafb] border p-4 pl-12 text-lg font-medium font-mono text-gray-700 focus:border-[#ff4d00] outline-none ${domainValidationError ? 'border-red-300' : 'border-gray-200'}`}
                                />
                            </div>
                            {domainValidationError && (
                                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm font-medium">
                                    <AlertCircle size={16} />
                                    {domainValidationError}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Google Analytics ID *</label>
                                <button
                                    onClick={handleScanGA}
                                    disabled={!url || isScanningGA}
                                    className="text-[10px] font-bold uppercase tracking-wider text-[#ff4d00] hover:underline disabled:opacity-50"
                                >
                                    {isScanningGA ? 'Scanning...' : 'Auto-Detect'}
                                </button>
                            </div>
                            <input
                                type="text"
                                value={gaId}
                                onChange={(e) => setGaId(e.target.value)}
                                placeholder="G-XXXXXXXXXX"
                                className="w-full bg-white border border-gray-200 p-3 text-sm font-mono text-gray-700 outline-none focus:border-[#ff4d00]"
                            />
                        </div>
                    </>
                )}

                {currentStep === 2 && (
                    <>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Traffic Volume</h2>
                            <p className="text-sm text-gray-500">Define how much traffic you want and when it should run.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {(['economy', 'professional', 'expert'] as const).map(t => (
                                <div key={t} className={`p-4 border-2 transition-all ${selectedTier === t ? 'border-[#ff4d00] bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t}</div>
                                    <div className="text-xl font-black text-gray-900">{calculateAvailableHits(t).toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-400">hits available</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Total Hits *</label>
                                <input
                                    type="number"
                                    min="100"
                                    value={totalHits}
                                    onChange={(e) => setTotalHits(parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Hits per Day *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={dailyLimit}
                                    onChange={(e) => setDailyLimit(parseInt(e.target.value) || 1)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Start Date *</label>
                                <input
                                    type="date"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-lg font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Duration (Days) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-lg font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                                    placeholder="Days"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Campaign Duration</div>
                                <div className="text-xl font-bold text-gray-900">{durationDays} days</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cost</div>
                                <div className="text-3xl font-black text-[#ff4d00]">{totalHits.toLocaleString()} <span className="text-sm font-bold text-gray-400">hits</span></div>
                            </div>
                        </div>
                    </>
                )}

                {currentStep === 3 && (
                    <>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Geographic Targeting</h2>
                            <p className="text-sm text-gray-500">Select countries for your traffic and set the distribution.</p>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search countries..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 text-sm focus:border-[#ff4d00] outline-none"
                            />
                            {countrySearch && (
                                <button onClick={() => setCountrySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {selectedCountries.length > 0 && (
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Selected ({selectedCountries.length})</span>
                                    <button onClick={distributeEvenly} className="text-[10px] font-bold text-[#ff4d00] uppercase hover:underline">
                                        Distribute Evenly
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {selectedCountries.map(code => {
                                        const country = COUNTRIES_LIST.find(c => c.code === code);
                                        const percent = countryPercents[code] || 0;
                                        const othersTotal = totalCountryPercent - percent;
                                        const maxPercent = 100 - othersTotal;
                                        
                                        return (
                                            <div key={code} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100">
                                                <img 
                                                    src={`https://flagcdn.com/w24/${code.toLowerCase()}.png`} 
                                                    alt={code} 
                                                    className="w-6 h-auto rounded-sm"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                <span className="flex-1 font-bold text-sm text-gray-900">{country?.name || code}</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPercent}
                                                    value={percent}
                                                    onChange={(e) => updateCountryPercent(code, parseInt(e.target.value))}
                                                    className="w-24 accent-[#ff4d00]"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={maxPercent}
                                                    value={percent}
                                                    onChange={(e) => updateCountryPercent(code, parseInt(e.target.value) || 0)}
                                                    className="w-16 p-1 text-center text-sm font-bold border border-gray-200 outline-none focus:border-[#ff4d00]"
                                                />
                                                <span className="text-sm font-bold text-gray-400">%</span>
                                                <button onClick={() => toggleCountry(code)} className="text-gray-400 hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={`text-right mt-2 text-sm font-bold ${totalCountryPercent === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                                    Total: {totalCountryPercent}%
                                </div>
                            </div>
                        )}

                        <div className="border border-gray-200 max-h-[300px] overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1">
                                {filteredCountries.slice(0, 100).map((c) => (
                                    <button
                                        key={c.code}
                                        onClick={() => toggleCountry(c.code)}
                                        className={`p-2 text-left border text-xs font-bold flex justify-between items-center transition-all ${
                                            selectedCountries.includes(c.code)
                                                ? 'border-[#ff4d00] bg-orange-50 text-[#ff4d00]'
                                                : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <img 
                                                src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                                                alt={c.code} 
                                                className="w-4 h-auto rounded-sm flex-shrink-0"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <span className="truncate">{c.name}</span>
                                        </span>
                                        {selectedCountries.includes(c.code) && <Check size={12} className="flex-shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {currentStep === 4 && (
                    <>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Traffic Behavior</h2>
                            <p className="text-sm text-gray-500">Configure how visitors interact with your site.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Bounce Rate</label>
                                <div className="bg-gray-50 p-6 border border-gray-200 text-center">
                                    <div className="text-4xl font-black text-gray-900 mb-2">{bounceRate}%</div>
                                    <p className="text-xs text-gray-500 font-medium mb-4">Visitors leaving immediately</p>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={bounceRate}
                                        onChange={(e) => setBounceRate(parseInt(e.target.value))}
                                        className="w-full accent-[#ff4d00]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Time on Page</label>
                                <CustomSelect
                                    value={timeOnPage}
                                    onChange={setTimeOnPage}
                                    options={TIME_ON_PAGE_OPTS}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Traffic Source</label>
                            <CustomSelect
                                value={trafficSource}
                                onChange={setTrafficSource}
                                options={TRAFFIC_SOURCES}
                            />
                        </div>

                        {(trafficSource === 'Organic (General)' || trafficSource.startsWith('Organic')) && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Keywords (one per line)</label>
                                <textarea
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="keyword1&#10;keyword2&#10;keyword3"
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                />
                            </div>
                        )}

                        {(trafficSource === 'Social (General)' || trafficSource.startsWith('Social')) && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Social Platforms</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SOCIAL_PLATFORMS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleSocialPlatform(p.id)}
                                            className={`p-2 text-xs font-bold border transition-all ${
                                                selectedSocialPlatforms.includes(p.id)
                                                    ? 'border-[#ff4d00] bg-orange-50 text-[#ff4d00]'
                                                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {trafficSource === 'Referral' && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">Referral URLs (one per line)</label>
                                <textarea
                                    value={referralUrls}
                                    onChange={(e) => setReferralUrls(e.target.value)}
                                    placeholder="https://example.com/page1&#10;https://example.com/page2"
                                    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24"
                                />
                            </div>
                        )}
                    </>
                )}

                {currentStep === 5 && (
                    <>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Review Campaign</h2>
                            <p className="text-sm text-gray-500">Confirm all settings before creating your project.</p>
                        </div>

                        <div className={`p-4 border-2 ${calculateAvailableHits(selectedTier) >= totalHits ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                        {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Balance
                                    </div>
                                    <div className="text-lg font-black text-gray-900">
                                        {calculateAvailableHits(selectedTier).toLocaleString()} available
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 font-bold">Required</div>
                                    <div className={`text-xl font-black ${calculateAvailableHits(selectedTier) >= totalHits ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalHits.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <ReviewRow label="Project Name" value={title} />
                            <ReviewRow label="Tier" value={selectedTier.toUpperCase()} />
                            <ReviewRow label="Target URL" value={url} isUrl />
                            <ReviewRow label="Google Analytics" value={gaId} />
                            <div className="h-px bg-gray-100"></div>
                            <ReviewRow label="Total Hits" value={`${totalHits.toLocaleString()} hits`} highlight />
                            <ReviewRow label="Daily Limit" value={`${dailyLimit.toLocaleString()} hits/day`} />
                            <ReviewRow label="Start Date" value={startAt} />
                            <ReviewRow label="Duration" value={`${durationDays} days`} />
                            <div className="h-px bg-gray-100"></div>
                            <ReviewRow label="Countries" value={selectedCountries.length > 0 ? `${selectedCountries.length} selected` : 'None'} />
                            <div className="h-px bg-gray-100"></div>
                            <ReviewRow label="Bounce Rate" value={`${bounceRate}%`} />
                            <ReviewRow label="Time on Page" value={timeOnPage} />
                            <ReviewRow label="Traffic Source" value={trafficSource} />
                        </div>

                        <div className="mt-8 bg-blue-50 p-4 flex items-start gap-3 border border-blue-100">
                            <Info className="text-blue-500 flex-shrink-0" size={18} />
                            <div className="text-xs text-blue-700 font-medium leading-relaxed">
                                <p className="font-bold mb-1">After creation, more settings will be available:</p>
                                <p>UTM Tracking, Device Split, Browser Selection, Sitemap Crawling, City-Level Targeting, and more.</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <Settings size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Available after creation</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {renderStepHint().map((hint, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 border border-gray-200">
                            {hint}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <button
                    onClick={handleBack}
                    className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                >
                    {currentStep === 1 ? 'Cancel' : 'Previous Step'}
                </button>
                <button
                    onClick={handleNext}
                    disabled={isSubmitting || (currentStep === 5 && selectedTier === 'economy' && !!domainValidationError)}
                    className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                    {isSubmitting ? 'Creating...' : (currentStep === 5 ? 'Create Project' : 'Next Step')}
                    {!isSubmitting && currentStep < 5 && <ArrowLeft className="rotate-180" size={16} />}
                </button>
            </div>
        </div>
    );
};

const ReviewRow = ({ label, value, isUrl = false, highlight = false }: { label: string; value: string; isUrl?: boolean; highlight?: boolean }) => (
    <div className={`flex justify-between items-center p-3 ${highlight ? 'bg-orange-50 border border-orange-100' : ''}`}>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        {isUrl ? (
            <span className="text-sm font-bold text-[#ff4d00] truncate max-w-[200px]">{value}</span>
        ) : (
            <span className={`text-sm font-bold ${highlight ? 'text-[#ff4d00] text-lg' : 'text-gray-900'}`}>{value}</span>
        )}
    </div>
);

export default AddProject;