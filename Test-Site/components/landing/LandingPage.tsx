
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, BarChart3, Globe, ShieldCheck, ChevronDown, ChevronUp, Target, Clock, Code, TrendingUp, BarChart2, Bitcoin, Briefcase, Search, Zap, AlertTriangle, Cpu, Activity, Moon, Radio, MapPin, Link2 } from 'lucide-react';

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
          icon: <TrendingUp size={32} className="text-[#ff4d00]"/>,
          title: "SEO Ranking Boost",
          metric: "+450%",
          desc: "How a niche blog went from Page 10 to Page 1 by signaling high user engagement to search algorithms."
      },
      {
          icon: <BarChart2 size={32} className="text-[#ff4d00]"/>,
          title: "Analytics Repair",
          metric: "15% Bounce",
          desc: "A SaaS company reduced their bounce rate from 80% to 15% to improve their domain authority score."
      },
      {
          icon: <Bitcoin size={32} className="text-[#ff4d00]"/>,
          title: "Crypto Trending",
          metric: "#1 Spot",
          desc: "A new Token project used volume traffic to trend on CoinMarketCap and CoinGecko within 24 hours."
      },
      {
          icon: <Briefcase size={32} className="text-[#ff4d00]"/>,
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
      <Helmet>
        <title>Traffic Creator - Boost Your Website Traffic</title>
        <meta name="description" content="Generate natural, organic traffic to your website with our advanced traffic creation service. Bypass bot filters with residential IPs and realistic user behavior." />
      </Helmet>
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <span className="text-2xl font-black text-[#ff4d00] tracking-tight group-hover:scale-105 transition-transform">TRAFFIC</span>
            <span className="hidden sm:inline-block text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wide">Creator</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-wide text-gray-500">
              <a href="#problem" className="hover:text-[#ff4d00] transition-colors">The Problem</a>
              <a href="#features" className="hover:text-[#ff4d00] transition-colors">Features</a>
              <a href="#pricing" className="hover:text-[#ff4d00] transition-colors">Pricing</a>
            </div>
            <button 
              onClick={onLogin}
              className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors shadow-md hover:shadow-lg"
            >
              Dashboard Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6 relative bg-gradient-to-b from-white to-orange-50/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-[#ff4d00] border border-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-widest mb-8 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <Zap size={14} className="fill-[#ff4d00]" /> #1 Rated Traffic Source
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-8 text-gray-900 animate-in fade-in slide-in-from-bottom-6">
              REAL VISITORS.<br />
              <span className="text-[#ff4d00]">REAL RESULTS.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8">
              Buy high-quality, targeted website traffic that converts. Boost your SEO rankings, improve analytics, and increase visibility instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10">
              <button onClick={() => onNavigate('signup')} className="bg-[#ff4d00] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-1">
                Start Campaign <ArrowRight size={18} />
              </button>
              <button onClick={() => onNavigate('create-demo')} className="bg-white border border-gray-200 text-gray-900 px-8 py-4 text-sm font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-all transform hover:-translate-y-1">
                Free Demo
              </button>
            </div>
          </div>
          
          {/* Light Theme Abstract Graphic */}
          <div className="relative flex items-center justify-center h-[500px] perspective-1000 animate-in fade-in duration-1000">
             <div className="relative w-80 h-80 animate-[spin_30s_linear_infinite] transform-style-3d">
                 {/* Sphere Container */}
                 <div className="absolute inset-0 rounded-full border border-gray-900/10"></div>
                 <div className="absolute inset-4 rounded-full border-t border-b border-[#ff4d00] transform rotate-45 opacity-60"></div>
                 <div className="absolute inset-8 rounded-full border-l border-r border-[#ff4d00] transform -rotate-45 opacity-60"></div>
                 
                 {/* Inner Rings */}
                 <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff4d00] to-transparent transform -translate-x-1/2 -translate-y-1/2"></div>
                 <div className="absolute top-1/2 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-[#ff4d00] to-transparent transform -translate-x-1/2 -translate-y-1/2"></div>
                 
                 {/* Floating Nodes */}
                 <div className="absolute top-[20%] left-[20%] w-3 h-3 bg-[#ff4d00] rounded-full shadow-[0_0_15px_#ff4d00] animate-pulse"></div>
                 <div className="absolute bottom-[30%] right-[20%] w-2 h-2 bg-black rounded-full"></div>
                 <div className="absolute top-[40%] right-[10%] w-2 h-2 bg-gray-400 rounded-full"></div>
             </div>
             
             {/* Background glow */}
             <div className="absolute w-[120%] h-[120%] bg-orange-100/50 opacity-50 blur-3xl rounded-full -z-10"></div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM SECTION - LIGHT THEME */}
      <section id="problem" className="bg-white py-32 px-6 border-y border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 text-gray-900">The Invisible Website Problem.</h2>
                  <div className="w-20 h-2 bg-[#ff4d00] mb-8"></div>
                  <p className="text-xl text-gray-600 leading-relaxed mb-8">
                      91% of content gets no traffic from Google. If your website has low traffic, search engines deem it irrelevant.
                  </p>
                  <ul className="space-y-4">
                      {[
                          "Low Domain Authority",
                          "Poor Search Rankings",
                          "Zero Brand Visibility",
                          "Stagnant Growth"
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-gray-700 font-bold text-sm uppercase tracking-wide">
                              <div className="w-2 h-2 bg-[#ff4d00] rounded-full"></div> {item}
                          </li>
                      ))}
                  </ul>
              </div>
              
              {/* Radar / Void Animation - Light Theme */}
              <div className="flex flex-col items-center justify-center p-12 border border-gray-200 rounded-sm bg-gray-50 shadow-inner">
                  <div className="relative w-64 h-64 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden mb-8 shadow-sm">
                      {/* Scanning Line */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-[#ff4d00]/20 to-transparent animate-[spin_3s_linear_infinite] rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
                      
                      {/* Concentric Circles */}
                      <div className="absolute w-3/4 h-3/4 border border-gray-100 rounded-full"></div>
                      <div className="absolute w-1/2 h-1/2 border border-gray-100 rounded-full"></div>
                      <div className="absolute w-1/4 h-1/4 border border-gray-100 rounded-full"></div>
                      
                      {/* Center Point */}
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      
                      <div className="absolute bottom-6 font-mono text-[10px] text-[#ff4d00] animate-pulse uppercase tracking-widest font-bold">Scanning... No Traffic Found</div>
                  </div>
                  
                  <div className="text-center space-y-2">
                      <div className="text-xl font-black text-gray-900 uppercase tracking-tight">Search Engine Void</div>
                      <p className="text-sm text-gray-500 font-medium">Crawlers are skipping your site due to inactivity.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* THE SOLUTION SECTION */}
      <section className="py-32 px-6 bg-[#f9fafb]">
          <div className="max-w-7xl mx-auto text-center mb-20">
              <h2 className="text-3xl font-black uppercase tracking-tight mb-4">The Solution: Modus Engine</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">We bridge the gap between obscurity and authority by injecting high-quality, targeted traffic directly to your URLs.</p>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                  { title: "Select Target", desc: "Input your website URL and choose your desired geography." },
                  { title: "Configure Flow", desc: "Set behavior patterns, bounce rates, and session duration." },
                  { title: "Boost Authority", desc: "Watch your analytics climb and rankings improve." }
              ].map((step, i) => (
                  <div key={i} className="bg-white border border-gray-100 p-10 text-center hover:border-[#ff4d00] hover:shadow-xl transition-all duration-300 group rounded-sm transform hover:-translate-y-2">
                      <div className="text-6xl font-black text-gray-100 mb-6 group-hover:text-[#ff4d00]/20 transition-colors">{i+1}.</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase">{step.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed font-medium">{step.desc}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Features Grid */}
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

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-[#f9fafb]">
        <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Choose Your Growth Plan</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                    {pricingMode === 'business' 
                        ? 'Purchase traffic credits instantly. No recurring fees. Credits never expire.' 
                        : 'Monthly traffic pools for high volume partners. Cancel anytime.'
                    }
                </p>
                
                {/* Pricing Toggle */}
                <div className="inline-flex bg-white border border-gray-200 p-1 rounded-sm shadow-sm">
                    <button 
                        onClick={() => setPricingMode('business')}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
                            pricingMode === 'business' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
                        }`}
                    >
                        Business Growth
                    </button>
                    <button 
                        onClick={() => setPricingMode('agency')}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
                            pricingMode === 'agency' ? 'bg-[#ff4d00] text-white shadow-lg' : 'text-gray-500 hover:text-[#ff4d00]'
                        }`}
                    >
                        Agency & Reseller
                    </button>
                </div>
             </div>

             {pricingMode === 'business' ? (
                 <div className="grid md:grid-cols-4 gap-6">
                    {[
                        { name: "Foundation", traffic: "50,000", price: "€29", desc: "New Sites (Testing and low traffic)" },
                        { name: "Momentum", traffic: "300,000", price: "€129", desc: "Growing Sites (Standard business needs)" },
                        { name: "Breakthrough", traffic: "1,000,000", price: "€399", desc: "Established Sites (High traffic volumes)", featured: true },
                        { name: "Apex", traffic: "3,000,000+", price: "€999", desc: "Industry Leaders (Maximum scale)" },
                    ].map((p, i) => (
                        <div key={i} className={`border p-8 flex flex-col bg-white relative transition-transform duration-300 ${p.featured ? 'border-[#ff4d00] shadow-2xl scale-105 z-10' : 'border-gray-200 hover:shadow-xl hover:border-gray-300'}`}>
                            {p.featured && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff4d00] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-md">Recommended</div>}
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">{p.name}</h3>
                            <div className="text-3xl font-black text-gray-900 mb-1">{p.price}</div>
                            <div className="text-xs font-bold text-[#ff4d00] mb-6">{p.traffic} Visits</div>
                            
                            <p className="text-xs text-gray-500 font-medium mb-8 min-h-[40px] leading-relaxed">
                                {p.desc}
                            </p>
                            
                            <ul className="space-y-3 mb-8 flex-1 border-t border-gray-100 pt-6">
                                <li className="text-xs text-gray-600 flex gap-2 font-medium"><div className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full mt-1"></div> Full Feature Access</li>
                                <li className="text-xs text-gray-600 flex gap-2 font-medium"><div className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full mt-1"></div> Geo Targeting</li>
                                <li className="text-xs text-gray-600 flex gap-2 font-medium"><div className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full mt-1"></div> Mobile/Desktop Split</li>
                            </ul>
                            
                            <button onClick={onLogin} className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all ${p.featured ? 'bg-[#ff4d00] text-white hover:bg-black shadow-lg hover:shadow-xl' : 'bg-gray-100 text-gray-900 hover:bg-black hover:text-white'}`}>
                                Purchase Credits
                            </button>
                        </div>
                    ))}
                 </div>
             ) : (
                 <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        { name: "Agency Pro", traffic: "5 Million", price: "€1,249", features: ["Client Dashboard", "Traffic Pooling", "Priority Support"] },
                        { name: "Agency Scale", traffic: "15 Million", price: "€2,999", featured: true, features: ["Client Dashboard", "Traffic Pooling", "White-Label Reports", "Dedicated Manager"] },
                        { name: "Agency Enterprise", traffic: "50 Million+", price: "Custom", features: ["Everything in Scale", "Full API Access", "Custom Integrations", "Strategy Calls"] },
                    ].map((p, i) => (
                        <div key={i} className={`border p-10 flex flex-col bg-white relative transition-transform duration-300 ${p.featured ? 'border-[#ff4d00] shadow-2xl z-10 scale-105' : 'border-gray-200 hover:shadow-xl'}`}>
                            {p.featured && <div className="absolute top-0 right-0 bg-[#ff4d00] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Best Value</div>}
                            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">{p.name}</h3>
                            <div className="text-4xl font-black text-gray-900 mb-2">{p.price}</div>
                            <div className="text-sm font-bold text-gray-500 mb-8 border-b border-gray-100 pb-4">Monthly Traffic Pool: <span className="text-black">{p.traffic}</span></div>
                            
                            <ul className="space-y-4 mb-10 flex-1">
                                {p.features.map((f, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-3 font-medium">
                                        <div className="w-1.5 h-1.5 bg-[#ff4d00]"></div> {f}
                                    </li>
                                ))}
                            </ul>
                            
                            <button onClick={onLogin} className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors shadow-lg">
                                {p.price === 'Custom' ? 'Contact Sales' : 'Join Program'}
                            </button>
                        </div>
                    ))}
                 </div>
             )}
        </div>
      </section>

      {/* Case Studies Section - Light Theme */}
      <section className="py-32 px-6 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
              <div className="mb-20 text-center">
                  <div className="text-[#ff4d00] text-xs font-bold uppercase tracking-widest mb-2">Success Stories</div>
                  <h2 className="text-4xl font-black uppercase tracking-tight text-gray-900">Proven Results</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {caseStudies.map((study, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 p-8 hover:border-[#ff4d00] transition-all group hover:shadow-lg rounded-sm">
                          <div className="mb-6 opacity-80 group-hover:opacity-100 transition-opacity text-[#ff4d00] bg-white w-16 h-16 flex items-center justify-center rounded-full shadow-sm">
                              {study.icon}
                          </div>
                          <div className="text-3xl font-black text-[#ff4d00] mb-2">{study.metric}</div>
                          <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">{study.title}</h4>
                          <p className="text-sm text-gray-500 leading-relaxed font-medium">
                              {study.desc}
                          </p>
                      </div>
                  ))}
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
                            {openFaq === i ? <ChevronUp size={20} className="text-[#ff4d00]"/> : <ChevronDown size={20} className="text-gray-400"/>}
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
      <footer className="bg-black text-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-2xl font-black text-white tracking-tight">TRAFFIC CREATOR</div>
            <div className="flex flex-col md:flex-row gap-8 text-xs font-bold uppercase tracking-widest text-gray-500 text-center md:text-left">
                <button onClick={() => onNavigate('blog')} className="hover:text-white uppercase">Blog</button>
                <button onClick={() => onNavigate('helpdesk')} className="hover:text-white uppercase">Help Center</button>
                <button onClick={() => onNavigate('refund')} className="hover:text-white uppercase">Refund Policy</button>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white uppercase">Privacy Policy</button>
                <button onClick={() => onNavigate('terms')} className="hover:text-white uppercase">Terms of Service</button>
            </div>
            <div className="text-xs text-gray-600">
                © 2025 Traffic Creator Inc.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
