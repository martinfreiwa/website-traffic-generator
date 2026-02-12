import React, { useState, useEffect } from 'react';
import { PriceClass } from '../types';
import { db } from '../services/db';

interface PricingCardProps {
  initialData: PriceClass[];
  onSave?: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ initialData, onSave }) => {
  const [pricingData, setPricingData] = useState<PriceClass[]>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if initialData changes (e.g. loaded from DB)
  useEffect(() => {
    setPricingData(initialData);
  }, [initialData]);

  const handleInputChange = (id: string, field: keyof PriceClass, value: string) => {
    // Allow raw string update for smooth typing of decimals
    // We will parse it when updating state but keep it valid
    let numValue: number = parseFloat(value);

    if (isNaN(numValue)) numValue = 0;

    setPricingData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: numValue } : item
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.savePricing(pricingData);
      if (onSave) onSave();
      alert('Traffic Campaign Configuration Saved to Database!');
    } catch (e) {
      console.error(e);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 shadow-sm border border-gray-100 min-h-[600px] animate-in fade-in">
      <div className="mb-10">
        <h3 className="text-[#ff4d00] text-xs font-bold uppercase tracking-widest mb-1">
          Global Pricing Configuration
        </h3>
        <p className="text-gray-500 text-sm">Configure your traffic package rates per tier. Changes affect ALL new campaigns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {pricingData.map((item) => (
          <div key={item.id} className="flex flex-col space-y-6 p-6 border border-gray-50 hover:border-gray-200 transition-colors bg-gray-50/50">
            <h4 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">{item.name}</h4>

            {/* CPM Rate */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                CPM Rate (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.hourlyRate}
                onChange={(e) => handleInputChange(item.id, 'hourlyRate', e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 p-3 text-sm font-bold outline-none focus:border-[#ff4d00] transition-colors"
              />
            </div>

            {/* Base Campaign Fee */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                Base Campaign Fee (€)
              </label>
              <input
                type="number"
                value={item.baseFee}
                onChange={(e) => handleInputChange(item.id, 'baseFee', e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 p-3 text-sm font-bold outline-none focus:border-[#ff4d00] transition-colors"
              />
            </div>

            {/* Setup / Audit Fee */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                Setup & Audit Fee (€)
              </label>
              <input
                type="number"
                value={item.examFee}
                onChange={(e) => handleInputChange(item.id, 'examFee', e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 p-3 text-sm font-bold outline-none focus:border-[#ff4d00] transition-colors"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-end pt-8 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Global Configuration'}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;
