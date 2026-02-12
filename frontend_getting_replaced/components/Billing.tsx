
import React from 'react';
import { CreditCard, Plus, Trash2, Home } from 'lucide-react';

const Billing: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-end justify-between">
        <div>
           <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Payment Settings</div>
           <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Billing & Methods</h2>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <CreditCard size={14} /> Saved Payment Methods
            </h3>
            <button className="text-[#ff4d00] text-[10px] font-bold uppercase tracking-widest hover:text-black flex items-center gap-1">
                <Plus size={12} /> Add New
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="border border-gray-200 p-6 flex justify-between items-center bg-[#f9fafb]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-[#111] rounded-sm flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">•••• •••• •••• 4242</div>
                        <div className="text-xs text-gray-400 font-medium">Expires 12/26</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm">Default</span>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

             {/* Card 2 */}
             <div className="border border-gray-200 p-6 flex justify-between items-center hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white text-[10px] font-bold italic">Amex</div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">•••• •••• •••• 1002</div>
                        <div className="text-xs text-gray-400 font-medium">Expires 08/25</div>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="bg-white border border-gray-200 p-8 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff4d00] mb-6 flex items-center gap-2">
            <Home size={14} /> Billing Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Company Name</label>
                <input type="text" defaultValue="Modus Inc." className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Street Address</label>
                <input type="text" defaultValue="123 Innovation Dr." className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none" />
            </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Apartment / Suite</label>
                <input type="text" defaultValue="Suite 400" className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">City</label>
                <input type="text" defaultValue="New York" className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Postal Code</label>
                <input type="text" defaultValue="10001" className="w-full bg-[#f9fafb] border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#ff4d00] outline-none" />
            </div>
        </div>
        <div className="mt-8 flex justify-end">
            <button className="bg-white border border-gray-200 text-gray-900 px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                Update Billing Info
            </button>
        </div>
      </div>

    </div>
  );
};

export default Billing;
