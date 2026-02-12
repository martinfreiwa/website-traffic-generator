import asyncio
import aiohttp
import re


async def scrape_url_for_ga(session, url, depth=0):
    """Recursive scraper for GA IDs"""
    print(f"Scraping {url} (depth {depth})")
    if depth > 1:  # Only follow one level of external scripts
        return None

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        async with session.get(
            url, timeout=10, headers=headers, allow_redirects=True
        ) as response:
            print(f"Response status: {response.status}")
            if response.status != 200:
                return None

            content = await response.text()
            print(f"Content length: {len(content)}")

            # 1. Look for G- IDs (The primary goal)
            g_match = re.search(r"G-[A-Z0-9]{8,14}", content)
            if g_match:
                print(f"Found G- match: {g_match.group(0)}")
                return g_match.group(0)

            # 2. Look for UA- IDs
            ua_match = re.search(r"UA-\d+-\d+", content)
            if ua_match:
                print(f"Found UA- match: {ua_match.group(0)}")
                return ua_match.group(0)

            # 3. Look for GT- containers (Follow them if found in main page)
            if depth == 0:
                gt_match = re.search(r"GT-[A-Z0-9]{7,14}", content)
                if gt_match:
                    gt_id = gt_match.group(0)
                    print(f"Found GT- container: {gt_id}, following...")
                    script_url = f"https://www.googletagmanager.com/gtag/js?id={gt_id}"
                    found_inner = await scrape_url_for_ga(
                        session, script_url, depth + 1
                    )
                    if found_inner:
                        return found_inner
                    # If nothing inside GT, return the GT ID itself as fallback
                    return gt_id

            return None
    except Exception as e:
        print(f"Error during scrape: {e}")
        return None


async def main():
    url = "https://ladiscussione.com/"
    async with aiohttp.ClientSession() as session:
        result = await scrape_url_for_ga(session, url)
        print(f"\nFINAL RESULT: {result}")


if __name__ == "__main__":
    asyncio.run(main())
