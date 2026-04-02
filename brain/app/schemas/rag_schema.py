from pydantic import BaseModel, Field

class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="The search query from telegram")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of context snippets to retrieve")

class RAGQueryResponse(BaseModel):
    query: str
    results: list[dict] = Field(..., description="List of matched documents and metadata")
    latency_ms: float = Field(..., description="Inference and retrieval time in milliseconds")
