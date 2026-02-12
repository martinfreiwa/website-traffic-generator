import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Globe, ShieldCheck, ChevronDown, ChevronUp, Target, Clock, Code, TrendingUp, BarChart2, Bitcoin, Briefcase, Search, Zap, AlertTriangle, Cpu, Activity, Moon, Radio, MapPin, Link2 } from 'lucide-react';
import FreeTrafficGenerator from './FreeTrafficGenerator';

interface LandingPageProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

const features = [
    {
      icon: <Cpu className="w-6 h-6 text-[#ff4d00]" />,
      title: "Automatic Crawler",
      description: "Our bots auto-crawl your site to discover deep links, ensuring natural distribution across all pages."
    },
    {
      icon: <Activity className="w-6 h-6 text-[#ff4d00]" />,
      title: "GA4 Natural Events",
      description: "Generates realistic user events (scrolls, clicks) that are fully visible and valid in Google Analytics 4."
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-[#ff4d00]" />,
      title: "Randomized Volume",
      description: "Daily traffic volume fluctuates naturally to mimic real-world viral spikes and organic growth."
    },
    {
      icon: <Globe className="w-6 h-6 text-[#ff4d00]" />,
      title: "Residential Geo IPs",
      description: "Traffic originates from real residential IPs, not datacenters, bypassing advanced bot filters."
    },
    {
      icon: <Radio className="w-6 h-6 text-[#ff4d00]" />,
      title: "RSS & Sitemap",
      description: "Connect your RSS feed or Sitemap to automatically drive traffic to new posts as they are published."
    },
    {
      icon: <Moon className="w-6 h-6 text-[#ff4d00]" />,
      title: "Day/Night Cycle",
      description: "Smart scheduling adjusts traffic volume based on the target country's timezone (active day, quiet night)."
    },
    {
      icon: <Link2 className="w-6 h-6 text-[#ff4d00]" />,
      title: "Shortener Support",
      description: "Fully compatible with bit.ly, cutt.ly, and other link shorteners for social media campaign simulation."
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#ff4d00]" />,
      title: "City Targeting",
      description: "Drill down beyond countries. Target specific cities to simulate hyper-local audience interest."
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

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pricingMode, setPricingMode] = useState<'business' | 'agency'>('business');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-hidden">
      <Helmet>
        <title>Traffic Creator - Premium SEO Traffic | Residential IPs</title>
        <meta name="description" content="High-quality residential IP traffic for boosting SEO metrics and engagement." />
      </Helmet>

      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <span className="text-2xl font-black text-[#ff4d00] tracking-tight group-hover:scale-105 transition-transform">TRAFFIC</span>
            <span className="hidden sm:inline-block text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-wide text-gray-500">
              <a href="#problem" className="hover:text-[#ff4d00] transition-colors">The Problem</a>
              <a href="#features" className="hover:text-[#ff4d00] transition-colors">Features</a>
              <a href="#pricing" className="hover:text-[#ff4d00] transition-colors">Pricing</a>
            </div>
            <Link
              to="/login"
              className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors shadow-md hover:shadow-lg flex items-center"
            >
              Dashboard Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6 relative bg-gradient-to-b from-white to-orange-50/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-[#ff4d00] border border-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-widest mb-8 rounded-full shadow-sm">
              <Zap size={14} className="fill-[#ff4d00]" /> #1 Rated Traffic Source
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-8 text-gray-900">
              REAL VISITORS.<br />
              <span className="text-[#ff4d00]">REAL RESULTS.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed font-medium">
              Buy high-quality, targeted website traffic that converts. Boost your SEO rankings, improve analytics, and increase visibility instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="bg-[#ff4d00] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-1">
                Start Campaign <ArrowRight size={18} />
              </Link>
              <Link to="/signup" className="bg-white border border-gray-200 text-gray-900 px-8 py-4 text-sm font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-all transform hover:-translate-y-1 flex items-center justify-center">
                Free Demo
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center min-h-[500px] z-20">
            <FreeTrafficGenerator />
            <div className="absolute w-[120%] h-[120%] bg-orange-100/50 opacity-50 blur-3xl rounded-full -z-10"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Powerful Features</h2>
            <div className="w-12 h-1 bg-[#ff4d00] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 border border-gray-100 hover:border-[#ff4d00] transition-all duration-300 group shadow-sm hover:shadow-lg flex flex-col items-center text-center">
                <div className="bg-orange-50 w-14 h-14 flex items-center justify-center mb-6 group-hover:bg-[#ff4d00] transition-colors rounded-full text-[#ff4d00] group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="text-sm font-black mb-3 uppercase tracking-wide text-gray-900">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-[#f9fafb]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Pricing Plans</h2>
            <div className="inline-flex bg-white border border-gray-200 p-1 rounded-sm shadow-sm">
              <button onClick={() => setPricingMode('business')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-sm ${pricingMode === 'business' ? 'bg-black text-white' : 'text-gray-500'}`}>Business</button>
              <button onClick={() => setPricingMode('agency')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-sm ${pricingMode === 'agency' ? 'bg-[#ff4d00] text-white' : 'text-gray-500'}`}>Agency</button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {pricingMode === 'business' ? [
                { name: "Foundation", traffic: "50,000", price: "€29", desc: "New Sites" },
                { name: "Momentum", traffic: "300,000", price: "€129", desc: "Growing Sites" },
                { name: "Breakthrough", traffic: "1,000,000", price: "€399", desc: "Established Sites", featured: true },
                { name: "Apex", traffic: "3,000,000+", price: "€999", desc: "Industry Leaders" },
              ].map((p, i) => (
                <div key={i} className={`border p-8 flex flex-col bg-white relative ${p.featured ? 'border-[#ff4d00] shadow-2xl scale-105' : 'border-gray-200'}`}>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">{p.name}</h3>
                  <div className="text-3xl font-black text-gray-900 mb-1">{p.price}</div>
                  <div className="text-xs font-bold text-[#ff4d00] mb-6">{p.traffic} Visits</div>
                  <Link to="/login" className="w-full bg-[#ff4d00] text-white py-4 text-xs font-bold uppercase tracking-widest text-center shadow-lg">Start Now</Link>
                </div>
              )) : [
                { name: "Agency Pro", traffic: "5 Million", price: "€1,249" },
                { name: "Agency Scale", traffic: "15 Million", price: "€2,999", featured: true },
                { name: "Agency Enterprise", traffic: "50 Million+", price: "Custom" },
              ].map((p, i) => (
                <div key={i} className={`border p-8 flex flex-col bg-white relative ${p.featured ? 'border-[#ff4d00] shadow-2xl' : 'border-gray-200'}`}>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">{p.name}</h3>
                  <div className="text-3xl font-black text-gray-900 mb-1">{p.price}</div>
                  <div className="text-xs font-bold text-[#ff4d00] mb-6">{p.traffic} Visits</div>
                  <Link to="/login" className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest text-center shadow-lg">Join Now</Link>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black text-white tracking-tight">TRAFFIC CREATOR</div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-500">
            <Link to="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-white">Terms</Link>
          </div>
          <div className="text-xs text-gray-600">© 2025 Traffic Creator Inc.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;