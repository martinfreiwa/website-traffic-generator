import httpx
import asyncio
import time

async def run_test():
    base_url = "http://localhost:8000"
    target_url = "https://www.google.com"
    tid = "G-TEST12345"
    
    print(f"--- Testing /start with {target_url} ---")
    payload = {
        "targets": [
            {
                "url": target_url,
                "tid": tid,
                "funnel": [{"url": "https://www.wikipedia.org"}]
            }
        ],
        "visitors_per_min": 10,
        "duration_mins": 1,
        "mode": "direct_hit"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 1. Start traffic
            start_resp = await client.post(f"{base_url}/start", json=payload)
            print(f"POST /start status: {start_resp.status_code}")
            print(f"POST /start response: {start_resp.json()}")
            
            if start_resp.status_code != 200:
                print("Failed to start traffic simulation.")
                return

            # 2. Check /titles
            print("\n--- Checking /titles ---")
            titles_resp = await client.get(f"{base_url}/titles")
            print(f"GET /titles response: {titles_resp.json()}")
            
            # 3. Check /stats
            print("\n--- Checking /stats ---")
            stats_resp = await client.get(f"{base_url}/stats")
            print(f"GET /stats response: {stats_resp.json()}")
            
            # 4. Cleanup
            print("\n--- Stopping traffic ---")
            stop_resp = await client.post(f"{base_url}/stop")
            print(f"POST /stop status: {stop_resp.status_code}")
            
        except Exception as e:
            print(f"Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
