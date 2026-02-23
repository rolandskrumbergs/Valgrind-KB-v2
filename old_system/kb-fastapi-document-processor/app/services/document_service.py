import os
import logging
import time
from typing import List, Dict, Any
from app.utils.document_processor import DocumentProcessor
from app.utils.document_partitioner import DocumentPartitioner
from app.utils.document_embedder import DocumentEmbedder
from app.utils.document_indexer import DocumentIndexer
from app.utils.document_cleaner import DocumentCleaner
from app.utils.document_chunker import DocumentChunker
from app.utils.document_db import DocumentDB
from app.config import get_settings, reload_settings

logger = logging.getLogger(__name__)


class ProcessingStage:
    DOWNLOAD = "download"
    PARTITION = "partition"
    CLEAN = "clean"
    CHUNK = "chunk"
    EMBED = "embed"
    INDEX = "index"


class DocumentService:
    def __init__(self):
        # Reload settings to ensure we have the latest configuration
        reload_settings()
        self.settings = get_settings()
        self.document_processor = DocumentProcessor(
            aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
            region=self.settings.AWS_REGION,
        )
        self.document_chunker = DocumentChunker()
        self.document_embedder = DocumentEmbedder()
        self.document_indexer = DocumentIndexer()
        self.db = DocumentDB()

    async def process_document(self, s3_url: str) -> Dict[str, Any]:
        """
        Process a document from S3 including chunking, embedding, and indexing
        """
        local_path = None
        start_time = time.time()
        current_stage = None
        content_hash = None

        try:
            # Initialize database connection
            await self.db.initialize()
            logger.info(f"Starting document processing pipeline for: {s3_url}")

            # Get current chunking config
            chunk_config = self.settings.chunking_config
            logger.debug(f"Using chunk config: {chunk_config}")

            # Start Download Stage
            current_stage = ProcessingStage.DOWNLOAD
            logger.info(f"[Stage: {current_stage}] Downloading document from S3")

            # Update DB status to downloading
            content_hash = self.document_processor.get_content_hash(s3_url)
            logger.info(f"Document content hash: {content_hash[:8]}...")

            await self.db.update_processing_status(
                content_hash,
                "downloading",
                stage_progress={
                    "stage": current_stage,
                    "progress": 0,
                    "message": f"Downloading document from {s3_url}",
                },
            )

            local_path = self.document_processor.download_from_s3(s3_url)
            document_metadata = self.document_processor.get_s3_metadata(s3_url)

            # Log document details
            file_size = os.path.getsize(local_path) if local_path else 0
            file_name = os.path.basename(local_path) if local_path else "unknown"
            logger.info(
                f"Downloaded document details:\n"
                f"  - File: {file_name}\n"
                f"  - Size: {file_size / 1024:.2f} KB\n"
                f"  - Local path: {local_path}"
            )

            download_time = time.time() - start_time
            logger.info(f"[Stage: {current_stage}] Completed in {download_time:.2f}s")

            # Start Partition Stage
            current_stage = ProcessingStage.PARTITION
            partition_start = time.time()
            logger.info(f"[Stage: {current_stage}] Partitioning document into elements")

            await self.db.update_processing_status(
                content_hash,
                "partitioning",
                stage_progress={
                    "stage": current_stage,
                    "progress": 0,
                    "message": "Partitioning document into elements",
                },
            )

            elements = DocumentPartitioner.partition_document(local_path)
            partition_time = time.time() - partition_start
            logger.info(
                f"[Stage: {current_stage}] Extracted {len(elements)} elements in {partition_time:.2f}s"
            )

            # Start Cleaning Stage
            current_stage = ProcessingStage.CLEAN
            clean_start = time.time()
            logger.info(f"[Stage: {current_stage}] Cleaning document elements")

            await self.db.update_processing_status(
                content_hash,
                "cleaning",
                stage_progress={
                    "stage": current_stage,
                    "progress": 0,
                    "message": "Cleaning document elements",
                },
            )

            cleaned_elements, cleaning_stats = DocumentCleaner.clean_elements(elements)
            clean_time = time.time() - clean_start
            logger.info(
                f"[Stage: {current_stage}] Cleaned {len(cleaned_elements)} elements in {clean_time:.2f}s\n"
                f"  - Removed empty elements: {cleaning_stats['empty_elements_removed']}\n"
                f"  - Removed symbol-only elements: {cleaning_stats['symbol_only_elements_removed']}"
            )

            # Start Chunking Stage
            current_stage = ProcessingStage.CHUNK
            chunk_start = time.time()
            logger.info(f"[Stage: {current_stage}] Creating chunks")

            await self.db.update_processing_status(
                content_hash,
                "chunking",
                stage_progress={
                    "stage": current_stage,
                    "progress": 0,
                    "message": f"Creating chunks with config: {chunk_config}",
                },
            )

            chunks, chunk_metrics = self.document_chunker.chunk_elements(
                cleaned_elements, chunk_config
            )
            chunk_time = time.time() - chunk_start
            logger.info(
                f"[Stage: {current_stage}] Created {len(chunks)} chunks in {chunk_time:.2f}s\n"
                f"  - Average size: {chunk_metrics.avg_chunk_size:.0f} chars\n"
                f"  - Max size: {chunk_metrics.max_chunk_size}\n"
                f"  - Min size: {chunk_metrics.min_chunk_size}"
            )

            # Update chunk metrics
            await self.db.update_processing_metrics(
                content_hash,
                chunk_metrics={
                    "avg_size": chunk_metrics.avg_chunk_size,
                    "max_size": chunk_metrics.max_chunk_size,
                    "min_size": chunk_metrics.min_chunk_size,
                    "total_chunks": chunk_metrics.total_chunks,
                    "chunking_config": chunk_config._asdict(),
                },
                total_chunks=len(chunks),
            )

            # Start Embedding Stage
            current_stage = ProcessingStage.EMBED
            embed_start = time.time()
            logger.info(f"[Stage: {current_stage}] Generating embeddings")

            await self.db.update_processing_status(
                content_hash,
                "embedding",
                stage_progress={
                    "stage": current_stage,
                    "progress": 0,
                    "message": "Generating embeddings for chunks",
                },
            )

            embedded_chunks = self.document_embedder.generate_embeddings(chunks)
            embed_time = time.time() - embed_start
            logger.info(
                f"[Stage: {current_stage}] Embedded {len(embedded_chunks)} chunks in {embed_time:.2f}s"
            )

            # Update embedding results
            await self.db.update_processing_metrics(
                content_hash,
                embedding_results={
                    "total_embedded": len(embedded_chunks),
                    "embedding_model": embedded_chunks[0]["metadata"][
                        "embedding_model"
                    ],
                    "embedding_dimension": embedded_chunks[0]["metadata"][
                        "embedding_dimension"
                    ],
                    "chunks_sample": [
                        {
                            "text": (
                                chunk["text"][:500] + "..."
                                if len(chunk["text"]) > 500
                                else chunk["text"]
                            ),
                            "type": chunk["type"],
                            "size": chunk["size"],
                            "embedding_dimension": chunk["metadata"].get(
                                "embedding_dimension"
                            ),
                            "embedding_model": chunk["metadata"].get("embedding_model"),
                        }
                        for chunk in embedded_chunks[:5]
                    ],
                },
            )

            # Start Indexing Stage
            current_stage = ProcessingStage.INDEX
            index_start = time.time()
            logger.info(f"[Stage: {current_stage}] Indexing chunks in vector store")

            await self.db.update_processing_status(
                content_hash,
                "indexing",
                stage_progress={
                    "stage": current_stage,
                    "progress": 0,
                    "message": "Indexing chunks in vector store",
                },
            )

            # Process chunks in batches
            BATCH_SIZE = 1000
            total_chunks = len(embedded_chunks)
            logger.info(f"Processing {total_chunks} chunks (batch size: {BATCH_SIZE})")

            # Index all chunks
            indexing_result = self.document_indexer.index_chunks(
                embedded_chunks,
                document_metadata.get("x-amz-meta-category", "other").lower(),
                document_metadata.get("document_id", s3_url.split("/")[-1]),
            )

            total_indexed = indexing_result["indexed_chunks"]
            total_failed = indexing_result["failed_chunks"]
            index_time = time.time() - index_start
            logger.info(
                f"[Stage: {current_stage}] Indexing completed in {index_time:.2f}s\n"
                f"  - Successfully indexed: {total_indexed}/{total_chunks} chunks\n"
                f"  - Failed chunks: {total_failed}"
            )

            # Update final metrics
            total_time = time.time() - start_time
            logger.info(f"Total processing time: {total_time:.2f}s")

            await self.db.update_processing_metrics(
                content_hash,
                processing_time={
                    "download": download_time,
                    "partition": partition_time,
                    "clean": clean_time,
                    "chunk": chunk_time,
                    "embed": embed_time,
                    "index": index_time,
                    "total": total_time,
                },
                total_indexed_chunks=total_indexed,
                total_failed_chunks=total_failed,
                indexing_results={
                    "total_chunks": total_chunks,
                    "indexed_chunks": total_indexed,
                    "failed_chunks": total_failed,
                    "indexing_stats": indexing_result,
                },
                processing_message=f"Document processed successfully with {total_indexed}/{total_chunks} chunks indexed",
            )

            # Update final status
            await self.db.update_processing_status(
                content_hash,
                "completed",
                stage_progress={
                    "stage": "completed",
                    "progress": 100,
                    "message": f"Processing completed successfully in {total_time:.2f}s",
                },
            )

            logger.info("Document processing completed successfully")
            return {
                "status": "success" if total_failed == 0 else "partial_success",
                "message": f"Document processed with {total_indexed}/{total_chunks} chunks indexed successfully",
                "s3_url": s3_url,
                "document_id": document_metadata.get(
                    "document_id", s3_url.split("/")[-1]
                ),
                "knowledge_category": document_metadata.get(
                    "x-amz-meta-knowledgecategory", "other"
                ).lower(),
                "processing_time": {
                    "download": download_time,
                    "partition": partition_time,
                    "clean": clean_time,
                    "chunk": chunk_time,
                    "embed": embed_time,
                    "index": index_time,
                    "total": total_time,
                },
                "chunk_phase_results": {
                    "total_chunks": len(chunks),
                    "chunk_metrics": {
                        "avg_size": chunk_metrics.avg_chunk_size,
                        "max_size": chunk_metrics.max_chunk_size,
                        "min_size": chunk_metrics.min_chunk_size,
                        "total_chunks": chunk_metrics.total_chunks,
                    },
                    "chunking_config": chunk_config._asdict(),
                },
                "embed_phase_results": {
                    "total_embedded": len(embedded_chunks),
                    "processing_time": {"embed": embed_time},
                    "chunks_sample": [
                        {
                            "text": (
                                chunk["text"][:500] + "..."
                                if len(chunk["text"]) > 500
                                else chunk["text"]
                            ),
                            "type": chunk["type"],
                            "size": chunk["size"],
                            "embedding_dimension": chunk["metadata"].get(
                                "embedding_dimension"
                            ),
                            "embedding_model": chunk["metadata"].get("embedding_model"),
                        }
                        for chunk in embedded_chunks[:5]
                    ],
                },
                "index_phase_results": {
                    "total_chunks": total_chunks,
                    "indexed_chunks": total_indexed,
                    "failed_chunks": total_failed,
                    "processing_time": {"index": index_time},
                    "indexing_stats": indexing_result,
                },
            }

        except Exception as e:
            total_time = time.time() - start_time
            logger.error(
                f"Error in {current_stage} stage after {total_time:.2f}s: {str(e)}",
                exc_info=True,
            )

            if content_hash:
                await self.db.update_error(
                    content_hash, str(e), current_stage or "unknown"
                )

            if local_path and os.path.exists(local_path):
                logger.debug(f"Cleaning up temporary file: {local_path}")
                os.remove(local_path)
            raise

        finally:
            if local_path and os.path.exists(local_path):
                logger.debug(f"Cleaning up temporary file: {local_path}")
                os.remove(local_path)
            # Close database connection
            await self.db.close()
            logger.debug("Closed database connection")

    def get_supported_file_types(self) -> List[str]:
        """Return a list of supported file extensions"""
        return list(DocumentPartitioner.SUPPORTED_MIME_TYPES.keys())
