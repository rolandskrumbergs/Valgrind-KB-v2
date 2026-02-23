from typing import List, Dict, Any
import os
from unstructured.partition.pdf import partition_pdf
from unstructured.partition.docx import partition_docx
from unstructured.partition.doc import partition_doc
from unstructured.partition.text import partition_text
from unstructured.cleaners.core import group_broken_paragraphs


class DocumentPartitioner:
    # Mapping of file extensions to their MIME types
    SUPPORTED_MIME_TYPES = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".txt": "text/plain",
    }

    # Mapping of file extensions to their specific partition functions
    PARTITION_FUNCTIONS = {
        ".pdf": partition_pdf,
        ".docx": partition_docx,
        ".doc": partition_doc,  # Uses libreoffice to convert to .docx first
        ".txt": partition_text,
    }

    @classmethod
    def is_supported_file_type(cls, file_path: str) -> bool:
        """Check if the file type is supported."""
        _, ext = os.path.splitext(file_path.lower())
        return ext in cls.SUPPORTED_MIME_TYPES

    @classmethod
    def get_partition_kwargs(cls, file_path: str) -> Dict[str, Any]:
        """Get the appropriate kwargs for the partition function based on file type."""
        _, ext = os.path.splitext(file_path.lower())

        # Default kwargs for all document types
        kwargs = {
            "include_page_breaks": False,  # Don't include page breaks
            "skip_empty_elements": True,  # Skip empty or whitespace-only elements
        }

        # Add specific kwargs based on file type
        if ext == ".pdf":
            kwargs.update(
                {
                    # Use auto strategy for PDFs with extractable text, falls back to OCR if needed
                    "strategy": "auto",
                    # Swedish language for OCR fallback
                    "languages": ["swe"],
                    # Don't extract images or tables
                    "extract_images_in_pdf": False,
                    "infer_table_structure": False,
                    "merge_broken_paragraphs": True,  # Merge paragraphs broken across pages
                    "split_at_headings": True,  # Split at heading elements for better structure
                }
            )
        elif ext == ".txt":
            kwargs.update(
                {
                    "encoding": "utf-8",
                    # Group broken paragraphs that are split across lines
                    "paragraph_grouper": group_broken_paragraphs,
                    # Set max partition size for text chunks
                    "max_partition": 1500,
                    "preserve_line_breaks": False,  # Don't preserve unnecessary line breaks
                    "join_broken_words": True,  # Join words broken by hyphens
                }
            )

        return kwargs

    @classmethod
    def partition_document(cls, file_path: str) -> List[Dict[str, Any]]:
        """
        Partition a document using the appropriate partition function based on file type.
        Returns a list of document elements.

        For .doc files: Uses libreoffice to convert to .docx first
        For PDF files: Uses auto strategy for text extraction, falls back to OCR if text isn't extractable
        For TXT files: Groups broken paragraphs and maintains reasonable chunk sizes
        """
        if not cls.is_supported_file_type(file_path):
            raise ValueError(f"Unsupported file type: {file_path}")

        _, ext = os.path.splitext(file_path.lower())
        partition_func = cls.PARTITION_FUNCTIONS[ext]
        kwargs = cls.get_partition_kwargs(file_path)

        try:
            elements = partition_func(filename=file_path, **kwargs)
            processed_elements = []

            for element in elements:
                # Skip empty or whitespace-only elements
                if not str(element).strip():
                    continue

                # Clean and normalize the text
                cleaned_text = str(element).strip()
                if len(cleaned_text) < 2:  # Skip single-character elements
                    continue

                element_dict = {
                    "type": element.__class__.__name__,
                    "text": cleaned_text,
                }
                processed_elements.append(element_dict)

            return processed_elements

        except Exception as e:
            raise Exception(f"Error partitioning document: {str(e)}")
