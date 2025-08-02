"""Unit tests for tasks.py module."""

import uuid
import pytest
from fastapi import HTTPException
from app.tasks import get_user_uuid


class TestGetUserUuid:
    """Test cases for get_user_uuid function."""

    def test_valid_uuid_string(self):
        """Test that a valid UUID string is converted successfully."""
        # Generate a valid UUID string
        valid_uuid = str(uuid.uuid4())

        # Call the function
        result = get_user_uuid(valid_uuid)

        # Verify the result
        assert isinstance(result, uuid.UUID)
        assert str(result) == valid_uuid

    def test_invalid_uuid_string_raises_http_exception(self):
        """Test that invalid UUID strings raise HTTPException with 400 status."""
        invalid_uuids = [
            "not-a-uuid",
            "12345",
            "invalid-uuid-format",
            "",
            "123e4567-e89b-12d3-a456",  # Too short
            "123e4567-e89b-12d3-a456-426614174000-extra",  # Too long
            "123e4567-e89b-12d3-g456-426614174000",  # Invalid character 'g'
        ]

        for invalid_uuid in invalid_uuids:
            with pytest.raises(HTTPException) as exc_info:
                get_user_uuid(invalid_uuid)

            # Verify the exception details
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "Invalid user ID format"

    def test_uuid_with_hyphens_and_without(self):
        """Test that UUIDs work both with and without hyphens."""
        # UUID with hyphens
        uuid_with_hyphens = "123e4567-e89b-12d3-a456-426614174000"
        result1 = get_user_uuid(uuid_with_hyphens)
        assert isinstance(result1, uuid.UUID)

        # UUID without hyphens
        uuid_without_hyphens = "123e4567e89b12d3a456426614174000"
        result2 = get_user_uuid(uuid_without_hyphens)
        assert isinstance(result2, uuid.UUID)

        # Both should represent the same UUID
        assert result1 == result2

    def test_uppercase_and_lowercase_uuids(self):
        """Test that UUIDs work in both uppercase and lowercase."""
        uuid_lowercase = "123e4567-e89b-12d3-a456-426614174000"
        uuid_uppercase = "123E4567-E89B-12D3-A456-426614174000"

        result1 = get_user_uuid(uuid_lowercase)
        result2 = get_user_uuid(uuid_uppercase)

        # Both should be valid and equal
        assert isinstance(result1, uuid.UUID)
        assert isinstance(result2, uuid.UUID)
        assert result1 == result2

    def test_nil_uuid(self):
        """Test that the nil UUID (all zeros) is accepted."""
        nil_uuid = "00000000-0000-0000-0000-000000000000"
        result = get_user_uuid(nil_uuid)

        assert isinstance(result, uuid.UUID)
        assert result == uuid.UUID(nil_uuid)
        assert result.int == 0
