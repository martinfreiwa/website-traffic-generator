import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, API_BASE_URL } from '../services/db';
import { TIERS, PRICING_MATRIX, VOLUME_STEPS, BULK_OPTIONS, TierId, TierDefinition } from '../constants/pricing';
import {
    Check, CreditCard, Zap, Shield, Wallet, ArrowRight, Lock,
    Loader2, Landmark, Smartphone, Calculator, Star, Sliders,
    Layers, AlertCircle, ShoppingCart, Percent, Copy, Upload, FileText, Info, CheckCircle, Bitcoin, ChevronDown, ChevronUp
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { QRCodeSVG } from 'qrcode.react';

// Initialize Stripe with the provided Publishable Key
const stripePromise = loadStripe("pk_live_51ST5n8JLE5bW6f8EX9PlyQhzw3NNyU4DUGc2YNvdUWM8eDVJBh2U0gKQylFvHAe32IuWDka1uQwaVsSvU4186txw00lanUMTEu");

interface BuyCreditsProps {
    onBack: () => void;
    onPurchase?: () => void;
}

interface BankDetails {
    name: string;
    bankName: string;
    bankAddress: string;
    note: string;
    iban?: string;
    accountNumber?: string;
    accountType?: string;
    routingNumber?: string;
    sortCode?: string;
    bsb?: string;
    swift?: string;
}

const BANK_DETAILS: Record<string, BankDetails> = {
    USD: {
        name: 'Easytrafficbot Ug',
        accountNumber: '8314422210',
        accountType: 'Checking',
        routingNumber: '026073150',
        swift: 'TRWIBEB1XXX',
        bankName: 'Wise',
        bankAddress: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
        note: 'Use for domestic transfers from USA (Wire & ACH)'
    },
    EUR: {
        name: 'Easytrafficbot Ug',
        iban: 'BE86 9679 9171 7050',
        swift: 'TRWIBEB1XXX',
        bankName: 'Wise',
        bankAddress: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
        note: 'Use for SEPA transfers within Europe'
    },
    GBP: {
        name: 'Easytrafficbot Ug',
        accountNumber: '46701141',
        sortCode: '23-08-01',
        iban: 'GB79 TRWI 2308 0146 7011 41',
        swift: 'TRWIGB2LXXX',
        bankName: 'Wise',
        bankAddress: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
        note: 'Use for domestic transfers from UK'
    },
    AUD: {
        name: 'Easytrafficbot Ug',
        accountNumber: '218673731',
        bsb: '774-001',
        swift: 'TRWIAUS1XXX',
        bankName: 'Wise',
        bankAddress: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
        note: 'Use for domestic transfers from Australia'
    },
    RON: {
        name: 'Easytrafficbot Ug',
        iban: 'RO60 BREL 0005 6028 6239 0100',
        bankName: 'Wise / BREL',
        bankAddress: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
        note: 'Use for domestic transfers from Romania'
    }
};

type Currency = 'USD' | 'EUR' | 'GBP' | 'AUD' | 'RON';

interface CryptoDetails {
    name: string;
    network: string;
    address: string;
    note: string;
}

const CRYPTO_DETAILS: Record<string, CryptoDetails> = {
    'ETH (ERC20)': {
        name: 'Ethereum (ETH)',
        network: 'Ethereum (ERC20)',
        address: '0x4F692276Ed837aa458245f4184B4331bE3142233',
        note: 'Send only ETH to this address on the Ethereum network.'
    },
    'USDC (ERC20)': {
        name: 'USD Coin (USDC)',
        network: 'Ethereum (ERC20)',
        address: '0x4F692276Ed837aa458245f4184B4331bE3142233',
        note: 'Send only USDC to this address on the Ethereum network.'
    },
    'USDT (ERC20)': {
        name: 'Tether (USDT)',
        network: 'Ethereum (ERC20)',
        address: '0x4F692276Ed837aa458245f4184B4331bE3142233',
        note: 'Send only USDT to this address on the Ethereum network.'
    },
    'USDT (TRC20)': {
        name: 'Tether (USDT)',
        network: 'Tron (TRC20)',
        address: 'TBvarbCL58BtFLnytADapLHmNDvuif3eo9',
        note: 'Send only USDT to this address on the Tron network.'
    },
    'BTC (Bitcoin)': {
        name: 'Bitcoin (BTC)',
        network: 'Bitcoin',
        address: 'bc1qurxk796p6kwuem3usaqamy74yesh6tlu97m3ju',
        note: 'Send only BTC to this address on the Bitcoin network.'
    }
};

type CryptoCurrency = keyof typeof CRYPTO_DETAILS;

const CheckoutForm = ({ amount, onSuccess, onError }: { amount: number, onSuccess: (pid: string) => void, onError: (msg: string) => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href, // This might need distinct success page handling
            },
            redirect: "if_required",
        });

        if (error) {
            setMessage(error.message || "An unexpected error occurred.");
            onError(error.message || "Payment failed");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            setMessage("Payment successful!");
            onSuccess(paymentIntent.id);
        } else {
            setMessage("Unexpected state.");
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {message && <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded">{message}</div>}
            <button
                disabled={isProcessing || !stripe || !elements}
                className="w-full bg-[#ff4d00] text-white py-4 text-sm font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                {isProcessing ? "Processing..." : `Pay €${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

const BuyCredits: React.FC<BuyCreditsProps> = ({ onBack, onPurchase }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedTier, setSelectedTier] = useState<TierDefinition>(TIERS[0]); // Default Economy
    const [volumeIndex, setVolumeIndex] = useState(0); // Default 60k
    const [bulkPack, setBulkPack] = useState(1);
    const [balance, setBalance] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'crypto'>('card');
    const [clientSecret, setClientSecret] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDT (TRC20)');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [transferReference, setTransferReference] = useState<string>('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        setBalance(db.getBalance());
        if ((paymentMethod === 'bank' || paymentMethod === 'crypto') && step === 2 && !transferReference) {
            const user = db.getCurrentUser();
            const userId = user?.id?.substring(0, 8).toUpperCase() || 'XXXXX';
            const timestamp = Date.now().toString(36).toUpperCase();
            setTransferReference(`TGP-${userId}-${timestamp}`);
        }
    }, [paymentMethod, step]);

    useEffect(() => {
        setBalance(db.getBalance());
    }, []);

    const user = db.getCurrentUser();
    const discountPercent = user?.gamificationPermanentDiscount || 0;

    const visitors = VOLUME_STEPS[volumeIndex];
    const basePrice = PRICING_MATRIX[selectedTier.id][visitors][bulkPack];

    // Calculate discount
    const discountAmount = (basePrice * discountPercent) / 100;
    const totalPrice = basePrice - discountAmount;

    const totalVisitors = visitors * bulkPack;
    const cpm = totalPrice / (totalVisitors / 1000);

    const handleCreatePayment = async () => {
        if (paymentMethod === 'card') {
            setIsProcessing(true);
            try {
                const data = await db.createCreditsCheckout({
                    tier: selectedTier.id,
                    visitors: visitors,
                    bulk_months: bulkPack,
                    currency: 'eur'
                });
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert("Failed to initialize Stripe checkout.");
                }
            } catch (error: any) {
                alert("Checkout Error: " + error.message);
            } finally {
                setIsProcessing(false);
            }
        } else {
            setStep(2);
        }
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        setIsProcessing(true);
        await db.purchaseCredits(basePrice, `Traffic Credits (${totalVisitors.toLocaleString()} ${selectedTier.name}) - Stripe ${paymentId}`, selectedTier.id, totalVisitors);
        setBalance(db.getBalance());
        setIsProcessing(false);
        if (onPurchase) onPurchase();
        navigate(`/dashboard/payment-success?type=credits&amount=${totalPrice.toFixed(2)}&credits=${totalVisitors}`);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleProofUpload = async () => {
        if (!proofFile) {
            alert("Please select a file to upload.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', proofFile);
            formData.append('amount', totalPrice.toString());
            formData.append('tier', selectedTier.id);
            formData.append('hits', totalVisitors.toString());
            formData.append('currency', paymentMethod === 'crypto' ? selectedCrypto : selectedCurrency);
            formData.append('notes', `${paymentMethod === 'crypto' ? 'Crypto' : 'Bank'} transfer for ${totalVisitors.toLocaleString()} ${selectedTier.name} visitors - Ref: ${transferReference}`);

            const token = localStorage.getItem('tgp_token');
            const response = await fetch(`${API_BASE_URL}/bank-transfer/proof`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            setUploadSuccess(true);
        } catch (error: any) {
            alert("Upload failed: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const renderBankDetails = (currency: Currency) => {
        const bank = BANK_DETAILS[currency];

        return (
            <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Account Holder:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{bank.name}</span>
                        <button onClick={() => copyToClipboard(bank.name, 'name')} className="text-gray-400 hover:text-[#ff4d00]">
                            {copied === 'name' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                {bank.iban && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500">IBAN:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{bank.iban}</span>
                            <button onClick={() => copyToClipboard(bank.iban, 'iban')} className="text-gray-400 hover:text-[#ff4d00]">
                                {copied === 'iban' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {bank.accountNumber && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500">Account Number:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{bank.accountNumber}</span>
                            <button onClick={() => copyToClipboard(bank.accountNumber, 'account')} className="text-gray-400 hover:text-[#ff4d00]">
                                {copied === 'account' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {bank.routingNumber && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500">Routing Number:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{bank.routingNumber}</span>
                            <button onClick={() => copyToClipboard(bank.routingNumber, 'routing')} className="text-gray-400 hover:text-[#ff4d00]">
                                {copied === 'routing' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {bank.sortCode && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500">Sort-Code:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{bank.sortCode}</span>
                            <button onClick={() => copyToClipboard(bank.sortCode, 'sortcode')} className="text-gray-400 hover:text-[#ff4d00]">
                                {copied === 'sortcode' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {bank.bsb && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500">BSB-Code:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{bank.bsb}</span>
                            <button onClick={() => copyToClipboard(bank.bsb, 'bsb')} className="text-gray-400 hover:text-[#ff4d00]">
                                {copied === 'bsb' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {bank.swift && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500">SWIFT/BIC:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{bank.swift}</span>
                            <button onClick={() => copyToClipboard(bank.swift, 'swift')} className="text-gray-400 hover:text-[#ff4d00]">
                                {copied === 'swift' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-bold">{bank.bankName}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Reference:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#ff4d00]">{transferReference}</span>
                        <button onClick={() => copyToClipboard(transferReference, 'ref')} className="text-gray-400 hover:text-[#ff4d00]">
                            {copied === 'ref' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs text-gray-500">{bank.note}</p>
                </div>
            </div>
        );
    };

    const renderCryptoDetails = (crypto: CryptoCurrency) => {
        const details = CRYPTO_DETAILS[crypto];

        return (
            <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Asset:</span>
                    <span className="font-bold">{details.name}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Network:</span>
                    <span className="font-bold">{details.network}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Address:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold break-all max-w-[200px] sm:max-w-none">{details.address}</span>
                        <button onClick={() => copyToClipboard(details.address, 'crypto_address')} className="text-gray-400 hover:text-[#ff4d00] flex-shrink-0">
                            {copied === 'crypto_address' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                <div className="py-4 flex justify-center border-b border-gray-100">
                    <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-lg">
                        <QRCodeSVG value={details.address} size={150} fgColor="#000000" bgColor="#FFFFFF" />
                    </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Reference / Tx Hash:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#ff4d00]">Required</span>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
                    <p className="text-xs font-bold">{details.note}</p>
                    <p className="text-xs mt-1">Please pay the exact invoice amount or higher. After making the payment, please upload a screenshot or mention your transaction hash as proof.</p>
                </div>
            </div>
        );
    };

    if (isProcessing && step === 1) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
                <Loader2 className="w-16 h-16 text-[#ff4d00] animate-spin mb-6" />
                <h3 className="text-2xl font-black uppercase text-gray-900 mb-2">Connecting Secure Gateway</h3>
                <p className="text-gray-500 font-medium">Please wait...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Exchange & Funding</div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Purchase Traffic Credits</h2>
                </div>
            </div>

            {step === 1 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left: Configuration */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Tier Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {TIERS.map((tier) => (
                                <button
                                    key={tier.id}
                                    onClick={() => setSelectedTier(tier)}
                                    className={`relative p-8 border-2 transition-all duration-300 text-left flex flex-col min-h-[280px] ${selectedTier.id === tier.id
                                        ? `${tier.color} bg-white shadow-xl translate-y-[-4px]`
                                        : 'border-transparent bg-gray-50 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    {tier.popular && (
                                        <div className="absolute top-0 right-0 bg-[#ff4d00] text-white text-[9px] font-black uppercase px-3 py-1.5">Recommended</div>
                                    )}
                                    <div className="flex items-center gap-3 mb-6 text-gray-400">
                                        <Layers size={20} />
                                        <span className="text-xs font-black uppercase tracking-widest">{tier.quality}</span>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{tier.name}</h3>
                                    <div className="text-sm font-bold text-[#ff4d00] mb-8">×{tier.factor.toFixed(2)} Price Factor</div>

                                    <ul className="space-y-3 mt-auto">
                                        {tier.features.slice(0, 3).map((f, i) => (
                                            <li key={i} className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                                <Check size={12} className="text-[#ff4d00]" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            ))}
                        </div>

                        {/* Volume Configuration */}
                        <div className="bg-white border border-gray-200 p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                        <Sliders size={14} className="text-[#ff4d00]" /> Volume Configurator
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Select your traffic volume</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-gray-900">{visitors.toLocaleString()}</div>
                                    <div className="text-[10px] font-black text-[#ff4d00] uppercase tracking-widest">Hits Per Credit</div>
                                </div>
                            </div>

                            <div className="relative mb-16 px-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={volumeIndex}
                                    onChange={(e) => setVolumeIndex(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#ff4d00] relative z-20"
                                />
                                <div className="absolute top-6 left-0 w-full flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                                    {VOLUME_STEPS.map((v, i) => (
                                        <div key={v} className="flex flex-col items-center cursor-pointer hover:text-black" onClick={() => setVolumeIndex(i)}>
                                            <div className="h-2 w-0.5 bg-gray-300 mb-1"></div>
                                            <span>
                                                {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Bulk Packages</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {BULK_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setBulkPack(opt)}
                                            className={`relative py-4 border-2 flex flex-col items-center justify-center transition-all ${bulkPack === opt
                                                ? 'border-[#ff4d00] bg-orange-50 text-black'
                                                : 'border-gray-100 text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            {opt > 1 && (
                                                <div className="absolute -top-3 bg-[#ff4d00] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                                                    Save {opt === 6 ? '20%' : '40%'}
                                                </div>
                                            )}
                                            <div className="text-xl font-black">{opt}x</div>
                                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Credits Included</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Selector (Step 1) */}
                        <div className="bg-white border border-gray-200 p-8 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                                <Wallet size={14} className="text-[#ff4d00]" /> Payment Method
                            </h3>
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 border-2 transition-all flex flex-col items-center gap-3 text-center ${paymentMethod === 'card' ? 'border-[#ff4d00] bg-orange-50 shadow-lg ring-1 ring-[#ff4d00]' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <CreditCard size={28} className={paymentMethod === 'card' ? 'text-[#ff4d00]' : 'text-gray-300'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Card</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('crypto')}
                                    className={`p-4 border-2 transition-all flex flex-col items-center gap-3 text-center ${paymentMethod === 'crypto' ? 'border-[#ff4d00] bg-orange-50 shadow-lg' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <Bitcoin size={28} className={paymentMethod === 'crypto' ? 'text-[#ff4d00]' : 'text-gray-300'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Crypto</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`p-4 border-2 transition-all flex flex-col items-center gap-3 text-center ${paymentMethod === 'bank' ? 'border-[#ff4d00] bg-orange-50 shadow-lg' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <Landmark size={28} className={paymentMethod === 'bank' ? 'text-[#ff4d00]' : 'text-gray-300'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Bank</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#111] text-white p-10 shadow-2xl relative overflow-hidden sticky top-8 min-h-[500px]">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                                <ShoppingCart size={180} />
                            </div>

                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-12 relative">Package Summary</h3>

                            <div className="space-y-8 relative">
                                <div className="flex justify-between items-end">
                                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest">Plan</div>
                                    <div className="font-black text-base uppercase">{selectedTier.name}</div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest">Volume</div>
                                    <div className="font-black text-base">{visitors.toLocaleString()} <span className="text-gray-500">x{bulkPack}</span></div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Hits</div>
                                    <div className="font-black text-base text-[#ff4d00]">{totalVisitors.toLocaleString()}</div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest">Pricing Tier</div>
                                    <div className="font-black text-base text-gray-300">€{cpm.toFixed(2)} CPM</div>
                                </div>

                                {discountPercent > 0 && (
                                    <div className="flex justify-between items-end text-[#ff4d00]">
                                        <div className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> Level {user?.gamificationLevel || 1} Discount
                                        </div>
                                        <div className="font-black text-base">-{discountPercent}%</div>
                                    </div>
                                )}


                                <div className="h-px bg-gray-800 my-10"></div>

                                {bulkPack > 1 ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-gray-400">
                                            <div className="text-xs font-bold uppercase tracking-widest">Original Total</div>
                                            <div className="text-base line-through">€{(basePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="flex justify-between items-center text-green-400 pb-2">
                                            <div className="text-xs font-black uppercase tracking-widest bg-green-900/40 px-2 py-1 rounded text-green-400 border border-green-800/50">Save {bulkPack === 6 ? '20%' : '40%'}</div>
                                            <div className="text-base font-bold">-€{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm font-black uppercase tracking-widest">Total Due</div>
                                            <div className="text-4xl font-black text-white">€{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-black uppercase tracking-widest">Total Due <span className="text-[10px] text-gray-500 block">No bulk discount applied</span></div>
                                        <div className="text-4xl font-black text-white">€{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                )}

                                <button
                                    onClick={handleCreatePayment}
                                    className="w-full bg-[#ff4d00] text-white py-6 text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 mt-10 shadow-[0_15px_30px_rgba(255,77,0,0.3)] group"
                                >
                                    Proceed to Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="mt-10 flex items-center justify-center gap-2 text-gray-500">
                                    <Lock size={14} />
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em]">Tiered Rate Calculator v4.1</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Step 2: Payment Execution */
                <div className="mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500 pb-20 w-full mb-16">
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-500 hover:text-black text-sm font-bold uppercase tracking-wider mb-6">
                        <ArrowRight size={16} className="rotate-180" /> Back to Configuration
                    </button>

                    <div className="bg-white border border-gray-200 p-8 md:p-14 shadow-xl min-h-[700px] w-full">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">Secure Checkout</h3>
                            <p className="text-gray-500 text-lg">Completing payment of <span className="font-bold text-[#ff4d00] text-xl">€{totalPrice.toFixed(2)}</span> via {paymentMethod === 'card' ? 'Stripe Secure' : paymentMethod}</p>
                        </div>

                        {paymentMethod === 'card' && clientSecret && (
                            <div className="max-w-3xl mx-auto">
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#ff4d00' } } }}>
                                    <CheckoutForm
                                        amount={totalPrice}
                                        onSuccess={handlePaymentSuccess}
                                        onError={(msg) => alert(msg)}
                                    />
                                </Elements>
                            </div>
                        )}

                        {(paymentMethod === 'bank' || paymentMethod === 'crypto') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="bg-green-50 border-l-4 border-green-500 p-6 shadow-md">
                                        <div className="flex items-start gap-4">
                                            <Info size={28} className="text-green-600 flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="text-xl font-black text-green-800 mb-2">Instant Credit Upon Confirmation</p>
                                                <p className="text-base text-green-700">
                                                    Upload your transfer confirmation. After validation, traffic will be <strong className="text-green-900">instantly</strong> credited to your account.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 block flex items-center gap-2">
                                            <Layers size={14} /> {paymentMethod === 'crypto' ? 'Select Asset' : 'Select Currency'}
                                        </label>
                                        <div className="flex flex-wrap gap-4">
                                            {paymentMethod === 'bank' ? (
                                                (Object.keys(BANK_DETAILS) as Currency[]).map((curr) => {
                                                    const icons: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', RON: 'lei' };
                                                    return (
                                                        <button
                                                            key={curr}
                                                            onClick={() => setSelectedCurrency(curr)}
                                                            className={`px-6 py-3 text-base font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${selectedCurrency === curr
                                                                ? 'bg-[#ff4d00] text-white shadow-lg'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            <span className="text-lg">{icons[curr]}</span>
                                                            {curr}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                (Object.keys(CRYPTO_DETAILS) as CryptoCurrency[]).map((cryptoKey) => (
                                                    <button
                                                        key={cryptoKey}
                                                        onClick={() => setSelectedCrypto(cryptoKey)}
                                                        className={`px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${selectedCrypto === cryptoKey
                                                            ? 'bg-[#ff4d00] text-white shadow-lg'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {cryptoKey}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 p-8">
                                        <div className="flex items-center justify-between mb-5">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">{paymentMethod === 'crypto' ? 'Crypto Address' : `Bank Details (${selectedCurrency})`}</h4>
                                            {paymentMethod === 'bank' && <span className="text-xs font-bold text-[#ff4d00] uppercase">Recommended</span>}
                                        </div>
                                        {paymentMethod === 'crypto' ? renderCryptoDetails(selectedCrypto) : renderBankDetails(selectedCurrency)}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 block">
                                        Upload Transfer Confirmation
                                    </label>

                                    {uploadSuccess ? (
                                        <div className="bg-green-50 border border-green-200 p-10 text-center h-full flex flex-col items-center justify-center">
                                            <CheckCircle size={72} className="text-green-500 mb-6" />
                                            <p className="text-lg font-bold text-green-800 mb-3">Upload Successful!</p>
                                            <p className="text-base text-green-600">Your transfer is being reviewed. You will receive instant credit upon validation.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5 h-full flex flex-col">
                                            <div className="border-2 border-dashed border-gray-300 p-10 text-center hover:border-[#ff4d00] transition-colors cursor-pointer flex-1 flex flex-col items-center justify-center">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    id="proof-upload"
                                                />
                                                <label htmlFor="proof-upload" className="cursor-pointer">
                                                    <Upload size={48} className="mx-auto text-gray-400 mb-5" />
                                                    <p className="text-lg font-medium text-gray-600">
                                                        {proofFile ? proofFile.name : 'Click here or drag a file'}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-3">PDF, JPG, PNG (max. 10MB)</p>
                                                </label>
                                            </div>

                                            <button
                                                onClick={handleProofUpload}
                                                disabled={!proofFile || isUploading}
                                                className="w-full bg-[#ff4d00] text-white py-6 text-base font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={20} />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={20} />
                                                        Upload & Release Traffic
                                                    </>
                                                )}
                                            </button>

                                            <div className="bg-gray-50 border border-gray-200 p-5 text-center">
                                                <p className="text-base text-gray-500">
                                                    Amount: <strong className="text-[#ff4d00] text-lg">€{totalPrice.toFixed(2)}</strong> for <strong>{totalVisitors.toLocaleString()} {selectedTier.name} Visitors</strong>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center items-center gap-2 opacity-50">
                        <Lock size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">256-Bit SSL Encrypted & Verified</span>
                    </div>
                </div>
            )}

            {/* FAQ Section */}
            <div className="mt-20 pt-16 border-t border-gray-200">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Frequently Asked Questions</h3>
                    <p className="text-gray-500 max-w-2xl mx-auto">Everything you need to know about purchasing and using our traffic credits.</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-4">
                    {[
                        {
                            q: "What are traffic credits?",
                            a: "Traffic credits are our internal currency. 1 credit equals 1 unique visitor to your website. You purchase credits in bulk and can spend them on any active projects or campaigns you create in your dashboard."
                        },
                        {
                            q: "Do my credits expire?",
                            a: "No, purchased credits never expire. They remain in your account indefinitely until you use them on campaigns. You have complete flexibility on when and how to deploy your traffic."
                        },
                        {
                            q: "How fast is the delivery?",
                            a: "Traffic delivery begins immediately after your campaign goes live. You can control the exact speed, from a slow drip (e.g., 100 visitors/day) to a massive surge, depending on your project settings."
                        },
                        {
                            q: "What defines 'High Quality' vs. other tiers?",
                            a: "Our tiers dictate the routing network and residential IP quality. Higher tiers use premium, low-fraud-score residential proxies that heavily mimic real user behavior, offering longer session times and better geographic precision."
                        },
                        {
                            q: "How do Crypto/Bank payments work?",
                            a: "For Crypto and Bank Wire, you'll transfer the exact amount to the provided details and upload a screenshot or transaction hash. Our team verifies this manually (usually within 1-12 hours) and instantly releases the credits to your account upon confirmation."
                        }
                    ].map((faq, index) => (
                        <div key={index} className="border border-gray-200 bg-white overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 focus:outline-none"
                            >
                                <span className="font-bold text-gray-900 text-lg pr-8">{faq.q}</span>
                                <div className={`flex-shrink-0 transition-transform duration-300 text-[#ff4d00] ${openFaq === index ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            <div
                                className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BuyCredits;
