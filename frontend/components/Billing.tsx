
import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Home, Shield, Zap, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { User } from '../types';

const Billing: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = db.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                const sub = await db.getCurrentSubscription();
                setSubscription(sub);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        try {
            const result = await db.createPortalSession();
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Error opening portal:', error);
            alert('Failed to open billing portal. Please try again.');
        } finally {
            setPortalLoading(false);
        }
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'starter': return 'bg-gray-500';
            case 'professional': return 'bg-[#ff4d00]';
            case 'agency': return 'bg-purple-600';
            default: return 'bg-gray-500';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'past_due': return 'bg-yellow-500';
            case 'canceled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#ff4d00]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Payment Settings</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Billing & Methods</h2>
                </div>
            </div>

            {/* Current Subscription */}
            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
                    <Zap size={14} /> Current Subscription
                </h3>
                
                {subscription && subscription.status !== 'inactive' ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-full text-white font-black text-sm uppercase ${getPlanBadgeColor(subscription.plan)}`}>
                                {subscription.plan || 'Free'}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-white text-xs font-bold uppercase ${getStatusBadgeColor(subscription.status)}`}>
                                {subscription.status}
                            </div>
                        </div>
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="bg-[#ff4d00] text-white px-6 py-2 rounded-sm font-black text-sm uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {portalLoading && <Loader2 className="animate-spin" size={16} />}
                            Manage Subscription
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mb-4">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">No Active Subscription</h3>
                        <p className="text-gray-500 mb-6">
                            Upgrade your plan to unlock premium features
                        </p>
                        <a
                            href="/pricing"
                            className="inline-block bg-[#ff4d00] text-white px-8 py-3 rounded-sm font-black text-sm uppercase hover:bg-black transition-colors"
                        >
                            View Plans
                        </a>
                    </div>
                )}
                
                {subscription && subscription.current_period_end && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Current billing period ends:{' '}
                            <span className="font-medium text-gray-900">
                                {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {/* Plan Features */}
            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
                    <Shield size={14} /> Plan Features
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Starter */}
                    <div className={`border-2 rounded-lg p-6 ${subscription?.plan === 'starter' ? 'border-[#ff4d00] bg-orange-50' : 'border-gray-200'}`}>
                        <h3 className="font-black text-lg text-gray-900 uppercase mb-2">Starter</h3>
                        <p className="text-2xl font-black text-gray-900 mb-4">€29<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                5,000 Monthly Visitors
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                5 Keywords Tracking
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                Geo-Targeting
                            </li>
                        </ul>
                    </div>

                    {/* Professional */}
                    <div className={`border-2 rounded-lg p-6 ${subscription?.plan === 'professional' ? 'border-[#ff4d00] bg-orange-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-black text-lg text-gray-900 uppercase">Professional</h3>
                            {subscription?.plan === 'professional' && (
                                <span className="bg-[#ff4d00] text-white text-xs px-2 py-1 rounded font-bold">Current</span>
                            )}
                        </div>
                        <p className="text-2xl font-black text-gray-900 mb-4">€79<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                25,000 Monthly Visitors
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                20 Keywords Tracking
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                Advanced Geo-Targeting
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                Mobile + Desktop
                            </li>
                        </ul>
                    </div>

                    {/* Agency */}
                    <div className={`border-2 rounded-lg p-6 ${subscription?.plan === 'agency' ? 'border-[#ff4d00] bg-orange-50' : 'border-gray-200'}`}>
                        <h3 className="font-black text-lg text-gray-900 uppercase mb-2">Agency</h3>
                        <p className="text-2xl font-black text-gray-900 mb-4">€249<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                100,000 Monthly Visitors
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                Unlimited Keywords
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                Residential Proxies
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                Dedicated Support
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <CreditCard size={14} /> Saved Payment Methods
                    </h3>
                    <button 
                        onClick={handleManageSubscription}
                        className="text-[#ff4d00] text-[10px] font-bold uppercase tracking-widest hover:text-black flex items-center gap-1"
                    >
                        Manage in Stripe →
                    </button>
                </div>

                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                        Payment methods are managed securely through Stripe.
                    </p>
                    <button
                        onClick={handleManageSubscription}
                        className="mt-4 text-[#ff4d00] font-black text-sm uppercase hover:underline"
                    >
                        Open Stripe Billing Portal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Billing;
