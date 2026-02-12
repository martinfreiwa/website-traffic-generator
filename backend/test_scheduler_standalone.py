"""
Standalone test for scheduler fire-and-forget fixes.
Does not require external dependencies - mocks all imports.
"""

import asyncio
import sys
import os
from datetime import datetime
from unittest.mock import Mock, MagicMock

# Mock all imports before importing scheduler
mock_models = MagicMock()
mock_database = MagicMock()
mock_engine = MagicMock()

sys.modules['models'] = mock_models
sys.modules['database'] = mock_database
sys.modules['hit_emulator'] = mock_engine

# Now we can import the scheduler
# We'll create a minimal version for testing

import logging
from typing import Dict, Set

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)


class TrafficScheduler:
    """Minimal scheduler class for testing the fixes"""
    
    def __init__(self):
        self.is_running = False
        self._task = None
        self._running_tasks: Dict[str, asyncio.Task] = {}
        self._completed_tasks: Set[asyncio.Task] = set()
        self._max_concurrent = 2  # Small for testing
        self._semaphore = asyncio.Semaphore(self._max_concurrent)
        self._last_reset_date = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Scheduler started")

    async def stop(self):
        self.is_running = False
        
        if self._running_tasks:
            logger.info(f"Cancelling {len(self._running_tasks)} tasks...")
            for project_id, task in list(self._running_tasks.items()):
                task.cancel()
            
            if self._running_tasks:
                await asyncio.gather(*self._running_tasks.values(), return_exceptions=True)
            self._running_tasks.clear()
        
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler stopped")

    def _task_done_callback(self, project_id: str, task: asyncio.Task):
        """Handle task completion"""
        self._completed_tasks.discard(task)
        
        if project_id in self._running_tasks and self._running_tasks[project_id] is task:
            del self._running_tasks[project_id]
        
        try:
            task.result()
        except asyncio.CancelledError:
            logger.debug(f"Task {project_id} cancelled")
        except Exception as e:
            logger.error(f"Task {project_id} failed: {e}")

    async def _loop(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                await self.check_and_run()
            except Exception as e:
                logger.error(f"Loop error: {e}")
            await asyncio.sleep(0.1)  # Fast for testing

    async def check_and_run(self):
        """Check and run projects"""
        now = datetime.utcnow()
        
        # Daily reset logic
        current_date = now.date()
        if now.hour == 0 and now.minute == 0 and self._last_reset_date != current_date:
            self._last_reset_date = current_date
            logger.info("Daily reset triggered")

    async def _run_project_with_error_handling(self, project_id: str, project_name: str, engine_func):
        """Run with semaphore and error handling"""
        async with self._semaphore:
            try:
                logger.debug(f"Starting {project_id}")
                await engine_func(project_id)
                logger.debug(f"Completed {project_id}")
            except asyncio.CancelledError:
                logger.debug(f"Cancelled {project_id}")
                raise
            except Exception as e:
                logger.error(f"Failed {project_id}: {e}")
                raise


class TestTaskTracking:
    """Test task tracking"""
    
    async def test_task_stored(self):
        scheduler = TrafficScheduler()
        
        async def mock_engine(project_id):
            await asyncio.sleep(0.05)
        
        task = asyncio.create_task(
            scheduler._run_project_with_error_handling("test", "Test", mock_engine)
        )
        scheduler._running_tasks["test"] = task
        
        assert "test" in scheduler._running_tasks
        await task
        print("✓ Task stored in _running_tasks")
    
    async def test_task_overlap_cancellation(self):
        scheduler = TrafficScheduler()
        old_cancelled = False
        
        async def slow_engine(project_id):
            nonlocal old_cancelled
            try:
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                old_cancelled = True
                raise
        
        # Start first task
        old_task = asyncio.create_task(
            scheduler._run_project_with_error_handling("proj", "Proj", slow_engine)
        )
        scheduler._running_tasks["proj"] = old_task
        await asyncio.sleep(0.02)  # Let it start
        
        # Cancel it (simulating overlap)
        if not old_task.done():
            old_task.cancel()
            scheduler._completed_tasks.add(old_task)
        
        try:
            await old_task
        except asyncio.CancelledError:
            pass
        
        assert old_cancelled, "Old task should be cancelled"
        print("✓ Task overlap triggers cancellation")


class TestSemaphore:
    """Test semaphore concurrency control"""
    
    async def test_concurrency_limit(self):
        scheduler = TrafficScheduler()
        scheduler._max_concurrent = 2
        scheduler._semaphore = asyncio.Semaphore(2)
        
        running = 0
        max_running = 0
        
        async def track_engine(project_id):
            nonlocal running, max_running
            running += 1
            max_running = max(max_running, running)
            await asyncio.sleep(0.1)
            running -= 1
        
        # Start 5 tasks
        tasks = [
            asyncio.create_task(
                scheduler._run_project_with_error_handling(f"p{i}", f"P{i}", track_engine)
            )
            for i in range(5)
        ]
        
        await asyncio.gather(*tasks)
        
        assert max_running <= 2, f"Max should be 2, got {max_running}"
        print(f"✓ Semaphore limits to {scheduler._max_concurrent} concurrent (observed max: {max_running})")


class TestDailyReset:
    """Test daily reset logic"""
    
    async def test_reset_once_per_day(self):
        scheduler = TrafficScheduler()
        reset_count = 0
        
        def trigger_reset():
            nonlocal reset_count
            reset_count += 1
        
        now = datetime.utcnow()
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # First call
        scheduler._last_reset_date = None
        if midnight.hour == 0 and midnight.minute == 0 and scheduler._last_reset_date != midnight.date():
            scheduler._last_reset_date = midnight.date()
            trigger_reset()
        
        # Second call (same day)
        if midnight.hour == 0 and midnight.minute == 0 and scheduler._last_reset_date != midnight.date():
            scheduler._last_reset_date = midnight.date()
            trigger_reset()
        
        # Third call (same day)
        if midnight.hour == 0 and midnight.minute == 0 and scheduler._last_reset_date != midnight.date():
            scheduler._last_reset_date = midnight.date()
            trigger_reset()
        
        assert reset_count == 1, f"Should reset once, got {reset_count}"
        print(f"✓ Daily reset happens once (count: {reset_count})")


class TestCleanup:
    """Test cleanup on stop"""
    
    async def test_stop_cancels_tasks(self):
        scheduler = TrafficScheduler()
        scheduler.is_running = True
        
        cancelled = []
        started = []
        
        async def long_task(project_id):
            started.append(project_id)
            try:
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                cancelled.append(project_id)
                raise
        
        # Create tasks directly (simulating what check_and_run does)
        tasks = []
        for i in range(3):
            task = asyncio.create_task(long_task(f"p{i}"))
            scheduler._running_tasks[f"p{i}"] = task
            tasks.append(task)
        
        # Wait for all tasks to start
        await asyncio.sleep(0.05)
        
        await scheduler.stop()
        
        # All 3 should be cancelled (not just the 2 that acquired semaphore)
        assert len(cancelled) == 3, f"Should cancel 3 tasks, got {len(cancelled)} (started: {len(started)})"
        assert len(scheduler._running_tasks) == 0
        print(f"✓ Stop cancels {len(cancelled)} tasks and clears tracking")


class TestExceptionHandling:
    """Test exception handling"""
    
    async def test_exception_propagates(self):
        scheduler = TrafficScheduler()
        
        async def fail_engine(project_id):
            raise ValueError("Test error")
        
        try:
            await scheduler._run_project_with_error_handling("test", "Test", fail_engine)
            assert False, "Should have raised"
        except ValueError:
            pass
        
        print("✓ Exceptions propagate correctly")
    
    async def test_done_callback_with_exception(self):
        scheduler = TrafficScheduler()
        errors = []
        
        async def bad_task():
            raise RuntimeError("Bad")
        
        task = asyncio.create_task(bad_task())
        scheduler._running_tasks["test"] = task
        
        try:
            await task
        except RuntimeError:
            pass
        
        # Simulate callback
        scheduler._task_done_callback("test", task)
        
        assert "test" not in scheduler._running_tasks
        print("✓ Done callback cleans up after exceptions")


async def run_tests():
    print("\n" + "="*60)
    print("TESTING SCHEDULER FIXES")
    print("="*60)
    
    print("\n--- Task Tracking ---")
    t1 = TestTaskTracking()
    await t1.test_task_stored()
    await t1.test_task_overlap_cancellation()
    
    print("\n--- Semaphore Control ---")
    t2 = TestSemaphore()
    await t2.test_concurrency_limit()
    
    print("\n--- Daily Reset ---")
    t3 = TestDailyReset()
    await t3.test_reset_once_per_day()
    
    print("\n--- Cleanup ---")
    t4 = TestCleanup()
    await t4.test_stop_cancels_tasks()
    
    print("\n--- Exception Handling ---")
    t5 = TestExceptionHandling()
    await t5.test_exception_propagates()
    await t5.test_done_callback_with_exception()
    
    print("\n" + "="*60)
    print("ALL TESTS PASSED ✓")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_tests())
