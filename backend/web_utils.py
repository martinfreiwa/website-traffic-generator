import httpx
import re
import logging
import asyncio
import certifi

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
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=True, verify=certifi.where()
        ) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            # Simple regex to find title content
            match = re.search(
                r"<title>(.*?)</title>", response.text, re.IGNORECASE | re.DOTALL
            )
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


async def find_ga4_tid(url: str, timeout: float = 10.0) -> str:
    """
    Scans a web page for GA4 Tracking IDs (starting with G-).
    If a tag manager URL like GT-XXXX is found, it attempts to fetch that script
    to resolve the actual G-XXXX ID.
    """
    try:
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=True, verify=certifi.where()
        ) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            text = response.text

            def extract_ids(content: str):
                patterns = [
                    r"\"((?:G|GT)-[A-Z0-9]+)\"",
                    r"'((?:G|GT)-[A-Z0-9]+)'",
                    r"tid:[\s]*[\"\'\`]((?:G|GT)-[A-Z0-9]+)[\"\'\`]",
                    r"measurementId:[\s]*[\"\'\`]((?:G|GT)-[A-Z0-9]+)[\"\'\`]",
                    r"gtag\([\"\'\`]config[\"\'\`],[\s]*[\"\'\`]((?:G|GT)-[A-Z0-9]+)[\"\'\`]",
                    r"id=((?:G|GT)-[A-Z0-9]+)\b",
                    r"\b((?:G|GT)-[A-Z0-9]{5,15})\b",
                ]
                matches = []
                for p in patterns:
                    matches.extend(re.findall(p, content))
                return [m for m in matches if len(m) > 5 and len(m) < 20]

            valid_matches = extract_ids(text)

            # If we found matches, check if any are GA4 (G-) or Tag Manager (GT-)
            if valid_matches:
                # Priority 1: Direct GA4 IDs (G-)
                ga4_ids = [m for m in valid_matches if m.startswith("G-")]
                if ga4_ids:
                    from collections import Counter

                    most_common = Counter(ga4_ids).most_common(1)[0][0]
                    logger.info(f"Discovered direct GA4 TID for {url}: {most_common}")
                    return most_common

                # Priority 2: Google Tag Manager IDs (GT-). Follow the script to find the relative G- ID.
                gt_ids = [m for m in valid_matches if m.startswith("GT-")]
                if gt_ids:
                    gt_id = gt_ids[0]  # Take the first GT ID
                    logger.info(
                        f"Found Google Tag ID {gt_id}, attempting to resolve GA4 ID from script..."
                    )
                    script_url = f"https://www.googletagmanager.com/gtag/js?id={gt_id}"
                    try:
                        script_res = await client.get(script_url, headers=headers)
                        if script_res.status_code == 200:
                            nested_ids = extract_ids(script_res.text)
                            nested_ga4 = [m for m in nested_ids if m.startswith("G-")]
                            if nested_ga4:
                                resolved_id = nested_ga4[0]
                                logger.info(
                                    f"Resolved GA4 TID {resolved_id} from {gt_id}"
                                )
                                return resolved_id
                    except Exception as script_err:
                        logger.error(
                            f"Failed to fetch GT script {script_url}: {script_err}"
                        )

            logger.warning(
                f"No GA4 Tracking ID found for {url} (Content length: {len(text)})"
            )
            return ""
    except Exception as e:
        logger.error(f"Error finding GA4 TID for {url}: {e}")
        return ""
