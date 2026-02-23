from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from dotenv import load_dotenv
import os
import time
import psutil
import logging
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

# Configure logging
log_level = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=log_level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add performance monitoring
ENABLE_PERFORMANCE_MONITORING = (
    os.getenv("ENABLE_PERFORMANCE_MONITORING", "true").lower() == "true"
)


def get_client_ip(request: Request) -> str:
    """Get the real client IP from X-Forwarded-For header or fallback to client.host"""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()
    return request.client.host


def get_process_memory():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024  # Convert to MB


class PerformanceMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or not ENABLE_PERFORMANCE_MONITORING:
            return await self.app(scope, receive, send)

        start_time = time.time()
        start_memory = get_process_memory()

        # Create a new send function to modify response headers
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Add custom headers to the response
                headers = message.get("headers", [])
                process_time = time.time() - start_time
                memory_used = get_process_memory() - start_memory

                headers.extend(
                    [
                        (b"X-Process-Time", str(process_time).encode()),
                        (b"X-Memory-Used", f"{memory_used:.2f}MB".encode()),
                    ]
                )
                message["headers"] = headers

                # Log the performance metrics
                request = Request(scope)
                client_ip = get_client_ip(request)
                logger.info(
                    f"Request from {client_ip} processed in {process_time:.2f}s using {memory_used:.2f}MB memory"
                )

            await send(message)

        await self.app(scope, receive, send_wrapper)


app = FastAPI(
    title="Ibben Text Embedding API",
    description="API for generating text embeddings using sentence-transformers",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model at startup
try:
    model = SentenceTransformer("/app/model")
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise


class TextInput(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    embeddings: List[float]


# Fix the middleware application - move it before route definitions
app.add_middleware(PerformanceMiddleware)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model": "KBLab/sentence-bert-swedish-cased (local)",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Text Embedding APIs",
        "status": "healthy",
        "model": "KBLab/sentence-bert-swedish-cased (local)",
    }


@app.post("/embed", response_model=EmbeddingResponse)
async def get_embedding(input_data: TextInput, request: Request):
    try:
        if not input_data.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty")

        if len(input_data.text) > 5000:  # Limit text length
            raise HTTPException(
                status_code=400,
                detail="Text input too long. Maximum length is 5000 characters",
            )

        # Generate embeddings
        embeddings = model.encode([input_data.text])

        # Log request information with real client IP and truncated input text
        truncated_text = (
            input_data.text[:100] + "..."
            if len(input_data.text) > 100
            else input_data.text
        )
        logger.info(
            f"Incoming request for text: '{truncated_text}' "
            f"(length: {len(input_data.text)})"
        )

        # Convert numpy array to list for JSON serialization
        embeddings_list = embeddings[0].tolist()

        return {"embeddings": embeddings_list}
    except Exception as e:
        logger.error(
            f"Error generating embeddings for text: '{truncated_text}'. Error: {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Error generating embeddings")
