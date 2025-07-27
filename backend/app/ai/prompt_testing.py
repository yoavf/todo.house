"""Prompt testing framework for AI providers."""

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
import logging

from .providers import AIProvider, AIProviderFactory

logger = logging.getLogger(__name__)


class PromptMetric(Enum):
    """Metrics to evaluate prompt performance."""
    
    RESPONSE_TIME = "response_time"
    TOKEN_COUNT = "token_count"
    COST_ESTIMATE = "cost_estimate"
    TASK_COUNT = "task_count"
    SUCCESS_RATE = "success_rate"
    CONSISTENCY = "consistency"


@dataclass
class PromptTestResult:
    """Result of a single prompt test execution."""
    
    test_id: str
    prompt: str
    provider_name: str
    model: str
    success: bool
    response_time: float
    tokens_used: Optional[int] = None
    cost_estimate: Optional[float] = None
    tasks_generated: int = 0
    analysis_summary: str = ""
    error_message: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    response_data: Optional[Dict[str, Any]] = None


@dataclass
class PromptTestSuite:
    """Collection of prompt tests with shared configuration."""
    
    name: str
    description: str
    prompts: List[str]
    test_image: bytes
    provider_configs: List[Dict[str, Any]]
    iterations: int = 1
    parallel: bool = False


@dataclass
class PromptAnalysis:
    """Analysis results across multiple prompt tests."""
    
    suite_name: str
    total_tests: int
    successful_tests: int
    average_response_time: float
    total_tokens_used: int
    total_cost_estimate: float
    average_tasks_per_prompt: float
    consistency_score: float
    best_prompt: Optional[str] = None
    worst_prompt: Optional[str] = None
    detailed_results: List[PromptTestResult] = field(default_factory=list)


class PromptTester:
    """Framework for testing AI prompts systematically."""
    
    def __init__(self):
        """Initialize the prompt testing framework."""
        self.results: List[PromptTestResult] = []
        self.custom_validators: List[Callable[[Dict[str, Any]], bool]] = []
    
    async def test_prompt(
        self,
        prompt: str,
        provider: AIProvider,
        test_image: bytes,
        test_id: Optional[str] = None
    ) -> PromptTestResult:
        """
        Test a single prompt with an AI provider.
        
        Args:
            prompt: The prompt to test
            provider: AI provider instance
            test_image: Image data for analysis
            test_id: Optional test identifier
            
        Returns:
            PromptTestResult with metrics and analysis
        """
        if test_id is None:
            test_id = str(uuid.uuid4())
            
        logger.info(f"Testing prompt: {prompt[:50]}... with {provider.get_provider_name()}")
        
        start_time = time.time()
        
        try:
            # Execute the prompt
            response = await provider.analyze_image(test_image, prompt)
            
            # Calculate metrics
            response_time = time.time() - start_time
            tokens_used = response.get("tokens_used")
            cost_estimate = response.get("cost_estimate")
            tasks_generated = len(response.get("tasks", []))
            analysis_summary = response.get("analysis_summary", "")
            
            result = PromptTestResult(
                test_id=test_id,
                prompt=prompt,
                provider_name=provider.get_provider_name(),
                model=getattr(provider, 'model', 'unknown'),
                success=True,
                response_time=response_time,
                tokens_used=tokens_used,
                cost_estimate=cost_estimate,
                tasks_generated=tasks_generated,
                analysis_summary=analysis_summary,
                response_data=response
            )
            
            self.results.append(result)
            return result
            
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"Prompt test failed: {e}")
            
            result = PromptTestResult(
                test_id=test_id,
                prompt=prompt,
                provider_name=provider.get_provider_name(),
                model=getattr(provider, 'model', 'unknown'),
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
            
            self.results.append(result)
            return result
    
    async def run_test_suite(self, test_suite: PromptTestSuite) -> PromptAnalysis:
        """
        Run a complete test suite with multiple prompts and providers.
        
        Args:
            test_suite: Test suite configuration
            
        Returns:
            PromptAnalysis with aggregated results
        """
        logger.info(f"Running test suite: {test_suite.name}")
        
        all_results = []
        
        # Create provider instances
        providers = []
        for config in test_suite.provider_configs:
            provider = AIProviderFactory.create_provider(**config)
            providers.append(provider)
        
        # Generate all test combinations
        test_tasks = []
        for prompt in test_suite.prompts:
            for provider in providers:
                for iteration in range(test_suite.iterations):
                    test_id = f"{test_suite.name}_{prompt[:20]}_{provider.get_provider_name()}_{iteration}"
                    test_tasks.append((prompt, provider, test_suite.test_image, test_id))
        
        # Execute tests
        if test_suite.parallel:
            # Run tests in parallel
            tasks = [
                self.test_prompt(prompt, provider, image, test_id)
                for prompt, provider, image, test_id in test_tasks
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out exceptions and add to all_results
            for result in results:
                if isinstance(result, PromptTestResult):
                    all_results.append(result)
                else:
                    logger.error(f"Test failed with exception: {result}")
        else:
            # Run tests sequentially
            for prompt, provider, image, test_id in test_tasks:
                result = await self.test_prompt(prompt, provider, image, test_id)
                all_results.append(result)
        
        # Analyze results
        analysis = self._analyze_results(test_suite.name, all_results)
        
        logger.info(f"Test suite '{test_suite.name}' completed. "
                   f"Success rate: {analysis.successful_tests}/{analysis.total_tests}")
        
        return analysis
    
    def _analyze_results(self, suite_name: str, results: List[PromptTestResult]) -> PromptAnalysis:
        """
        Analyze test results and generate comprehensive metrics.
        
        Args:
            suite_name: Name of the test suite
            results: List of test results
            
        Returns:
            PromptAnalysis with aggregated metrics
        """
        if not results:
            return PromptAnalysis(
                suite_name=suite_name,
                total_tests=0,
                successful_tests=0,
                average_response_time=0.0,
                total_tokens_used=0,
                total_cost_estimate=0.0,
                average_tasks_per_prompt=0.0,
                consistency_score=0.0,
                detailed_results=[]
            )
        
        successful_results = [r for r in results if r.success]
        total_tests = len(results)
        successful_tests = len(successful_results)
        
        if successful_results:
            avg_response_time = sum(r.response_time for r in successful_results) / len(successful_results)
            total_tokens = sum(r.tokens_used or 0 for r in successful_results)
            total_cost = sum(r.cost_estimate or 0.0 for r in successful_results)
            avg_tasks = sum(r.tasks_generated for r in successful_results) / len(successful_results)
            
            # Calculate consistency score based on task count variance
            task_counts = [r.tasks_generated for r in successful_results]
            if len(task_counts) > 1:
                variance = sum((x - avg_tasks) ** 2 for x in task_counts) / len(task_counts)
                consistency_score = max(0.0, 1.0 - (variance / (avg_tasks + 1)))
            else:
                consistency_score = 1.0
        else:
            avg_response_time = 0.0
            total_tokens = 0
            total_cost = 0.0
            avg_tasks = 0.0
            consistency_score = 0.0
        
        # Find best and worst prompts by success rate and task generation
        prompt_performance = {}
        for result in results:
            if result.prompt not in prompt_performance:
                prompt_performance[result.prompt] = {
                    'successes': 0,
                    'total': 0,
                    'avg_tasks': 0.0,
                    'total_tasks': 0
                }
            
            perf = prompt_performance[result.prompt]
            perf['total'] += 1
            if result.success:
                perf['successes'] += 1
                perf['total_tasks'] += result.tasks_generated
        
        # Calculate success rates and average tasks
        for prompt, perf in prompt_performance.items():
            if perf['successes'] > 0:
                perf['avg_tasks'] = perf['total_tasks'] / perf['successes']
            perf['success_rate'] = perf['successes'] / perf['total']
        
        # Find best prompt (highest success rate, then highest avg tasks)
        best_prompt = None
        worst_prompt = None
        
        if prompt_performance:
            sorted_prompts = sorted(
                prompt_performance.items(),
                key=lambda x: (x[1]['success_rate'], x[1]['avg_tasks']),
                reverse=True
            )
            best_prompt = sorted_prompts[0][0] if sorted_prompts else None
            worst_prompt = sorted_prompts[-1][0] if sorted_prompts else None
        
        return PromptAnalysis(
            suite_name=suite_name,
            total_tests=total_tests,
            successful_tests=successful_tests,
            average_response_time=avg_response_time,
            total_tokens_used=total_tokens,
            total_cost_estimate=total_cost,
            average_tasks_per_prompt=avg_tasks,
            consistency_score=consistency_score,
            best_prompt=best_prompt,
            worst_prompt=worst_prompt,
            detailed_results=results
        )
    
    def add_custom_validator(self, validator: Callable[[Dict[str, Any]], bool]) -> None:
        """
        Add a custom validation function for AI responses.
        
        Args:
            validator: Function that takes response data and returns True if valid
        """
        self.custom_validators.append(validator)
    
    def export_results(self, format: str = "json") -> str:
        """
        Export test results in specified format.
        
        Args:
            format: Export format ("json", "csv", "summary")
            
        Returns:
            Formatted results string
        """
        if format.lower() == "json":
            return json.dumps([
                {
                    "test_id": r.test_id,
                    "prompt": r.prompt,
                    "provider": r.provider_name,
                    "model": r.model,
                    "success": r.success,
                    "response_time": r.response_time,
                    "tokens_used": r.tokens_used,
                    "cost_estimate": r.cost_estimate,
                    "tasks_generated": r.tasks_generated,
                    "error_message": r.error_message,
                    "timestamp": r.timestamp
                }
                for r in self.results
            ], indent=2)
        
        elif format.lower() == "summary":
            if not self.results:
                return "No test results available."
            
            successful = len([r for r in self.results if r.success])
            total = len(self.results)
            avg_time = sum(r.response_time for r in self.results) / total
            
            summary = f"""
Prompt Testing Results Summary
==============================
Total Tests: {total}
Successful: {successful}
Success Rate: {successful/total*100:.1f}%
Average Response Time: {avg_time:.2f}s

Top Performing Prompts:
"""
            
            # Group by prompt and show performance
            prompt_perf = {}
            for result in self.results:
                if result.prompt not in prompt_perf:
                    prompt_perf[result.prompt] = {'success': 0, 'total': 0, 'avg_tasks': 0}
                prompt_perf[result.prompt]['total'] += 1
                if result.success:
                    prompt_perf[result.prompt]['success'] += 1
                    prompt_perf[result.prompt]['avg_tasks'] += result.tasks_generated
            
            for prompt, perf in sorted(prompt_perf.items(), 
                                     key=lambda x: x[1]['success']/x[1]['total'], 
                                     reverse=True)[:5]:
                success_rate = perf['success'] / perf['total'] * 100
                avg_tasks = perf['avg_tasks'] / max(perf['success'], 1)
                summary += f"\n- '{prompt[:50]}...' - {success_rate:.1f}% success, {avg_tasks:.1f} avg tasks"
            
            return summary
        
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def clear_results(self) -> None:
        """Clear all stored test results."""
        self.results.clear()


class PromptComparator:
    """Tools for comparing and analyzing prompt effectiveness."""
    
    @staticmethod
    def compare_prompts(
        results_a: List[PromptTestResult], 
        results_b: List[PromptTestResult]
    ) -> Dict[str, Any]:
        """
        Compare two sets of prompt test results.
        
        Args:
            results_a: First set of results
            results_b: Second set of results
            
        Returns:
            Comparison analysis
        """
        def calc_metrics(results):
            if not results:
                return {
                    'success_rate': 0.0,
                    'avg_response_time': 0.0,
                    'avg_tasks': 0.0,
                    'total_cost': 0.0
                }
            
            successful = [r for r in results if r.success]
            return {
                'success_rate': len(successful) / len(results),
                'avg_response_time': sum(r.response_time for r in successful) / max(len(successful), 1),
                'avg_tasks': sum(r.tasks_generated for r in successful) / max(len(successful), 1),
                'total_cost': sum(r.cost_estimate or 0.0 for r in successful)
            }
        
        metrics_a = calc_metrics(results_a)
        metrics_b = calc_metrics(results_b)
        
        return {
            'group_a': metrics_a,
            'group_b': metrics_b,
            'comparison': {
                'success_rate_diff': metrics_a['success_rate'] - metrics_b['success_rate'],
                'response_time_diff': metrics_a['avg_response_time'] - metrics_b['avg_response_time'],
                'task_count_diff': metrics_a['avg_tasks'] - metrics_b['avg_tasks'],
                'cost_diff': metrics_a['total_cost'] - metrics_b['total_cost'],
                'better_group': 'A' if metrics_a['success_rate'] > metrics_b['success_rate'] else 'B'
            }
        }
    
    @staticmethod
    def find_optimal_prompts(results: List[PromptTestResult], top_n: int = 5) -> List[Dict[str, Any]]:
        """
        Find the most effective prompts based on multiple criteria.
        
        Args:
            results: List of test results
            top_n: Number of top prompts to return
            
        Returns:
            List of top performing prompts with their metrics
        """
        prompt_metrics = {}
        
        for result in results:
            if result.prompt not in prompt_metrics:
                prompt_metrics[result.prompt] = {
                    'prompt': result.prompt,
                    'total_tests': 0,
                    'successful_tests': 0,
                    'total_response_time': 0.0,
                    'total_tasks': 0,
                    'total_cost': 0.0
                }
            
            metrics = prompt_metrics[result.prompt]
            metrics['total_tests'] += 1
            
            if result.success:
                metrics['successful_tests'] += 1
                metrics['total_response_time'] += result.response_time
                metrics['total_tasks'] += result.tasks_generated
                metrics['total_cost'] += result.cost_estimate or 0.0
        
        # Calculate derived metrics
        for prompt, metrics in prompt_metrics.items():
            successful = metrics['successful_tests']
            metrics['success_rate'] = successful / metrics['total_tests']
            metrics['avg_response_time'] = metrics['total_response_time'] / max(successful, 1)
            metrics['avg_tasks_per_execution'] = metrics['total_tasks'] / max(successful, 1)
            metrics['cost_per_task'] = metrics['total_cost'] / max(metrics['total_tasks'], 1)
            
            # Calculate composite score (success rate * task efficiency / cost)
            efficiency = metrics['avg_tasks_per_execution'] / max(metrics['avg_response_time'], 0.1)
            cost_factor = 1.0 / max(metrics['cost_per_task'], 0.001)
            metrics['composite_score'] = metrics['success_rate'] * efficiency * cost_factor
        
        # Sort by composite score and return top N
        sorted_prompts = sorted(
            prompt_metrics.values(),
            key=lambda x: x['composite_score'],
            reverse=True
        )
        
        return sorted_prompts[:top_n]