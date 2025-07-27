"""
Demo script showing how to use the prompt testing framework.

This example demonstrates:
1. Basic prompt testing with a single provider
2. Running comprehensive test suites
3. Comparing prompt effectiveness
4. Analyzing results and finding optimal prompts
5. Exporting results for analysis

Run this script to see the prompt testing framework in action.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to the path so we can import modules
sys.path.append(str(Path(__file__).parent.parent))

from app.ai.prompt_testing import (
    PromptTester, 
    PromptTestSuite, 
    PromptComparator,
    PromptMetric
)
from app.ai.providers import AIProviderFactory


# Sample test image (in real usage, load an actual image file)
SAMPLE_IMAGE = b"fake_image_data_for_testing"

# Sample prompts for testing different approaches
SAMPLE_PROMPTS = [
    # Basic prompts
    "What maintenance tasks do you see in this image?",
    "Analyze this image for any issues that need attention.",
    
    # Detailed prompts
    "Please analyze this image carefully and identify any maintenance tasks, repairs, or improvements needed. For each task, provide a clear title, detailed description, priority level, and reasoning.",
    
    # Structured prompts
    """Analyze this image and identify maintenance tasks using this structure:
    1. Safety-related issues (high priority)
    2. Structural problems (medium-high priority)
    3. Aesthetic improvements (medium priority)
    4. Preventive maintenance (low-medium priority)
    
    For each task, provide: title, description, priority, category, and reasoning.""",
    
    # Short and specific
    "List urgent repairs needed.",
    "Find maintenance issues.",
    
    # Context-rich prompts
    "You are a professional home inspector. Examine this image of a residential property and identify all maintenance tasks, repairs, and improvements. Prioritize safety issues first, then structural concerns, followed by aesthetic and preventive maintenance items.",
    
    # Different focus areas
    "Focus on electrical, plumbing, and HVAC issues in this image.",
    "Identify exterior maintenance needs including roofing, siding, and landscaping.",
    "Look for interior issues like flooring, walls, and fixtures that need attention."
]


async def demo_basic_prompt_testing():
    """Demonstrate basic prompt testing with a single provider."""
    print("=== Basic Prompt Testing Demo ===\n")
    
    # Create a prompt tester
    tester = PromptTester()
    
    # Create a provider (using mock for demo - in real usage, use actual provider)
    try:
        # In real usage with actual API key:
        # provider = AIProviderFactory.create_provider(
        #     "gemini", 
        #     api_key=os.getenv("GEMINI_API_KEY"),
        #     model="gemini-1.5-flash"
        # )
        
        # For demo purposes, we'll create a mock provider
        from app.ai.providers import GeminiProvider
        
        # This will use the mock implementation in GeminiProvider
        provider = GeminiProvider(api_key="demo_key", model="gemini-1.5-flash")
        
        # Test a single prompt
        prompt = "Analyze this image for maintenance tasks, focusing on safety and structural issues."
        print(f"Testing prompt: '{prompt[:50]}...'")
        
        result = await tester.test_prompt(prompt, provider, SAMPLE_IMAGE)
        
        print(f"Result:")
        print(f"  Success: {result.success}")
        print(f"  Response time: {result.response_time:.3f}s")
        print(f"  Tasks generated: {result.tasks_generated}")
        print(f"  Tokens used: {result.tokens_used}")
        print(f"  Cost estimate: ${result.cost_estimate:.4f}")
        print(f"  Provider: {result.provider_name} ({result.model})")
        
        if result.error_message:
            print(f"  Error: {result.error_message}")
        
        print("\n")
        
    except Exception as e:
        print(f"Error in basic testing: {e}")
        print("Note: This demo uses mock providers. For real testing, set up actual API keys.\n")


async def demo_comprehensive_test_suite():
    """Demonstrate running a comprehensive test suite with multiple prompts."""
    print("=== Comprehensive Test Suite Demo ===\n")
    
    tester = PromptTester()
    
    # Create test suite with multiple prompts and configurations
    test_suite = PromptTestSuite(
        name="Maintenance Task Analysis Suite",
        description="Comprehensive testing of different prompt strategies for maintenance task generation",
        prompts=SAMPLE_PROMPTS[:5],  # Use first 5 prompts for demo
        test_image=SAMPLE_IMAGE,
        provider_configs=[
            {
                "provider_name": "gemini",
                "api_key": "demo_key_1",
                "model": "gemini-1.5-flash"
            },
            # In real usage, you could test multiple providers:
            # {
            #     "provider_name": "gemini",
            #     "api_key": os.getenv("GEMINI_API_KEY"),
            #     "model": "gemini-1.5-pro"
            # }
        ],
        iterations=2,  # Test each prompt twice for consistency
        parallel=True  # Run tests in parallel for speed
    )
    
    try:
        print(f"Running test suite: {test_suite.name}")
        print(f"Testing {len(test_suite.prompts)} prompts with {len(test_suite.provider_configs)} providers")
        print(f"Total tests: {len(test_suite.prompts) * len(test_suite.provider_configs) * test_suite.iterations}")
        print("Running tests...\n")
        
        # Run the test suite
        analysis = await tester.run_test_suite(test_suite)
        
        # Display results
        print("=== Test Suite Results ===")
        print(f"Suite: {analysis.suite_name}")
        print(f"Total tests: {analysis.total_tests}")
        print(f"Successful tests: {analysis.successful_tests}")
        print(f"Success rate: {analysis.successful_tests/analysis.total_tests*100:.1f}%")
        print(f"Average response time: {analysis.average_response_time:.3f}s")
        print(f"Total tokens used: {analysis.total_tokens_used}")
        print(f"Total cost estimate: ${analysis.total_cost_estimate:.4f}")
        print(f"Average tasks per prompt: {analysis.average_tasks_per_prompt:.1f}")
        print(f"Consistency score: {analysis.consistency_score:.3f}")
        print(f"Best performing prompt: '{analysis.best_prompt[:50]}...' " if analysis.best_prompt else "None")
        print(f"Worst performing prompt: '{analysis.worst_prompt[:50]}...' " if analysis.worst_prompt else "None")
        print("\n")
        
    except Exception as e:
        print(f"Error in test suite: {e}")
        print("Note: This demo uses mock providers. For real testing, set up actual API keys.\n")


async def demo_prompt_comparison():
    """Demonstrate comparing different prompt strategies."""
    print("=== Prompt Comparison Demo ===\n")
    
    # Create some mock results for comparison
    from app.ai.prompt_testing import PromptTestResult
    import time
    
    # Results for short, direct prompts
    short_prompt_results = [
        PromptTestResult(
            test_id="short_1", prompt="List maintenance tasks", provider_name="gemini",
            model="gemini-1.5-flash", success=True, response_time=0.3,
            tokens_used=50, cost_estimate=0.005, tasks_generated=2
        ),
        PromptTestResult(
            test_id="short_2", prompt="Find issues", provider_name="gemini",
            model="gemini-1.5-flash", success=True, response_time=0.25,
            tokens_used=45, cost_estimate=0.0045, tasks_generated=1
        ),
        PromptTestResult(
            test_id="short_3", prompt="Quick analysis", provider_name="gemini",
            model="gemini-1.5-flash", success=False, response_time=0.8,
            error_message="Prompt too vague"
        )
    ]
    
    # Results for detailed, structured prompts
    detailed_prompt_results = [
        PromptTestResult(
            test_id="detailed_1", prompt="Comprehensive analysis with structure...", provider_name="gemini",
            model="gemini-1.5-flash", success=True, response_time=0.8,
            tokens_used=200, cost_estimate=0.02, tasks_generated=5
        ),
        PromptTestResult(
            test_id="detailed_2", prompt="Professional inspector analysis...", provider_name="gemini",
            model="gemini-1.5-flash", success=True, response_time=0.9,
            tokens_used=220, cost_estimate=0.022, tasks_generated=6
        ),
        PromptTestResult(
            test_id="detailed_3", prompt="Detailed maintenance review...", provider_name="gemini",
            model="gemini-1.5-flash", success=True, response_time=0.75,
            tokens_used=180, cost_estimate=0.018, tasks_generated=4
        )
    ]
    
    # Compare the two strategies
    comparison = PromptComparator.compare_prompts(short_prompt_results, detailed_prompt_results)
    
    print("Comparing Short vs Detailed Prompts:")
    print("\nShort Prompts (Group A):")
    print(f"  Success rate: {comparison['group_a']['success_rate']*100:.1f}%")
    print(f"  Average response time: {comparison['group_a']['avg_response_time']:.3f}s")
    print(f"  Average tasks generated: {comparison['group_a']['avg_tasks']:.1f}")
    print(f"  Total cost: ${comparison['group_a']['total_cost']:.4f}")
    
    print("\nDetailed Prompts (Group B):")
    print(f"  Success rate: {comparison['group_b']['success_rate']*100:.1f}%")
    print(f"  Average response time: {comparison['group_b']['avg_response_time']:.3f}s")
    print(f"  Average tasks generated: {comparison['group_b']['avg_tasks']:.1f}")
    print(f"  Total cost: ${comparison['group_b']['total_cost']:.4f}")
    
    print("\nComparison (A vs B):")
    print(f"  Success rate difference: {comparison['comparison']['success_rate_diff']*100:+.1f}%")
    print(f"  Response time difference: {comparison['comparison']['response_time_diff']:+.3f}s")
    print(f"  Task count difference: {comparison['comparison']['task_count_diff']:+.1f}")
    print(f"  Cost difference: ${comparison['comparison']['cost_diff']:+.4f}")
    print(f"  Better performing group: {comparison['comparison']['better_group']}")
    print("\n")


async def demo_optimal_prompt_analysis():
    """Demonstrate finding optimal prompts from test results."""
    print("=== Optimal Prompt Analysis Demo ===\n")
    
    # Create mock results for different prompt types
    from app.ai.prompt_testing import PromptTestResult
    
    all_results = [
        # Excellent prompt - high success, good efficiency, low cost
        PromptTestResult(
            test_id="1", prompt="Professional home inspector analysis with safety focus",
            provider_name="gemini", model="gemini-1.5-flash", success=True,
            response_time=0.6, tokens_used=150, cost_estimate=0.015, tasks_generated=4
        ),
        PromptTestResult(
            test_id="2", prompt="Professional home inspector analysis with safety focus",
            provider_name="gemini", model="gemini-1.5-flash", success=True,
            response_time=0.5, tokens_used=140, cost_estimate=0.014, tasks_generated=5
        ),
        
        # Good prompt - consistent but slower
        PromptTestResult(
            test_id="3", prompt="Detailed maintenance analysis with structured output",
            provider_name="gemini", model="gemini-1.5-flash", success=True,
            response_time=1.0, tokens_used=200, cost_estimate=0.02, tasks_generated=3
        ),
        PromptTestResult(
            test_id="4", prompt="Detailed maintenance analysis with structured output",
            provider_name="gemini", model="gemini-1.5-flash", success=True,
            response_time=1.1, tokens_used=210, cost_estimate=0.021, tasks_generated=3
        ),
        
        # Unreliable prompt - mixed results
        PromptTestResult(
            test_id="5", prompt="Quick scan for problems",
            provider_name="gemini", model="gemini-1.5-flash", success=True,
            response_time=0.3, tokens_used=80, cost_estimate=0.008, tasks_generated=1
        ),
        PromptTestResult(
            test_id="6", prompt="Quick scan for problems",
            provider_name="gemini", model="gemini-1.5-flash", success=False,
            response_time=0.4, error_message="Insufficient detail"
        ),
        
        # Poor prompt - expensive and slow
        PromptTestResult(
            test_id="7", prompt="Extremely comprehensive analysis of every possible issue...",
            provider_name="gemini", model="gemini-1.5-flash", success=True,
            response_time=2.0, tokens_used=500, cost_estimate=0.05, tasks_generated=2
        )
    ]
    
    # Find optimal prompts
    optimal_prompts = PromptComparator.find_optimal_prompts(all_results, top_n=3)
    
    print("Top 3 Optimal Prompts (by composite score):\n")
    
    for i, prompt_data in enumerate(optimal_prompts, 1):
        print(f"{i}. '{prompt_data['prompt'][:60]}...'")
        print(f"   Success rate: {prompt_data['success_rate']*100:.1f}%")
        print(f"   Total tests: {prompt_data['total_tests']}")
        print(f"   Avg response time: {prompt_data['avg_response_time']:.3f}s")
        print(f"   Avg tasks per execution: {prompt_data['avg_tasks_per_execution']:.1f}")
        print(f"   Cost per task: ${prompt_data['cost_per_task']:.4f}")
        print(f"   Composite score: {prompt_data['composite_score']:.2f}")
        print()


async def demo_results_export():
    """Demonstrate exporting test results in different formats."""
    print("=== Results Export Demo ===\n")
    
    tester = PromptTester()
    
    # Add some mock results
    from app.ai.prompt_testing import PromptTestResult
    
    mock_results = [
        PromptTestResult(
            test_id="export_1", prompt="Test prompt 1", provider_name="gemini",
            model="gemini-1.5-flash", success=True, response_time=0.5,
            tokens_used=100, cost_estimate=0.01, tasks_generated=3
        ),
        PromptTestResult(
            test_id="export_2", prompt="Test prompt 2", provider_name="gemini",
            model="gemini-1.5-flash", success=False, response_time=1.0,
            error_message="Test error"
        )
    ]
    
    tester.results.extend(mock_results)
    
    # Export as JSON
    print("Export as JSON:")
    json_export = tester.export_results("json")
    print(json_export[:200] + "..." if len(json_export) > 200 else json_export)
    print("\n")
    
    # Export as summary
    print("Export as Summary:")
    summary_export = tester.export_results("summary")
    print(summary_export)
    print("\n")


async def main():
    """Run all demo functions."""
    print("Prompt Testing Framework Demo")
    print("=" * 50)
    print()
    
    demos = [
        demo_basic_prompt_testing,
        demo_comprehensive_test_suite,
        demo_prompt_comparison,
        demo_optimal_prompt_analysis,
        demo_results_export
    ]
    
    for demo in demos:
        try:
            await demo()
        except Exception as e:
            print(f"Demo failed: {e}\n")
        
        # Add a pause between demos
        await asyncio.sleep(0.1)
    
    print("Demo completed! 🎉")
    print("\nTo use this framework in production:")
    print("1. Set up real AI provider API keys (GEMINI_API_KEY, etc.)")
    print("2. Load actual test images instead of mock data")
    print("3. Design prompts specific to your use case")
    print("4. Run comprehensive test suites to optimize performance")
    print("5. Use the analysis tools to continuously improve your prompts")


if __name__ == "__main__":
    asyncio.run(main())