
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../SEO';
// import { articleContents } from './blogContent';
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Share2, Tag, Search, Mail, Filter, Rss } from 'lucide-react';

interface BlogProps {
    onBack: () => void;
}

const Blog: React.FC<BlogProps> = ({ onBack }) => {
    const { slug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<any[]>([]);
    const [activeArticleContent, setActiveArticleContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [view, setView] = useState<'list' | 'article'>(slug ? 'article' : 'list');

    // Fetch articles on mount
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch('/api/blog/articles');
                const data = await response.json();
                setArticles(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching articles:', error);
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    // Fetch full content when slug changes
    useEffect(() => {
        if (slug) {
            const fetchFullContent = async () => {
                try {
                    const response = await fetch(`/api/blog/articles/${slug}`);
                    if (response.ok) {
                        const data = await response.json();
                        setActiveArticleContent(data.content);
                    }
                } catch (error) {
                    console.error('Error fetching article content:', error);
                }
            };
            fetchFullContent();
        } else {
            setActiveArticleContent(null);
        }
    }, [slug]);


    // Data loaded from API


const categories = ['All', 'Reviews', 'SEO', 'Marketing', 'Guides', 'Crypto', 'Strategy', 'Analytics'];

useEffect(() => {
    if (loading) return;
    if (slug) {
        const article = articles.find(a => a.slug === slug);
        if (article) {
            setActiveArticleId(article.id);
            setView('article');
        } else {
            navigate('/blog');
        }
    } else {
        setView('list');
        setActiveArticleId(null);
    }
}, [slug, articles, loading]);



// SEO Injection Helper


const handleOpenArticle = (id: number) => {
    const article = articles.find(a => a.id === id);
    if (article) {
        navigate(`/blog/${article.slug}`);
        window.scrollTo(0, 0);
    }
};

const handleBack = () => {
    navigate('/blog');
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
    title: "SEO & Traffic Generation Blog 2026 | Traffic Creator Insights",
    description: "Expert guides for 2026 on improving website traffic, CTR manipulation strategies, and technical SEO best practices for modern algorithms.",
    keywords: "seo blog 2026, traffic generation tips, ranking strategies, digital marketing insights",
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
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20 selection:bg-[#ff4d00]/30 underline-offset-4">
            <SEO {...seoProps} />

            <ScrollProgress />

            {/* Article Header - Keeping Dark for impact, but could be changed if requested */}
            <div className="relative h-[60vh] bg-gray-900 group">
                <img src={activeArticle.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-700" alt="Cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div> {/* Fade to white at bottom */}

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
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8 drop-shadow-lg">
                            {activeArticle.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-8 text-gray-200 text-sm font-medium border-t border-white/20 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                                    {activeArticle.author.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-white font-bold">{activeArticle.author}</div>
                                    <div className="text-xs text-gray-300 uppercase tracking-wide">{activeArticle.role}</div>
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
                    <p className="text-xl text-gray-600 mb-10 font-medium border-l-4 border-[#ff4d00] pl-6 italic">
                        {activeArticle.excerpt}
                    </p>

                    {/* Dynamic Article Content - Loaded from Database */}
                    {activeArticleContent ? (
                        <div
                            className="article-content-wrapper text-gray-800"
                            dangerouslySetInnerHTML={{
                                __html: activeArticleContent
                            }}
                        />
                    ) : (
                        <div className="prose prose-lg prose-slate max-w-none leading-relaxed prose-headings:font-black prose-headings:tracking-tight prose-a:text-[#ff4d00] prose-img:rounded-sm space-y-6">
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <p className="text-gray-400">
                                Loading article content...
                            </p>
                        </div>
                    )}

                    {/* Tags Footer */}
                    <div className="mt-20 pt-10 border-t border-gray-200">
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
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Share This</h4>
                        <div className="flex gap-2">
                            <button className="p-3 rounded-full border border-gray-200 text-gray-500 hover:text-[#ff4d00] hover:border-[#ff4d00] transition-all" onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}>
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Related Articles */}
                    {relatedArticles.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Related Reads</h4>
                            <div className="space-y-6">
                                {relatedArticles.slice(0, 5).map(article => (
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
                    <div className="bg-gray-50 border border-gray-100 text-gray-900 p-6 text-center rounded-sm">
                        <Mail className="mx-auto mb-4 text-[#ff4d00]" size={24} />
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Join the Inner Circle</h3>
                        <p className="text-gray-500 text-xs mb-6">Get exclusive SEO tips delivered to your inbox.</p>
                        <input type="email" placeholder="Email" className="bg-white border border-gray-200 text-gray-900 placeholder-gray-400 px-4 py-2 w-full outline-none focus:ring-1 focus:ring-[#ff4d00] mb-2 text-sm" />
                        <button className="w-full bg-[#ff4d00] text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-black hover:text-white transition-colors">
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
        <div className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-md z-50">
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
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6 leading-[0.9] text-gray-900">
                    Digital <span className="text-[#ff4d00]">Growth</span><br />Insights.
                </h1>
                <p className="text-xl text-gray-500 leading-relaxed mb-10">
                    Expert advice on digital marketing, SEO strategies, and traffic optimization for the modern web.
                </p>

                {/* Search Bar */}
                <div className="relative max-w-xl mx-auto shadow-xl">
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 py-4 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:border-[#ff4d00] transition-colors rounded-sm"
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
                                ? 'bg-[#ff4d00] text-white border-[#ff4d00] shadow-lg'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'
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
                            <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-6 relative rounded-sm group shadow-sm">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100"
                                    loading="lazy"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff4d00] shadow-sm border border-gray-100">
                                    {article.category}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    {article.date} <span className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full"></span> {article.readTime}
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-[#ff4d00] transition-colors leading-tight tracking-tight">
                                    {article.title}
                                </h2>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                                    {article.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#ff4d00] group-hover:translate-x-2 transition-transform duration-300 mt-auto">
                                    Read Article <ArrowRight size={14} />
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>

        <footer className="bg-gray-900 text-white py-12 px-6 mt-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-xl font-black tracking-tight">TRAFFIC CREATOR</div>
                <div className="flex gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <button onClick={handleRSS} className="hover:text-white transition-colors flex items-center gap-2">
                        <Rss size={14} /> RSS Feed
                    </button>
                    <button className="hover:text-white transition-colors">Newsletter</button>
                    <button className="hover:text-white transition-colors">Archive</button>
                </div>
                <div className="text-xs text-gray-600">© 2026 Traffic Creator Inc.</div>
            </div>
        </footer>
    </div>
);
};

// Isolated component to prevent re-renders of the main page
const ScrollProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (windowHeight === 0) return;
            const scroll = totalScroll / windowHeight;
            setProgress(scroll);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div
            className="fixed top-0 left-0 h-1 bg-[#ff4d00] z-[60] transition-all duration-100 ease-out"
            style={{ width: `${progress * 100}%` }}
        />
    );
};

export default Blog;