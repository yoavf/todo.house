#!/usr/bin/env python3
"""
Prompt Testing and Development Example

This example demonstrates how to use the prompt testing tools for developing
and evaluating AI prompts for image analysis tasks.

The example shows:
1. Testing individual prompts against test scenarios
2. Comparing multiple prompt variations
3. Running batch tests across scenarios
4. Generating evaluation reports
5. Using the test image library

Run this example with:
    python examples/prompt_testing_example.py
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.prompt_testing import PromptTester, PromptLibrary, TestResult
from app.ai.test_images import TestImageLibrary, TestScenario
from app.ai.providers import AIProviderFactory
from app.config import config
from app.logging_config import setup_logging


async def demonstrate_single_prompt_testing():
    """Demonstrate testing a single prompt against a test scenario."""
    print("\n" + "=" * 60)
    print("1. SINGLE PROMPT TESTING")
    print("=" * 60)

    # Create test library and get a test scenario
    test_library = TestImageLibrary()
    scenario = TestScenario.BATHROOM_SINK

    print(f"Testing scenario: {scenario.value}")

    # Get scenario metadata
    metadata = test_library.get_test_metadata(scenario)
    print(f"Description: {metadata.description}")
    print(f"Expected tasks: {len(metadata.expected_tasks)}")
    print(f"Difficulty: {metadata.difficulty_level}")

    # Create a simple test prompt
    test_prompt = """
    Analyze this bathroom image for maintenance tasks.
    
    Look for:
    - Cleaning needs (soap scum, limescale, stains)
    - Repair issues (leaks, damage, wear)
    - Safety concerns
    
    Return JSON with tasks array containing title, description, priority, and category.
    """

    print(f"\nPrompt length: {len(test_prompt)} characters")

    # For demonstration, we'll use a mock provider since we may not have API keys
    try:
        # Try to create real provider
        provider = AIProviderFactory.create_provider(
            "gemini", api_key=config.ai.gemini_api_key, model=config.ai.gemini_model
        )
        print("✓ Using real Gemini provider")
    except Exception as e:
        print(f"⚠ Could not initialize real provider ({e}), using mock for demo")
        # Create a mock provider for demonstration
        from tests.unit.test_prompt_testing import MockAIProvider

        provider = MockAIProvider(
            {
                "tasks": [
                    {
                        "title": "Clean limescale from faucet",
                        "description": "Remove mineral buildup from faucet surfaces using descaling solution",
                        "priority": "medium",
                        "category": "cleaning",
                        "reasoning": "Visible limescale buildup affects water flow and appearance",
                    },
                    {
                        "title": "Remove soap scum from sink",
                        "description": "Clean soap residue from sink basin and surrounding areas",
                        "priority": "low",
                        "category": "cleaning",
                        "reasoning": "Soap scum buildup visible in basin area",
                    },
                ],
                "analysis_summary": "Bathroom sink requires routine cleaning maintenance to remove limescale and soap buildup",
            }
        )

    # Create tester and run test
    tester = PromptTester(provider)

    print("\nRunning prompt test...")
    result = await tester.test_single_prompt(test_prompt, scenario)

    # Display results
    print("\n📊 Test Results:")
    print(
        f"Status: {'✓ SUCCESS' if result.result_status == TestResult.SUCCESS else '✗ ' + result.result_status.value.upper()}"
    )
    print(f"Processing time: {result.processing_time:.3f}s")
    print(f"Tasks generated: {result.tasks_generated}")
    print(f"Accuracy score: {result.accuracy_score:.3f}")

    if result.confidence_score:
        print(f"AI confidence: {result.confidence_score:.3f}")

    # Show task evaluation
    print("\n📋 Task Evaluation:")
    print(f"Expected: {len(result.expected_tasks)} tasks")
    print(f"Generated: {result.tasks_generated} tasks")
    print(f"Matched: {len(result.matched_tasks)} tasks")
    print(f"Missing: {len(result.missing_tasks)} tasks")
    print(f"Unexpected: {len(result.unexpected_tasks)} tasks")

    if result.matched_tasks:
        print("\n✓ Successfully identified:")
        for task in result.matched_tasks:
            print(f"  • {task}")

    if result.missing_tasks:
        print("\n⚠ Missed tasks:")
        for task in result.missing_tasks:
            print(f"  • {task}")

    return tester


async def demonstrate_prompt_comparison(tester):
    """Demonstrate comparing multiple prompt variations."""
    print("\n" + "=" * 60)
    print("2. PROMPT COMPARISON")
    print("=" * 60)

    # Get different prompt variations from the library
    prompt_library = PromptLibrary()
    prompt_variations = [
        ("Base Prompt", prompt_library.get_base_prompt()),
        ("Detailed Prompt", prompt_library.get_detailed_prompt()),
        ("Concise Prompt", prompt_library.get_concise_prompt()),
        ("Safety Focused", prompt_library.get_safety_focused_prompt()),
    ]

    print(f"Comparing {len(prompt_variations)} prompt variations:")
    for i, (name, prompt) in enumerate(prompt_variations, 1):
        print(f"{i}. {name} ({len(prompt)} chars)")

    # Extract just the prompts for testing
    prompts = [prompt for _, prompt in prompt_variations]
    prompt_names = [name for name, _ in prompt_variations]

    print(f"\nTesting against scenario: {TestScenario.KITCHEN_APPLIANCES.value}")
    print("Running comparison...")

    comparison = await tester.test_prompt_variations(
        prompts, TestScenario.KITCHEN_APPLIANCES
    )

    # Display comparison results
    print("\n📊 Comparison Results:")
    print(f"Best prompt: {prompt_names[comparison.best_prompt_index]}")
    print(f"Best accuracy: {comparison.best_accuracy:.3f}")
    print(f"Average accuracy: {comparison.average_accuracy:.3f}")
    print(f"Average processing time: {comparison.average_processing_time:.3f}s")

    print("\n📈 Individual Results:")
    for i, (result, name) in enumerate(zip(comparison.results, prompt_names)):
        status_icon = "✓" if result.result_status == TestResult.SUCCESS else "✗"
        print(f"{i + 1}. {name}:")
        print(f"   {status_icon} Accuracy: {result.accuracy_score:.3f}")
        print(f"   Processing time: {result.processing_time:.3f}s")
        print(f"   Tasks generated: {result.tasks_generated}")
        if result.error_message:
            print(f"   Error: {result.error_message}")

    return comparison


async def demonstrate_batch_testing(tester):
    """Demonstrate batch testing across multiple scenarios."""
    print("\n" + "=" * 60)
    print("3. BATCH TESTING")
    print("=" * 60)

    # Select a subset of scenarios for demonstration
    test_scenarios = [
        TestScenario.BATHROOM_SINK,
        TestScenario.KITCHEN_APPLIANCES,
        TestScenario.LAWN_MAINTENANCE,
    ]

    print(f"Running batch test across {len(test_scenarios)} scenarios:")
    for scenario in test_scenarios:
        print(f"  • {scenario.value}")

    # Use the base prompt for batch testing
    prompt_library = PromptLibrary()
    test_prompt = prompt_library.get_base_prompt()

    print(f"\nUsing base prompt ({len(test_prompt)} characters)")
    print("Running batch test...")

    results = await tester.test_all_scenarios(test_prompt, test_scenarios)

    # Generate comprehensive report
    report = tester.generate_test_report(results)

    # Display batch results
    print("\n📊 Batch Test Summary:")
    summary = report["summary"]
    print(f"Total tests: {summary['total_tests']}")
    print(f"Successful: {summary['successful_tests']}")
    print(f"Failed: {summary['failed_tests']}")
    print(f"Success rate: {summary['success_rate']:.1%}")
    print(f"Average accuracy: {summary['average_accuracy']:.3f}")
    print(f"Average processing time: {summary['average_processing_time']:.3f}s")
    print(f"Total tasks generated: {summary['total_tasks_generated']}")

    # Show scenario breakdown
    print("\n📋 Scenario Performance:")
    for scenario_name, stats in report["scenario_breakdown"].items():
        success_rate = stats["successful"] / stats["tests"] if stats["tests"] > 0 else 0
        print(f"{scenario_name}:")
        print(f"  Success rate: {success_rate:.1%}")
        print(f"  Avg accuracy: {stats['avg_accuracy']:.3f}")
        print(f"  Avg tasks: {stats['avg_tasks']:.1f}")

    return results, report


def demonstrate_test_image_library():
    """Demonstrate the test image library functionality."""
    print("\n" + "=" * 60)
    print("4. TEST IMAGE LIBRARY")
    print("=" * 60)

    library = TestImageLibrary()

    # Show all available scenarios
    scenarios = library.get_all_scenarios()
    print(f"Available test scenarios: {len(scenarios)}")

    # Group by difficulty
    difficulties = ["easy", "medium", "hard"]
    for difficulty in difficulties:
        scenarios_by_diff = library.get_scenarios_by_difficulty(difficulty)
        print(f"  {difficulty.capitalize()}: {len(scenarios_by_diff)} scenarios")

    # Group by room type
    room_types = ["bathroom", "kitchen", "outdoor", "garage", "utility", "interior"]
    print("\nScenarios by room type:")
    for room_type in room_types:
        scenarios_by_room = library.get_scenarios_by_room(room_type)
        if scenarios_by_room:
            print(f"  {room_type.capitalize()}: {len(scenarios_by_room)} scenarios")

    # Demonstrate image generation
    print("\n🖼️ Test Image Generation:")
    test_scenario = TestScenario.BATHROOM_SINK

    # Get metadata
    metadata = library.get_test_metadata(test_scenario)
    print(f"Scenario: {test_scenario.value}")
    print(f"Description: {metadata.description}")
    print(f"Expected tasks: {metadata.expected_tasks}")
    print(f"Room type: {metadata.room_type}")
    print(f"Difficulty: {metadata.difficulty_level}")

    # Generate test image
    image_data = library.get_test_image(test_scenario)
    print(f"Generated image: {len(image_data)} bytes")

    # Create custom test image
    custom_description = (
        "Custom maintenance scenario: Dirty garage with oil stains and cluttered tools"
    )
    custom_image = library.create_custom_test_image(custom_description)
    print(f"Custom image: {len(custom_image)} bytes")

    # Show scenario summary
    summary = library.get_scenario_summary()
    print(f"\n📋 Scenario Summary ({len(summary)} total):")
    for scenario_name, info in list(summary.items())[:3]:  # Show first 3
        print(f"{scenario_name}:")
        print(f"  Description: {info['description'][:60]}...")
        print(f"  Difficulty: {info['difficulty']}")
        print(f"  Expected tasks: {info['expected_task_count']}")


def demonstrate_logging_and_evaluation():
    """Demonstrate logging and evaluation features."""
    print("\n" + "=" * 60)
    print("5. LOGGING AND EVALUATION")
    print("=" * 60)

    print("Logging features:")
    print("✓ Structured JSON logging for all test operations")
    print("✓ Request/response tracking with correlation IDs")
    print("✓ Performance metrics (processing time, accuracy scores)")
    print("✓ Error tracking and categorization")
    print("✓ Test history and comparison logging")

    print("\nEvaluation features:")
    print("✓ Fuzzy matching for task comparison")
    print("✓ Precision and recall calculation")
    print("✓ Confidence scoring based on response quality")
    print("✓ Comprehensive test reports with statistics")
    print("✓ Export capabilities (JSON, CSV)")

    print("\nPrompt development workflow:")
    print("1. Create test scenarios with expected outcomes")
    print("2. Test individual prompts against scenarios")
    print("3. Compare multiple prompt variations")
    print("4. Run batch tests across all scenarios")
    print("5. Analyze results and iterate on prompts")
    print("6. Export results for further analysis")


async def main():
    """Main demonstration function."""
    print("🧪 PROMPT TESTING AND DEVELOPMENT TOOLS DEMO")
    print("=" * 60)
    print("This demo shows how to use the prompt testing tools for")
    print("developing and evaluating AI prompts for image analysis.")

    # Setup logging for demo
    setup_logging(log_level="INFO", enable_json=False)

    try:
        # 1. Single prompt testing
        tester = await demonstrate_single_prompt_testing()

        # 2. Prompt comparison
        await demonstrate_prompt_comparison(tester)

        # 3. Batch testing
        results, report = await demonstrate_batch_testing(tester)

        # 4. Test image library
        demonstrate_test_image_library()

        # 5. Logging and evaluation
        demonstrate_logging_and_evaluation()

        # Final summary
        print("\n" + "=" * 60)
        print("DEMO COMPLETE")
        print("=" * 60)
        print("✓ Single prompt testing demonstrated")
        print("✓ Prompt comparison demonstrated")
        print("✓ Batch testing demonstrated")
        print("✓ Test image library demonstrated")
        print("✓ Logging and evaluation features shown")

        # Show test history
        history = tester.get_test_history()
        print(f"\nTotal tests run: {len(history)}")
        successful_tests = sum(
            1 for r in history if r.result_status == TestResult.SUCCESS
        )
        print(f"Successful tests: {successful_tests}")
        print(f"Success rate: {successful_tests / len(history):.1%}")

        print("\n🎯 Next Steps:")
        print("1. Use the CLI tool: python examples/prompt_testing_demo.py")
        print("2. Create custom test scenarios for your specific use cases")
        print("3. Develop and iterate on prompts using the testing framework")
        print("4. Export results for analysis and documentation")

    except KeyboardInterrupt:
        print("\n\n⚠ Demo interrupted by user")
    except Exception as e:
        print(f"\n✗ Demo failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
