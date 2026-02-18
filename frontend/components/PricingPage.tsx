
import React, { useState, useEffect } from 'react';
import SEO from './SEO';
import { ChevronRight, Check, Zap, Rocket, Shield, Globe, Terminal, Users, Search, ShoppingCart, ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';
import { db } from '../services/db';
import { Link } from 'react-router-dom';
import { TIERS, PRICING_MATRIX, VOLUME_STEPS, formatPrice, formatCPM, getCPM, TierId } from '../constants/pricing';

const PricingPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pricingTab, setPricingTab] = useState<'subscriptions' | 'credits'>('subscriptions');
    const [selectedTier, setSelectedTier] = useState<TierId>('professional');

    // Stripe Price IDs - From Stripe Dashboard
    const PRICE_IDS = {
        starter_monthly: 'price_1T19GZJLE5bW6f8EPNVSoaGp',  // Starter Monthly
        starter_yearly: 'price_starter_yearly',
        professional_monthly: 'price_professional_monthly',
        professional_yearly: 'price_professional_yearly',
        agency_monthly: 'price_agency_monthly',
        agency_yearly: 'price_agency_yearly',
    };

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            subtitle: 'Perfect for niche blogs',
            price: billingCycle === 'monthly' ? 29 : 24,
            priceId: billingCycle === 'monthly' ? PRICE_IDS.starter_monthly : PRICE_IDS.starter_yearly,
            icon: <Zap className="text-gray-400" size={24} />,
            features: ['5,000 Monthly Visitors', '5 Keywords Tracking', 'Geo-Targeting (Standard)', 'Desktop Traffic Only', 'Standard Proxy Pool'],
            color: 'border-gray-200'
        },
        {
            id: 'professional',
            name: 'Professional',
            subtitle: 'Best for growth-stage sites',
            price: billingCycle === 'monthly' ? 79 : 64,
            priceId: billingCycle === 'monthly' ? PRICE_IDS.professional_monthly : PRICE_IDS.professional_yearly,
            icon: <Rocket className="text-[#ff4d00]" size={24} />,
            features: ['25,000 Monthly Visitors', '20 Keywords Tracking', 'Geo-Targeting (Advanced)', 'Mobile + Desktop Traffic', 'Social & Referral Traffic', 'High-Retention Visits'],
            popular: true,
            color: 'border-[#ff4d00]'
        },
        {
            id: 'agency',
            name: 'Agency',
            subtitle: 'Enterprise-grade throughput',
            price: billingCycle === 'monthly' ? 249 : 199,
            priceId: billingCycle === 'monthly' ? PRICE_IDS.agency_monthly : PRICE_IDS.agency_yearly,
            icon: <Terminal className="text-purple-600" size={24} />,
            features: ['100,000 Monthly Visitors', 'Unlimited Keywords', 'Global Proxy Network', 'Residential Proxy Access', 'API Management', 'Dedicated Support Manager'],
            color: 'border-purple-600'
        }
    ];

    const renderStep1 = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">Why Choose Us?</h2>
                <p className="text-gray-500 font-medium">Compare our premium traffic against standard alternatives.</p>
            </div>

            <div className="bg-white border border-gray-200 shadow-xl overflow-hidden mb-12">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Feature</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-[#ff4d00]">Traffic Creator OS</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-300">Other Ad Networks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { label: 'Real Keyword Search', us: true, them: false },
                            { label: 'Residential Proxy Pool', us: true, them: 'Limited' },
                            { label: 'Bounce Rate Control', us: true, them: false },
                            { label: 'Human Interaction Emulation', us: true, them: false },
                            { label: 'GEO-Targeting Precision', us: 'City Level', them: 'Country Level' },
                            { label: 'SEO Authority Impact', us: 'Direct Growth', them: 'None / Risk' },
                        ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-5 text-sm font-bold text-gray-700">{row.label}</td>
                                <td className="px-8 py-5 text-sm font-black text-gray-900">
                                    {typeof row.us === 'boolean' ? (row.us ? <Check className="text-green-500" size={18} /> : 'No') : row.us}
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-gray-400">
                                    {typeof row.them === 'boolean' ? (row.them ? <Check size={18} /> : 'No') : row.them}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => setStep(2)}
                    className="group bg-black text-white px-12 py-5 text-xs font-black uppercase tracking-widest hover:bg-[#ff4d00] transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_30px_rgba(255,77,0,0.2)]"
                >
                    View Plans & Pricing <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">Simple, Transparent Pricing</h2>

                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setPricingTab('subscriptions')}
                        className={`px-8 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                            pricingTab === 'subscriptions'
                                ? 'bg-[#ff4d00] text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <CreditCard size={14} className="inline mr-2" />
                        Subscriptions
                    </button>
                    <button
                        onClick={() => setPricingTab('credits')}
                        className={`px-8 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                            pricingTab === 'credits'
                                ? 'bg-[#ff4d00] text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <ShoppingCart size={14} className="inline mr-2" />
                        Credit Packs
                    </button>
                </div>

                {pricingTab === 'subscriptions' && (
                    <div className="inline-flex items-center p-1 bg-gray-100 rounded-sm border border-gray-200">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${billingCycle === 'yearly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Yearly
                            <span className="absolute -top-4 -right-2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-bounce">-20%</span>
                        </button>
                    </div>
                )}
            </div>

            {pricingTab === 'subscriptions' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                        {plans.map((plan) => (
                            <div key={plan.id} className={`bg-white p-8 border-2 ${plan.color} relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl flex flex-col`}>
                                {plan.popular && (
                                    <div className="absolute top-4 right-[-35px] bg-[#ff4d00] text-white text-[8px] font-black uppercase tracking-widest py-1.5 px-12 rotate-45">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className="p-3 bg-gray-50 inline-block rounded-sm mb-4">
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{plan.subtitle}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">€{plan.price}</span>
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">/ month</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                        {billingCycle === 'yearly' ? 'Billed annually' : 'Cancel anytime'}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-xs font-medium text-gray-600">
                                            <Check className="text-[#ff4d00] shrink-0" size={14} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        setSelectedPlan(plan.id);
                                        setStep(3);
                                    }}
                                    className={`w-full py-4 text-[10px] font-black uppercase tracking-widest transition-all ${plan.popular ? 'bg-[#ff4d00] text-white hover:bg-black' : 'bg-black text-white hover:bg-[#ff4d00]'}`}
                                >
                                    Get Started Now
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-center gap-2 mb-8">
                        {TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                onClick={() => setSelectedTier(tier.id)}
                                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
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

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-6xl mx-auto mb-16">
                        {VOLUME_STEPS.map((volume, i) => {
                            const price = PRICING_MATRIX[selectedTier][volume]?.[1] || 0;
                            const cpm = getCPM(selectedTier, volume, 1);
                            const tier = TIERS.find(t => t.id === selectedTier);
                            const isPopular = volume === 500000;
                            return (
                                <div key={volume} className={`bg-white p-6 border-2 ${isPopular ? 'border-[#ff4d00] shadow-xl scale-105 relative' : 'border-gray-200'} flex flex-col`}>
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff4d00] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                            Popular
                                        </div>
                                    )}
                                    <div className="text-center mb-4">
                                        <div className="text-2xl font-black text-gray-900">
                                            {volume >= 1000000 ? `${volume / 1000000}M` : `${volume / 1000}k`}
                                        </div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Visitors</div>
                                    </div>
                                    <div className="text-center mb-4">
                                        <div className="text-3xl font-black text-gray-900">{formatPrice(price)}</div>
                                        <div className="text-[9px] text-[#ff4d00] font-bold">{formatCPM(cpm)}/1k</div>
                                    </div>
                                    <ul className="space-y-2 mb-6 flex-1 text-[10px]">
                                        {tier?.features.slice(0, 2).map((f, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-gray-600">
                                                <Check size={10} className="text-green-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        to="/dashboard/buy-credits"
                                        className={`w-full py-3 text-[9px] font-black uppercase tracking-widest text-center ${isPopular ? 'bg-[#ff4d00] text-white hover:bg-black' : 'bg-black text-white hover:bg-[#ff4d00]'}`}
                                    >
                                        Buy Now
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-4xl mx-auto mb-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-black text-white mb-2">Bulk Discounts</h3>
                                <p className="text-gray-400 text-sm">Save up to 40% with multi-packs</p>
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
                </>
            )}

            <div className="flex justify-center">
                <button
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                    <ArrowLeft size={14} /> Back to Comparison
                </button>
            </div>
        </div>
    );

    const handleCheckout = async () => {
        if (!selectedPlan) return;

        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) return;

        setLoading(true);
        try {
            const result = await db.createCheckoutSession(plan.priceId);
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep3 = () => {
        const currentPlan = plans.find(p => p.id === selectedPlan) || plans[1];

        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
                {/* Left Side: Customizer */}
                <div className="flex-1 space-y-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Customize Your Package</h2>
                        <p className="text-gray-500 font-medium">Add premium features to boost your campaign performance.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: 'proxies', label: 'Residential Proxy Pool', price: 15, icon: <Shield size={18} /> },
                            { id: 'mobile', label: 'Mobile Device Emulation', price: 10, icon: <Globe size={18} /> },
                            { id: 'referrers', label: 'Custom Web Referrers', price: 12, icon: <Users size={18} /> },
                            { id: 'keywords', label: 'Extra Keyword Slots (+5)', price: 9, icon: <Search size={18} /> },
                        ].map((addon) => (
                            <div key={addon.id} className="bg-white border border-gray-100 p-6 flex justify-between items-center group hover:border-[#ff4d00] transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-50 group-hover:bg-orange-50 group-hover:text-[#ff4d00] transition-colors">
                                        {addon.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{addon.label}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Premium Add-on</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-sm font-black text-gray-900">+€{addon.price}/mo</span>
                                    <div className="w-5 h-5 border-2 border-gray-200 rounded-sm flex items-center justify-center">
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Summary Card */}
                <div className="w-full lg:w-[400px]">
                    <div className="bg-black text-white p-8 sticky top-8 rounded-sm overflow-hidden">
                        {/* Decorative Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d00] opacity-10 translate-x-16 -translate-y-16 rotate-45"></div>

                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 relative">Order Summary</h3>

                        <div className="space-y-6 mb-12 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Selected Plan</span>
                                <span className="font-bold text-sm">{currentPlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Billing Cycle</span>
                                <span className="font-bold text-sm">{billingCycle === 'yearly' ? 'Yearly (-20%)' : 'Monthly'}</span>
                            </div>
                            <div className="pt-6 border-t border-gray-800 flex justify-between items-center text-xl">
                                <span className="font-black uppercase tracking-tighter">Total Due</span>
                                <span className="text-[#ff4d00] font-black">€{currentPlan.price}.00</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-[#ff4d00] py-5 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-[0_20px_40px_rgba(255,77,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Complete Purchase'}
                        </button>

                        <p className="text-[9px] text-gray-500 font-bold text-center mt-6 uppercase tracking-widest">
                            Safe & Secure Checkout via Stripe
                        </p>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full mt-4 text-gray-400 hover:text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 py-4 border border-transparent hover:border-gray-200 transition-all"
                    >
                        <ArrowLeft size={14} /> Back to Plans
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] py-20 px-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <SEO
                    title="Pricing Plans 2026 - Scalable Organic Traffic Packages | Traffic Creator"
                    description="Transparent pricing for 2026. Start with our flexible credit packs or choose a monthly agency plan. Plans start at just €29. High-quality residential traffic for modern SEO."
                    keywords="traffic bot pricing 2026, buy website hits cost, cheap seo traffic, agency traffic plan, organic traffic packages"
                    type="product"
                    schema={{
                        "@context": "https://schema.org",
                        "@type": "PriceSpecification",
                        "priceCurrency": "EUR",
                        "minPrice": "29.00",
                        "maxPrice": "2999.00"
                    }}
                />
                {/* Step Indicator */}
                <div className="flex justify-center mb-20">
                    <div className="flex items-center gap-4">
                        {[1, 2, 3].map((s) => (
                            <React.Fragment key={s}>
                                <div
                                    className={`w-10 h-10 flex items-center justify-center text-xs font-black border-2 transition-all
                    ${step >= s ? 'border-[#ff4d00] text-[#ff4d00] bg-white' : 'border-gray-300 text-gray-300'}`}
                                >
                                    {s}
                                </div>
                                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#ff4d00]' : 'bg-gray-300'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
};

export default PricingPage;
