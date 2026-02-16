
import React, { useState } from 'react';
import SEO from '../SEO';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Activity, BarChart2, CheckCircle, Check, X, ChevronDown, ChevronUp, Globe, MousePointer, Shield, TrendingUp, Zap, Target, Layout, Clock, Play, Server, Lock, Code } from 'lucide-react';
import QuickCampaign from './QuickCampaign';

interface LandingPageProps {
    onLogin: () => void;
    onNavigate: (page: string) => void;
}

const OrganicWebsiteTraffic: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
    const [scrolled, setScrolled] = useState(false);

    // Schema.org Structured Data
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Organic Website Traffic Generator",
        "description": "Premium organic traffic service to boost SEO rankings and manipulate CTS with real residential IPs.",
        "brand": {
            "@type": "Brand",
            "name": "Traffic Creator"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1250"
        }
    };

    const benefits = [
        {
            icon: <Search className="w-6 h-6 text-[#ff4d00]" />,
            title: "Boost Organic CTR",
            desc: "Our visitors search for your keywords and click your result, signaling high relevance to search algorithms."
        },
        {
            icon: <Clock className="w-6 h-6 text-[#ff4d00]" />,
            title: "Increase Dwell Time",
            desc: "Visitors stay on your site for minutes, scroll through content, and interact, drastically reducing bounce rates."
        },
        {
            icon: <Globe className="w-6 h-6 text-[#ff4d00]" />,
            title: "Local SEO Dominance",
            desc: "Target traffic from specific cities or regions to rank higher in local search results and map packs."
        },
        {
            icon: <Shield className="w-6 h-6 text-[#ff4d00]" />,
            title: "100% Human Behavior",
            desc: "Mouse movements, scrolling, and clicks are randomized to mimic real human interaction perfectly."
        }
    ];

    const comparisons = [
        { feature: "Traffic Source", us: "Real Residential IPs", them: "Data Center Proxies" },
        { feature: "Behavior", us: "Scrolls, Clicks, Reads", them: "Static Hits" },
        { feature: "Google Analytics", us: "100% Recognized", them: "Often Filtered / Bot" },
        { feature: "Effect on SEO", us: "Positive Ranking Signal", them: "Neutral or Negative" },
        { feature: "AdSense Safe", us: "Yes, Verified", them: "High Risk of Ban" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
            <SEO
                title="Buy Organic Website Traffic 2026 - Real Residential IPs & CTR Booster"
                description="Get 100% real organic traffic from residential IPs in 2026. Our advanced AI traffic bot simulates human behavior (scroll, click, read) to boost your SERP rankings and improve engagement metrics."
                keywords="organic website traffic 2026, buy organic traffic, seo traffic, ctr manipulation, boost rankings, real website visitors, ai traffic bot"
                schema={schema}
                type="product"
            />

            {/* Navigation */}
            <nav className="fixed w-full top-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-100/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                        <span className="text-2xl font-black text-[#ff4d00] tracking-tight group-hover:scale-105 transition-transform">TRAFFIC</span>
                        <span className="hidden sm:inline-block text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-wide text-gray-500">
                            <a href="#how-it-works" className="hover:text-[#ff4d00] transition-colors relative group">
                                How It Works
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff4d00] transition-all group-hover:w-full"></span>
                            </a>
                            <a href="#benefits" className="hover:text-[#ff4d00] transition-colors relative group">
                                Features
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff4d00] transition-all group-hover:w-full"></span>
                            </a>
                            <Link to="/pricing" className="hover:text-[#ff4d00] transition-colors relative group">
                                Pricing
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff4d00] transition-all group-hover:w-full"></span>
                            </Link>
                        </div>
                        <Link to="/login" className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center rounded-sm">
                            Dashboard Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-32 px-6 relative overflow-hidden bg-white">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none rounded-bl-[100px]"></div>
                <div className="absolute top-40 left-10 w-4 h-4 rounded-full bg-orange-200 animate-pulse"></div>
                <div className="absolute top-60 right-20 w-3 h-3 rounded-full bg-blue-200 animate-bounce delay-700"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="inline-flex items-center gap-2 bg-orange-50 text-[#ff4d00] border border-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-widest mb-8 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <Zap size={14} className="fill-[#ff4d00]" /> SEO Intelligence Engine
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-8 text-gray-900">
                            DOMINATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d00] to-orange-500">ORGANIC</span><br />SEARCH RESULTS.
                        </h1>
                        <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed font-medium">
                            The only organic website traffic generator designed for SEO professionals. Manipulate CTR, increase dwell time, and signal authority to Google.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/signup" className="group bg-[#ff4d00] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-black transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 rounded-sm transform hover:-translate-y-1">
                                Launch SEO Campaign
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#demo" className="bg-white border border-gray-200 text-gray-900 px-8 py-4 text-sm font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 rounded-sm group">
                                <Play size={16} className="group-hover:fill-[#ff4d00]" /> View Live Demo
                            </a>
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Used by 15,000+ SEO Agencies</span>
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* Visual: Abstract SEO Graph */}
                    <div className="relative h-[550px] perspective-1000 group">
                        {/* Card Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-gray-50 transform rotate-6 scale-95 opacity-50 rounded-2xl border border-gray-100 transition-transform duration-700 group-hover:rotate-3 group-hover:scale-95"></div>

                        {/* Main Interface Card */}
                        <div className="absolute inset-0 bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 overflow-hidden transform transition-transform duration-700 group-hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none"></div>

                            {/* Fake Browser Header */}
                            <div className="border-b border-gray-100 pb-4 mb-6 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                                <div className="ml-6 bg-gray-100 rounded-lg h-5 w-64 flex items-center px-2">
                                    <Lock size={10} className="text-gray-400 mr-2" />
                                    <div className="w-32 h-2 bg-gray-200 rounded-sm"></div>
                                </div>
                            </div>

                            {/* SERP Simulation */}
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`p-5 rounded-lg border transition-all duration-500 hover:shadow-lg cursor-default relative overflow-hidden ${i === 1 ? 'border-[#ff4d00]/20 bg-orange-50/30' : 'border-gray-50 bg-white'}`}>

                                        {i === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-[#ff4d00]"></div>}

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {i === 1 ? 'TC' : 'Ad'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="w-32 h-2 bg-gray-200 rounded-sm mb-1"></div>
                                                <div className="w-48 h-2 bg-gray-100 rounded-sm"></div>
                                            </div>
                                        </div>

                                        <div className={`w-3/4 h-5 rounded-sm mb-3 ${i === 1 ? 'bg-gradient-to-r from-[#ff4d00] to-orange-400' : 'bg-blue-100'}`}></div>
                                        <div className="space-y-2">
                                            <div className="w-full h-2 bg-gray-100 rounded-sm"></div>
                                            <div className="w-5/6 h-2 bg-gray-100 rounded-sm"></div>
                                        </div>

                                        {i === 1 && (
                                            <div className="mt-4 flex items-center gap-2 text-[#ff4d00] text-xs font-bold uppercase tracking-wider animate-pulse">
                                                <TrendingUp size={12} /> Rank #1 • CTR Boost Active
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Floating Stats Badge */}
                            <div className="absolute bottom-6 right-6 bg-gray-900/95 backdrop-blur-md text-white p-5 rounded-xl shadow-2xl z-20 border border-gray-800 animate-in fade-in slide-in-from-bottom-4 delay-300">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ff4d00] mb-2 flex items-center gap-2">
                                    <Activity size={12} /> Performance
                                </div>
                                <div className="text-4xl font-black mb-1">18.4%</div>
                                <div className="text-xs text-gray-400 font-medium">Organic CTR (7 Days)</div>
                                <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                                    <div className="w-[70%] h-full bg-[#ff4d00]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Campaign Showcase */}
            {/* Quick Campaign Showcase */}
            <section id="demo" className="py-24 px-6 bg-white">
                <QuickCampaign />
            </section>

            {/* Benefits Grid */}
            <section id="benefits" className="py-32 px-6 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-6">Why Rank #1?</h2>
                        <div className="w-16 h-1.5 bg-[#ff4d00] mx-auto mb-8 rounded-full"></div>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            Search algorithms are evolving. Backlinks aren't enough. You need <span className="text-gray-900 font-bold">User Signals</span>. Traffic Creator generates the perfect dwell time, scroll depth, and interaction metrics.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex gap-8 p-10 border border-gray-100 hover:border-[#ff4d00]/30 bg-white hover:bg-orange-50/20 shadow-sm hover:shadow-xl transition-all duration-300 group rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-0 bg-[#ff4d00] group-hover:h-full transition-all duration-300"></div>

                                <div className="shrink-0">
                                    <div className="bg-orange-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-[#ff4d00] group-hover:rotate-6 transition-all duration-300 text-[#ff4d00] group-hover:text-white shadow-sm">
                                        {b.icon}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#ff4d00] transition-colors">{b.title}</h3>
                                    <p className="text-gray-500 leading-relaxed font-medium">
                                        {b.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technical Detail / Dark Mode Section */}
            <section className="py-32 px-6 bg-[#f9fafb] border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div className="pl-8 border-l-2 border-gray-200 hover:border-[#ff4d00] transition-colors duration-300">
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                                    <Target className="text-[#ff4d00]" size={24} /> Keyword Targeting
                                </h3>
                                <p className="text-gray-500 text-lg leading-relaxed font-medium">
                                    Don't just send traffic to a URL. Our system mimics a user searching for your specific keywords on Google, finding your result, and clicking it. This is the ultimate signal for relevance.
                                </p>
                            </div>
                            <div className="pl-8 border-l-2 border-gray-200 hover:border-[#ff4d00] transition-colors duration-300">
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                                    <Layout className="text-[#ff4d00]" size={24} /> Complex Journeys
                                </h3>
                                <p className="text-gray-500 text-lg leading-relaxed font-medium">
                                    Define multi-page paths. Visitors land on your blog post, read for 60 seconds, click to your pricing page, and then visit your contact form.
                                </p>
                            </div>
                        </div>

                        {/* Code Block Visual */}
                        <div className="bg-[#111] text-gray-300 p-2 rounded-xl shadow-2xl relative overflow-hidden group">
                            {/* Window Actions */}
                            <div className="flex items-center gap-2 p-4 border-b border-gray-800 bg-[#151515] rounded-t-lg">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="text-xs font-mono text-gray-500 ml-4 flex items-center gap-2">
                                    <Code size={12} /> campaign_config.json
                                </div>
                            </div>

                            <div className="p-8 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto">
                                <div className="opacity-50 mb-4 text-[10px] uppercase tracking-widest">// Traffic Configuration</div>
                                <div><span className="text-purple-400">const</span> <span className="text-blue-400">campaign</span> = {'{'}</div>
                                <div className="pl-4">
                                    <span className="text-gray-400">target:</span> <span className="text-green-400">"Top 3 Positions"</span>,
                                </div>
                                <div className="pl-4">
                                    <span className="text-gray-400">keywords:</span> [
                                </div>
                                <div className="pl-8 text-orange-300">"ranking boost services",</div>
                                <div className="pl-8 text-orange-300">"buy organic traffic",</div>
                                <div className="pl-8 text-orange-300">"seo ctr manipulation"</div>
                                <div className="pl-4">],</div>
                                <div className="pl-4">
                                    <span className="text-gray-400">behavior:</span> {'{'}
                                </div>
                                <div className="pl-8">
                                    <span className="text-blue-300">timeOnPage:</span> <span className="text-yellow-300">"185s"</span>,
                                </div>
                                <div className="pl-8">
                                    <span className="text-blue-300">scrollDepth:</span> <span className="text-yellow-300">"85%"</span>,
                                </div>
                                <div className="pl-8">
                                    <span className="text-blue-300">bounceRate:</span> <span className="text-yellow-300">"12%"</span>
                                </div>
                                <div className="pl-4">{'}'}</div>
                                <div>{'}'};</div>

                                <div className="mt-6 flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> compiler ready
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Comparison */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Quality Matters</h2>
                        <p className="text-gray-500">Don't risk your domain authority with cheap bot traffic.</p>
                    </div>

                    <div className="bg-white shadow-[0_10px_60px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden border border-gray-100">
                        <div className="grid grid-cols-3 bg-gray-900 text-white p-6 text-xs font-bold uppercase tracking-widest">
                            <div className="pl-4">Feature</div>
                            <div className="text-[#ff4d00] flex items-center gap-2"><Zap size={14} className="fill-[#ff4d00]" /> Traffic Creator</div>
                            <div className="text-gray-500">Cheap Bots</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {comparisons.map((c, i) => (
                                <div key={i} className="grid grid-cols-3 p-6 items-center text-sm font-medium hover:bg-gray-50 transition-colors group">
                                    <div className="font-bold text-gray-900 flex items-center gap-3 pl-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#ff4d00] transition-colors"></div>
                                        {c.feature}
                                    </div>
                                    <div className="flex items-center gap-3 text-[#ff4d00] font-bold bg-orange-50/50 -my-6 py-6 border-x border-orange-100/50">
                                        <CheckCircle size={18} className="ml-4" /> {c.us}
                                    </div>
                                    <div className="text-gray-400 flex items-center gap-3 pl-4">
                                        <X size={16} /> {c.them}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6 bg-[#ff4d00] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-8 text-white">Start Ranking Now</h2>
                    <p className="text-xl text-white/90 mb-12 font-medium max-w-2xl mx-auto">
                        Your competitors are already doing it. Level the playing field with the world's most advanced organic traffic generator.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/signup" className="bg-white text-black px-12 py-5 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 rounded-sm transform hover:-translate-y-1">
                            Start Free Trial <ArrowRight size={18} />
                        </Link>
                        <Link to="/pricing" className="bg-transparent border-2 border-white text-white px-12 py-5 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-[#ff4d00] transition-all rounded-sm flex items-center justify-center">
                            View Pricing
                        </Link>
                    </div>
                    <div className="mt-12 text-white/60 text-xs font-bold uppercase tracking-widest">
                        No Credit Card Required for Trial • 100% Secure • Cancel Anytime
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-20 px-6 border-t border-gray-900">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <div className="text-3xl font-black text-white tracking-tight mb-6">TRAFFIC CREATOR</div>
                        <p className="text-gray-500 max-w-sm mb-8">
                            The industry standard for SEO traffic generation. We help agencies and site owners improve their search visibility signals safely.
                        </p>
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-500 hover:bg-[#ff4d00] hover:text-white transition-colors cursor-pointer">
                                    <Globe size={16} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Platform</h4>
                        <ul className="space-y-4 text-sm font-medium text-gray-300">
                            <li><Link to="/how-it-works" className="hover:text-[#ff4d00] transition-colors">How it Works</Link></li>
                            <li><Link to="/pricing" className="hover:text-[#ff4d00] transition-colors">Pricing</Link></li>
                            <li><Link to="/login" className="hover:text-[#ff4d00] transition-colors">Dashboard</Link></li>
                            <li><Link to="/affiliate" className="hover:text-[#ff4d00] transition-colors">Affiliate Program</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Company</h4>
                        <ul className="space-y-4 text-sm font-medium text-gray-300">
                            <li><Link to="/blog" className="hover:text-[#ff4d00] transition-colors">SEO Blog</Link></li>
                            <li><Link to="/helpdesk" className="hover:text-[#ff4d00] transition-colors">Help Center</Link></li>
                            <li><Link to="/legal/privacy" className="hover:text-[#ff4d00] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/legal/terms" className="hover:text-[#ff4d00] transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-900 flex justify-between items-center text-xs text-gray-600">
                    <div>© 2025 Traffic Creator Inc. All rights reserved.</div>
                    <div className="flex gap-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Systems Operational</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OrganicWebsiteTraffic;
