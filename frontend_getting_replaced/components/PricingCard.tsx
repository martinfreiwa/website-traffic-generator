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
    const numValue = parseFloat(value) || 0;
    setPricingData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: numValue } : item
      )
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate network delay
    setTimeout(() => {
      db.savePricing(pricingData);
      setIsSaving(false);
      alert('Traffic Campaign Configuration Saved to Database!');
      if (onSave) onSave();
    }, 600);
  };

  return (
    <div className="bg-white p-8 md:p-10 shadow-sm border border-gray-100 min-h-[600px]">
      <div className="mb-10">
        <h3 className="text-[#ff4d00] text-xs font-bold uppercase tracking-widest mb-1">
          Campaign Pricing
        </h3>
        <p className="text-gray-500 text-sm">Configure your traffic package rates per tier. Changes are saved to the database.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {pricingData.map((item) => (
          <div key={item.id} className="flex flex-col space-y-6">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h4>

            {/* CPM Rate */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 block">
                CPM Rate (€)
              </label>
              <input
                type="number"
                value={item.hourlyRate}
                onChange={(e) => handleInputChange(item.id, 'hourlyRate', e.target.value)}
                className="w-full bg-[#f9fafb] text-gray-900 p-4 text-lg font-medium outline-none focus:ring-1 focus:ring-gray-300 transition-all rounded-sm"
              />
            </div>

            {/* Base Campaign Fee */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 block">
                Base Campaign Fee (€)
              </label>
              <input
                type="number"
                value={item.baseFee}
                onChange={(e) => handleInputChange(item.id, 'baseFee', e.target.value)}
                className="w-full bg-[#f9fafb] text-gray-900 p-4 text-lg font-medium outline-none focus:ring-1 focus:ring-gray-300 transition-all rounded-sm"
              />
            </div>

            {/* Setup / Audit Fee */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 block">
                Setup & Audit Fee (€)
              </label>
              <input
                type="number"
                value={item.examFee}
                onChange={(e) => handleInputChange(item.id, 'examFee', e.target.value)}
                className="w-full bg-[#f9fafb] text-gray-900 p-4 text-lg font-medium outline-none focus:ring-1 focus:ring-gray-300 transition-all rounded-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;
