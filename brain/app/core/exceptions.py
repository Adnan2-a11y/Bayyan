from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.logger import logger

class ModelLoadError(Exception):
    def __init__(self, detail: str = "model_loading_failed"):
        self.detail = detail

class InferenceError(Exception):
    def __init__(self, detail: str = "inference_failed"):
        self.detail = detail

async def global_exception_handler(request: Request, exc: Exception):
    # Log the exact traceback
    logger.exception(f"Unhandled Exception: {exc}")
    
    # Return structured 503 safe-mode matching Node.js handler expectations
    return JSONResponse(
        status_code=503,
        content={"detail": "Service Unavailable. ML Model Failed.", "reason": str(exc)},
    )

async def model_load_exception_handler(request: Request, exc: ModelLoadError):
    logger.error(f"Safe Mode Triggered: {exc.detail}")
    return JSONResponse(
        status_code=503,
        content={"detail": "Safe Mode", "reason": exc.detail},
    )
