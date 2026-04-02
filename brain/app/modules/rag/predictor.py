import time
from app.modules.rag.loader import get_encoder
from app.modules.rag.vector_store import vector_store
from app.core.logger import logger

def encode_query(query: str) -> list[float]:
    """
    BLOCKING: Generate embeddings.
    Wrapped in standard def so FastAPI executes this in a threadpool
    away from the async event loop to prevent latency freezing for async IO endpoints.
    """
    model = get_encoder()
    # SentenceTransformer encode returns numpy array. Convert to flat python list.
    embedding = model.encode(query).tolist()
    return embedding

def execute_rag_search(query: str, top_k: int) -> dict:
    """
    BLOCKING: Orchestrates ML Embedding -> Vector Retrieval.
    """
    start_time = time.perf_counter()
    
    logger.debug(f"Encoding query via CPU Threadpool: '{query}'")
    query_embedding = encode_query(query)
    
    logger.debug("Executing Vector Store search...")
    results = vector_store.search(query_embedding, top_k=top_k)
    
    latency = (time.perf_counter() - start_time) * 1000 # ms
    logger.info(f"RAG Search completed in {latency:.2f}ms")
    
    # Format the ChromaDB response into a clean list of dicts
    formatted_results = []
    if results['documents'] and len(results['documents']) > 0:
        docs = results['documents'][0]
        metas = results['metadatas'][0] if results['metadatas'] else [{}] * len(docs)
        distances = results['distances'][0] if results['distances'] else [0.0] * len(docs)
        
        for doc, meta, dist in zip(docs, metas, distances):
            formatted_results.append({
                "content": doc,
                "metadata": meta,
                "score": float(dist)
            })
            
    return {
        "results": formatted_results,
        "latency_ms": latency
    }
