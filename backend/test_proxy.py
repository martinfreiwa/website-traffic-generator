import asyncio
from database import SessionLocal
import models
from proxy_service import GeonodeProxyService

async def main():
    db = SessionLocal()
    provider = db.query(models.ProxyProvider).filter(models.ProxyProvider.is_active == True).first()
    if not provider:
        print("No active proxy provider")
        return
        
    service = GeonodeProxyService(provider)
    print("Testing proxy connection...")
    res = await service.test_connection()
    print("Test connection result:", res)
    
asyncio.run(main())
