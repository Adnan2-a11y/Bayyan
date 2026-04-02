import sys
from loguru import logger
from app.core.config import settings

# Remove default handler and configure structured JSON formatting
logger.remove()

# Add a standard stdout handler for Docker captures
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.log_level.upper(),
    enqueue=True, # Thread-safe
    backtrace=True,
    diagnose=True
)

# Optional JSON output for centralized logging stacks like ELK/Datadog
# logger.add("logs/app.json", serialize=True, level=settings.log_level.upper())
