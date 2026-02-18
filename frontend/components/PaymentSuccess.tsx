import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, CreditCard, ExternalLink, ArrowRight, Loader2, Receipt } from 'lucide-react';
import { db } from '../services/db';

interface PaymentDetails {
    type: 'subscription' | 'credits';
    amount?: number;
    planName?: string;
    date: string;
    sessionId?: string;
    credits?: number;
}

const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<PaymentDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPaymentDetails = async () => {
            try {
                const type = searchParams.get('type') as 'subscription' | 'credits' | null;
                const sessionId = searchParams.get('session_id');
                const amount = searchParams.get('amount');
                const plan = searchParams.get('plan');
                const credits = searchParams.get('credits');

                if (!type) {
                    setError('Invalid payment confirmation');
                    setLoading(false);
                    return;
                }

                const now = new Date();
                const formattedDate = now.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                if (type === 'subscription') {
                    setDetails({
                        type: 'subscription',
                        planName: plan || 'Professional Plan',
                        date: formattedDate,
                        sessionId: sessionId || undefined
                    });
                } else {
                    setDetails({
                        type: 'credits',
                        amount: amount ? parseFloat(amount) : undefined,
                        credits: credits ? parseInt(credits) : undefined,
                        date: formattedDate,
                        sessionId: sessionId || undefined
                    });
                }

                if (window.history.replaceState) {
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }
            } catch (err) {
                console.error('Error loading payment details:', err);
                setError('Failed to load payment details');
            } finally {
                setLoading(false);
            }
        };

        loadPaymentDetails();
    }, [searchParams]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const handleViewReceipt = () => {
        if (details?.sessionId) {
            window.open(`https://billing.stripe.com/p/session/${details.sessionId}`, '_blank');
        } else {
            navigate('/dashboard/billing');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#ff4d00]" size={32} />
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-gray-200 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CreditCard size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">
                        Payment Information Unavailable
                    </h1>
                    <p className="text-gray-500 mb-8">
                        {error || 'We could not retrieve your payment details.'}
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-[#ff4d00] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                        <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                        Payment Successful
                    </h1>
                    <p className="text-green-100 text-sm font-medium">
                        Thank you for your purchase
                    </p>
                </div>

                <div className="p-8">
                    <div className="bg-gray-50 border border-gray-100 p-6 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                            Transaction Details
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <CreditCard size={14} /> Type
                                </span>
                                <span className="text-sm font-bold text-gray-900 uppercase">
                                    {details.type === 'subscription' ? 'Subscription' : 'Credits Purchase'}
                                </span>
                            </div>

                            {details.type === 'subscription' && details.planName && (
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Plan</span>
                                    <span className="text-sm font-black text-[#ff4d00] uppercase">
                                        {details.planName}
                                    </span>
                                </div>
                            )}

                            {details.type === 'credits' && details.amount && (
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Amount</span>
                                    <span className="text-sm font-black text-gray-900">
                                        {formatCurrency(details.amount)}
                                    </span>
                                </div>
                            )}

                            {details.type === 'credits' && details.credits && (
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Traffic Credits</span>
                                    <span className="text-sm font-bold text-green-600">
                                        +{details.credits.toLocaleString()} hits
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar size={14} /> Date
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {details.date}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleViewReceipt}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-900 py-4 text-xs font-bold uppercase tracking-widest hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors"
                        >
                            <Receipt size={14} /> View Receipt
                        </button>
                        <Link
                            to="/dashboard/billing"
                            className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors"
                        >
                            View Billing <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center">
                <Link
                    to="/dashboard/campaigns/new"
                    className="inline-flex items-center gap-2 text-[#ff4d00] text-sm font-bold hover:text-black transition-colors"
                >
                    Start a new campaign <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccess;
