import React, { useState, useEffect } from 'react';
import { getStats, startTraffic, stopTraffic, testUrl } from './api';

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
  const [mode, setMode] = useState('direct_hit');
  const [stats, setStats] = useState({ visit_stats: {}, hit_stats: {} });
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTarget, setExpandedTarget] = useState(null);

  // Advanced Settings
  const [returningVisitorPct, setReturningVisitorPct] = useState(20);
  const [bounceRatePct, setBounceRatePct] = useState(30);
  const [referrer, setReferrer] = useState('https://www.google.com');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getStats();
        setStats({
          visit_stats: data.visit_stats || {},
          hit_stats: data.hit_stats || {}
        });
        setIsRunning(data.is_running);
      } catch (err) { }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

      await startTraffic(cleanedTargets, visitorsPerMin, durationMins, mode, returningVisitorPct, bounceRatePct, referrer);
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

      <div className="controls">
        <div className="input-group">
          <label>Visitors / Minute</label>
          <input
            type="number"
            value={visitorsPerMin}
            onChange={(e) => setVisitorsPerMin(parseInt(e.target.value) || 0)}
            disabled={isRunning}
          />
        </div>
        <div className="input-group">
          <label>Duration (Minutes)</label>
          <input
            type="number"
            value={durationMins}
            onChange={(e) => setDurationMins(parseInt(e.target.value) || 0)}
            disabled={isRunning}
          />
        </div>
      </div>

      <div className="input-group">
        <label>Simulation Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="select-input" disabled={isRunning}>
          <option value="direct_hit">Direct Hit Emulation (High Performance GA Hits)</option>
          <option value="visit">Full Page Browser Simulation (Realistic HTTP Visits)</option>
        </select>
      </div>

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
        <div className="input-group">
          <label>Traffic Source (Referrer)</label>
          <input
            type="text"
            placeholder="https://www.google.com"
            value={referrer}
            onChange={(e) => setReferrer(e.target.value)}
            disabled={isRunning}
          />
        </div>
      </div>

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
    </div>
  );
}

export default App;
