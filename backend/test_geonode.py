import asyncio
from database import SessionLocal
import models
from proxy_service import GeonodeProxyService
import aiohttp

async def main():
    db = SessionLocal()
    provider = db.query(models.ProxyProvider).filter(models.ProxyProvider.is_active == True).first()
    if not provider:
        print("No active proxy provider")
        return
        
    service = GeonodeProxyService(provider)
    print("Testing proxy connection...")
    
    # Test 1: Port 9000 without session ID (what build_proxy_url currently does)
    url_no_sess = f"http://{provider.username}-country-us:{provider.password}@{provider.proxy_host}:9000"
    
    # Test 2: Port 9000 WITH session ID
    url_with_sess = f"http://{provider.username}-country-us-session-testsession123:{provider.password}@{provider.proxy_host}:9000"
    
    async with aiohttp.ClientSession() as session:
        print("Test 1: No session ID on port 9000")
        try:
            async with session.get("http://ip-api.com/json", proxy=url_no_sess, timeout=10) as resp:
                text = await resp.text()
                print(resp.status, text[:200])
        except Exception as e:
            print(e)
            
        print("Test 2: WITH session ID on port 9000")
        try:
            async with session.get("http://ip-api.com/json", proxy=url_with_sess, timeout=10) as resp:
                text = await resp.text()
                print(resp.status, text[:200])
        except Exception as e:
            print(e)
            
asyncio.run(main())
