import os
import warnings
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from redis import Redis as Valkey
from rq import Queue

# Suppress Hugging Face/Transformers warnings
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")

load_dotenv()

app = FastAPI(title="PDF RAG Agent API", description="API server for querying PDF textbook databases")

# Enable CORS so your frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL")
if redis_url:
    redis_url = redis_url.strip()
    valkey_conn = Valkey.from_url(redis_url)
    print("🔌 Connected to Valkey via connection URL string.")
else:
    redis_host = os.getenv("REDIS_HOST", "127.0.0.1")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    valkey_conn = Valkey(host=redis_host, port=redis_port)
    print(f"🔌 Connected to Valkey at {redis_host}:{redis_port}.")
q = Queue(connection=valkey_conn)

# Lazy-loaded Vector Store to minimize RAM footprint of FastAPI main thread
vector_store = None

def get_vector_store():
    global vector_store
    if vector_store is not None:
        return vector_store

    from langchain_openai import OpenAIEmbeddings
    from langchain_qdrant import QdrantVectorStore

    embeddings = OpenAIEmbeddings(
        model='text-embedding-3-small',
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    try:
        print("✨ Attempting to connect to Qdrant Cloud...")
        vector_store = QdrantVectorStore.from_existing_collection(
            collection_name=os.getenv("QDRANT_COLLECTION"),
            embedding=embeddings,
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=120
        )
        print("✅ Connected successfully to Qdrant Cloud!")
    except Exception as e:
        print(f"\n⚠️ Qdrant Cloud connection failed: {e}")
        print("Falling back to local Qdrant Vector database...")
        local_db_path = "./qdrant_db"
        if not os.path.exists(local_db_path):
            raise RuntimeError("Local database directory './qdrant_db' not found. Please run main.py first to build the index!")
        vector_store = QdrantVectorStore.from_existing_collection(
            collection_name="local_pdf_collection",
            embedding=embeddings,
            path=local_db_path
        )
        print("✅ Connected successfully to local Qdrant!")
    return vector_store

# Define job task for background execution by RQ Worker
def process_rag_job(question: str, selected_algorithm: str, algorithm_label: str, model: str = "gpt-4o-mini"):
    """
    Background job function executed by the RQ worker.
    Generates embedding, searches Qdrant, calls the LLM, and formats response citations.
    """
    # Resolve vector store lazily to ensure worker has connection context
    v_store = get_vector_store()
    
    # 1. Similarity Search in Qdrant Vector Store
    relevant_chunks = v_store.similarity_search(question, k=4)
    context = "\n\n".join([chunk.page_content for chunk in relevant_chunks])
    
    # 2. Extract citations
    citations = []
    for chunk in relevant_chunks:
        meta = chunk.metadata or {}
        citations.append({
            "title": meta.get("title", "Advanced Data Structures"),
            "author": meta.get("author", "Peter Brass"),
            "page": meta.get("page_label", meta.get("page", "N/A")),
            "snippet": chunk.page_content,
            "source": meta.get("source", "")
        })

    # 3. Format system/tutor prompt
    prompt = f"""You are an expert computer science tutor specializing in Algorithms and Data Structures. 
Your goal is to answer the user's question comprehensively, educationally, and concisely, using the provided textbook context as your primary source of truth.
The user is currently studying the algorithm: "{algorithm_label}" (ID: {selected_algorithm}). If relevant, tie your answer back to this algorithm.

Before answering, you must write out your step-by-step reasoning process inside a <thought> and </thought> block.
Inside your thoughts:
- Analyze the user's question.
- Identify which parts of the retrieved textbook context are relevant vs. irrelevant.
- Outline your answer structure (e.g. core definitions, key steps, specific textbook facts, general computer science extensions).
- Draft your reasoning logically and verify any code fragments or complexity traces.

Following the </thought> block, present your clear, student-facing, and pedagogically rich final tutor response. 
- Use the context where relevant.
- Supplement with standard computer science foundations for broad conceptual queries, explaining clearly that you are doing so.
- Keep the response neat and use markdown formatting (like bolding and code blocks) where helpful.

Context from textbooks:
{context}

Question: {question}
Answer:"""

    # 4. Call LLM
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        model=model,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    answer = llm.invoke(prompt)
    
    # 5. Parse out thought reasoning blocks
    raw_response = answer.content
    thought = ""
    content = raw_response
    
    thought_start_tag = "<thought>"
    thought_end_tag = "</thought>"
    start_idx = raw_response.find(thought_start_tag)
    end_idx = raw_response.find(thought_end_tag)
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        thought = raw_response[start_idx + len(thought_start_tag):end_idx].strip()
        content = (raw_response[:start_idx] + raw_response[end_idx + len(thought_end_tag):]).strip()
    elif start_idx != -1:
        thought = raw_response[start_idx + len(thought_start_tag):].strip()
        content = raw_response[:start_idx].strip()
        
    return {
        "content": content,
        "thought": thought,
        "citations": citations
    }

# FastAPI Schemas
class QueryRequest(BaseModel):
    question: str
    selected_algorithm: str
    algorithm_label: str
    model: str = "gpt-4o-mini"

class QueryResponse(BaseModel):
    job_id: str
    status: str

# Endpoints
@app.post("/api/chat", response_model=QueryResponse)
async def chat_endpoint(request: QueryRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        # Queue the job in Redis
        job = q.enqueue(
            process_rag_job, 
            question, 
            request.selected_algorithm, 
            request.algorithm_label,
            request.model,
            job_timeout="3m"
        )
        return QueryResponse(job_id=job.id, status=job.get_status())
    except Exception as e:
        print(f"Error enqueuing job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to enqueue task in Redis: {str(e)}")

@app.get("/api/chat/status/{job_id}")
async def chat_job_status(job_id: str):
    try:
        job = q.fetch_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": job.id,
            "status": job.get_status(),
            "result": job.result if job.is_finished else None,
            "error": str(job.exc_info) if job.is_failed else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    redis_url = os.getenv("REDIS_URL")
    qdrant_url = os.getenv("QDRANT_URL")
    
    masked_redis = "not set"
    if redis_url:
        try:
            parts = redis_url.split("@")
            if len(parts) > 1:
                masked_redis = f"rediss://***@{parts[-1]}"
            else:
                masked_redis = "set (no @ separator)"
        except Exception as e:
            masked_redis = f"set (error masking: {str(e)})"
            
    from rq import Worker
    active_workers = []
    queue_count = 0
    queue_jobs = []
    redis_ping = False
    try:
        redis_ping = valkey_conn.ping()
        workers = Worker.all(connection=valkey_conn)
        active_workers = [{"name": w.name, "state": w.get_state(), "queues": w.queue_names} for w in workers]
        queue_count = q.count
        queue_jobs = q.job_ids
    except Exception as e:
        active_workers = f"Error: {str(e)}"

    return {
        "status": "healthy",
        "redis_url_configured": masked_redis,
        "redis_ping_success": redis_ping,
        "redis_host_env": os.getenv("REDIS_HOST"),
        "redis_port_env": os.getenv("REDIS_PORT"),
        "qdrant_url_set": bool(qdrant_url),
        "qdrant_collection": os.getenv("QDRANT_COLLECTION"),
        "active_workers": active_workers,
        "queue_count": queue_count,
        "queue_jobs": queue_jobs
    }

import subprocess
import sys

def start_worker_process():
    print("🚀 Starting Valkey RQ Background Worker Subprocess...")
    try:
        # Popen spawns the worker in its own process, so it has its own main thread
        subprocess.Popen([sys.executable, "worker.py"])
        print("✅ Valkey RQ Background Worker Subprocess spawned successfully.")
    except Exception as e:
        print(f"❌ Failed to spawn background worker subprocess: {str(e)}")

@app.on_event("startup")
def startup_event():
    start_worker_process()

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 and resolve PORT dynamically from environment for Render deployment
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
