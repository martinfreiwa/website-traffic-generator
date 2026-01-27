import httpx
import re
import logging
import asyncio

logger = logging.getLogger(__name__)

# Simple in-memory cache for page titles
# {url: title}
TITLE_CACHE = {}

async def fetch_page_title(url: str, timeout: float = 5.0) -> str:
    """
    Fetches the <title> tag content of a URL.
    Uses regex to avoid dependency on BeautifulSoup for now.
    """
    if url in TITLE_CACHE:
        return TITLE_CACHE[url]

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # Simple regex to find title content
            match = re.search(r'<title>(.*?)</title>', response.text, re.IGNORECASE | re.DOTALL)
            if match:
                title = match.group(1).strip()
                # Clean up title (remove extra whitespace/newlines)
                title = " ".join(title.split())
                TITLE_CACHE[url] = title
                logger.info(f"Fetched title for {url}: {title}")
                return title
            
            logger.warning(f"No title tag found for {url}")
            return ""
    except Exception as e:
        logger.error(f"Error fetching title for {url}: {e}")
        return ""

async def prefetch_titles(urls: list[str]):
    """Parallel prefetching of titles for a list of URLs."""
    tasks = [fetch_page_title(url) for url in urls if url]
    if tasks:
        await asyncio.gather(*tasks)

async def find_ga4_tid(url: str, timeout: float = 8.0) -> str:
    """
    Scans a web page for GA4 Tracking IDs (starting with G-).
    """
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # Expanded search for GA4 measurement IDs: G-XXXXXXXXXX
            text = response.text
            
            # Look for common tag patterns
            patterns = [
                r'\"(G-[A-Z0-9]+)\"',
                r"'(G-[A-Z0-9]+)'",
                r'tid:[\s]*[\"\'\`](G-[A-Z0-9]+)[\"\'\`]',
                r'measurementId:[\s]*[\"\'\`](G-[A-Z0-9]+)[\"\'\`]',
                r'gtag\([\"\'\`]config[\"\'\`],[\s]*[\"\'\`](G-[A-Z0-9]+)[\"\'\`]',
                r'id=(G-[A-Z0-9]+)\b',
                r'\b(G-[A-Z0-9]{5,15})\b'
            ]
            
            all_matches = []
            for p in patterns:
                all_matches.extend(re.findall(p, text))
            
            if all_matches:
                # Filter out obvious false positives and sort by frequency or length
                from collections import Counter
                valid_matches = [m for m in all_matches if len(m) > 5 and len(m) < 20]
                if valid_matches:
                    # Return the most frequent one if multiples exist, or just the first
                    most_common = Counter(valid_matches).most_common(1)[0][0]
                    logger.info(f"Discovered GA4 TID for {url}: {most_common}")
                    return most_common
            
            logger.warning(f"No GA4 Tracking ID found for {url} (Content length: {len(text)})")
            return ""
    except Exception as e:
        logger.error(f"Error finding GA4 TID for {url}: {e}")
        return ""
