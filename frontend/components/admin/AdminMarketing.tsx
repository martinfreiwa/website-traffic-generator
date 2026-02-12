
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { MarketingCampaign } from '../../types';
import { Mail, BarChart2, Send, MousePointer, DollarSign } from 'lucide-react';

const AdminMarketing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'email'>('campaigns');
    const [stats, setStats] = useState<MarketingCampaign[]>([]);

    // Email Blast State
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [lastSent, setLastSent] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = () => {
        const data = db.getMarketingStats();
        setStats(data);
    };

    const handleSendTest = async () => {
        if (!emailSubject || !emailBody) return;
        setIsSending(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSending(false);
        setLastSent(new Date().toLocaleTimeString());
        setEmailSubject('');
        setEmailBody('');
        alert('Test email blast sent successfully (Simulated)!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marketing Hub</h2>
                    <p className="text-sm text-gray-500">Manage acquisition campaigns and outbound communications.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`pb-3 px-1 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'campaigns'
                            ? 'border-[#ff4d00] text-[#ff4d00]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart2 size={16} />
                        <span>Ad Tracking & Stats</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('email')}
                    className={`pb-3 px-1 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'email'
                            ? 'border-[#ff4d00] text-[#ff4d00]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>Email Blasts</span>
                    </div>
                </button>
            </div>

            {/* Content */}
            {activeTab === 'campaigns' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    {stats.map(camp => (
                        <div key={camp.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded bg-gray-100 text-gray-600`}>
                                    {camp.type.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded
                                    ${camp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {camp.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{camp.name}</h3>
                            <p className="text-xs text-gray-400 mb-6">Created: {camp.dateCreated}</p>

                            <div className="grid grid-cols-2 gap-4 mt-auto">
                                {camp.type === 'email' ? (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Opens</p>
                                            <p className="text-xl font-mono font-bold text-gray-900">{camp.openRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Clicks</p>
                                            <p className="text-xl font-mono font-bold text-gray-900">{camp.clickRate}%</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Clicks</p>
                                            <p className="text-xl font-mono font-bold text-gray-900">{camp.clicks?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Revenue</p>
                                            <p className="text-xl font-mono font-bold text-green-600">${camp.revenue?.toLocaleString()}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Placeholder for 'New Campaign' */}
                    <button className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-[#ff4d00] hover:border-[#ff4d00] hover:bg-orange-50 transition-all group min-h-[200px]">
                        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#ff4d00] flex items-center justify-center transition-colors">
                            <BarChart2 size={24} className="group-hover:text-white" />
                        </div>
                        <span className="font-bold">Track New URL</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Compose Area */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Send size={20} className="text-[#ff4d00]" />
                                Compose Blast
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Subject Line</label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={e => setEmailSubject(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent outline-none font-medium"
                                        placeholder="e.g. Special Offer for Premium Members"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Target Audience</label>
                                    <select className="w-full p-3 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-[#ff4d00] outline-none">
                                        <option value="all">All Users (Newsletter)</option>
                                        <option value="paid">Active Paid Plans Only</option>
                                        <option value="inactive">Inactive / Churned Users</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Message Body (HTML Supported)</label>
                                    <textarea
                                        value={emailBody}
                                        onChange={e => setEmailBody(e.target.value)}
                                        className="w-full p-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#ff4d00] focus:border-transparent outline-none min-h-[300px] font-mono text-sm"
                                        placeholder="<h1>Hello {name},</h1>..."
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-gray-500">
                                        {lastSent && `Last sent: ${lastSent}`}
                                    </p>
                                    <button
                                        onClick={handleSendTest}
                                        disabled={isSending || !emailSubject || !emailBody}
                                        className={`px-8 py-3 bg-[#ff4d00] text-white font-bold rounded shadow-lg shadow-orange-500/30 hover:bg-[#e64600] transition-all
                                            ${(isSending || !emailSubject || !emailBody) ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:-translate-y-0.5'}`}
                                    >
                                        {isSending ? 'Sending...' : 'Send Broadcast'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Tips */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                            <h4 className="font-bold text-blue-900 mb-2">Best Practices</h4>
                            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                                <li>Keep subject lines under 60 chars</li>
                                <li>Personalize using {'{name}'} tag</li>
                                <li>Include a clear Call to Action</li>
                                <li>Test mobile rendering before sending</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <h4 className="font-bold text-gray-900 mb-4">Previous Blasts</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded border border-gray-200 text-sm">
                                    <div className="font-bold text-gray-800">Spring Sale Announcement</div>
                                    <div className="text-gray-400 text-xs mt-1">Sent: Mar 10 • 12,403 Recipients</div>
                                </div>
                                <div className="p-3 bg-white rounded border border-gray-200 text-sm">
                                    <div className="font-bold text-gray-800">Platform Update v2.1</div>
                                    <div className="text-gray-400 text-xs mt-1">Sent: Feb 28 • 11,200 Recipients</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMarketing;
