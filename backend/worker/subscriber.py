import os
import json
import logging
import asyncio
import threading
import time
import random
from datetime import datetime
from typing import Dict, Any, Optional
from google.cloud import pubsub_v1
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

MAX_CONCURRENT_TASKS = int(os.getenv("MAX_CONCURRENT_TASKS", "20"))
INITIAL_RETRY_DELAY = 1
MAX_RETRY_DELAY = 60
RETRY_MULTIPLIER = 2


class SubscriberStatus:
    def __init__(self):
        self._lock = threading.Lock()
        self._last_message_time: Optional[datetime] = None
        self._messages_processed = 0
        self._messages_failed = 0
        self._is_healthy = True
        self._error_count = 0
        self._last_error: Optional[str] = None

    def record_message_processed(self):
        with self._lock:
            self._last_message_time = datetime.utcnow()
            self._messages_processed += 1
            self._error_count = 0

    def record_message_failed(self, error: str):
        with self._lock:
            self._messages_failed += 1
            self._error_count += 1
            self._last_error = error

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "last_message_time": self._last_message_time.isoformat()
                if self._last_message_time
                else None,
                "messages_processed": self._messages_processed,
                "messages_failed": self._messages_failed,
                "is_healthy": self._is_healthy,
                "error_count": self._error_count,
                "last_error": self._last_error,
            }

    def check_health(self, max_silence_seconds: int = 300) -> bool:
        with self._lock:
            if self._last_message_time is None:
                return True
            silence_duration = (
                datetime.utcnow() - self._last_message_time
            ).total_seconds()
            return silence_duration < max_silence_seconds


class PubSubSubscriber:
    def __init__(
        self,
        project_id: str,
        subscription_id: str,
        processor,
        status: Optional[SubscriberStatus] = None,
    ):
        self.project_id = project_id
        self.subscription_id = subscription_id
        self.processor = processor
        self.subscriber = pubsub_v1.SubscriberClient()
        self.subscription_path = self.subscriber.subscription_path(
            project_id, subscription_id
        )
        self.running = False
        self.semaphore = threading.Semaphore(MAX_CONCURRENT_TASKS)
        self.executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_TASKS)
        self.status = status or SubscriberStatus()

    def _callback(self, message):
        def process_message():
            task_id = "unknown"
            try:
                data = json.loads(message.data.decode("utf-8"))
                task_id = data.get("task_id", "unknown")
                logger.info(f"Received task: {task_id}")

                with self.semaphore:
                    try:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        try:
                            success = loop.run_until_complete(
                                asyncio.wait_for(
                                    self.processor.process(data), timeout=300
                                )
                            )
                            if success:
                                message.ack()
                                self.status.record_message_processed()
                                logger.info(f"Task completed: {task_id}")
                            else:
                                message.nack()
                                self.status.record_message_failed("Task returned False")
                                logger.warning(f"Task failed, nacking: {task_id}")
                        finally:
                            loop.close()
                    except asyncio.TimeoutError:
                        logger.error(f"Task timed out: {task_id}")
                        self.status.record_message_failed("Task timeout")
                        message.nack()
                    except Exception as e:
                        logger.error(f"Error processing message: {e}", exc_info=True)
                        self.status.record_message_failed(str(e))
                        message.nack()
            except Exception as e:
                logger.error(f"Error in callback: {e}", exc_info=True)
                self.status.record_message_failed(str(e))
                message.nack()

        try:
            if not self.running or self.executor._shutdown:
                logger.warning("Executor shutdown or not running, nacking message")
                message.nack()
                return
        except Exception:
            pass

        try:
            self.executor.submit(process_message)
        except RuntimeError as e:
            if "shutdown" in str(e).lower():
                logger.warning("Executor shutdown, nacking message")
                message.nack()
            else:
                raise

    def listen(self):
        self.running = True
        retry_delay = INITIAL_RETRY_DELAY
        attempt = 0

        logger.info(f"Starting subscriber on: {self.subscription_path}")
        logger.info(f"Max concurrent tasks: {MAX_CONCURRENT_TASKS}")
        logger.info(
            f"Retry config: initial={INITIAL_RETRY_DELAY}s, max={MAX_RETRY_DELAY}s"
        )

        while self.running:
            attempt += 1
            streaming_pull_future = None

            try:
                flow_control = pubsub_v1.types.FlowControl(
                    max_messages=MAX_CONCURRENT_TASKS * 2,
                    max_bytes=100 * 1024 * 1024,
                )

                streaming_pull_future = self.subscriber.subscribe(
                    self.subscription_path,
                    callback=self._callback,
                    flow_control=flow_control,
                )

                logger.info(f"Subscriber connected (attempt {attempt})")
                retry_delay = INITIAL_RETRY_DELAY
                attempt = 0

                with self.subscriber:
                    streaming_pull_future.result()

            except KeyboardInterrupt:
                logger.info("Subscriber stopped by user (KeyboardInterrupt)")
                if streaming_pull_future:
                    streaming_pull_future.cancel()
                self.running = False
                break
            except Exception as e:
                logger.error(f"Subscriber error (attempt {attempt}): {e}")
                self.status.record_message_failed(f"Subscriber error: {e}")

                if streaming_pull_future:
                    try:
                        streaming_pull_future.cancel()
                    except Exception:
                        pass

                if self.running:
                    self.executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_TASKS)
                    jitter = random.uniform(0, retry_delay * 0.1)
                    sleep_time = retry_delay + jitter
                    logger.info(f"Reconnecting in {sleep_time:.1f}s...")
                    time.sleep(sleep_time)
                    retry_delay = min(retry_delay * RETRY_MULTIPLIER, MAX_RETRY_DELAY)

    def stop(self):
        self.running = False
        self.executor.shutdown(wait=False)
        logger.info("Stopping subscriber...")
