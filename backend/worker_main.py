import os
import sys
import logging
import signal
import asyncio
import threading
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

from worker.subscriber import PubSubSubscriber, SubscriberStatus
from worker.task_processor import TaskProcessor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "traffic-creator")
SUBSCRIPTION_ID = os.getenv("PUBSUB_SUBSCRIPTION", "traffic-workers-sub")
PORT = int(os.getenv("PORT", "8080"))
MAX_SILENCE_SECONDS = int(os.getenv("MAX_SILENCE_SECONDS", "300"))

processor = TaskProcessor()
subscriber = None
health_app = FastAPI()

subscriber_status = SubscriberStatus()


@health_app.get("/health")
async def health_check():
    status_data = subscriber_status.get_status()
    is_active = subscriber_status.check_health(max_silence_seconds=MAX_SILENCE_SECONDS)

    if is_active:
        return JSONResponse(
            status_code=200,
            content={"status": "healthy", "subscriber_active": True, **status_data},
        )
    else:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "subscriber_active": False,
                "reason": f"No messages processed in last {MAX_SILENCE_SECONDS} seconds",
                **status_data,
            },
        )


@health_app.get("/")
async def root():
    return {"service": "traffic-worker", "status": "running"}


@health_app.get("/status")
async def detailed_status():
    return JSONResponse(
        status_code=200,
        content={
            "service": "traffic-worker",
            "project": GCP_PROJECT_ID,
            "subscription": SUBSCRIPTION_ID,
            "max_silence_seconds": MAX_SILENCE_SECONDS,
            **subscriber_status.get_status(),
        },
    )


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
    logger.info(f"Shutdown signal {signum} received, stopping...")
    if subscriber:
        subscriber.stop()
    sys.exit(0)


def main():
    global subscriber

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    logger.info("=" * 50)
    logger.info("Starting Traffic Worker Service")
    logger.info(f"Project: {GCP_PROJECT_ID}")
    logger.info(f"Subscription: {SUBSCRIPTION_ID}")
    logger.info(f"Health server port: {PORT}")
    logger.info(f"Max silence threshold: {MAX_SILENCE_SECONDS}s")
    logger.info("=" * 50)

    health_thread = threading.Thread(target=run_health_server, daemon=True)
    health_thread.start()
    logger.info("Health server started")

    subscriber = PubSubSubscriber(
        project_id=GCP_PROJECT_ID,
        subscription_id=SUBSCRIPTION_ID,
        processor=processor,
        status=subscriber_status,
    )

    try:
        subscriber.listen()
    except KeyboardInterrupt:
        logger.info("Interrupted, shutting down...")
    finally:
        logger.info("Worker service stopped")


if __name__ == "__main__":
    main()
