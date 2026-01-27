from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
import uvicorn
import logging
from datetime import datetime
import json

app = FastAPI(title="Nexus Lab | Traffic Verifier")

# Stats storage
stats = {
    "total_requests": 0,
    "last_request": "Never",
    "recent_hits": []
}

PAGES = {
    "/": "Home - Strategic Traffic Solutions",
    "/about": "About Us | Nexus Lab",
    "/services": "Our Services | Advanced Emulation",
    "/blog": "Insights - Behavioral Analytics Blog",
    "/contact": "Get in Touch | Contact Nexus",
    "/pricing": "Premium Tiers & Pricing"
}

def get_nav():
    return "".join([f'<a href="{path}">{title.split("|")[0].split("-")[0].strip()}</a>' for path, title in PAGES.items()])

@app.get("/", response_class=HTMLResponse)
@app.get("/{path:path}", response_class=HTMLResponse)
async def serve_page(request: Request, path: str = ""):
    full_path = f"/{path}"
    if full_path not in PAGES:
        if "favicon.ico" in full_path: return {"status": "ignored"}
        # Allow dynamic paths like /blog-123 for random exploration
        title = f"Dynamic Page: {full_path}"
    else:
        title = PAGES[full_path]

    # Log the hit
    stats["total_requests"] += 1
    stats["last_request"] = datetime.now().strftime("%H:%M:%S")
    
    hit = {
        "path": full_path,
        "ua": request.headers.get("user-agent", "Unknown"),
        "referrer": request.headers.get("referer", "Direct"),
        "ip": request.client.host,
        "timestamp": stats["last_request"],
        "headers": dict(request.headers)
    }
    stats["recent_hits"].insert(0, hit)
    if len(stats["recent_hits"]) > 50: stats["recent_hits"].pop()

    return f"""
    <html>
        <head>
            <title>{title}</title>
            <style>
                :root {{ --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --primary: #38bdf8; --accent: #22c55e; }}
                body {{ font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; line-height: 1.5; }}
                nav {{ background: var(--card); padding: 1rem; border-bottom: 1px solid #334155; display: flex; gap: 2rem; justify-content: center; }}
                nav调整 a {{ color: var(--text); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }}
                nav a:hover {{ color: var(--primary); }}
                .container {{ max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }}
                .hero {{ text-align: center; padding: 3rem 0; }}
                .hero h1 {{ font-size: 3rem; color: var(--primary); margin-bottom: 0.5rem; }}
                .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; }}
                .stat-card {{ background: var(--card); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #334155; text-align: center; }}
                .stat-val {{ font-size: 2rem; font-weight: 700; color: var(--accent); }}
                .log-section {{ margin-top: 3rem; background: #000; padding: 1.5rem; border-radius: 0.75rem; font-family: 'Fira Code', monospace; font-size: 0.8rem; border: 1px solid #334155; }}
                .log-header {{ color: var(--primary); margin-bottom: 1rem; border-bottom: 1px solid #222; padding-bottom: 0.5rem; display: flex; justify-content: space-between; }}
                .hit-entry {{ border-bottom: 1px solid #111; padding: 0.75rem 0; animation: fadeIn 0.5s ease-out; }}
                .hit-meta {{ display: flex; gap: 1rem; color: #64748b; font-size: 0.7rem; }}
                .hit-ua {{ color: #94a3b8; font-style: italic; margin-top: 0.25rem; }}
                .tag {{ padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; background: #334155; }}
                @keyframes fadeIn {{ from {{ opacity: 0; transform: translateY(-10px); }} to {{ opacity: 1; transform: translateY(0); }} }}
            </style>
        </head>
        <body>
            <nav>{get_nav()}</nav>
            <div class="container">
                <div class="hero">
                    <h1>Nexus Lab</h1>
                    <p class="label">Traffic Precision Verification Environment</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div style="font-size: 0.75rem; color: #94a3b8;">TOTAL HITS</div>
                        <div class="stat-val">{stats['total_requests']}</div>
                    </div>
                    <div class="stat-card">
                        <div style="font-size: 0.75rem; color: #94a3b8;">LAST ACTIVITY</div>
                        <div class="stat-val" style="font-size: 1.5rem;">{stats['last_request']}</div>
                    </div>
                </div>

                <div class="log-section">
                    <div class="log-header">
                        <span>LIVE TRAFFIC LOG (Last 10)</span>
                        <span style="color: #444;">Auto-refresh: 5s</span>
                    </div>
                    {"".join([f'''
                    <div class="hit-entry">
                        <div class="hit-meta">
                            <span style="color: var(--accent)">[{h['timestamp']}]</span>
                            <span style="color: var(--primary)">{h['path']}</span>
                            <span class="tag">IP: {h['ip']}</span>
                        </div>
                        <div class="hit-ua">UA: {h['ua'][:80]}...</div>
                        <div style="font-size: 0.65rem; color: #475569;">Referrer: {h['referrer']}</div>
                    </div>
                    ''' for h in stats["recent_hits"][:10]])}
                </div>
            </div>
            <script>
                setTimeout(() => location.reload(), 5000);
            </script>
        </body>
    </html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000, log_level="error")
