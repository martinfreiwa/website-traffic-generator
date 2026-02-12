
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Check, Zap, Globe, Shield, BarChart3,
    MousePointer, Play, Cpu, Layers, Users, Star,
    MessageSquare, TrendingUp, Search, Target
} from 'lucide-react';
import QuickCampaign from './QuickCampaign';

interface ModernLandingPageProps {
    onLogin: () => void;
    onNavigate: (page: string) => void;
}

const ModernLandingPage: React.FC<ModernLandingPageProps> = ({ onLogin, onNavigate }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-[#ff4d00] selection:text-white">
            <Helmet>
                <title>Traffic Creator - The Modern Way to Grow</title>
                <meta name="description" content="Generate real, organic website traffic with our premium platform. Boost SEO, improve metrics, and grow your digital presence." />
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            </Helmet>

            {/* Floating Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'top-4' : 'top-0'}`}>
                <div className={`max-w-7xl mx-auto px-6 ${scrolled ? 'py-4' : 'py-6'}`}>
                    <div className={`
            flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-300
            ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg border border-gray-100' : 'bg-transparent'}
          `}>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs">
                                TC
                            </div>
                            <span className="font-bold text-lg tracking-tight">TrafficCreator</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                            <a href="#features" className="hover:text-black transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-black transition-colors">How it Works</a>
                            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-bold hover:text-[#ff4d00] transition-colors hidden sm:block">
                                Log in
                            </Link>
                            <Link to="/signup" className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#ff4d00] hover:scale-105 transition-all shadow-xl shadow-orange-500/10">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Bento Style Layout */}
            <section className="pt-40 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-[#ff4d00] text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4">
                                <Star size={12} className="fill-[#ff4d00]" />
                                Trusted by 15,000+ Marketers
                            </div>

                            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1] text-gray-900 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                                Traffic that <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d00] to-orange-500">actually converts.</span>
                            </h1>

                            <p className="text-xl text-gray-500 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                                Stop relying on unpredictable algorithms. Take control of your website traffic with our residential network of real visitors.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                                <Link to="/signup" className="bg-[#ff4d00] text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                                    Start Free Trial <ArrowRight size={18} />
                                </Link>
                                <a href="#how-it-works" className="bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-2xl text-base font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <Play size={18} className="fill-gray-900" /> Watch Demo
                                </a>
                            </div>
                        </div>

                        {/* Abstract Visual */}
                        <div className="relative h-[600px] w-full animate-in fade-in zoom-in duration-1000 delay-200">
                            {/* Background Blobs */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-200/40 to-pink-200/40 rounded-full blur-3xl opacity-50"></div>
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-200/40 to-green-200/40 rounded-full blur-3xl opacity-50"></div>

                            {/* Main Card Stack */}
                            <div className="absolute top-10 right-10 left-10 bottom-10">
                                {/* Card 1: Stats */}
                                <div className="absolute top-0 right-0 w-72 bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-6 border border-gray-100 z-30 transform hover:scale-105 transition-transform duration-500">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ff4d00]">
                                            <TrendingUp size={20} />
                                        </div>
                                        <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">+124%</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-black text-gray-900">42.8k</div>
                                        <div className="text-sm text-gray-400 font-medium">Monthly Visitors</div>
                                    </div>
                                    <div className="mt-6 h-16 flex items-end gap-1">
                                        {[40, 60, 45, 70, 85, 65, 90].map((h, i) => (
                                            <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t-sm ${i === 6 ? 'bg-[#ff4d00]' : 'bg-gray-100'}`}></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card 2: Geo Map */}
                                <div className="absolute bottom-10 left-0 w-80 bg-black text-white rounded-3xl shadow-2xl p-6 z-20 transform hover:-translate-y-2 transition-transform duration-500">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Traffic</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-gray-300">Active</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {['United States', 'Germany', 'United Kingdom'].map((country, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Globe size={14} className="text-gray-500" />
                                                    <span className="text-sm font-bold">{country}</span>
                                                </div>
                                                <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-[#ff4d00] h-full" style={{ width: `${80 - (i * 20)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card 3: User Avatar */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white/60 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-xl z-10 flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full">
                                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Real Human</div>
                                        <div className="text-xs text-gray-500">Session: 2m 45s</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 px-4">
                        <span className="text-[#ff4d00] font-bold tracking-wider uppercase text-xs mb-4 block">Platform Capability</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Everything you need to grow.</h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            We've built the most advanced organic traffic generation engine on the market.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {/* Feature 1 - Large */}
                        <div className="md:col-span-2 bg-[#F5F5F7] rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className="relative z-10 max-w-md">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-[#ff4d00]">
                                    <Target size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Precision Targeting</h3>
                                <p className="text-gray-500 font-medium">Target by keyword, country, device, and even specific browser behavior. Our AI ensures every visitor matches your ideal profile.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-50 group-hover:scale-105 transition-transform duration-500">
                                {/* Abstract Graphic */}
                                <svg viewBox="0 0 200 200" className="w-full h-full">
                                    <circle cx="150" cy="150" r="100" fill="#ff4d00" fillOpacity="0.1" />
                                    <circle cx="100" cy="180" r="80" fill="#ff4d00" fillOpacity="0.1" />
                                </svg>
                            </div>
                        </div>

                        {/* Feature 2 - Tall */}
                        <div className="md:row-span-2 bg-black text-white rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-gray-800/50 to-black pointer-events-none"></div>
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-white border border-gray-700">
                                        <Shield size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">Residential IPs</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">
                                        We route all traffic through real residential networks. No data center IPs, no bot flags. Just pure, organic-looking traffic.
                                    </p>
                                </div>
                                <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800 mt-8 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">System Status</span>
                                    </div>
                                    <div className="text-lg font-mono text-green-400">100% Undetectable</div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#FFF1EB] rounded-3xl p-8 group hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-[#ff4d00]">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Delivery</h3>
                            <p className="text-gray-600 text-sm font-medium">Start receiving visitors within 60 seconds of launching your campaign.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-[#F0F9FF] rounded-3xl p-8 group hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-blue-500">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">GA4 Native</h3>
                            <p className="text-gray-600 text-sm font-medium">Designed specifically to register correctly in Google Analytics 4 reports.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Campaign Integration */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <QuickCampaign />
                </div>
            </section>

            {/* Minimalist CTA */}
            <section className="py-32 px-6 bg-gray-50 border-t border-gray-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black text-gray-900 mb-8 tracking-tight">
                        Ready to break the internet?
                    </h2>
                    <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto">
                        Join the thousands of marketers using Traffic Creator to gain an unfair advantage.
                    </p>
                    <div className="flex flex-col items-center gap-6">
                        <Link to="/signup" className="bg-black text-white px-12 py-5 rounded-full text-lg font-bold hover:bg-[#ff4d00] transition-colors shadow-2xl hover:scale-105 transform duration-300">
                            Get Started for Free
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <Check size={16} className="text-green-500" /> No credit card required
                            <span className="mx-2">•</span>
                            <Check size={16} className="text-green-500" /> Cancel anytime
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 px-6 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500 font-medium">
                    <div>© 2025 Traffic Creator Inc.</div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-black transition-colors">Privacy</a>
                        <a href="#" className="hover:text-black transition-colors">Terms</a>
                        <a href="#" className="hover:text-black transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default ModernLandingPage;
