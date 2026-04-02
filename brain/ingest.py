import os
from app.modules.rag.loader import load_embedding_model, get_encoder
from app.modules.rag.vector_store import vector_store
from app.core.logger import logger

def seed_database():
    """Initializes the ML model locally and injects two fake documents for Verification testing."""
    logger.info("Seeding ChromaDB...")
    
    # Ensure model is locally available outside FastAPI startup
    load_embedding_model()
    model = get_encoder()
    
    # Sample Knowledge items
    docs = [
        "To prune unused docker images, use the command: docker image prune -a. This will remove all images not referenced by any container locally.",
        "To switch git branches and create one if it doesn't exist, use git checkout -b your-branch-name."
    ]
    ids = ["docker_prune_01", "git_checkout_01"]
    metadatas = [{"topic": "docker", "source": "linux_guides"}, {"topic": "git", "source": "devtools"}]
    
    # Create bulk tensor array 
    embeddings = model.encode(docs).tolist()
    
    # Insert safely into local filestore
    vector_store.add_documents(
        ids=ids, 
        documents=docs, 
        embeddings=embeddings, 
        metadatas=metadatas
    )
    
    logger.info("Semantic Data successfully ingested into the RAG Hub.")

if __name__ == "__main__":
    seed_database()
