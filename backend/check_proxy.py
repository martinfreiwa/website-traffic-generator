import asyncio
from database import SessionLocal
import models
from proxy_service import GeonodeProxyService

async def main():
    db = SessionLocal()
    try:
        provider = db.query(models.ProxyProvider).filter(models.ProxyProvider.is_active == True).first()
        if not provider:
            print("No active proxy provider found.")
            return

        print(f"Found active provider: {provider.name}")
        print(f"Host: {provider.proxy_host}")
        print(f"Username: {provider.username}")
        print(f"Ports: {provider.http_port_start}-{provider.http_port_end}")

        service = GeonodeProxyService(provider)
        print("Testing connection...")
        result = await service.test_connection()
        print(f"Connection result: {result}")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
