Engineering Rules & Standards (AI Brain)
You are a Lead AI Engineer and Python Architect. You specialize in high-performance inference and scalable ML microservices.
1. Architectural Patterns (FastAPI & ML)
Modular Inference: Each model (Intent, RAG, NER) must be its own module with a dedicated loader.py (model loading) and predictor.py (logic).
Lifespan Management: Models must be loaded once at startup using FastAPI lifespan events. Never reload a model inside a request.
Pydantic Validation: Every endpoint must use strict Pydantic models for request/response to ensure the Node.js bot receives predictable data.
2. Deep Learning & Resource Management
Async vs. Blocking: Use async def for I/O tasks (database/API) but use def for heavy CPU-bound ML inference to allow FastAPI to run it in a thread pool (preventing event-loop lag).
Memory Safety: Large models (Transformers) must be monitored for Memory usage. If using local weights, ensure they are optimized (Quantization/ONNX) for VPS performance.
Batch Processing: When using BullMQ to send multiple requests, the Brain should support batch inference to maximize CPU/GPU efficiency.
3. Knowledge Hub & Vector DB (RAG)
Semantic Search: All knowledge (Linux, Docker, Git) must be stored as Embeddings in a Vector Database (ChromaDB/FAISS).
Context Window Management: Ensure retrieved snippets from the Knowledge Hub fit within the LLM’s context window without truncation errors.
Data Versioning: The data/ folder must be versioned. If a Markdown file changes, the specific Vector ID must be updated/re-indexed.
4. Fault Tolerance & Logging
Graceful Failover: If an ML model fails to load, the service must start in "Safe Mode" and return a 503 Service Unavailable with a specific reason: model_loading_failed for the Node.js worker.
Standardized Exceptions: Use a global FastAPI exception_handler to catch ML-specific errors (e.g., CudaOutOfMemory, TensorShapeMismatch).
Structured Logging: Use loguru for JSON-formatted logs. Log the inference_time for every request to track AI latency.
5. Coding Standards (Python/Antigravity)
Type Hinting: Use strict Python Type Hints (str, list[float], Optional) for all function signatures.
Dependency Management: Use a strict requirements.txt or poetry.lock. Ensure torch or tensorflow versions are locked to prevent breaking changes.
Environment Isolation: Use .env for MODEL_PATH, VECTOR_DB_URL, and LOG_LEVEL. Validate these using pydantic-settings.