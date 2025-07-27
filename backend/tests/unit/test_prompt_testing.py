"""Unit tests for prompt testing framework."""

import json
import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any

from app.ai.prompt_testing import (
    PromptTester,
    PromptTestResult,
    PromptTestSuite,
    PromptAnalysis,
    PromptComparator,
    PromptMetric
)
from app.ai.providers import AIProvider


class MockAIProvider(AIProvider):
    """Mock AI provider for testing."""
    
    def __init__(self, provider_name: str = "mock", model: str = "mock-model", 
                 response_data: Dict[str, Any] = None, should_fail: bool = False):
        self.provider_name = provider_name
        self.model = model
        self.should_fail = should_fail
        self.response_data = response_data or {
            "analysis_summary": "Mock analysis",
            "tasks": [
                {"title": "Mock task", "description": "Mock description", "priority": "medium"}
            ],
            "tokens_used": 100,
            "cost_estimate": 0.01
        }
        self.call_count = 0
    
    async def analyze_image(self, image_data: bytes, prompt: str) -> Dict[str, Any]:
        self.call_count += 1
        
        if self.should_fail:
            raise Exception("Mock provider failure")
        
        # Simulate some variation based on prompt length
        task_count = min(len(prompt) // 20, 5)  # Longer prompts generate more tasks
        
        response = self.response_data.copy()
        response["tasks"] = response["tasks"] * task_count if task_count > 0 else []
        
        return response
    
    def get_provider_name(self) -> str:
        return self.provider_name
    
    def get_usage_metrics(self) -> Dict[str, Any]:
        return {
            "requests_made": self.call_count,
            "successful_requests": self.call_count if not self.should_fail else 0,
            "failed_requests": self.call_count if self.should_fail else 0,
            "total_tokens_used": self.call_count * 100,
            "total_cost_estimate": self.call_count * 0.01,
            "average_response_time": 0.1,
            "last_request_time": None
        }
    
    def reset_usage_metrics(self) -> None:
        self.call_count = 0


class TestPromptTestResult:
    """Test PromptTestResult dataclass."""
    
    def test_prompt_test_result_creation(self):
        """Test creating a prompt test result."""
        result = PromptTestResult(
            test_id="test-123",
            prompt="Test prompt",
            provider_name="mock",
            model="mock-model",
            success=True,
            response_time=0.5,
            tokens_used=100,
            tasks_generated=3
        )
        
        assert result.test_id == "test-123"
        assert result.prompt == "Test prompt"
        assert result.success is True
        assert result.response_time == 0.5
        assert result.tokens_used == 100
        assert result.tasks_generated == 3
    
    def test_prompt_test_result_with_defaults(self):
        """Test prompt test result with default values."""
        result = PromptTestResult(
            test_id="test-456",
            prompt="Another test",
            provider_name="mock",
            model="mock-model",
            success=False,
            response_time=1.0
        )
        
        assert result.tokens_used is None
        assert result.cost_estimate is None
        assert result.tasks_generated == 0
        assert result.error_message is None
        assert result.timestamp > 0  # Should have a timestamp


class TestPromptTester:
    """Test the PromptTester class."""
    
    @pytest.mark.asyncio
    async def test_test_prompt_success(self):
        """Test successful prompt testing."""
        provider = MockAIProvider()
        tester = PromptTester()
        test_image = b"fake_image_data"
        prompt = "Analyze this image for maintenance tasks"
        
        result = await tester.test_prompt(prompt, provider, test_image)
        
        assert result.success is True
        assert result.prompt == prompt
        assert result.provider_name == "mock"
        assert result.model == "mock-model"
        assert result.response_time > 0
        assert result.tokens_used == 100
        assert result.cost_estimate == 0.01
        assert result.tasks_generated > 0  # Should generate tasks based on prompt length
        assert result.error_message is None
        assert len(tester.results) == 1
    
    @pytest.mark.asyncio
    async def test_test_prompt_failure(self):
        """Test prompt testing with provider failure."""
        provider = MockAIProvider(should_fail=True)
        tester = PromptTester()
        test_image = b"fake_image_data"
        prompt = "This will fail"
        
        result = await tester.test_prompt(prompt, provider, test_image)
        
        assert result.success is False
        assert result.prompt == prompt
        assert result.error_message == "Mock provider failure"
        assert result.tokens_used is None
        assert result.tasks_generated == 0
        assert len(tester.results) == 1
    
    @pytest.mark.asyncio
    async def test_test_prompt_with_custom_id(self):
        """Test prompt testing with custom test ID."""
        provider = MockAIProvider()
        tester = PromptTester()
        test_image = b"fake_image_data"
        prompt = "Custom ID test"
        custom_id = "custom-test-id-123"
        
        result = await tester.test_prompt(prompt, provider, test_image, custom_id)
        
        assert result.test_id == custom_id
        assert result.success is True
    
    @pytest.mark.asyncio
    async def test_run_test_suite_sequential(self):
        """Test running a test suite sequentially."""
        # Create mock provider factory
        with patch('app.ai.prompt_testing.AIProviderFactory') as mock_factory:
            provider1 = MockAIProvider("provider1", "model1")
            provider2 = MockAIProvider("provider2", "model2")
            mock_factory.create_provider.side_effect = [provider1, provider2]
            
            tester = PromptTester()
            test_suite = PromptTestSuite(
                name="test_suite",
                description="Test suite description",
                prompts=["Short prompt", "This is a much longer prompt that should generate more tasks"],
                test_image=b"fake_image_data",
                provider_configs=[
                    {"provider_name": "provider1", "api_key": "key1"},
                    {"provider_name": "provider2", "api_key": "key2"}
                ],
                iterations=2,
                parallel=False
            )
            
            analysis = await tester.run_test_suite(test_suite)
            
            assert analysis.suite_name == "test_suite"
            assert analysis.total_tests == 8  # 2 prompts * 2 providers * 2 iterations
            assert analysis.successful_tests == 8  # All should succeed
            assert analysis.average_response_time > 0
            assert analysis.total_tokens_used > 0
            assert analysis.consistency_score >= 0
            assert analysis.best_prompt is not None
            assert analysis.worst_prompt is not None
            assert len(analysis.detailed_results) == 8
    
    @pytest.mark.asyncio
    async def test_run_test_suite_parallel(self):
        """Test running a test suite in parallel."""
        with patch('app.ai.prompt_testing.AIProviderFactory') as mock_factory:
            provider = MockAIProvider()
            mock_factory.create_provider.return_value = provider
            
            tester = PromptTester()
            test_suite = PromptTestSuite(
                name="parallel_test",
                description="Parallel test suite",
                prompts=["Prompt 1", "Prompt 2"],
                test_image=b"fake_image_data",
                provider_configs=[{"provider_name": "mock", "api_key": "key"}],
                iterations=1,
                parallel=True
            )
            
            analysis = await tester.run_test_suite(test_suite)
            
            assert analysis.total_tests == 2
            assert analysis.successful_tests == 2
    
    def test_analyze_results_empty(self):
        """Test analyzing empty results."""
        tester = PromptTester()
        analysis = tester._analyze_results("empty_suite", [])
        
        assert analysis.suite_name == "empty_suite"
        assert analysis.total_tests == 0
        assert analysis.successful_tests == 0
        assert analysis.average_response_time == 0.0
        assert analysis.consistency_score == 0.0
        assert analysis.best_prompt is None
        assert analysis.worst_prompt is None
    
    def test_analyze_results_with_data(self):
        """Test analyzing results with actual data."""
        tester = PromptTester()
        
        results = [
            PromptTestResult(
                test_id="1", prompt="Good prompt", provider_name="mock", 
                model="model", success=True, response_time=0.5, 
                tokens_used=100, cost_estimate=0.01, tasks_generated=3
            ),
            PromptTestResult(
                test_id="2", prompt="Good prompt", provider_name="mock", 
                model="model", success=True, response_time=0.6, 
                tokens_used=120, cost_estimate=0.012, tasks_generated=3
            ),
            PromptTestResult(
                test_id="3", prompt="Bad prompt", provider_name="mock", 
                model="model", success=False, response_time=1.0
            ),
            PromptTestResult(
                test_id="4", prompt="Okay prompt", provider_name="mock", 
                model="model", success=True, response_time=0.7, 
                tokens_used=90, cost_estimate=0.009, tasks_generated=1
            )
        ]
        
        analysis = tester._analyze_results("test_suite", results)
        
        assert analysis.total_tests == 4
        assert analysis.successful_tests == 3
        assert analysis.average_response_time == 0.6  # Average of successful tests
        assert analysis.total_tokens_used == 310
        assert analysis.total_cost_estimate == 0.031
        assert analysis.average_tasks_per_prompt == 7/3  # (3+3+1)/3
        assert analysis.best_prompt == "Good prompt"  # Higher success rate
        assert analysis.worst_prompt in ["Bad prompt", "Okay prompt"]
    
    def test_add_custom_validator(self):
        """Test adding custom validation functions."""
        tester = PromptTester()
        
        def custom_validator(response_data: Dict[str, Any]) -> bool:
            return len(response_data.get("tasks", [])) > 0
        
        tester.add_custom_validator(custom_validator)
        
        assert len(tester.custom_validators) == 1
        assert tester.custom_validators[0] == custom_validator
    
    def test_export_results_json(self):
        """Test exporting results as JSON."""
        tester = PromptTester()
        
        # Add a test result
        result = PromptTestResult(
            test_id="export-test",
            prompt="Export test prompt",
            provider_name="mock",
            model="mock-model",
            success=True,
            response_time=0.5,
            tokens_used=100,
            cost_estimate=0.01,
            tasks_generated=2
        )
        tester.results.append(result)
        
        json_output = tester.export_results("json")
        parsed = json.loads(json_output)
        
        assert len(parsed) == 1
        assert parsed[0]["test_id"] == "export-test"
        assert parsed[0]["prompt"] == "Export test prompt"
        assert parsed[0]["success"] is True
    
    def test_export_results_summary(self):
        """Test exporting results as summary."""
        tester = PromptTester()
        
        # Add test results
        results = [
            PromptTestResult(
                test_id="1", prompt="Good prompt", provider_name="mock",
                model="model", success=True, response_time=0.5, tasks_generated=3
            ),
            PromptTestResult(
                test_id="2", prompt="Bad prompt", provider_name="mock",
                model="model", success=False, response_time=1.0
            )
        ]
        tester.results.extend(results)
        
        summary = tester.export_results("summary")
        
        assert "Total Tests: 2" in summary
        assert "Successful: 1" in summary
        assert "Success Rate: 50.0%" in summary
        assert "Good prompt" in summary
    
    def test_export_results_invalid_format(self):
        """Test exporting with invalid format."""
        tester = PromptTester()
        
        with pytest.raises(ValueError, match="Unsupported export format"):
            tester.export_results("invalid_format")
    
    def test_clear_results(self):
        """Test clearing stored results."""
        tester = PromptTester()
        
        # Add some results
        result = PromptTestResult(
            test_id="clear-test", prompt="Test", provider_name="mock",
            model="model", success=True, response_time=0.5
        )
        tester.results.append(result)
        
        assert len(tester.results) == 1
        
        tester.clear_results()
        
        assert len(tester.results) == 0


class TestPromptComparator:
    """Test the PromptComparator class."""
    
    def test_compare_prompts(self):
        """Test comparing two sets of prompt results."""
        results_a = [
            PromptTestResult(
                test_id="a1", prompt="Prompt A", provider_name="mock",
                model="model", success=True, response_time=0.5,
                tasks_generated=3, cost_estimate=0.01
            ),
            PromptTestResult(
                test_id="a2", prompt="Prompt A", provider_name="mock",
                model="model", success=True, response_time=0.6,
                tasks_generated=2, cost_estimate=0.012
            )
        ]
        
        results_b = [
            PromptTestResult(
                test_id="b1", prompt="Prompt B", provider_name="mock",
                model="model", success=True, response_time=0.8,
                tasks_generated=1, cost_estimate=0.008
            ),
            PromptTestResult(
                test_id="b2", prompt="Prompt B", provider_name="mock",
                model="model", success=False, response_time=1.0
            )
        ]
        
        comparison = PromptComparator.compare_prompts(results_a, results_b)
        
        assert comparison["group_a"]["success_rate"] == 1.0
        assert comparison["group_b"]["success_rate"] == 0.5
        assert comparison["comparison"]["success_rate_diff"] == 0.5
        assert comparison["comparison"]["better_group"] == "A"
        assert comparison["group_a"]["avg_tasks"] == 2.5
        assert comparison["group_b"]["avg_tasks"] == 1.0
    
    def test_compare_prompts_empty_results(self):
        """Test comparing with empty result sets."""
        comparison = PromptComparator.compare_prompts([], [])
        
        assert comparison["group_a"]["success_rate"] == 0.0
        assert comparison["group_b"]["success_rate"] == 0.0
        assert comparison["comparison"]["success_rate_diff"] == 0.0
    
    def test_find_optimal_prompts(self):
        """Test finding optimal prompts from results."""
        results = [
            # Excellent prompt - high success, good efficiency
            PromptTestResult(
                test_id="1", prompt="Excellent prompt with good performance",
                provider_name="mock", model="model", success=True,
                response_time=0.3, tasks_generated=5, cost_estimate=0.01
            ),
            PromptTestResult(
                test_id="2", prompt="Excellent prompt with good performance",
                provider_name="mock", model="model", success=True,
                response_time=0.4, tasks_generated=4, cost_estimate=0.012
            ),
            # Poor prompt - failures
            PromptTestResult(
                test_id="3", prompt="Poor prompt that fails",
                provider_name="mock", model="model", success=False, response_time=1.0
            ),
            # Mediocre prompt - slow but works
            PromptTestResult(
                test_id="4", prompt="Slow but working prompt",
                provider_name="mock", model="model", success=True,
                response_time=2.0, tasks_generated=2, cost_estimate=0.02
            )
        ]
        
        optimal_prompts = PromptComparator.find_optimal_prompts(results, top_n=2)
        
        assert len(optimal_prompts) == 2
        
        # First should be the excellent prompt
        best = optimal_prompts[0]
        assert "Excellent prompt" in best["prompt"]
        assert best["success_rate"] == 1.0
        assert best["total_tests"] == 2
        assert best["successful_tests"] == 2
        assert best["avg_tasks_per_execution"] == 4.5
        
        # Should have calculated derived metrics
        assert "composite_score" in best
        assert "cost_per_task" in best
        assert best["composite_score"] > 0
    
    def test_find_optimal_prompts_empty_results(self):
        """Test finding optimal prompts with empty results."""
        optimal_prompts = PromptComparator.find_optimal_prompts([], top_n=5)
        
        assert optimal_prompts == []
    
    def test_find_optimal_prompts_single_result(self):
        """Test finding optimal prompts with single result."""
        results = [
            PromptTestResult(
                test_id="1", prompt="Single prompt",
                provider_name="mock", model="model", success=True,
                response_time=0.5, tasks_generated=3, cost_estimate=0.01
            )
        ]
        
        optimal_prompts = PromptComparator.find_optimal_prompts(results, top_n=5)
        
        assert len(optimal_prompts) == 1
        assert optimal_prompts[0]["prompt"] == "Single prompt"
        assert optimal_prompts[0]["success_rate"] == 1.0


class TestPromptMetric:
    """Test the PromptMetric enum."""
    
    def test_prompt_metric_values(self):
        """Test that all metric values are correct."""
        assert PromptMetric.RESPONSE_TIME.value == "response_time"
        assert PromptMetric.TOKEN_COUNT.value == "token_count"
        assert PromptMetric.COST_ESTIMATE.value == "cost_estimate"
        assert PromptMetric.TASK_COUNT.value == "task_count"
        assert PromptMetric.SUCCESS_RATE.value == "success_rate"
        assert PromptMetric.CONSISTENCY.value == "consistency"
    
    def test_prompt_metric_enum_completeness(self):
        """Test that we have all expected metrics."""
        expected_metrics = {
            "response_time", "token_count", "cost_estimate", 
            "task_count", "success_rate", "consistency"
        }
        actual_metrics = {metric.value for metric in PromptMetric}
        
        assert actual_metrics == expected_metrics


class TestPromptTestSuite:
    """Test the PromptTestSuite dataclass."""
    
    def test_prompt_test_suite_creation(self):
        """Test creating a prompt test suite."""
        suite = PromptTestSuite(
            name="Integration Test Suite",
            description="Tests for integration scenarios",
            prompts=["Prompt 1", "Prompt 2", "Prompt 3"],
            test_image=b"image_data",
            provider_configs=[
                {"provider_name": "gemini", "api_key": "key1"},
                {"provider_name": "openai", "api_key": "key2"}
            ],
            iterations=3,
            parallel=True
        )
        
        assert suite.name == "Integration Test Suite"
        assert suite.description == "Tests for integration scenarios"
        assert len(suite.prompts) == 3
        assert suite.test_image == b"image_data"
        assert len(suite.provider_configs) == 2
        assert suite.iterations == 3
        assert suite.parallel is True
    
    def test_prompt_test_suite_defaults(self):
        """Test prompt test suite with default values."""
        suite = PromptTestSuite(
            name="Default Suite",
            description="Suite with defaults",
            prompts=["Single prompt"],
            test_image=b"data",
            provider_configs=[{"provider_name": "mock"}]
        )
        
        assert suite.iterations == 1
        assert suite.parallel is False


class TestPromptAnalysis:
    """Test the PromptAnalysis dataclass."""
    
    def test_prompt_analysis_creation(self):
        """Test creating a prompt analysis."""
        analysis = PromptAnalysis(
            suite_name="Test Analysis",
            total_tests=10,
            successful_tests=8,
            average_response_time=0.75,
            total_tokens_used=1000,
            total_cost_estimate=0.10,
            average_tasks_per_prompt=2.5,
            consistency_score=0.85,
            best_prompt="Best prompt here",
            worst_prompt="Worst prompt here"
        )
        
        assert analysis.suite_name == "Test Analysis"
        assert analysis.total_tests == 10
        assert analysis.successful_tests == 8
        assert analysis.average_response_time == 0.75
        assert analysis.total_tokens_used == 1000
        assert analysis.total_cost_estimate == 0.10
        assert analysis.average_tasks_per_prompt == 2.5
        assert analysis.consistency_score == 0.85
        assert analysis.best_prompt == "Best prompt here"
        assert analysis.worst_prompt == "Worst prompt here"
        assert analysis.detailed_results == []  # Default empty list