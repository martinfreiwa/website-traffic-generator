
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Clock, ArrowRight, AlertCircle, CheckCircle, Zap, Users, Globe2, MousePointer, Timer, TrendingUp, Eye, MapPin, Target, BarChart3, Shield } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

interface QuickCampaignProps {
  onSuccess?: () => void;
}

const QuickCampaign: React.FC<QuickCampaignProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [url, setUrl] = useState('');
  const [visitors, setVisitors] = useState(5000);
  const [bounceRate, setBounceRate] = useState(40);
  const [timeOnPage, setTimeOnPage] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formatTimeOnPage = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} minute${mins > 1 ? 's' : ''}`;
  };

  const validateForm = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!projectName || projectName.length < 3) {
      setError('Project name must be at least 3 characters');
      return false;
    }
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      setError('Please enter a valid URL starting with http:// or https://');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const deviceSplit = { desktop: 60, mobile: 30, tablet: 10 };

      const response = await fetch(`${API_BASE_URL}/quick-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          project_name: projectName,
          target_url: url,
          total_visitors: visitors,
          settings: {
            bounce_rate: bounceRate,
            time_on_page: formatTimeOnPage(timeOnPage),
            device_split: deviceSplit
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create campaign');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-3">Campaign Started!</h3>
        <p className="text-gray-600">
          Your <span className="font-bold text-[#ff4d00]">{visitors.toLocaleString()}</span> visitor campaign is running.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative rounded-3xl overflow-hidden shadow-2xl">

      {/* Background Gradient & Textures */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4d00] to-[#e04400] z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0 mix-blend-overlay"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl z-0"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-black opacity-10 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10">
        <div className="text-center mb-10 text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-widest mb-4 rounded-full shadow-sm">
            <Zap size={14} className="fill-white text-white" /> Free Traffic Campaign
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 drop-shadow-sm">
            Get <span className="text-white underline decoration-white/30 decoration-4 underline-offset-4">Real Visitors</span> Today
          </h2>
          <p className="text-xl font-medium text-white/90 max-w-2xl mx-auto">
            Drive up to 10,000 visitors in 24 hours. No credit card required.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* Main Form Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-500">
              <div className="bg-gradient-to-r from-[#ff4d00] to-[#e04400] px-8 py-5 flex items-center gap-4 border-b border-white/10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                  <Globe2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm">Quick Campaign</h3>
                  <p className="text-white/80 text-xs">Fill in the details below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <span className="text-red-700 text-sm font-bold">{error}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block ml-1">Email</label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all outline-none pl-11 shadow-sm"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff4d00] transition-colors">
                        <Users size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block ml-1">Project Name</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Campaign"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block ml-1">Target Website URL</label>
                  <div className="relative group">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-11 text-sm font-bold text-gray-900 focus:border-[#ff4d00] focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all outline-none shadow-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff4d00] transition-colors">
                      <Globe size={16} />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-6 space-y-6 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                    <MousePointer size={12} /> Campaign Settings
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          Visitors
                        </label>
                        <span className="text-lg font-black text-[#ff4d00] bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{visitors.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="10000"
                        step="500"
                        value={visitors}
                        onChange={(e) => setVisitors(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#ff4d00] hover:accent-black transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Bounce Rate</label>
                          <span className="text-sm font-black text-gray-900">{bounceRate}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={bounceRate}
                          onChange={(e) => setBounceRate(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 hover:accent-[#ff4d00] transition-all"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Time on Page</label>
                          <span className="text-sm font-black text-gray-900">
                            {timeOnPage < 60 ? `${timeOnPage}s` : `${Math.floor(timeOnPage / 60)}m ${timeOnPage % 60}s`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="300"
                          step="15"
                          value={timeOnPage}
                          onChange={(e) => setTimeOnPage(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 hover:accent-[#ff4d00] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-100 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-4 border-green-100 shrink-0">
                    <CheckCircle size={20} className="text-green-500 fill-green-50" />
                  </div>
                  <div className="flex-1">
                    <span className="text-green-800 font-extrabold text-sm uppercase tracking-wide block">Free Campaign Summary</span>
                    <span className="text-green-600 text-xs font-medium">{visitors.toLocaleString()} visitors • 24 hours duration</span>
                  </div>
                  <span className="text-2xl font-black text-green-600 tracking-tighter">FREE</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-5 px-6 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed group flex items-center justify-center gap-3 transform active:scale-[0.98]"
                >
                  {isSubmitting ? 'Creating Campaign...' : <>Start Free Campaign <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-2 space-y-4">

            {/* Where to see traffic */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 hover:bg-white transition-colors duration-300">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="bg-orange-50 p-2 rounded-lg">
                  <Eye className="w-5 h-5 text-[#ff4d00]" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Where You'll See Traffic</h3>
              </div>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex gap-3 items-start">
                  <BarChart3 size={16} className="text-[#ff4d00] mt-0.5 shrink-0" />
                  <span><strong className="text-gray-900 block font-bold text-xs uppercase">Google Analytics 4</strong> Real-time and general traffic reports</span>
                </li>
                <li className="flex gap-3 items-start">
                  <BarChart3 size={16} className="text-[#ff4d00] mt-0.5 shrink-0" />
                  <span><strong className="text-gray-900 block font-bold text-xs uppercase">Google Search Console</strong> Improved engagement signals</span>
                </li>
                <li className="flex gap-3 items-start">
                  <BarChart3 size={16} className="text-[#ff4d00] mt-0.5 shrink-0" />
                  <span><strong className="text-gray-900 block font-bold text-xs uppercase">Server Logs</strong> Direct hit requests to your server</span>
                </li>
                <li className="flex gap-3 items-start">
                  <BarChart3 size={16} className="text-[#ff4d00] mt-0.5 shrink-0" />
                  <span><strong className="text-gray-900 block font-bold text-xs uppercase">Heatmaps</strong> Session recordings and scroll depth</span>
                </li>
              </ul>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 hover:bg-white transition-colors duration-300">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="bg-orange-50 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#ff4d00]" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Traffic Sources</h3>
              </div>
              <ul className="space-y-3 text-sm font-medium text-gray-600">
                {['Direct traffic (organic visitors)', 'Organic search (Google, Bing)', 'Social referrals (if enabled)', 'Referral from other sites'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Target size={14} className="text-[#ff4d00]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 hover:bg-white transition-colors duration-300">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="bg-green-50 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Quality & Safety</h3>
              </div>
              <ul className="space-y-3 text-sm font-medium text-gray-600">
                {['Residential IP addresses', 'Real browser fingerprints', 'GA4 compliant events', 'Anti-fingerprinting enabled'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCampaign;
