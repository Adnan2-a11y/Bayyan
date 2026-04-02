from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.logger import logger
from app.core.exceptions import global_exception_handler, model_load_exception_handler, ModelLoadError
from app.modules.rag.loader import load_embedding_model
from app.api.endpoints import router as rag_router

# Manage application lifespan strictly according to rule 1 "Lifespan Management".
# Load Models precisely ONCE at initialization.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Hooks
    logger.info("Initializing Bayyan Brain AI Lifespan...")
    try:
        load_embedding_model()
    except ModelLoadError as mle:
        logger.error(f"Critical Startup Error: ML Model failed to spin up. {mle}")
        # Not exiting completely; allowing SafeMode 503 per architectural rules
        # You could also choose to sys.exit(1) depending on strictness preferences.

    yield # Main execution loop blocks here
    
    # Teardown Hooks
    logger.info("Shutting down Bayyan Brain ML endpoints gracefully")
    # Clean up PyTorch Cuda bindings, ChromaDB locks, etc. here if necessary

def create_app() -> FastAPI:
    app = FastAPI(
        title="Bayyan AI Brain",
        description="The intelligent inference engine powering Bayyan Bot",
        version="1.0.0",
        lifespan=lifespan
    )
    
    # 1. Register Global Fault Tolerance
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(ModelLoadError, model_load_exception_handler)
    
    # 2. Bind Modular Inference Routers
    app.include_router(rag_router)
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    # Enforce threadpool and bindings based on settings
    logger.info(f"Starting Uvicorn Server on port {settings.port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True, log_level=settings.log_level.lower())
