


import { db } from './db';

const API_ENDPOINT = 'https://v2.sparktraffic.com/add-website-traffic-project';
// Using a reliable public CORS proxy to bypass browser restrictions
const PROXY_ENDPOINT = 'https://corsproxy.io/?' + encodeURIComponent(API_ENDPOINT);

export const sparkTrafficService = {
  createProject: async (title: string, url: string, customPayload?: any, apiKeyOverride?: string): Promise<{ id: string, raw: any }> => {
    const settings = db.getSystemSettings();
    const apiKey = apiKeyOverride || settings.sparkTrafficApiKey;

    if (!apiKey) {
      throw new Error("SparkTraffic API Key is not configured. Please enter it in the Demo Generator or System Settings.");
    }

    // Default Payload Structure
    let payload: any = {
        "unique_id": `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        "created_at": 0,
        "expires_at": 0,
        "title": title,
        "size": "demo", // Default, overwritten by customPayload
        "multiplier": 0,
        "speed": 0,
        "traffic_type": "Direct",
        "keywords": "",
        "referrers": "",
        "social_links": "",
        "languages": "",
        "bounce_rate": 0,
        "return_rate": 0,
        "click_outbound_events": 0,
        "form_submit_events": 0,
        "scroll_events": 0,
        "time_on_page": "5sec",
        "desktop_rate": 0,
        "auto_renew": "true",
        "geo_type": "global",
        "geo": "",
        "shortener": "",
        "rss_feed": "",
        "ga_id": ""
    };

    // Merge custom payload if provided
    if (customPayload) {
        payload = { ...payload, ...customPayload };
        
        // --- DATA NORMALIZATION FOR API ---
        
        // 1. Handle Geo (Convert GeoTargets array to comma separated ISO string if exists in local format)
        // Check if we are passing a full 'settings' object mapped to payload
        if (customPayload.geoTargets && Array.isArray(customPayload.geoTargets)) {
             const isoCodes = customPayload.geoTargets.map((t: any) => t.country).join(',');
             payload.geo = isoCodes;
             payload.geo_type = isoCodes ? 'custom' : 'global';
        }

        // 2. Handle Traffic Type specific formatting if needed
        // The API likely takes the exact string selected in the dropdown if it matches the 'Detailed Breakdown' provided in prompt.
        // e.g. "Organic, Google Search". We pass it as is.
        
        // 3. Handle Device/OS specific
        // If specific device is selected in customPayload (e.g. from local ProjectSettings mapping)
        if (customPayload.deviceSpecific && customPayload.deviceSpecific !== 'All') {
            // Mapping Logic based on "Mobile, iPhone", "Desktop, Windows"
            const ds = customPayload.deviceSpecific;
            if (ds.includes('Windows')) payload.desktop_os = 'Windows';
            if (ds.includes('MacOS')) payload.desktop_os = 'MacOS';
            if (ds.includes('Linux')) payload.desktop_os = 'Linux';
            if (ds.includes('iPhone')) payload.mobile_os = 'iPhone';
            if (ds.includes('Android')) payload.mobile_os = 'Android';
        }
    }

    // Enforce title and url from arguments (Mandatory Overrides)
    if (title) payload.title = title;
    
    // API Requirement: Only 'urls-1' should be present for single URL projects.
    // We clean all other url keys to be safe.
    if (url) payload['urls-1'] = url;
    
    for (let i = 2; i <= 20; i++) {
        delete payload[`urls-${i}`];
    }

    // Ensure unique_id is present
    if (!payload.unique_id) {
        payload.unique_id = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // --- EXECUTION FUNCTION ---
    const executeRequest = async (endpoint: string, useProxy: boolean) => {
        console.log(`Sending POST to: ${useProxy ? 'CORS Proxy -> ' : ''}${API_ENDPOINT}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api_key': apiKey
            },
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let data;
        
        try {
            data = JSON.parse(text);
        } catch(e) {
            // Response was not JSON
            data = { error: "Invalid API Response", raw_text: text };
        }

        if (!response.ok) {
             const errorMsg = data.error || data.message || `HTTP Error ${response.status}`;
             throw new Error(errorMsg);
        }
        
        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    };

    try {
        // Attempt 1: Direct Connection
        try {
            const data = await executeRequest(API_ENDPOINT, false);
            if (data && (data['new-id'] || data['status'] === 'ok')) {
                return { id: data['new-id'] || 'unknown_id', raw: data };
            }
        } catch (directError: any) {
            // If it's a network/fetch error, try the proxy
            if (directError.name === 'TypeError' || directError.message.includes('Failed to fetch') || directError.message.includes('NetworkError')) {
                console.warn("Direct connection failed (likely CORS). Retrying with Proxy...");
                const data = await executeRequest(PROXY_ENDPOINT, true);
                return { id: data['new-id'] || 'unknown_id', raw: data };
            } else {
                // If it's an API logic error (e.g. 400 Bad Request), rethrow it, don't proxy
                throw directError;
            }
        }

        return { id: 'unknown_id', raw: { error: "Unknown State" } };

    } catch (error: any) {
        console.error("SparkTraffic Service Error:", error);
        
        let msg = error.message;
        if (msg === 'Failed to fetch') {
            msg = "Network Error (CORS). Even with the proxy, the connection failed. Please check your internet connection or the API Key validity.";
        }
        
        throw new Error(msg);
    }
  }
};
