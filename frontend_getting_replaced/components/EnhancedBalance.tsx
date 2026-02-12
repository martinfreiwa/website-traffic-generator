import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, TrendingUp, TrendingDown, Clock, CreditCard, X, 
  Printer, Share2, FileText, RefreshCw, AlertCircle, CheckCircle,
  Repeat, FileDown, Calendar, Filter, ChevronDown, ChevronLeft,
  ChevronRight, Search, MoreHorizontal, Building2, Receipt,
  AlertTriangle, Loader2
} from 'lucide-react';
import { db } from '../services/db';
import { Transaction, User } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface EnhancedBalanceProps {
  onBack?: () => void;
}

interface Invoice {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  items: InvoiceItem[];
  billingDetails: BillingDetails;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BillingDetails {
  companyName: string;
  vatId?: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextPaymentDate: string;
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: string;
}

const COLORS = ['#ff4d00', '#111111', '#888888', '#e0e0e0'];

const EnhancedBalance: React.FC<EnhancedBalanceProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices' | 'recurring'>('overview');
  
  // Transaction filters
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // Recurring payments
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  
  // Retry payment
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const currentUser = db.getCurrentUser();
    setUser(currentUser || null);
    
    const allTransactions = db.getTransactions();
    setTransactions(allTransactions);
    setBalance(db.getBalance());
    
    // Mock recurring payments
    setRecurringPayments([
      {
        id: 'rp_1',
        name: 'Monthly Traffic Package - Growth',
        amount: 129,
        frequency: 'monthly',
        nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        paymentMethod: 'Visa •••• 4242'
      },
      {
        id: 'rp_2',
        name: 'Auto-Top Up (€50)',
        amount: 50,
        frequency: 'weekly',
        nextPaymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        paymentMethod: 'Mastercard •••• 8888'
      }
    ]);
    
    setLoading(false);
  };

  const generateInvoiceFromTransaction = (transaction: Transaction): Invoice => {
    const taxRate = 0.19; // 19% VAT for EU
    const subtotal = transaction.amount;
    const taxAmount = subtotal * taxRate;
    
    return {
      id: `inv_${transaction.id}`,
      transactionId: transaction.id,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(transaction.id).padStart(5, '0')}`,
      date: transaction.date,
      dueDate: transaction.date,
      amount: subtotal,
      taxAmount: taxAmount,
      totalAmount: subtotal + taxAmount,
      status: transaction.status === 'completed' ? 'paid' : transaction.status === 'failed' ? 'failed' : 'pending',
      items: [{
        description: transaction.desc,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal
      }],
      billingDetails: {
        companyName: user?.company || user?.name || 'Unknown',
        vatId: user?.vatId,
        address: user?.address || '',
        city: user?.city || '',
        zip: user?.zip || '',
        country: user?.country || ''
      }
    };
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = !searchQuery || 
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      matchesDate = new Date(t.date) >= cutoff;
    }
    
    return matchesType && matchesStatus && matchesSearch && matchesDate;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const totalDeposited = transactions
    .filter(t => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const failedTransactions = transactions.filter(t => t.status === 'failed');

  const handleDownloadInvoice = (invoice: Invoice) => {
    const invoiceData = `
INVOICE
=======
Invoice Number: ${invoice.invoiceNumber}
Date: ${invoice.date}
Due Date: ${invoice.dueDate}

BILL TO:
${invoice.billingDetails.companyName}
${invoice.billingDetails.vatId ? `VAT ID: ${invoice.billingDetails.vatId}\n` : ''}
${invoice.billingDetails.address}
${invoice.billingDetails.city}, ${invoice.billingDetails.zip}
${invoice.billingDetails.country}

ITEMS:
${invoice.items.map(item => `- ${item.description}: €${item.total.toFixed(2)}`).join('\n')}

Subtotal: €${invoice.amount.toFixed(2)}
Tax (19%): €${invoice.taxAmount.toFixed(2)}
Total: €${invoice.totalAmount.toFixed(2)}

Status: ${invoice.status.toUpperCase()}
    `.trim();

    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    // In a real app, this would generate a PDF
    // For now, we'll create a styled HTML that can be printed to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 3px solid #ff4d00; padding-bottom: 20px; margin-bottom: 30px; }
              .invoice-title { font-size: 32px; font-weight: bold; color: #111; }
              .invoice-number { color: #ff4d00; font-weight: bold; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 10px; }
              .details { line-height: 1.6; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
              td { padding: 12px; border-bottom: 1px solid #eee; }
              .total-section { margin-top: 30px; text-align: right; }
              .total-row { display: flex; justify-content: flex-end; gap: 40px; margin: 10px 0; }
              .grand-total { font-size: 24px; font-weight: bold; color: #ff4d00; margin-top: 20px; }
              .status { display: inline-block; padding: 8px 16px; background: ${invoice.status === 'paid' ? '#d4edda' : invoice.status === 'failed' ? '#f8d7da' : '#fff3cd'}; color: ${invoice.status === 'paid' ? '#155724' : invoice.status === 'failed' ? '#721c24' : '#856404'}; font-weight: bold; text-transform: uppercase; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">${invoice.invoiceNumber}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
              <div class="section">
                <div class="section-title">From</div>
                <div class="details">
                  <strong>Modus Traffic</strong><br>
                  Traffic Creator OS<br>
                  support@modus-traffic.com
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Invoice Details</div>
                <div class="details">
                  <strong>Date:</strong> ${invoice.date}<br>
                  <strong>Due Date:</strong> ${invoice.dueDate}<br>
                  <strong>Status:</strong> <span class="status">${invoice.status}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Bill To</div>
              <div class="details">
                <strong>${invoice.billingDetails.companyName}</strong><br>
                ${invoice.billingDetails.vatId ? `VAT ID: ${invoice.billingDetails.vatId}<br>` : ''}
                ${invoice.billingDetails.address}<br>
                ${invoice.billingDetails.city}, ${invoice.billingDetails.zip}<br>
                ${invoice.billingDetails.country}
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>€${item.unitPrice.toFixed(2)}</td>
                    <td>€${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>€${invoice.amount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax (19% VAT):</span>
                <span>€${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div class="grand-total">
                Total: €${invoice.totalAmount.toFixed(2)}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleRetryPayment = async (transactionId: string) => {
    setRetryingPayment(transactionId);
    // Simulate retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update transaction status
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, status: 'completed' } : t
    ));
    setRetryingPayment(null);
  };

  const handleToggleRecurring = (id: string) => {
    setRecurringPayments(prev => prev.map(rp => 
      rp.id === id ? { ...rp, status: rp.status === 'active' ? 'paused' : 'active' as any } : rp
    ));
  };

  const handleCancelRecurring = (id: string) => {
    if (confirm('Are you sure you want to cancel this recurring payment?')) {
      setRecurringPayments(prev => prev.filter(rp => rp.id !== id));
    }
  };

  const spendingData = [
    { name: 'Campaigns', value: Math.floor(totalSpent * 0.7) },
    { name: 'Setup Fees', value: Math.floor(totalSpent * 0.2) },
    { name: 'Other', value: Math.floor(totalSpent * 0.1) },
  ];

  const monthlyData = [
    { month: 'Jan', deposits: 500, spending: 300 },
    { month: 'Feb', deposits: 800, spending: 600 },
    { month: 'Mar', deposits: 600, spending: 450 },
    { month: 'Apr', deposits: 1200, spending: 900 },
    { month: 'May', deposits: 900, spending: 750 },
    { month: 'Jun', deposits: 1500, spending: 1100 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#ff4d00]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">
            Financial Center
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Wallet & Billing
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['overview', 'transactions', 'invoices', 'recurring'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                activeTab === tab 
                  ? 'text-[#ff4d00]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4d00]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#111] text-white p-6 relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Current Balance
              </div>
              <div className="text-4xl font-black mb-2">€{balance.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Available for campaigns</div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Total Deposited
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">
                €{totalDeposited.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp size={12} />
                <span>Lifetime</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Total Spent
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">
                €{totalSpent.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingDown size={12} />
                <span>On campaigns</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Pending / Failed
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">
                €{pendingAmount.toFixed(2)}
              </div>
              <div className="text-xs text-orange-500">
                {failedTransactions.length} failed transactions
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">
                Monthly Activity
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="deposits" fill="#ff4d00" name="Deposits" />
                    <Bar dataKey="spending" fill="#111111" name="Spending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">
                Spending Breakdown
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {spendingData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index] }}
                      ></div>
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold">€{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions Preview */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                Recent Transactions
              </h3>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="text-[10px] font-bold text-[#ff4d00] uppercase hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      t.type === 'credit' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {t.type === 'credit' ? 
                        <TrendingUp size={14} className="text-green-600" /> : 
                        <TrendingDown size={14} className="text-gray-600" />
                      }
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{t.desc}</div>
                      <div className="text-[10px] text-gray-400">{t.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                      {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(2)}
                    </div>
                    <div className={`text-[9px] uppercase font-bold ${
                      t.status === 'completed' ? 'text-green-600' :
                      t.status === 'failed' ? 'text-red-600' :
                      'text-orange-500'
                    }`}>
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#f9fafb] border border-gray-200 text-sm focus:border-[#ff4d00] outline-none"
                  />
                </div>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 bg-[#f9fafb] border border-gray-200 text-sm focus:border-[#ff4d00] outline-none"
              >
                <option value="all">All Types</option>
                <option value="credit">Deposits</option>
                <option value="debit">Spending</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-[#f9fafb] border border-gray-200 text-sm focus:border-[#ff4d00] outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 bg-[#f9fafb] border border-gray-200 text-sm focus:border-[#ff4d00] outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f9fafb] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-orange-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            t.type === 'credit' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {t.type === 'credit' ? 
                              <TrendingUp size={14} className="text-green-600" /> : 
                              <TrendingDown size={14} className="text-gray-600" />
                            }
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{t.desc}</div>
                            <div className="text-[9px] text-gray-400 font-mono">{t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{t.date}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.type === 'credit' ? '+' : '-'}€{t.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                          t.status === 'completed' ? 'bg-green-100 text-green-700' :
                          t.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {t.status === 'failed' && <AlertCircle size={10} className="mr-1" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const invoice = generateInvoiceFromTransaction(t);
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-[#ff4d00] transition-colors"
                            title="View Invoice"
                          >
                            <Receipt size={16} />
                          </button>
                          {t.status === 'failed' && (
                            <button
                              onClick={() => handleRetryPayment(t.id)}
                              disabled={retryingPayment === t.id}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                              title="Retry Payment"
                            >
                              {retryingPayment === t.id ? 
                                <Loader2 size={16} className="animate-spin" /> : 
                                <RefreshCw size={16} />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 hover:border-[#ff4d00] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-4 py-2 text-xs font-bold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 hover:border-[#ff4d00] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                All Invoices
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {transactions.filter(t => t.status === 'completed').map(t => {
                const invoice = generateInvoiceFromTransaction(t);
                return (
                  <div key={invoice.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#f9fafb] border border-gray-200 flex items-center justify-center">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{invoice.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">€{invoice.totalAmount.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">incl. €{invoice.taxAmount.toFixed(2)} VAT</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowInvoiceModal(true);
                          }}
                          className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="px-4 py-2 bg-[#ff4d00] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2"
                        >
                          <FileDown size={14} />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recurring Tab */}
      {activeTab === 'recurring' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Manage your automatic payments and subscriptions
            </p>
            <button
              onClick={() => setShowAddRecurring(true)}
              className="px-4 py-2 bg-[#ff4d00] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
            >
              + Add Recurring Payment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recurringPayments.map(rp => (
              <div key={rp.id} className="bg-white border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{rp.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{rp.paymentMethod}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                    rp.status === 'active' ? 'bg-green-100 text-green-700' :
                    rp.status === 'paused' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {rp.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#f9fafb] p-3">
                    <div className="text-[10px] text-gray-400 uppercase">Amount</div>
                    <div className="text-lg font-bold text-gray-900">€{rp.amount.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#f9fafb] p-3">
                    <div className="text-[10px] text-gray-400 uppercase">Frequency</div>
                    <div className="text-sm font-bold text-gray-900 capitalize">{rp.frequency}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Next payment: <span className="font-bold text-gray-900">{rp.nextPaymentDate}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleRecurring(rp.id)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors"
                  >
                    {rp.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleCancelRecurring(rp.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>

          {recurringPayments.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-200">
              <Repeat size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Recurring Payments</h3>
              <p className="text-sm text-gray-500 mb-4">Set up automatic top-ups or subscriptions</p>
              <button
                onClick={() => setShowAddRecurring(true)}
                className="px-6 py-3 bg-[#ff4d00] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Add Your First Recurring Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div 
            ref={invoiceRef}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Invoice Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#ff4d00] flex items-center justify-center">
                    <span className="font-black text-white text-xs">M</span>
                  </div>
                  <span className="font-black text-lg tracking-tight">MODUS TRAFFIC</span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Tax Invoice</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  €{selectedInvoice.totalAmount.toFixed(2)}
                </div>
                <div className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-sm ${
                  selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                  selectedInvoice.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {selectedInvoice.status === 'paid' && <CheckCircle size={12} />}
                  {selectedInvoice.status}
                </div>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">
                    Invoice Number
                  </label>
                  <div className="text-sm font-bold text-gray-900">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">
                    Invoice Date
                  </label>
                  <div className="text-sm font-bold text-gray-900">{selectedInvoice.date}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">
                    Due Date
                  </label>
                  <div className="text-sm font-bold text-gray-900">{selectedInvoice.dueDate}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">
                    Transaction ID
                  </label>
                  <div className="text-sm font-mono text-gray-600">{selectedInvoice.transactionId}</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-3">
                  Bill To
                </label>
                <div className="bg-[#f9fafb] p-4 border border-gray-100">
                  <div className="text-sm font-bold text-gray-900">{selectedInvoice.billingDetails.companyName}</div>
                  {selectedInvoice.billingDetails.vatId && (
                    <div className="text-xs text-gray-500 mt-1">VAT ID: {selectedInvoice.billingDetails.vatId}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {selectedInvoice.billingDetails.address}<br />
                    {selectedInvoice.billingDetails.city}, {selectedInvoice.billingDetails.zip}<br />
                    {selectedInvoice.billingDetails.country}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-3">
                  Items
                </label>
                <table className="w-full">
                  <thead className="bg-[#f9fafb] border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Description</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Qty</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Unit Price</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3 px-4 text-sm">{item.description}</td>
                        <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-right">€{item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm font-bold text-right">€{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-bold">€{selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">VAT (19%)</span>
                      <span className="font-bold">€{selectedInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2">
                      <span>Total</span>
                      <span className="text-[#ff4d00]">€{selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-6 py-3 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider hover:border-[#ff4d00] hover:text-[#ff4d00] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedInvoice)}
                className="px-6 py-3 bg-[#ff4d00] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2"
              >
                <FileDown size={14} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBalance;
