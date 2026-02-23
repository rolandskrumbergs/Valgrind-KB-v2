from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
import os
from app.services.document_service import DocumentService
import logging
from typing import Optional
import asyncio
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Processing API",
    description="API for processing documents from S3 and generating embeddings",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DocumentRequest(BaseModel):
    s3_url: str

    @validator("s3_url")
    def validate_s3_url(cls, v):
        if not v.startswith("s3://"):
            raise ValueError("URL must be a valid S3 URL starting with s3://")
        return v


# Initialize document service
document_service = DocumentService()


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Document Processing API",
        "supported_file_types": document_service.get_supported_file_types(),
    }


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    if isinstance(exc, ClientError):
        error_msg = (
            f"AWS Error: {exc.response.get('Error', {}).get('Message', str(exc))}"
        )
    elif isinstance(exc, asyncio.TimeoutError):
        error_msg = "Request timed out"

    logger.error(f"Error processing request: {error_msg}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": error_msg,
            "error_type": exc.__class__.__name__,
        },
    )


@app.post("/process-document")
async def process_document(request: DocumentRequest):
    try:
        # Set a timeout for the entire operation
        result = await asyncio.wait_for(
            document_service.process_document(request.s3_url),
            timeout=300,  # 5 minutes timeout
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Document processing took too long.",
        )
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}", exc_info=True)
        if isinstance(e, ClientError):
            error_msg = (
                f"AWS Error: {e.response.get('Error', {}).get('Message', str(e))}"
            )
            status_code = e.response.get("ResponseMetadata", {}).get(
                "HTTPStatusCode", 500
            )
        else:
            error_msg = str(e)
            status_code = 500

        raise HTTPException(status_code=status_code, detail=error_msg)


@app.get("/health")
async def health_check():
    """Health check endpoint for container monitoring."""
    return {"status": "healthy"}
