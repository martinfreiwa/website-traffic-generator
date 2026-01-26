const API_BASE_URL = "http://localhost:8000";

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

export const startTraffic = async (targets, visitorsPerMin, durationMins, mode = "direct_hit", returningVisitorPct = 0, bounceRatePct = 0, referrer = "") => {
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
            referrer
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
