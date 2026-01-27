import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Clock, CreditCard, X, Printer, Share2 } from 'lucide-react';
import { db } from '../services/db';
import { Transaction } from '../types';

const Balance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  useEffect(() => {
    setTransactions(db.getTransactions());
    setBalance(db.getBalance());
  }, []);

  const totalDeposited = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDownloadStatement = () => {
      if (transactions.length === 0) {
          alert('No transactions to download.');
          return;
      }
      
      const headers = ['ID', 'Date', 'Description', 'Type', 'Amount', 'Status'];
      const rows = transactions.map(t => [
          t.id,
          t.date,
          `"${t.desc.replace(/"/g, '""')}"`, // Escape quotes
          t.type,
          t.amount.toFixed(2),
          t.status
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
          
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `modus_statement_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const InvoiceModal = ({ trx, onClose }: { trx: Transaction, onClose: () => void }) => (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <div className="bg-white w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                  <div>
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 bg-[#ff4d00] flex items-center justify-center">
                            <span className="font-black text-black text-xs">M</span>
                         </div>
                         <span className="font-black text-lg tracking-tight">MODUS</span>
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-widest">Receipt</div>
                  </div>
                  <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 mb-1">€{trx.amount.toFixed(2)}</div>
                      <div className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 inline-block ${trx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                          {trx.status}
                      </div>
                  </div>
              </div>
              
              {/* Body */}
              <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Date</label>
                          <div className="text-sm font-bold text-gray-900">{trx.date}</div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Transaction ID</label>
                          <div className="text-sm font-mono text-gray-600">{trx.id}</div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Type</label>
                          <div className="text-sm font-bold text-gray-900 capitalize">{trx.type === 'credit' ? 'Deposit' : 'Purchase'}</div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">User</label>
                          <div className="text-sm font-bold text-gray-900">John Doe</div>
                      </div>
                  </div>

                  <div className="bg-gray-50 p-4 border border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Description</label>
                      <div className="text-sm font-medium text-gray-900">{trx.desc}</div>
                  </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase hover:bg-gray-100">
                      <Printer size={14} /> Print
                  </button>
                  <button onClick={onClose} className="px-4 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff4d00]">
                      Close
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {selectedInvoice && <InvoiceModal trx={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Financial Overview</div>
           <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Wallet & Transactions</h2>
        </div>
        <button 
          onClick={handleDownloadStatement}
          className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#ff4d00] transition-colors flex items-center gap-2"
        >
            <Download size={14} /> Download Statement
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] text-white p-8 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <CreditCard size={64} />
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Balance</div>
            <div className="text-4xl font-black text-white mb-4">€{balance.toFixed(2)}</div>
            <div className="flex gap-2">
                <button className="bg-[#ff4d00] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                    Add Funds
                </button>
            </div>
        </div>

        <div className="bg-white border border-gray-200 p-8 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-50 rounded-sm text-green-600">
                    <TrendingUp size={20} />
                </div>
                <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 uppercase tracking-widest text-gray-500">Lifetime</span>
             </div>
             <div className="text-3xl font-black text-gray-900 mb-1">€{totalDeposited.toFixed(2)}</div>
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Deposited</div>
        </div>

        <div className="bg-white border border-gray-200 p-8 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 rounded-sm text-[#ff4d00]">
                    <TrendingDown size={20} />
                </div>
                <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 uppercase tracking-widest text-gray-500">Lifetime</span>
             </div>
             <div className="text-3xl font-black text-gray-900 mb-1">€{totalSpent.toFixed(2)}</div>
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Spent</div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                <Clock size={14} className="text-[#ff4d00]" /> Transaction History
             </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#f9fafb] border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                        <tr><td colSpan={6} className="text-center p-8 text-sm text-gray-400">No transactions found.</td></tr>
                    ) : (
                    transactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-gray-500">{trx.date}</td>
                            <td className="px-6 py-4 text-xs font-mono text-gray-400">{trx.id}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-900">{trx.desc}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-sm">
                                    {trx.status}
                                </span>
                            </td>
                            <td className={`px-6 py-4 text-sm font-black text-right ${trx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                {trx.type === 'debit' ? '-' : '+'}€{trx.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => setSelectedInvoice(trx)}
                                    className="text-gray-400 hover:text-[#ff4d00] transition-colors"
                                >
                                    <Download size={14} />
                                </button>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
        <div className="p-4 bg-[#f9fafb] text-center border-t border-gray-100">
            <button className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#ff4d00]">View All Transactions</button>
        </div>
      </div>
    </div>
  );
};

export default Balance;