import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import traceback

DATABASE_URL = "postgresql+asyncpg://trafficgen_user:TrafficGen2026!@127.0.0.1:5433/trafficgen"

async def main():
    try:
        engine = create_async_engine(DATABASE_URL)
        async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        
        async with async_session() as session:
            print("Connected!")
            # Check user
            user_res = await session.execute(text("SELECT id, email, is_active FROM users WHERE id = 'd0067967-bd4b-4443-92f5-a31996cd1383'"))
            user = user_res.fetchone()
            print(f"User: {user}")
            
            # Check campaign
            camp_res = await session.execute(text("SELECT id, user_id, status FROM campaigns WHERE id = '541576d4-fc92-45ff-a091-407b103d13cc'"))
            camp = camp_res.fetchone()
            print(f"Campaign: {camp}")

    except Exception as e:
        traceback.print_exc()

asyncio.run(main())
