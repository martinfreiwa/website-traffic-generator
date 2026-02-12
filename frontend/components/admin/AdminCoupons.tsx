
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Coupon } from '../../types';
import { Plus, Trash2, Tag, Calendar, AlertCircle, Copy, Settings, Shield, Share2 } from 'lucide-react';

interface AdminCouponsProps {
    onRefresh: () => void;
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ onRefresh }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
        code: '',
        discountType: 'percent',
        discountValue: 0,
        active: true,
        usedCount: 0,
        allowedPlans: [],
        maxUsesPerUser: 1
    });

    // Bulk Generator State
    const [bulkPrefix, setBulkPrefix] = useState('PROMO-');
    const [bulkCount, setBulkCount] = useState(10);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = () => {
        const data = db.getCoupons();
        setCoupons(data);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this coupon?')) {
            db.deleteCoupon(id);
            loadCoupons();
        }
    };

    const handleCreate = () => {
        if (!newCoupon.code || !newCoupon.discountValue) return;

        const coupon: Coupon = {
            id: Date.now().toString(),
            code: newCoupon.code.toUpperCase(),
            discountType: newCoupon.discountType as 'percent' | 'fixed',
            discountValue: Number(newCoupon.discountValue),
            active: newCoupon.active || false,
            usedCount: 0,
            expiryDate: newCoupon.expiryDate,
            maxUses: newCoupon.maxUses,
            maxUsesPerUser: newCoupon.maxUsesPerUser,
            allowedPlans: newCoupon.allowedPlans
        };

        db.saveCoupon(coupon);
        setIsCreating(false);
        setNewCoupon({ code: '', discountType: 'percent', discountValue: 0, active: true, usedCount: 0, allowedPlans: [], maxUsesPerUser: 1 });
        loadCoupons();
        onRefresh();
    };

    const handleBulkGenerate = () => {
        const batchId = Date.now().toString();
        const newCoupons: Coupon[] = [];

        for (let i = 0; i < bulkCount; i++) {
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            newCoupons.push({
                id: `${batchId}-${i}`,
                code: `${bulkPrefix}${randomStr}`,
                discountType: newCoupon.discountType as 'percent' | 'fixed',
                discountValue: Number(newCoupon.discountValue),
                active: true,
                usedCount: 0,
                expiryDate: newCoupon.expiryDate,
                maxUses: 1, // Usually single use for bulk
                maxUsesPerUser: 1,
                bulkBatchId: batchId
            });
        }

        newCoupons.forEach(c => db.saveCoupon(c));
        setIsCreating(false);
        setIsBulkMode(false);
        loadCoupons();
        alert(`Successfully generated ${bulkCount} coupons!`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Coupon Manager</h2>
                    <p className="text-sm text-gray-500">Create and manage discount codes for campaigns.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setIsCreating(true); setIsBulkMode(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <Copy size={16} />
                        <span>Bulk Generate</span>
                    </button>
                    <button
                        onClick={() => { setIsCreating(true); setIsBulkMode(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={16} />
                        <span>Create Coupon</span>
                    </button>
                </div>
            </div>

            {/* Creation Form */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        {isBulkMode ? <Copy className="text-[#ff4d00]" size={20} /> : <Tag className="text-[#ff4d00]" size={20} />}
                        {isBulkMode ? 'Bulk Generate Coupons' : 'New Coupon'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-gray-400 border-b border-gray-100 pb-1">Core Settings</h4>

                            {isBulkMode ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Prefix</label>
                                        <input
                                            type="text"
                                            value={bulkPrefix}
                                            onChange={e => setBulkPrefix(e.target.value.toUpperCase())}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                            placeholder="e.g. SUMMER-"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            value={bulkCount}
                                            onChange={e => setBulkCount(Number(e.target.value))}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                            min="1" max="1000"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Code</label>
                                    <input
                                        type="text"
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                        placeholder="e.g. SUMMER2024"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount Value</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={newCoupon.discountValue}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                    />
                                    <select
                                        value={newCoupon.discountType}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                                        className="p-2 border border-gray-300 rounded bg-gray-50"
                                    >
                                        <option value="percent">% Off</option>
                                        <option value="fixed">$ Off</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-gray-400 border-b border-gray-100 pb-1">Restrictions & Limits</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={newCoupon.expiryDate || ''}
                                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Uses (Total)</label>
                                    <input
                                        type="number"
                                        value={newCoupon.maxUses || ''}
                                        onChange={e => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                        placeholder="Unlimited"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Per User</label>
                                    <input
                                        type="number"
                                        value={newCoupon.maxUsesPerUser || ''}
                                        onChange={e => setNewCoupon({ ...newCoupon, maxUsesPerUser: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Plan Restriction</label>
                                    <select
                                        multiple
                                        className="w-full p-2 border border-gray-300 rounded text-xs h-[42px]"
                                        value={newCoupon.allowedPlans || []}
                                        onChange={e => {
                                            const target = e.target as HTMLSelectElement;
                                            const options = Array.from(target.selectedOptions, option => option.value);
                                            setNewCoupon({ ...newCoupon, allowedPlans: options });
                                        }}
                                    >
                                        <option value="foundation">Foundation</option>
                                        <option value="momentum">Momentum</option>
                                        <option value="breakthrough">Breakthrough</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Duration</label>
                                    <select
                                        value={newCoupon.duration || 'once'}
                                        onChange={e => setNewCoupon({ ...newCoupon, duration: e.target.value as any })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                    >
                                        <option value="once">Once</option>
                                        <option value="forever">Forever</option>
                                        <option value="repeating">Repeating</option>
                                    </select>
                                </div>
                                {newCoupon.duration === 'repeating' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Months</label>
                                        <input
                                            type="number"
                                            value={newCoupon.durationInMonths || ''}
                                            onChange={e => setNewCoupon({ ...newCoupon, durationInMonths: Number(e.target.value) })}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none"
                                            placeholder="3"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={isBulkMode ? handleBulkGenerate : handleCreate}
                            className="px-6 py-2 bg-[#ff4d00] text-white font-bold rounded hover:bg-[#e64600] transition-colors"
                        >
                            {isBulkMode ? `Generate ${bulkCount} Coupons` : 'Save Coupon'}
                        </button>
                    </div>
                </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Discount</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Usage</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Restrictions</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {coupons.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Tag size={32} className="text-gray-300" />
                                        <p>No coupons created yet.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            coupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono font-bold text-gray-900 bg-gray-100 inline-flex items-center gap-2 px-2 py-1 rounded border border-gray-200 text-xs group">
                                            {coupon.code}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const url = `${window.location.origin}?coupon=${coupon.code}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert(`Copied: ${url}`);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-black transition-all"
                                                title="Copy Sharable Link"
                                            >
                                                <Share2 size={10} />
                                            </button>
                                        </div>
                                        {coupon.bulkBatchId && (
                                            <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-wide border border-gray-200 px-1 rounded">BULK</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">
                                        {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase
                                            ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {coupon.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {coupon.allowedPlans && coupon.allowedPlans.length > 0 ? (
                                            <div className="flex gap-1">
                                                {coupon.allowedPlans.map(p => (
                                                    <span key={p} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded capitalize border border-blue-100">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Global</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(coupon.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Coupon"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Advanced Features</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Use <strong>Bulk Generate</strong> to create hundreds of unique codes for partners or affiliates.
                        Use <strong>Plan Restrictions</strong> to create "Upgrade Only" offers valid for specific premium tiers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminCoupons;
