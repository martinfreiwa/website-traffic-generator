import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Share2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

interface BlogProps {
    onBack: () => void;
}

const Blog: React.FC<BlogProps> = ({ onBack }) => {
    const [view, setView] = useState<'list' | 'article'>('list');

    const articles = [
        {
            id: 1,
            title: "The Ultimate Guide to Buying Website Traffic",
            excerpt: "Everything you need to know about paid traffic sources, how to filter for quality, and strategies to boost your SEO rankings safely.",
            date: "Oct 24, 2025",
            author: "Alex Rivera",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "Strategy"
        },
        {
            id: 2,
            title: "5 SEO Myths Debunked in 2025",
            excerpt: "Stop wasting time on outdated SEO tactics. We break down what actually works in the age of AI search engines.",
            date: "Oct 18, 2025",
            author: "Sarah Chen",
            readTime: "5 min read",
            image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "SEO"
        },
        {
            id: 3,
            title: "Maximizing ROI on Display Campaigns",
            excerpt: "Learn how to optimize your display ad spend and target the right audience for higher conversion rates.",
            date: "Oct 10, 2025",
            author: "Mike Ross",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            category: "Marketing"
        }
    ];

    if (view === 'article') {
        return (
            <div className="min-h-screen bg-white font-sans text-gray-900">
                <Helmet>
                    <title>{articles[0].title} - Traffic Creator Blog</title>
                    <meta name="description" content={articles[0].excerpt} />
                    <meta name="keywords" content={`SEO, ${articles[0].category}, website traffic, ${articles[0].author}`} />

                    {/* OpenGraph */}
                    <meta property="og:title" content={articles[0].title} />
                    <meta property="og:description" content={articles[0].excerpt} />
                    <meta property="og:type" content="article" />
                    <meta property="article:published_time" content={new Date(articles[0].date).toISOString()} />
                    <meta property="article:author" content={articles[0].author} />
                </Helmet>
                {/* Article Header */}
                <div className="relative h-[60vh] bg-black">
                    <img src={articles[0].image} className="w-full h-full object-cover opacity-60" alt="Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                        <div className="max-w-4xl mx-auto">
                            <button onClick={() => setView('list')} className="text-white mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-[#ff4d00] transition-colors">
                                <ArrowLeft size={16} /> Back to Blog
                            </button>
                            <div className="bg-[#ff4d00] text-white px-3 py-1 inline-block text-[10px] font-black uppercase tracking-widest mb-4">
                                {articles[0].category}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
                                {articles[0].title}
                            </h1>
                            <div className="flex items-center gap-6 text-gray-300 text-sm font-medium">
                                <span className="flex items-center gap-2"><User size={16} /> {articles[0].author}</span>
                                <span className="flex items-center gap-2"><Calendar size={16} /> {articles[0].date}</span>
                                <span className="flex items-center gap-2"><Clock size={16} /> {articles[0].readTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Article Content */}
                <div className="max-w-3xl mx-auto px-6 py-20">
                    <div className="prose prose-lg prose-gray max-w-none leading-relaxed">
                        <p className="text-xl text-gray-600 mb-10 font-medium">
                            Buying website traffic can be a game-changer for new businesses looking to establish a digital footprint. However, the landscape is filled with low-quality bot traffic that can do more harm than good. In this guide, we'll explore how to navigate the market safely.
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Understanding Traffic Sources</h2>
                        <p className="mb-6">
                            Not all traffic is created equal. The three main categories you need to be aware of are:
                        </p>
                        <ul className="list-disc pl-6 space-y-4 mb-8 text-gray-600">
                            <li><strong>Direct Traffic:</strong> Visitors typing your URL directly. Great for brand authority.</li>
                            <li><strong>Referral Traffic:</strong> Visitors coming from other websites. Excellent for building backlinks.</li>
                            <li><strong>Social Traffic:</strong> Visitors from platforms like Facebook, Twitter, and Reddit.</li>
                        </ul>

                        <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Dangers of Bot Traffic</h2>
                        <p className="mb-6">
                            Cheap traffic providers often use "click farms" or automated scripts. These visitors bounce immediately (spend 0 seconds on site) and never convert. Search engines like Google can detect this behavior and may penalize your rankings.
                        </p>
                        <div className="bg-orange-50 border-l-4 border-[#ff4d00] p-6 my-8">
                            <h4 className="font-bold text-[#ff4d00] mb-2 uppercase text-sm tracking-wide">Pro Tip</h4>
                            <p className="text-gray-700 text-sm">Always verify your traffic using Google Analytics 4 (GA4). Look at the "Engagement Time" metric. Real human traffic will have varied session durations, whereas bots often have exactly 0 or 30 seconds.</p>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">How Modus Ensures Quality</h2>
                        <p className="mb-6">
                            At Modus, we use a proprietary filtering system that validates every visitor before they reach your site. We filter by:
                        </p>
                        <ol className="list-decimal pl-6 space-y-4 mb-8 text-gray-600">
                            <li><strong>Device Fingerprinting:</strong> Ensuring the request comes from a real physical device.</li>
                            <li><strong>Behavioral Analysis:</strong> checking for natural mouse movements and scroll events.</li>
                            <li><strong>IP Reputation:</strong> Blocking known datacenter IPs and proxies.</li>
                        </ol>

                        <p className="mt-12">
                            Ready to boost your metrics? <button onClick={onBack} className="text-[#ff4d00] font-bold underline">Start your campaign today</button> and see the difference real traffic makes.
                        </p>
                    </div>

                    <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-2">
                            {['SEO', 'Marketing', 'Traffic', 'Growth'].map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-sm">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 text-gray-500 hover:text-[#ff4d00] font-bold text-sm uppercase tracking-wide transition-colors">
                            <Share2 size={16} /> Share Article
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Traffic Creator Journal",
        "url": "http://localhost:3000/blog",
        "description": "Expert advice on digital marketing, SEO strategies, and traffic optimization.",
        "publisher": {
            "@type": "Organization",
            "name": "Traffic Creator"
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <Helmet>
                <title>Blog - Traffic Creator | SEO & Marketing Insights</title>
                <meta name="description" content="Read the latest articles on website traffic, SEO strategies, and digital marketing from the Traffic Creator team." />
                <meta name="keywords" content="SEO tips, digital marketing blog, buy traffic guide, SEO myths 2025, website traffic strategy, boost SEO rankings, organic growth tips" />

                {/* OpenGraph */}
                <meta property="og:title" content="Blog - Traffic Creator | SEO & Marketing Insights" />
                <meta property="og:description" content="Expert insights into website traffic generation and SEO optimization." />
                <meta property="og:type" content="blog" />
                <meta property="og:url" content="http://localhost:3000/blog" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Blog - Traffic Creator" />
                <meta name="twitter:description" content="Read our latest insights on traffic and SEO." />

                {/* Schema.org JSON-LD */}
                <script type="application/ld+json">
                    {JSON.stringify(blogSchema)}
                </script>
            </Helmet>
            <div className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-[#ff4d00] transition-colors text-xs font-bold uppercase tracking-wider">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#ff4d00] tracking-tight">MODUS</span>
                        <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Journal</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">Latest Insights</h1>
                    <p className="text-xl text-gray-500 leading-relaxed">Expert advice on digital marketing, SEO strategies, and traffic optimization.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {articles.map(article => (
                        <article key={article.id} className="group cursor-pointer flex flex-col h-full" onClick={() => setView('article')}>
                            <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-6 relative">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
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
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                                    {article.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black group-hover:translate-x-2 transition-transform duration-300">
                                    Read Article <ArrowRight size={14} />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            <footer className="bg-black text-white py-12 px-6 mt-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="text-xl font-black tracking-tight">MODUS</div>
                    <div className="text-xs text-gray-500">© 2025 Modus Traffic Inc.</div>
                </div>
            </footer>
        </div>
    );
};

export default Blog;