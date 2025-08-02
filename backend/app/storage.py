"""Storage abstraction layer for file uploads."""

import os
from abc import ABC, abstractmethod
from typing import Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
from .config import config

# Load environment variables
load_dotenv()


class StorageProvider(ABC):
    """Abstract base class for storage providers."""

    @abstractmethod
    async def upload(
        self, file_data: bytes, path: str, content_type: str
    ) -> Dict[str, Any]:
        """Upload a file to storage."""
        pass

    @abstractmethod
    def get_public_url(self, path: str) -> str:
        """Get public URL for a file."""
        pass


class SupabaseStorageProvider(StorageProvider):
    """Supabase storage provider implementation."""

    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name

        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
            )

        self.client: Client = create_client(supabase_url, supabase_key)

    async def upload(
        self, file_data: bytes, path: str, content_type: str
    ) -> Dict[str, Any]:
        """Upload a file to Supabase storage."""
        response = self.client.storage.from_(self.bucket_name).upload(
            file=file_data,
            path=path,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return response

    def get_public_url(self, path: str) -> str:
        """Get public URL for a file in Supabase storage."""
        return self.client.storage.from_(self.bucket_name).get_public_url(path)


# Factory function to get storage provider
def get_storage_provider(provider_type: str = "supabase", **kwargs) -> StorageProvider:
    """
    Get a storage provider instance.

    Args:
        provider_type: Type of storage provider (default: "supabase")
        **kwargs: Additional arguments for the provider

    Returns:
        StorageProvider instance
    """
    if provider_type == "supabase":
        bucket_name = kwargs.get(
            "bucket_name", os.getenv("STORAGE_BUCKET_NAME", "images")
        )
        return SupabaseStorageProvider(bucket_name)
    else:
        raise ValueError(f"Unknown storage provider: {provider_type}")


# Create a default storage provider instance
storage = get_storage_provider("supabase", bucket_name=config.image.storage_bucket_name)
