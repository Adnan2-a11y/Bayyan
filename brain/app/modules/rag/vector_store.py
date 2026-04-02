import chromadb
from chromadb.config import Settings
from app.core.config import settings
from app.core.logger import logger

class VectorStore:
    def __init__(self):
        # Initialize Persistent ChromaDB Client
        logger.info(f"Initializing Persistent ChromaDB Client at '{settings.vector_db_url}'...")
        self.client = chromadb.PersistentClient(path=settings.vector_db_url)
        
        # Create or Get the main RAG collection
        self.collection = self.client.get_or_create_collection(
            name="linux_docker_guides",
            metadata={"hnsw:space": "cosine"} # Cosine similarity for sentence transformers
        )
    
    def add_documents(self, ids: list[str], documents: list[str], embeddings: list[list[float]], metadatas: list[dict] = None):
        """Add context strictly via pre-computed embeddings."""
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def search(self, query_embedding: list[float], top_k: int = 3):
        """Perform cosine similarity semantic search"""
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

# Global singleton client instance initialized lazily or on startup depending on requirements
vector_store = VectorStore()
