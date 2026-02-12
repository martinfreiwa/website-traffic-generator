
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Coupon } from '../../types';
import { Plus, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react';

interface AdminCouponsProps {
    onRefresh: () => void;
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ onRefresh }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
        code: '',
        discountType: 'percent',
        discountValue: 0,
        active: true,
        usedCount: 0
    });

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
            maxUses: newCoupon.maxUses
        };

        db.saveCoupon(coupon);
        setIsCreating(false);
        setNewCoupon({ code: '', discountType: 'percent', discountValue: 0, active: true, usedCount: 0 });
        loadCoupons();
        onRefresh();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Coupon Manager</h2>
                    <p className="text-sm text-gray-500">Create and manage discount codes for campaigns.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                    <Plus size={16} />
                    <span>Create Coupon</span>
                </button>
            </div>

            {/* Creation Form */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4">New Coupon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Code</label>
                            <input
                                type="text"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                placeholder="e.g. SUMMER2024"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount Value</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newCoupon.discountValue}
                                    onChange={e => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
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
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Expiry Date (Optional)</label>
                            <input
                                type="date"
                                value={newCoupon.expiryDate || ''}
                                onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Uses (Optional)</label>
                            <input
                                type="number"
                                value={newCoupon.maxUses || ''}
                                onChange={e => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                placeholder="Unlimited"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-[#ff4d00] text-white font-bold rounded hover:bg-[#e64600] transition-colors"
                        >
                            Save Coupon
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
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Expiry</th>
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
                                        <div className="font-mono font-bold text-gray-900 bg-gray-100 inline-block px-2 py-1 rounded border border-gray-200">
                                            {coupon.code}
                                        </div>
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
                                        {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : 'times'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {coupon.expiryDate ? (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{coupon.expiryDate}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Never</span>
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
                    <h4 className="text-sm font-bold text-blue-900">How Coupons Work</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Coupons can be applied by users during checkout. Percentage discounts apply to the total cart value.
                        Fixed discounts deduct a specific amount. If you set a "Max Uses" limit, the coupon will automatically disable after reaching that count.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminCoupons;
