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
