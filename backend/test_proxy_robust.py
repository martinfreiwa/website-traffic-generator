import asyncio
import aiohttp

async def main():
    proxy_url = "http://geonode_D2kioKkMvG-country-us-session-sess_xcdz432vfd:dcfe56c3-1002-4fc8-98e3-51829e7c5ab0@proxy.geonode.io:9000"
    print("Testing ip-api.com")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://ip-api.com/json", proxy=proxy_url, timeout=10) as resp:
                print("Status:", resp.status)
                print("Body:", await resp.text())
    except Exception as e:
        print("Exception:", e)

    print("Testing api.ipify.org")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://api.ipify.org?format=json", proxy=proxy_url, timeout=10) as resp:
                print("Status:", resp.status)
                print("Body:", await resp.text())
    except Exception as e:
        print("Exception:", e)

asyncio.run(main())
