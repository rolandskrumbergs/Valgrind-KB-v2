import boto3
import tempfile
import os
import urllib.parse
import hashlib
import logging
from typing import Dict
from botocore.config import Config
from botocore.exceptions import ClientError
import time

logger = logging.getLogger(__name__)


class DocumentProcessor:
    def __init__(self, aws_access_key_id: str, aws_secret_access_key: str, region: str):
        # Configure boto3 with retries and timeouts
        config = Config(
            retries=dict(max_attempts=3, mode="adaptive"),
            connect_timeout=5,
            read_timeout=10,
            max_pool_connections=10,
        )

        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region,
            config=config,
        )

    def download_from_s3(self, s3_url: str, max_retries: int = 3) -> str:
        """
        Download a file from S3 and return the local path with retry mechanism
        """
        # Parse S3 URL to get bucket and key
        parsed_url = urllib.parse.urlparse(s3_url)
        bucket = parsed_url.netloc
        key = parsed_url.path.lstrip("/")

        # Get the file extension from the original filename
        _, file_extension = os.path.splitext(key)

        # Create a temporary file with the same extension
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        temp_path = temp_file.name

        for attempt in range(max_retries):
            try:
                self.s3_client.download_file(bucket, key, temp_path)
                return temp_path
            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "Unknown")
                if error_code == "NoSuchKey":
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    raise Exception(f"File not found in S3: {s3_url}")
                elif attempt == max_retries - 1:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    raise Exception(
                        f"Error downloading from S3 after {max_retries} attempts: {str(e)}"
                    )
                time.sleep(2**attempt)  # Exponential backoff
            except Exception as e:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise Exception(f"Unexpected error downloading from S3: {str(e)}")

    def get_s3_metadata(self, s3_url: str, max_retries: int = 3) -> Dict[str, str]:
        """
        Get metadata from an S3 object with retry mechanism.
        Properly handles both system metadata and user-defined metadata (x-amz-meta-).

        Args:
            s3_url: The S3 URL of the object
            max_retries: Maximum number of retry attempts

        Returns:
            Dictionary containing the object's metadata with proper prefixes
        """
        # Parse S3 URL to get bucket and key
        parsed_url = urllib.parse.urlparse(s3_url)
        bucket = parsed_url.netloc
        key = parsed_url.path.lstrip("/")

        logger.info(f"Retrieving metadata for file: {key} from bucket: {bucket}")

        for attempt in range(max_retries):
            try:
                # Get object metadata using head_object
                logger.debug(f"Attempt {attempt + 1}/{max_retries} to get metadata")
                response = self.s3_client.head_object(Bucket=bucket, Key=key)

                metadata = {}

                # Handle system metadata
                system_metadata_keys = [
                    "ContentLength",
                    "ContentType",
                    "LastModified",
                    "ETag",
                    "VersionId",
                    "StorageClass",
                ]
                for key in system_metadata_keys:
                    if key in response:
                        metadata[key.lower()] = response[key]

                # Handle user-defined metadata (add x-amz-meta- prefix if not present)
                if "Metadata" in response:
                    logger.debug("Processing user-defined metadata")
                    for meta_key, value in response["Metadata"].items():
                        prefixed_key = (
                            meta_key
                            if meta_key.startswith("x-amz-meta-")
                            else f"x-amz-meta-{meta_key.lower()}"
                        )
                        metadata[prefixed_key] = value
                        logger.debug(f"Found metadata: {prefixed_key}")

                # Check for missing metadata
                if "x-amz-missing-meta" in response:
                    metadata["x-amz-missing-meta"] = response["x-amz-missing-meta"]
                    logger.warning("Some metadata fields are missing")

                logger.info(
                    f"Successfully retrieved metadata with {len(metadata)} fields"
                )
                return metadata

            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "Unknown")
                if error_code == "NoSuchKey":
                    logger.error(f"File not found in S3: {s3_url}")
                    raise Exception(f"File not found in S3: {s3_url}")
                elif attempt == max_retries - 1:
                    logger.error(f"Failed to get metadata after {max_retries} attempts")
                    raise Exception(
                        f"Error getting S3 metadata after {max_retries} attempts: {str(e)}"
                    )
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(2**attempt)  # Exponential backoff
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error("Unexpected error getting metadata", exc_info=True)
                    raise Exception(f"Unexpected error getting S3 metadata: {str(e)}")
                logger.warning(
                    f"Attempt {attempt + 1} failed with unexpected error, retrying..."
                )
                time.sleep(2**attempt)  # Exponential backoff

    def get_content_hash(self, s3_url: str, max_retries: int = 3) -> str:
        """
        Get the content hash from S3 object metadata.
        The hash is stored in the x-amz-meta-contenthash user-defined metadata.

        Args:
            s3_url: The S3 URL of the file
            max_retries: Maximum number of retry attempts

        Returns:
            Content hash from the metadata
        """
        logger.info(f"Retrieving content hash for file: {s3_url}")

        metadata = self.get_s3_metadata(s3_url, max_retries)
        content_hash = metadata.get("x-amz-meta-filehash")

        if not content_hash:
            logger.error(f"Content hash not found in metadata for file: {s3_url}")
            logger.debug(f"Available metadata fields: {', '.join(metadata.keys())}")
            raise Exception(f"Content hash not found in metadata for file: {s3_url}")

        logger.info(f"Successfully retrieved content hash: {content_hash[:8]}...")
        return content_hash
