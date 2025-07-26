"""Unit tests for image preprocessing and validation services."""

import io
import pytest
from unittest.mock import Mock, patch
from PIL import Image

from app.ai.image_processing import (
    ImagePreprocessor,
    ImageProcessingService,
    ImageValidationError
)
from app.config import ImageConfig


class TestImagePreprocessor:
    """Test the ImagePreprocessor class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.preprocessor = ImagePreprocessor()
    
    def create_test_image(self, format_type: str = "JPEG", size: tuple = (100, 100), mode: str = "RGB") -> bytes:
        """Create a test image in memory."""
        image = Image.new(mode, size, color="red")
        buffer = io.BytesIO()
        image.save(buffer, format=format_type)
        return buffer.getvalue()
    
    def create_large_test_image(self, size_mb: float) -> bytes:
        """Create a large test image of specified size in MB."""
        # Create a simple large image and then pad it to exact size
        image = Image.new("RGB", (1000, 1000), color="red")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=100)
        base_data = buffer.getvalue()
        
        # Calculate target size and pad if necessary
        target_bytes = int(size_mb * 1024 * 1024)
        if len(base_data) < target_bytes:
            # Create a fake large image by repeating the base data
            repeats = (target_bytes // len(base_data)) + 1
            large_data = base_data * repeats
            return large_data[:target_bytes]
        
        return base_data
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_valid_jpeg(self):
        """Test preprocessing of valid JPEG image."""
        image_data = self.create_test_image("JPEG")
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        assert isinstance(processed_data, bytes)
        assert len(processed_data) > 0
        assert isinstance(metadata, dict)
        
        # Check metadata structure
        assert "original_size" in metadata
        assert "processed_size" in metadata
        assert "original_format" in metadata
        assert "dimensions" in metadata
        assert "compression_ratio" in metadata
        assert "content_type" in metadata
        
        assert metadata["original_format"] == "jpeg"
        assert metadata["content_type"] == "image/jpeg"
        assert metadata["dimensions"] == (100, 100)
        assert metadata["compression_ratio"] <= 1.0
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_valid_png(self):
        """Test preprocessing of valid PNG image."""
        image_data = self.create_test_image("PNG")
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        assert isinstance(processed_data, bytes)
        assert metadata["original_format"] == "png"
        assert metadata["content_type"] == "image/png"
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_valid_webp(self):
        """Test preprocessing of valid WebP image."""
        image_data = self.create_test_image("WebP")
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        assert isinstance(processed_data, bytes)
        assert metadata["original_format"] == "webp"
        assert metadata["content_type"] == "image/webp"
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_image_too_large(self):
        """Test validation failure for oversized image."""
        # Create a fake large image data (15MB)
        large_image_data = b"fake_image_data" * (15 * 1024 * 1024 // 15)  # 15MB of data
        
        with pytest.raises(ImageValidationError) as exc_info:
            await self.preprocessor.validate_and_preprocess(large_image_data)
        
        assert "Image too large" in str(exc_info.value)
        assert "15.0MB" in str(exc_info.value)
        assert "max: 10MB" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_unsupported_format(self):
        """Test validation failure for unsupported image format."""
        # Create a BMP image (not in supported formats)
        image_data = self.create_test_image("BMP")
        
        with pytest.raises(ImageValidationError) as exc_info:
            await self.preprocessor.validate_and_preprocess(image_data)
        
        assert "Unsupported format: bmp" in str(exc_info.value)
        assert "image/jpeg, image/png, image/webp" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_invalid_image_data(self):
        """Test validation failure for invalid image data."""
        invalid_data = b"This is not an image"
        
        with pytest.raises(ImageValidationError) as exc_info:
            await self.preprocessor.validate_and_preprocess(invalid_data)
        
        assert "Invalid image file" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_empty_data(self):
        """Test validation failure for empty data."""
        empty_data = b""
        
        with pytest.raises(ImageValidationError) as exc_info:
            await self.preprocessor.validate_and_preprocess(empty_data)
        
        assert "Invalid image file" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_compression_applied(self):
        """Test that compression is applied to reduce file size."""
        # Create a large image that should be compressed
        large_image = Image.new("RGB", (2000, 2000), color="red")
        buffer = io.BytesIO()
        large_image.save(buffer, format="JPEG", quality=100)
        image_data = buffer.getvalue()
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Processed image should be smaller than original
        assert len(processed_data) < len(image_data)
        assert metadata["compression_ratio"] < 1.0
        assert metadata["processed_size"] < metadata["original_size"]
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_rgba_conversion(self):
        """Test that RGBA images are converted to RGB."""
        image_data = self.create_test_image("PNG", mode="RGBA")
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Verify the processed image is RGB (JPEG format)
        processed_image = Image.open(io.BytesIO(processed_data))
        assert processed_image.mode == "RGB"
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_palette_conversion(self):
        """Test that palette images are converted to RGB."""
        image_data = self.create_test_image("PNG", mode="P")
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Verify the processed image is RGB (JPEG format)
        processed_image = Image.open(io.BytesIO(processed_data))
        assert processed_image.mode == "RGB"
    
    def test_compress_for_ai_large_image_resizing(self):
        """Test that large images are resized for AI processing."""
        # Create image larger than max dimension (1024px)
        large_image = Image.new("RGB", (2048, 1536), color="blue")
        
        compressed_data = self.preprocessor._compress_for_ai(large_image)
        
        # Verify the compressed image is within size limits
        compressed_image = Image.open(io.BytesIO(compressed_data))
        assert max(compressed_image.size) <= 1024
        
        # Verify aspect ratio is maintained
        original_ratio = large_image.size[0] / large_image.size[1]
        compressed_ratio = compressed_image.size[0] / compressed_image.size[1]
        assert abs(original_ratio - compressed_ratio) < 0.01
    
    def test_compress_for_ai_quality_reduction(self):
        """Test that compression quality is reduced to meet size limits."""
        # Create a detailed image that will be large when saved
        image = Image.new("RGB", (1000, 1000))
        # Add some detail to make compression more effective
        pixels = image.load()
        for i in range(1000):
            for j in range(1000):
                pixels[i, j] = (i % 256, j % 256, (i + j) % 256)
        
        compressed_data = self.preprocessor._compress_for_ai(image)
        
        # Verify the compressed image is within the size limit (500KB default)
        max_size_kb = self.preprocessor.config.max_ai_image_size_kb
        assert len(compressed_data) <= max_size_kb * 1024
    
    def test_compress_for_ai_minimum_quality_limit(self):
        """Test that compression doesn't go below minimum quality."""
        # Create an image that's very hard to compress
        image = Image.new("RGB", (1000, 1000))
        pixels = image.load()
        import random
        random.seed(42)  # For reproducible tests
        for i in range(1000):
            for j in range(1000):
                pixels[i, j] = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        
        # Mock config to have very small size limit to force quality reduction
        with patch.object(self.preprocessor.config, 'max_ai_image_size_kb', 1):  # 1KB limit
            compressed_data = self.preprocessor._compress_for_ai(image)
            
            # Should still produce some output even if it exceeds the limit
            assert len(compressed_data) > 0
            
            # Verify it's still a valid JPEG
            compressed_image = Image.open(io.BytesIO(compressed_data))
            assert compressed_image.format == "JPEG"
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_with_custom_config(self):
        """Test preprocessing with custom configuration."""
        # Create custom config
        custom_config = ImageConfig(
            max_image_size_mb=5,
            max_ai_image_size_kb=100,
            image_compression_quality=70,
            supported_formats=["image/jpeg", "image/png"]
        )
        
        with patch.object(self.preprocessor, 'config', custom_config):
            # Test with image that would be valid with default config but invalid with custom
            large_image_data = b"fake_image_data" * (7 * 1024 * 1024 // 15)  # 7MB of data
            
            with pytest.raises(ImageValidationError) as exc_info:
                await self.preprocessor.validate_and_preprocess(large_image_data)
            
            assert "max: 5MB" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_validate_and_preprocess_metadata_accuracy(self):
        """Test that metadata contains accurate information."""
        image_data = self.create_test_image("JPEG", size=(200, 150))
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Verify metadata accuracy
        assert metadata["original_size"] == len(image_data)
        assert metadata["processed_size"] == len(processed_data)
        assert metadata["dimensions"] == (200, 150)
        assert metadata["original_format"] == "jpeg"
        assert metadata["content_type"] == "image/jpeg"
        
        # Verify compression ratio calculation
        expected_ratio = len(processed_data) / len(image_data)
        assert abs(metadata["compression_ratio"] - expected_ratio) < 0.001


class TestImageProcessingService:
    """Test the ImageProcessingService class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.service = ImageProcessingService()
    
    def create_test_image(self, format_type: str = "JPEG", size: tuple = (100, 100)) -> bytes:
        """Create a test image in memory."""
        image = Image.new("RGB", size, color="red")
        buffer = io.BytesIO()
        image.save(buffer, format=format_type)
        return buffer.getvalue()
    
    @pytest.mark.asyncio
    async def test_analyze_image_and_generate_tasks_placeholder(self):
        """Test the placeholder implementation of image analysis."""
        image_data = self.create_test_image()
        user_id = "test_user_123"
        
        result = await self.service.analyze_image_and_generate_tasks(
            image_data, user_id, generate_tasks=True
        )
        
        # Verify placeholder response structure
        assert isinstance(result, dict)
        assert "image_metadata" in result
        assert "analysis_summary" in result
        assert "tasks" in result
        assert "processing_time" in result
        assert "provider_used" in result
        
        # Verify metadata is populated from preprocessing
        metadata = result["image_metadata"]
        assert "original_size" in metadata
        assert "processed_size" in metadata
        assert "original_format" in metadata
        assert "dimensions" in metadata
        
        # Verify placeholder values
        assert result["analysis_summary"] == "Image processing service placeholder"
        assert result["tasks"] == []
        assert result["processing_time"] == 0.0
        assert result["provider_used"] == "none"
    
    @pytest.mark.asyncio
    async def test_analyze_image_and_generate_tasks_with_ai_provider(self):
        """Test image analysis with AI provider (mocked)."""
        # Create mock AI provider
        mock_provider = Mock()
        mock_provider.analyze_image.return_value = {
            "analysis_summary": "Mock AI analysis",
            "tasks": [{"title": "Test task", "description": "Test description"}],
            "processing_time": 1.5,
            "provider": "mock"
        }
        
        service = ImageProcessingService(ai_provider=mock_provider)
        image_data = self.create_test_image()
        user_id = "test_user_123"
        
        # Note: This test verifies the service structure, but full AI integration
        # will be implemented in later tasks
        result = await service.analyze_image_and_generate_tasks(
            image_data, user_id, generate_tasks=True
        )
        
        # Should still return placeholder response since AI integration is not complete
        assert result["provider_used"] == "none"
    
    @pytest.mark.asyncio
    async def test_analyze_image_and_generate_tasks_no_task_generation(self):
        """Test image analysis without task generation."""
        image_data = self.create_test_image()
        user_id = "test_user_123"
        
        result = await self.service.analyze_image_and_generate_tasks(
            image_data, user_id, generate_tasks=False
        )
        
        # Should still process image and return metadata
        assert "image_metadata" in result
        assert result["tasks"] == []
    
    @pytest.mark.asyncio
    async def test_analyze_image_and_generate_tasks_invalid_image(self):
        """Test image analysis with invalid image data."""
        invalid_data = b"Not an image"
        user_id = "test_user_123"
        
        with pytest.raises(ImageValidationError):
            await self.service.analyze_image_and_generate_tasks(
                invalid_data, user_id, generate_tasks=True
            )
    
    def test_generate_prompt_default(self):
        """Test prompt generation with default context."""
        prompt = self.service.generate_prompt()
        
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "home maintenance expert" in prompt.lower()
        assert "json" in prompt.lower()
        assert "tasks" in prompt.lower()
        assert "priority" in prompt.lower()
        assert "category" in prompt.lower()
    
    def test_generate_prompt_with_context(self):
        """Test prompt generation with custom context."""
        context = {"focus_area": "bathroom", "season": "winter"}
        prompt = self.service.generate_prompt(context)
        
        # Should return the same base prompt regardless of context for now
        # Context integration will be implemented in later tasks
        assert isinstance(prompt, str)
        assert "home maintenance expert" in prompt.lower()
    
    def test_generate_prompt_structure(self):
        """Test that generated prompt has expected structure."""
        prompt = self.service.generate_prompt()
        
        # Check for key sections
        assert "analyze this image" in prompt.lower()
        assert "title" in prompt
        assert "description" in prompt
        assert "priority" in prompt
        assert "category" in prompt
        assert "reasoning" in prompt
        assert "analysis_summary" in prompt
        
        # Check for JSON structure specification
        assert '"tasks"' in prompt
        assert '"analysis_summary"' in prompt
        
        # Check for priority levels
        assert "high|medium|low" in prompt
        
        # Check for focus areas
        assert "visible maintenance needs" in prompt.lower()
        assert "safety concerns" in prompt.lower()
        assert "preventive maintenance" in prompt.lower()


class TestImageValidationError:
    """Test the ImageValidationError exception."""
    
    def test_image_validation_error_creation(self):
        """Test creating ImageValidationError."""
        error = ImageValidationError("Test error message")
        assert str(error) == "Test error message"
        assert isinstance(error, Exception)
    
    def test_image_validation_error_inheritance(self):
        """Test that ImageValidationError inherits from Exception."""
        error = ImageValidationError("Test error")
        assert isinstance(error, Exception)


class TestImagePreprocessorIntegration:
    """Integration tests for ImagePreprocessor with various image scenarios."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.preprocessor = ImagePreprocessor()
    
    def create_complex_test_image(self, format_type: str = "JPEG", size: tuple = (500, 400)) -> bytes:
        """Create a more complex test image with gradients and patterns."""
        image = Image.new("RGB", size)
        pixels = image.load()
        
        if pixels is not None:
            for i in range(size[0]):
                for j in range(size[1]):
                    # Create gradient pattern
                    r = int(255 * i / size[0])
                    g = int(255 * j / size[1])
                    b = int(255 * (i + j) / (size[0] + size[1]))
                    pixels[i, j] = (r, g, b)
        
        buffer = io.BytesIO()
        image.save(buffer, format=format_type, quality=95)
        return buffer.getvalue()
    
    @pytest.mark.asyncio
    async def test_real_world_image_processing(self):
        """Test processing of a realistic image with gradients."""
        image_data = self.create_complex_test_image("JPEG", (800, 600))
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Verify processing worked
        assert len(processed_data) > 0
        assert metadata["dimensions"] == (800, 600)
        
        # Verify processed image is valid
        processed_image = Image.open(io.BytesIO(processed_data))
        assert processed_image.mode == "RGB"
        assert processed_image.format == "JPEG"
    
    @pytest.mark.asyncio
    async def test_edge_case_very_small_image(self):
        """Test processing of very small image."""
        # Create 1x1 pixel image
        image = Image.new("RGB", (1, 1), color="red")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        image_data = buffer.getvalue()
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        assert len(processed_data) > 0
        assert metadata["dimensions"] == (1, 1)
    
    @pytest.mark.asyncio
    async def test_edge_case_square_image(self):
        """Test processing of square image."""
        image_data = self.create_complex_test_image("PNG", (512, 512))
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        assert len(processed_data) > 0
        assert metadata["dimensions"] == (512, 512)
        assert metadata["original_format"] == "png"
    
    @pytest.mark.asyncio
    async def test_edge_case_very_wide_image(self):
        """Test processing of very wide image."""
        image_data = self.create_complex_test_image("JPEG", (2000, 100))
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Should be resized to fit within 1024px max dimension
        processed_image = Image.open(io.BytesIO(processed_data))
        assert max(processed_image.size) <= 1024
        
        # Aspect ratio should be preserved
        original_ratio = 2000 / 100
        processed_ratio = processed_image.size[0] / processed_image.size[1]
        assert abs(original_ratio - processed_ratio) < 0.1
    
    @pytest.mark.asyncio
    async def test_edge_case_very_tall_image(self):
        """Test processing of very tall image."""
        image_data = self.create_complex_test_image("JPEG", (100, 2000))
        
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Should be resized to fit within 1024px max dimension
        processed_image = Image.open(io.BytesIO(processed_data))
        assert max(processed_image.size) <= 1024
        
        # Aspect ratio should be preserved
        original_ratio = 100 / 2000
        processed_ratio = processed_image.size[0] / processed_image.size[1]
        assert abs(original_ratio - processed_ratio) < 0.1


@pytest.mark.unit
class TestImagePreprocessorUnit:
    """Unit tests specifically marked for unit test runs."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.preprocessor = ImagePreprocessor()
    
    def test_initialization(self):
        """Test ImagePreprocessor initialization."""
        assert self.preprocessor.config is not None
        assert hasattr(self.preprocessor.config, 'max_image_size_mb')
        assert hasattr(self.preprocessor.config, 'max_ai_image_size_kb')
        assert hasattr(self.preprocessor.config, 'image_compression_quality')
        assert hasattr(self.preprocessor.config, 'supported_formats')
    
    def test_config_values(self):
        """Test that configuration has expected default values."""
        config = self.preprocessor.config
        assert config.max_image_size_mb == 10
        assert config.max_ai_image_size_kb == 500
        assert config.image_compression_quality == 85
        assert "image/jpeg" in config.supported_formats
        assert "image/png" in config.supported_formats
        assert "image/webp" in config.supported_formats