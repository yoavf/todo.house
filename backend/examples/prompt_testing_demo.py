#!/usr/bin/env python3
"""
Prompt Testing and Development CLI Tool

This script provides a command-line interface for testing and developing AI prompts
for image analysis. It includes functionality for:

- Testing individual prompts against test scenarios
- Comparing multiple prompt variations
- Running batch tests across all scenarios
- Generating test reports and exporting results

Usage:
    python prompt_testing_demo.py test-single --prompt "Your prompt here" \
           --scenario bathroom_sink
    python prompt_testing_demo.py compare-prompts --scenario bathroom_sink
    python prompt_testing_demo.py batch-test --prompt "Your prompt here"
    python prompt_testing_demo.py list-scenarios
    python prompt_testing_demo.py generate-report
"""

import asyncio
import argparse
import json
import sys
import os
from pathlib import Path
from typing import List, Optional

# Add the parent directory to the path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.providers import AIProviderFactory
from app.ai.prompt_testing import PromptTester, PromptLibrary, TestScenario
from app.ai.test_images import TestImageLibrary
from app.config import config
from app.logging_config import setup_logging


class PromptTestingCLI:
    """Command-line interface for prompt testing."""
    
    def __init__(self):
        """Initialize the CLI tool."""
        self.test_library = TestImageLibrary()
        self.prompt_library = PromptLibrary()
        self.tester: Optional[PromptTester] = None
        
        # Setup logging
        setup_logging(log_level="INFO", enable_json=False)
    
    def _get_ai_provider(self):
        """Get AI provider instance."""
        if self.tester is None:
            try:
                # Try to create Gemini provider
                provider = AIProviderFactory.create_provider(
                    "gemini",
                    api_key=config.ai.gemini_api_key,
                    model=config.ai.gemini_model
                )
                self.tester = PromptTester(provider)
                print(f"✓ Connected to {provider.get_provider_name()} provider")
            except Exception as e:
                print(f"✗ Failed to initialize AI provider: {e}")
                print("Make sure GEMINI_API_KEY is set in your environment")
                sys.exit(1)
        
        return self.tester
    
    def _validate_image_path(self, file_path: str) -> str:
        """
        Validate and sanitize image file path for security.
        
        Args:
            file_path: Path to image file
            
        Returns:
            Validated absolute path
            
        Raises:
            ValueError: If path is invalid or unsafe
        """
        # Convert to Path object for safer handling
        path = Path(file_path)
        
        # Check if file exists
        if not path.exists():
            raise ValueError(f"File does not exist: {file_path}")
        
        # Ensure it's a file, not a directory
        if not path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")
        
        # Get absolute path to prevent path traversal attacks
        abs_path = path.resolve()
        
        # Validate file extension (only allow common image formats)
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
        if abs_path.suffix.lower() not in allowed_extensions:
            raise ValueError(
                f"Invalid file extension. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (prevent DoS with huge files) - max 50MB
        file_size = abs_path.stat().st_size
        max_size = 50 * 1024 * 1024  # 50MB
        if file_size > max_size:
            raise ValueError(
                f"File too large ({file_size} bytes). Maximum size: {max_size} bytes"
            )
        
        # Ensure file is readable
        if not os.access(abs_path, os.R_OK):
            raise ValueError(f"File is not readable: {abs_path}")
        
        return str(abs_path)
    
    async def test_single_prompt(
        self, prompt: str, scenario: str, custom_image: Optional[str] = None
    ):
        """Test a single prompt against a scenario."""
        print(f"\n🧪 Testing prompt against scenario: {scenario}")
        print(f"Prompt length: {len(prompt)} characters")
        print("-" * 60)
        
        tester = self._get_ai_provider()
        
        try:
            scenario_enum = TestScenario(scenario)
        except ValueError:
            print(f"✗ Invalid scenario: {scenario}")
            print(f"Available scenarios: {', '.join([s.value for s in TestScenario])}")
            return
        
        # Load custom image if provided
        image_data = None
        if custom_image:
            try:
                # Validate and sanitize the file path
                validated_path = self._validate_image_path(custom_image)
                with open(validated_path, 'rb') as f:
                    image_data = f.read()
                print(f"✓ Loaded custom image: {validated_path}")
            except ValueError as e:
                print(f"✗ Security error: {e}")
                return
            except Exception as e:
                print(f"✗ Failed to load custom image: {e}")
                return
        
        # Run test
        try:
            result = await tester.test_single_prompt(prompt, scenario_enum, image_data)
            
            # Display results
            print("\n📊 Test Results:")
            status_msg = (
                '✓ SUCCESS' if result.result_status.value == 'success' 
                else '✗ ' + result.result_status.value.upper()
            )
            print(f"Status: {status_msg}")
            print(f"Processing time: {result.processing_time:.2f}s")
            print(f"Tasks generated: {result.tasks_generated}")
            print(f"Accuracy score: {result.accuracy_score:.3f}")
            
            if result.confidence_score:
                print(f"AI confidence: {result.confidence_score:.3f}")
            
            if result.error_message:
                print(f"Error: {result.error_message}")
            
            # Show task comparison
            if result.expected_tasks:
                print("\n📋 Task Analysis:")
                print(f"Expected tasks: {len(result.expected_tasks)}")
                print(f"Matched tasks: {len(result.matched_tasks)}")
                print(f"Missing tasks: {len(result.missing_tasks)}")
                print(f"Unexpected tasks: {len(result.unexpected_tasks)}")
                
                if result.matched_tasks:
                    print("\n✓ Matched tasks:")
                    for task in result.matched_tasks:
                        print(f"  • {task}")
                
                if result.missing_tasks:
                    print("\n⚠ Missing tasks:")
                    for task in result.missing_tasks:
                        print(f"  • {task}")
                
                if result.unexpected_tasks:
                    print("\n➕ Unexpected tasks:")
                    for task in result.unexpected_tasks:
                        print(f"  • {task}")
            
            # Show generated tasks
            if result.ai_response.get("tasks"):
                print("\n🤖 Generated Tasks:")
                for i, task in enumerate(result.ai_response["tasks"], 1):
                    print(f"{i}. {task.get('title', 'Untitled')}")
                    print(f"   Priority: {task.get('priority', 'unknown')}")
                    print(f"   Category: {task.get('category', 'unknown')}")
                    print(f"   Description: {task.get('description', 'No description')}")
                    print()
            
            # Show analysis summary
            if result.ai_response.get("analysis_summary"):
                print("🔍 Analysis Summary:")
                print(f"{result.ai_response['analysis_summary']}")
            
        except Exception as e:
            print(f"✗ Test failed: {e}")
    
    async def compare_prompts(self, scenario: str, custom_prompts: Optional[List[str]] = None):
        """Compare multiple prompt variations."""
        print(f"\n🔄 Comparing prompts for scenario: {scenario}")
        print("-" * 60)
        
        tester = self._get_ai_provider()
        
        try:
            scenario_enum = TestScenario(scenario)
        except ValueError:
            print(f"✗ Invalid scenario: {scenario}")
            return
        
        # Get prompts to test
        if custom_prompts:
            prompts = custom_prompts
            prompt_names = [f"Custom Prompt {i+1}" for i in range(len(prompts))]
        else:
            prompt_data = self.prompt_library.get_all_test_prompts()
            prompts = [prompt for _, prompt in prompt_data]
            prompt_names = [name for name, _ in prompt_data]
        
        print(f"Testing {len(prompts)} prompt variations...")
        
        try:
            comparison = await tester.test_prompt_variations(prompts, scenario_enum)
            
            # Display results
            print("\n📊 Comparison Results:")
            print(f"Best prompt: {prompt_names[comparison.best_prompt_index]} (Accuracy: {comparison.best_accuracy:.3f})")
            print(f"Average accuracy: {comparison.average_accuracy:.3f}")
            print(f"Average processing time: {comparison.average_processing_time:.2f}s")
            
            print("\n📈 Individual Results:")
            for i, result in enumerate(comparison.results):
                status_icon = "✓" if result.result_status.value == "success" else "✗"
                print(f"{i+1}. {prompt_names[i]}: {status_icon} {result.accuracy_score:.3f} accuracy, {result.processing_time:.2f}s")
                if result.error_message:
                    print(f"   Error: {result.error_message}")
            
            # Show best prompt details
            best_result = comparison.results[comparison.best_prompt_index]
            print("\n🏆 Best Prompt Details:")
            print(f"Tasks generated: {best_result.tasks_generated}")
            print(f"Matched: {len(best_result.matched_tasks)}, Missing: {len(best_result.missing_tasks)}, Unexpected: {len(best_result.unexpected_tasks)}")
            
        except Exception as e:
            print(f"✗ Comparison failed: {e}")
    
    async def batch_test(self, prompt: str, scenarios: Optional[List[str]] = None):
        """Run batch test across multiple scenarios."""
        print("\n🚀 Running batch test")
        print(f"Prompt length: {len(prompt)} characters")
        print("-" * 60)
        
        tester = self._get_ai_provider()
        
        # Get scenarios to test
        if scenarios:
            try:
                scenario_enums = [TestScenario(s) for s in scenarios]
            except ValueError as e:
                print(f"✗ Invalid scenario in list: {e}")
                return
        else:
            scenario_enums = self.test_library.get_all_scenarios()
        
        print(f"Testing against {len(scenario_enums)} scenarios...")
        
        try:
            results = await tester.test_all_scenarios(prompt, scenario_enums)
            
            # Generate report
            report = tester.generate_test_report(results)
            
            # Display summary
            print("\n📊 Batch Test Results:")
            print(f"Total tests: {report['summary']['total_tests']}")
            print(f"Successful: {report['summary']['successful_tests']}")
            print(f"Failed: {report['summary']['failed_tests']}")
            print(f"Success rate: {report['summary']['success_rate']:.1%}")
            print(f"Average accuracy: {report['summary']['average_accuracy']:.3f}")
            print(f"Average processing time: {report['summary']['average_processing_time']:.2f}s")
            print(f"Total tasks generated: {report['summary']['total_tasks_generated']}")
            
            # Show scenario breakdown
            print("\n📋 Scenario Breakdown:")
            for scenario, stats in report['scenario_breakdown'].items():
                success_rate = stats['successful'] / stats['tests'] if stats['tests'] > 0 else 0
                print(f"{scenario}: {success_rate:.1%} success, {stats['avg_accuracy']:.3f} accuracy, {stats['avg_tasks']:.1f} tasks")
            
            # Show best and worst performing scenarios
            scenario_accuracies = [(s, stats['avg_accuracy']) for s, stats in report['scenario_breakdown'].items()]
            scenario_accuracies.sort(key=lambda x: x[1], reverse=True)
            
            print("\n🏆 Best performing scenarios:")
            for scenario, accuracy in scenario_accuracies[:3]:
                print(f"  {scenario}: {accuracy:.3f}")
            
            print("\n⚠ Challenging scenarios:")
            for scenario, accuracy in scenario_accuracies[-3:]:
                print(f"  {scenario}: {accuracy:.3f}")
            
        except Exception as e:
            print(f"✗ Batch test failed: {e}")
    
    def list_scenarios(self):
        """List all available test scenarios."""
        print("\n📋 Available Test Scenarios:")
        print("-" * 60)
        
        summary = self.test_library.get_scenario_summary()
        
        for scenario, info in summary.items():
            print(f"\n{scenario}:")
            print(f"  Description: {info['description']}")
            print(f"  Room: {info['room_type'] or 'Various'}")
            print(f"  Difficulty: {info['difficulty']}")
            print(f"  Expected tasks: {info['expected_task_count']}")
            print(f"  Categories: {', '.join(info['expected_categories'])}")
            if info['notes']:
                print(f"  Notes: {info['notes']}")
    
    def list_prompts(self):
        """List all available test prompts."""
        print("\n📝 Available Test Prompts:")
        print("-" * 60)
        
        prompts = self.prompt_library.get_all_test_prompts()
        
        for i, (name, prompt) in enumerate(prompts, 1):
            print(f"\n{i}. {name}")
            print(f"   Length: {len(prompt)} characters")
            # Show first few lines
            lines = prompt.split('\n')[:3]
            for line in lines:
                if line.strip():
                    print(f"   {line[:80]}{'...' if len(line) > 80 else ''}")
                    break
    
    async def generate_report(self, export_format: str = "json"):
        """Generate comprehensive test report."""
        tester = self._get_ai_provider()
        
        history = tester.get_test_history()
        if not history:
            print("No test history available. Run some tests first.")
            return
        
        print(f"\n📊 Generating test report from {len(history)} tests...")
        
        report = tester.generate_test_report(history)
        
        if export_format.lower() == "json":
            filename = f"prompt_test_report_{report['generated_at'][:10]}.json"
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            print(f"✓ Report saved to {filename}")
        
        # Display summary
        print("\n📈 Test History Summary:")
        print(f"Total tests: {report['summary']['total_tests']}")
        print(f"Success rate: {report['summary']['success_rate']:.1%}")
        print(f"Average accuracy: {report['summary']['average_accuracy']:.3f}")
        print(f"Best accuracy: {report['summary']['max_accuracy']:.3f}")
        print(f"Worst accuracy: {report['summary']['min_accuracy']:.3f}")
    
    def create_custom_image(self, description: str, output_path: str):
        """Create a custom test image."""
        print(f"Creating custom test image: {description}")
        
        image_data = self.test_library.create_custom_test_image(description)
        
        with open(output_path, 'wb') as f:
            f.write(image_data)
        
        print(f"✓ Custom test image saved to {output_path}")


async def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Prompt Testing and Development Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s test-single --prompt "Analyze this image for maintenance tasks" --scenario bathroom_sink
  %(prog)s compare-prompts --scenario kitchen_appliances
  %(prog)s batch-test --prompt "Your custom prompt here"
  %(prog)s list-scenarios
  %(prog)s generate-report --format json
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Test single prompt
    test_parser = subparsers.add_parser('test-single', help='Test a single prompt')
    test_parser.add_argument('--prompt', required=True, help='Prompt to test')
    test_parser.add_argument('--scenario', required=True, help='Test scenario')
    test_parser.add_argument('--image', help='Custom image file path')
    
    # Compare prompts
    compare_parser = subparsers.add_parser('compare-prompts', help='Compare multiple prompts')
    compare_parser.add_argument('--scenario', required=True, help='Test scenario')
    compare_parser.add_argument('--prompts', nargs='+', help='Custom prompts to compare')
    
    # Batch test
    batch_parser = subparsers.add_parser('batch-test', help='Run batch test across scenarios')
    batch_parser.add_argument('--prompt', required=True, help='Prompt to test')
    batch_parser.add_argument('--scenarios', nargs='+', help='Specific scenarios to test')
    
    # List scenarios
    subparsers.add_parser('list-scenarios', help='List available test scenarios')
    
    # List prompts
    subparsers.add_parser('list-prompts', help='List available test prompts')
    
    # Generate report
    report_parser = subparsers.add_parser('generate-report', help='Generate test report')
    report_parser.add_argument('--format', choices=['json', 'csv'], default='json', help='Export format')
    
    # Create custom image
    image_parser = subparsers.add_parser('create-image', help='Create custom test image')
    image_parser.add_argument('--description', required=True, help='Image description')
    image_parser.add_argument('--output', required=True, help='Output file path')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = PromptTestingCLI()
    
    try:
        if args.command == 'test-single':
            await cli.test_single_prompt(args.prompt, args.scenario, args.image)
        
        elif args.command == 'compare-prompts':
            await cli.compare_prompts(args.scenario, args.prompts)
        
        elif args.command == 'batch-test':
            await cli.batch_test(args.prompt, args.scenarios)
        
        elif args.command == 'list-scenarios':
            cli.list_scenarios()
        
        elif args.command == 'list-prompts':
            cli.list_prompts()
        
        elif args.command == 'generate-report':
            await cli.generate_report(args.format)
        
        elif args.command == 'create-image':
            cli.create_custom_image(args.description, args.output)
    
    except KeyboardInterrupt:
        print("\n\n⚠ Operation cancelled by user")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())