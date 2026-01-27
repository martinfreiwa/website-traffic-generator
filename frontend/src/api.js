const API_BASE_URL = "http://localhost:8000";

export const findTid = async (url) => {
    const response = await fetch(`${API_BASE_URL}/find-tid?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to find Tracking ID');
    }
    return await response.json();
};

export const testUrl = async (url) => {
    const response = await fetch(`${API_BASE_URL}/test-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('Failed to test URL');
    return await response.json();
};

export const getStats = async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
};

export const startTraffic = async (targets, visitorsPerMin, durationMins, mode = "direct_hit", returningVisitorPct = 0, bounceRatePct = 0, referrer = "", sourcePreset = "direct", utmTags = null, deviceDist = null, targetCountry = null, targetState = null, targetCity = null, isDryRun = false, totalVisitorCount = null) => {
    const response = await fetch(`${API_BASE_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            targets,
            visitors_per_min: visitorsPerMin,
            duration_mins: durationMins,
            mode,
            returning_visitor_pct: returningVisitorPct,
            bounce_rate_pct: bounceRatePct,
            referrer,
            traffic_source_preset: sourcePreset,
            utm_tags: utmTags,
            device_distribution: deviceDist,
            target_country: targetCountry,
            target_state: targetState,
            target_city: targetCity,
            is_dry_run: isDryRun,
            total_visitor_count: totalVisitorCount
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start traffic");
    }
    return response.json();
};

export const stopTraffic = async () => {
    const response = await fetch(`${API_BASE_URL}/stop`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Failed to stop traffic");
    return response.json();
};

export const getProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
};

export const createProject = async (projectData) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
};

export const deleteProject = async (id) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
};

export const getProxies = async () => {
    const response = await fetch(`${API_BASE_URL}/proxies`);
    if (!response.ok) throw new Error("Failed to fetch proxies");
    return response.json();
};

export const createProxy = async (proxyData) => {
    const response = await fetch(`${API_BASE_URL}/proxies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyData)
    });
    if (!response.ok) throw new Error('Failed to create proxy');
    return response.json();
};

export const deleteProxy = async (id) => {
    const response = await fetch(`${API_BASE_URL}/proxies/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete proxy');
    return response.json();
};

export const bulkCreateProxies = async (proxies) => {
    const response = await fetch(`${API_BASE_URL}/proxies/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies })
    });
    if (!response.ok) throw new Error('Failed to add proxies in bulk');
    return response.json();
};

export const testProxy = async (id) => {
    const response = await fetch(`${API_BASE_URL}/proxies/${id}/test`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to test proxy');
    return response.json();
};

export const addGeonodeProxies = async (username, password, countries) => {
    const response = await fetch(`${API_BASE_URL}/proxies/geonode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, countries })
    });
    if (!response.ok) throw new Error('Failed to integrate Geonode');
    return response.json();
};

export const getGeonodeTargetingOptions = async (username, password) => {
    let url = `${API_BASE_URL}/geonode/targeting-options`;
    if (username && password) {
        url += `?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to fetch Geonode targeting options");
    }
    return response.json();
};

export const getProjectLogs = async (projectId, limit = 100) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/logs?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch project logs");
    return response.json();
};
