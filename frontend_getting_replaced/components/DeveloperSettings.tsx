import React, { useState, useEffect } from 'react';
import { Terminal, Eye, EyeOff, RefreshCw, Copy, X, ShieldCheck, AlertCircle, FileCode, CheckCircle2 } from 'lucide-react';
import { db } from '../services/db';
import { User as UserType } from '../types';

const DeveloperSettings: React.FC = () => {
  const [user, setUser] = useState<UserType | undefined>(undefined);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // API Application State
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiUsage, setApiUsage] = useState('');
  const [apiWebsites, setApiWebsites] = useState('');
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);

  useEffect(() => {
      loadUser();
  }, []);

  const loadUser = async () => {
      setIsLoading(true);
      try {
          await db.fetchMe();
          setUser(db.getCurrentUser());
      } catch (e) {
          console.error("Failed to load user", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleApiSubmit = async () => {
      if (!apiUsage || !apiWebsites) {
          alert("Please fill in all fields.");
          return;
      }
      setIsSubmittingApi(true);
      try {
          await db.applyForApi(apiUsage, apiWebsites);
          alert("Application submitted successfully. We will review it shortly.");
          setShowApiModal(false);
          loadUser();
      } catch (e: any) {
          alert(e.message || "Failed to submit application");
      } finally {
          setIsSubmittingApi(false);
      }
  }

  const handleRegenerateKey = async () => {
      if(confirm('Are you sure? This will invalidate your old key.')) {
          try {
              const newKey = await db.generateApiKey();
              if (user) setUser({...user, apiKey: newKey});
          } catch (e: any) {
              alert(e.message || "Failed to regenerate API Key");
          }
      }
  }

  const handleCopyKey = () => {
      if(user?.apiKey) {
          navigator.clipboard.writeText(user.apiKey);
          alert('API Key copied to clipboard');
      }
  }

  if (isLoading || !user) return <div className="p-12 text-center text-gray-500">Loading Developer Console...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-1">Programmatic Access</div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">API & Developer Console</h2>
          <p className="text-gray-500 mt-2 max-w-2xl leading-relaxed">
              Integrate Traffic Creator into your own applications, scripts, or workflow using our powerful REST API.
          </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Console Area */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* API Status Card */}
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-black p-6 flex justify-between items-center">
                      <div className="flex items-center gap-3 text-white">
                          <Terminal size={20} className="text-[#ff4d00]" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Your API Access</h3>
                      </div>
                      <div className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest ${
                          user.api_access_status === 'approved' ? 'bg-green-500 text-white' :
                          user.api_access_status === 'pending' ? 'bg-orange-500 text-white' :
                          'bg-gray-700 text-gray-300'
                      }`}>
                          Status: {user.api_access_status || 'none'}
                      </div>
                  </div>

                  <div className="p-8">
                      {(!user.api_access_status || user.api_access_status === 'none' || user.api_access_status === 'rejected') ? (
                          <div className="text-center py-10 space-y-6">
                              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                                  <AlertCircle size={32} className="text-gray-300" />
                              </div>
                              <div className="max-w-md mx-auto">
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">Access Restricted</h4>
                                  <p className="text-sm text-gray-500 leading-relaxed mb-8">
                                      To maintain high delivery standards and prevent infrastructure abuse, API access is granted manually.
                                  </p>
                                  <button 
                                      onClick={() => setShowApiModal(true)}
                                      className="bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-[#ff4d00] transition-colors shadow-lg"
                                  >
                                      Apply for Access
                                  </button>
                              </div>
                          </div>
                      ) : user.api_access_status === 'pending' ? (
                          <div className="text-center py-10 space-y-6">
                              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto border border-orange-100">
                                  <RefreshCw size={32} className="text-orange-500 animate-spin" />
                              </div>
                              <div className="max-w-md mx-auto">
                                  <h4 className="text-lg font-bold text-orange-900 mb-2">Application Under Review</h4>
                                  <p className="text-sm text-gray-600 leading-relaxed italic bg-orange-50 p-4 border border-orange-100 rounded-sm">
                                      "{user.api_application_data?.usage_description}"
                                  </p>
                                  <p className="text-xs text-gray-400 mt-6 font-bold uppercase">Estimated wait time: &lt; 24 Hours</p>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-8">
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Secret API Key</label>
                                  <div className="flex gap-2 items-center">
                                      <div className="flex-1 bg-gray-50 border border-gray-200 p-4 flex justify-between items-center font-mono text-sm rounded-sm">
                                          <span className="text-gray-800 font-bold break-all">
                                              {showApiKey ? user.apiKey : '••••••••••••••••••••••••••••••••••••••••'}
                                          </span>
                                          <button onClick={() => setShowApiKey(!showApiKey)} className="ml-4 text-gray-400 hover:text-black transition-colors shrink-0">
                                              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                          </button>
                                      </div>
                                      <button 
                                          onClick={handleCopyKey}
                                          className="bg-white border border-gray-200 hover:border-[#ff4d00] p-4 text-gray-600 hover:text-[#ff4d00] transition-all rounded-sm shadow-sm" title="Copy Key"
                                      >
                                          <Copy size={18} />
                                      </button>
                                      <button 
                                          onClick={handleRegenerateKey}
                                          className="bg-white border border-gray-200 hover:border-red-500 p-4 text-gray-600 hover:text-red-500 transition-all rounded-sm shadow-sm" title="Regenerate Key"
                                      >
                                          <RefreshCw size={18} />
                                      </button>
                                  </div>
                                  <p className="text-[10px] text-red-500 font-bold uppercase mt-3 flex items-center gap-1">
                                      <ShieldCheck size={12} /> Never share your API key. Anyone with access can use your credits.
                                  </p>
                              </div>

                              <div className="pt-8 border-t border-gray-100">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                                      <FileCode size={16} className="text-[#ff4d00]" /> API Resources
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <a href="/api-docs" target="_blank" className="p-6 bg-gray-50 border border-gray-200 hover:border-[#ff4d00] transition-colors group">
                                          <div className="text-sm font-bold text-gray-900 group-hover:text-[#ff4d00]">Swagger Documentation</div>
                                          <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">OpenAPI v3 Spec</p>
                                      </a>
                                      <div className="p-6 bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed">
                                          <div className="text-sm font-bold text-gray-900">Python SDK</div>
                                          <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Coming Soon</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-green-600" /> Security Tips
                  </h3>
                  <ul className="space-y-4">
                      <li className="text-xs text-gray-500 leading-relaxed flex gap-3">
                          <span className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full shrink-0 mt-1"></span>
                          Rotate your key immediately if you suspect it has been compromised.
                      </li>
                      <li className="text-xs text-gray-500 leading-relaxed flex gap-3">
                          <span className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full shrink-0 mt-1"></span>
                          Use environment variables to store your key in your server-side code.
                      </li>
                      <li className="text-xs text-gray-500 leading-relaxed flex gap-3">
                          <span className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full shrink-0 mt-1"></span>
                          Avoid committing your API key to public git repositories.
                      </li>
                  </ul>
              </div>

              <div className="bg-gradient-to-br from-[#111] to-black text-white p-8 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <Terminal size={120} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#ff4d00] mb-4">Support</h3>
                  <p className="text-sm font-medium leading-relaxed relative z-10">
                      Having trouble with integration? Our engineers are here to help.
                  </p>
                  <button className="mt-6 text-[10px] font-black uppercase tracking-widest border-b-2 border-[#ff4d00] pb-1 hover:text-[#ff4d00] transition-colors relative z-10">
                      Open API Ticket
                  </button>
              </div>
          </div>
      </div>

      {/* API Application Modal */}
      {showApiModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200 overflow-hidden rounded-sm">
                  <div className="bg-black p-6 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <Terminal className="text-[#ff4d00]" size={20} />
                          <h3 className="text-sm font-black uppercase tracking-widest">API Access Application</h3>
                      </div>
                      <button onClick={() => setShowApiModal(false)} className="text-gray-400 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="bg-orange-50 border-l-4 border-[#ff4d00] p-4 text-[11px] text-orange-800 font-medium">
                          To protect our infrastructure and maintain high quality for all users, API access requires a manual review.
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">What is your intended use case for the API?</label>
                          <textarea 
                              value={apiUsage}
                              onChange={(e) => setApiUsage(e.target.value)}
                              placeholder="I want to integrate traffic management into my custom dashboard..."
                              className="w-full bg-gray-50 border border-gray-200 p-4 text-sm outline-none focus:border-[#ff4d00] h-32 resize-none font-medium"
                          />
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Which websites will you be sending traffic to?</label>
                          <textarea 
                              value={apiWebsites}
                              onChange={(e) => setApiWebsites(e.target.value)}
                              placeholder="example.com, myblog.net, shopify-store.com"
                              className="w-full bg-gray-50 border border-gray-200 p-4 text-sm outline-none focus:border-[#ff4d00] h-24 resize-none font-medium"
                          />
                      </div>

                      <button 
                          onClick={handleApiSubmit}
                          disabled={isSubmittingApi}
                          className="w-full bg-[#ff4d00] text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                          {isSubmittingApi ? <RefreshCw size={16} className="animate-spin" /> : 'Submit Application'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DeveloperSettings;
