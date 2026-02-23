import logging
from typing import List, Dict, Any, Union
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import get_settings
import time

logger = logging.getLogger(__name__)


class DocumentEmbedder:
    """Handles document embedding generation using sentence transformers"""

    def __init__(self):
        self.settings = get_settings()
        self._load_model()

    def _load_model(self):
        """Load the embedding model specified in settings"""
        try:
            logger.info(f"Loading embedding model: {self.settings.MODEL_NAME}")
            start_time = time.time()
            self.model = SentenceTransformer("/app/model")
            self.embedding_dimension = self.model.get_sentence_embedding_dimension()
            load_time = time.time() - start_time
            logger.info(
                f"Model loaded successfully in {load_time:.2f}s. Dimension: {self.embedding_dimension}"
            )
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}", exc_info=True)
            raise

    def generate_embeddings(
        self, chunks: List[Dict[str, Any]], batch_size: int = 32, max_retries: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate embeddings for a list of chunks with improved reliability and efficiency.

        Args:
            chunks: List of chunk dictionaries containing text and metadata
            batch_size: Number of chunks to process at once (for memory efficiency)
            max_retries: Maximum number of retries for failed batches

        Returns:
            List of chunks with embeddings added to their metadata
        """
        try:
            if not chunks:
                logger.warning("No chunks provided for embedding generation")
                return []

            start_time = time.time()
            total_chunks = len(chunks)
            logger.info(f"Starting embedding generation for {total_chunks} chunks")

            # Extract and validate texts from chunks
            texts = []
            valid_chunk_indices = []
            for i, chunk in enumerate(chunks):
                if not chunk.get("text"):
                    continue
                texts.append(chunk["text"])
                valid_chunk_indices.append(i)

            if not texts:
                logger.warning("No valid texts found in chunks")
                return chunks

            # Calculate optimal batch size based on available GPU memory (if using GPU)
            if str(self.model.device).startswith("cuda"):
                avg_length = sum(len(text) for text in texts) / len(texts)
                if avg_length > 1000:
                    adjusted_batch_size = max(
                        1, min(batch_size, int(batch_size * (1000 / avg_length)))
                    )
                    if adjusted_batch_size != batch_size:
                        batch_size = adjusted_batch_size

            # Generate embeddings in batches with retry mechanism
            all_embeddings = []
            total_batches = (len(texts) - 1) // batch_size + 1

            for batch_idx in range(total_batches):
                batch_start = batch_idx * batch_size
                batch_texts = texts[batch_start : batch_start + batch_size]
                batch_indices = valid_chunk_indices[
                    batch_start : batch_start + batch_size
                ]

                for retry in range(max_retries):
                    try:
                        if batch_idx % 5 == 0 or batch_idx == total_batches - 1:
                            logger.info(
                                f"Processing batch {batch_idx + 1}/{total_batches} "
                                f"({((batch_idx + 1) / total_batches * 100):.1f}%)"
                            )

                        # Generate embeddings for the batch
                        batch_embeddings = self.model.encode(
                            batch_texts,
                            show_progress_bar=False,
                            convert_to_numpy=True,
                            normalize_embeddings=True,
                            batch_size=len(batch_texts),
                        )

                        # Basic validation
                        if (
                            not isinstance(batch_embeddings, np.ndarray)
                            or len(batch_embeddings) != len(batch_texts)
                            or batch_embeddings.shape[1] != self.embedding_dimension
                        ):
                            raise ValueError("Invalid embedding output")

                        all_embeddings.extend(batch_embeddings)
                        break

                    except Exception as e:
                        if retry < max_retries - 1:
                            logger.warning(
                                f"Batch {batch_idx + 1} failed (attempt {retry + 1}/{max_retries})"
                            )
                            continue
                        logger.error(
                            f"Batch {batch_idx + 1} failed after {max_retries} attempts"
                        )
                        raise

            # Add embeddings to chunks
            embedded_chunks = []
            for i, chunk in enumerate(chunks):
                embedded_chunk = chunk.copy()
                if i in valid_chunk_indices:
                    embedding_idx = valid_chunk_indices.index(i)
                    embedded_chunk["metadata"] = {
                        **embedded_chunk.get("metadata", {}),
                        "embedding": all_embeddings[embedding_idx].tolist(),
                        "embedding_model": self.settings.MODEL_NAME,
                        "embedding_dimension": self.embedding_dimension,
                    }
                else:
                    embedded_chunk["metadata"] = {
                        **embedded_chunk.get("metadata", {}),
                        "embedding_error": "Invalid or empty text",
                    }
                embedded_chunks.append(embedded_chunk)

            process_time = time.time() - start_time
            logger.info(
                f"Embedding generation completed in {process_time:.2f}s - "
                f"Processed {len(valid_chunk_indices)}/{total_chunks} valid chunks"
            )
            return embedded_chunks

        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}", exc_info=True)
            raise
