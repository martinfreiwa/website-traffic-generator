import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Project, ProjectSettings, ProjectTemplate } from '../types';
import { ArrowLeft, Save, Globe, Zap, Calculator, Calendar, Search, RefreshCw, CheckCircle2, AlertTriangle, MousePointer, Layout, Smartphone, MapPin, Activity, Monitor, FileText, Split, LayoutTemplate, Download, Trash2, X } from 'lucide-react';
import CustomSelect from './CustomSelect';

interface AddProjectProps {
  onBack: () => void;
  onCreated: () => void;
}

const AddProject: React.FC<AddProjectProps> = ({ onBack, onCreated }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [gaId, setGaId] = useState('');
  const [isScanningGA, setIsScanningGA] = useState(false);
  
  // Template State
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Advanced Settings State
  const [geoCountries, setGeoCountries] = useState<string[]>(['United States']);
  const [deviceSplit, setDeviceSplit] = useState(70); // 70% Desktop
  const [bounceRate, setBounceRate] = useState(0);
  const [timeOnPage, setTimeOnPage] = useState('3 minutes');
  const [trafficSource, setTrafficSource] = useState('organic');
  const [keywords, setKeywords] = useState('');
  
  // Funnel & Journey State
  const [pagesPerVisitor, setPagesPerVisitor] = useState(3);
  const [customSubpages, setCustomSubpages] = useState<string[]>(['', '', '']); // Initialize with 3 empty steps
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [sitemapAutoCrawl, setSitemapAutoCrawl] = useState(false);

  // Custom Calculator State
  const [totalVisitors, setTotalVisitors] = useState<number>(1000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [dailyVisitors, setDailyVisitors] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scannedSuccess, setScannedSuccess] = useState(false);

  // Load Templates on Mount
  useEffect(() => {
      loadTemplates();
  }, []);

  const loadTemplates = async () => {
      try {
          const data = await db.getTemplates();
          setTemplates(data);
      } catch (e) {
          console.error("Failed to load templates", e);
      }
  };

  const handleSaveTemplate = async () => {
      if (!newTemplateName) return;
      
      const currentSettings: ProjectSettings = {
          bounceRate, returnRate: 0, deviceSplit, deviceSpecific: "All",
          timeOnPage, timezone: 'UTC', language: 'en-US', languages: ['en-US'],
          gaId, entryUrls: url, innerUrls: '', exitUrls: '',
          autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
          innerUrlCount: 0, countries: geoCountries,
          geoTargets: geoCountries.map(c => ({ id: `geo-${c}`, country: c, percent: 100 })),
          trafficSource, keywords, referralUrls: '', 
          sitemap: sitemapUrl, sitemapAutoCrawl, shortener: '',
          pagesPerVisitor, customSubpages: customSubpages.filter(s => s.trim() !== ''),
          autoRenew: false, cacheWebsite: false, minimizeCpu: false,
          randomizeSession: true, antiFingerprint: true,
          pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0,
          targets: [], targetUrl: url, ga4Tid: gaId
      };

      try {
          await db.saveTemplate(newTemplateName, currentSettings);
          setShowSaveTemplate(false);
          setNewTemplateName('');
          loadTemplates();
          alert('Template saved successfully!');
      } catch (e: any) {
          alert('Failed to save template: ' + e.message);
      }
  };

  const handleLoadTemplate = (templateId: string) => {
      const t = templates.find(t => t.id === templateId);
      if (t && t.settings) {
          const s = t.settings;
          // Apply settings to state
          if (s.entryUrls) setUrl(s.entryUrls);
          if (s.gaId) setGaId(s.gaId);
          if (s.countries) setGeoCountries(s.countries);
          if (s.deviceSplit !== undefined) setDeviceSplit(s.deviceSplit);
          if (s.bounceRate !== undefined) setBounceRate(s.bounceRate);
          if (s.timeOnPage) setTimeOnPage(s.timeOnPage);
          if (s.trafficSource) setTrafficSource(s.trafficSource);
          if (s.keywords) setKeywords(s.keywords);
          
          if (s.pagesPerVisitor) setPagesPerVisitor(s.pagesPerVisitor);
          if (s.sitemap) setSitemapUrl(s.sitemap);
          if (s.sitemapAutoCrawl !== undefined) setSitemapAutoCrawl(s.sitemapAutoCrawl);
          
          if (s.customSubpages && Array.isArray(s.customSubpages)) {
              // Expand array to match pagesPerVisitor if needed, or take as is
              // We'll trust the effect to resize if pagesPerVisitor changes
              setCustomSubpages(s.customSubpages);
          }
      }
  };

  const handleDeleteTemplate = async (templateId: string) => {
      if (!confirm("Delete this template?")) return;
      try {
          await db.deleteTemplate(templateId);
          loadTemplates();
      } catch (e: any) {
          alert('Failed to delete: ' + e.message);
      }
  }

  // Sync customSubpages array size with pagesPerVisitor slider
  useEffect(() => {
      setCustomSubpages(prev => {
          const newArr = [...prev];
          if (pagesPerVisitor > prev.length) {
              // Add empty slots
              for (let i = prev.length; i < pagesPerVisitor; i++) {
                  newArr.push('');
              }
          } else if (pagesPerVisitor < prev.length) {
              // Remove slots
              return newArr.slice(0, pagesPerVisitor);
          }
          return newArr;
      });
  }, [pagesPerVisitor]);

  const updateSubpage = (index: number, value: string) => {
      setCustomSubpages(prev => {
          const newArr = [...prev];
          newArr[index] = value;
          return newArr;
      });
  };

  const extractDomain = (urlString: string) => {
      try {
          if (!urlString.startsWith('http')) urlString = 'https://' + urlString;
          const u = new URL(urlString);
          return u.hostname.replace('www.', '');
      } catch (e) {
          return '';
      }
  };

  // Pricing Logic
  useEffect(() => {
      const days = durationDays > 0 ? durationDays : 1;
      const daily = Math.ceil(totalVisitors / days);
      setDailyVisitors(daily);

      let cpm = 0.60;
      if (totalVisitors >= 1000000) cpm = 0.30;
      else if (totalVisitors >= 250000) cpm = 0.40;
      else if (totalVisitors >= 50000) cpm = 0.50;

      const calculatedCost = (totalVisitors / 1000) * cpm;
      setTotalCost(Math.max(calculatedCost, 1.00));
  }, [totalVisitors, durationDays]);

  const handleScanGA = async () => {
    if (!url) {
      setError('Please provide a Target URL first.');
      return;
    }
    setIsScanningGA(true);
    setError('');
    setScannedSuccess(false);
    try {
      const result = await db.findTid(url);
      if (result && result.tid) {
        setGaId(result.tid);
        setScannedSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find Tracking ID');
    } finally {
      setIsScanningGA(false);
    }
  };

  const addCountry = (country: string) => {
      if (country && !geoCountries.includes(country)) {
          setGeoCountries([...geoCountries, country]);
      }
  };

  const removeCountry = (country: string) => {
      setGeoCountries(geoCountries.filter(c => c !== country));
  };

  const handleCreate = async () => {
    setError('');
    
    if (!name || !url) {
      setError('Please provide both a Project Name and a Target URL.');
      return;
    }

    // Domain Validation for Funnel
    const targetDomain = extractDomain(url);
    if (!targetDomain) {
        setError('Invalid Target URL. Please enter a valid URL (e.g. https://example.com)');
        return;
    }

    for (let i = 0; i < customSubpages.length; i++) {
        const stepContent = customSubpages[i];
        if (stepContent.trim()) {
            const urls = stepContent.split('\n').filter(u => u.trim());
            if (urls.length > 500) {
                setError(`Step ${i + 1} contains too many URLs (Max 500).`);
                return;
            }
            for (const subUrl of urls) {
                const subDomain = extractDomain(subUrl);
                if (!subDomain) {
                    setError(`Invalid URL in Step ${i + 1}: ${subUrl}`);
                    return;
                }
                if (subDomain !== targetDomain) {
                    setError(`URL mismatch in Step ${i + 1}: ${subUrl} must match domain ${targetDomain}`);
                    return;
                }
            }
        }
    }

    if (totalVisitors < 100) {
        setError('Minimum traffic volume is 100 visitors.');
        return;
    }

    const currentBalance = db.getBalance();
    if (totalCost > 0 && currentBalance < totalCost) {
        setError(`Insufficient funds. Cost: €${totalCost.toFixed(2)}, Balance: €${currentBalance.toFixed(2)}.`);
        return;
    }

    setIsSubmitting(true);

    try {
        const success = await db.spendCredits(totalCost, `New Campaign: ${name} (${totalVisitors.toLocaleString()} Visitors)`);
        if (!success) {
            setIsSubmitting(false);
            setError('Transaction failed. Please check your balance.');
            return;
        }

        const today = new Date();
        const expiresDate = new Date(today.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        
        // Filter out empty subpages for submission
        const activeSubpages = customSubpages.filter(s => s.trim() !== '');

        const defaultSettings: ProjectSettings = {
            bounceRate: bounceRate,
            returnRate: 0,
            deviceSplit: deviceSplit,
            deviceSpecific: "All",
            timeOnPage: timeOnPage,
            timezone: 'UTC',
            language: 'en-US',
            languages: ['en-US'],
            gaId: gaId,
            entryUrls: url, innerUrls: '', exitUrls: '',
            autoCrawlEntry: false, autoCrawlInner: false, autoCrawlExit: false,
            innerUrlCount: 0,
            countries: geoCountries,
            geoTargets: geoCountries.map(c => ({ id: `geo-${c}`, country: c, percent: 100 })),
            trafficSource: trafficSource,
            keywords: keywords,
            referralUrls: '', 
            sitemap: sitemapUrl, 
            shortener: '',
            // New Funnel Settings
            sitemapAutoCrawl: sitemapAutoCrawl,
            pagesPerVisitor: pagesPerVisitor,
            customSubpages: activeSubpages,
            
            autoRenew: false, cacheWebsite: false, minimizeCpu: false,
            randomizeSession: true, antiFingerprint: true,
            pageViewsWithScroll: 0, clickExternal: 0, clickInternal: 0,
            targets: [{ url: url, tid: gaId || 'G-XXXXXXXXXX', funnel: [] }],
            targetUrl: url, ga4Tid: gaId || 'G-XXXXXXXXXX'
        };

        const newProject: Project = {
            id: '', 
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
            settings: defaultSettings
        };

        await db.addProject(newProject);
        setIsSubmitting(false);
        onCreated();
        onBack();
    } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Template Management Bar */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 border border-gray-200 shadow-sm rounded-sm">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <LayoutTemplate size={16} className="text-[#ff4d00]" />
                  TEMPLATES ({templates.length}):
              </div>
              <div className="flex items-center gap-2">
                   <select 
                      className="bg-gray-50 border border-gray-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-[#ff4d00]"
                      onChange={(e) => {
                          if(e.target.value) handleLoadTemplate(e.target.value);
                      }}
                      value=""
                   >
                      <option value="">Load Settings...</option>
                      {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                   </select>
              </div>
          </div>

          <div className="flex items-center gap-2">
              {showSaveTemplate ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                      <input 
                          autoFocus
                          type="text" 
                          placeholder="Template Name..." 
                          className="border border-gray-300 rounded-sm px-2 py-1 text-sm outline-none"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                      <button onClick={handleSaveTemplate} className="bg-green-600 text-white px-3 py-1 rounded-sm text-xs font-bold hover:bg-green-700">SAVE</button>
                      <button onClick={() => setShowSaveTemplate(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  </div>
              ) : (
                  <button 
                      onClick={() => setShowSaveTemplate(true)}
                      className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#ff4d00] flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-sm hover:border-[#ff4d00] transition-all"
                  >
                      <Download size={14} /> Save Current Settings
                  </button>
              )}
          </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="group p-2 hover:bg-white rounded-full transition-all">
            <ArrowLeft size={24} className="text-gray-400 group-hover:text-black" />
        </button>
        <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">New Campaign</div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Configure Launch</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-2 space-y-8">
            
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                    <span className="text-red-700 text-sm font-bold">{error}</span>
                </div>
            )}

            {/* Step 1: Basics */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 01</span>
                </div>
                
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Layout size={20} className="text-[#ff4d00]" /> Campaign Basics
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Campaign Name</label>
                        <input 
                            type="text"
                            value={name} 
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            placeholder="e.g. Black Friday Sale Push"
                            className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-base font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Target Website URL</label>
                         <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff4d00] transition-colors" size={20} />
                            <input 
                                type="url"
                                value={url} 
                                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                                placeholder="https://yourwebsite.com"
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-12 text-base font-medium font-mono text-gray-700 focus:border-[#ff4d00] focus:ring-0 outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                            />
                         </div>
                    </div>
                </div>
            </div>

            {/* Step 2: Tracking */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 02</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Search size={20} className="text-[#ff4d00]" /> Tracking (Optional)
                </h3>

                <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Google Analytics ID</label>
                     <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            {scannedSuccess ? <CheckCircle2 size={20} className="text-green-500" /> : <Search size={20} className="text-gray-400 group-focus-within:text-[#ff4d00]" />}
                        </div>
                        <input 
                            type="text"
                            value={gaId} 
                            onChange={(e) => { setGaId(e.target.value); setScannedSuccess(false); }}
                            placeholder="G-XXXXXXXXXX"
                            className={`w-full bg-[#f9fafb] border p-4 pl-12 pr-32 text-base font-medium font-mono text-gray-700 focus:border-[#ff4d00] focus:ring-0 outline-none transition-all ${scannedSuccess ? 'border-green-500 bg-green-50/10' : 'border-gray-200'}`}
                        />
                        <button 
                            onClick={handleScanGA}
                            disabled={isScanningGA || !url}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 text-gray-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {isScanningGA ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
                            {isScanningGA ? 'Scanning' : 'Find ID'}
                        </button>
                     </div>
                </div>
            </div>

            {/* Step 3: Targeting */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 03</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-[#ff4d00]" /> Targeting
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Target Countries</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {geoCountries.map(c => (
                                <span key={c} className="bg-black text-white px-3 py-1 text-xs font-bold uppercase rounded-sm flex items-center gap-2 animate-in zoom-in-95">
                                    {c} <button onClick={() => removeCountry(c)} className="hover:text-[#ff4d00]">×</button>
                                </span>
                            ))}
                        </div>
                        <CustomSelect
                            value=""
                            onChange={addCountry}
                            placeholder="Add Country..."
                            options={[
                                { value: "United States", label: "United States" },
                                { value: "United Kingdom", label: "United Kingdom" },
                                { value: "Germany", label: "Germany" },
                                { value: "France", label: "France" },
                                { value: "Canada", label: "Canada" },
                                { value: "India", label: "India" },
                                { value: "Brazil", label: "Brazil" }
                            ]}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Device Distribution</label>
                            <div className="text-[10px] font-bold text-gray-900 uppercase flex gap-3">
                                <span className="flex items-center gap-1"><Monitor size={12} className={deviceSplit > 50 ? 'text-[#ff4d00]' : 'text-gray-400'} /> Desktop: {deviceSplit}%</span>
                                <span className="flex items-center gap-1"><Smartphone size={12} className={deviceSplit < 50 ? 'text-[#ff4d00]' : 'text-gray-400'} /> Mobile: {100 - deviceSplit}%</span>
                            </div>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={deviceSplit}
                            onChange={(e) => setDeviceSplit(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                        />
                    </div>
                </div>
            </div>

            {/* Step 4: Behavior */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 04</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-[#ff4d00]" /> Behavior
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Bounce Rate (%)</label>
                        <input 
                            type="number" min="0" max="100"
                            value={bounceRate} 
                            onChange={(e) => setBounceRate(parseInt(e.target.value))}
                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Time on Page</label>
                        <CustomSelect
                            value={timeOnPage}
                            onChange={setTimeOnPage}
                            options={[
                                { value: "30 seconds", label: "30 seconds" },
                                { value: "1 minute", label: "1 minute" },
                                { value: "3 minutes", label: "3 minutes" },
                                { value: "5 minutes", label: "5 minutes" }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Step 5: Source */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 05</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <MousePointer size={20} className="text-[#ff4d00]" /> Traffic Source
                </h3>

                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Source Type</label>
                    <CustomSelect
                        value={trafficSource}
                        onChange={setTrafficSource}
                        options={[
                            { value: "organic", label: "Organic (Search Engine)" },
                            { value: "direct", label: "Direct Traffic" },
                            { value: "social", label: "Social Media" }
                        ]}
                    />
                </div>

                {trafficSource === 'organic' && (
                    <div className="mt-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Keywords (One per line)</label>
                        <textarea
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="best seo tools&#10;traffic generator"
                            className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#ff4d00] h-24 resize-none"
                        />
                    </div>
                )}
            </div>

            {/* Step 6: Journey & Content */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 06</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Split size={20} className="text-[#ff4d00]" /> Journey & Content
                </h3>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pages per Visitor</label>
                            <span className="text-xs font-bold text-gray-900">{pagesPerVisitor} Pages</span>
                        </div>
                        <input
                            type="range" min="1" max="15"
                            value={pagesPerVisitor}
                            onChange={(e) => setPagesPerVisitor(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d00]"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Sitemap URL</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="url"
                                value={sitemapUrl} 
                                onChange={(e) => setSitemapUrl(e.target.value)}
                                placeholder="https://example.com/sitemap.xml"
                                className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Auto-Crawl (1h)</label>
                                <button 
                                    onClick={() => setSitemapAutoCrawl(!sitemapAutoCrawl)}
                                    className={`w-10 h-5 flex items-center p-0.5 transition-colors duration-300 rounded-full ${sitemapAutoCrawl ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white shadow-sm rounded-full transform transition-transform duration-300 ${sitemapAutoCrawl ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                            We'll automatically extract links from your sitemap. If enabled, this randomizes the funnel.
                        </p>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wide block mb-3">Custom Funnel Steps</label>
                        <p className="text-[10px] text-gray-400 mb-4">
                            Define specific URLs for each step of the journey. One per line. Max 500 URLs per step.
                        </p>
                        
                        <div className="space-y-6">
                            {customSubpages.map((page, index) => (
                                <div key={index} className="flex gap-3 items-start">
                                    <span className="text-xs font-bold text-gray-400 w-12 flex-shrink-0 pt-3">Step {index + 1}</span>
                                    <textarea
                                        value={page}
                                        onChange={(e) => updateSubpage(index, e.target.value)}
                                        placeholder={index === 0 ? "https://example.com/features" : "https://example.com/pricing"}
                                        className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-medium text-gray-900 focus:border-[#ff4d00] focus:ring-0 outline-none h-24 resize-y"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 7: Volume */}
            <div className="bg-white border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 border-b border-l border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 07</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Zap size={20} className="text-[#ff4d00]" /> Final Volume
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Total Visitors</label>
                        <div className="relative">
                            <input 
                                type="number"
                                min="100"
                                step="100"
                                value={totalVisitors}
                                onChange={(e) => setTotalVisitors(parseInt(e.target.value) || 0)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hits</div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Duration</label>
                        <div className="relative">
                            <input 
                                type="number"
                                min="1"
                                max="365"
                                value={durationDays}
                                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                                className="w-full bg-[#f9fafb] border border-gray-200 p-4 text-2xl font-black text-gray-900 focus:border-[#ff4d00] outline-none transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Days</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-sm flex gap-4 items-center">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                        <Calculator size={16} className="text-[#ff4d00]" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-900 uppercase">Daily Pace</div>
                        <div className="text-sm font-medium text-gray-600">
                            approx. <span className="font-bold text-gray-900">{dailyVisitors.toLocaleString()}</span> visitors / day
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-1">
            <div className="bg-[#111] text-white p-8 shadow-xl sticky top-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8 border-b border-gray-800 pb-4">Order Summary</h3>
                
                <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">Campaign</span>
                        <span className="text-sm font-bold text-white truncate max-w-[120px]">{name || 'Untitled'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">Volume</span>
                        <span className="text-sm font-bold text-white">{totalVisitors.toLocaleString()} Hits</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">Duration</span>
                        <span className="text-sm font-bold text-white">{durationDays} Days</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">Source</span>
                        <span className="text-sm font-bold text-white capitalize">{trafficSource}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400">Funnel Depth</span>
                        <span className="text-sm font-bold text-white">{pagesPerVisitor} Pages</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        <span className="text-sm font-black uppercase tracking-widest text-[#ff4d00]">Total Cost</span>
                        <span className="text-3xl font-black text-white">€{totalCost.toFixed(2)}</span>
                    </div>
                </div>

                <button 
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="w-full bg-[#ff4d00] text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isSubmitting ? (
                        <RefreshCw size={16} className="animate-spin" />
                    ) : (
                        <>
                            Launch Campaign <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
                
                <p className="text-[10px] text-gray-500 mt-4 text-center leading-relaxed">
                    By confirming, funds will be deducted from your wallet immediately. Traffic starts within 5 minutes.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AddProject;
