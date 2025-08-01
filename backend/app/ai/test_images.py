"""Test image library with known scenarios for prompt testing."""

import io
import logging
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class TestScenario(str, Enum):
    """Predefined test scenarios for image analysis."""

    BATHROOM_SINK = "bathroom_sink"
    KITCHEN_APPLIANCES = "kitchen_appliances"
    LAWN_MAINTENANCE = "lawn_maintenance"
    DISHWASHER_INTERIOR = "dishwasher_interior"
    BATHROOM_SHOWER = "bathroom_shower"
    GARAGE_TOOLS = "garage_tools"
    HVAC_FILTER = "hvac_filter"
    WINDOW_CLEANING = "window_cleaning"
    DECK_MAINTENANCE = "deck_maintenance"
    GUTTER_CLEANING = "gutter_cleaning"


@dataclass
class TestImageMetadata:
    """Metadata for test images."""

    scenario: TestScenario
    description: str
    expected_tasks: List[str]
    expected_categories: List[str]
    expected_priorities: List[str]
    room_type: Optional[str] = None
    difficulty_level: str = "medium"  # easy, medium, hard
    notes: Optional[str] = None


class TestImageLibrary:
    """Library of test images for prompt development and evaluation."""

    # Maximum number of images to cache (prevent unbounded growth)
    MAX_CACHE_SIZE = 50

    def __init__(self):
        """Initialize the test image library."""
        self._image_cache: Dict[TestScenario, bytes] = {}
        self._metadata_cache: Dict[TestScenario, TestImageMetadata] = {}
        self._initialize_metadata()

    def _initialize_metadata(self) -> None:
        """Initialize metadata for all test scenarios."""
        self._metadata_cache = {
            TestScenario.BATHROOM_SINK: TestImageMetadata(
                scenario=TestScenario.BATHROOM_SINK,
                description="Bathroom sink with limescale buildup and soap scum",
                expected_tasks=[
                    "Clean limescale from faucet",
                    "Remove soap scum from sink basin",
                    "Polish chrome fixtures",
                ],
                expected_categories=["cleaning", "maintenance"],
                expected_priorities=["medium", "low"],
                room_type="bathroom",
                difficulty_level="easy",
                notes="Common bathroom maintenance scenario",
            ),
            TestScenario.KITCHEN_APPLIANCES: TestImageMetadata(
                scenario=TestScenario.KITCHEN_APPLIANCES,
                description="Kitchen with dirty stovetop and grease buildup",
                expected_tasks=[
                    "Clean stovetop burners",
                    "Degrease range hood",
                    "Wipe down appliance surfaces",
                ],
                expected_categories=["cleaning", "maintenance"],
                expected_priorities=["medium", "high"],
                room_type="kitchen",
                difficulty_level="medium",
                notes="Grease and food residue cleaning",
            ),
            TestScenario.LAWN_MAINTENANCE: TestImageMetadata(
                scenario=TestScenario.LAWN_MAINTENANCE,
                description="Overgrown lawn with weeds and uneven grass",
                expected_tasks=[
                    "Mow overgrown grass",
                    "Remove weeds from lawn",
                    "Edge lawn borders",
                ],
                expected_categories=["lawn care", "maintenance"],
                expected_priorities=["medium", "low"],
                room_type="outdoor",
                difficulty_level="medium",
                notes="Seasonal lawn maintenance",
            ),
            TestScenario.DISHWASHER_INTERIOR: TestImageMetadata(
                scenario=TestScenario.DISHWASHER_INTERIOR,
                description="Dishwasher interior with food debris and mineral deposits",
                expected_tasks=[
                    "Clean dishwasher filter",
                    "Remove food debris from spray arms",
                    "Run dishwasher cleaning cycle",
                ],
                expected_categories=["cleaning", "appliance maintenance"],
                expected_priorities=["medium", "high"],
                room_type="kitchen",
                difficulty_level="medium",
                notes="Appliance maintenance scenario",
            ),
            TestScenario.BATHROOM_SHOWER: TestImageMetadata(
                scenario=TestScenario.BATHROOM_SHOWER,
                description="Shower with mold, mildew, and soap buildup",
                expected_tasks=[
                    "Remove mold from grout",
                    "Clean soap buildup from tiles",
                    "Replace shower caulking",
                ],
                expected_categories=["cleaning", "repair", "safety"],
                expected_priorities=["high", "medium"],
                room_type="bathroom",
                difficulty_level="hard",
                notes="Health and safety concerns with mold",
            ),
            TestScenario.GARAGE_TOOLS: TestImageMetadata(
                scenario=TestScenario.GARAGE_TOOLS,
                description="Garage with rusty tools and disorganized storage",
                expected_tasks=[
                    "Remove rust from metal tools",
                    "Organize tool storage",
                    "Oil tool hinges and moving parts",
                ],
                expected_categories=["maintenance", "organization", "repair"],
                expected_priorities=["medium", "low"],
                room_type="garage",
                difficulty_level="medium",
                notes="Tool maintenance and organization",
            ),
            TestScenario.HVAC_FILTER: TestImageMetadata(
                scenario=TestScenario.HVAC_FILTER,
                description="Dirty HVAC filter with dust and debris buildup",
                expected_tasks=[
                    "Replace HVAC filter",
                    "Check filter housing for debris",
                    "Schedule regular filter changes",
                ],
                expected_categories=["maintenance", "air quality"],
                expected_priorities=["high", "medium"],
                room_type="utility",
                difficulty_level="easy",
                notes="Important for air quality and system efficiency",
            ),
            TestScenario.WINDOW_CLEANING: TestImageMetadata(
                scenario=TestScenario.WINDOW_CLEANING,
                description="Windows with water spots, dirt, and streaks",
                expected_tasks=[
                    "Clean window glass",
                    "Remove water spots",
                    "Clean window frames and sills",
                ],
                expected_categories=["cleaning", "maintenance"],
                expected_priorities=["low", "medium"],
                room_type="interior",
                difficulty_level="easy",
                notes="Aesthetic and light improvement",
            ),
            TestScenario.DECK_MAINTENANCE: TestImageMetadata(
                scenario=TestScenario.DECK_MAINTENANCE,
                description="Wooden deck with weathering, stains, and loose boards",
                expected_tasks=[
                    "Sand weathered deck boards",
                    "Apply deck stain or sealant",
                    "Tighten loose deck screws",
                ],
                expected_categories=["maintenance", "repair", "safety"],
                expected_priorities=["medium", "high"],
                room_type="outdoor",
                difficulty_level="hard",
                notes="Seasonal maintenance for wood preservation",
            ),
            TestScenario.GUTTER_CLEANING: TestImageMetadata(
                scenario=TestScenario.GUTTER_CLEANING,
                description="Gutters with leaves, debris, and potential clogs",
                expected_tasks=[
                    "Remove leaves from gutters",
                    "Clear downspout clogs",
                    "Check gutter alignment",
                ],
                expected_categories=["maintenance", "safety", "cleaning"],
                expected_priorities=["high", "medium"],
                room_type="outdoor",
                difficulty_level="medium",
                notes="Important for water damage prevention",
            ),
        }

    def get_test_image(self, scenario: TestScenario) -> bytes:
        """
        Get test image for a specific scenario.

        Args:
            scenario: Test scenario to get image for

        Returns:
            Image data as bytes

        Raises:
            ValueError: If scenario is not supported
        """
        if scenario not in self._metadata_cache:
            raise ValueError(f"Unsupported test scenario: {scenario}")

        # Check cache first
        if scenario in self._image_cache:
            return self._image_cache[scenario]

        # Generate synthetic image for the scenario
        image_data = self._generate_synthetic_image(scenario)

        # Manage cache size
        if len(self._image_cache) >= self.MAX_CACHE_SIZE:
            # Remove oldest entry (simple FIFO policy)
            oldest_key = next(iter(self._image_cache))
            del self._image_cache[oldest_key]

        self._image_cache[scenario] = image_data
        return image_data

    def get_test_metadata(self, scenario: TestScenario) -> TestImageMetadata:
        """
        Get metadata for a test scenario.

        Args:
            scenario: Test scenario to get metadata for

        Returns:
            Test image metadata

        Raises:
            ValueError: If scenario is not supported
        """
        if scenario not in self._metadata_cache:
            raise ValueError(f"Unsupported test scenario: {scenario}")

        return self._metadata_cache[scenario]

    def get_all_scenarios(self) -> List[TestScenario]:
        """
        Get list of all available test scenarios.

        Returns:
            List of test scenarios
        """
        return list(TestScenario)

    def get_scenarios_by_difficulty(self, difficulty: str) -> List[TestScenario]:
        """
        Get scenarios filtered by difficulty level.

        Args:
            difficulty: Difficulty level (easy, medium, hard)

        Returns:
            List of scenarios matching the difficulty
        """
        return [
            scenario
            for scenario, metadata in self._metadata_cache.items()
            if metadata.difficulty_level == difficulty
        ]

    def get_scenarios_by_room(self, room_type: str) -> List[TestScenario]:
        """
        Get scenarios filtered by room type.

        Args:
            room_type: Room type to filter by

        Returns:
            List of scenarios for the specified room type
        """
        return [
            scenario
            for scenario, metadata in self._metadata_cache.items()
            if metadata.room_type == room_type
        ]

    def _generate_synthetic_image(self, scenario: TestScenario) -> bytes:
        """
        Generate a synthetic test image for a scenario.

        Args:
            scenario: Test scenario to generate image for

        Returns:
            Generated image as bytes
        """
        # Create a 800x600 image with scenario-specific content
        width, height = 800, 600
        image = Image.new("RGB", (width, height), color="white")
        draw = ImageDraw.Draw(image)

        # Get cached fonts
        font, small_font = self._get_fonts()

        metadata = self._metadata_cache[scenario]

        # Draw scenario-specific content
        if scenario == TestScenario.BATHROOM_SINK:
            self._draw_bathroom_sink(draw, width, height, font, small_font)
        elif scenario == TestScenario.KITCHEN_APPLIANCES:
            self._draw_kitchen_appliances(draw, width, height, font, small_font)
        elif scenario == TestScenario.LAWN_MAINTENANCE:
            self._draw_lawn_maintenance(draw, width, height, font, small_font)
        elif scenario == TestScenario.DISHWASHER_INTERIOR:
            self._draw_dishwasher_interior(draw, width, height, font, small_font)
        elif scenario == TestScenario.BATHROOM_SHOWER:
            self._draw_bathroom_shower(draw, width, height, font, small_font)
        else:
            # Generic scenario drawing
            self._draw_generic_scenario(draw, width, height, font, small_font, metadata)

        # Add scenario label
        draw.text((10, 10), f"Test Scenario: {scenario.value}", fill="black", font=font)
        draw.text((10, height - 40), metadata.description, fill="gray", font=small_font)

        # Convert to bytes using context manager
        with io.BytesIO() as output:
            image.save(output, format="JPEG", quality=85)
            return output.getvalue()

    def _draw_bathroom_sink(
        self, draw: Any, width: int, height: int, font: Any, small_font: Any
    ) -> None:
        """Draw bathroom sink scenario."""
        # Sink basin
        draw.ellipse([200, 200, 600, 400], fill="lightgray", outline="gray", width=3)

        # Faucet
        draw.rectangle([380, 150, 420, 200], fill="silver", outline="darkgray", width=2)
        draw.ellipse([370, 140, 430, 160], fill="silver", outline="darkgray", width=2)

        # Limescale spots (white spots)
        spots = [(390, 170), (410, 180), (385, 185), (415, 175)]
        for spot in spots:
            draw.ellipse(
                [spot[0] - 5, spot[1] - 5, spot[0] + 5, spot[1] + 5], fill="white"
            )

        # Soap scum (yellowish areas)
        draw.ellipse([250, 250, 350, 300], fill="lightyellow", outline="yellow")
        draw.ellipse([450, 280, 550, 330], fill="lightyellow", outline="yellow")

        # Labels
        draw.text(
            (300, 450), "Limescale buildup on faucet", fill="red", font=small_font
        )
        draw.text((300, 470), "Soap scum in basin", fill="red", font=small_font)

    def _draw_kitchen_appliances(
        self, draw: Any, width: int, height: int, font: Any, small_font: Any
    ) -> None:
        """Draw kitchen appliances scenario."""
        # Stovetop
        draw.rectangle([100, 200, 500, 400], fill="black", outline="gray", width=3)

        # Burners
        burner_positions = [(150, 250), (250, 250), (350, 250), (450, 250)]
        for pos in burner_positions:
            draw.ellipse(
                [pos[0] - 30, pos[1] - 30, pos[0] + 30, pos[1] + 30],
                fill="darkgray",
                outline="black",
                width=2,
            )

        # Grease spots (brown/yellow stains)
        grease_spots = [(180, 320), (320, 340), (420, 310)]
        for spot in grease_spots:
            draw.ellipse(
                [spot[0] - 15, spot[1] - 10, spot[0] + 15, spot[1] + 10],
                fill="brown",
                outline="#8B4513",
            )

        # Range hood above
        draw.rectangle([150, 100, 450, 150], fill="silver", outline="gray", width=2)

        # Grease on range hood
        draw.ellipse([200, 120, 250, 140], fill="yellow", outline="orange")
        draw.ellipse([350, 125, 400, 145], fill="yellow", outline="orange")

        # Labels
        draw.text(
            (100, 450),
            "Grease buildup on stovetop and range hood",
            fill="red",
            font=small_font,
        )

    def _draw_lawn_maintenance(
        self, draw: Any, width: int, height: int, font: Any, small_font: Any
    ) -> None:
        """Draw lawn maintenance scenario."""
        # Grass background
        draw.rectangle([0, 300, width, height], fill="lightgreen")

        # Overgrown grass areas (darker green, irregular)
        overgrown_areas = [
            [(100, 350), (200, 320), (250, 380), (150, 400)],
            [(400, 330), (500, 310), (550, 370), (450, 390)],
            [(600, 340), (700, 325), (720, 385), (620, 395)],
        ]

        for area in overgrown_areas:
            draw.polygon(area, fill="darkgreen", outline="green")

        # Weeds (small brown/yellow spots)
        weed_positions = [(180, 360), (320, 350), (480, 370), (650, 355)]
        for pos in weed_positions:
            draw.ellipse(
                [pos[0] - 8, pos[1] - 8, pos[0] + 8, pos[1] + 8],
                fill="brown",
                outline="#8B4513",
            )

        # Uneven edges
        draw.polygon(
            [
                (0, 300),
                (50, 290),
                (100, 305),
                (150, 295),
                (200, 300),
                (200, height),
                (0, height),
            ],
            fill="brown",
        )

        # Labels
        draw.text(
            (50, 450),
            "Overgrown grass and weeds need attention",
            fill="red",
            font=small_font,
        )

    def _draw_dishwasher_interior(
        self, draw: Any, width: int, height: int, font: Any, small_font: Any
    ) -> None:
        """Draw dishwasher interior scenario."""
        # Dishwasher interior
        draw.rectangle([100, 100, 700, 500], fill="lightgray", outline="gray", width=3)

        # Dish racks
        draw.rectangle([150, 150, 650, 200], fill="silver", outline="darkgray", width=2)
        draw.rectangle([150, 300, 650, 350], fill="silver", outline="darkgray", width=2)

        # Spray arms
        draw.ellipse([350, 220, 450, 280], fill="white", outline="gray", width=2)
        draw.ellipse([350, 370, 450, 430], fill="white", outline="gray", width=2)

        # Food debris (brown spots)
        debris_spots = [(200, 240), (500, 260), (300, 390), (550, 410)]
        for spot in debris_spots:
            draw.ellipse(
                [spot[0] - 6, spot[1] - 6, spot[0] + 6, spot[1] + 6],
                fill="brown",
                outline="#8B4513",
            )

        # Mineral deposits (white crusty areas)
        draw.ellipse([180, 180, 220, 200], fill="white", outline="lightgray")
        draw.ellipse([580, 320, 620, 340], fill="white", outline="lightgray")

        # Filter at bottom (dirty)
        draw.ellipse([350, 450, 450, 480], fill="gray", outline="darkgray", width=2)
        draw.ellipse([370, 460, 430, 470], fill="brown")

        # Labels
        draw.text(
            (100, 520),
            "Food debris and mineral deposits need cleaning",
            fill="red",
            font=small_font,
        )

    def _draw_bathroom_shower(
        self, draw: Any, width: int, height: int, font: Any, small_font: Any
    ) -> None:
        """Draw bathroom shower scenario."""
        # Shower walls (tiles)
        tile_size = 40
        for x in range(100, 700, tile_size):
            for y in range(100, 500, tile_size):
                draw.rectangle(
                    [x, y, x + tile_size - 2, y + tile_size - 2],
                    fill="white",
                    outline="lightgray",
                )

        # Grout lines with mold (dark spots)
        mold_positions = [(140, 200), (260, 180), (380, 220), (500, 160), (620, 240)]
        for pos in mold_positions:
            draw.ellipse([pos[0] - 3, pos[1] - 3, pos[0] + 3, pos[1] + 3], fill="black")

        # Soap buildup (yellowish areas)
        soap_areas = [(200, 300), (400, 350), (550, 280)]
        for area in soap_areas:
            draw.ellipse(
                [area[0] - 20, area[1] - 15, area[0] + 20, area[1] + 15],
                fill="lightyellow",
                outline="yellow",
            )

        # Shower head
        draw.ellipse([350, 120, 450, 160], fill="silver", outline="gray", width=2)

        # Caulking (with dark mold)
        draw.rectangle([100, 480, 700, 500], fill="white", outline="gray")
        mold_caulk = [(200, 490), (350, 485), (500, 492), (650, 488)]
        for pos in mold_caulk:
            draw.ellipse([pos[0] - 5, pos[1] - 2, pos[0] + 5, pos[1] + 2], fill="black")

        # Labels
        draw.text(
            (100, 520),
            "Mold in grout and caulking - health hazard",
            fill="red",
            font=small_font,
        )

    def _draw_generic_scenario(
        self,
        draw: Any,
        width: int,
        height: int,
        font: Any,
        small_font: Any,
        metadata: TestImageMetadata,
    ) -> None:
        """Draw generic scenario representation."""
        # Simple representation with text and basic shapes
        draw.rectangle([100, 150, 700, 450], fill="lightblue", outline="blue", width=3)

        # Center the scenario description
        text_lines = [
            f"Scenario: {metadata.scenario.value}",
            f"Room: {metadata.room_type or 'Various'}",
            f"Difficulty: {metadata.difficulty_level}",
            "",
            "Expected maintenance areas:",
        ]

        # Add expected tasks
        for i, task in enumerate(metadata.expected_tasks[:3]):  # Show first 3 tasks
            text_lines.append(f"• {task}")

        y_offset = 200
        for line in text_lines:
            draw.text((120, y_offset), line, fill="black", font=small_font)
            y_offset += 25

    def create_custom_test_image(
        self, description: str, width: int = 800, height: int = 600
    ) -> bytes:
        """
        Create a custom test image with specified description.

        Args:
            description: Description to display on the image
            width: Image width in pixels
            height: Image height in pixels

        Returns:
            Generated image as bytes
        """
        image = Image.new("RGB", (width, height), color="lightgray")
        draw = ImageDraw.Draw(image)

        font, _ = self._get_fonts(size=20)

        # Draw border
        draw.rectangle([10, 10, width - 10, height - 10], outline="black", width=3)

        # Add title
        draw.text((20, 30), "Custom Test Image", fill="black", font=font)

        # Add description (wrap text)
        words = description.split()
        lines = []
        current_line: List[str] = []
        max_width = width - 40

        for word in words:
            test_line = " ".join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]

        if current_line:
            lines.append(" ".join(current_line))

        y_offset = 80
        for line in lines:
            draw.text((20, y_offset), line, fill="black", font=font)
            y_offset += 30

        # Convert to bytes using context manager
        with io.BytesIO() as output:
            image.save(output, format="JPEG", quality=85)
            return output.getvalue()

    def get_scenario_summary(self) -> Dict[str, Dict[str, Any]]:
        """
        Get summary of all test scenarios.

        Returns:
            Dictionary with scenario summaries
        """
        summary = {}
        for scenario, metadata in self._metadata_cache.items():
            summary[scenario.value] = {
                "description": metadata.description,
                "room_type": metadata.room_type,
                "difficulty": metadata.difficulty_level,
                "expected_task_count": len(metadata.expected_tasks),
                "expected_categories": metadata.expected_categories,
                "notes": metadata.notes,
            }
        return summary

    @lru_cache(maxsize=10)
    def _get_fonts(self, size: int = 24) -> Tuple[Any, Any]:
        """
        Get cached fonts for image generation.

        Args:
            size: Base font size

        Returns:
            Tuple of (regular_font, small_font)
        """
        font: Any
        small_font: Any
        try:
            font = ImageFont.truetype("arial.ttf", size)
            small_font = ImageFont.truetype("arial.ttf", max(12, size - 8))
        except (OSError, IOError):
            # Fall back to default fonts
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        return font, small_font
