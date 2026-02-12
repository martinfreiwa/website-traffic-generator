
import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Zap, Shield, Wallet, ArrowRight, Lock, Loader2, Landmark, Smartphone, Calculator } from 'lucide-react';
import { db } from '../services/db';

interface BuyCreditsProps {
  onBack: () => void;
  onPurchase?: () => void;
}

type PaymentMethod = 'apple_pay' | 'bank_transfer' | 'visa' | 'mastercard' | 'revolut_card';

const PRESET_AMOUNTS = [
    { val: 29, label: 'Starter', visits: '50k Visits' },
    { val: 129, label: 'Growth', visits: '300k Visits' },
    { val: 399, label: 'Business', visits: '1M Visits', popular: true },
    { val: 999, label: 'Enterprise', visits: '3M Visits' },
    { val: 1249, label: 'Agency Pro', visits: '5M Visits' },
    { val: 2999, label: 'Agency Scale', visits: '15M Visits' },
];

const WISE_LINKS: Record<number, string> = {
    29: 'https://wise.com/pay/r/Z8n972iVe9Weh9g',
    129: 'https://wise.com/pay/r/28ekryVPGRMo7V8',
    399: 'https://wise.com/pay/r/8aLMxQj9sk0lOHA',
    999: 'https://wise.com/pay/r/T-8pXdsj-EGvuqU',
    1249: 'https://wise.com/pay/r/bz2NsKVEAxNyGBU',
    2999: 'https://wise.com/pay/r/3ollLtm3W1VZv7M'
};

const CUSTOM_PAYMENT_LINK = 'https://revolut.me/easytrafficbot';
const MIN_CUSTOM_AMOUNT = 29;

const BuyCredits: React.FC<BuyCreditsProps> = ({ onBack, onPurchase }) => {
  const [balance, setBalance] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(399); 
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('visa');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
      setBalance(db.getBalance());
  }, []);

  // Helper to handle switching between Preset and Custom
  const handlePresetSelect = (val: number) => {
      setSelectedPreset(val);
      setCustomAmount(''); // Clear custom
      setMethod('visa'); // Default to standard methods
  };

  const handleCustomChange = (val: string) => {
      setCustomAmount(val);
      setSelectedPreset(null); // Clear preset
      setMethod('revolut_card'); // Force/Default to Revolut for custom
  };

  // Dynamic Rate Calculation based on Volume Tiers
  const getRateForAmount = (amount: number) => {
      if (amount >= 2999) return 0.000199933; // ~Agency Scale
      if (amount >= 1249) return 0.0002498;   // ~Agency Pro
      if (amount >= 999) return 0.000333;     // ~Enterprise
      if (amount >= 399) return 0.000399;     // ~Business
      if (amount >= 129) return 0.00043;      // ~Growth
      return 0.00058;                         // ~Starter
  };

  // Derived Values
  const activeAmount = selectedPreset !== null ? selectedPreset : (parseFloat(customAmount) || 0);
  const currentRate = getRateForAmount(activeAmount);
  
  const estimatedCustomVisits = activeAmount > 0 
    ? Math.floor(activeAmount / currentRate) 
    : 0;

  const displayVisits = selectedPreset 
    ? PRESET_AMOUNTS.find(p => p.val === selectedPreset)?.visits 
    : `${estimatedCustomVisits.toLocaleString()} Visits`;

  const handlePayment = () => {
      // 1. Determine Link
      let link = '';
      
      if (selectedPreset) {
          link = WISE_LINKS[selectedPreset];
      } else {
          // Custom Logic
          if (activeAmount < MIN_CUSTOM_AMOUNT) {
              alert(`Minimum custom funding amount is €${MIN_CUSTOM_AMOUNT}.`);
              return;
          }
          link = CUSTOM_PAYMENT_LINK;
      }

      if (!link) {
          alert('Configuration error: No payment link available.');
          return;
      }

      setIsProcessing(true);
      
      // Simulate processing state before redirect
      setTimeout(() => {
          window.location.href = link;
          setIsProcessing(false); 
      }, 1500);
  };

  const getMethodLabel = (m: PaymentMethod) => {
      switch(m) {
          case 'apple_pay': return 'Apple Pay';
          case 'bank_transfer': return 'Bank Transfer';
          case 'visa': return 'Visa Card';
          case 'mastercard': return 'Mastercard';
          case 'revolut_card': return 'Credit Card (Revolut)';
      }
  };

  if (isProcessing) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in">
              <Loader2 className="w-16 h-16 text-[#ff4d00] animate-spin mb-6" />
              <h3 className="text-2xl font-black uppercase text-gray-900 mb-2">Redirecting to Secure Payment</h3>
              <p className="text-gray-500">Please wait while we connect you to the payment gateway...</p>
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header with Balance */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Financials</div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Add Funds</h2>
        </div>
        <div className="bg-[#111] text-white px-6 py-4 flex items-center gap-4 shadow-xl">
            <div className="text-right">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Balance</div>
                <div className="text-2xl font-black text-white">€{balance.toFixed(2)}</div>
            </div>
            <Wallet className="text-[#ff4d00]" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Selection */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* Preset Selection */}
              <div className="bg-white border border-gray-200 p-8 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                      <Zap size={14} /> Select Package
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {PRESET_AMOUNTS.map((item) => (
                          <button
                              key={item.val}
                              onClick={() => handlePresetSelect(item.val)}
                              className={`relative border-2 p-4 flex flex-col items-center justify-between transition-all duration-200 min-h-[140px]
                                  ${selectedPreset === item.val 
                                      ? 'border-[#ff4d00] bg-[#fff5f2]' 
                                      : 'border-gray-100 hover:border-gray-300'
                                  }
                              `}
                          >
                              {item.popular && (
                                  <div className="absolute top-0 right-0 bg-[#ff4d00] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">
                                      Best Value
                                  </div>
                              )}
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{item.label}</div>
                              <div className="text-3xl font-black text-gray-900 my-2">€{item.val}</div>
                              <div className="text-xs font-bold text-[#ff4d00] mb-2">{item.visits}</div>
                              
                              {selectedPreset === item.val && (
                                  <div className="absolute bottom-2 text-[#ff4d00]">
                                      <Check size={16} />
                                  </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Custom Amount Section */}
              <div className={`bg-white border p-8 shadow-sm transition-colors ${customAmount ? 'border-[#ff4d00] ring-1 ring-[#ff4d00]' : 'border-gray-200'}`}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                      <Calculator size={14} /> Or Enter Custom Amount
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Amount (€)</label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">€</span>
                              <input 
                                  type="number" 
                                  min={MIN_CUSTOM_AMOUNT}
                                  value={customAmount}
                                  onChange={(e) => handleCustomChange(e.target.value)}
                                  className="w-full bg-[#f9fafb] border border-gray-200 p-4 pl-10 text-xl font-black text-gray-900 outline-none focus:border-[#ff4d00] transition-colors placeholder:text-gray-300"
                                  placeholder="500"
                              />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">Minimum amount: €{MIN_CUSTOM_AMOUNT}</p>
                      </div>
                      
                      <div className="flex-1 w-full bg-[#111] p-4 rounded-sm text-white flex flex-col justify-center min-h-[100px]">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Traffic</div>
                          <div className="text-3xl font-black text-[#ff4d00]">
                              {activeAmount > 0 && !selectedPreset ? estimatedCustomVisits.toLocaleString() : (selectedPreset ? displayVisits.split(' ')[0] : '0')}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">Based on rate €{currentRate.toFixed(6)}/visit</div>
                      </div>
                  </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 p-8 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                      <CreditCard size={14} /> Payment Method
                  </h3>
                  
                  {selectedPreset ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                              onClick={() => setMethod('apple_pay')}
                              className={`flex items-center justify-between p-6 border transition-all ${method === 'apple_pay' ? 'border-[#ff4d00] bg-[#fff5f2] ring-1 ring-[#ff4d00]' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'apple_pay' ? 'bg-[#ff4d00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      <Smartphone size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">Apple Pay</span>
                              </div>
                              {method === 'apple_pay' && <Check className="text-[#ff4d00]" size={18} />}
                          </button>

                          <button 
                              onClick={() => setMethod('bank_transfer')}
                              className={`flex items-center justify-between p-6 border transition-all ${method === 'bank_transfer' ? 'border-[#ff4d00] bg-[#fff5f2] ring-1 ring-[#ff4d00]' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'bank_transfer' ? 'bg-[#ff4d00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      <Landmark size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">Bank Transfer</span>
                              </div>
                              {method === 'bank_transfer' && <Check className="text-[#ff4d00]" size={18} />}
                          </button>

                          <button 
                              onClick={() => setMethod('visa')}
                              className={`flex items-center justify-between p-6 border transition-all ${method === 'visa' ? 'border-[#ff4d00] bg-[#fff5f2] ring-1 ring-[#ff4d00]' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'visa' ? 'bg-[#ff4d00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      <CreditCard size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">Visa Card</span>
                              </div>
                              {method === 'visa' && <Check className="text-[#ff4d00]" size={18} />}
                          </button>

                          <button 
                              onClick={() => setMethod('mastercard')}
                              className={`flex items-center justify-between p-6 border transition-all ${method === 'mastercard' ? 'border-[#ff4d00] bg-[#fff5f2] ring-1 ring-[#ff4d00]' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'mastercard' ? 'bg-[#ff4d00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      <CreditCard size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">Mastercard</span>
                              </div>
                              {method === 'mastercard' && <Check className="text-[#ff4d00]" size={18} />}
                          </button>
                      </div>
                  ) : (
                      /* Custom Payment Method Only */
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-sm">
                          <div className="flex items-center justify-between p-6 border border-[#ff4d00] bg-white ring-1 ring-[#ff4d00]">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#ff4d00] text-white">
                                      <CreditCard size={18} />
                                  </div>
                                  <div>
                                      <span className="text-sm font-bold text-gray-900 block">Credit Card</span>
                                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">via Revolut Secure Pay</span>
                                  </div>
                              </div>
                              <Check className="text-[#ff4d00]" size={18} />
                          </div>
                      </div>
                  )}
              </div>

          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#111] text-white p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Wallet size={120} />
                  </div>
                  
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 relative z-10">Order Summary</h3>

                  <div className="space-y-4 mb-8 relative z-10">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Package Type</span>
                          <span className="font-bold text-white">{selectedPreset ? 'Standard' : 'Custom'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Est. Traffic</span>
                          <span className="font-bold text-[#ff4d00]">{displayVisits}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Processing Fee</span>
                          <span className="font-bold text-green-400">Free</span>
                      </div>
                      <div className="h-px bg-gray-800 my-4"></div>
                      
                      <div className="flex justify-between items-end">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Due</span>
                          <span className="text-3xl font-black text-white">€{activeAmount.toLocaleString()}</span>
                      </div>
                  </div>

                  <button 
                      onClick={handlePayment}
                      disabled={activeAmount < (selectedPreset ? 0 : MIN_CUSTOM_AMOUNT)}
                      className="w-full bg-[#ff4d00] text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Pay with {getMethodLabel(method)} <ArrowRight size={14} />
                  </button>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 relative z-10">
                      <Lock size={12} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Secure Checkout</span>
                  </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gray-50 border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                      <Shield className="text-[#ff4d00] shrink-0" size={24} />
                      <div>
                          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">Buyer Protection</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                              Payments are processed securely. Your funds are credited instantly upon confirmation.
                          </p>
                      </div>
                  </div>
              </div>
          </div>

      </div>

    </div>
  );
};

export default BuyCredits;
