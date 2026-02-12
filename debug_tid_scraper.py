import asyncio
import aiohttp
import re

async def scrape_url_for_ga(session, url, depth=0):
    if depth > 1:
        return None

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        print(f"Fetching {url}...")
        async with session.get(
            url, timeout=10, headers=headers, allow_redirects=True
        ) as response:
            print(f"Status: {response.status}")
            if response.status != 200:
                print("Failed to fetch page")
                return None

            content = await response.text()
            print(f"Content length: {len(content)}")
            
            # Print a snippet to verify we got content
            print("Content snippet (first 500 chars):")
            print(content[:500])

            # 1. Look for G- IDs (The primary goal)
            g_match = re.search(r"G-[A-Z0-9]{8,14}", content)
            if g_match:
                print(f"Found G- ID: {g_match.group(0)}")
                return g_match.group(0)

            # 2. Look for UA- IDs
            ua_match = re.search(r"UA-\d+-\d+", content)
            if ua_match:
                print(f"Found UA- ID: {ua_match.group(0)}")
                return ua_match.group(0)
                
            # 3. Look for GT- containers
            gt_match = re.search(r"GT-[A-Z0-9]{7,14}", content)
            if gt_match:
                print(f"Found GT- ID: {gt_match.group(0)}")
                if depth == 0:
                     gt_id = gt_match.group(0)
                     script_url = f"https://www.googletagmanager.com/gtag/js?id={gt_id}"
                     # Recursive check
                     return await scrape_url_for_ga(session, script_url, depth + 1)
                
            print("No ID found in regex scan.")
            return None

    except Exception as e:
        print(f"Error: {e}")
        return None

async def main():
    url = "https://ladiscussione.com/"
    async with aiohttp.ClientSession() as session:
        found_id = await scrape_url_for_ga(session, url)
        print(f"Result: {found_id}")

if __name__ == "__main__":
    asyncio.run(main())
