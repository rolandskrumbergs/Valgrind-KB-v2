from typing import Dict, NamedTuple, Optional
from enum import Enum
from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import Field


class ChunkingConfig(NamedTuple):
    max_characters: int
    preferred_size: int
    overlap: int
    description: str
    strategy: str


class ChunkingTestSet(str, Enum):
    SET_A = "set_a"  # More granular
    SET_B = "set_b"  # Larger chunks
    SET_C = "set_c"  # Minimal overlap
    SET_D = "set_d"  # Title-based
    SET_E = "set_e"  # Experimental small
    CUSTOM = "custom"  # For dynamic testing


CHUNKING_TEST_SETS: Dict[ChunkingTestSet, ChunkingConfig] = {
    ChunkingTestSet.SET_A: ChunkingConfig(
        max_characters=12000,  # ~3k tokens
        preferred_size=3000,  # ~750 tokens
        overlap=300,
        description="More granular chunks for higher precision",
        strategy="basic",
    ),
    ChunkingTestSet.SET_B: ChunkingConfig(
        max_characters=24000,  # ~6k tokens
        preferred_size=6000,  # ~1.5k tokens
        overlap=600,
        description="Larger chunks for more context",
        strategy="basic",
    ),
    ChunkingTestSet.SET_C: ChunkingConfig(
        max_characters=16000,  # ~4k tokens
        preferred_size=4000,  # ~1k tokens
        overlap=150,  # Minimal overlap
        description="Minimal overlap for storage efficiency",
        strategy="basic",
    ),
    ChunkingTestSet.SET_D: ChunkingConfig(
        max_characters=20000,  # ~5k tokens
        preferred_size=5000,  # ~1.25k tokens
        overlap=400,
        description="Title-based chunking for better semantic boundaries",
        strategy="by_title",
    ),
    ChunkingTestSet.SET_E: ChunkingConfig(
        max_characters=8000,  # ~2k tokens
        preferred_size=2000,  # ~500 tokens
        overlap=200,
        description="Experimental small chunks for maximum precision",
        strategy="basic",
    ),
    ChunkingTestSet.CUSTOM: ChunkingConfig(
        max_characters=16000,  # Configurable via env
        preferred_size=4000,
        overlap=400,
        description="Custom configuration for dynamic testing",
        strategy="basic",
    ),
}


class Settings(BaseSettings):
    # AWS Configuration
    # These fields will be populated from environment variables
    # The values here are just defaults used if env vars are missing
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-north-1"

    # Model Configuration
    MODEL_NAME: str = "KBLab/sentence-bert-swedish-cased"  # Default model

    # Upstash Vector DB Configuration
    UPSTASH_IBBEN_KNOWLEDGE_BOOKS_INDEX_REST_URL: str
    UPSTASH_IBBEN_KNOWLEDGE_BOOKS_INDEX_REST_TOKEN: str
    UPSTASH_IBBEN_KNOWLEDGE_LAWS_INDEX_REST_URL: str
    UPSTASH_IBBEN_KNOWLEDGE_LAWS_INDEX_REST_TOKEN: str
    UPSTASH_IBBEN_KNOWLEDGE_LEGALCASES_INDEX_REST_URL: str
    UPSTASH_IBBEN_KNOWLEDGE_LEGALCASES_INDEX_REST_TOKEN: str
    UPSTASH_IBBEN_KNOWLEDGE_OTHER_INDEX_REST_URL: str
    UPSTASH_IBBEN_KNOWLEDGE_OTHER_INDEX_REST_TOKEN: str

    # Database Configuration
    # TODO: Add database configuration settings

    # Chunking Configuration
    ACTIVE_CHUNK_TEST_SET: ChunkingTestSet = Field(
        default=ChunkingTestSet.SET_A,
        description="Active chunking test set (set_a, set_b, set_c, set_d, set_e, custom)",
    )

    # Custom test set configuration (for CUSTOM test set)
    CUSTOM_MAX_CHARACTERS: Optional[int] = None
    CUSTOM_PREFERRED_SIZE: Optional[int] = None
    CUSTOM_OVERLAP: Optional[int] = None
    CUSTOM_STRATEGY: Optional[str] = None

    @property
    def chunking_config(self) -> ChunkingConfig:
        """Get the active chunking configuration"""
        if self.ACTIVE_CHUNK_TEST_SET == ChunkingTestSet.CUSTOM:
            return ChunkingConfig(
                max_characters=self.CUSTOM_MAX_CHARACTERS or 16000,
                preferred_size=self.CUSTOM_PREFERRED_SIZE or 4000,
                overlap=self.CUSTOM_OVERLAP or 400,
                description="Custom configuration",
                strategy=self.CUSTOM_STRATEGY or "basic",
            )
        return CHUNKING_TEST_SETS[self.ACTIVE_CHUNK_TEST_SET]

    class Config:
        env_file = ".env"  # Load configuration from .env file


@lru_cache()
def get_settings():
    """Get application settings."""
    return Settings()


def reload_settings():
    """Clear the settings cache to force a reload."""
    get_settings.cache_clear()
