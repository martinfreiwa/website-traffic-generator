
import React, { useState } from 'react';
import SEO from '../SEO';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Globe, ShieldCheck, ChevronDown, ChevronUp, Target, Clock, Code, TrendingUp, BarChart2, Bitcoin, Briefcase, Search, Zap, AlertTriangle, Cpu, Activity, Moon, Radio, MapPin, Link2, Check, Star, Sparkles, Users, Calculator } from 'lucide-react';
import QuickCampaign from './QuickCampaign';

interface LandingPageProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pricingMode, setPricingMode] = useState<'business' | 'agency'>('business');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Traffic Creator",
    "url": "https://traffic-creator.com/",
    "description": "Premium website traffic generator for boosting SEO metrics and engagement.",
    "brand": {
      "@type": "Brand",
      "name": "Traffic Creator"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Traffic Creator",
    "url": "https://traffic-creator.com/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://traffic-creator.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-[#ff4d00]" />,
      title: "Smart Site Crawler",
      description: "Our advanced bots map your entire site architecture to distribute traffic naturally across deep links, not just your homepage."
    },
    {
      icon: <Activity className="w-6 h-6 text-[#ff4d00]" />,
      title: "GA4 Compliant Events",
      description: "Every visit generates real engagement signals—scrolls, clicks, and mouse movements—that are fully verified by Google Analytics 4."
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-[#ff4d00]" />,
      title: "Organic Growth Patterns",
      description: "Traffic volume follows natural diurnal curves and viral spikes, eliminating the flat-line patterns that trigger bot filters."
    },
    {
      icon: <Globe className="w-6 h-6 text-[#ff4d00]" />,
      title: "Elite Residential IPs",
      description: "Traffic originates from verified residential ISPs in your target country, making it indistinguishable from real human visitors."
    },
    {
      icon: <Radio className="w-6 h-6 text-[#ff4d00]" />,
      title: "Live RSS Sync",
      description: "Automatically detect new blog posts and drive immediate traffic to them, signaling freshness to search engines."
    },
    {
      icon: <Moon className="w-6 h-6 text-[#ff4d00]" />,
      title: "Timezone Intelligence",
      description: "Visits are scheduled according to the local business hours of your target audience for maximum realism."
    },
    {
      icon: <Link2 className="w-6 h-6 text-[#ff4d00]" />,
      title: "Social Signal Ready",
      description: "Seamlessly integrates with t.co, bit.ly, and other shorteners to simulate viral social media referral traffic."
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#ff4d00]" />,
      title: "Hyper-Local Targeting",
      description: "Pinpoint your audience by city or region. Perfect for local SEO campaigns and brick-and-mortar businesses."
    }
  ];

  const caseStudies = [
    {
      icon: <TrendingUp size={32} className="text-[#ff4d00]" />,
      title: "SEO Ranking Boost",
      metric: "+450%",
      desc: "How a niche blog went from Page 10 to Page 1 by signaling high user engagement to search algorithms."
    },
    {
      icon: <BarChart2 size={32} className="text-[#ff4d00]" />,
      title: "Analytics Repair",
      metric: "15% Bounce",
      desc: "A SaaS company reduced their bounce rate from 80% to 15% to improve their domain authority score."
    },
    {
      icon: <Bitcoin size={32} className="text-[#ff4d00]" />,
      title: "Crypto Trending",
      metric: "#1 Spot",
      desc: "A new Token project used volume traffic to trend on CoinMarketCap and CoinGecko within 24 hours."
    },
    {
      icon: <Briefcase size={32} className="text-[#ff4d00]" />,
      title: "Agency Growth",
      metric: "50+ Clients",
      desc: "A digital agency resold our traffic to their clients, improving client retention reports by 200%."
    }
  ];

  const faqs = [
    {
      question: "How quickly does traffic start?",
      answer: "Campaigns typically start within 5 minutes of approval. Our network handles over 50M requests daily, ensuring instant scalability."
    },
    {
      question: "Is this traffic Adsense safe?",
      answer: "Yes, our 'Breakthrough' and 'Agency' packages feature 100% Adsense safe traffic, filtered for high engagement and low bounce rates."
    },
    {
      question: "Can I target specific devices?",
      answer: "Absolutely. You can segment traffic by Desktop, Mobile (iOS/Android), and Tablet in the campaign settings."
    },
    {
      question: "Do you offer a money-back guarantee?",
      answer: "Yes. If we fail to deliver the purchased visitor count within 72 hours of the campaign start, you are eligible for a full refund."
    },
    {
      question: "Can I use the API for reselling?",
      answer: "Yes, our REST API is designed for agencies and resellers. You can programmatically create projects, check stats, and manage clients."
    },
    {
      question: "What is the difference between Bounce Rate and Return Rate?",
      answer: "Bounce Rate is the percentage of visitors who leave after one page. Return Rate is the percentage of visitors who come back to your site later. You can configure both."
    },
    {
      question: "How do I configure geolocation targeting?",
      answer: "In your project settings, simply select the countries you wish to target. For 'Agency' plans, you can specify individual cities."
    },
    {
      question: "Can I stop and restart my campaigns?",
      answer: "Yes, you have full control. You can pause, resume, or stop campaigns instantly from the dashboard at any time."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-hidden">
      <SEO
        title="Traffic Creator - #1 Website Traffic Generator for SEO & Rankings (2026)"
        description="Boost your SEO rankings in 2026 with real residential website traffic. Traffic Creator helps you manipulate CTR, increase dwell time, and improve domain authority naturally using advanced AI-driven behavioral simulation."
        keywords="website traffic 2026, boost traffic, SEO traffic, organic traffic, traffic generator, buy website traffic, traffic creator, website visitors, GA4 traffic, CTR manipulation"
        schema={[organizationSchema, websiteSchema]}
      />
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <span className="text-2xl font-black text-[#ff4d00] tracking-tight group-hover:scale-105 transition-transform">TRAFFIC</span>
            <span className="hidden sm:inline-block text-xs font-bold bg-[#ff4d00] text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-wide text-gray-500">
              <a href="#problem" className="hover:text-[#ff4d00] transition-colors">The Problem</a>
              <a href="#features" className="hover:text-[#ff4d00] transition-colors">Features</a>
              <Link to="/pricing" className="hover:text-[#ff4d00] transition-colors uppercase">Pricing</Link>
            </div>
            <Link
              to="/login"
              className="bg-[#ff4d00] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-md hover:shadow-lg flex items-center"
            >
              Dashboard Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-white">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}>
        </div>

        {/* Radial Gradient Glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-black/5 border border-black/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-8 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse"></span> Live Traffic Network Active
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-gray-900 animate-in fade-in slide-in-from-bottom-6">
              DOMINATE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d00] to-orange-600">SEARCH.</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-lg leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8">
              The world's first <span className="text-gray-900 font-bold">intelligent traffic engine</span>. Boost SEO rankings with real residential visitors, certified purely organic by Google Analytics 4.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10">
              <Link to="/signup" className="group bg-[#ff4d00] text-white px-8 py-5 text-sm font-bold uppercase tracking-wider hover:bg-black transition-all shadow-[0_10px_40px_-10px_rgba(255,77,0,0.5)] hover:shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-1 rounded-sm">
                Launch Campaign <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/signup" className="group bg-white border-2 border-gray-100 text-gray-900 px-8 py-5 text-sm font-bold uppercase tracking-wider hover:border-black transition-all transform hover:-translate-y-1 flex items-center justify-center rounded-sm">
                View Live Demo
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-12">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div>Trusted by 2,000+ SEO Agencies</div>
            </div>
          </div>

          {/* Abstract Graphic - Refined */}
          <div className="relative flex items-center justify-center h-[600px] perspective-1000 animate-in fade-in duration-1000 lg:translate-x-10">
            <div className="relative w-96 h-96 animate-[spin_40s_linear_infinite] transform-style-3d">
              {/* Sphere Container */}
              <div className="absolute inset-0 rounded-full border border-gray-900/5"></div>
              <div className="absolute inset-8 rounded-full border border-[#ff4d00]/20 transform rotate-12"></div>
              <div className="absolute inset-16 rounded-full border border-[#ff4d00]/40 transform -rotate-12"></div>

              {/* Orbiting Elements */}
              <div className="absolute top-0 left-1/2 w-4 h-4 bg-[#ff4d00] rounded-full shadow-[0_0_20px_#ff4d00] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
              <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-black rounded-full -translate-x-1/2 translate-y-1/2"></div>

              {/* Inner Globe representation */}
              <div className="absolute inset-24 bg-gradient-to-br from-orange-50 to-white rounded-full shadow-inner flex items-center justify-center border border-gray-100 backdrop-blur-sm">
                <Globe className="text-[#ff4d00] w-24 h-24 opacity-20 animate-pulse" strokeWidth={1} />
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute top-[20%] right-0 bg-white p-4 rounded-lg shadow-xl border border-gray-100 animate-[bounce_4s_infinite] max-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Status</div>
              </div>
              <div className="text-xl font-black text-gray-900">+458%</div>
              <div className="text-[10px] text-gray-400">Traffic Increase (7d)</div>
            </div>

            <div className="absolute bottom-[20%] left-0 bg-white p-4 rounded-lg shadow-xl border border-gray-100 animate-[bounce_5s_infinite] delay-1000 max-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#ff4d00] rounded-full"></div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Live Users</div>
              </div>
              <div className="text-xl font-black text-gray-900">12,405</div>
              <div className="text-[10px] text-gray-400">Active Sessions Now</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Ticker */}
      <section className="bg-[#ff4d00] py-10 overflow-hidden border-y border-orange-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap opacity-50">Powering Leading Brands:</div>
          <div className="flex-1 flex justify-between items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholders for logos - purely text for now with specific fonts/styles to look like logos */}
            <span className="text-xl font-black text-white font-serif italic">Vanguard.</span>
            <span className="text-xl font-bold text-white tracking-widest">NEXUS</span>
            <span className="text-xl font-bold text-white font-mono">CODEBLOCK</span>
            <span className="text-xl font-black text-white tracking-tighter">turbo<span className="text-[#ff4d00]">boost</span></span>
            <span className="text-xl font-medium text-white">Aperture Sci</span>
          </div>
        </div>
      </section>

      {/* Quick Campaign Section */}
      <section id="quick-campaign" className="py-24 px-6 bg-orange-50/50">
        <QuickCampaign />
      </section>

      {/* THE PROBLEM SECTION - DARK THEME */}
      <section id="problem" className="bg-[#ff4d00] py-32 px-6 border-y border-orange-600 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 opacity-90"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <div className="text-white font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> Critical SEO Warning
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8 text-white leading-tight">
              Is Your Website <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-white">Invisible?</span>
            </h2>
            <p className="text-xl text-orange-100 leading-relaxed mb-10 font-light">
              91% of content gets <span className="text-white font-bold">zero traffic</span> from Google. Without active visitor signals, search algorithms deem your site irrelevant and bury it deep in the index.
            </p>

            <div className="space-y-6">
              {[
                { title: "Low Domain Authority", desc: "Search engines trust sites with active user bases." },
                { title: "Poor Search Rankings", desc: "No clicks means no ranking improvements." },
                { title: "Zero Brand Visibility", desc: "Your competitors are taking your customers." },
                { title: "Stagnant Growth", desc: "Great content is useless if nobody sees it." }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-2.5 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  <div>
                    <div className="text-white font-bold text-sm uppercase tracking-wide mb-1">{item.title}</div>
                    <div className="text-orange-200 text-xs font-medium">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar / Void Animation - Orange Theme */}
          <div className="flex flex-col items-center justify-center p-12 border border-white/20 rounded-2xl bg-white/10 backdrop-blur-sm shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl"></div>

            <div className="relative w-72 h-72 rounded-full border border-white/20 bg-white/10 flex items-center justify-center overflow-hidden mb-8 shadow-inner z-10">
              {/* Scanning Line */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/30 to-transparent animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>

              {/* Grid Lines */}
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              {/* Concentric Circles */}
              <div className="absolute w-3/4 h-3/4 border border-white/20 rounded-full"></div>
              <div className="absolute w-1/2 h-1/2 border border-white/20 rounded-full"></div>
              <div className="absolute w-1/4 h-1/4 border border-white/20 rounded-full"></div>

              {/* Center Point */}
              <div className="w-3 h-3 bg-white rounded-full animate-ping shadow-[0_0_20px_rgba(255,255,255,0.8)]"></div>

              {/* No Signal Text */}
              <div className="absolute bottom-1/2 translate-y-8 font-mono text-[10px] text-white uppercase tracking-widest font-bold animate-pulse bg-black/50 px-2 py-1 rounded">No Traffic Signal</div>
            </div>

            <div className="text-center space-y-2 relative z-10">
              <div className="text-xl font-black text-white uppercase tracking-tight">Search Engine Void</div>
              <p className="text-sm text-orange-200 font-medium">Crawlers are skipping your site due to inactivity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE SOLUTION SECTION */}
      <section className="py-32 px-6 bg-white relative overflow-hidden">
        {/* Decorative connecting line */}
        <div className="hidden lg:block absolute top-[50%] left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent border-t border-dashed border-gray-300"></div>

        <div className="max-w-7xl mx-auto text-center mb-20 relative z-10">
          <div className="inline-block bg-[#ff4d00] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-4 rounded-sm">Modus Operations</div>
          <h2 className="text-4xl font-black uppercase tracking-tight mb-4 text-gray-900">The Traffic Injection Engine</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">We bridge the gap between obscurity and authority by injecting high-quality, targeted traffic directly to your URLs.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          {[
            { title: "Target Identification", desc: "Input your URL. Our system analyzes your niche, keywords, and ideal geographic demographics.", icon: <Target className="w-8 h-8 text-[#ff4d00]" /> },
            { title: "Traffic Calibration", desc: "Configure behavior patterns, bounce rates, and session durations to match organic profiles.", icon: <Code className="w-8 h-8 text-[#ff4d00]" /> },
            { title: "Authority Surge", desc: "As consistent traffic flows, search engines validate your site, boosting DA and ranking position.", icon: <TrendingUp className="w-8 h-8 text-[#ff4d00]" /> }
          ].map((step, i) => (
            <div key={i} className="bg-white border border-gray-100 p-8 text-center hover:border-[#ff4d00] hover:shadow-2xl transition-all duration-300 group rounded-xl transform hover:-translate-y-2 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-xl font-black text-gray-300 group-hover:text-[#ff4d00] group-hover:border-[#ff4d00] transition-colors shadow-sm">
                {i + 1}
              </div>
              <div className="mt-8 mb-6 flex justify-center opacity-80 group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-3 uppercase tracking-wide">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-[#f8f9fa] border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-black uppercase tracking-tight mb-6 text-gray-900">Enterprise Capabilities</h2>
              <div className="w-20 h-1.5 bg-[#ff4d00] mb-6"></div>
              <p className="text-gray-500 text-lg leading-relaxed">
                Built for agencies and high-growth businesses. Our platform provides the granular control needed for complex SEO strategies.
              </p>
            </div>
            <Link to="/signup" className="hidden md:flex items-center gap-2 font-bold text-[#ff4d00] border-b-2 border-[#ff4d00] pb-1 hover:text-black hover:border-black transition-all uppercase tracking-widest text-xs">
              View All Features <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 border border-gray-100 hover:border-[#ff4d00] transition-all duration-300 group shadow-sm hover:shadow-xl rounded-xl flex flex-col justify-between h-full">
                <div>
                  <div className="bg-gray-50 w-12 h-12 flex items-center justify-center mb-6 group-hover:bg-[#ff4d00] transition-colors rounded-lg text-[#ff4d00] group-hover:text-white shadow-inner">
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-black mb-3 uppercase tracking-wide text-gray-900 group-hover:text-[#ff4d00] transition-colors">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed font-medium">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link to="/signup" className="inline-flex items-center gap-2 font-bold text-[#ff4d00] border-b-2 border-[#ff4d00] pb-1 uppercase tracking-widest text-xs">
              View All Features <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#ff4d00]/10 text-[#ff4d00] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Transparent Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-gray-900">
              Pay Only For <span className="text-[#ff4d00]">Results</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium text-lg mb-8">
              No hidden fees. No monthly contracts. Volume discounts up to 60%. Choose your quality tier.
            </p>

            <div className="inline-flex bg-gray-900 p-1.5 rounded-xl shadow-2xl">
              <button
                onClick={() => setPricingMode('business')}
                className={`px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${pricingMode === 'business' ? 'bg-[#ff4d00] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Credit Packs
              </button>
              <button
                onClick={() => setPricingMode('agency')}
                className={`px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${pricingMode === 'agency' ? 'bg-[#ff4d00] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Agency Plans
              </button>
            </div>
          </div>

          {pricingMode === 'business' ? (
            <div className="space-y-16">
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { name: "Starter", traffic: "60,000", price: "€29", cpm: "€0.48", desc: "Test new landing pages", highlight: false, badge: null },
                  { name: "Growth", traffic: "500,000", price: "€129", cpm: "€0.26", desc: "Small business baseline", highlight: false, badge: "Most Popular", badgeColor: "bg-[#ff4d00]" },
                  { name: "Business", traffic: "1,000,000", price: "€299", cpm: "€0.30", desc: "Impact domain authority", highlight: true, badge: "Best Value", badgeColor: "bg-green-500" },
                  { name: "Enterprise", traffic: "10,000,000+", price: "€2,099", cpm: "€0.21", desc: "Competitive niches", highlight: false, badge: null },
                ].map((p, i) => (
                  <div key={i} className={`relative group transition-all duration-500 ${p.highlight ? 'md:-mt-4 md:mb-4' : ''}`}>
                    <div className={`h-full flex flex-col bg-white transition-all duration-300 rounded-2xl ${p.highlight ? 'border-2 border-[#ff4d00] shadow-2xl shadow-[#ff4d00]/20 scale-105 z-10' : 'border border-gray-100 hover:border-[#ff4d00]/50 hover:shadow-xl'} p-6`}>
                      {p.badge && (
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${p.badgeColor} text-white px-4 py-1 text-[9px] font-bold uppercase tracking-widest shadow-lg rounded-full whitespace-nowrap`}>
                          {p.badge}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{p.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-gray-900">{p.price}</span>
                          <span className="text-gray-400 text-xs font-medium">one-time</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 text-center border border-gray-100">
                        <div className="text-2xl font-black text-gray-900">{p.traffic}</div>
                        <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wide">Visitors</div>
                        <div className="text-[10px] text-[#ff4d00] font-bold mt-1">~{p.cpm}/1k</div>
                      </div>

                      <p className="text-xs text-gray-500 font-medium mb-4 min-h-[32px]">
                        {p.desc}
                      </p>

                      <ul className="space-y-2 mb-6 flex-1 text-[11px]">
                        <li className="text-gray-600 flex items-center gap-2 font-medium"><Check size={12} className="text-green-500 flex-shrink-0" /> Geo Targeting</li>
                        <li className="text-gray-600 flex items-center gap-2 font-medium"><Check size={12} className="text-green-500 flex-shrink-0" /> Device Split</li>
                        <li className="text-gray-600 flex items-center gap-2 font-medium"><Check size={12} className="text-green-500 flex-shrink-0" /> All Traffic Sources</li>
                      </ul>

                      <Link to="/signup" className={`w-full py-3 text-xs font-bold uppercase tracking-widest transition-all text-center rounded-xl ${p.highlight ? 'bg-[#ff4d00] text-white hover:bg-black shadow-lg' : 'bg-gray-900 text-white hover:bg-[#ff4d00]'}`}>
                        Get Started
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d00]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ff4d00]/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#ff4d00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff4d00]/30">
                      <Users size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-1">Bulk Discounts Available</h3>
                      <p className="text-gray-400 text-sm">Save up to <span className="text-[#ff4d00] font-bold">40%</span> with multi-packs</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-2xl font-black text-white">6x</div>
                      <div className="text-xs text-[#ff4d00] font-bold">-20%</div>
                    </div>
                    <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-2xl font-black text-white">24x</div>
                      <div className="text-xs text-[#ff4d00] font-bold">-40%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                  { name: "Agency Pro", traffic: "5M", price: "€1,249", perVisitor: "€0.00025", features: ["Client Dashboard", "Traffic Pooling", "Priority Support", "API Access"], featured: false },
                  { name: "Agency Scale", traffic: "15M", price: "€2,999", perVisitor: "€0.00020", featured: true, features: ["Everything in Pro", "White-Label Reports", "Dedicated Manager", "Custom Integrations"] },
                  { name: "Agency Enterprise", traffic: "50M+", price: "Custom", perVisitor: "Volume", features: ["Full API Access", "Strategy Calls", "SLA Guarantee", "Custom Features"] },
                ].map((p, i) => (
                  <div key={i} className={`relative h-full ${p.featured ? 'md:-mt-4 md:mb-4' : ''}`}>
                    <div className={`h-full flex flex-col bg-white relative transition-all duration-300 rounded-2xl ${p.featured ? 'border-2 border-[#ff4d00] shadow-2xl shadow-[#ff4d00]/20 z-10 scale-105' : 'border border-gray-100 hover:shadow-xl'} p-8`}>
                      {p.featured && (
                        <div className="absolute -top-3 right-8 bg-[#ff4d00] text-white px-4 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                          <Star size={10} /> Best Value
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">{p.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-gray-900">{p.price}</span>
                          {p.price !== 'Custom' && <span className="text-gray-400 text-xs font-medium">/month</span>}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#ff4d00]/5 to-[#ff4d00]/10 rounded-xl p-4 mb-6 text-center border border-[#ff4d00]/20">
                        <div className="text-3xl font-black text-gray-900">{p.traffic}</div>
                        <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wide">Monthly Pool</div>
                        <div className="text-[10px] text-[#ff4d00] font-bold mt-1">~{p.perVisitor}/visitor</div>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                        {p.features.map((f, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-3 font-medium">
                            <ShieldCheck size={14} className="text-[#ff4d00] flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>

                      <Link to="/signup" className={`w-full py-4 text-xs font-bold uppercase tracking-widest text-center rounded-xl transition-all ${p.featured ? 'bg-[#ff4d00] text-white hover:bg-black shadow-lg' : 'bg-gray-900 text-white hover:bg-[#ff4d00]'}`}>
                        {p.price === 'Custom' ? 'Contact Sales' : 'Start Subscription'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#ff4d00] to-[#ff6b35] rounded-2xl p-6 md:p-8 text-white text-center max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Calculator size={20} />
                  <h4 className="font-black uppercase tracking-wide">Need a Custom Volume?</h4>
                </div>
                <p className="text-white/80 text-sm mb-4">Contact us for enterprise pricing with up to 60% bulk discounts</p>
                <Link to="/signup" className="inline-block bg-white text-[#ff4d00] px-8 py-3 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-colors">
                  Get a Quote
                </Link>
              </div>
            </div>
          )}

          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: <Zap size={20} />, title: "Instant Delivery", desc: "Campaigns start within 5 minutes" },
              { icon: <ShieldCheck size={20} />, title: "Money-Back Guarantee", desc: "Full refund if we fail to deliver" },
              { icon: <Globe size={20} />, title: "Global Coverage", desc: "190+ countries available" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-[#ff4d00]/10 rounded-lg flex items-center justify-center text-[#ff4d00]">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-32 px-6 bg-[#f8f9fa] border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <div className="text-[#ff4d00] text-xs font-bold uppercase tracking-widest mb-2">Real Results</div>
            <h2 className="text-4xl font-black uppercase tracking-tight text-gray-900">Proven Performance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {caseStudies.map((study, i) => (
              <div key={i} className="bg-white border border-gray-100 p-8 hover:border-[#ff4d00] transition-all group hover:shadow-xl rounded-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="opacity-80 group-hover:opacity-100 transition-opacity text-[#ff4d00] bg-orange-50 w-12 h-12 flex items-center justify-center rounded-lg">
                    {study.icon}
                  </div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm">
                    Verified
                  </div>
                </div>

                <div className="text-3xl font-black text-gray-900 mb-2 group-hover:text-[#ff4d00] transition-colors">{study.metric}</div>
                <h4 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">{study.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {study.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA Section */}
      <section className="py-32 px-6 bg-[#ff4d00] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/0 to-black/20"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
            READY TO BREAK<br />THE INTERNET?
          </h2>
          <p className="text-white/90 text-xl font-medium mb-12 max-w-2xl mx-auto">
            Join 5,000+ marketers driving millions of visitors today. No contracts. Instant delivery.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/signup" className="bg-black text-white px-10 py-5 text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl rounded-sm border-2 border-transparent hover:border-white">
              Get Started Now
            </Link>
            <Link to="/signup" className="bg-white text-[#ff4d00] px-10 py-5 text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl rounded-sm">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 bg-[#f9fafb]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-16 text-center text-gray-900">Questions?</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <button
                  className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => toggleFaq(i)}
                >
                  <span className="font-bold text-gray-900">{faq.question}</span>
                  {openFaq === i ? <ChevronUp size={20} className="text-[#ff4d00]" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2 border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#ff4d00] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black text-white tracking-tight">TRAFFIC CREATOR</div>
          <div className="flex flex-col md:flex-row gap-8 text-xs font-bold uppercase tracking-widest text-white/70 text-center md:text-left">
            <Link to="/blog" className="hover:text-white uppercase">Blog</Link>
            <Link to="/helpdesk" className="hover:text-white uppercase">Help Center</Link>
            <Link to="/legal/refund" className="hover:text-white uppercase">Refund Policy</Link>
            <Link to="/legal/privacy" className="hover:text-white uppercase">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-white uppercase">Terms of Service</Link>
          </div>
          <div className="text-xs text-white/60">
            © 2025 Traffic Creator Inc.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
