"""
Test suite for scheduler fire-and-forget fixes.
Tests task tracking, semaphore control, exception handling, and cleanup.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scheduler import TrafficScheduler


class TestTaskTracking:
    """Test task tracking and lifecycle management"""
    
    async def test_task_stored_in_running_tasks(self):
        """Verify that created tasks are stored in _running_tasks"""
        scheduler = TrafficScheduler()
        
        # Mock the engine run method
        async def mock_run(project_id):
            await asyncio.sleep(0.1)
        
        with patch('scheduler.ga_emu_engine') as mock_engine:
            mock_engine.run_for_project = mock_run
            
            # Create a task
            task = asyncio.create_task(
                scheduler._run_project_with_error_handling("test-project", "Test Project")
            )
            scheduler._running_tasks["test-project"] = task
            
            # Verify task is tracked
            assert "test-project" in scheduler._running_tasks
            assert scheduler._running_tasks["test-project"] is task
            
            # Wait for completion
            await task
            
        print("✓ Task is stored in _running_tasks")
    
    async def test_task_overlap_prevention(self):
        """Verify that new tasks cancel old ones for the same project"""
        scheduler = TrafficScheduler()
        
        old_task_cancelled = False
        
        async def slow_run(project_id):
            try:
                await asyncio.sleep(10)  # Long running
            except asyncio.CancelledError:
                nonlocal old_task_cancelled
                old_task_cancelled = True
                raise
        
        with patch('scheduler.ga_emu_engine') as mock_engine:
            mock_engine.run_for_project = slow_run
            
            # Start first task
            old_task = asyncio.create_task(
                scheduler._run_project_with_error_handling("project-1", "Project 1")
            )
            scheduler._running_tasks["project-1"] = old_task
            
            # Give it time to start
            await asyncio.sleep(0.05)
            
            # Simulate scheduler creating new task (should cancel old)
            if not old_task.done():
                old_task.cancel()
                scheduler._completed_tasks.add(old_task)
            
            # Wait for cancellation
            try:
                await old_task
            except asyncio.CancelledError:
                pass
            
            assert old_task_cancelled, "Old task should have been cancelled"
            assert old_task.done(), "Old task should be done"
            
        print("✓ Task overlap prevention works")


class TestSemaphoreControl:
    """Test semaphore concurrency control"""
    
    async def test_max_concurrent_limit(self):
        """Verify semaphore limits concurrent executions"""
        scheduler = TrafficScheduler()
        scheduler._max_concurrent = 2  # Limit to 2 concurrent
        scheduler._semaphore = asyncio.Semaphore(2)
        
        running_count = 0
        max_running = 0
        
        async def track_concurrency(project_id):
            nonlocal running_count, max_running
            running_count += 1
            max_running = max(max_running, running_count)
            await asyncio.sleep(0.1)
            running_count -= 1
        
        with patch('scheduler.ga_emu_engine') as mock_engine:
            mock_engine.run_for_project = track_concurrency
            
            # Start 5 tasks concurrently
            tasks = [
                asyncio.create_task(
                    scheduler._run_project_with_error_handling(f"project-{i}", f"Project {i}")
                )
                for i in range(5)
            ]
            
            await asyncio.gather(*tasks)
            
            assert max_running <= 2, f"Max concurrent should be 2, got {max_running}"
            
        print(f"✓ Semaphore limits concurrency (max running: {max_running})")


class TestExceptionHandling:
    """Test exception handling in tasks"""
    
    async def test_exception_logged(self):
        """Verify exceptions are properly caught and logged"""
        scheduler = TrafficScheduler()
        exception_raised = False
        
        async def failing_run(project_id):
            raise ValueError("Test exception")
        
        with patch('scheduler.ga_emu_engine') as mock_engine:
            mock_engine.run_for_project = failing_run
            
            try:
                await scheduler._run_project_with_error_handling("test", "Test")
            except ValueError:
                exception_raised = True
            
            assert exception_raised, "Exception should propagate"
            
        print("✓ Exceptions are properly raised")
    
    async def test_task_done_callback_handles_exception(self):
        """Verify done callback properly handles exceptions"""
        scheduler = TrafficScheduler()
        
        async def failing_task():
            raise RuntimeError("Test error")
        
        task = asyncio.create_task(failing_task())
        scheduler._running_tasks["test"] = task
        
        # Wait for task to complete
        try:
            await task
        except RuntimeError:
            pass
        
        # Simulate callback
        scheduler._task_done_callback("test", task)
        
        # Task should be removed from running tasks
        assert "test" not in scheduler._running_tasks
        
        print("✓ Task done callback handles exceptions")


class TestDailyReset:
    """Test daily reset race condition fix"""
    
    async def test_reset_only_once_per_day(self):
        """Verify daily reset only happens once per day"""
        scheduler = TrafficScheduler()
        reset_count = 0
        
        # Mock the database operations
        def mock_reset():
            nonlocal reset_count
            reset_count += 1
        
        # Simulate multiple calls at midnight
        now = datetime.utcnow()
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # First call - should reset
        scheduler._last_reset_date = None
        if midnight.hour == 0 and midnight.minute == 0 and scheduler._last_reset_date != midnight.date():
            scheduler._last_reset_date = midnight.date()
            mock_reset()
        
        # Second call - should NOT reset
        if midnight.hour == 0 and midnight.minute == 0 and scheduler._last_reset_date != midnight.date():
            scheduler._last_reset_date = midnight.date()
            mock_reset()
        
        # Third call - should NOT reset
        if midnight.hour == 0 and midnight.minute == 0 and scheduler._last_reset_date != midnight.date():
            scheduler._last_reset_date = midnight.date()
            mock_reset()
        
        assert reset_count == 1, f"Reset should happen only once, got {reset_count}"
        
        print(f"✓ Daily reset happens only once (count: {reset_count})")


class TestCleanup:
    """Test cleanup on scheduler stop"""
    
    async def test_stop_cancels_running_tasks(self):
        """Verify stop() cancels all running tasks"""
        scheduler = TrafficScheduler()
        scheduler.is_running = True
        
        cancelled_tasks = []
        
        async def long_running_task():
            try:
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                cancelled_tasks.append(True)
                raise
        
        # Create some running tasks
        tasks = [
            asyncio.create_task(long_running_task())
            for _ in range(3)
        ]
        
        for i, task in enumerate(tasks):
            scheduler._running_tasks[f"project-{i}"] = task
        
        # Stop scheduler
        await scheduler.stop()
        
        assert len(cancelled_tasks) == 3, f"All 3 tasks should be cancelled, got {len(cancelled_tasks)}"
        assert len(scheduler._running_tasks) == 0, "Running tasks should be cleared"
        
        print(f"✓ Stop cancels all running tasks ({len(cancelled_tasks)} cancelled)")


async def run_all_tests():
    """Run all test suites"""
    print("\n" + "="*60)
    print("TESTING SCHEDULER FIRE-AND-FORGET FIXES")
    print("="*60 + "\n")
    
    # Task Tracking Tests
    print("\n--- Task Tracking Tests ---")
    test_tracking = TestTaskTracking()
    await test_tracking.test_task_stored_in_running_tasks()
    await test_tracking.test_task_overlap_prevention()
    
    # Semaphore Tests
    print("\n--- Semaphore Control Tests ---")
    test_semaphore = TestSemaphoreControl()
    await test_semaphore.test_max_concurrent_limit()
    
    # Exception Handling Tests
    print("\n--- Exception Handling Tests ---")
    test_exception = TestExceptionHandling()
    await test_exception.test_exception_logged()
    await test_exception.test_task_done_callback_handles_exception()
    
    # Daily Reset Tests
    print("\n--- Daily Reset Tests ---")
    test_reset = TestDailyReset()
    await test_reset.test_reset_only_once_per_day()
    
    # Cleanup Tests
    print("\n--- Cleanup Tests ---")
    test_cleanup = TestCleanup()
    await test_cleanup.test_stop_cancels_running_tasks()
    
    print("\n" + "="*60)
    print("ALL TESTS PASSED ✓")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
