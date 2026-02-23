from typing import List, Dict, Any, Tuple, NamedTuple
from dataclasses import dataclass
from app.config import ChunkingConfig
from unstructured.chunking.title import chunk_by_title
from unstructured.chunking.basic import chunk_elements as chunk_basic
from unstructured.documents.elements import CompositeElement, Table, TableChunk
from unstructured.staging.base import convert_to_dict, dict_to_elements


@dataclass
class ChunkMetrics:
    """Tracks metrics about the chunking process."""

    total_chunks: int = 0
    avg_chunk_size: float = 0.0
    max_chunk_size: int = 0
    min_chunk_size: float = float("inf")
    chunk_sizes: List[int] = None

    def __post_init__(self):
        self.chunk_sizes = []

    def update(self, chunk_size: int):
        """Update metrics with a new chunk."""
        self.total_chunks += 1
        self.chunk_sizes.append(chunk_size)
        self.max_chunk_size = max(self.max_chunk_size, chunk_size)
        self.min_chunk_size = min(self.min_chunk_size, chunk_size)
        self.avg_chunk_size = sum(self.chunk_sizes) / len(self.chunk_sizes)


@dataclass
class Chunk:
    """Represents a chunk of text with its metadata."""

    text: str
    type: str  # The type of the first element in the chunk
    metadata: Dict[str, Any]
    size: int
    elements: List[Dict[str, Any]]  # Original elements that make up this chunk


class DocumentChunker:
    def __init__(self):
        self.metrics = ChunkMetrics()

    def _convert_to_unstructured_elements(
        self, elements: List[Dict[str, Any]]
    ) -> List[Any]:
        """Convert our element dictionaries to unstructured's element format."""
        return dict_to_elements(elements)

    def _convert_from_unstructured_chunks(
        self, chunks: List[Any]
    ) -> List[Dict[str, Any]]:
        """
        Convert unstructured's chunks to a standardized dictionary format that aligns with the embedding stage.
        Returns chunks in a format ready for embedding, with all necessary metadata preserved.
        """
        converted_chunks = []

        for chunk in chunks:
            # Convert chunk to dictionary format using unstructured's function
            chunk_dict = convert_to_dict([chunk])[0]
            chunk_text = chunk_dict["text"]
            chunk_size = len(chunk_text)

            # Get the elements if they exist, also using convert_to_dict
            elements = (
                convert_to_dict(chunk.elements) if hasattr(chunk, "elements") else []
            )

            # Extract metadata safely
            metadata = {}
            if hasattr(chunk, "metadata"):
                # Convert ElementMetadata to dictionary
                metadata = {
                    # "coordinates": getattr(chunk.metadata, "coordinates", None),
                    # "filetype": getattr(chunk.metadata, "filetype", None),
                    # "page_number": getattr(chunk.metadata, "page_number", None),
                    "parent_id": getattr(chunk.metadata, "parent_id", None),
                }

            # Create a standardized chunk dictionary that's ready for embedding
            converted_chunk = {
                "text": chunk_text,
                "type": chunk_dict.get("type", "Text"),
                "metadata": {
                    **metadata,  # Base metadata from the chunk
                    "chunk_size": chunk_size,
                    "element_count": len(elements),
                    "chunk_type": chunk_dict.get("type", "Text"),
                    "source_elements": elements,  # Store original elements for reference
                },
                "size": chunk_size,
            }

            # Update metrics
            self.metrics.update(chunk_size)
            converted_chunks.append(converted_chunk)

        return converted_chunks

    def chunk_elements(
        self, elements: List[Dict[str, Any]], config: ChunkingConfig
    ) -> Tuple[List[Dict[str, Any]], ChunkMetrics]:
        """
        Chunk document elements according to the specified configuration.
        Returns chunks in a format ready for embedding.

        Args:
            elements: List of document elements with 'type' and 'text' fields
            config: Chunking configuration

        Returns:
            Tuple containing:
            - List of chunks in a format ready for embedding
            - Chunking metrics
        """
        # Reset metrics
        self.metrics = ChunkMetrics()

        # Convert our elements to unstructured's format
        unstructured_elements = self._convert_to_unstructured_elements(elements)

        # Apply chunking based on strategy
        if config.strategy == "by_title":
            chunks = chunk_by_title(
                unstructured_elements,
                max_characters=config.max_characters,
                new_after_n_chars=config.preferred_size,
                overlap=config.overlap,
                combine_text_under_n_chars=config.preferred_size,
                multipage_sections=True,
            )
        else:  # "basic" strategy
            chunks = chunk_basic(
                unstructured_elements,
                max_characters=config.max_characters,
                new_after_n_chars=config.preferred_size,
                overlap=config.overlap,
            )

        # Convert chunks to embedding-ready format and collect metrics
        converted_chunks = self._convert_from_unstructured_chunks(chunks)

        return converted_chunks, self.metrics
