import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ExternalLink, AlertTriangle, Users, Gift, Trash2, Edit, Plus, Save } from 'lucide-react';
import { db } from '../../services/db';

interface PendingBenefit {
  id: string;
  user_email: string;
  benefit_type: string;
  benefit_category: string;
  url: string;
  description?: string;
  screenshot_url?: string;
  claimed_value: number;
  submitted_at: string;
}

const AdminBenefits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'types' | 'history' | 'signup'>('pending');
  const [pendingBenefits, setPendingBenefits] = useState<PendingBenefit[]>([]);
  const [benefitTypes, setBenefitTypes] = useState<any[]>([]);
  const [historyBenefits, setHistoryBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefit, setSelectedBenefit] = useState<PendingBenefit | null>(null);
  const [reviewForm, setReviewForm] = useState({ approvedValue: '', adminNotes: '', fraudFlagged: false, fraudReason: '' });
  const [processing, setProcessing] = useState(false);

  // Signup credits settings
  const [signupCredits, setSignupCredits] = useState<number>(0);
  const [savingCredits, setSavingCredits] = useState(false);

  const [editingType, setEditingType] = useState<any | null>(null);
  const [reqsStr, setReqsStr] = useState('');
  const [savingType, setSavingType] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pending, types, history, settingsRes] = await Promise.all([
        db.getPendingBenefits().catch(() => []),
        fetch(`${window.location.origin}/admin/benefit-types`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('tgp_token')}` }
        }).then(r => r.json()).then(data => Array.isArray(data) ? data : []).catch(() => []),
        db.getBenefitsHistory().catch(() => []),
        fetch(`${window.location.origin}/settings`).then(r => r.json()).catch(() => ({ settings: {} }))
      ]);
      setPendingBenefits(pending);
      setBenefitTypes(types);
      setHistoryBenefits(history);

      // Load signup credits from settings
      const settings = settingsRes.settings || {};
      setSignupCredits(settings.newUserSignupCreditsEconomy || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignupCredits = async () => {
    setSavingCredits(true);
    try {
      const currentSettingsRes = await fetch(`${window.location.origin}/settings`).then(r => r.json()).catch(() => ({ settings: {} }));
      const currentSettings = currentSettingsRes.settings || {};
      const newSettings = { ...currentSettings, newUserSignupCreditsEconomy: signupCredits };

      await fetch(`${window.location.origin}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      });
      alert('Signup credits saved successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setSavingCredits(false);
    }
  };

  const handleEditType = (bt: any) => {
    setEditingType(bt);
    setReqsStr(JSON.stringify(bt.requirements || {}, null, 2));
  };

  const handleAddType = () => {
    setEditingType({ type: '', category: '', name: '', value: 0, active: true, display_order: 0 });
    setReqsStr('{\n  "description": "",\n  "max_claims": 0,\n  "frequency": "all_time"\n}');
  };

  const handleSaveType = async () => {
    setSavingType(true);
    try {
      let reqs = {};
      try {
        reqs = JSON.parse(reqsStr);
      } catch (err) {
        throw new Error("Invalid JSON in requirements");
      }

      const payload = { ...editingType, requirements: reqs };
      const typeId = payload.id;
      delete payload.id;
      delete payload.created_at;

      let url = `${window.location.origin}/admin/benefit-types`;
      let method = 'POST';
      if (typeId) {
        url += `/${typeId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('tgp_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save');
      }

      setEditingType(null);
      await loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingType(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedBenefit) return;
    setProcessing(true);
    try {
      await db.approveBenefit(selectedBenefit.id, parseFloat(reviewForm.approvedValue) || selectedBenefit.claimed_value, reviewForm.adminNotes);
      await loadData();
      setSelectedBenefit(null);
      setReviewForm({ approvedValue: '', adminNotes: '', fraudFlagged: false, fraudReason: '' });
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBenefit) return;
    setProcessing(true);
    try {
      await db.rejectBenefit(selectedBenefit.id, reviewForm.adminNotes, reviewForm.fraudFlagged, reviewForm.fraudReason);
      await loadData();
      setSelectedBenefit(null);
      setReviewForm({ approvedValue: '', adminNotes: '', fraudFlagged: false, fraudReason: '' });
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff4d00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Benefits Management</h1>
          <p className="text-sm text-gray-500">Review marketing activity submissions and manage benefit types</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-xs font-bold uppercase ${activeTab === 'pending' ? 'bg-[#ff4d00] text-white' : 'bg-gray-200'}`}>
            Pending ({pendingBenefits.length})
          </button>
          <button onClick={() => setActiveTab('types')} className={`px-4 py-2 text-xs font-bold uppercase ${activeTab === 'types' ? 'bg-[#ff4d00] text-white' : 'bg-gray-200'}`}>
            Benefit Types
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-xs font-bold uppercase ${activeTab === 'history' ? 'bg-[#ff4d00] text-white' : 'bg-gray-200'}`}>
            History
          </button>
          <button onClick={() => setActiveTab('signup')} className={`px-4 py-2 text-xs font-bold uppercase ${activeTab === 'signup' ? 'bg-[#ff4d00] text-white' : 'bg-gray-200'}`}>
            Signup Credits
          </button>
        </div>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingBenefits.length === 0 ? (
            <div className="bg-white border border-gray-200 p-12 text-center">
              <Gift size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pending benefit requests</p>
            </div>
          ) : (
            pendingBenefits.map((benefit) => (
              <div key={benefit.id} className="bg-white border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-100 p-3">
                      <Clock size={24} className="text-yellow-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{benefit.user_email}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5">{benefit.benefit_type}</span>
                        <span className="text-xs bg-[#ff4d00]/10 text-[#ff4d00] px-2 py-0.5">{benefit.benefit_category}</span>
                      </div>
                      <a href={benefit.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        {benefit.url} <ExternalLink size={12} />
                      </a>
                      {benefit.screenshot_url && (
                        <a href={benefit.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1">
                          View Screenshot <ExternalLink size={12} />
                        </a>
                      )}
                      {benefit.description && <p className="text-sm text-gray-500 mt-2">{benefit.description}</p>}
                      <div className="text-xs text-gray-400 mt-2">Submitted: {new Date(benefit.submitted_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#ff4d00]">€{benefit.claimed_value}</div>
                    <div className="text-xs text-gray-500">Claimed</div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setSelectedBenefit(benefit); setReviewForm({ ...reviewForm, approvedValue: String(benefit.claimed_value) }); }} className="px-3 py-1 bg-green-500 text-white text-xs font-bold uppercase hover:bg-green-600">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Types Tab */}
      {activeTab === 'types' && (
        <div className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold">Benefit Types Configuration</h3>
            <button onClick={handleAddType} className="px-3 py-1 bg-[#ff4d00] text-white text-xs font-bold uppercase flex items-center gap-1 hover:bg-[#e64600]">
              <Plus size={14} /> Add Type
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Value</th>
                <th className="text-center p-4 text-xs font-bold text-gray-500 uppercase">Active</th>
                <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {benefitTypes.map((bt) => (
                <tr key={bt.id} className="border-t border-gray-100">
                  <td className="p-4 text-sm">{bt.type}</td>
                  <td className="p-4 text-sm">{bt.category}</td>
                  <td className="p-4 text-sm font-medium">{bt.name}</td>
                  <td className="p-4 text-sm text-right font-bold">€{bt.value}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 text-xs ${bt.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {bt.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEditType(bt)} className="p-1 text-gray-400 hover:text-[#ff4d00]"><Edit size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Processed Benefits</h3>
          </div>
          {historyBenefits.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-bold">No processed benefits yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Claimed</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Approved</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Reviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historyBenefits.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-xs font-bold text-gray-900">{b.user_email}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{b.benefit_type} / {b.benefit_category}</td>
                      <td className="px-6 py-4 text-xs font-bold">€{b.claimed_value}</td>
                      <td className="px-6 py-4 text-xs font-bold text-green-600">
                        {b.approved_value ? `€${b.approved_value}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${b.status === 'approved' ? 'bg-green-100 text-green-700' :
                          b.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                          {b.status === 'approved' ? <CheckCircle size={10} /> :
                            b.status === 'rejected' ? <XCircle size={10} /> :
                              <Clock size={10} />}
                          {b.status}
                        </span>
                        {b.fraud_flagged && (
                          <span className="ml-2 text-[8px] text-red-600 font-black uppercase">Fraud</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {b.reviewed_at ? new Date(b.reviewed_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Signup Credits Tab */}
      {activeTab === 'signup' && (
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">New User Signup Bonus (Economy Credits)</h3>
            <p className="text-sm text-gray-500 mt-1">Configure how many economy credits new users receive for free when they register</p>
          </div>
          <div className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signup Bonus (Economy Credits)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={signupCredits}
                    onChange={(e) => setSignupCredits(parseInt(e.target.value) || 0)}
                    className="pl-4 pr-4 py-2 w-full border border-gray-300 focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <span className="text-gray-500">credits</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Set to 0 to disable signup bonus. New users will not receive any economy credits upon registration.
              </p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleSaveSignupCredits}
                  disabled={savingCredits}
                  className="px-4 py-2 bg-[#ff4d00] text-white font-bold uppercase text-xs flex items-center gap-2 hover:bg-[#e64600] disabled:opacity-50"
                >
                  {savingCredits ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {savingCredits ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Users size={16} />
                  How it works
                </h4>
                <ul className="mt-2 text-xs text-blue-800 space-y-1">
                  <li>• When a new user registers, they will automatically receive {signupCredits.toLocaleString()} economy credits</li>
                  <li>• Credits are added to their economy balance immediately</li>
                  <li>• A transaction record is created for tracking</li>
                  <li>• This setting applies to all new registrations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBenefit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Review Benefit Request</h3>

            <div className="bg-gray-50 p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">User:</span>
                <span className="text-sm font-bold">{selectedBenefit.user_email}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Type:</span>
                <span className="text-sm font-bold">{selectedBenefit.benefit_type} / {selectedBenefit.benefit_category}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Claimed:</span>
                <span className="text-sm font-bold text-[#ff4d00]">€{selectedBenefit.claimed_value}</span>
              </div>
              <div className="mt-2 pt-2 border-t flex flex-col gap-2">
                <a href={selectedBenefit.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  View Link ↗
                </a>
                {selectedBenefit.screenshot_url && (
                  <a href={selectedBenefit.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    View Screenshot ↗
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Approved Value (€)</label>
                <input
                  type="number"
                  className="w-full border p-3"
                  value={reviewForm.approvedValue}
                  onChange={(e) => setReviewForm({ ...reviewForm, approvedValue: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Admin Notes</label>
                <textarea
                  className="w-full border p-3"
                  rows={3}
                  value={reviewForm.adminNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, adminNotes: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fraud"
                  checked={reviewForm.fraudFlagged}
                  onChange={(e) => setReviewForm({ ...reviewForm, fraudFlagged: e.target.checked })}
                />
                <label htmlFor="fraud" className="text-sm text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle size={14} /> Flag as Fraud
                </label>
              </div>
              {reviewForm.fraudFlagged && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fraud Reason</label>
                  <input
                    type="text"
                    className="w-full border p-3 border-red-300"
                    value={reviewForm.fraudReason}
                    onChange={(e) => setReviewForm({ ...reviewForm, fraudReason: e.target.value })}
                    placeholder="Reason for fraud flag..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedBenefit(null)} className="flex-1 border py-3 text-xs font-bold uppercase">Cancel</button>
              <button onClick={handleReject} disabled={processing} className="flex-1 bg-red-500 text-white py-3 text-xs font-bold uppercase disabled:opacity-50">
                Reject
              </button>
              <button onClick={handleApprove} disabled={processing} className="flex-1 bg-green-500 text-white py-3 text-xs font-bold uppercase disabled:opacity-50">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Benefit Type Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingType.id ? 'Edit Benefit Type' : 'Add Benefit Type'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label>
                  <input type="text" className="w-full border p-2" value={editingType.type} onChange={(e) => setEditingType({ ...editingType, type: e.target.value })} placeholder="e.g. youtube, blog" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                  <input type="text" className="w-full border p-2" value={editingType.category} onChange={(e) => setEditingType({ ...editingType, category: e.target.value })} placeholder="e.g. viral, premium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Name</label>
                <input type="text" className="w-full border p-2" value={editingType.name} onChange={(e) => setEditingType({ ...editingType, name: e.target.value })} placeholder="e.g. YouTube Video" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Value (€)</label>
                  <input type="number" step="0.01" className="w-full border p-2" value={editingType.value} onChange={(e) => setEditingType({ ...editingType, value: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Order</label>
                  <input type="number" className="w-full border p-2" value={editingType.display_order} onChange={(e) => setEditingType({ ...editingType, display_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center pt-6">
                  <input type="checkbox" id="bt-active" checked={editingType.active} onChange={(e) => setEditingType({ ...editingType, active: e.target.checked })} className="mr-2" />
                  <label htmlFor="bt-active" className="text-sm font-bold">Active</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Requirements (JSON)</label>
                <textarea className="w-full border p-2 font-mono text-sm" rows={6} value={reqsStr} onChange={(e) => setReqsStr(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Requires valid JSON. Common fields: "description", "max_claims", "frequency" ("all_time", "daily", "weekly", "monthly").</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingType(null)} className="flex-1 border py-3 text-xs font-bold uppercase">Cancel</button>
              <button onClick={handleSaveType} disabled={savingType} className="flex-1 bg-[#ff4d00] text-white py-3 text-xs font-bold uppercase disabled:opacity-50">
                {savingType ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminBenefits;
