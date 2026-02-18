import React, { useState, useEffect } from 'react';
import { Copy, Users, DollarSign, Award, CheckCircle2, Zap, ShieldCheck, Gift, CreditCard, TrendingUp, Clock, AlertCircle, Youtube, Link as LinkIcon, MessageCircle, Star, Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';
import { db } from '../services/db';

interface BenefitType {
  id: string;
  type: string;
  category: string;
  name: string;
  value: number;
  requirements: Record<string, any>;
  active: boolean;
  displayOrder: number;
}

interface BenefitRequest {
  id: string;
  benefitType: string;
  benefitCategory: string;
  url: string;
  description?: string;
  claimedValue: number;
  approvedValue?: number;
  status: string;
  submittedAt: string;
}

interface BenefitBalance {
  benefitBalance: number;
  totalBenefitsClaimed: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

interface AffiliateDashboard {
  tier: {
    tierLevel: number;
    tierName: string;
    commissionRateL1: number;
    commissionRateL2: number;
    commissionRateL3: number;
    totalReferralsL1: number;
    totalReferralsL2: number;
    totalReferralsL3: number;
    totalEarnings: number;
    pendingPayout: number;
    lifetimePayout: number;
  };
  referralLink: string;
  totalReferrals: number;
  benefitBalance: number;
}

const Affiliate: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'benefits' | 'payouts'>('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [benefitBalance, setBenefitBalance] = useState<BenefitBalance | null>(null);
  const [myRequests, setMyRequests] = useState<BenefitRequest[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitType | null>(null);
  const [submitForm, setSubmitForm] = useState({ url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'paypal', paypalEmail: '', bankName: '', bankIban: '', bankSwift: '' });
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [myPayouts, setMyPayouts] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = db.getCurrentUser();
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dash, types, balance, requests, payouts] = await Promise.all([
        db.getAffiliateDashboard().catch(() => null),
        db.getBenefitTypes().catch(() => []),
        db.getBenefitBalance().catch(() => null),
        db.getMyBenefitRequests().catch(() => []),
        db.getMyPayouts().catch(() => [])
      ]);
      setDashboard(dash);
      setBenefitTypes(types);
      setBenefitBalance(balance);
      setMyRequests(requests);
      setMyPayouts(payouts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBenefit = async () => {
    if (!selectedBenefit || !submitForm.url) return;
    setSubmitting(true);
    try {
      await db.submitBenefit({
        benefit_type: selectedBenefit.type,
        benefit_category: selectedBenefit.category,
        url: submitForm.url,
        description: submitForm.description,
        claimed_value: selectedBenefit.value
      });
      await loadData();
      setShowSubmitModal(false);
      setSubmitForm({ url: '', description: '' });
      setSelectedBenefit(null);
    } catch (e: any) {
      alert(e.message || 'Failed to submit benefit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutForm.amount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const minAmount = payoutForm.method === 'paypal' ? 50 : 100;
    if (amount < minAmount) {
      alert(`Minimum payout is €${minAmount} for ${payoutForm.method === 'paypal' ? 'PayPal' : 'Bank Transfer'}`);
      return;
    }
    if (payoutForm.method === 'paypal' && !payoutForm.paypalEmail) {
      alert('Please enter your PayPal email');
      return;
    }
    if (payoutForm.method === 'bank' && (!payoutForm.bankName || !payoutForm.bankIban)) {
      alert('Please enter your bank details');
      return;
    }
    setPayoutSubmitting(true);
    try {
      await db.requestPayout({
        amount,
        method: payoutForm.method,
        payout_details: payoutForm.method === 'paypal' 
          ? { email: payoutForm.paypalEmail }
          : { bank_name: payoutForm.bankName, iban: payoutForm.bankIban, swift: payoutForm.bankSwift }
      });
      await loadData();
      setShowPayoutModal(false);
      setPayoutForm({ amount: '', method: 'paypal', paypalEmail: '', bankName: '', bankIban: '', bankSwift: '' });
      alert('Payout request submitted successfully! We will process it within 5 business days.');
    } catch (e: any) {
      alert(e.message || 'Failed to request payout');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const getTierColor = (level: number) => {
    const colors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2', '#b9f2ff', '#ff4d00'];
    return colors[Math.min(level - 1, 5)];
  };

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube size={20} />;
      case 'blog': return <LinkIcon size={20} />;
      case 'facebook': return <Facebook size={20} />;
      case 'reddit': return <MessageCircle size={20} />;
      case 'twitter': return <Twitter size={20} />;
      case 'instagram': return <Instagram size={20} />;
      case 'tiktok': return <Star size={20} />;
      case 'review': return <Star size={20} />;
      default: return <Gift size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff4d00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const referralLink = dashboard?.referralLink || `https://modus-traffic.com/ref/u/${user?.id}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Partner Program</div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Affiliate Dashboard</h2>
        </div>
        <div className="flex gap-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<TrendingUp size={14} />}>Overview</TabButton>
          <TabButton active={activeTab === 'benefits'} onClick={() => setActiveTab('benefits')} icon={<Gift size={14} />}>Benefits</TabButton>
          <TabButton active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} icon={<DollarSign size={14} />}>Payouts</TabButton>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tier & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tier Card */}
            <div className="bg-white border border-gray-200 p-8 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mt-16 -mr-16 z-0"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-gray-100 shadow-md mx-auto mb-6 bg-white">
                  <Award size={40} style={{ color: getTierColor(dashboard?.tier?.tierLevel || 1) }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{dashboard?.tier?.tierName || 'Bronze Starter'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Current Tier Level {dashboard?.tier?.tierLevel || 1}/6</p>

                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-black text-[#ff4d00]">{((dashboard?.tier?.commissionRateL1 || 0.15) * 100).toFixed(0)}%</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Comm. Rate</div>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-gray-900">{dashboard?.totalReferrals || 0}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Referrals</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Link */}
            <Card title="Your Referral Link" icon={<LinkIcon size={14} />}>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#f9fafb] border border-gray-200 p-3 flex items-center font-mono text-xs font-bold text-gray-600 truncate">
                  {referralLink}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralLink); alert('Copied!'); }}
                  className="bg-black hover:bg-[#ff4d00] text-white p-3 shadow-sm transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
            </Card>
          </div>

          {/* Right Column: Earnings & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard label="Total Earnings" value={`€${(dashboard?.tier?.totalEarnings || 0).toFixed(2)}`} subtext="All time earnings" />
              <StatCard label="Pending Payout" value={`€${(dashboard?.tier?.pendingPayout || 0).toFixed(2)}`} subtext="Available for withdrawal" highlight />
            </div>

            {/* Levels Breakdown */}
            <Card title="Referral Network Performance" icon={<Users size={14} />}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#ff4d00] text-white flex items-center justify-center font-bold text-xs">L1</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Direct Referrals</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{(dashboard?.tier?.commissionRateL1 || 0.15) * 100}% Commission</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-gray-900">{dashboard?.tier?.totalReferralsL1 || 0}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">L2</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Level 2 (Indirect)</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{(dashboard?.tier?.commissionRateL2 || 0.05) * 100}% Override</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-gray-900">{dashboard?.tier?.totalReferralsL2 || 0}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">L3</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Level 3 (Network)</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{(dashboard?.tier?.commissionRateL3 || 0.02) * 100}% Override</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-gray-900">{dashboard?.tier?.totalReferralsL3 || 0}</div>
                </div>
              </div>
            </Card>

            {/* Traffic Credits Teaser */}
            {benefitBalance && benefitBalance.benefitBalance > 0 && (
              <div className="bg-black text-white p-8 relative overflow-hidden shadow-lg">
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-2">Available Credits</div>
                    <div className="text-4xl font-black">€{benefitBalance.benefitBalance.toFixed(2)}</div>
                    <p className="text-xs text-gray-400 mt-2">Use these credits for your own traffic campaigns.</p>
                  </div>
                  <CreditCard size={48} className="text-[#333]" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits Tab */}
      {activeTab === 'benefits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card title="Credit Balance" icon={<CreditCard size={14} />}>
              <div className="text-center py-6">
                <div className="text-3xl font-black text-gray-900 mb-1">€{(benefitBalance?.benefitBalance || 0).toFixed(2)}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Balance</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-black text-gray-900">{benefitBalance?.pendingRequests || 0}</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-green-600">{benefitBalance?.totalBenefitsClaimed.toFixed(2)}</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide">Earned</div>
                </div>
              </div>
            </Card>

            <div className="bg-[#ff4d00] text-white p-8">
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">Earn More Credits</h3>
              <p className="text-xs font-medium opacity-80 mb-6">Complete simple tasks to earn free traffic credits for your campaigns.</p>
              <button onClick={() => setShowSubmitModal(true)} className="w-full bg-white text-black text-xs font-bold uppercase tracking-wider py-3 hover:bg-black hover:text-white transition-colors">
                Submit Activity
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Available Opportunities" icon={<Gift size={14} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefitTypes.slice(0, 8).map((bt) => (
                  <div key={bt.id} onClick={() => { setSelectedBenefit(bt); setShowSubmitModal(true); }}
                    className="border border-gray-100 p-4 hover:border-[#ff4d00] hover:shadow-md transition-all cursor-pointer group bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-white rounded-md shadow-sm text-gray-600 group-hover:text-[#ff4d00] transition-colors">
                        {getBenefitIcon(bt.type)}
                      </div>
                      <span className="text-sm font-black text-[#ff4d00]">€{bt.value}</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{bt.category}</div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{bt.name}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Recent Submissions" icon={<Clock size={14} />}>
              {myRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No submissions yet. Start earning today!</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myRequests.map((req) => (
                    <div key={req.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-600' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {req.status === 'approved' ? <CheckCircle2 size={16} /> : req.status === 'rejected' ? <AlertCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 uppercase">{req.benefitCategory}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{req.url}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black">€{req.approvedValue || req.claimedValue}</div>
                        <div className={`text-[9px] font-bold uppercase tracking-wider ${req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{req.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="grid grid-cols-1 gap-6">
          <Card title="Cashout Earnings" icon={<DollarSign size={14} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-[#f9fafb] border border-gray-200 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available to Payout</div>
                <div className="text-3xl font-black text-green-600">€{(dashboard?.tier?.pendingPayout || 0).toFixed(2)}</div>
              </div>
              <div className="p-6 bg-white border border-gray-200 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Min. PayPal</div>
                <div className="text-xl font-bold text-gray-900">€50.00</div>
              </div>
              <div className="p-6 bg-white border border-gray-200 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Min. Bank Transfer</div>
                <div className="text-xl font-bold text-gray-900">€100.00</div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 shadow-sm rounded-full">
                  <ShieldCheck size={24} className="text-[#ff4d00]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Secure Payout Processing</h4>
                  <p className="text-xs text-gray-500 max-w-md">Payouts are processed manually within 5 business days. Please ensure your billing details are up to date in your profile.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={(dashboard?.tier?.pendingPayout || 0) < 50}
                className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Payout
              </button>
            </div>
          </Card>

          <Card title="Financial History" icon={<TrendingUp size={14} />}>
            <div className="grid grid-cols-2 gap-8 p-4">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lifetime Earnings</div>
                <div className="text-2xl font-black text-gray-900">€{(dashboard?.tier?.totalEarnings || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid Out</div>
                <div className="text-2xl font-black text-gray-900">€{(dashboard?.tier?.lifetimePayout || 0).toFixed(2)}</div>
              </div>
            </div>
          </Card>

          <Card title="Payout History" icon={<Clock size={14} />}>
            {myPayouts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No payout requests yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myPayouts.map((payout) => (
                  <div key={payout.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        payout.status === 'paid' ? 'bg-green-100 text-green-600' :
                        payout.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                        payout.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {payout.status === 'paid' ? <CheckCircle2 size={16} /> :
                         payout.status === 'rejected' ? <AlertCircle size={16} /> :
                         <Clock size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">€{payout.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-500">{payout.method === 'paypal' ? 'PayPal' : 'Bank Transfer'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[9px] font-bold uppercase tracking-wider ${
                        payout.status === 'paid' ? 'text-green-600' :
                        payout.status === 'approved' ? 'text-blue-600' :
                        payout.status === 'rejected' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>{payout.status}</div>
                      <div className="text-[10px] text-gray-400">{new Date(payout.requestedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Gift size={20} className="text-[#ff4d00]" /> Submit Activity
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-black transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <Label>Activity Type</Label>
                <select
                  className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                  value={selectedBenefit?.id || ''}
                  onChange={(e) => {
                    const bt = benefitTypes.find(b => b.id === e.target.value);
                    setSelectedBenefit(bt || null);
                  }}
                >
                  <option value="">Select activity...</option>
                  {benefitTypes.map(bt => (
                    <option key={bt.id} value={bt.id}>{bt.name} - €{bt.value}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Proof URL</Label>
                <Input
                  value={submitForm.url}
                  onChange={(v) => setSubmitForm({ ...submitForm, url: v })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Description / Comments</Label>
                <textarea
                  className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none min-h-[100px]"
                  placeholder="Additional details..."
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                />
              </div>

              {selectedBenefit && (
                <div className="bg-gray-50 border border-gray-100 p-4 flex justify-between items-center">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Value</div>
                  <div className="text-2xl font-black text-[#ff4d00]">€{selectedBenefit.value}</div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 border border-gray-200 py-3 text-xs font-bold uppercase hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitBenefit}
                disabled={!selectedBenefit || !submitForm.url || submitting}
                className="flex-1 bg-black text-white py-3 text-xs font-bold uppercase hover:bg-[#ff4d00] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <DollarSign size={20} className="text-[#ff4d00]" /> Request Payout
              </h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-gray-400 hover:text-black transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Balance</div>
                <div className="text-3xl font-black text-green-600">€{(dashboard?.tier?.pendingPayout || 0).toFixed(2)}</div>
              </div>

              <div>
                <Label>Amount (€)</Label>
                <Input
                  value={payoutForm.amount}
                  onChange={(v) => setPayoutForm({ ...payoutForm, amount: v })}
                  placeholder="0.00"
                  type="number"
                />
              </div>

              <div>
                <Label>Payout Method</Label>
                <select
                  className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none"
                  value={payoutForm.method}
                  onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value })}
                >
                  <option value="paypal">PayPal (Min. €50)</option>
                  <option value="bank">Bank Transfer (Min. €100)</option>
                </select>
              </div>

              {payoutForm.method === 'paypal' ? (
                <div>
                  <Label>PayPal Email</Label>
                  <Input
                    value={payoutForm.paypalEmail}
                    onChange={(v) => setPayoutForm({ ...payoutForm, paypalEmail: v })}
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Bank Name</Label>
                    <Input
                      value={payoutForm.bankName}
                      onChange={(v) => setPayoutForm({ ...payoutForm, bankName: v })}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <Label>IBAN</Label>
                    <Input
                      value={payoutForm.bankIban}
                      onChange={(v) => setPayoutForm({ ...payoutForm, bankIban: v })}
                      placeholder="DE89 3704 0044 0532 0130 00"
                    />
                  </div>
                  <div>
                    <Label>SWIFT/BIC (Optional)</Label>
                    <Input
                      value={payoutForm.bankSwift}
                      onChange={(v) => setPayoutForm({ ...payoutForm, bankSwift: v })}
                      placeholder="DEUTDEFF"
                    />
                  </div>
                </>
              )}

              <div className="bg-yellow-50 border border-yellow-200 p-4 text-xs text-yellow-800">
                <strong>Note:</strong> Payouts are processed manually within 5 business days. Ensure your details are correct.
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowPayoutModal(false)} className="flex-1 border border-gray-200 py-3 text-xs font-bold uppercase hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleRequestPayout}
                disabled={payoutSubmitting}
                className="flex-1 bg-black text-white py-3 text-xs font-bold uppercase hover:bg-[#ff4d00] transition-colors disabled:opacity-50"
              >
                {payoutSubmitting ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Components matching Profile.tsx Design System

const Card: React.FC<{ title: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white border border-gray-200 p-8 shadow-sm h-full">
    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const StatCard: React.FC<{ label: string, value: string, subtext?: string, highlight?: boolean }> = ({ label, value, subtext, highlight }) => (
  <div className={`p-6 border ${highlight ? 'border-[#ff4d00]/30 bg-[#fff5f0]' : 'border-gray-200 bg-white'}`}>
    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
    <div className={`text-3xl font-black ${highlight ? 'text-[#ff4d00]' : 'text-gray-900'}`}>{value}</div>
    {subtext && <div className="text-[10px] text-gray-500 mt-1">{subtext}</div>}
  </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode }> = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border ${active
        ? 'bg-black text-white border-black'
        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
      }`}
  >
    {icon} {children}
  </button>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{children}</label>
)

const Input: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none transition-colors"
    placeholder={placeholder}
  />
)

export default Affiliate;
