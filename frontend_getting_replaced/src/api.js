export const API_BASE_URL = "http://localhost:8000";

let authToken = localStorage.getItem('tgp_token');

export const setAuthToken = (token) => {
    authToken = token;
    if (token) localStorage.setItem('tgp_token', token);
    else localStorage.removeItem('tgp_token');
};

const fetchWithAuth = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        setAuthToken(null);
        window.dispatchEvent(new Event('auth-expired'));
    }
    return response;
};

// --- Auth Endpoints ---
export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });

    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
};

export const register = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Registration failed');
    return await response.json();
};

export const getMe = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
};

// --- Project & Traffic Endpoints ---
export const findTid = async (url) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/find-tid?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to find Tracking ID');
    }
    return await response.json();
};

export const testUrl = async (url) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/test-url`, {
        method: 'POST',
        body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('Failed to test URL');
    return await response.json();
};

export const getStats = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
};

export const startTraffic = async (targets, visitorsPerMin, durationMins, mode = "direct_hit", returningVisitorPct = 0, bounceRatePct = 0, referrer = "", sourcePreset = "direct", utmTags = null, deviceDist = null, targetCountry = null, targetState = null, targetCity = null, isDryRun = false, totalVisitorCount = null) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/start`, {
        method: "POST",
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
    const response = await fetchWithAuth(`${API_BASE_URL}/stop`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Failed to stop traffic");
    return response.json();
};

export const getProjects = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
};

export const createProject = async (projectData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/projects`, {
        method: 'POST',
        body: JSON.stringify(projectData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create project');
    }
    return response.json();
};

export const deleteProject = async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
};

export const getProjectDetails = async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) throw new Error('Failed to fetch project details');
    return response.json();
};

// --- Proxy Endpoints ---
export const getProxies = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/proxies`);
    if (!response.ok) throw new Error("Failed to fetch proxies");
    return response.json();
};

export const createProxy = async (proxyData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/proxies`, {
        method: 'POST',
        body: JSON.stringify(proxyData)
    });
    if (!response.ok) throw new Error('Failed to create proxy');
    return response.json();
};

export const deleteProxy = async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/proxies/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete proxy');
    return response.json();
};

export const bulkCreateProxies = async (proxies) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/proxies/bulk`, {
        method: 'POST',
        body: JSON.stringify({ proxies })
    });
    if (!response.ok) throw new Error('Failed to add proxies in bulk');
    return response.json();
};

export const testProxy = async (id) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/proxies/${id}/test`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to test proxy');
    return response.json();
};

// --- Admin & Stats ---
export const getAdminStats = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
    if (!response.ok) throw new Error('Failed to fetch admin stats');
    return response.json();
};

export const getTransactions = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
};

export const getAffiliateEarnings = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/affiliate/earnings`);
    if (!response.ok) throw new Error('Failed to fetch earnings');
    return response.json();
};

export const getProjectLogs = async (projectId, limit = 100) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/logs?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch project logs");
    return response.json();
};

export const generateApiKey = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/api-key`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to generate API Key');
    return response.json();
};
