#!/usr/bin/env python3
"""
Local test script for the worker service.
Run without Pub/Sub, simulates a single task.

Usage:
    cd backend
    python test_worker_local.py --project-id <PROJECT_ID> --visitors 5
"""

import asyncio
import argparse
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


async def test_task_processor(project_id: str, visitor_count: int):
    from worker.task_processor import TaskProcessor

    processor = TaskProcessor()

    task_data = {
        "task_id": "test-task-001",
        "project_id": project_id,
        "visitor_count": visitor_count,
    }

    logger.info(
        f"Testing task processor with project={project_id}, visitors={visitor_count}"
    )

    try:
        success = await processor.process(task_data)
        logger.info(f"Task completed: {'SUCCESS' if success else 'FAILED'}")
    except Exception as e:
        logger.error(f"Task failed with error: {e}", exc_info=True)
    finally:
        await processor.close()


def main():
    parser = argparse.ArgumentParser(description="Test worker locally")
    parser.add_argument("--project-id", required=True, help="Project ID to test")
    parser.add_argument(
        "--visitors", type=int, default=3, help="Number of visitors to simulate"
    )
    parser.add_argument("--api-url", default="http://localhost:8001", help="API URL")

    args = parser.parse_args()

    os.environ["API_URL"] = args.api_url

    asyncio.run(test_task_processor(args.project_id, args.visitors))


if __name__ == "__main__":
    main()
