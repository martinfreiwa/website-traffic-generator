
import React, { useState, useEffect } from 'react';
import SEO from '../SEO';
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageSquare, Mail, CreditCard, Wrench, Globe, Shield } from 'lucide-react';
import { db } from '../../services/db';

interface HelpDeskProps {
    onBack: () => void;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    displayOrder?: number;
    isActive?: boolean;
}

const HelpDesk: React.FC<HelpDeskProps> = ({ onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [faqs, setFaqs] = useState<FAQ[]>([]);

    useEffect(() => {
        db.getFAQs().then(setFaqs).catch(() => setFaqs([]));
    }, []);

    const categories = [
        { id: 'all', label: 'All Topics' },
        { id: 'billing', label: 'Billing & Payments', icon: <CreditCard size={14} /> },
        { id: 'technical', label: 'Technical Support', icon: <Wrench size={14} /> },
        { id: 'general', label: 'General Account', icon: <Globe size={14} /> },
    ];

    const defaultFaqs: FAQ[] = [
        { id: '1', question: "How long does it take for traffic to start?", answer: "Campaigns typically start delivering traffic within 5-15 minutes after creation. However, depending on the complexity of your targeting (specific cities, devices), it may take up to an hour for the first hits to register.", category: 'general' },
        { id: '2', question: "Can I upgrade my plan later?", answer: "Yes, you can upgrade your plan at any time. Simply add funds to your wallet and create a new campaign with the desired higher tier. We recommend the 'Agency' plan for maximum volume.", category: 'billing' },
        { id: '3', question: "Why is my traffic not showing in Google Analytics?", answer: "Ensure you are looking at 'Realtime' reports. Also, verify that your GA4 ID is correct in the project settings. Some traffic filters in GA4 may exclude bot traffic by default; our 'Growth' plan is designed to bypass standard bot filters.", category: 'technical' },
        { id: '4', question: "Is this traffic safe for AdSense?", answer: "Our 'Growth' and 'Agency' traffic tiers are safe for AdSense as they utilize high-quality residential IPs. However, we always recommend monitoring your CTR (Click-Through Rate) and adjusting your campaign speed accordingly.", category: 'technical' },
        { id: '5', question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, American Express via Stripe. We also support PayPal and various Cryptocurrencies (BTC, ETH, USDT).", category: 'billing' },
        { id: '6', question: "How do I reset my API key?", answer: "Navigate to your Profile settings in the dashboard. Under the 'Developer Settings' section, click the refresh icon to invalidate your old key and generate a new one.", category: 'general' }
    ];

    const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

    const filteredFaqs = displayFaqs.filter(f =>
        (activeCategory === 'all' || f.category === activeCategory) &&
        (f.question.toLowerCase().includes(searchTerm.toLowerCase()) || f.answer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <SEO
                title="Help Center & Documentation 2024 - Traffic Bot Support"
                description="Find answers to common questions, setup guides, and API documentation for Traffic Bot in 2024."
                keywords="traffic bot support 2024, help center, documentation, faq, seo tool support"
                type="article"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": filteredFaqs.map(faq => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": faq.answer
                        }
                    }))
                }}
            />
            {/* Header */}
            <div className="bg-[#111] text-white pt-20 pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff4d00] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-xs font-bold uppercase tracking-wider transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">How can we help?</h1>

                    <div className="relative max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for answers..."
                            className="w-full bg-white text-gray-900 pl-16 pr-6 py-5 rounded-sm shadow-xl text-lg font-medium outline-none focus:ring-2 focus:ring-[#ff4d00]"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-20 pb-20">

                {/* Categories */}
                <div className="flex flex-wrap gap-4 mb-12">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-6 py-4 rounded-sm shadow-sm flex items-center gap-3 text-sm font-bold uppercase tracking-wider transition-all
                            ${activeCategory === cat.id
                                    ? 'bg-[#ff4d00] text-white transform -translate-y-1'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }
                        `}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border border-gray-100 rounded-sm">
                            <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-gray-900">No results found</h3>
                            <p className="text-gray-500">Try adjusting your search terms or browse all categories.</p>
                        </div>
                    ) : (
                        filteredFaqs.map((faq, index) => (
                            <div key={index} className="bg-white border border-gray-200 shadow-sm transition-all hover:border-gray-300">
                                <button
                                    className="w-full flex items-center justify-between p-6 text-left"
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                >
                                    <span className="font-bold text-gray-900 text-lg">{faq.question}</span>
                                    {openFaq === index ? <ChevronUp size={20} className="text-[#ff4d00]" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-8 pt-2 text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-2 border-t border-gray-50">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Contact Support */}
                <div className="mt-20 bg-gray-50 border border-gray-200 p-10 text-center">
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Still need help?</h3>
                    <p className="text-gray-500 mb-8 max-w-lg mx-auto">Our support team is available 24/7 to assist you with any technical or billing inquiries.</p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2">
                            <Mail size={16} /> Contact Support
                        </button>
                        <button className="bg-white border border-gray-300 text-gray-900 px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors flex items-center gap-2">
                            <MessageSquare size={16} /> Live Chat
                        </button>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="text-xl font-black tracking-tight">TRAFFIC BOT</div>
                    <div className="text-xs text-gray-500">© 2024 EasyTrafficBot UG</div>
                </div>
            </footer>
        </div>
    );
};

export default HelpDesk;