import os
import time
import asyncio
import logging

logger = logging.getLogger(__name__)

DB_PATH = "data/checkpoints.db"
THIRTY_DAYS_SEC = 30 * 24 * 60 * 60

async def cleanup_database_routine():
    """Background task measuring DB age. Deletes if idle for 30 days."""
    while True:
        try:
            if os.path.exists(DB_PATH):
                file_age = time.time() - os.path.getmtime(DB_PATH)
                if file_age > THIRTY_DAYS_SEC:
                    logger.warning(f"checkpoints.db is {file_age}s old (over 30 days). Wiping to preserve memory.")
                    os.remove(DB_PATH)
        except Exception as e:
            logger.error(f"Error checking TTL for checkpoints.db: {e}")
        
        # Sleep for 24 hours before checking again
        await asyncio.sleep(24 * 60 * 60)
