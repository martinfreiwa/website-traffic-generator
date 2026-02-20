import React, { useState, useEffect } from 'react';
import { Gift, Upload, Link as LinkIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { db } from '../services/db';

interface BenefitType {
    id: string;
    type: string;
    category: string;
    name: string;
    value: number;
    requirements: any;
    active: boolean;
}

const FreeTraffic: React.FC = () => {
    const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBenefit, setSelectedBenefit] = useState<BenefitType | null>(null);

    // Form State
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [typesRes, requestsRes] = await Promise.all([
                fetch(`${window.location.origin}/benefits/types`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch(`${window.location.origin}/benefits/my-requests`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            ]);
            if (typesRes.ok) {
                setBenefitTypes(await typesRes.json());
            }
            if (requestsRes.ok) {
                setMyRequests(await requestsRes.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBenefit) return;
        if (!url) {
            setError('Please provide a URL.');
            return;
        }
        setError('');

        try {
            setUploading(true);
            let screenshotUrl = '';

            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch(`${window.location.origin}/benefits/upload-screenshot`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    body: formData
                });

                if (!uploadRes.ok) throw new Error('Failed to upload screenshot');
                const uploadData = await uploadRes.json();
                screenshotUrl = uploadData.url;
            }

            setSubmitting(true);
            const submitRes = await fetch(`${window.location.origin}/benefits/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    benefit_type: selectedBenefit.type,
                    benefit_category: selectedBenefit.category,
                    url,
                    screenshot_url: screenshotUrl,
                    claimed_value: selectedBenefit.value,
                    description: '' // Optional description from user can be added here
                })
            });

            if (!submitRes.ok) {
                const errData = await submitRes.json();
                throw new Error(errData.detail || 'Failed to submit request');
            }

            // Success
            await loadData();
            setSelectedBenefit(null);
            setUrl('');
            setFile(null);
        } catch (err: any) {
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setUploading(false);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#ff4d00] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 lg:p-12 text-white overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Gift size={200} />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white flex items-center gap-4">
                        Free Traffic <Gift className="text-[#ff4d00]" size={40} />
                    </h1>
                    <p className="text-xl text-gray-400 font-light leading-relaxed">
                        Earn free credits by completing promotional tasks. Share your experience, create content,
                        and help us grow to receive instant traffic credits to your account.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-gray-900">Available Tasks</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {benefitTypes.map((benefit) => {
                            const reqs = benefit.requirements || {};
                            const frequency = reqs.frequency || 'all_time';
                            const maxClaims = reqs.max_claims || 0;

                            return (
                                <div key={benefit.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-[#ff4d00]/30 transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-[#ff4d00]/10 text-[#ff4d00] text-xs font-black uppercase tracking-wider rounded-full mb-3">
                                                {benefit.type}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-[#ff4d00] transition-colors">{benefit.name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-[#ff4d00]">€{benefit.value}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase">Credit Value</div>
                                        </div>
                                    </div>

                                    {reqs.description && (
                                        <p className="text-sm text-gray-600 mb-4">{reqs.description}</p>
                                    )}

                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <h4 className="text-xs font-black text-gray-900 uppercase mb-2">Requirements</h4>
                                        <ul className="space-y-2">
                                            {Object.keys(reqs).map((k) => {
                                                if (k === 'description' || k === 'frequency' || k === 'max_claims') return null;
                                                return (
                                                    <li key={k} className="text-xs text-gray-600 flex items-center gap-2">
                                                        <CheckCircle size={12} className="text-green-500" />
                                                        {k.replace('min_', 'Minimum ')}: <span className="font-bold">{reqs[k]}</span>
                                                    </li>
                                                );
                                            })}
                                            {maxClaims > 0 && (
                                                <li className="text-xs text-blue-600 flex items-center gap-2 font-medium">
                                                    <CheckCircle size={12} className="text-blue-500" />
                                                    Limit: {maxClaims} time(s) {frequency === 'all_time' ? '' : frequency}
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => setSelectedBenefit(benefit)}
                                        className="w-full py-3 bg-gray-900 text-white text-sm font-bold uppercase rounded-xl hover:bg-[#ff4d00] transition-colors"
                                    >
                                        Claim Reward
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900">Your Claims</h2>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                        {myRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <Gift className="mx-auto text-gray-300 mb-3" size={32} />
                                <p className="text-sm text-gray-500">No claims submitted yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myRequests.map((req, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 mb-1">
                                                {benefitTypes.find(b => b.type === req.benefit_type && b.category === req.benefit_category)?.name || req.benefit_type}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(req.submitted_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-gray-900">€{req.claimed_value}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-full inline-block mt-1 ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {req.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {selectedBenefit && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl relative">
                        <button
                            onClick={() => { setSelectedBenefit(null); setError(''); }}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <AlertCircle size={24} />
                        </button>

                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-[#ff4d00]/10 text-[#ff4d00] text-xs font-black uppercase tracking-wider rounded-full mb-2">
                                Claim Reward
                            </span>
                            <h3 className="text-2xl font-black text-gray-900">{selectedBenefit.name}</h3>
                            <p className="text-sm text-gray-500 mt-2">Submit proof of your completed task below.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2 border border-red-100">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Task Link (URL)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LinkIcon size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="url"
                                        required
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent transition-all outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Screenshot Proof</label>
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 group-hover:bg-[#ff4d00]/5 group-hover:border-[#ff4d00]/30 transition-all text-center">
                                        <Upload size={32} className={`mx-auto mb-3 ${file ? 'text-[#ff4d00]' : 'text-gray-400'}`} />
                                        <p className="text-sm font-medium text-gray-900">
                                            {file ? file.name : 'Click or drag image here'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedBenefit(null); setError(''); }}
                                    className="flex-1 px-6 py-4 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || submitting}
                                    className="flex-1 px-6 py-4 text-sm font-bold text-white bg-[#ff4d00] hover:bg-[#e64600] rounded-xl transition-colors uppercase disabled:opacity-50 relative overflow-hidden"
                                >
                                    {(uploading || submitting) ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {uploading ? 'Uploading...' : 'Submitting...'}
                                        </div>
                                    ) : 'Submit Claim'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreeTraffic;
