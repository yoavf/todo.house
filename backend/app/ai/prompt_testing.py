"""Prompt testing and development tools for AI image analysis."""

import json
import time
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

from .providers import AIProvider
from .test_images import TestImageLibrary, TestScenario, TestImageMetadata
from ..logging_config import PromptTestingLogger

logger = logging.getLogger(__name__)

# Constants
DEFAULT_FUZZY_THRESHOLD = 0.4
STOP_WORDS = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'}


class TestResult(str, Enum):
    """Test result status."""
    
    SUCCESS = "success"
    FAILURE = "failure"
    PARTIAL = "partial"
    ERROR = "error"


@dataclass
class PromptTestResult:
    """Result of a single prompt test."""
    
    test_id: str
    prompt: str
    scenario: TestScenario
    result_status: TestResult
    ai_response: Dict[str, Any]
    processing_time: float
    tasks_generated: int
    expected_tasks: List[str]
    matched_tasks: List[str]
    missing_tasks: List[str]
    unexpected_tasks: List[str]
    accuracy_score: float
    confidence_score: Optional[float]
    error_message: Optional[str] = None
    timestamp: Optional[datetime] = None
    provider_name: str = ""
    model_name: str = ""
    
    def __post_init__(self) -> None:
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class PromptComparison:
    """Comparison results between multiple prompts."""
    
    comparison_id: str
    prompts: List[str]
    scenario: TestScenario
    results: List[PromptTestResult]
    best_prompt_index: int
    best_accuracy: float
    average_accuracy: float
    average_processing_time: float
    timestamp: Optional[datetime] = None
    
    def __post_init__(self) -> None:
        if self.timestamp is None:
            self.timestamp = datetime.now()


class PromptTester:
    """Tool for testing and evaluating AI prompts."""
    
    def __init__(self, ai_provider: AIProvider):
        """
        Initialize prompt tester.
        
        Args:
            ai_provider: AI provider instance for testing
        """
        self.ai_provider = ai_provider
        self.test_library = TestImageLibrary()
        self.test_logger = PromptTestingLogger()
        self._test_history: List[PromptTestResult] = []
        self._comparison_history: List[PromptComparison] = []
    
    async def test_single_prompt(
        self, 
        prompt: str, 
        scenario: TestScenario,
        custom_image: Optional[bytes] = None
    ) -> PromptTestResult:
        """
        Test a single prompt against a test scenario.
        
        Args:
            prompt: Prompt to test
            scenario: Test scenario to use
            custom_image: Optional custom image data (uses test library if None)
            
        Returns:
            Test result with evaluation metrics
        """
        test_id = str(uuid.uuid4())
        start_time = time.time()
        
        try:
            # Get test image and metadata
            if custom_image:
                image_data = custom_image
                metadata = TestImageMetadata(
                    scenario=scenario,
                    description="Custom test image",
                    expected_tasks=[],
                    expected_categories=[],
                    expected_priorities=[]
                )
            else:
                image_data = self.test_library.get_test_image(scenario)
                metadata = self.test_library.get_test_metadata(scenario)
            
            # Log test start
            self.test_logger.log_prompt_test_start(
                test_id=test_id,
                scenario=scenario.value,
                prompt_length=len(prompt),
                provider=self.ai_provider.get_provider_name(),
                model=getattr(self.ai_provider, 'model', 'unknown')
            )
            
            # Run AI analysis
            ai_response = await self.ai_provider.analyze_image(image_data, prompt)
            processing_time = time.time() - start_time
            
            # Evaluate results
            evaluation = self._evaluate_response(ai_response, metadata)
            
            # Create test result
            result = PromptTestResult(
                test_id=test_id,
                prompt=prompt,
                scenario=scenario,
                result_status=TestResult.SUCCESS,
                ai_response=ai_response,
                processing_time=processing_time,
                tasks_generated=len(ai_response.get("tasks", [])),
                expected_tasks=metadata.expected_tasks,
                matched_tasks=evaluation["matched_tasks"],
                missing_tasks=evaluation["missing_tasks"],
                unexpected_tasks=evaluation["unexpected_tasks"],
                accuracy_score=evaluation["accuracy_score"],
                confidence_score=ai_response.get("confidence_score"),
                provider_name=self.ai_provider.get_provider_name(),
                model_name=getattr(self.ai_provider, 'model', 'unknown')
            )
            
            # Log successful test
            self.test_logger.log_prompt_test_complete(
                test_id=test_id,
                scenario=scenario.value,
                processing_time=processing_time,
                tasks_generated=result.tasks_generated,
                accuracy_score=result.accuracy_score,
                success=True
            )
            
            # Store in history
            self._test_history.append(result)
            
            logger.info(
                f"Prompt test completed: {scenario.value} - "
                f"Accuracy: {result.accuracy_score:.2f}, "
                f"Tasks: {result.tasks_generated}"
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = str(e)
            
            # Log failed test
            self.test_logger.log_prompt_test_complete(
                test_id=test_id,
                scenario=scenario.value,
                processing_time=processing_time,
                tasks_generated=0,
                accuracy_score=0.0,
                success=False,
                error_message=error_msg
            )
            
            # Create error result
            result = PromptTestResult(
                test_id=test_id,
                prompt=prompt,
                scenario=scenario,
                result_status=TestResult.ERROR,
                ai_response={},
                processing_time=processing_time,
                tasks_generated=0,
                expected_tasks=getattr(metadata, 'expected_tasks', []) if metadata else [],
                matched_tasks=[],
                missing_tasks=[],
                unexpected_tasks=[],
                accuracy_score=0.0,
                confidence_score=None,
                error_message=error_msg,
                provider_name=self.ai_provider.get_provider_name(),
                model_name=getattr(self.ai_provider, 'model', 'unknown')
            )
            
            self._test_history.append(result)
            
            logger.error(f"Prompt test failed: {scenario.value} - {error_msg}")
            return result
    
    async def test_prompt_variations(
        self, 
        prompts: List[str], 
        scenario: TestScenario,
        custom_image: Optional[bytes] = None
    ) -> PromptComparison:
        """
        Test multiple prompt variations against the same scenario.
        
        Args:
            prompts: List of prompts to test
            scenario: Test scenario to use
            custom_image: Optional custom image data
            
        Returns:
            Comparison results with rankings
        """
        comparison_id = str(uuid.uuid4())
        results = []
        
        logger.info(f"Testing {len(prompts)} prompt variations for {scenario.value}")
        
        # Test each prompt
        for i, prompt in enumerate(prompts):
            logger.info(f"Testing prompt {i+1}/{len(prompts)}")
            result = await self.test_single_prompt(prompt, scenario, custom_image)
            results.append(result)
        
        # Find best prompt
        best_index = 0
        best_accuracy = 0.0
        
        for i, result in enumerate(results):
            if result.accuracy_score > best_accuracy:
                best_accuracy = result.accuracy_score
                best_index = i
        
        # Calculate averages
        avg_accuracy = sum(r.accuracy_score for r in results) / len(results)
        avg_processing_time = sum(r.processing_time for r in results) / len(results)
        
        # Create comparison result
        comparison = PromptComparison(
            comparison_id=comparison_id,
            prompts=prompts,
            scenario=scenario,
            results=results,
            best_prompt_index=best_index,
            best_accuracy=best_accuracy,
            average_accuracy=avg_accuracy,
            average_processing_time=avg_processing_time
        )
        
        # Store in history
        self._comparison_history.append(comparison)
        
        # Log comparison
        self.test_logger.log_prompt_comparison(
            comparison_id=comparison_id,
            scenario=scenario.value,
            prompt_count=len(prompts),
            best_accuracy=best_accuracy,
            average_accuracy=avg_accuracy,
            best_prompt_index=best_index
        )
        
        logger.info(
            f"Prompt comparison completed: Best accuracy {best_accuracy:.2f} "
            f"(prompt {best_index+1}), Average: {avg_accuracy:.2f}"
        )
        
        return comparison
    
    async def test_all_scenarios(
        self, 
        prompt: str,
        scenarios: Optional[List[TestScenario]] = None
    ) -> List[PromptTestResult]:
        """
        Test a single prompt against multiple scenarios.
        
        Args:
            prompt: Prompt to test
            scenarios: List of scenarios to test (all if None)
            
        Returns:
            List of test results
        """
        if scenarios is None:
            scenarios = self.test_library.get_all_scenarios()
        
        results = []
        logger.info(f"Testing prompt against {len(scenarios)} scenarios")
        
        for scenario in scenarios:
            logger.info(f"Testing scenario: {scenario.value}")
            result = await self.test_single_prompt(prompt, scenario)
            results.append(result)
        
        # Log summary
        avg_accuracy = sum(r.accuracy_score for r in results) / len(results)
        successful_tests = sum(1 for r in results if r.result_status == TestResult.SUCCESS)
        
        logger.info(
            f"Multi-scenario test completed: {successful_tests}/{len(scenarios)} successful, "
            f"Average accuracy: {avg_accuracy:.2f}"
        )
        
        return results
    
    def _evaluate_response(
        self, 
        ai_response: Dict[str, Any], 
        expected_metadata: TestImageMetadata
    ) -> Dict[str, Any]:
        """
        Evaluate AI response against expected results.
        
        Args:
            ai_response: AI provider response
            expected_metadata: Expected test results
            
        Returns:
            Evaluation metrics
        """
        generated_tasks = ai_response.get("tasks", [])
        expected_tasks = expected_metadata.expected_tasks
        
        # Extract and normalize task titles for comparison (do normalization once)
        generated_titles = []
        for task in generated_tasks:
            title = task.get("title", "")
            if title:
                normalized = title.lower().strip()
                if normalized:  # Only add non-empty titles
                    generated_titles.append(normalized)
        
        expected_titles = []
        for task in expected_tasks:
            if task:
                normalized = task.lower().strip()
                if normalized:  # Only add non-empty titles
                    expected_titles.append(normalized)
        
        # Find matches using fuzzy matching
        matched_tasks = []
        missing_tasks = []
        unexpected_tasks = []
        
        # Check for expected tasks in generated tasks
        for expected in expected_titles:
            found_match = False
            for generated in generated_titles:
                if self._fuzzy_match(expected, generated):
                    matched_tasks.append(expected)
                    found_match = True
                    break
            
            if not found_match:
                missing_tasks.append(expected)
        
        # Check for unexpected tasks
        for generated in generated_titles:
            found_match = False
            for expected in expected_titles:
                if self._fuzzy_match(expected, generated):
                    found_match = True
                    break
            
            if not found_match:
                unexpected_tasks.append(generated)
        
        # Calculate accuracy score
        if len(expected_tasks) == 0:
            accuracy_score = 1.0 if len(generated_tasks) == 0 else 0.5
        else:
            # Precision: matched / generated
            precision = len(matched_tasks) / len(generated_tasks) if generated_tasks else 0
            
            # Recall: matched / expected
            recall = len(matched_tasks) / len(expected_tasks) if expected_tasks else 0
            
            # F1 score as accuracy
            if precision + recall == 0:
                accuracy_score = 0.0
            else:
                accuracy_score = 2 * (precision * recall) / (precision + recall)
        
        return {
            "matched_tasks": matched_tasks,
            "missing_tasks": missing_tasks,
            "unexpected_tasks": unexpected_tasks,
            "accuracy_score": round(accuracy_score, 3),
            "precision": round(precision, 3) if 'precision' in locals() else 0.0,
            "recall": round(recall, 3) if 'recall' in locals() else 0.0
        }
    
    def _fuzzy_match(self, expected: str, generated: str, threshold: float = DEFAULT_FUZZY_THRESHOLD) -> bool:
        """
        Check if two task descriptions are similar enough to be considered a match.
        
        Args:
            expected: Expected task description
            generated: Generated task description
            threshold: Similarity threshold (0.0 to 1.0)
            
        Returns:
            True if tasks are similar enough
        """
        # Simple fuzzy matching using word overlap
        expected_words = set(expected.lower().split())
        generated_words = set(generated.lower().split())
        
        if not expected_words or not generated_words:
            return expected == generated
        
        # Calculate Jaccard similarity
        intersection = len(expected_words.intersection(generated_words))
        union = len(expected_words.union(generated_words))
        
        similarity = intersection / union if union > 0 else 0.0
        
        # Also check if key words are present (more lenient matching)
        key_words_match = False
        if intersection > 0:
            # If we have at least one word in common, check if it's a significant word
            common_words = expected_words.intersection(generated_words)
            # Filter out common stop words
            meaningful_common = common_words - STOP_WORDS
            if meaningful_common:
                key_words_match = True
        
        return similarity >= threshold or key_words_match
    
    def get_test_history(self, limit: Optional[int] = None) -> List[PromptTestResult]:
        """
        Get test history.
        
        Args:
            limit: Maximum number of results to return
            
        Returns:
            List of test results
        """
        history = sorted(self._test_history, key=lambda x: x.timestamp or datetime.min, reverse=True)
        if limit is not None and limit >= 0:
            return history[:limit]
        return history
    
    def get_comparison_history(self, limit: Optional[int] = None) -> List[PromptComparison]:
        """
        Get comparison history.
        
        Args:
            limit: Maximum number of comparisons to return
            
        Returns:
            List of prompt comparisons
        """
        history = sorted(self._comparison_history, key=lambda x: x.timestamp or datetime.min, reverse=True)
        return history[:limit] if limit else history
    
    def get_best_prompts_by_scenario(self) -> Dict[str, Tuple[str, float]]:
        """
        Get best performing prompts for each scenario.
        
        Returns:
            Dictionary mapping scenario to (best_prompt, accuracy_score)
        """
        best_prompts: Dict[str, Tuple[str, float]] = {}
        
        for result in self._test_history:
            scenario_key = result.scenario.value
            
            if (scenario_key not in best_prompts or 
                result.accuracy_score > best_prompts[scenario_key][1]):
                best_prompts[scenario_key] = (result.prompt, result.accuracy_score)
        
        return best_prompts
    
    def generate_test_report(self, results: List[PromptTestResult]) -> Dict[str, Any]:
        """
        Generate comprehensive test report.
        
        Args:
            results: List of test results to analyze
            
        Returns:
            Test report with statistics and insights
        """
        if not results:
            return {"error": "No test results provided"}
        
        # Basic statistics
        total_tests = len(results)
        successful_tests = sum(1 for r in results if r.result_status == TestResult.SUCCESS)
        failed_tests = total_tests - successful_tests
        
        accuracy_scores = [r.accuracy_score for r in results if r.result_status == TestResult.SUCCESS]
        avg_accuracy = sum(accuracy_scores) / len(accuracy_scores) if accuracy_scores else 0.0
        max_accuracy = max(accuracy_scores) if accuracy_scores else 0.0
        min_accuracy = min(accuracy_scores) if accuracy_scores else 0.0
        
        processing_times = [r.processing_time for r in results]
        avg_processing_time = sum(processing_times) / len(processing_times)
        
        # Task generation statistics
        total_tasks_generated = sum(r.tasks_generated for r in results)
        avg_tasks_per_test = total_tasks_generated / total_tests if total_tests > 0 else 0
        
        # Scenario breakdown
        scenario_stats = {}
        for result in results:
            scenario = result.scenario.value
            if scenario not in scenario_stats:
                scenario_stats[scenario] = {
                    "tests": 0,
                    "successful": 0,
                    "avg_accuracy": 0.0,
                    "avg_tasks": 0.0
                }
            
            stats = scenario_stats[scenario]
            stats["tests"] += 1
            if result.result_status == TestResult.SUCCESS:
                stats["successful"] += 1
            stats["avg_accuracy"] = (stats["avg_accuracy"] * (stats["tests"] - 1) + result.accuracy_score) / stats["tests"]
            stats["avg_tasks"] = (stats["avg_tasks"] * (stats["tests"] - 1) + result.tasks_generated) / stats["tests"]
        
        # Provider statistics
        provider_stats = {}
        for result in results:
            provider = result.provider_name
            if provider not in provider_stats:
                provider_stats[provider] = {
                    "tests": 0,
                    "avg_accuracy": 0.0,
                    "avg_processing_time": 0.0
                }
            
            stats = provider_stats[provider]
            stats["tests"] += 1
            stats["avg_accuracy"] = (stats["avg_accuracy"] * (stats["tests"] - 1) + result.accuracy_score) / stats["tests"]
            stats["avg_processing_time"] = (stats["avg_processing_time"] * (stats["tests"] - 1) + result.processing_time) / stats["tests"]
        
        return {
            "summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": failed_tests,
                "success_rate": successful_tests / total_tests if total_tests > 0 else 0.0,
                "average_accuracy": round(avg_accuracy, 3),
                "max_accuracy": round(max_accuracy, 3),
                "min_accuracy": round(min_accuracy, 3),
                "average_processing_time": round(avg_processing_time, 3),
                "total_tasks_generated": total_tasks_generated,
                "average_tasks_per_test": round(avg_tasks_per_test, 1)
            },
            "scenario_breakdown": scenario_stats,
            "provider_breakdown": provider_stats,
            "generated_at": datetime.now().isoformat()
        }
    
    def export_results(self, results: List[PromptTestResult], format: str = "json") -> str:
        """
        Export test results in specified format.
        
        Args:
            results: Test results to export
            format: Export format ("json" or "csv")
            
        Returns:
            Exported data as string
        """
        if format.lower() == "json":
            return json.dumps([asdict(result) for result in results], 
                            indent=2, default=str)
        elif format.lower() == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if results:
                fieldnames = asdict(results[0]).keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                
                for result in results:
                    row = asdict(result)
                    # Convert complex fields to strings
                    for key, value in row.items():
                        if isinstance(value, (list, dict)):
                            row[key] = json.dumps(value)
                    writer.writerow(row)
            
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def clear_history(self) -> None:
        """Clear test and comparison history."""
        self._test_history.clear()
        self._comparison_history.clear()
        logger.info("Test history cleared")


class PromptLibrary:
    """Library of pre-defined prompts for testing."""
    
    @staticmethod
    def get_base_prompt() -> str:
        """Get the current base prompt used in production."""
        return """You are a home maintenance expert analyzing an image to identify maintenance tasks.

Analyze this image and identify specific, actionable home maintenance tasks based on what you observe.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why
3. Assign a priority level (high, medium, low) based on urgency and safety
4. Suggest a category (cleaning, repair, maintenance, safety, etc.)

Focus on:
- Visible maintenance needs (dirt, wear, damage)
- Safety concerns
- Preventive maintenance opportunities
- Seasonal considerations

Return your response as a JSON array of tasks with this structure:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "category": "category name",
      "reasoning": "Why this task is needed"
    }
  ],
  "analysis_summary": "Brief summary of what you observed in the image"
}

If you cannot identify any maintenance tasks, return an empty tasks array with an explanation in the analysis_summary."""
    
    @staticmethod
    def get_detailed_prompt() -> str:
        """Get a more detailed version of the prompt."""
        return """You are an expert home maintenance professional with 20+ years of experience analyzing images to identify maintenance needs.

TASK: Carefully examine this image and identify ALL visible maintenance tasks, repairs, and improvements needed.

ANALYSIS APPROACH:
1. Systematically scan the entire image from top to bottom, left to right
2. Look for signs of wear, damage, dirt, deterioration, or safety hazards
3. Consider both immediate needs and preventive maintenance opportunities
4. Prioritize based on safety, urgency, and cost of delay

FOR EACH TASK IDENTIFIED:
- Title: Concise, actionable description (max 50 characters)
- Description: Detailed explanation of what needs to be done and why
- Priority: HIGH (safety/urgent), MEDIUM (important), LOW (cosmetic/preventive)
- Category: cleaning, repair, maintenance, safety, seasonal, organization
- Reasoning: Specific evidence you observed that indicates this task is needed

FOCUS AREAS:
✓ Safety hazards (mold, electrical, structural, slip hazards)
✓ Visible damage (cracks, stains, rust, wear)
✓ Cleanliness issues (dirt, grime, buildup)
✓ Maintenance needs (filters, seals, moving parts)
✓ Preventive opportunities (weatherproofing, lubrication)
✓ Organization and efficiency improvements

OUTPUT FORMAT (JSON):
{
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Detailed explanation of work needed",
      "priority": "high|medium|low",
      "category": "appropriate category",
      "reasoning": "What you observed that indicates this need"
    }
  ],
  "analysis_summary": "Comprehensive summary of your observations and overall assessment"
}

Be thorough but practical. Only suggest tasks that are clearly visible and actionable."""
    
    @staticmethod
    def get_concise_prompt() -> str:
        """Get a more concise version of the prompt."""
        return """Analyze this image for home maintenance needs.

Identify visible maintenance tasks with:
- Clear title (max 50 chars)
- Brief description
- Priority (high/medium/low)
- Category (cleaning/repair/maintenance/safety)

Focus on safety issues, visible damage, and cleaning needs.

Return JSON:
{
  "tasks": [{"title": "", "description": "", "priority": "", "category": "", "reasoning": ""}],
  "analysis_summary": ""
}"""
    
    @staticmethod
    def get_safety_focused_prompt() -> str:
        """Get a safety-focused version of the prompt."""
        return """You are a safety inspector analyzing this image for potential hazards and maintenance needs.

PRIMARY FOCUS: Identify safety concerns and maintenance tasks that could prevent accidents or health issues.

SAFETY PRIORITIES:
1. Immediate hazards (electrical, structural, chemical)
2. Health risks (mold, air quality, contamination)
3. Slip/fall risks (wet surfaces, loose items, poor lighting)
4. Fire hazards (blocked exits, faulty equipment)
5. Preventive maintenance to avoid future safety issues

For each task:
- Title: Clear, action-oriented (max 50 characters)
- Description: What to do and why it's important for safety
- Priority: HIGH for immediate safety risks, MEDIUM for preventive safety measures, LOW for minor issues
- Category: safety, cleaning, repair, maintenance
- Reasoning: Specific safety concern observed

Return JSON format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Safety-focused description",
      "priority": "high|medium|low",
      "category": "category",
      "reasoning": "Safety concern observed"
    }
  ],
  "analysis_summary": "Safety assessment summary"
}

If no safety issues are visible, focus on general maintenance that prevents future problems."""
    
    @staticmethod
    def get_all_test_prompts() -> List[Tuple[str, str]]:
        """
        Get all test prompts with names.
        
        Returns:
            List of (name, prompt) tuples
        """
        return [
            ("Base Prompt", PromptLibrary.get_base_prompt()),
            ("Detailed Prompt", PromptLibrary.get_detailed_prompt()),
            ("Concise Prompt", PromptLibrary.get_concise_prompt()),
            ("Safety Focused", PromptLibrary.get_safety_focused_prompt())
        ]