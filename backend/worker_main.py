import os
import sys
import logging
import signal
import asyncio
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

from worker.subscriber import PubSubSubscriber
from worker.task_processor import TaskProcessor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "traffic-creator")
SUBSCRIPTION_ID = os.getenv("PUBSUB_SUBSCRIPTION", "traffic-workers-sub")
PORT = int(os.getenv("PORT", "8080"))

processor = TaskProcessor()
subscriber = None
health_app = FastAPI()

processor_status = {"healthy": True, "tasks_processed": 0, "last_task_at": None}


@health_app.get("/health")
async def health_check():
    return JSONResponse(
        status_code=200 if processor_status["healthy"] else 503,
        content={
            "status": "healthy" if processor_status["healthy"] else "unhealthy",
            "tasks_processed": processor_status["tasks_processed"],
            "last_task_at": processor_status["last_task_at"],
        },
    )


@health_app.get("/")
async def root():
    return {"service": "traffic-worker", "status": "running"}


def run_health_server():
    config = uvicorn.Config(
        app=health_app,
        host="0.0.0.0",
        port=PORT,
        log_level="info",
    )
    server = uvicorn.Server(config)
    asyncio.run(server.serve())


def shutdown_handler(signum, frame):
    logger.info("Shutdown signal received, stopping...")
    processor_status["healthy"] = False
    if subscriber:
        subscriber.stop()
    sys.exit(0)


def main():
    global subscriber

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    logger.info(f"Starting Traffic Worker Service")
    logger.info(f"Project: {GCP_PROJECT_ID}, Subscription: {SUBSCRIPTION_ID}")
    logger.info(f"Health server on port: {PORT}")

    health_thread = threading.Thread(target=run_health_server, daemon=True)
    health_thread.start()

    subscriber = PubSubSubscriber(
        project_id=GCP_PROJECT_ID,
        subscription_id=SUBSCRIPTION_ID,
        processor=processor,
    )

    try:
        subscriber.listen()
    except KeyboardInterrupt:
        logger.info("Interrupted, shutting down...")
    finally:
        processor_status["healthy"] = False


if __name__ == "__main__":
    main()
