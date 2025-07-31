"""Unit tests for images.py module."""

import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.images import _create_tasks_from_analysis
from app.ai.image_processing import ImageProcessingService


class TestCreateTasksFromAnalysis:
    """Test cases for _create_tasks_from_analysis function."""

    @pytest.mark.asyncio
    async def test_no_tasks_created_without_image_id(self):
        """Test that no tasks are created when image_id is None."""
        # Create mocks
        mock_processing_service = MagicMock(spec=ImageProcessingService)
        mock_processing_service.create_tasks_from_analysis = AsyncMock()
        mock_session = AsyncMock()
        
        # Mock logger to verify warning is logged
        with patch('app.images.logger') as mock_logger:
            # Call the function with no image_id
            await _create_tasks_from_analysis(
                processing_service=mock_processing_service,
                analysis_result={"tasks": [{"title": "Test task"}]},
                user_id="test-user-123",
                image_id=None,  # This is the key test case
                session=mock_session
            )
            
            # Verify that create_tasks_from_analysis was NOT called
            mock_processing_service.create_tasks_from_analysis.assert_not_called()
            
            # Verify that a warning was logged
            mock_logger.warning.assert_called_once_with("Cannot create tasks without image_id")
            
            # Verify that update_image_analysis_status was NOT called
            # (The function returns early, so nothing else should happen)

    @pytest.mark.asyncio
    async def test_tasks_created_with_valid_image_id(self):
        """Test that tasks are created when image_id is provided."""
        # Create mocks
        mock_processing_service = MagicMock(spec=ImageProcessingService)
        mock_processing_service.create_tasks_from_analysis = AsyncMock(
            return_value=[
                {"id": 1, "title": "Task 1"},
                {"id": 2, "title": "Task 2"}
            ]
        )
        mock_session = AsyncMock()
        
        # Valid image_id
        test_image_id = uuid.uuid4()
        
        # Mock the update_image_analysis_status function
        with patch('app.images.update_image_analysis_status', new=AsyncMock()) as mock_update:
            # Call the function with valid image_id
            await _create_tasks_from_analysis(
                processing_service=mock_processing_service,
                analysis_result={
                    "tasks": [{"title": "Test task"}],
                    "provider_used": "gemini"
                },
                user_id="test-user-123",
                image_id=test_image_id,
                session=mock_session
            )
            
            # Verify that create_tasks_from_analysis WAS called
            mock_processing_service.create_tasks_from_analysis.assert_called_once_with(
                analysis_result={
                    "tasks": [{"title": "Test task"}],
                    "provider_used": "gemini"
                },
                user_id="test-user-123",
                source_image_id=test_image_id,
                provider_name="gemini"
            )
            
            # Verify that update_image_analysis_status WAS called
            mock_update.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_missing_provider_name(self):
        """Test that function handles missing provider_used in analysis_result."""
        # Create mocks
        mock_processing_service = MagicMock(spec=ImageProcessingService)
        mock_processing_service.create_tasks_from_analysis = AsyncMock(return_value=[])
        mock_session = AsyncMock()
        
        test_image_id = uuid.uuid4()
        
        with patch('app.images.update_image_analysis_status', new=AsyncMock()):
            # Call with analysis_result missing provider_used
            await _create_tasks_from_analysis(
                processing_service=mock_processing_service,
                analysis_result={"tasks": []},  # No provider_used key
                user_id="test-user-123",
                image_id=test_image_id,
                session=mock_session
            )
            
            # Verify it uses "unknown" as default
            mock_processing_service.create_tasks_from_analysis.assert_called_once()
            call_args = mock_processing_service.create_tasks_from_analysis.call_args
            assert call_args.kwargs["provider_name"] == "unknown"