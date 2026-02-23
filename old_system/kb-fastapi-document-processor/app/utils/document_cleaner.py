import re
from typing import List, Dict, Any, Tuple
from unstructured.cleaners.core import (
    clean,
    clean_non_ascii_chars,
    replace_unicode_quotes,
    group_broken_paragraphs,
    clean_ordered_bullets,
)


class DocumentCleaner:
    @staticmethod
    def has_letters(text: str) -> bool:
        """Check if the text contains at least one letter (supports unicode letters)."""
        return bool(re.search(r"[a-zA-ZÀ-ÿ]", text))

    @staticmethod
    def clean_text(text: str) -> str:
        """Enhanced cleaning function that applies multiple cleaning steps in sequence."""
        if not text or not text.strip():
            return ""

        # Replace unicode quotes first (as recommended in the docs)
        text = replace_unicode_quotes(text)

        # Apply general cleaning (bullets, whitespace, dashes, trailing punctuation)
        text = clean(
            text,
            bullets=True,
            extra_whitespace=True,
            dashes=True,
            trailing_punctuation=True,
        )

        # Remove any remaining non-ASCII characters
        text = clean_non_ascii_chars(text)

        # Clean ordered bullets (like "1.1", "a.b") only if text is not empty
        text = text.strip()
        if text:  # Only clean ordered bullets if there's text to clean
            text = clean_ordered_bullets(text)

        # Group any broken paragraphs
        text = group_broken_paragraphs(text)

        return text.strip()

    @classmethod
    def clean_elements(
        cls, elements: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """
        Clean and filter document elements.

        Args:
            elements: List of document elements with 'type' and 'text' fields

        Returns:
            Tuple containing:
            - List of cleaned elements
            - Dictionary with cleaning statistics
        """
        cleaned_elements = []
        symbols_only_count = 0
        empty_after_cleaning_count = 0

        for element in elements:
            # Apply enhanced cleaning
            cleaned_text = cls.clean_text(element["text"])

            # Skip empty elements
            if not cleaned_text:
                empty_after_cleaning_count += 1
                continue

            # Skip symbol-only elements
            if not cls.has_letters(cleaned_text):
                symbols_only_count += 1
                continue

            cleaned_elements.append({"type": element["type"], "text": cleaned_text})

        stats = {
            "original_elements": len(elements),
            "cleaned_elements": len(cleaned_elements),
            "empty_elements_removed": empty_after_cleaning_count,
            "symbol_only_elements_removed": symbols_only_count,
            "total_elements_removed": empty_after_cleaning_count + symbols_only_count,
        }

        return cleaned_elements, stats
