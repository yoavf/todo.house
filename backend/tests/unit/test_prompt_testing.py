"""Unit tests for prompt testing functionality."""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from app.ai.prompt_testing import (
    PromptTester,
    PromptLibrary,
    PromptTestResult,
    PromptComparison,
    TestResult
)
from app.ai.test_images import TestScenario, TestImageLibrary, TestImageMetadata
from app.ai.providers import AIProvider


class MockAIProvider(AIProvider):
    """Mock AI provider for testing."""
    
    def __init__(self, mock_response=None):
        self.mock_response = mock_response or {
            "tasks": [
                {
                    "title": "Clean sink",
                    "description": "Remove soap scum from sink basin",
                    "priority": "medium",
                    "category": "cleaning",
                    "reasoning": "Visible soap buildup"
                }
            ],
            "analysis_summary": "Bathroom sink needs cleaning"
        }
        self.call_count = 0
    
    async def analyze_image(self, image_data: bytes, prompt: str):
        self.call_count += 1
        await asyncio.sleep(0.01)  # Simulate processing time
        return self.mock_response
    
    def get_provider_name(self) -> str:
        return "mock_provider"
    
    def get_usage_metrics(self):
        return {"requests_made": self.call_count}
    
    def reset_usage_metrics(self):
        self.call_count = 0


@pytest.fixture
def mock_provider():
    """Create mock AI provider."""
    return MockAIProvider()


@pytest.fixture
def prompt_tester(mock_provider):
    """Create prompt tester with mock provider."""
    return PromptTester(mock_provider)


@pytest.fixture
def test_prompt():
    """Sample test prompt."""
    return "Analyze this image for maintenance tasks."


class TestPromptTester:
    """Test cases for PromptTester class."""
    
    @pytest.mark.asyncio
    async def test_single_prompt_test_success(self, prompt_tester, test_prompt):
        """Test successful single prompt test."""
        result = await prompt_tester.test_single_prompt(
            test_prompt, 
            TestScenario.BATHROOM_SINK
        )
        
        assert isinstance(result, PromptTestResult)
        assert result.result_status == TestResult.SUCCESS
        assert result.prompt == test_prompt
        assert result.scenario == TestScenario.BATHROOM_SINK
        assert result.tasks_generated == 1
        assert result.processing_time > 0
        assert result.accuracy_score >= 0
        assert result.provider_name == "mock_provider"
    
    @pytest.mark.asyncio
    async def test_single_prompt_test_with_custom_image(self, prompt_tester, test_prompt):
        """Test single prompt test with custom image."""
        custom_image = b"fake_image_data"
        
        result = await prompt_tester.test_single_prompt(
            test_prompt,
            TestScenario.BATHROOM_SINK,
            custom_image
        )
        
        assert result.result_status == TestResult.SUCCESS
        assert result.tasks_generated == 1
    
    @pytest.mark.asyncio
    async def test_single_prompt_test_error_handling(self, test_prompt):
        """Test error handling in single prompt test."""
        # Create provider that raises exception
        error_provider = MockAIProvider()
        error_provider.analyze_image = AsyncMock(side_effect=Exception("API Error"))
        
        tester = PromptTester(error_provider)
        
        result = await tester.test_single_prompt(
            test_prompt,
            TestScenario.BATHROOM_SINK
        )
        
        assert result.result_status == TestResult.ERROR
        assert result.error_message == "API Error"
        assert result.tasks_generated == 0
        assert result.accuracy_score == 0.0
    
    @pytest.mark.asyncio
    async def test_prompt_variations_comparison(self, prompt_tester):
        """Test comparing multiple prompt variations."""
        prompts = [
            "Analyze this image for maintenance tasks.",
            "What maintenance is needed in this image?",
            "Identify home maintenance issues."
        ]
        
        comparison = await prompt_tester.test_prompt_variations(
            prompts,
            TestScenario.BATHROOM_SINK
        )
        
        assert isinstance(comparison, PromptComparison)
        assert len(comparison.results) == 3
        assert len(comparison.prompts) == 3
        assert comparison.scenario == TestScenario.BATHROOM_SINK
        assert 0 <= comparison.best_prompt_index < 3
        assert comparison.best_accuracy >= 0
        assert comparison.average_accuracy >= 0
        assert comparison.average_processing_time > 0
    
    @pytest.mark.asyncio
    async def test_all_scenarios_test(self, prompt_tester, test_prompt):
        """Test running prompt against all scenarios."""
        # Test with subset of scenarios for speed
        scenarios = [TestScenario.BATHROOM_SINK, TestScenario.KITCHEN_APPLIANCES]
        
        results = await prompt_tester.test_all_scenarios(test_prompt, scenarios)
        
        assert len(results) == 2
        assert all(isinstance(r, PromptTestResult) for r in results)
        assert results[0].scenario == TestScenario.BATHROOM_SINK
        assert results[1].scenario == TestScenario.KITCHEN_APPLIANCES
    
    def test_evaluate_response_perfect_match(self, prompt_tester):
        """Test response evaluation with perfect match."""
        ai_response = {
            "tasks": [
                {"title": "clean limescale from faucet"},
                {"title": "remove soap scum from sink basin"}
            ]
        }
        
        metadata = TestImageMetadata(
            scenario=TestScenario.BATHROOM_SINK,
            description="Test",
            expected_tasks=["clean limescale from faucet", "remove soap scum from sink basin"],
            expected_categories=["cleaning"],
            expected_priorities=["medium"]
        )
        
        evaluation = prompt_tester._evaluate_response(ai_response, metadata)
        
        assert len(evaluation["matched_tasks"]) == 2
        assert len(evaluation["missing_tasks"]) == 0
        assert len(evaluation["unexpected_tasks"]) == 0
        assert evaluation["accuracy_score"] == 1.0
    
    def test_evaluate_response_partial_match(self, prompt_tester):
        """Test response evaluation with partial match."""
        ai_response = {
            "tasks": [
                {"title": "clean limescale from faucet"},
                {"title": "unexpected task"}
            ]
        }
        
        metadata = TestImageMetadata(
            scenario=TestScenario.BATHROOM_SINK,
            description="Test",
            expected_tasks=["clean limescale from faucet", "remove soap scum from sink basin"],
            expected_categories=["cleaning"],
            expected_priorities=["medium"]
        )
        
        evaluation = prompt_tester._evaluate_response(ai_response, metadata)
        
        assert len(evaluation["matched_tasks"]) == 1
        assert len(evaluation["missing_tasks"]) == 1
        assert len(evaluation["unexpected_tasks"]) == 1
        assert 0 < evaluation["accuracy_score"] < 1.0
    
    def test_fuzzy_matching(self, prompt_tester):
        """Test fuzzy matching algorithm."""
        # Exact match
        assert prompt_tester._fuzzy_match("clean sink", "clean sink")
        
        # Similar match
        assert prompt_tester._fuzzy_match("clean sink basin", "clean the sink")
        
        # No match
        assert not prompt_tester._fuzzy_match("clean sink", "repair faucet")
        
        # Empty strings
        assert prompt_tester._fuzzy_match("", "")
        assert not prompt_tester._fuzzy_match("clean", "")
    
    def test_test_history(self, prompt_tester, test_prompt):
        """Test test history functionality."""
        # Initially empty
        assert len(prompt_tester.get_test_history()) == 0
        
        # Add some mock results
        result1 = PromptTestResult(
            test_id="test1",
            prompt=test_prompt,
            scenario=TestScenario.BATHROOM_SINK,
            result_status=TestResult.SUCCESS,
            ai_response={},
            processing_time=1.0,
            tasks_generated=2,
            expected_tasks=[],
            matched_tasks=[],
            missing_tasks=[],
            unexpected_tasks=[],
            accuracy_score=0.8,
            confidence_score=0.7
        )
        
        prompt_tester._test_history.append(result1)
        
        history = prompt_tester.get_test_history()
        assert len(history) == 1
        assert history[0] == result1
        
        # Test limit
        limited_history = prompt_tester.get_test_history(limit=0)
        assert len(limited_history) == 0
    
    def test_best_prompts_by_scenario(self, prompt_tester):
        """Test getting best prompts by scenario."""
        # Add mock results
        result1 = PromptTestResult(
            test_id="test1",
            prompt="prompt1",
            scenario=TestScenario.BATHROOM_SINK,
            result_status=TestResult.SUCCESS,
            ai_response={},
            processing_time=1.0,
            tasks_generated=2,
            expected_tasks=[],
            matched_tasks=[],
            missing_tasks=[],
            unexpected_tasks=[],
            accuracy_score=0.8,
            confidence_score=0.7
        )
        
        result2 = PromptTestResult(
            test_id="test2",
            prompt="prompt2",
            scenario=TestScenario.BATHROOM_SINK,
            result_status=TestResult.SUCCESS,
            ai_response={},
            processing_time=1.0,
            tasks_generated=2,
            expected_tasks=[],
            matched_tasks=[],
            missing_tasks=[],
            unexpected_tasks=[],
            accuracy_score=0.9,  # Better score
            confidence_score=0.8
        )
        
        prompt_tester._test_history.extend([result1, result2])
        
        best_prompts = prompt_tester.get_best_prompts_by_scenario()
        
        assert TestScenario.BATHROOM_SINK.value in best_prompts
        assert best_prompts[TestScenario.BATHROOM_SINK.value] == ("prompt2", 0.9)
    
    def test_generate_test_report(self, prompt_tester):
        """Test test report generation."""
        # Add mock results
        results = [
            PromptTestResult(
                test_id="test1",
                prompt="prompt1",
                scenario=TestScenario.BATHROOM_SINK,
                result_status=TestResult.SUCCESS,
                ai_response={},
                processing_time=1.0,
                tasks_generated=2,
                expected_tasks=[],
                matched_tasks=[],
                missing_tasks=[],
                unexpected_tasks=[],
                accuracy_score=0.8,
                confidence_score=0.7,
                provider_name="mock"
            ),
            PromptTestResult(
                test_id="test2",
                prompt="prompt2",
                scenario=TestScenario.KITCHEN_APPLIANCES,
                result_status=TestResult.ERROR,
                ai_response={},
                processing_time=0.5,
                tasks_generated=0,
                expected_tasks=[],
                matched_tasks=[],
                missing_tasks=[],
                unexpected_tasks=[],
                accuracy_score=0.0,
                confidence_score=None,
                provider_name="mock",
                error_message="Test error"
            )
        ]
        
        report = prompt_tester.generate_test_report(results)
        
        assert "summary" in report
        assert "scenario_breakdown" in report
        assert "provider_breakdown" in report
        
        summary = report["summary"]
        assert summary["total_tests"] == 2
        assert summary["successful_tests"] == 1
        assert summary["failed_tests"] == 1
        assert summary["success_rate"] == 0.5
        assert summary["average_accuracy"] == 0.8  # Only successful test
        assert summary["total_tasks_generated"] == 2
    
    def test_export_results_json(self, prompt_tester):
        """Test exporting results as JSON."""
        result = PromptTestResult(
            test_id="test1",
            prompt="test prompt",
            scenario=TestScenario.BATHROOM_SINK,
            result_status=TestResult.SUCCESS,
            ai_response={},
            processing_time=1.0,
            tasks_generated=1,
            expected_tasks=[],
            matched_tasks=[],
            missing_tasks=[],
            unexpected_tasks=[],
            accuracy_score=0.8,
            confidence_score=0.7
        )
        
        json_output = prompt_tester.export_results([result], "json")
        
        assert isinstance(json_output, str)
        assert "test1" in json_output
        assert "bathroom_sink" in json_output
    
    def test_export_results_csv(self, prompt_tester):
        """Test exporting results as CSV."""
        result = PromptTestResult(
            test_id="test1",
            prompt="test prompt",
            scenario=TestScenario.BATHROOM_SINK,
            result_status=TestResult.SUCCESS,
            ai_response={},
            processing_time=1.0,
            tasks_generated=1,
            expected_tasks=[],
            matched_tasks=[],
            missing_tasks=[],
            unexpected_tasks=[],
            accuracy_score=0.8,
            confidence_score=0.7
        )
        
        csv_output = prompt_tester.export_results([result], "csv")
        
        assert isinstance(csv_output, str)
        assert "test_id" in csv_output  # Header
        assert "test1" in csv_output
    
    def test_export_results_invalid_format(self, prompt_tester):
        """Test exporting with invalid format."""
        with pytest.raises(ValueError, match="Unsupported export format"):
            prompt_tester.export_results([], "xml")
    
    def test_clear_history(self, prompt_tester):
        """Test clearing test history."""
        # Add some mock data
        prompt_tester._test_history.append(Mock())
        prompt_tester._comparison_history.append(Mock())
        
        assert len(prompt_tester._test_history) > 0
        assert len(prompt_tester._comparison_history) > 0
        
        prompt_tester.clear_history()
        
        assert len(prompt_tester._test_history) == 0
        assert len(prompt_tester._comparison_history) == 0


class TestPromptLibrary:
    """Test cases for PromptLibrary class."""
    
    def test_get_base_prompt(self):
        """Test getting base prompt."""
        prompt = PromptLibrary.get_base_prompt()
        
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "maintenance" in prompt.lower()
        assert "json" in prompt.lower()
    
    def test_get_detailed_prompt(self):
        """Test getting detailed prompt."""
        prompt = PromptLibrary.get_detailed_prompt()
        
        assert isinstance(prompt, str)
        assert len(prompt) > len(PromptLibrary.get_base_prompt())
        assert "expert" in prompt.lower()
    
    def test_get_concise_prompt(self):
        """Test getting concise prompt."""
        prompt = PromptLibrary.get_concise_prompt()
        
        assert isinstance(prompt, str)
        assert len(prompt) < len(PromptLibrary.get_base_prompt())
    
    def test_get_safety_focused_prompt(self):
        """Test getting safety-focused prompt."""
        prompt = PromptLibrary.get_safety_focused_prompt()
        
        assert isinstance(prompt, str)
        assert "safety" in prompt.lower()
        assert "hazard" in prompt.lower()
    
    def test_get_all_test_prompts(self):
        """Test getting all test prompts."""
        prompts = PromptLibrary.get_all_test_prompts()
        
        assert isinstance(prompts, list)
        assert len(prompts) >= 4  # At least 4 predefined prompts
        
        for name, prompt in prompts:
            assert isinstance(name, str)
            assert isinstance(prompt, str)
            assert len(name) > 0
            assert len(prompt) > 0


class TestTestImageLibrary:
    """Test cases for TestImageLibrary class."""
    
    @pytest.fixture
    def image_library(self):
        """Create test image library."""
        return TestImageLibrary()
    
    def test_get_test_image(self, image_library):
        """Test getting test image."""
        image_data = image_library.get_test_image(TestScenario.BATHROOM_SINK)
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
    
    def test_get_test_image_invalid_scenario(self, image_library):
        """Test getting test image with invalid scenario."""
        with pytest.raises(ValueError, match="Unsupported test scenario"):
            # This should raise an error since we're not using a valid enum
            image_library.get_test_image("invalid_scenario")
    
    def test_get_test_metadata(self, image_library):
        """Test getting test metadata."""
        metadata = image_library.get_test_metadata(TestScenario.BATHROOM_SINK)
        
        assert isinstance(metadata, TestImageMetadata)
        assert metadata.scenario == TestScenario.BATHROOM_SINK
        assert len(metadata.expected_tasks) > 0
        assert len(metadata.expected_categories) > 0
    
    def test_get_all_scenarios(self, image_library):
        """Test getting all scenarios."""
        scenarios = image_library.get_all_scenarios()
        
        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
        assert all(isinstance(s, TestScenario) for s in scenarios)
    
    def test_get_scenarios_by_difficulty(self, image_library):
        """Test filtering scenarios by difficulty."""
        easy_scenarios = image_library.get_scenarios_by_difficulty("easy")
        medium_scenarios = image_library.get_scenarios_by_difficulty("medium")
        hard_scenarios = image_library.get_scenarios_by_difficulty("hard")
        
        assert isinstance(easy_scenarios, list)
        assert isinstance(medium_scenarios, list)
        assert isinstance(hard_scenarios, list)
        
        # Should have at least some scenarios in each category
        total_scenarios = len(easy_scenarios) + len(medium_scenarios) + len(hard_scenarios)
        assert total_scenarios > 0
    
    def test_get_scenarios_by_room(self, image_library):
        """Test filtering scenarios by room type."""
        bathroom_scenarios = image_library.get_scenarios_by_room("bathroom")
        kitchen_scenarios = image_library.get_scenarios_by_room("kitchen")
        
        assert isinstance(bathroom_scenarios, list)
        assert isinstance(kitchen_scenarios, list)
        
        # Should have at least some bathroom scenarios
        assert len(bathroom_scenarios) > 0
    
    def test_create_custom_test_image(self, image_library):
        """Test creating custom test image."""
        description = "Custom test scenario for maintenance"
        image_data = image_library.create_custom_test_image(description)
        
        assert isinstance(image_data, bytes)
        assert len(image_data) > 0
    
    def test_get_scenario_summary(self, image_library):
        """Test getting scenario summary."""
        summary = image_library.get_scenario_summary()
        
        assert isinstance(summary, dict)
        assert len(summary) > 0
        
        for scenario_name, info in summary.items():
            assert isinstance(scenario_name, str)
            assert isinstance(info, dict)
            assert "description" in info
            assert "difficulty" in info
            assert "expected_task_count" in info


@pytest.mark.integration
class TestPromptTestingIntegration:
    """Integration tests for prompt testing functionality."""
    
    @pytest.mark.asyncio
    async def test_full_prompt_testing_workflow(self):
        """Test complete prompt testing workflow."""
        # Create mock provider
        provider = MockAIProvider({
            "tasks": [
                {
                    "title": "Clean limescale from faucet",
                    "description": "Remove mineral buildup",
                    "priority": "medium",
                    "category": "cleaning",
                    "reasoning": "Visible buildup"
                }
            ],
            "analysis_summary": "Bathroom maintenance needed"
        })
        
        # Create tester
        tester = PromptTester(provider)
        
        # Test single prompt
        result = await tester.test_single_prompt(
            "Analyze for maintenance tasks",
            TestScenario.BATHROOM_SINK
        )
        
        assert result.result_status == TestResult.SUCCESS
        assert result.tasks_generated == 1
        
        # Test prompt comparison
        prompts = [
            "Analyze for maintenance tasks",
            "What needs to be fixed?",
            "Identify cleaning needs"
        ]
        
        comparison = await tester.test_prompt_variations(
            prompts,
            TestScenario.BATHROOM_SINK
        )
        
        assert len(comparison.results) == 3
        assert comparison.best_accuracy >= 0
        
        # Generate report
        all_results = [result] + comparison.results
        report = tester.generate_test_report(all_results)
        
        assert report["summary"]["total_tests"] == 4
        assert "scenario_breakdown" in report
        
        # Test export
        json_export = tester.export_results(all_results, "json")
        assert isinstance(json_export, str)
        assert len(json_export) > 0