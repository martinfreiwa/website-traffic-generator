
import React, { useState, useEffect } from 'react';
import SEO from '../SEO';
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Share2, Tag, Search, Mail, Filter, Rss } from 'lucide-react';

interface BlogProps {
    onBack: () => void;
}

const Blog: React.FC<BlogProps> = ({ onBack }) => {
    const [view, setView] = useState<'list' | 'article'>('list');
    const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [scrollProgress, setScrollProgress] = useState(0);

    // Enhanced Data Structure
    const articles = [
        {
            id: 1,
            title: "The Ultimate Guide to Buying Website Traffic in 2025",
            slug: "ultimate-guide-buying-traffic",
            excerpt: "Everything you need to know about paid traffic sources, how to filter for quality, and strategies to boost your SEO rankings safely without getting penalized.",
            date: "Oct 24, 2025",
            author: "Alex Rivera",
            role: "Traffic Specialist",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            category: "Strategy",
            tags: ["SEO", "Traffic", "Growth"],
            seoDescription: "Learn how to buy high-quality website traffic in 2025. A comprehensive guide for businesses to boost rankings safely."
        },
        {
            id: 2,
            title: "5 SEO Myths Debunked: What Actually Works Now",
            slug: "5-seo-myths-debunked",
            excerpt: "Stop wasting time on outdated SEO tactics like keyword stuffing. We break down what actually works in the age of AI search engines and semantic search.",
            date: "Oct 18, 2025",
            author: "Sarah Chen",
            role: "SEO Director",
            readTime: "5 min read",
            image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            category: "SEO",
            tags: ["Myths", "Google", "Ranking"],
            seoDescription: "We debunk the top 5 SEO myths of 2025. Discover modern strategies for AI-driven search engines."
        },
        {
            id: 3,
            title: "Maximizing ROI on Display Campaigns",
            slug: "maximizing-roi-display",
            excerpt: "Learn how to optimize your display ad spend and target the right audience for higher conversion rates using behavioral data.",
            date: "Oct 10, 2025",
            author: "Mike Ross",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            category: "Marketing",
            tags: ["Ads", "ROI", "Display"],
            seoDescription: "Increase your Return on Ad Spend (ROAS) with these display campaign optimization tips."
        },
        {
            id: 4,
            title: "Why Bot Traffic Kills Your Analytics",
            slug: "bot-traffic-kills-analytics",
            excerpt: "Understanding the difference between good bots and bad bots, and how to filter them out of your Google Analytics 4 reports.",
            date: "Oct 05, 2025",
            author: "Alex Rivera",
            role: "Traffic Specialist",
            readTime: "4 min read",
            image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            category: "Analytics",
            tags: ["GA4", "Bots", "Data"],
            seoDescription: "Protect your data integrity. Learn why bot traffic skews analytics and how to prevent it."
        }
    ];

    const categories = ['All', 'Strategy', 'SEO', 'Marketing', 'Analytics'];

    // Scroll Listener for Progress Bar
    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scroll = `${totalScroll / windowHeight}`;
            setScrollProgress(Number(scroll));
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // SEO Injection Helper


    const handleOpenArticle = (id: number) => {
        const article = articles.find(a => a.id === id);
        if (article) {
            setActiveArticleId(id);
            setView('article');
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setView('list');
        setActiveArticleId(null);
        window.scrollTo(0, 0);
    };

    const handleRSS = () => {
        const rssItems = articles.map(item => `
        <item>
            <title>${item.title}</title>
            <link>https://traffic-creator.com/blog/${item.slug}</link>
            <description>${item.excerpt}</description>
            <pubDate>${new Date(item.date).toUTCString()}</pubDate>
            <guid>https://traffic-creator.com/blog/${item.slug}</guid>
        </item>
      `).join('');

        const rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
        <channel>
            <title>Traffic Creator Journal</title>
            <link>https://traffic-creator.com</link>
            <description>Digital Growth Insights</description>
            ${rssItems}
        </channel>
        </rss>`;

        const blob = new Blob([rssContent], { type: "text/xml" });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const activeArticle = articles.find(a => a.id === activeArticleId);
    const relatedArticles = activeArticle ? articles.filter(a => a.category === activeArticle.category && a.id !== activeArticle.id) : [];

    const seoProps = (view === 'article' && activeArticle) ? {
        title: `${activeArticle.title} | Traffic Creator Journal`,
        description: activeArticle.seoDescription,
        keywords: activeArticle.tags.join(', '),
        type: 'article' as const,
        image: activeArticle.image,
        schema: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": activeArticle.title,
            "image": [activeArticle.image],
            "datePublished": new Date(activeArticle.date).toISOString(),
            "author": [{
                "@type": "Person",
                "name": activeArticle.author
            }],
            "publisher": {
                "@type": "Organization",
                "name": "Traffic Creator",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://traffic-creator.com/logo.png"
                }
            },
            "description": activeArticle.seoDescription
        }
    } : {
        title: "SEO & Traffic Generation Blog | Traffic Creator Insights",
        description: "Expert guides on improving website traffic, CTR manipulation strategies, and technical SEO best practices.",
        keywords: "seo blog, traffic generation tips, ranking strategies",
        type: 'website' as const
    };

    // JSON-LD Schema Generator


    // Filter Logic
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (view === 'article' && activeArticle) {
        return (
            <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
                <SEO {...seoProps} />

                {/* Reading Progress Bar */}
                <div className="fixed top-0 left-0 h-1 bg-[#ff4d00] z-[60]" style={{ width: `${scrollProgress * 100}%` }}></div>

                {/* Article Header */}
                <div className="relative h-[60vh] bg-black group">
                    <img src={activeArticle.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-700" alt="Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                        <button onClick={handleBack} className="text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#ff4d00] transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-10 fade-in duration-700">
                            <div className="flex gap-2 mb-6">
                                <span className="bg-[#ff4d00] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                    {activeArticle.category}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8">
                                {activeArticle.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-8 text-gray-300 text-sm font-medium border-t border-white/20 pt-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                                        {activeArticle.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{activeArticle.author}</div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">{activeArticle.role}</div>
                                    </div>
                                </div>
                                <span className="flex items-center gap-2"><Calendar size={16} /> {activeArticle.date}</span>
                                <span className="flex items-center gap-2"><Clock size={16} /> {activeArticle.readTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two-Column Layout for Article + Sidebar */}
                <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-4 gap-12">

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="prose prose-lg prose-gray max-w-none leading-relaxed prose-headings:font-black prose-headings:tracking-tight prose-a:text-[#ff4d00] prose-img:rounded-sm">
                            <p className="lead text-xl text-gray-600 mb-10 font-medium border-l-4 border-[#ff4d00] pl-6 italic">
                                {activeArticle.excerpt}
                            </p>

                            <p>
                                Buying website traffic can be a game-changer for new businesses looking to establish a digital footprint. However, the landscape is filled with low-quality bot traffic that can do more harm than good. In this guide, we'll explore how to navigate the market safely.
                            </p>

                            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Understanding Traffic Sources</h2>
                            <p>
                                Not all traffic is created equal. The three main categories you need to be aware of are:
                            </p>
                            <ul>
                                <li><strong>Direct Traffic:</strong> Visitors typing your URL directly. Great for brand authority.</li>
                                <li><strong>Referral Traffic:</strong> Visitors coming from other websites. Excellent for building backlinks.</li>
                                <li><strong>Social Traffic:</strong> Visitors from platforms like Facebook, Twitter, and Reddit.</li>
                            </ul>

                            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Dangers of Bot Traffic</h2>
                            <p>
                                Cheap traffic providers often use "click farms" or automated scripts. These visitors bounce immediately (spend 0 seconds on site) and never convert. Search engines like Google can detect this behavior and may penalize your rankings.
                            </p>
                            <div className="bg-gray-50 p-8 my-8 rounded-sm border-l-4 border-black">
                                <h4 className="font-black text-gray-900 mb-2 uppercase text-sm tracking-wide flex items-center gap-2">
                                    <Tag size={16} className="text-[#ff4d00]" /> Pro Tip
                                </h4>
                                <p className="text-gray-600 text-sm m-0">Always verify your traffic using Google Analytics 4 (GA4). Look at the "Engagement Time" metric. Real human traffic will have varied session durations, whereas bots often have exactly 0 or 30 seconds.</p>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">How Traffic Creator Ensures Quality</h2>
                            <p>
                                At Traffic Creator, we use a proprietary filtering system that validates every visitor before they reach your site. We filter by:
                            </p>
                            <ol>
                                <li><strong>Device Fingerprinting:</strong> Ensuring the request comes from a real physical device.</li>
                                <li><strong>Behavioral Analysis:</strong> Checking for natural mouse movements and scroll events.</li>
                                <li><strong>IP Reputation:</strong> Blocking known datacenter IPs and proxies.</li>
                            </ol>

                            <p className="mt-12">
                                Ready to boost your metrics? <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>Start your campaign today</a> and see the difference real traffic makes.
                            </p>
                        </div>

                        {/* Tags Footer */}
                        <div className="mt-20 pt-10 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2 mb-8">
                                {activeArticle.tags.map(tag => (
                                    <span key={tag} className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-sm cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-12">
                        {/* Share */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Share This</h4>
                            <div className="flex gap-2">
                                <button className="p-3 rounded-full border border-gray-200 text-gray-500 hover:text-[#ff4d00] hover:border-[#ff4d00] transition-all" onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}>
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Related Articles */}
                        {relatedArticles.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Related Reads</h4>
                                <div className="space-y-6">
                                    {relatedArticles.map(article => (
                                        <div key={article.id} className="group cursor-pointer" onClick={() => handleOpenArticle(article.id)}>
                                            <div className="aspect-video bg-gray-100 mb-2 overflow-hidden rounded-sm">
                                                <img src={article.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                            <h5 className="text-sm font-bold text-gray-900 group-hover:text-[#ff4d00] leading-tight mb-1">{article.title}</h5>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{article.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Newsletter Box */}
                        <div className="bg-[#111] text-white p-6 text-center rounded-sm">
                            <Mail className="mx-auto mb-4 text-[#ff4d00]" size={24} />
                            <h3 className="text-lg font-black uppercase tracking-tight mb-2">Join the Inner Circle</h3>
                            <p className="text-gray-400 text-xs mb-6">Get exclusive SEO tips delivered to your inbox.</p>
                            <input type="email" placeholder="Email" className="bg-white/10 border-none text-white placeholder-gray-500 px-4 py-2 w-full outline-none focus:ring-1 focus:ring-[#ff4d00] mb-2 text-sm" />
                            <button className="w-full bg-[#ff4d00] text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-white hover:text-black transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- LIST VIEW ---
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <SEO {...seoProps} />
            <div className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#ff4d00] transition-colors text-xs font-bold uppercase tracking-wider">
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                        <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Journal</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-20">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6 leading-[0.9]">
                        Digital <span className="text-[#ff4d00]">Growth</span><br />Insights.
                    </h1>
                    <p className="text-xl text-gray-500 leading-relaxed mb-10">
                        Expert advice on digital marketing, SEO strategies, and traffic optimization for the modern web.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto shadow-lg">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#ff4d00] transition-colors"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-all rounded-full
                            ${selectedCategory === cat
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                }
                        `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                    {filteredArticles.length === 0 ? (
                        <div className="col-span-3 text-center py-20 text-gray-400">
                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No articles found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredArticles.map((article, index) => (
                            <article
                                key={article.id}
                                className="group cursor-pointer flex flex-col h-full animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => handleOpenArticle(article.id)}
                            >
                                <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-6 relative rounded-sm">
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-sm">
                                        {article.category}
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        {article.date} <span className="w-1 h-1 bg-gray-300 rounded-full"></span> {article.readTime}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#ff4d00] transition-colors leading-tight">
                                        {article.title}
                                    </h2>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                                        {article.excerpt}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black group-hover:translate-x-2 transition-transform duration-300 mt-auto">
                                        Read Article <ArrowRight size={14} />
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>

            <footer className="bg-black text-white py-12 px-6 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-xl font-black tracking-tight">TRAFFIC CREATOR</div>
                    <div className="flex gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <button onClick={handleRSS} className="hover:text-white transition-colors flex items-center gap-2">
                            <Rss size={14} /> RSS Feed
                        </button>
                        <button className="hover:text-white transition-colors">Newsletter</button>
                        <button className="hover:text-white transition-colors">Archive</button>
                    </div>
                    <div className="text-xs text-gray-600">© 2025 Traffic Creator Inc.</div>
                </div>
            </footer>
        </div>
    );
};

export default Blog;