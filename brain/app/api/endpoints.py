from fastapi import APIRouter
from app.schemas.rag_schema import RAGQueryRequest, RAGQueryResponse
from app.modules.rag.predictor import execute_rag_search
from app.core.logger import logger

router = APIRouter(prefix="/rag", tags=["Knowledge Hub"])

@router.post("/search", response_model=RAGQueryResponse)
async def search_knowledge_base(request: RAGQueryRequest):
    """
    Semantic search over the embedded Markdown Knowledge Hub.
    Delegates heavy embedding calculations to the Starlette ThreadPool.
    """
    logger.info(f"Incoming /rag/search request: query='{request.query}' limit={request.top_k}")
    
    # execute_rag_search is a blocking 'def'. 
    # FastAPI automatically runs it in a background thread to keep event loop free.
    response_data = execute_rag_search(query=request.query, top_k=request.top_k)
    
    return RAGQueryResponse(
        query=request.query,
        results=response_data["results"],
        latency_ms=response_data["latency_ms"]
    )
