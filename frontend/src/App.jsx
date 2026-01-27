import React, { useState, useEffect } from 'react';
import {
  getProxies, createProxy, deleteProxy,
  findTid, bulkCreateProxies, testProxy, addGeonodeProxies,
  getStats, getProjects, createProject, deleteProject,
  startTraffic, stopTraffic, testUrl, getGeonodeTargetingOptions, getProjectLogs
} from './api';

const WorldMap = () => (
  <svg viewBox="0 0 1000 500" className="world-map">
    <path fill="rgba(255,255,255,0.05)" d="M150,150 L850,150 L850,400 L150,400 Z" /> {/* Simplified land mass replacement or similar */}
    <circle cx="200" cy="200" r="3" fill="var(--primary)"><animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" /></circle>
    <circle cx="500" cy="180" r="3" fill="var(--primary)"><animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" /></circle>
    <circle cx="800" cy="300" r="3" fill="var(--primary)"><animate attributeName="r" values="3;6;3" dur="1.8s" repeatCount="indefinite" /></circle>
    <circle cx="300" cy="350" r="3" fill="var(--primary)"><animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite" /></circle>
    <text x="10" y="490" fill="rgba(255,255,255,0.3)" fontSize="10">LIVE GLOBAL POPS: US EAST, EU WEST, ASIA SOUTH, AU CENTRAL</text>
  </svg>
);

function App() {
  const [targets, setTargets] = useState([{
    url: 'https://ladiscussione.com',
    title: 'La Discussione - Home',
    tid: 'G-C5LL2KW5H4',
    status: 'idle',
    funnel: [
      {
        url: 'https://ladiscussione.com/285543/societa/regioni/liguria-toti-maxi-emendamento-su-piano-sociosanitario-era-necessario/',
        title: 'Liguria-Toti Maxi Emendamento'
      },
      {
        url: 'https://ladiscussione.com/285511/esteri/schiarite-sul-virus-che-provoca-una-misteriosa-malattia-respiratoria-nei-cani/',
        title: 'Schiarite sul virus'
      }
    ]
  }]);
  const [visitorsPerMin, setVisitorsPerMin] = useState(100);
  const [durationMins, setDurationMins] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(1000);
  const [controlMode, setControlMode] = useState('duration'); // 'duration' | 'volume'
  const [mode, setMode] = useState('direct_hit');
  const [stats, setStats] = useState({ visit_stats: {}, hit_stats: {} });
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTarget, setExpandedTarget] = useState(null);

  // Advanced Settings
  const [returningVisitorPct, setReturningVisitorPct] = useState(20);
  const [bounceRatePct, setBounceRatePct] = useState(30);
  const [referrer, setReferrer] = useState('https://www.google.com');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeHoursStart, setActiveHoursStart] = useState(0);
  const [activeHoursEnd, setActiveHoursEnd] = useState(23);

  const [targetCountry, setTargetCountry] = useState('');
  const [targetState, setTargetState] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [geonodeOptions, setGeonodeOptions] = useState(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [activeTab, setActiveTab] = useState('traffic'); // 'traffic', 'geo', 'advanced'

  const [sourcePreset, setSourcePreset] = useState('direct');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [distDesktop, setDistDesktop] = useState(70);
  const [distMobile, setDistMobile] = useState(25);
  const [distTablet, setDistTablet] = useState(5);

  const [enableCircadian, setEnableCircadian] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(0);

  const [isDryRun, setIsDryRun] = useState(false);
  const [tier, setTier] = useState('professional');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [proxies, setProxies] = useState([]);
  const [newProxyUrl, setNewProxyUrl] = useState('');
  const [newProxyCountry, setNewProxyCountry] = useState('');
  const [bulkProxyText, setBulkProxyText] = useState('');
  const [proxyTestResults, setProxyTestResults] = useState({}); // {id: 'testing' | 'success' | 'error'}
  const [showBulkAdd, setShowBulkAdd] = useState('simple'); // 'simple' | 'bulk' | 'geonode'

  const [geonodeUser, setGeonodeUser] = useState('geonode_d0HRbZWDCV');
  const [geonodePass, setGeonodePass] = useState('92a8dcc4-52fe-445d-989c-5158a5f5ca09');
  const [geonodeCountries, setGeonodeCountries] = useState('US,GB,DE,FR,IT,ES,CA,AU');

  const [recentEvents, setRecentEvents] = useState([]);
  const [projectLogs, setProjectLogs] = useState([]);

  useEffect(() => {
    loadProjects();
    loadProxies();
    const interval = setInterval(async () => {
      try {
        const data = await getStats();
        setStats({
          visit_stats: data.visit_stats || {},
          hit_stats: data.hit_stats || {}
        });
        setIsRunning(data.is_running);
        setRecentEvents(data.recent_events || []);

        // Refresh project list to get updated hits_today
        loadProjects();

        // If a project is selected, refresh its logs
        if (selectedProjectId) {
          const logs = await getProjectLogs(selectedProjectId);
          setProjectLogs(logs);
        }
      } catch (err) { }
    }, 2000); // 2s refresh is enough
    return () => clearInterval(interval);
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) { }
  };

  const loadProxies = async () => {
    try {
      const data = await getProxies();
      setProxies(data);
    } catch (err) { }
  };

  const handleAddProxy = async () => {
    if (!newProxyUrl) return;
    try {
      await createProxy({ url: newProxyUrl, country: newProxyCountry });
      setNewProxyUrl('');
      setNewProxyCountry('');
      loadProxies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProxy = async (id) => {
    try {
      await deleteProxy(id);
      loadProxies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkAddProxies = async () => {
    const proxyList = bulkProxyText.split('\n').map(p => p.trim()).filter(p => p !== '');
    if (proxyList.length === 0) return;
    try {
      await bulkCreateProxies(proxyList);
      setBulkProxyText('');
      setShowBulkAdd(false);
      loadProxies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestProxy = async (id) => {
    setProxyTestResults(prev => ({ ...prev, [id]: 'testing' }));
    try {
      const res = await testProxy(id);
      setProxyTestResults(prev => ({ ...prev, [id]: res.reachable ? 'success' : 'error' }));
    } catch (err) {
      setProxyTestResults(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleGeonodeIntegration = async () => {
    const countries = geonodeCountries.split(',').map(c => c.trim()).filter(c => c !== '');
    try {
      await addGeonodeProxies(geonodeUser, geonodePass, countries);
      setShowBulkAdd('simple');
      loadProxies();
      alert("Geonode Residential Gateways added!");
    } catch (err) {
      setError(err.message);
    }
  };

  const loadGeonodeOptions = async () => {
    setIsLoadingGeo(true);
    try {
      const data = await getGeonodeTargetingOptions(geonodeUser, geonodePass);
      setGeonodeOptions(data.countries || []);
    } catch (err) {
      setError("Failed to fetch Geonode options: " + err.message);
    } finally {
      setIsLoadingGeo(false);
    }
  };

  const handleSaveProject = async () => {
    try {
      const name = prompt("Enter project name:");
      if (!name) return;

      const projectData = {
        name,
        visitors_per_min: visitorsPerMin,
        mode,
        returning_visitor_pct: returningVisitorPct,
        bounce_rate_pct: bounceRatePct,
        referrer,
        start_date: startDate || null,
        end_date: endDate || null,
        active_hours_start: activeHoursStart,
        active_hours_end: activeHoursEnd,
        enable_circadian_rhythm: enableCircadian,
        daily_visitor_limit: dailyLimit || null,
        is_dry_run: isDryRun,
        tier: tier,
        target_country: targetCountry || null,
        target_state: targetState || null,
        target_city: targetCity || null,
        traffic_source_preset: sourcePreset,
        utm_tags: {
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign
        },
        device_distribution: {
          desktop: distDesktop,
          mobile: distMobile,
          tablet: distTablet
        },
        targets: targets.map(t => ({
          url: t.url,
          title: t.title,
          tid: t.tid,
          funnel: t.funnel
        }))
      };

      await createProject(projectData);
      loadProjects();
      alert("Project saved successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  const loadProjectData = (project) => {
    setTargets(project.targets.map(t => ({
      ...t,
      status: 'idle',
      funnel: t.funnel_steps || []
    })));
    setVisitorsPerMin(project.visitors_per_min);
    setMode(project.mode);
    setReturningVisitorPct(project.returning_visitor_pct);
    setBounceRatePct(project.bounce_rate_pct);
    setReferrer(project.referrer);
    setStartDate(project.start_date ? project.start_date.split('T')[0] : '');
    setEndDate(project.end_date ? project.end_date.split('T')[0] : '');
    setActiveHoursStart(project.active_hours_start || 0);
    setActiveHoursEnd(project.active_hours_end || 23);
    setEnableCircadian(project.enable_circadian_rhythm || false);
    setDailyLimit(project.daily_visitor_limit || 0);
    setIsDryRun(project.is_dry_run || false);
    setTier(project.tier || 'professional');
    setTargetCountry(project.target_country || '');
    setTargetState(project.target_state || '');
    setTargetCity(project.target_city || '');
    setSourcePreset(project.traffic_source_preset || 'direct');
    const utm = project.utm_tags || {};
    setUtmSource(utm.source || '');
    setUtmMedium(utm.medium || '');
    setUtmCampaign(utm.campaign || '');
    const dist = project.device_distribution || { desktop: 70, mobile: 25, tablet: 5 };
    setDistDesktop(dist.desktop);
    setDistMobile(dist.mobile);
    setDistTablet(dist.tablet);
    setSelectedProjectId(project.id);
  };

  const handleStart = async () => {
    setError(null);
    try {
      // Clean up inputs and only send fields defined in backend models
      const cleanedTargets = targets.map(t => ({
        url: t.url,
        title: t.title,
        tid: t.tid,
        funnel: (t.funnel || [])
          .filter(f => f.url && f.url.trim() !== '')
          .map(f => ({ url: f.url, title: f.title }))
      }));

      await startTraffic(
        cleanedTargets,
        visitorsPerMin,
        controlMode === 'duration' ? durationMins : 1, // Pass dummy duration if volume mode
        mode,
        returningVisitorPct,
        bounceRatePct,
        referrer,
        sourcePreset,
        { source: utmSource, medium: utmMedium, campaign: utmCampaign },
        { desktop: distDesktop, mobile: distMobile, tablet: distTablet },
        targetCountry,
        targetState,
        targetCity,
        isDryRun,
        controlMode === 'volume' ? totalVisitors : null
      );
    } catch (err) {
      // Better error handling for object-based errors
      setError(typeof err.message === 'object' ? JSON.stringify(err.message) : err.message);
    }
  };

  const handleStop = async () => {
    try {
      await stopTraffic();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTest = async (index, urlOverride) => {
    const target = targets[index];
    const url = urlOverride || target.url;
    if (!url) return;

    // For simplicity, only main URL shows status on the icon
    if (!urlOverride) updateTarget(index, 'status', 'testing');

    try {
      const result = await testUrl(url);
      if (!urlOverride) updateTarget(index, 'status', result.reachable ? 'success' : 'error');
      else if (!result.reachable) alert(`URL ${url} is not reachable!`);
    } catch (err) {
      if (!urlOverride) updateTarget(index, 'status', 'error');
    }
  };

  const handleFindTid = async (index) => {
    const target = targets[index];
    if (!target.url) return;

    updateTarget(index, 'status', 'testing');
    try {
      const result = await findTid(target.url);
      updateTarget(index, 'tid', result.tid);
      updateTarget(index, 'status', 'success');

      // Also fetch title while we are at it
      const testRes = await testUrl(target.url);
      if (testRes.reachable) {
        // The backend prefetch_titles already caches it, but we can reflect it in UI if we want
        // or just let the backend handle it as we implemented.
      }
    } catch (err) {
      updateTarget(index, 'status', 'error');
      alert(err.message);
    }
  };

  const addTarget = () => setTargets([...targets, { url: '', title: '', tid: '', status: 'idle', funnel: [] }]);
  const removeTarget = (index) => setTargets(targets.filter((_, i) => i !== index));
  const updateTarget = (index, field, value) => {
    const newTargets = [...targets];
    newTargets[index][field] = value;
    setTargets(newTargets);
  };

  const updateFunnel = (targetIndex, funnelIndex, field, value) => {
    const newTargets = [...targets];
    if (funnelIndex === -1) {
      newTargets[targetIndex].funnel = [...(newTargets[targetIndex].funnel || []), { url: '', title: '' }];
    } else if (value === null) {
      newTargets[targetIndex].funnel.splice(funnelIndex, 1);
    } else {
      newTargets[targetIndex].funnel[funnelIndex][field] = value;
    }
    setTargets(newTargets);
  };

  const getTargetStats = (url) => {
    const vStats = stats.visit_stats[url] || { total: 0, success: 0, failure: 0 };
    const hStats = stats.hit_stats[url] || { total: 0, success: 0, failure: 0 };
    return {
      total: vStats.total + hStats.total,
      success: vStats.success + hStats.success,
      failure: vStats.failure + hStats.failure
    };
  };

  const aggregateStats = () => {
    let total = 0, success = 0, failure = 0;
    Object.values(stats.visit_stats).forEach(s => {
      total += s.total; success += s.success; failure += s.failure;
    });
    Object.values(stats.hit_stats).forEach(s => {
      total += s.total; success += s.success; failure += s.failure;
    });
    return { total, success, failure };
  };

  const totalStats = aggregateStats();

  return (
    <div className="dashboard">
      <h1>TrafficGen Pro</h1>
      <p className="subtitle">High-scale GA Hit Emulator & Visitor Generator</p>

      <div className="status-indicator">
        <div className={`dot ${isRunning ? 'dot-active' : 'dot-idle'}`}></div>
        <span>{isRunning ? 'Simulation Active' : 'System Idle'}</span>
      </div>

      <div className="section projects-section">
        <div className="section-header">
          <h3>Saved Projects</h3>
          <button className="btn-small" onClick={handleSaveProject} disabled={isRunning}>Save Current as Project</button>
        </div>
        <div className="projects-grid">
          {projects.map(p => {
            const hasLimit = p.daily_visitor_limit > 0;
            const progress = hasLimit ? (p.hits_today / p.daily_visitor_limit) * 100 : 0;
            return (
              <div key={p.id} className={`project-card ${selectedProjectId === p.id ? 'active' : ''}`} onClick={() => loadProjectData(p)}>
                <div className="project-title">{p.name}</div>
                <div className="project-meta">
                  {p.targets.length} targets • {p.visitors_per_min} vpm
                </div>
                <div className="project-progress-container">
                  <div className="progress-labels">
                    <span>{p.hits_today} hits today</span>
                    {hasLimit && <span>limit {p.daily_visitor_limit}</span>}
                  </div>
                  {hasLimit && (
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, progress)}%` }}></div>
                    </div>
                  )}
                </div>
                <button
                  className="btn-delete-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(p.id).then(loadProjects);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          {projects.length === 0 && <p className="empty-msg">No saved projects yet.</p>}
        </div>
      </div>

      <div className="section proxies-section">
        <div className="section-header">
          <h3>Proxy Management</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`btn-mini ${showBulkAdd === 'bulk' ? 'active' : ''}`} onClick={() => setShowBulkAdd(showBulkAdd === 'bulk' ? 'simple' : 'bulk')}>
              Bulk Paste
            </button>
            <button className={`btn-mini ${showBulkAdd === 'geonode' ? 'active' : ''}`} onClick={() => setShowBulkAdd(showBulkAdd === 'geonode' ? 'simple' : 'geonode')}>
              Geonode Auto
            </button>
            <span className="badge">{proxies.length} active</span>
          </div>
        </div>

        {showBulkAdd === 'bulk' && (
          <div className="bulk-proxy-add">
            <textarea
              placeholder="Paste one proxy per line (e.g. http://user:pass@host:port)"
              value={bulkProxyText}
              onChange={(e) => setBulkProxyText(e.target.value)}
              rows={5}
              className="bulk-textarea"
            />
            <button className="btn-small" onClick={handleBulkAddProxies} disabled={isRunning || !bulkProxyText}>
              Import Proxies
            </button>
          </div>
        )}

        {showBulkAdd === 'geonode' && (
          <div className="geonode-integration">
            <div className="controls">
              <input placeholder="Geonode Username" value={geonodeUser} onChange={(e) => setGeonodeUser(e.target.value)} />
              <input type="password" placeholder="Geonode Password" value={geonodePass} onChange={(e) => setGeonodePass(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Target Countries (Comma separated ISO codes)</label>
              <input placeholder="US,GB,DE,FR,IT..." value={geonodeCountries} onChange={(e) => setGeonodeCountries(e.target.value)} />
              <p className="empty-msg">System will generate residential rotating gateways for each country.</p>
            </div>
            <button className="btn-small" onClick={handleGeonodeIntegration} disabled={isRunning || !geonodeUser || !geonodePass}>
              Connect & Generate Gateways
            </button>
          </div>
        )}

        {showBulkAdd === 'simple' && (
          <div className="proxy-actions">
            <input
              placeholder="http://user:pass@host:port"
              value={newProxyUrl}
              onChange={(e) => setNewProxyUrl(e.target.value)}
              disabled={isRunning}
              style={{ flex: 3 }}
            />
            <input
              placeholder="Country (US, IT...)"
              value={newProxyCountry}
              onChange={(e) => setNewProxyCountry(e.target.value)}
              disabled={isRunning}
              style={{ flex: 1 }}
            />
            <button className="btn-small" onClick={handleAddProxy} disabled={isRunning || !newProxyUrl}>Add Proxy</button>
          </div>
        )}

        <div className="proxy-list">
          {proxies.map(p => {
            const testStatus = proxyTestResults[p.id];
            return (
              <div key={p.id} className="proxy-item">
                <span className="proxy-url">{p.url} {p.country && <span className="proxy-geo">({p.country})</span>}</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className={`btn-mini-test ${testStatus}`}
                    onClick={() => handleTestProxy(p.id)}
                    disabled={isRunning || testStatus === 'testing'}
                  >
                    {testStatus === 'testing' ? '⌛' : testStatus === 'success' ? '✅' : testStatus === 'error' ? '❌' : 'Test'}
                  </button>
                  <button className="btn-mini-remove" onClick={() => handleDeleteProxy(p.id)} disabled={isRunning}>×</button>
                </div>
              </div>
            );
          })}
          {proxies.length === 0 && <p className="empty-msg">No proxies added. System will use direct connection.</p>}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="section">
        <div className="section-header">
          <h3>Target Websites & Funnels</h3>
          <button className="btn-small" onClick={addTarget} disabled={isRunning}>+ Add Site</button>
        </div>
        {targets.map((target, index) => {
          const tStats = getTargetStats(target.url);
          const isExpanded = expandedTarget === index;
          return (
            <div key={index} className={`target-container ${isExpanded ? 'expanded' : ''}`}>
              <div className="target-row">
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="URL (Start Page)"
                    style={{ flex: 2 }}
                    value={target.url}
                    onChange={(e) => updateTarget(index, 'url', e.target.value)}
                    disabled={isRunning}
                  />
                  <input
                    placeholder="Page Title"
                    style={{ flex: 1 }}
                    value={target.title}
                    onChange={(e) => updateTarget(index, 'title', e.target.value)}
                    disabled={isRunning}
                  />
                </div>
                <input
                  placeholder="G-XXXXXX"
                  style={{ width: '120px' }}
                  value={target.tid}
                  onChange={(e) => updateTarget(index, 'tid', e.target.value)}
                  disabled={isRunning}
                />
                <button
                  className={`btn-icon ${target.status}`}
                  onClick={() => handleTest(index)}
                  disabled={isRunning || !target.url || target.status === 'testing'}
                  title="Test Start Page"
                >
                  {target.status === 'testing' ? '⌛' : target.status === 'success' ? '✅' : target.status === 'error' ? '❌' : '🔍'}
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleFindTid(index)}
                  disabled={isRunning || !target.url}
                  title="Auto-Find GA4 Tracking ID"
                >
                  📡
                </button>
                <button
                  className={`btn-icon ${isExpanded ? 'active' : ''}`}
                  onClick={() => setExpandedTarget(isExpanded ? null : index)}
                  title="View Funnel Steps"
                >
                  {isExpanded ? '🔼' : '🔽'}
                </button>
                {targets.length > 1 && (
                  <button className="btn-remove" onClick={() => removeTarget(index)} disabled={isRunning}>×</button>
                )}
              </div>

              {isExpanded && (
                <div className="funnel-steps">
                  <div className="funnel-header">
                    <span>Navigation Funnel Steps</span>
                    <button className="btn-link" onClick={() => updateFunnel(index, -1, 'url', '')} disabled={isRunning}>+ Add Step</button>
                  </div>
                  {(target.funnel || []).map((step, fIndex) => (
                    <div key={fIndex} className="funnel-row">
                      <span className="step-num">{fIndex + 2}</span>
                      <input
                        placeholder="URL"
                        style={{ flex: 2 }}
                        value={step.url}
                        onChange={(e) => updateFunnel(index, fIndex, 'url', e.target.value)}
                        disabled={isRunning}
                      />
                      <input
                        placeholder="Step Title"
                        style={{ flex: 1 }}
                        value={step.title}
                        onChange={(e) => updateFunnel(index, fIndex, 'title', e.target.value)}
                        disabled={isRunning}
                      />
                      <button className="btn-mini-remove" onClick={() => updateFunnel(index, fIndex, null, null)} disabled={isRunning}>×</button>
                    </div>
                  ))}
                  {(!target.funnel || target.funnel.length === 0) && <p className="empty-msg">No funnel steps defined. Visitor will explore randomly.</p>}
                </div>
              )}

              {tStats.total > 0 && (
                <div className="target-mini-stats">
                  <span>Hits: {tStats.total}</span>
                  <span style={{ color: 'var(--success)' }}>OK: {tStats.success}</span>
                  <span style={{ color: 'var(--error)' }}>Fail: {tStats.failure}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'traffic' ? 'active' : ''}`} onClick={() => setActiveTab('traffic')}>Traffic Control</button>
        <button className={`tab-btn ${activeTab === 'geo' ? 'active' : ''}`} onClick={() => setActiveTab('geo')}>Geo Targeting</button>
        <button className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced Settings</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Traffic History (Database)</button>
      </div>

      {activeTab === 'traffic' && (
        <>
          <div className="section">
            <div className="section-header">
              <h3>Traffic Control</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`btn-mini ${controlMode === 'duration' ? 'active' : ''}`} onClick={() => setControlMode('duration')} disabled={isRunning}>Duration Mode</button>
                <button className={`btn-mini ${controlMode === 'volume' ? 'active' : ''}`} onClick={() => setControlMode('volume')} disabled={isRunning}>Volume Mode</button>
              </div>
            </div>

            <div className="controls">
              <div className="input-group">
                <label>Arrival Rate (Visitors/Min)</label>
                <input
                  type="number"
                  value={visitorsPerMin}
                  onChange={(e) => setVisitorsPerMin(parseInt(e.target.value) || 0)}
                  disabled={isRunning}
                />
              </div>

              {controlMode === 'duration' ? (
                <div className="input-group">
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMins}
                    onChange={(e) => setDurationMins(parseInt(e.target.value) || 0)}
                    disabled={isRunning}
                  />
                  <div className="help-text" style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Total ≈ {visitorsPerMin * durationMins} visitors</div>
                </div>
              ) : (
                <div className="input-group">
                  <label>Total Visitors (Exact Count)</label>
                  <input
                    type="number"
                    value={totalVisitors}
                    onChange={(e) => setTotalVisitors(parseInt(e.target.value) || 0)}
                    disabled={isRunning}
                  />
                  <div className="help-text" style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Est. Duration ≈ {(totalVisitors / (visitorsPerMin || 1)).toFixed(1)} mins</div>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>Simulation Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="select-input" disabled={isRunning}>
              <option value="direct_hit">Direct Hit Emulation (High Performance GA Hits)</option>
              <option value="visit">Full Page Browser Simulation (Realistic HTTP Visits)</option>
            </select>
          </div>
        </>
      )}

      {activeTab === 'geo' && (
        <div className="section geo-targeting-panel">
          <div className="section-header">
            <h3>Geonode Targeting Options</h3>
            <button className="btn-mini" onClick={loadGeonodeOptions} disabled={isLoadingGeo || !geonodeUser}>
              {isLoadingGeo ? 'Fetching...' : 'Fetch Available Options'}
              {isLoadingGeo && <span className="loading-spinner"></span>}
            </button>
          </div>

          {!geonodeOptions && !isLoadingGeo && (
            <div className="empty-msg" style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <p>Connect your Geonode account in the "Proxy Management" section (Geonode Auto button) to see real-time targeting options like cities and states.</p>
              <p style={{ fontSize: '0.7rem', marginTop: '8px', opacity: 0.7 }}>Tip: Professional tier is required for city-level precision.</p>
            </div>
          )}

          {geonodeOptions && (
            <div className="advanced-settings" style={{ borderStyle: 'solid' }}>
              <div className="controls">
                <div className="input-group">
                  <label>Country Selector</label>
                  <select
                    className="select-input"
                    value={targetCountry}
                    onChange={(e) => {
                      setTargetCountry(e.target.value);
                      setTargetState('');
                      setTargetCity('');
                    }}
                  >
                    <option value="">Global (No specific targeting)</option>
                    {geonodeOptions.map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                {targetCountry && geonodeOptions.find(c => c.code === targetCountry)?.states?.length > 0 && (
                  <div className="input-group">
                    <label>State / Region</label>
                    <select
                      className="select-input"
                      value={targetState}
                      onChange={(e) => {
                        setTargetState(e.target.value);
                        setTargetCity('');
                      }}
                    >
                      <option value="">All States</option>
                      {geonodeOptions.find(c => c.code === targetCountry)?.states?.map(s => (
                        <option key={s.code} value={s.code}>{s.name || s.code}</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetCountry && (
                  <div className="input-group">
                    <label>City Targeting</label>
                    <select
                      className="select-input"
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                    >
                      <option value="">All Cities</option>
                      {(geonodeOptions.find(c => c.code === targetCountry)?.cities || [])
                        .filter(city => !targetState || city.state_code === targetState)
                        .map(city => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="help-text" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '10px' }}>
                <strong>Active Targeting:</strong> {targetCountry || 'Global'} {targetState && `> ${targetState}`} {targetCity && `> ${targetCity}`}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="section advanced-settings">
          <div className="section-header">
            <h3>Advanced Emulation Settings</h3>
          </div>
          <div className="controls">
            <div className="input-group">
              <label>Returning Visitors %</label>
              <input
                type="number" min="0" max="100"
                value={returningVisitorPct}
                onChange={(e) => setReturningVisitorPct(parseInt(e.target.value) || 0)}
                disabled={isRunning}
              />
            </div>
            <div className="input-group">
              <label>Bounce Rate %</label>
              <input
                type="number" min="0" max="100"
                value={bounceRatePct}
                onChange={(e) => setBounceRatePct(parseInt(e.target.value) || 0)}
                disabled={isRunning}
              />
            </div>
          </div>
          <div className="section-header" style={{ marginTop: '20px' }}>
            <h3>Targeting & Sources</h3>
          </div>
          <div className="controls">
            <div className="input-group">
              <label>Target Country (ISO-2 Code)</label>
              <input placeholder="US, IT, FR, DE..." value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)} disabled={isRunning} />
            </div>
            <div className="input-group">
              <label>Traffic Preset</label>
              <select
                value={sourcePreset}
                onChange={(e) => setSourcePreset(e.target.value)}
                className="select-input"
                disabled={isRunning}
              >
                <option value="direct">Direct Traffic</option>
                <option value="organic">Organic Search</option>
                <option value="social">Social Media</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Traffic Source (Referrer)</label>
            <input
              type="text"
              placeholder="Custom Referrer (if direct)"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              disabled={isRunning || sourcePreset !== 'direct'}
            />
          </div>

          <div className="section-header" style={{ marginTop: '20px' }}>
            <h3>Scheduling & Operating Hours</h3>
          </div>
          <div className="controls">
            <div className="input-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isRunning} />
            </div>
            <div className="input-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isRunning} />
            </div>
          </div>
          <div className="controls">
            <div className="input-group">
              <label>Active From (Hour 0-23)</label>
              <input type="number" min="0" max="23" value={activeHoursStart} onChange={(e) => setActiveHoursStart(parseInt(e.target.value) || 0)} disabled={isRunning} />
            </div>
            <div className="input-group">
              <label>Active Until (Hour 0-23)</label>
              <input type="number" min="0" max="23" value={activeHoursEnd} onChange={(e) => setActiveHoursEnd(parseInt(e.target.value) || 0)} disabled={isRunning} />
            </div>
          </div>
          <div className="controls">
            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={enableCircadian} onChange={(e) => setEnableCircadian(e.target.checked)} disabled={isRunning} id="circadian-check" />
              <label htmlFor="circadian-check" style={{ marginBottom: 0 }}>Enable Circadian Rhythm (Sinusoidal Volume)</label>
            </div>
            <div className="input-group">
              <label>Daily Visitor Limit (0 = Unlimited)</label>
              <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)} disabled={isRunning} />
            </div>
          </div>

          <div className="controls">
            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={isDryRun} onChange={(e) => setIsDryRun(e.target.checked)} disabled={isRunning} id="sandbox-check" />
              <label htmlFor="sandbox-check" style={{ marginBottom: 0, color: 'var(--primary)' }}>Enable Sandbox Mode (Dry Run - No Tracking Hits)</label>
            </div>
            <div className="input-group">
              <label>Account Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} disabled={isRunning} className="select-input">
                <option value="economy">Economy (Basic Stealth)</option>
                <option value="professional">Professional (Deep Stealth + Advanced Targeting)</option>
              </select>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: '20px' }}>
            <h3>UTM Tag Builder</h3>
          </div>
          <div className="controls">
            <div className="input-group">
              <label>UTM Source</label>
              <input placeholder="google, newsletter..." value={utmSource} onChange={(e) => setUtmSource(e.target.value)} disabled={isRunning} />
            </div>
            <div className="input-group">
              <label>UTM Medium</label>
              <input placeholder="cpc, email, social..." value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} disabled={isRunning} />
            </div>
          </div>
          <div className="input-group">
            <label>UTM Campaign</label>
            <input placeholder="summer_sale, promo_1..." value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} disabled={isRunning} />
          </div>

          <div className="section-header" style={{ marginTop: '20px' }}>
            <h3>Device Distribution (%)</h3>
          </div>
          <div className="controls" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="input-group">
              <label>Desktop</label>
              <input type="number" value={distDesktop} onChange={(e) => setDistDesktop(parseInt(e.target.value) || 0)} disabled={isRunning} />
            </div>
            <div className="input-group">
              <label>Mobile</label>
              <input type="number" value={distMobile} onChange={(e) => setDistMobile(parseInt(e.target.value) || 0)} disabled={isRunning} />
            </div>
            <div className="input-group">
              <label>Tablet</label>
              <input type="number" value={distTablet} onChange={(e) => setDistTablet(parseInt(e.target.value) || 0)} disabled={isRunning} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="section history-panel">
          <div className="section-header">
            <h3>Detailed Traffic History (Database)</h3>
            <span className="badge">{projectLogs.length} recent entries</span>
          </div>
          {!selectedProjectId && (
            <p className="empty-msg">Select a project to view its traffic database history.</p>
          )}
          {selectedProjectId && projectLogs.length === 0 && (
            <p className="empty-msg">No history found for this project. Start a simulation to see database logs.</p>
          )}
          {selectedProjectId && projectLogs.length > 0 && (
            <div className="log-table-container">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>URL</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Proxy</th>
                  </tr>
                </thead>
                <tbody>
                  {projectLogs.map(log => (
                    <tr key={log.id}>
                      <td className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="log-url" title={log.url}>{log.url.length > 40 ? log.url.substring(0, 40) + '...' : log.url}</td>
                      <td className="log-event"><span className={`badge-event ${log.event_type}`}>{log.event_type}</span></td>
                      <td className="log-status"><span className={log.status}>{log.status === 'success' ? '✅' : '❌'}</span></td>
                      <td className="log-proxy">{log.proxy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="actions">
        {isRunning ? (
          <button className="btn btn-stop" onClick={handleStop}>Stop Simulation</button>
        ) : (
          <button className="btn btn-primary" onClick={handleStart} disabled={targets.some(t => !t.url)}>
            Start Simulation
          </button>
        )}
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-value">{totalStats.total}</span>
          <span className="stat-label">Total Hits</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--success)' }}>{totalStats.success}</span>
          <span className="stat-label">Successful</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--error)' }}>{totalStats.failure}</span>
          <span className="stat-label">Failed</span>
        </div>
      </div>

      <div className="section map-section">
        <div className="section-header">
          <h3>Global Traffic Distribution</h3>
          <span className="badge-live">LIVE MONITOR</span>
        </div>
        <WorldMap />
      </div>

      <div className="section activity-section">
        <div className="section-header">
          <h3>Live Activity Feed</h3>
          <div className="pulse-icon"></div>
        </div>
        <div className="activity-feed">
          {recentEvents.map((ev, i) => (
            <div key={i} className="activity-item">
              <div className="activity-time">{new Date(ev.timestamp).toLocaleTimeString()}</div>
              <div className="activity-details">
                <span className="activity-type">PA_VIEW</span>
                <span className="activity-url">{ev.url}</span>
                <span className="activity-title">"{ev.title}"</span>
              </div>
              <div className="activity-proxy">{ev.proxy}</div>
            </div>
          ))}
          {recentEvents.length === 0 && <p className="empty-msg">Waiting for events...</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
