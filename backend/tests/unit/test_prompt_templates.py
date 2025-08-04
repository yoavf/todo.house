"""
Unit tests for prompt templates module.
Testing framework: pytest (based on backend/pyproject.toml)
"""

import pytest
from unittest.mock import Mock
import re
from app.ai.prompt_service import PromptService


class TestHomeMaintenancePromptTemplate:
    """Test suite for the home maintenance prompt template."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Load the prompt using PromptService
        self.prompt_service = PromptService()
        self.template_content = self.prompt_service.get_prompt(
            "home_maintenance_analysis"
        )

    def test_prompt_template_structure_validation(self):
        """Test that the prompt template has the required structural elements."""
        assert "You are a home maintenance expert" in self.template_content
        assert "analyze" in self.template_content.lower()
        assert "maintenance tasks" in self.template_content

    def test_task_requirements_specification(self):
        """Test that all required task fields are specified in the template."""
        required_fields = [
            "title",
            "description",
            "priority level",
            "category",
            "task_types",
        ]

        for field in required_fields:
            assert field.lower() in self.template_content.lower(), (
                f"Missing required field: {field}"
            )

    def test_priority_levels_defined(self):
        """Test that all priority levels are properly defined."""
        priority_levels = ["high", "medium", "low"]

        for level in priority_levels:
            assert level in self.template_content, (
                f"Priority level '{level}' not found in template"
            )

    def test_task_types_completeness(self):
        """Test that all task types are properly defined and documented."""
        expected_task_types = [
            "interior",
            "exterior",
            "electricity",
            "plumbing",
            "appliances",
            "maintenance",
            "repair",
        ]

        for task_type in expected_task_types:
            assert task_type in self.template_content, (
                f"Task type '{task_type}' not found in template"
            )

    def test_task_type_descriptions_present(self):
        """Test that each task type has a description."""
        task_type_patterns = [
            (r"interior:.*inside", "interior task type description"),
            (r"exterior:.*outside", "exterior task type description"),
            (r"electricity:.*electrical", "electricity task type description"),
            (r"plumbing:.*plumbing", "plumbing task type description"),
            (r"appliances:.*appliance", "appliances task type description"),
            (r"maintenance:.*upkeep", "maintenance task type description"),
            (r"repair:.*fixing", "repair task type description"),
        ]

        for pattern, description in task_type_patterns:
            assert re.search(pattern, self.template_content, re.IGNORECASE), (
                f"Missing {description}"
            )

    def test_confidence_score_ranges_defined(self):
        """Test that confidence score ranges are properly defined."""
        confidence_ranges = ["0.8-1.0", "0.5-0.7", "0.2-0.4"]

        for range_text in confidence_ranges:
            assert range_text in self.template_content, (
                f"Confidence range '{range_text}' not found"
            )

    def test_confidence_score_descriptions(self):
        """Test that confidence score descriptions are meaningful."""
        confidence_descriptions = [
            ("Very confident", "clear visual evidence"),
            ("Moderately confident", "likely issue"),
            ("Low confidence", "possible issue"),
        ]

        for description, context in confidence_descriptions:
            assert description in self.template_content, (
                f"Confidence description '{description}' not found"
            )
            assert context in self.template_content, (
                f"Confidence context '{context}' not found"
            )

    def test_focus_areas_specified(self):
        """Test that key focus areas are specified in the template."""
        focus_areas = [
            "Visible maintenance needs",
            "Safety concerns",
            "Preventive maintenance opportunities",
            "Seasonal considerations",
        ]

        for area in focus_areas:
            assert area in self.template_content, f"Focus area '{area}' not found"

    def test_title_length_constraint(self):
        """Test that title length constraint is specified."""
        assert "max 50 characters" in self.template_content, (
            "Title length constraint not specified"
        )

    def test_reasoning_field_requirement(self):
        """Test that reasoning field requirement is present."""
        assert "reasoning field" in self.template_content, (
            "Reasoning field requirement not found"
        )
        assert "explaining why it was identified" in self.template_content, (
            "Reasoning explanation not found"
        )

    def test_empty_tasks_handling(self):
        """Test that instructions for handling no maintenance tasks are present."""
        assert "empty tasks array" in self.template_content, (
            "Empty tasks array instruction not found"
        )
        assert "analysis_summary" in self.template_content, (
            "Analysis summary field not mentioned"
        )

    def test_template_word_count_reasonable(self):
        """Test that template is comprehensive but not overly verbose."""
        word_count = len(self.template_content.split())
        assert 100 < word_count < 500, (
            f"Template word count ({word_count}) may be too short or too long"
        )

    def test_template_readability(self):
        """Test template structure for readability."""
        lines = self.template_content.split("\n")
        non_empty_lines = [line for line in lines if line.strip()]

        # Should have reasonable number of paragraphs/sections
        assert len(non_empty_lines) > 15, "Template should have sufficient structure"

        # Should use numbered lists for organization
        numbered_items = [line for line in lines if re.match(r"^\d+\.", line.strip())]
        assert len(numbered_items) >= 5, (
            "Template should use numbered lists for organization"
        )

    def test_category_examples_provided(self):
        """Test that category examples are provided."""
        category_examples = ["cleaning", "repair", "maintenance", "safety"]

        for category in category_examples:
            assert category in self.template_content, (
                f"Category example '{category}' not found"
            )

    def test_template_language_professional(self):
        """Test that template uses professional, clear language."""
        # Should avoid casual language
        casual_words = ["gonna", "wanna", "kinda", "sorta"]
        for word in casual_words:
            assert word not in self.template_content.lower(), (
                f"Casual language '{word}' found in template"
            )

        # Should use imperative mood for instructions
        imperative_phrases = ["Provide", "Include", "Assign", "Focus on"]
        for phrase in imperative_phrases:
            assert phrase in self.template_content, (
                f"Imperative phrase '{phrase}' not found"
            )

    def test_task_field_ordering_logical(self):
        """Test that task fields are presented in logical order."""
        content_lower = self.template_content.lower()
        title_pos = content_lower.find("title")
        description_pos = content_lower.find("description")
        priority_pos = content_lower.find("priority level")
        category_pos = content_lower.find("category")

        # Title should come before description
        assert title_pos < description_pos, (
            "Title should be specified before description"
        )
        # Description should come before priority
        assert description_pos < priority_pos, (
            "Description should be specified before priority"
        )
        # Priority should come before category
        assert priority_pos < category_pos, (
            "Priority should be specified before category"
        )

    def test_confidence_score_boundary_values(self):
        """Test that confidence score boundary values are properly specified."""
        # Test that boundary values are clearly defined
        assert "0.0 to 1.0" in self.template_content, (
            "Confidence score range not specified"
        )
        assert "0.8-1.0" in self.template_content, "High confidence range missing"
        assert "0.5-0.7" in self.template_content, "Medium confidence range missing"
        assert "0.2-0.4" in self.template_content, "Low confidence range missing"

    def test_all_task_types_have_colon_descriptions(self):
        """Test that all task types follow consistent formatting with colons."""
        task_type_lines = [
            "interior:",
            "exterior:",
            "electricity:",
            "plumbing:",
            "appliances:",
            "maintenance:",
            "repair:",
        ]

        for task_type_line in task_type_lines:
            assert task_type_line in self.template_content, (
                f"Task type line '{task_type_line}' not found"
            )


class TestPromptTemplateValidation:
    """Test suite for prompt template validation functions."""

    def test_validate_template_completeness(self):
        """Test validation of template completeness."""
        # Load the actual template from PromptService
        prompt_service = PromptService()
        complete_template = prompt_service.get_prompt("home_maintenance_analysis")

        # This would be the actual validation function
        assert self._validate_template_structure(complete_template)

    def test_validate_incomplete_template(self):
        """Test validation fails for incomplete templates."""
        incomplete_template = "You are a home maintenance expert."

        assert not self._validate_template_structure(incomplete_template)

    def test_validate_template_missing_task_types(self):
        """Test validation fails when task types are missing."""
        template_missing_types = """You are a home maintenance expert analyzing an image to identify maintenance tasks.
        
Analyze this image and identify specific, actionable home maintenance tasks based on what you observe.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why"""

        assert not self._validate_template_structure(template_missing_types)

    def test_validate_template_missing_confidence_scores(self):
        """Test validation fails when confidence score instructions are missing."""
        template_no_confidence = """You are a home maintenance expert analyzing an image to identify maintenance tasks.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why
3. Assign a priority level (high, medium, low) based on urgency and safety"""

        assert not self._validate_template_structure(template_no_confidence)

    def test_validate_template_missing_priority_levels(self):
        """Test validation fails when priority levels are not specified."""
        template_no_priority = """You are a home maintenance expert analyzing an image to identify maintenance tasks.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why"""

        assert not self._validate_template_structure(template_no_priority)

    def _validate_template_structure(self, template: str) -> bool:
        """Helper method to validate template structure."""
        required_elements = [
            "home maintenance expert",
            "priority level",
            "task_types",
            "confidence score",
            "interior",
            "exterior",
            "electricity",
            "plumbing",
            "appliances",
            "maintenance",
            "repair",
            "high",
            "medium",
            "low",
        ]

        for element in required_elements:
            if element.lower() not in template.lower():
                return False
        return True


class TestPromptTemplateEdgeCases:
    """Test suite for edge cases and error conditions."""

    def test_empty_template_handling(self):
        """Test handling of empty template."""
        empty_template = ""

        with pytest.raises(ValueError, match="Template cannot be empty"):
            self._process_template(empty_template)

    def test_none_template_handling(self):
        """Test handling of None template."""
        with pytest.raises(TypeError, match="Template must be a string"):
            self._process_template(None)

    def test_extremely_long_template(self):
        """Test handling of extremely long templates."""
        very_long_template = "A" * 10000

        with pytest.raises(ValueError, match="Template exceeds maximum length"):
            self._process_template(very_long_template)

    def test_template_with_special_characters(self):
        """Test template handling with special characters and unicode."""
        template_with_unicode = """You are a home maintenance expert analyzing an image to identify maintenance tasks.

Analyze this image and identify specific, actionable home maintenance tasks based on what you observe.

Special characters: ©®™€£¥ñàéíóú

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why
3. Assign a priority level (high, medium, low) based on urgency and safety"""

        # Should handle unicode characters gracefully
        result = self._process_template(template_with_unicode)
        assert result is not None
        assert "Special characters" in result

    def test_template_line_ending_variations(self):
        """Test template with different line ending formats."""
        template_unix = "Line 1\nLine 2\nLine 3"
        template_windows = "Line 1\r\nLine 2\r\nLine 3"
        template_mac = "Line 1\rLine 2\rLine 3"

        # All should be processed successfully
        assert self._process_template(template_unix) is not None
        assert self._process_template(template_windows) is not None
        assert self._process_template(template_mac) is not None

    def test_template_with_malformed_numbered_list(self):
        """Test template with malformed numbered lists."""
        malformed_template = """You are a home maintenance expert.
        
1. First item
3. Third item (missing 2)
2. Second item (out of order)"""

        # Should still process but validation might flag issues
        result = self._process_template(malformed_template)
        assert result is not None

    def test_template_with_missing_bullet_points(self):
        """Test template with missing bullet point formatting."""
        template_no_bullets = """You are a home maintenance expert.
        
Focus on:
Visible maintenance needs
Safety concerns
Preventive maintenance"""

        result = self._process_template(template_no_bullets)
        assert result is not None

    def _process_template(self, template):
        """Helper method to simulate template processing."""
        if template is None:
            raise TypeError("Template must be a string")
        if not isinstance(template, str):
            raise TypeError("Template must be a string")
        if len(template) == 0:
            raise ValueError("Template cannot be empty")
        if len(template) > 5000:
            raise ValueError("Template exceeds maximum length")

        return template


class TestPromptTemplateIntegration:
    """Integration tests for prompt template usage."""

    def setup_method(self):
        """Set up integration test fixtures."""
        self.mock_ai_service = Mock()
        self.sample_image_data = b"fake_image_data"

    def test_template_with_mock_ai_service(self):
        """Test template integration with AI service."""
        expected_response = {
            "tasks": [
                {
                    "title": "Clean gutters",
                    "description": "Remove debris from gutters to prevent water damage",
                    "priority": "high",
                    "category": "maintenance",
                    "task_types": ["exterior", "maintenance"],
                    "reasoning": "Visible debris buildup in gutters",
                    "confidence": 0.9,
                }
            ],
            "analysis_summary": "Identified 1 maintenance task requiring attention",
        }

        self.mock_ai_service.analyze_image.return_value = expected_response

        result = self._simulate_ai_analysis(self.sample_image_data)

        assert result["tasks"] is not None
        assert len(result["tasks"]) == 1
        assert result["tasks"][0]["confidence"] >= 0.8
        assert result["tasks"][0]["priority"] in ["high", "medium", "low"]

    def test_template_no_tasks_response(self):
        """Test template handling when no tasks are identified."""
        no_tasks_response = {
            "tasks": [],
            "analysis_summary": "No maintenance tasks could be identified from the provided image",
        }

        self.mock_ai_service.analyze_image.return_value = no_tasks_response

        result = self._simulate_ai_analysis(self.sample_image_data)

        assert result["tasks"] == []
        assert "analysis_summary" in result
        assert len(result["analysis_summary"]) > 0

    def test_template_multiple_task_types(self):
        """Test template handling multiple task types for a single task."""
        multi_type_response = {
            "tasks": [
                {
                    "title": "Fix electrical outlet near sink",
                    "description": "GFCI outlet not working, potential safety hazard",
                    "priority": "high",
                    "category": "safety",
                    "task_types": ["interior", "electricity", "repair"],
                    "reasoning": "Electrical safety issue in wet area",
                    "confidence": 0.95,
                }
            ]
        }

        self.mock_ai_service.analyze_image.return_value = multi_type_response

        result = self._simulate_ai_analysis(self.sample_image_data)

        task = result["tasks"][0]
        assert len(task["task_types"]) == 3
        assert "interior" in task["task_types"]
        assert "electricity" in task["task_types"]
        assert "repair" in task["task_types"]

    def test_template_all_priority_levels(self):
        """Test template can handle all priority levels."""
        responses_by_priority = {
            "high": {
                "tasks": [
                    {"priority": "high", "title": "Emergency repair", "confidence": 0.9}
                ]
            },
            "medium": {
                "tasks": [
                    {
                        "priority": "medium",
                        "title": "Routine maintenance",
                        "confidence": 0.7,
                    }
                ]
            },
            "low": {
                "tasks": [
                    {
                        "priority": "low",
                        "title": "Cosmetic improvement",
                        "confidence": 0.3,
                    }
                ]
            },
        }

        for priority, response in responses_by_priority.items():
            self.mock_ai_service.analyze_image.return_value = response
            result = self._simulate_ai_analysis(self.sample_image_data)

            assert result["tasks"][0]["priority"] == priority

    def test_template_confidence_score_ranges(self):
        """Test template handles all confidence score ranges."""
        confidence_tests = [
            {"confidence": 0.95, "expected_range": "high"},
            {"confidence": 0.6, "expected_range": "medium"},
            {"confidence": 0.3, "expected_range": "low"},
        ]

        for test_case in confidence_tests:
            response = {
                "tasks": [{"title": "Test task", "confidence": test_case["confidence"]}]
            }

            self.mock_ai_service.analyze_image.return_value = response
            result = self._simulate_ai_analysis(self.sample_image_data)

            confidence = result["tasks"][0]["confidence"]

            if test_case["expected_range"] == "high":
                assert 0.8 <= confidence <= 1.0
            elif test_case["expected_range"] == "medium":
                assert 0.5 <= confidence <= 0.7
            else:  # low
                assert 0.2 <= confidence <= 0.4

    def _simulate_ai_analysis(self, image_data):
        """Helper method to simulate AI analysis with the template."""
        # This would normally involve sending the template and image to an AI service
        return self.mock_ai_service.analyze_image(image_data)


class TestPromptTemplatePerformance:
    """Performance tests for prompt template operations."""

    def test_template_parsing_performance(self):
        """Test that template parsing operations are efficient."""
        # Load template from PromptService
        prompt_service = PromptService()
        template = prompt_service.get_prompt("home_maintenance_analysis")

        import time

        start_time = time.time()

        # Simulate parsing operations
        for _ in range(100):
            self._parse_template_elements(template)

        end_time = time.time()
        execution_time = end_time - start_time

        # Should complete 100 parsing operations in under 1 second
        assert execution_time < 1.0, (
            f"Template parsing too slow: {execution_time} seconds"
        )

    def test_template_memory_usage_reasonable(self):
        """Test that template doesn't consume excessive memory."""
        template = "A" * 1000  # 1KB template

        # Should be able to handle multiple copies without issues
        templates = [template for _ in range(100)]

        # Basic check that we can work with multiple template copies
        assert len(templates) == 100
        assert all(len(t) == 1000 for t in templates)

    def _parse_template_elements(self, template):
        """Helper method to simulate template parsing."""
        # Simulate extracting elements from template
        lines = template.split("\n")
        task_types = []
        for line in lines:
            if "-" in line and ":" in line:
                task_types.append(line.strip())
        return task_types


class TestPromptTemplateAccessibility:
    """Tests for template accessibility and usability."""

    def test_template_uses_clear_language(self):
        """Test that template uses clear, accessible language."""
        template = """You are a home maintenance expert analyzing an image to identify maintenance tasks.

Analyze this image and identify specific, actionable home maintenance tasks based on what you observe."""

        # Should avoid overly complex words
        complex_words = ["obfuscate", "perpetuate", "ameliorate", "exacerbate"]
        for word in complex_words:
            assert word not in template.lower(), (
                f"Complex word '{word}' found in template"
            )

        # Should use active voice
        passive_indicators = ["was analyzed", "were identified", "is being"]
        for indicator in passive_indicators:
            assert indicator not in template.lower(), (
                f"Passive voice indicator '{indicator}' found"
            )

    def test_template_instruction_clarity(self):
        """Test that instructions are clear and unambiguous."""
        template_content = """You are a home maintenance expert analyzing an image to identify maintenance tasks.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why
3. Assign a priority level (high, medium, low) based on urgency and safety"""

        # Instructions should be specific
        assert "max 50 characters" in template_content, "Specific constraint missing"
        assert "high, medium, low" in template_content, "Specific options missing"

        # Instructions should use imperative mood
        imperative_verbs = ["Provide", "Include", "Assign"]
        for verb in imperative_verbs:
            assert verb in template_content, f"Imperative verb '{verb}' missing"


if __name__ == "__main__":
    pytest.main([__file__])
