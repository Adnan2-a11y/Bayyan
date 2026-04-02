from sentence_transformers import SentenceTransformer
from app.core.logger import logger
from app.core.config import settings
from app.core.exceptions import ModelLoadError

# Global dictionary to hold models loaded during lifespan
ml_models = {}

def load_embedding_model():
    """Blocking call to load sentence-transformers into memory"""
    logger.info(f"Loading Sentence-Transformer model: {settings.model_path}...")
    try:
        # device='cpu' explicitly set to manage VPS constraints initially
        model = SentenceTransformer(settings.model_path, device='cpu')
        ml_models["encoder"] = model
        logger.info("Successfully loaded embedding model.")
    except Exception as e:
        logger.error(f"Failed to load sentence-transformer: {e}")
        raise ModelLoadError("embedding_model_failed")

def get_encoder() -> SentenceTransformer:
    """Returns the loaded model"""
    model = ml_models.get("encoder")
    if not model:
        raise ModelLoadError("encoder_not_loaded_safe_mode")
    return model
