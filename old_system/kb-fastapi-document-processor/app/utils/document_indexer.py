import logging
from typing import List, Dict, Any
from upstash_vector import Index, Vector
from app.config import get_settings

logger = logging.getLogger(__name__)


class DocumentIndexer:
    """Handles vector database operations using Upstash"""

    def __init__(self):
        self.settings = get_settings()
        self._initialize_indices()

    def _test_connection(self, index: Index, category: str) -> bool:
        """Test the connection to an Upstash index"""
        try:
            # Try a simple query operation to test the connection
            # Query with a dummy vector of the correct dimension (768 for your model)
            test_vector = [0.0] * 768
            index.query(vector=test_vector, top_k=1)
            logger.info(f"Successfully connected to {category} index")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to {category} index: {str(e)}")
            return False

    def _initialize_indices(self):
        """Initialize connections to different Upstash indices based on knowledge categories"""
        try:
            # Create index connections for each knowledge category
            indices_config = {
                "books": (
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_BOOKS_INDEX_REST_URL.strip(),
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_BOOKS_INDEX_REST_TOKEN.strip().strip(
                        '"'
                    ),
                ),
                "laws": (
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_LAWS_INDEX_REST_URL.strip(),
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_LAWS_INDEX_REST_TOKEN.strip().strip(
                        '"'
                    ),
                ),
                "legalcases": (
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_LEGALCASES_INDEX_REST_URL.strip(),
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_LEGALCASES_INDEX_REST_TOKEN.strip().strip(
                        '"'
                    ),
                ),
                "other": (
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_OTHER_INDEX_REST_URL.strip(),
                    self.settings.UPSTASH_IBBEN_KNOWLEDGE_OTHER_INDEX_REST_TOKEN.strip().strip(
                        '"'
                    ),
                ),
            }

            self.indices = {}
            for category, (url, token) in indices_config.items():
                logger.debug(f"Initializing {category} index:")
                logger.debug(f"URL: {url}")
                logger.debug(f"Token (first 10 chars): {token[:10]}...")

                try:
                    index = Index(url=url, token=token)
                    if self._test_connection(index, category):
                        self.indices[category] = index
                    else:
                        logger.error(
                            f"Failed to initialize {category} index - connection test failed"
                        )
                except Exception as e:
                    logger.error(f"Error creating {category} index: {str(e)}")
                    raise

            if not self.indices:
                raise Exception("No indices were successfully initialized")

            logger.info(
                f"Successfully initialized {len(self.indices)} Upstash vector indices"
            )

        except Exception as e:
            logger.error(f"Error initializing Upstash indices: {str(e)}", exc_info=True)
            raise

    def index_chunks(
        self, chunks: List[Dict[str, Any]], knowledge_category: str, document_id: str
    ) -> Dict[str, Any]:
        """
        Index chunks in the appropriate Upstash vector index based on knowledge category.

        Args:
            chunks: List of processed chunks with embeddings
            knowledge_category: Category of the document (books, laws, legalcases, other)
            document_id: Unique identifier for the document (e.g., S3 key)

        Returns:
            Dict containing indexing statistics
        """
        try:
            if knowledge_category not in self.indices:
                raise ValueError(f"Invalid knowledge category: {knowledge_category}")

            index = self.indices[knowledge_category]
            vectors = []
            indexed_count = 0
            error_count = 0

            logger.info(
                f"Indexing {len(chunks)} chunks for document {document_id} "
                f"in {knowledge_category} index"
            )

            for i, chunk in enumerate(chunks):
                try:
                    # Skip chunks without embeddings
                    if "embedding_error" in chunk.get("metadata", {}):
                        logger.warning(f"Skipping chunk {i}: no valid embedding")
                        error_count += 1
                        continue

                    # Create unique ID for the chunk
                    chunk_id = f"{document_id}_chunk_{i}"

                    # Prepare metadata (excluding the embedding itself)
                    metadata = chunk.get("metadata", {}).copy()
                    embedding = metadata.pop("embedding", None)

                    if embedding is None:
                        logger.warning(
                            f"Skipping chunk {i}: no embedding found in metadata"
                        )
                        error_count += 1
                        continue

                    # Add document and chunk identification to metadata
                    metadata.update(
                        {
                            "document_id": document_id,
                            "chunk_id": chunk_id,
                            "chunk_index": i,
                            "knowledge_category": knowledge_category,
                            "text": chunk.get(
                                "text", ""
                            ),  # Store the text in metadata for retrieval
                        }
                    )

                    # Create vector object
                    vector = Vector(
                        id=chunk_id,
                        vector=embedding,
                        metadata=metadata,
                    )
                    vectors.append(vector)
                    indexed_count += 1

                except Exception as e:
                    logger.error(f"Error processing chunk {i}: {str(e)}")
                    error_count += 1

            # Batch upsert vectors
            if vectors:
                try:
                    # Log the first vector's structure for debugging
                    logger.debug(
                        f"Sample vector structure: id={vectors[0].id}, vector_length={len(vectors[0].vector)}, metadata_keys={list(vectors[0].metadata.keys())}"
                    )

                    index.upsert(vectors=vectors)
                    logger.info(
                        f"Successfully indexed {len(vectors)} vectors in {knowledge_category} index"
                    )
                except Exception as e:
                    logger.error(f"Error upserting vectors: {str(e)}")
                    error_count += len(vectors)
                    indexed_count = 0

            return {
                "knowledge_category": knowledge_category,
                "document_id": document_id,
                "total_chunks": len(chunks),
                "indexed_chunks": indexed_count,
                "failed_chunks": error_count,
            }

        except Exception as e:
            logger.error(f"Error during indexing: {str(e)}", exc_info=True)
            raise
