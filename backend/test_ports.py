import asyncio
from database import SessionLocal
import models
from proxy_service import GeonodeProxyService
import aiohttp

async def main():
    db = SessionLocal()
    provider = db.query(models.ProxyProvider).filter(models.ProxyProvider.is_active == True).first()
    print("Provider ports:", provider.http_port_start, provider.http_port_end)
    
asyncio.run(main())
