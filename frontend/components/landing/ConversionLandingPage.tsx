import React, { useState, useEffect } from 'react';
import SEO from '../SEO';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Check, Zap, Globe, Shield, BarChart3,
    TrendingUp, Search, Target, ChevronDown, ChevronUp,
    AlertTriangle, MousePointer, Eye, Users, Star, Sparkles,
    ShieldCheck, Clock, CheckCircle
} from 'lucide-react';
import AuthModal from './AuthModal';
import TrafficTestWidget from './TrafficTestWidget';
import LiveCounter from './LiveCounter';
import { TIERS, PRICING_MATRIX, formatPrice, formatCPM, getCPM, TierId } from '../../constants/pricing';

interface ConversionLandingPageProps {
    onLogin: () => void;
    onNavigate: (page: string) => void;
}

const ConversionLandingPage: React.FC<ConversionLandingPageProps> = ({ onLogin, onNavigate }) => {
    const [scrolled, setScrolled] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [authMessage, setAuthMessage] = useState('');
    const [pendingUrl, setPendingUrl] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [selectedTier, setSelectedTier] = useState<TierId>('professional');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const webpageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Free Website Traffic Generator - Get 2,000 Free Visitors | Traffic Creator",
        "description": "Get free website traffic instantly. Traffic Creator offers 2,000 free visitors to boost your SEO rankings, CTR, and analytics data. No credit card required.",
        "url": "https://traffic-creator.com/free-website-traffic",
        "mainEntity": {
            "@type": "Service",
            "name": "Free Website Traffic Generator",
            "provider": {
                "@type": "Organization",
                "name": "Traffic Creator"
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "2,000 free visitors for new users"
            }
        }
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is this traffic safe for my AdSense account?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our traffic is designed to be AdSense-safe. We use residential IPs and natural behavior patterns that mimic real visitors."
                }
            },
            {
                "@type": "Question",
                "name": "Are these real visitors or bots?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We use high-quality traffic with residential IPs that appears as real visitors in your analytics. Each visit includes realistic behavior patterns."
                }
            },
            {
                "@type": "Question",
                "name": "Will I see the traffic in Google Analytics?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. All traffic is fully compatible with Google Analytics 4, Google Search Console, and other major analytics platforms."
                }
            },
            {
                "@type": "Question",
                "name": "How do I get free website traffic?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simply enter your website URL above, select your target country, and click 'Start Free Traffic'. Create a free account to receive 2,000 visitors at no cost."
                }
            }
        ]
    };

    const handleOpenAuth = (mode: 'login' | 'signup') => {
        setAuthMode(mode);
        setAuthMessage('');
        setAuthModalOpen(true);
    };

    const handleTestComplete = (email: string, url: string) => {
        setPendingUrl(url);
        setAuthMessage('Your campaign is ready! Create a free account to receive 2,000 visitors.');
        setAuthMode('signup');
        setAuthModalOpen(true);
    };

    const handleAuthSuccess = (role: 'user' | 'admin') => {
        setAuthModalOpen(false);
        onLogin();
    };

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I get free website traffic?",
            answer: "Simply enter your website URL above, select your target country, and click 'Start Free Traffic'. Create a free account to receive 2,000 visitors at no cost—no credit card required."
        },
        {
            question: "Is this traffic safe for my AdSense account?",
            answer: "Yes, our traffic is designed to be AdSense-safe. We use residential IPs and natural behavior patterns that mimic real visitors. Our traffic passes all major analytics filters."
        },
        {
            question: "Are these real visitors or bots?",
            answer: "We use high-quality traffic with residential IPs that appears as real visitors in your analytics. Each visit includes realistic behavior patterns: page views, time on site, and navigation patterns."
        },
        {
            question: "Will I see the traffic in Google Analytics?",
            answer: "Absolutely. All traffic is fully compatible with Google Analytics 4, Google Search Console, and other major analytics platforms. You'll see real-time visitors, sessions, and engagement metrics."
        },
        {
            question: "Are there any hidden costs or subscriptions?",
            answer: "No hidden fees, no mandatory subscriptions. Purchase credit packs as needed, or choose monthly plans for agencies. Everything is transparent and clearly priced."
        },
        {
            question: "What if I'm not satisfied?",
            answer: "We offer a full money-back guarantee. If we fail to deliver the promised visitor count within 72 hours, you're eligible for a complete refund—no questions asked."
        },
        {
            question: "Can I target specific countries?",
            answer: "Yes! We offer geo-targeting for 190+ countries. Premium plans include city-level targeting for local SEO campaigns."
        }
    ];

    const pricingPacks = [
        { volume: 60000, name: "Starter", desc: "Perfect for testing" },
        { volume: 500000, name: "Growth", desc: "Most popular choice", highlight: true, badge: "Most Popular" },
        { volume: 1000000, name: "Business", desc: "Serious growth", badge: "Best Value", badgeColor: "bg-green-500" },
    ];

    const problems = [
        { icon: <TrendingUp size={32} />, title: "Poor Rankings?", desc: "Google ignores sites without traffic signals. Your content stays buried on page 10." },
        { icon: <MousePointer size={32} />, title: "Low CTR?", desc: "Click-through rate is a ranking factor. Low engagement means lower visibility." },
        { icon: <Eye size={32} />, title: "No Analytics Data?", desc: "You can't optimize what you can't measure. Empty dashboards mean no insights." },
    ];

    const steps = [
        { step: 1, title: "Enter Your URL", desc: "Input your website address and select targeting options: country, device type, and traffic source.", icon: <Globe size={24} /> },
        { step: 2, title: "We Send Real Signals", desc: "Our residential network delivers traffic through real ISP connections—not data center IPs that get flagged.", icon: <Shield size={24} /> },
        { step: 3, title: "Watch Results Live", desc: "Monitor your traffic in Google Analytics 4 in real-time. See visitors, sessions, and engagement metrics.", icon: <BarChart3 size={24} /> },
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
            <SEO
                title="Free Website Traffic Generator - Get 2,000 Free Visitors | Traffic Creator"
                description="Get free website traffic instantly. Receive 2,000 free visitors to boost your SEO rankings, CTR, and analytics data. No credit card required. Real residential traffic from 190+ countries."
                keywords="free website traffic, free traffic generator, get free traffic, website traffic free, free visitors, free web traffic, boost website traffic free, free SEO traffic, traffic generator free, increase website traffic free"
                schema={[webpageSchema, faqSchema]}
            />

            {/* Sticky Header */}
            <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'top-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'top-0 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <span className="text-xl md:text-2xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                        <span className="hidden sm:inline-block text-xs font-bold bg-black text-white px-2 py-1 rounded uppercase tracking-wide">Creator</span>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
                            <a href="#problem" className="hover:text-[#ff4d00] transition-colors">Problem</a>
                            <a href="#how-it-works" className="hover:text-[#ff4d00] transition-colors">How It Works</a>
                            <a href="#pricing" className="hover:text-[#ff4d00] transition-colors">Pricing</a>
                        </nav>

                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={() => handleOpenAuth('login')}
                                className="text-sm font-bold text-gray-600 hover:text-[#ff4d00] transition-colors px-3 py-2"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => handleOpenAuth('signup')}
                                className="bg-[#ff4d00] text-white px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wide hover:bg-black transition-colors rounded-xl shadow-lg shadow-orange-500/20"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-28 md:pt-40 pb-16 md:pb-24 px-6 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-50/50 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full text-xs font-bold text-[#ff4d00] uppercase tracking-wide mb-6">
                            <Star size={14} className="fill-[#ff4d00]" />
                            100% Free - No Credit Card Required
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                            Free Website Traffic<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d00] to-orange-500">in Under 5 Minutes</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
                            Get <span className="font-bold text-gray-700">2,000 free visitors</span> to your website. Boost SEO rankings, improve CTR, and fill your analytics with real residential traffic from 190+ countries.
                        </p>
                    </div>

                    <TrafficTestWidget onComplete={handleTestComplete} />
                </div>
            </section>

            {/* Social Proof Bar */}
            <section className="bg-gray-50 border-y border-gray-100 py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-bold uppercase tracking-wide text-xs">Compatible with:</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            {['Google Analytics', 'Semrush', 'WordPress', 'Ahrefs'].map((brand, i) => (
                                <div key={i} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                    <BarChart3 size={18} className="text-gray-400" />
                                    <span className="text-sm font-bold text-gray-700">{brand}</span>
                                </div>
                            ))}
                        </div>

                        <LiveCounter className="shrink-0 bg-white px-4 py-2 rounded-full border border-gray-200" />
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className="py-20 md:py-32 px-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                            <AlertTriangle size={14} />
                            The Problem
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Why Your Website Is Struggling</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">91% of content gets zero traffic from Google. Without visitor signals, search engines ignore your site.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        {problems.map((problem, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:border-[#ff4d00]/30 transition-all group">
                                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-6 text-red-500 group-hover:bg-[#ff4d00] group-hover:text-white transition-colors">
                                    {problem.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{problem.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 md:py-32 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-[#ff4d00]/10 text-[#ff4d00] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                            <Zap size={14} />
                            How It Works
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Three Simple Steps</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">Start receiving quality traffic in under 5 minutes. No technical knowledge required.</p>
                    </div>

                    <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="relative flex flex-col md:flex-col items-start md:items-center text-left md:text-center group">
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#ff4d00]/30 to-transparent" />
                                )}

                                <div className="flex items-center gap-4 md:flex-col md:gap-0 md:mb-6">
                                    <div className="w-24 h-24 bg-gradient-to-br from-[#ff4d00]/10 to-orange-50 rounded-2xl flex items-center justify-center text-[#ff4d00] mb-0 md:mb-4 shrink-0 group-hover:scale-110 transition-transform">
                                        {step.icon}
                                    </div>
                                    <div className="md:hidden">
                                        <div className="text-xs font-bold text-[#ff4d00] uppercase tracking-wide mb-1">Step {step.step}</div>
                                        <h3 className="text-lg font-bold">{step.title}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{step.desc}</p>
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <div className="text-xs font-bold text-[#ff4d00] uppercase tracking-wide mb-2">Step {step.step}</div>
                                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 md:py-32 px-6 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-[#ff4d00]/10 text-[#ff4d00] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                            <Sparkles size={14} />
                            Transparent Pricing
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Pay Only For Results</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">No hidden fees. No monthly contracts. Choose your package and start immediately.</p>
                    </div>

                    <div className="flex justify-center gap-2 mb-8">
                        {TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                onClick={() => setSelectedTier(tier.id)}
                                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                                    selectedTier === tier.id
                                        ? 'bg-[#ff4d00] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } ${tier.popular ? 'ring-2 ring-[#ff4d00]/30' : ''}`}
                            >
                                {tier.name}
                                {tier.popular && <span className="ml-2 text-[10px]">★</span>}
                            </button>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {pricingPacks.map((pack, i) => {
                            const price = PRICING_MATRIX[selectedTier][pack.volume]?.[1] || 0;
                            const cpm = getCPM(selectedTier, pack.volume, 1);
                            const tier = TIERS.find(t => t.id === selectedTier);
                            return (
                                <div
                                    key={i}
                                    className={`relative bg-white rounded-2xl p-8 border transition-all ${pack.highlight ? 'border-2 border-[#ff4d00] shadow-2xl shadow-[#ff4d00]/20 scale-105 z-10' : 'border-gray-100 hover:border-[#ff4d00]/30 hover:shadow-xl'}`}
                                >
                                    {pack.badge && (
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${pack.badgeColor || 'bg-[#ff4d00]'} text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap shadow-lg`}>
                                            {pack.badge}
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{pack.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-gray-900">{formatPrice(price)}</span>
                                            <span className="text-gray-400 text-sm font-medium">one-time</span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 text-center border border-gray-100">
                                        <div className="text-2xl font-black text-gray-900">{pack.volume >= 1000000 ? `${pack.volume / 1000000}M` : `${pack.volume / 1000}k`}</div>
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Visitors</div>
                                        <div className="text-xs text-[#ff4d00] font-bold mt-1">~{formatCPM(cpm)}/1k</div>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-6">{pack.desc}</p>

                                    <ul className="space-y-3 mb-8">
                                        {tier?.features.slice(0, 4).map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <Check size={16} className="text-green-500 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleOpenAuth('signup')}
                                        className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${pack.highlight ? 'bg-[#ff4d00] text-white hover:bg-black shadow-lg' : 'bg-gray-900 text-white hover:bg-[#ff4d00]'}`}
                                    >
                                        Get Started
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            Instant delivery
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            Money-back guarantee
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            190+ countries
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 md:py-32 px-6 bg-white">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Frequently Asked Questions</h2>
                        <p className="text-gray-500">Everything you need to know before getting started.</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                                <button
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleFaq(i)}
                                >
                                    <span className="font-bold text-gray-900 pr-4">{faq.question}</span>
                                    {openFaq === i ? (
                                        <ChevronUp size={20} className="text-[#ff4d00] shrink-0" />
                                    ) : (
                                        <ChevronDown size={20} className="text-gray-400 shrink-0" />
                                    )}
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 md:py-32 px-6 bg-[#ff4d00] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/50 to-transparent" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
                        Ready to Boost Your Traffic?
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                        Join thousands of marketers who trust Traffic Creator for their SEO campaigns.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleOpenAuth('signup')}
                            className="bg-black text-white px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-white hover:text-black transition-colors shadow-xl"
                        >
                            Start Free Trial <ArrowRight size={18} className="inline ml-2" />
                        </button>
                        <Link
                            to="/#pricing"
                            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-white/20 transition-colors"
                        >
                            View All Plans
                        </Link>
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-6 text-white/60 text-sm">
                        <div className="flex items-center gap-2">
                            <Check size={16} /> No credit card
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={16} /> Cancel anytime
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-[#ff4d00]">TRAFFIC</span>
                            <span className="text-xs font-bold bg-white/10 text-white px-2 py-1 rounded uppercase">Creator</span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                            <Link to="/helpdesk" className="hover:text-white transition-colors">Help Center</Link>
                            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link to="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
                            <Link to="/legal/refund" className="hover:text-white transition-colors">Refund Policy</Link>
                        </div>

                        <div className="text-sm text-gray-500">
                            © 2025 Traffic Creator Inc.
                        </div>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                initialMode={authMode}
                onSuccess={handleAuthSuccess}
                message={authMessage}
            />
        </div>
    );
};

export default ConversionLandingPage;