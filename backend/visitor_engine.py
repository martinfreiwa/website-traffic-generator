import asyncio
import httpx
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
]

class VisitorEngine:
    def __init__(self):
        self.is_running = False
        self.stats = {} # Per-target stats

    async def simulate_visitor(self, url: str):
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        if url not in self.stats:
            self.stats[url] = {"success": 0, "failure": 0, "total": 0}
            
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    self.stats[url]["success"] += 1
                else:
                    self.stats[url]["failure"] += 1
        except Exception as e:
            logger.error(f"Error simulating visitor to {url}: {e}")
            self.stats[url]["failure"] += 1
        finally:
            self.stats[url]["total"] += 1

    async def run_simulation(self, urls: list[str], total_visitors: int, concurrency: int):
        self.is_running = True
        self.stats = {url: {"success": 0, "failure": 0, "total": 0} for url in urls}
        
        semaphore = asyncio.Semaphore(concurrency)

        async def worker(url):
            async with semaphore:
                if not self.is_running:
                    return
                # Add a small random delay to stagger visitors
                await asyncio.sleep(random.uniform(0.1, 2.0))
                await self.simulate_visitor(url)

        # Distribute visitors across all URLs
        tasks = []
        for i in range(total_visitors):
            if not self.is_running:
                break
            url = urls[i % len(urls)]
            tasks.append(asyncio.create_task(worker(url)))
            
        await asyncio.gather(*tasks)
        self.is_running = False
        logger.info(f"Simulation finished. Stats: {self.stats}")

    def stop(self):
        self.is_running = False

visitor_engine = VisitorEngine()
