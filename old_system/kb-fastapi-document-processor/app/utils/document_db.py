import os
import json
import asyncpg
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class DocumentDB:
    def __init__(self):
        self.pool = None
        self.connection_string = os.getenv("DATABASE_URL")

    async def initialize(self):
        """Initialize the database connection pool"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.connection_string)

    async def close(self):
        """Close the database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def update_processing_status(
        self,
        content_hash: str,
        status: str,
        stage_progress: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ):
        """Update the processing status and related fields for a document"""
        async with self.pool.acquire() as conn:
            current_time = datetime.utcnow()

            if stage_progress:
                stage_progress["started_at"] = current_time.isoformat()

            await conn.execute(
                """
                UPDATE ibben_lena_knowledge_files
                SET processing_status = $1,
                    current_stage_progress = $2,
                    error_message = $3
                WHERE file_hash = $4
                """,
                status,
                json.dumps(stage_progress) if stage_progress else None,
                error_message,
                content_hash,
            )

    async def update_processing_metrics(
        self,
        content_hash: str,
        processing_time: Optional[Dict[str, float]] = None,
        chunk_metrics: Optional[Dict[str, Any]] = None,
        embedding_results: Optional[Dict[str, Any]] = None,
        indexing_results: Optional[Dict[str, Any]] = None,
        total_chunks: Optional[int] = None,
        total_indexed_chunks: Optional[int] = None,
        total_failed_chunks: Optional[int] = None,
        processing_message: Optional[str] = None,
    ):
        """Update processing metrics for a document"""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE ibben_lena_knowledge_files
                SET processing_time = COALESCE($1, processing_time),
                    chunk_metrics = COALESCE($2, chunk_metrics),
                    embedding_results = COALESCE($3, embedding_results),
                    indexing_results = COALESCE($4, indexing_results),
                    total_chunks = COALESCE($5, total_chunks),
                    total_indexed_chunks = COALESCE($6, total_indexed_chunks),
                    total_failed_chunks = COALESCE($7, total_failed_chunks),
                    processing_message = COALESCE($8, processing_message)
                WHERE file_hash = $9
                """,
                json.dumps(processing_time) if processing_time else None,
                json.dumps(chunk_metrics) if chunk_metrics else None,
                json.dumps(embedding_results) if embedding_results else None,
                json.dumps(indexing_results) if indexing_results else None,
                total_chunks,
                total_indexed_chunks,
                total_failed_chunks,
                processing_message,
                content_hash,
            )

    async def update_error(self, content_hash: str, error_message: str, stage: str):
        """Update error status and message for a document"""
        async with self.pool.acquire() as conn:
            current_time = datetime.utcnow()
            stage_progress = {
                "stage": stage,
                "progress": 0,
                "started_at": current_time.isoformat(),
                "message": f"Failed during {stage}: {error_message}",
            }

            await conn.execute(
                """
                UPDATE ibben_lena_knowledge_files
                SET processing_status = 'failed',
                    current_stage_progress = $1,
                    error_message = $2,
                    processing_message = $3
                WHERE file_hash = $4
                """,
                json.dumps(stage_progress),
                error_message,
                f"Processing failed during {stage} stage: {error_message}",
                content_hash,
            )
