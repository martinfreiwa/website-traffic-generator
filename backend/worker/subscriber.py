import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from google.cloud import pubsub_v1
from google.api_core import exceptions

logger = logging.getLogger(__name__)


class PubSubSubscriber:
    def __init__(
        self,
        project_id: str,
        subscription_id: str,
        processor,
    ):
        self.project_id = project_id
        self.subscription_id = subscription_id
        self.processor = processor
        self.subscriber = pubsub_v1.SubscriberClient()
        self.subscription_path = self.subscriber.subscription_path(
            project_id, subscription_id
        )
        self.running = False

    def _callback(self, message):
        try:
            data = json.loads(message.data.decode("utf-8"))
            logger.info(f"Received task: {data.get('task_id', 'unknown')}")

            success = asyncio.run(self._process_with_timeout(data))
            if success:
                message.ack()
                logger.info(f"Task completed: {data.get('task_id', 'unknown')}")
            else:
                message.nack()
                logger.warning(
                    f"Task failed, nacking: {data.get('task_id', 'unknown')}"
                )

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            message.nack()

    async def _process_with_timeout(self, data):
        try:
            return await asyncio.wait_for(self.processor.process(data), timeout=300)
        except asyncio.TimeoutError:
            logger.error(f"Task timed out: {data.get('task_id', 'unknown')}")
            return False

    def listen(self):
        self.running = True
        logger.info(f"Listening on subscription: {self.subscription_path}")

        streaming_pull_future = self.subscriber.subscribe(
            self.subscription_path, callback=self._callback
        )

        with self.subscriber:
            try:
                streaming_pull_future.result()
            except KeyboardInterrupt:
                streaming_pull_future.cancel()
                logger.info("Subscriber stopped by user")
            except Exception as e:
                logger.error(f"Subscriber error: {e}")
                streaming_pull_future.cancel()

    def stop(self):
        self.running = False
        logger.info("Stopping subscriber...")
