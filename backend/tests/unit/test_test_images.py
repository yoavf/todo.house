"""Unit tests for test image library functionality."""

import pytest
from PIL import Image
import io

from app.ai.test_images import (
    TestImageLibrary,
    TestScenario,
    TestImageMetadata
)


class TestTestImageLibrary:
    """Test cases for TestImageLibrary class."""
    
    @pytest.fixture
    def image_library(self):
        """Create test image library instance."""
        return TestImageLibrary()
    
    def test_initialization(self, image_library):
        """Test library initialization."""
        assert isinstance(image_library, TestImageLibrary)
        assert len(image_library._metadata_cache) > 0
        assert len(image_library._image_cache) == 0  # Images loaded on demand
    
    def test_get_test_image_bathroom_sink(self, image_library):
        """Test getting bathroom sink test image."""
        image_data = image_library.get_test_image(TestScenario.BATHROOM_SINK)
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
        
        # Verify it's a valid image
        image = Image.open(io.BytesIO(image_data))
        assert image.format == 'JPEG'
        assert image.size == (800, 600)
    
    def test_get_test_image_kitchen_appliances(self, image_library):
        """Test getting kitchen appliances test image."""
        image_data = image_library.get_test_image(TestScenario.KITCHEN_APPLIANCES)
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
        
        # Verify it's a valid image
        image = Image.open(io.BytesIO(image_data))
        assert image.format == 'JPEG'
        assert image.size == (800, 600)
    
    def test_get_test_image_caching(self, image_library):
        """Test that images are cached after first load."""
        scenario = TestScenario.BATHROOM_SINK
        
        # First call should generate and cache
        image_data1 = image_library.get_test_image(scenario)
        assert scenario in image_library._image_cache
        
        # Second call should return cached version
        image_data2 = image_library.get_test_image(scenario)
        assert image_data1 == image_data2
    
    def test_get_test_image_invalid_scenario(self, image_library):
        """Test getting test image with invalid scenario."""
        # Create a mock invalid scenario (this would normally be caught by type system)
        with pytest.raises(ValueError, match="Unsupported test scenario"):
            # We need to bypass the enum validation to test this
            image_library._metadata_cache.clear()  # Clear cache to force error
            image_library.get_test_image(TestScenario.BATHROOM_SINK)
    
    def test_get_test_metadata_bathroom_sink(self, image_library):
        """Test getting bathroom sink metadata."""
        metadata = image_library.get_test_metadata(TestScenario.BATHROOM_SINK)
        
        assert isinstance(metadata, TestImageMetadata)
        assert metadata.scenario == TestScenario.BATHROOM_SINK
        assert metadata.description
        assert len(metadata.expected_tasks) > 0
        assert len(metadata.expected_categories) > 0
        assert len(metadata.expected_priorities) > 0
        assert metadata.room_type == "bathroom"
        assert metadata.difficulty_level in ["easy", "medium", "hard"]
    
    def test_get_test_metadata_all_scenarios(self, image_library):
        """Test getting metadata for all scenarios."""
        for scenario in TestScenario:
            metadata = image_library.get_test_metadata(scenario)
            
            assert isinstance(metadata, TestImageMetadata)
            assert metadata.scenario == scenario
            assert isinstance(metadata.description, str)
            assert len(metadata.description) > 0
            assert isinstance(metadata.expected_tasks, list)
            assert isinstance(metadata.expected_categories, list)
            assert isinstance(metadata.expected_priorities, list)
            assert metadata.difficulty_level in ["easy", "medium", "hard"]
    
    def test_get_all_scenarios(self, image_library):
        """Test getting all available scenarios."""
        scenarios = image_library.get_all_scenarios()
        
        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
        assert all(isinstance(s, TestScenario) for s in scenarios)
        
        # Should include all enum values
        expected_scenarios = list(TestScenario)
        assert set(scenarios) == set(expected_scenarios)
    
    def test_get_scenarios_by_difficulty_easy(self, image_library):
        """Test filtering scenarios by easy difficulty."""
        easy_scenarios = image_library.get_scenarios_by_difficulty("easy")
        
        assert isinstance(easy_scenarios, list)
        
        # Verify all returned scenarios are actually easy
        for scenario in easy_scenarios:
            metadata = image_library.get_test_metadata(scenario)
            assert metadata.difficulty_level == "easy"
    
    def test_get_scenarios_by_difficulty_medium(self, image_library):
        """Test filtering scenarios by medium difficulty."""
        medium_scenarios = image_library.get_scenarios_by_difficulty("medium")
        
        assert isinstance(medium_scenarios, list)
        
        # Verify all returned scenarios are actually medium
        for scenario in medium_scenarios:
            metadata = image_library.get_test_metadata(scenario)
            assert metadata.difficulty_level == "medium"
    
    def test_get_scenarios_by_difficulty_hard(self, image_library):
        """Test filtering scenarios by hard difficulty."""
        hard_scenarios = image_library.get_scenarios_by_difficulty("hard")
        
        assert isinstance(hard_scenarios, list)
        
        # Verify all returned scenarios are actually hard
        for scenario in hard_scenarios:
            metadata = image_library.get_test_metadata(scenario)
            assert metadata.difficulty_level == "hard"
    
    def test_get_scenarios_by_difficulty_invalid(self, image_library):
        """Test filtering with invalid difficulty."""
        invalid_scenarios = image_library.get_scenarios_by_difficulty("invalid")
        
        # Should return empty list for invalid difficulty
        assert isinstance(invalid_scenarios, list)
        assert len(invalid_scenarios) == 0
    
    def test_get_scenarios_by_room_bathroom(self, image_library):
        """Test filtering scenarios by bathroom room type."""
        bathroom_scenarios = image_library.get_scenarios_by_room("bathroom")
        
        assert isinstance(bathroom_scenarios, list)
        assert len(bathroom_scenarios) > 0
        
        # Verify all returned scenarios are actually bathroom
        for scenario in bathroom_scenarios:
            metadata = image_library.get_test_metadata(scenario)
            assert metadata.room_type == "bathroom"
    
    def test_get_scenarios_by_room_kitchen(self, image_library):
        """Test filtering scenarios by kitchen room type."""
        kitchen_scenarios = image_library.get_scenarios_by_room("kitchen")
        
        assert isinstance(kitchen_scenarios, list)
        
        # Verify all returned scenarios are actually kitchen
        for scenario in kitchen_scenarios:
            metadata = image_library.get_test_metadata(scenario)
            assert metadata.room_type == "kitchen"
    
    def test_get_scenarios_by_room_outdoor(self, image_library):
        """Test filtering scenarios by outdoor room type."""
        outdoor_scenarios = image_library.get_scenarios_by_room("outdoor")
        
        assert isinstance(outdoor_scenarios, list)
        
        # Verify all returned scenarios are actually outdoor
        for scenario in outdoor_scenarios:
            metadata = image_library.get_test_metadata(scenario)
            assert metadata.room_type == "outdoor"
    
    def test_get_scenarios_by_room_nonexistent(self, image_library):
        """Test filtering by non-existent room type."""
        nonexistent_scenarios = image_library.get_scenarios_by_room("nonexistent")
        
        # Should return empty list
        assert isinstance(nonexistent_scenarios, list)
        assert len(nonexistent_scenarios) == 0
    
    def test_create_custom_test_image_default_size(self, image_library):
        """Test creating custom test image with default size."""
        description = "Custom maintenance scenario for testing"
        image_data = image_library.create_custom_test_image(description)
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
        
        # Verify it's a valid image with correct size
        image = Image.open(io.BytesIO(image_data))
        assert image.format == 'JPEG'
        assert image.size == (800, 600)
    
    def test_create_custom_test_image_custom_size(self, image_library):
        """Test creating custom test image with custom size."""
        description = "Custom test image"
        width, height = 1024, 768
        image_data = image_library.create_custom_test_image(
            description, width=width, height=height
        )
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
        
        # Verify it's a valid image with correct size
        image = Image.open(io.BytesIO(image_data))
        assert image.format == 'JPEG'
        assert image.size == (width, height)
    
    def test_create_custom_test_image_long_description(self, image_library):
        """Test creating custom test image with long description."""
        description = "This is a very long description that should be wrapped across multiple lines in the generated image to test the text wrapping functionality of the custom image generator."
        image_data = image_library.create_custom_test_image(description)
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
        
        # Should still create valid image
        image = Image.open(io.BytesIO(image_data))
        assert image.format == 'JPEG'
    
    def test_get_scenario_summary(self, image_library):
        """Test getting scenario summary."""
        summary = image_library.get_scenario_summary()
        
        assert isinstance(summary, dict)
        assert len(summary) > 0
        
        # Check structure of summary
        for scenario_name, info in summary.items():
            assert isinstance(scenario_name, str)
            assert isinstance(info, dict)
            
            # Required fields
            assert "description" in info
            assert "difficulty" in info
            assert "expected_task_count" in info
            assert "expected_categories" in info
            
            # Optional fields
            assert "room_type" in info  # Can be None
            assert "notes" in info  # Can be None
            
            # Validate types
            assert isinstance(info["description"], str)
            assert info["difficulty"] in ["easy", "medium", "hard"]
            assert isinstance(info["expected_task_count"], int)
            assert isinstance(info["expected_categories"], list)
    
    def test_scenario_metadata_consistency(self, image_library):
        """Test that scenario metadata is consistent."""
        for scenario in TestScenario:
            metadata = image_library.get_test_metadata(scenario)
            
            # Basic consistency checks
            assert metadata.scenario == scenario
            assert len(metadata.expected_tasks) == len(set(metadata.expected_tasks))  # No duplicates
            assert len(metadata.expected_categories) > 0
            assert len(metadata.expected_priorities) > 0
            
            # Priority values should be valid
            valid_priorities = ["high", "medium", "low"]
            for priority in metadata.expected_priorities:
                assert priority in valid_priorities
            
            # Categories should be reasonable
            valid_categories = [
                "cleaning", "repair", "maintenance", "safety", 
                "seasonal", "organization", "lawn care", 
                "appliance maintenance", "air quality"
            ]
            for category in metadata.expected_categories:
                assert any(cat in category for cat in valid_categories)
    
    def test_synthetic_image_generation_scenarios(self, image_library):
        """Test that synthetic images are generated for all scenarios."""
        for scenario in TestScenario:
            image_data = image_library.get_test_image(scenario)
            
            assert isinstance(image_data, bytes)
            assert len(image_data) > 0
            
            # Verify it's a valid JPEG image
            image = Image.open(io.BytesIO(image_data))
            assert image.format == 'JPEG'
            assert image.size == (800, 600)
            
            # Image should contain scenario label
            # Note: We can't easily test text content without OCR,
            # but we can verify the image was generated successfully
    
    def test_image_generation_deterministic(self, image_library):
        """Test that image generation is deterministic."""
        scenario = TestScenario.BATHROOM_SINK
        
        # Clear cache to force regeneration
        if scenario in image_library._image_cache:
            del image_library._image_cache[scenario]
        
        # Generate image twice
        image_data1 = image_library.get_test_image(scenario)
        
        # Clear cache again
        del image_library._image_cache[scenario]
        image_data2 = image_library.get_test_image(scenario)
        
        # Should be identical (deterministic generation)
        assert image_data1 == image_data2


class TestTestScenario:
    """Test cases for TestScenario enum."""
    
    def test_scenario_enum_values(self):
        """Test that all scenario enum values are strings."""
        for scenario in TestScenario:
            assert isinstance(scenario.value, str)
            assert len(scenario.value) > 0
            assert "_" in scenario.value  # Should use snake_case
    
    def test_scenario_enum_completeness(self):
        """Test that we have a reasonable number of scenarios."""
        scenarios = list(TestScenario)
        
        # Should have at least 5 scenarios for good testing coverage
        assert len(scenarios) >= 5
        
        # Should have scenarios for different room types
        scenario_values = [s.value for s in scenarios]
        assert any("bathroom" in s for s in scenario_values)
        assert any("kitchen" in s for s in scenario_values)
        assert any("lawn" in s for s in scenario_values)
    
    def test_scenario_enum_uniqueness(self):
        """Test that all scenario values are unique."""
        scenario_values = [s.value for s in TestScenario]
        assert len(scenario_values) == len(set(scenario_values))


class TestTestImageMetadata:
    """Test cases for TestImageMetadata dataclass."""
    
    def test_metadata_creation(self):
        """Test creating metadata instance."""
        metadata = TestImageMetadata(
            scenario=TestScenario.BATHROOM_SINK,
            description="Test description",
            expected_tasks=["task1", "task2"],
            expected_categories=["cleaning"],
            expected_priorities=["medium"]
        )
        
        assert metadata.scenario == TestScenario.BATHROOM_SINK
        assert metadata.description == "Test description"
        assert metadata.expected_tasks == ["task1", "task2"]
        assert metadata.expected_categories == ["cleaning"]
        assert metadata.expected_priorities == ["medium"]
        assert metadata.room_type is None  # Default value
        assert metadata.difficulty_level == "medium"  # Default value
        assert metadata.notes is None  # Default value
    
    def test_metadata_with_optional_fields(self):
        """Test creating metadata with optional fields."""
        metadata = TestImageMetadata(
            scenario=TestScenario.KITCHEN_APPLIANCES,
            description="Kitchen test",
            expected_tasks=["clean stove"],
            expected_categories=["cleaning"],
            expected_priorities=["high"],
            room_type="kitchen",
            difficulty_level="hard",
            notes="Special test case"
        )
        
        assert metadata.room_type == "kitchen"
        assert metadata.difficulty_level == "hard"
        assert metadata.notes == "Special test case"
    
    def test_metadata_equality(self):
        """Test metadata equality comparison."""
        metadata1 = TestImageMetadata(
            scenario=TestScenario.BATHROOM_SINK,
            description="Test",
            expected_tasks=["task1"],
            expected_categories=["cleaning"],
            expected_priorities=["medium"]
        )
        
        metadata2 = TestImageMetadata(
            scenario=TestScenario.BATHROOM_SINK,
            description="Test",
            expected_tasks=["task1"],
            expected_categories=["cleaning"],
            expected_priorities=["medium"]
        )
        
        metadata3 = TestImageMetadata(
            scenario=TestScenario.KITCHEN_APPLIANCES,
            description="Different",
            expected_tasks=["task2"],
            expected_categories=["repair"],
            expected_priorities=["high"]
        )
        
        assert metadata1 == metadata2
        assert metadata1 != metadata3


@pytest.mark.integration
class TestTestImageLibraryIntegration:
    """Integration tests for test image library."""
    
    def test_full_library_workflow(self):
        """Test complete library workflow."""
        library = TestImageLibrary()
        
        # Get all scenarios
        scenarios = library.get_all_scenarios()
        assert len(scenarios) > 0
        
        # Test each scenario
        for scenario in scenarios[:3]:  # Test first 3 for speed
            # Get metadata
            metadata = library.get_test_metadata(scenario)
            assert isinstance(metadata, TestImageMetadata)
            
            # Get image
            image_data = library.get_test_image(scenario)
            assert isinstance(image_data, bytes)
            assert len(image_data) > 0
            
            # Verify image is valid
            image = Image.open(io.BytesIO(image_data))
            assert image.format == 'JPEG'
        
        # Test filtering
        bathroom_scenarios = library.get_scenarios_by_room("bathroom")
        easy_scenarios = library.get_scenarios_by_difficulty("easy")
        
        assert len(bathroom_scenarios) >= 0
        assert len(easy_scenarios) >= 0
        
        # Test summary
        summary = library.get_scenario_summary()
        assert len(summary) == len(scenarios)
        
        # Test custom image
        custom_image = library.create_custom_test_image("Custom test scenario")
        assert isinstance(custom_image, bytes)
        assert len(custom_image) > 0