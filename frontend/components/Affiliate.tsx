
import React, { useState, useEffect } from 'react';
import { Copy, Users, DollarSign, ExternalLink, Award, CheckCircle2, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { db } from '../services/db';

const Affiliate: React.FC = () => {
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
      const currentUser = db.getCurrentUser();
      setUser(currentUser);
      
      // Check if user has already activated (Mock logic: using local storage for persistence in this demo)
      const hasJoined = localStorage.getItem(`affiliate_active_${currentUser?.id}`);
      if (hasJoined) {
          setIsActivated(true);
      }
  }, []);

  const handleActivate = () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
          setIsActivated(true);
          setLoading(false);
          if (user) {
              localStorage.setItem(`affiliate_active_${user.id}`, 'true');
          }
      }, 1500);
  };

  const referralLink = user ? `https://modus-traffic.com/ref/u/${user.id}` : "https://modus-traffic.com/ref/u/guest";

  if (!isActivated) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 max-w-5xl mx-auto">
            
            <div className="text-center mb-12 pt-8">
                <div className="inline-flex items-center gap-2 bg-orange-50 text-[#ff4d00] border border-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-widest mb-6 rounded-full">
                    <Zap size={14} className="fill-[#ff4d00]" /> Partner Program
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
                    Earn 20% <span className="text-[#ff4d00]">Lifetime</span> Commission.
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                    Turn your traffic into recurring revenue. Refer customers to Modus Traffic and earn a permanent 20% cut of every purchase they make, forever.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {[
                    { icon: <DollarSign size={24}/>, title: "Recurring Revenue", desc: "You don't just get paid once. You get paid every time your referral adds funds." },
                    { icon: <ShieldCheck size={24}/>, title: "Instant Payouts", desc: "Withdraw your earnings via PayPal, Wise, or Crypto once you hit €50." },
                    { icon: <Users size={24}/>, title: "High Conversion", desc: "Our high-converting landing pages ensure you get the maximum value from your clicks." }
                ].map((item, i) => (
                    <div key={i} className="bg-white border border-gray-200 p-8 text-center shadow-sm hover:border-[#ff4d00] transition-colors group">
                        <div className="w-14 h-14 bg-black text-white flex items-center justify-center rounded-full mx-auto mb-6 group-hover:bg-[#ff4d00] transition-colors">
                            {item.icon}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-[#111] text-white p-12 text-center rounded-sm relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d00] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Ready to start earning?</h2>
                    <button 
                        onClick={handleActivate}
                        disabled={loading}
                        className="bg-[#ff4d00] text-white px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all transform hover:-translate-y-1 shadow-lg flex items-center gap-3 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Activating Account...' : (
                            <>Activate Affiliate Program <ArrowRight size={18} /></>
                        )}
                    </button>
                    <p className="text-xs text-gray-500 mt-6 font-medium">By activating, you agree to our Affiliate Terms of Service.</p>
                </div>
            </div>

        </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Hero / Header */}
      <div className="bg-[#111] text-white p-8 md:p-12 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d00] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-[#ff4d00] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 rounded-sm">
                    <CheckCircle2 size={12} /> Active Partner
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Dashboard</h2>
                <p className="text-gray-400 leading-relaxed text-sm font-medium">
                    Your program is active. You are earning a <span className="text-white font-bold">20% Lifetime Commission</span> on all referred sales.
                </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 w-full md:w-auto min-w-[300px] rounded-sm">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unpaid Earnings</div>
                <div className="text-4xl font-black text-[#ff4d00] mb-4">€0.00</div>
                <div className="flex justify-between text-xs text-gray-300 border-t border-white/10 pt-4 font-mono">
                    <span>Pending: €0.00</span>
                    <span className="text-green-400">Paid: €0.00</span>
                </div>
            </div>
        </div>
      </div>

      {/* Referral Link Tool */}
      <div className="bg-white border border-gray-200 p-8 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-4 flex items-center gap-2">
            <ExternalLink size={14} /> Your Unique Referral Link
        </h3>
        <div className="flex gap-0">
            <input 
                readOnly 
                value={referralLink} 
                className="flex-1 bg-[#f9fafb] border border-gray-200 border-r-0 p-4 text-sm font-bold text-gray-600 outline-none font-mono"
            />
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    alert("Link copied to clipboard!");
                }}
                className="bg-black text-white px-6 py-4 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
            >
                <Copy size={14} /> Copy Link
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Stats */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Users size={14} /> Referral Statistics
            </h3>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Total Clicks</span>
                    <span className="text-xl font-black text-gray-900">0</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gray-800 h-full w-0"></div>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Signups</span>
                    <span className="text-xl font-black text-gray-900">0</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#ff4d00] h-full w-0"></div>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Active Customers</span>
                    <span className="text-xl font-black text-gray-900">0</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-0"></div>
                </div>
            </div>
        </div>

        {/* Benefits List */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Award size={14} /> Active Benefits
            </h3>
            <ul className="space-y-4">
                {[
                    "20% recurring lifetime commission",
                    "Dedicated account manager support",
                    "Custom landing pages for high volume partners",
                    "Monthly payouts with no minimum threshold",
                    "Real-time tracking dashboard"
                ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <div className="min-w-[4px] h-[4px] bg-[#ff4d00] mt-2 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-600 leading-relaxed">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>

    </div>
  );
};

export default Affiliate;
