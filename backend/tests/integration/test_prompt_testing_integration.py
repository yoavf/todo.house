"""Integration tests for prompt testing functionality."""

import pytest
from unittest.mock import patch, AsyncMock

from app.ai.prompt_testing import PromptTester, PromptLibrary, TestResult
from app.ai.test_images import TestScenario, TestImageLibrary


@pytest.mark.integration
class TestPromptTestingIntegration:
    """Integration tests for prompt testing with real AI providers."""

    @pytest.fixture
    def test_library(self):
        """Create test image library."""
        return TestImageLibrary()

    @pytest.fixture
    def prompt_library(self):
        """Create prompt library."""
        return PromptLibrary()

    @pytest.mark.asyncio
    async def test_prompt_testing_with_mock_provider(
        self, test_library, prompt_library
    ):
        """Test prompt testing workflow with mock provider."""
        # Create mock provider that returns realistic responses
        mock_response = {
            "tasks": [
                {
                    "title": "Clean limescale from faucet",
                    "description": "Remove mineral buildup from faucet surfaces",
                    "priority": "medium",
                    "category": "cleaning",
                    "reasoning": "Visible limescale buildup affects functionality",
                },
                {
                    "title": "Remove soap scum from sink",
                    "description": "Clean soap residue from sink basin",
                    "priority": "low",
                    "category": "cleaning",
                    "reasoning": "Soap scum visible in basin area",
                },
            ],
            "analysis_summary": "Bathroom sink requires cleaning maintenance",
        }

        # Mock the AI provider
        with patch("app.ai.providers.GeminiProvider") as MockProvider:
            mock_instance = MockProvider.return_value
            mock_instance.analyze_image = AsyncMock(return_value=mock_response)
            mock_instance.get_provider_name.return_value = "mock_gemini"

            # Create tester with mocked provider
            tester = PromptTester(mock_instance)

            # Test single prompt
            base_prompt = prompt_library.get_base_prompt()
            result = await tester.test_single_prompt(
                base_prompt, TestScenario.BATHROOM_SINK
            )

            assert result.result_status == TestResult.SUCCESS
            assert result.tasks_generated == 2
            assert result.accuracy_score > 0
            assert any(
                "limescale" in t.lower() or "soap" in t.lower()
                for t in result.matched_tasks
            ), "Expected 'limescale' or 'soap' in at least one matched task title"

            # Test prompt comparison
            prompts = [
                prompt_library.get_base_prompt(),
                prompt_library.get_concise_prompt(),
            ]

            comparison = await tester.test_prompt_variations(
                prompts, TestScenario.BATHROOM_SINK
            )

            assert len(comparison.results) == 2
            assert comparison.best_accuracy > 0
            assert 0 <= comparison.best_prompt_index < 2

            # Verify mock was called correctly
            assert (
                mock_instance.analyze_image.call_count >= 3
            )  # 1 single + 2 comparison

    @pytest.mark.asyncio
    async def test_batch_testing_workflow(self, test_library, prompt_library):
        """Test batch testing across multiple scenarios."""
        mock_responses = {
            TestScenario.BATHROOM_SINK: {
                "tasks": [
                    {
                        "title": "Clean limescale from faucet",
                        "description": "Remove mineral buildup",
                        "priority": "medium",
                        "category": "cleaning",
                        "reasoning": "Visible buildup",
                    }
                ],
                "analysis_summary": "Bathroom maintenance needed",
            },
            TestScenario.KITCHEN_APPLIANCES: {
                "tasks": [
                    {
                        "title": "Clean stovetop burners",
                        "description": "Remove grease and food residue",
                        "priority": "high",
                        "category": "cleaning",
                        "reasoning": "Grease buildup visible",
                    }
                ],
                "analysis_summary": "Kitchen cleaning required",
            },
        }

        async def mock_analyze_image(image_data, prompt):
            # Return different responses based on image content
            # This is a simplified mock - in reality we'd need to analyze the image
            # For now, we'll cycle through responses
            scenarios = list(mock_responses.keys())
            scenario = scenarios[mock_analyze_image.call_count % len(scenarios)]
            mock_analyze_image.call_count += 1
            return mock_responses[scenario]

        mock_analyze_image.call_count = 0

        with patch("app.ai.providers.GeminiProvider") as MockProvider:
            mock_instance = MockProvider.return_value
            mock_instance.analyze_image.side_effect = mock_analyze_image
            mock_instance.get_provider_name.return_value = "mock_gemini"

            tester = PromptTester(mock_instance)

            # Test batch processing
            test_scenarios = [
                TestScenario.BATHROOM_SINK,
                TestScenario.KITCHEN_APPLIANCES,
            ]
            results = await tester.test_all_scenarios(
                prompt_library.get_base_prompt(), test_scenarios
            )

            assert len(results) == 2
            assert all(r.result_status == TestResult.SUCCESS for r in results)
            assert all(r.tasks_generated > 0 for r in results)

            # Generate report
            report = tester.generate_test_report(results)

            assert report["summary"]["total_tests"] == 2
            assert report["summary"]["successful_tests"] == 2
            assert report["summary"]["success_rate"] == 1.0
            assert len(report["scenario_breakdown"]) == 2

    def test_test_image_library_integration(self, test_library):
        """Test that test image library works correctly."""
        # Test all scenarios can generate images
        scenarios_to_test = [
            TestScenario.BATHROOM_SINK,
            TestScenario.KITCHEN_APPLIANCES,
            TestScenario.LAWN_MAINTENANCE,
        ]

        for scenario in scenarios_to_test:
            # Get metadata
            metadata = test_library.get_test_metadata(scenario)
            assert metadata.scenario == scenario
            assert len(metadata.expected_tasks) > 0

            # Get image
            image_data = test_library.get_test_image(scenario)
            assert isinstance(image_data, bytes)
            assert len(image_data) > 0

        # Test filtering
        bathroom_scenarios = test_library.get_scenarios_by_room("bathroom")
        assert TestScenario.BATHROOM_SINK in bathroom_scenarios
        assert TestScenario.BATHROOM_SHOWER in bathroom_scenarios

        easy_scenarios = test_library.get_scenarios_by_difficulty("easy")
        assert len(easy_scenarios) > 0

        # Test summary
        summary = test_library.get_scenario_summary()
        assert len(summary) >= len(scenarios_to_test)

    @pytest.mark.asyncio
    async def test_prompt_evaluation_accuracy(self, test_library):
        """Test that prompt evaluation produces reasonable accuracy scores."""
        # Create responses with different levels of accuracy
        perfect_response = {
            "tasks": [
                {"title": "Clean limescale from faucet"},
                {"title": "Remove soap scum from sink basin"},
                {"title": "Polish chrome fixtures"},
            ],
            "analysis_summary": "Perfect match",
        }

        partial_response = {
            "tasks": [
                {"title": "Clean limescale from faucet"},
                {"title": "Unexpected task"},
            ],
            "analysis_summary": "Partial match",
        }

        poor_response = {
            "tasks": [
                {"title": "Completely unrelated task"},
                {"title": "Another wrong task"},
            ],
            "analysis_summary": "Poor match",
        }

        with patch("app.ai.providers.GeminiProvider") as MockProvider:
            mock_instance = MockProvider.return_value
            mock_instance.get_provider_name.return_value = "mock_gemini"

            tester = PromptTester(mock_instance)

            # Test perfect match
            mock_instance.analyze_image = AsyncMock(return_value=perfect_response)
            perfect_result = await tester.test_single_prompt(
                "test prompt", TestScenario.BATHROOM_SINK
            )

            # Test partial match
            mock_instance.analyze_image = AsyncMock(return_value=partial_response)
            partial_result = await tester.test_single_prompt(
                "test prompt", TestScenario.BATHROOM_SINK
            )

            # Test poor match
            mock_instance.analyze_image = AsyncMock(return_value=poor_response)
            poor_result = await tester.test_single_prompt(
                "test prompt", TestScenario.BATHROOM_SINK
            )

            # Verify accuracy scores make sense
            assert perfect_result.accuracy_score > partial_result.accuracy_score
            assert partial_result.accuracy_score > poor_result.accuracy_score
            assert perfect_result.accuracy_score > 0.8  # Should be high
            assert poor_result.accuracy_score < 0.3  # Should be low

    def test_prompt_library_completeness(self, prompt_library):
        """Test that prompt library has all expected prompts."""
        all_prompts = prompt_library.get_all_test_prompts()

        assert len(all_prompts) >= 4  # At least 4 predefined prompts

        prompt_names = [name for name, _ in all_prompts]
        assert "Base Prompt" in prompt_names
        assert "Detailed Prompt" in prompt_names
        assert "Concise Prompt" in prompt_names
        assert "Safety Focused" in prompt_names

        # Verify all prompts are different
        prompt_texts = [prompt for _, prompt in all_prompts]
        assert len(set(prompt_texts)) == len(prompt_texts)  # All unique

        # Verify all prompts contain key elements
        for name, prompt in all_prompts:
            assert len(prompt) > 50  # Reasonable length
            assert "maintenance" in prompt.lower()
            assert "json" in prompt.lower()

    @pytest.mark.asyncio
    async def test_error_handling_in_testing(self, test_library):
        """Test error handling during prompt testing."""
        with patch("app.ai.providers.GeminiProvider") as MockProvider:
            mock_instance = MockProvider.return_value
            mock_instance.get_provider_name.return_value = "mock_gemini"

            # Test provider error
            mock_instance.analyze_image.side_effect = Exception("Provider error")

            tester = PromptTester(mock_instance)

            result = await tester.test_single_prompt(
                "test prompt", TestScenario.BATHROOM_SINK
            )

            assert result.result_status == TestResult.ERROR
            assert result.error_message == "Provider error"
            assert result.tasks_generated == 0
            assert result.accuracy_score == 0.0

            # Verify error is logged in history
            history = tester.get_test_history()
            assert len(history) == 1
            assert history[0].result_status == TestResult.ERROR

    def test_export_functionality(self, test_library):
        """Test result export functionality."""
        with patch("app.ai.providers.GeminiProvider") as MockProvider:
            mock_instance = MockProvider.return_value
            mock_instance.get_provider_name.return_value = "mock_gemini"

            tester = PromptTester(mock_instance)

            # Create some mock results
            from app.ai.prompt_testing import PromptTestResult
            from datetime import datetime

            results = [
                PromptTestResult(
                    test_id="test1",
                    prompt="test prompt",
                    scenario=TestScenario.BATHROOM_SINK,
                    result_status=TestResult.SUCCESS,
                    ai_response={"tasks": []},
                    processing_time=1.0,
                    tasks_generated=2,
                    expected_tasks=["task1", "task2"],
                    matched_tasks=["task1"],
                    missing_tasks=["task2"],
                    unexpected_tasks=[],
                    accuracy_score=0.5,
                    confidence_score=0.6,
                    timestamp=datetime.now(),
                    provider_name="mock_gemini",
                )
            ]

            # Test JSON export
            json_export = tester.export_results(results, "json")
            assert isinstance(json_export, str)
            assert "test1" in json_export
            assert "bathroom_sink" in json_export

            # Test CSV export
            csv_export = tester.export_results(results, "csv")
            assert isinstance(csv_export, str)
            assert "test_id" in csv_export  # Header
            assert "test1" in csv_export

            # Test invalid format
            with pytest.raises(ValueError):
                tester.export_results(results, "invalid_format")
