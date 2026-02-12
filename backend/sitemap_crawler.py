import aiohttp
import xml.etree.ElementTree as ET
import logging
import re
from typing import List, Optional

logger = logging.getLogger(__name__)

async def fetch_sitemap(url: str) -> Optional[str]:
    """Fetch sitemap content with a standard user agent"""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; TrafficGenBot/1.0; +http://traffic-creator.com/bot)"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=10) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    logger.warning(f"Failed to fetch sitemap: {url} (Status: {response.status})")
                    return None
    except Exception as e:
        logger.error(f"Error fetching sitemap {url}: {e}")
        return None

def parse_sitemap(content: str) -> List[str]:
    """Parse XML sitemap content and extract URLs"""
    urls = []
    try:
        # Remove namespace prefixes to make parsing easier
        content = re.sub(r' xmlns="[^"]+"', '', content, count=1)
        
        root = ET.fromstring(content)
        
        # Handle sitemap index vs urlset
        if root.tag == 'sitemapindex':
            # This is an index, we might need to crawl sub-sitemaps (not implemented for simplicity/safety)
            # For now, just log it.
            logger.info("Sitemap index found. Recursive crawling not enabled yet.")
            pass 
        elif root.tag == 'urlset':
            for url_tag in root.findall('url'):
                loc = url_tag.find('loc')
                if loc is not None and loc.text:
                    urls.append(loc.text.strip())
                    
    except ET.ParseError as e:
        logger.error(f"XML Parse Error: {e}")
    except Exception as e:
        logger.error(f"Sitemap parsing error: {e}")
        
    return urls

async def crawl_sitemap(url: str) -> List[str]:
    """Main entry point: Fetch and parse sitemap"""
    if not url:
        return []
    
    content = await fetch_sitemap(url)
    if content:
        return parse_sitemap(content)
    return []
