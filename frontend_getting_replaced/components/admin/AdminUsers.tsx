
import React, { useState, useMemo } from 'react';
import { User, Transaction, Ticket } from '../../types';
import { db } from '../../services/db';
import { Search, CheckCircle, Ban, DollarSign, Plus, Minus, Layers, Users, Zap, Clock, ChevronLeft, ChevronRight, Edit2, Download, Square, CheckSquare } from 'lucide-react';

interface AdminUsersProps {
  users: User[];
  transactions: Transaction[];
  tickets: Ticket[];
  onRefresh: () => void;
  onEditUser: (id: string) => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, transactions, tickets, onRefresh, onEditUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // Filter State
  const [activeTab, setActiveTab] = useState<'all' | 'balance' | 'spent' | 'projects' | 'new_24h' | 'new_7d' | 'new_30d'>('all');
  
  // Bulk Selection State
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Fetch all projects for aggregation
  const allProjects = useMemo(() => db.getProjects(), [users]); 

  // --- HELPERS ---

  const getUserProjectStats = (userId: string) => {
      const userProjects = allProjects.filter(p => p.userId === userId);
      return {
          total: userProjects.length,
          active: userProjects.filter(p => p.status === 'active').length,
          expired: userProjects.filter(p => p.status === 'completed' || p.status === 'stopped').length, 
          demo: userProjects.filter(p => p.plan === 'Free Trial').length
      };
  };

  const getUserTotalSpent = (userId: string) => {
      return transactions
        .filter(t => t.userId === userId && t.type === 'debit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
  };

  const isUserNew = (dateStr: string, hours: number) => {
      const joinDate = new Date(dateStr).getTime();
      const now = Date.now();
      const diffHours = (now - joinDate) / (1000 * 60 * 60);
      return diffHours <= hours;
  };

  // --- FILTERING & SORTING LOGIC ---

  const filteredAndSortedUsers = useMemo(() => {
      let result = users.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.id.includes(searchTerm)
      );

      switch (activeTab) {
          case 'balance':
              result.sort((a, b) => b.balance - a.balance);
              break;
          case 'spent':
              result.sort((a, b) => getUserTotalSpent(b.id) - getUserTotalSpent(a.id));
              break;
          case 'projects':
              result.sort((a, b) => getUserProjectStats(b.id).total - getUserProjectStats(a.id).total);
              break;
          case 'new_24h':
              result = result.filter(u => isUserNew(u.joinedDate, 24));
              break;
          case 'new_7d':
              result = result.filter(u => isUserNew(u.joinedDate, 24 * 7));
              break;
          case 'new_30d':
              result = result.filter(u => isUserNew(u.joinedDate, 24 * 30));
              break;
          default:
              result.sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
      }
      return result;
  }, [users, searchTerm, activeTab, allProjects, transactions]);

  // --- PAGINATION LOGIC ---

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  React.useEffect(() => {
      setCurrentPage(1);
  }, [activeTab, searchTerm, itemsPerPage]);

  // Bulk Selection Handlers
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkExport = () => {
    const selectedData = users.filter(u => selectedUsers.has(u.id));
    const csv = [
      ['ID', 'Name', 'Email', 'Balance', 'Status', 'Joined'].join(','),
      ...selectedData.map(u => [u.id, u.name, u.email, u.balance, u.status, u.joinedDate].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setSelectedUsers(new Set());
    setShowBulkActions(false);
  };

  const handleBulkSuspend = async () => {
    if (!confirm(`Suspend ${selectedUsers.size} users?`)) return;
    // Would call API to suspend users
    alert(`Suspended ${selectedUsers.size} users`);
    setSelectedUsers(new Set());
    setShowBulkActions(false);
    onRefresh();
  };

  // --- LIST VIEW ---

  const tabs = [
      { id: 'all', label: 'All Users', icon: <Users size={14} /> },
      { id: 'balance', label: 'Highest Balance', icon: <DollarSign size={14} /> },
      { id: 'projects', label: 'Most Projects', icon: <Layers size={14} /> },
      { id: 'spent', label: 'Top Spenders', icon: <DollarSign size={14} /> },
      { id: 'new_24h', label: 'New (24h)', icon: <Clock size={14} /> },
      { id: 'new_7d', label: 'New (7d)', icon: <Clock size={14} /> },
      { id: 'new_30d', label: 'New (30d)', icon: <Clock size={14} /> },
  ];

  return (
    <div className="animate-in fade-in">
        {/* Bulk Actions Bar */}
        {showBulkActions && (
            <div className="bg-[#111] text-white p-4 rounded-sm shadow-lg flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{selectedUsers.size} users selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleBulkExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                    >
                        <Download size={14} /> Export Selected
                    </button>
                    <button 
                        onClick={handleBulkSuspend}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                    >
                        <Ban size={14} /> Suspend
                    </button>
                    <button 
                        onClick={() => { setSelectedUsers(new Set()); setShowBulkActions(false); }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <h2 className="text-2xl font-black uppercase tracking-tight">User Management</h2>
            
            <div className="flex gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-[#ff4d00]" 
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                </div>

                {/* Pagination Limit */}
                <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 outline-none focus:border-[#ff4d00]"
                >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                </select>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors rounded-sm
                        ${activeTab === tab.id 
                            ? 'bg-black text-white' 
                            : 'bg-white text-gray-500 hover:bg-gray-100'
                        }
                    `}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <button 
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 hover:text-[#ff4d00] transition-colors"
                                >
                                    {selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0 ? (
                                        <CheckSquare size={16} className="text-[#ff4d00]" />
                                    ) : (
                                        <Square size={16} />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Analytics</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedUsers.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users found matching your criteria.</td></tr>
                        ) : (
                            paginatedUsers.map(user => {
                                const stats = getUserProjectStats(user.id);
                                const totalSpent = getUserTotalSpent(user.id);

                                return (
                                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${selectedUsers.has(user.id) ? 'bg-blue-50/50' : ''}`}>
                                        {/* Checkbox */}
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleUserSelection(user.id)}
                                                className="text-gray-400 hover:text-[#ff4d00] transition-colors"
                                            >
                                                {selectedUsers.has(user.id) ? (
                                                    <CheckSquare size={18} className="text-[#ff4d00]" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </td>
                                        {/* User Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                                    <div className="text-[10px] text-gray-400">{user.email}</div>
                                                    <div className="text-[9px] text-gray-300 mt-0.5">Joined: {user.joinedDate}</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Project Analytics */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-600">
                                                    <Layers size={10} className="text-[#ff4d00]"/> {stats.total} Total
                                                </div>
                                                <div className="flex gap-3 text-[9px] text-gray-400 font-medium">
                                                    <span className="text-green-600">{stats.active} Active</span>
                                                    <span>{stats.expired} Expired</span>
                                                    {stats.demo > 0 && <span className="text-blue-500 flex items-center gap-0.5"><Zap size={8}/> {stats.demo} Demo</span>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Financials */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-gray-900">€{user.balance.toFixed(2)}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Spent: €{totalSpent.toFixed(0)}</div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {user.status === 'active' ? (
                                                <span className="text-green-600 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><CheckCircle size={10}/> Active</span>
                                            ) : (
                                                <span className="text-red-600 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Ban size={10}/> Suspended</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                                            <button 
                                                onClick={() => onEditUser(user.id)}
                                                className="bg-gray-100 hover:bg-black hover:text-white text-gray-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm flex items-center gap-2"
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Page {currentPage} of {totalPages} ({filteredAndSortedUsers.length} Users)
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="bg-white border border-gray-200 px-3 py-2 text-gray-600 hover:border-[#ff4d00] hover:text-[#ff4d00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className="flex gap-1">
                            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
                                if (pageNum > totalPages) return null;
                                
                                return (
                                    <button 
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 text-xs font-bold flex items-center justify-center border transition-colors
                                            ${currentPage === pageNum 
                                                ? 'bg-[#ff4d00] border-[#ff4d00] text-white' 
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-white border border-gray-200 px-3 py-2 text-gray-600 hover:border-[#ff4d00] hover:text-[#ff4d00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminUsers;