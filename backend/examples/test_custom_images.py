#!/usr/bin/env python3
"""
Test multiple prompts against custom images in the examples directory.

This script allows you to:
- Test multiple prompt variations against your custom images
- Compare performance and accuracy of different prompts
- Generate detailed reports for each image/prompt combination
- Export results for further analysis

Usage:
    python test_custom_images.py --images ../examples/*.jpg --output results.json
    python test_custom_images.py --images ../examples/faucet-limescale.png --prompts custom
    python test_custom_images.py --compare --images ../examples/*.jpg
"""

import asyncio
import argparse
import json
import glob
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.providers import AIProviderFactory
from app.ai.prompt_testing import PromptLibrary
from app.config import config
from app.logging_config import setup_logging


@dataclass
class ImageTestResult:
    """Result of testing a prompt on a single image."""
    image_path: str
    image_name: str
    prompt_name: str
    prompt_text: str
    tasks_generated: int
    processing_time: float
    ai_response: Dict[str, Any]
    error: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class PromptComparisonResult:
    """Comparison of multiple prompts on the same image."""
    image_path: str
    image_name: str
    results: List[ImageTestResult]
    best_prompt: str
    most_tasks: int
    average_processing_time: float
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics."""
        return {
            "image": self.image_name,
            "prompts_tested": len(self.results),
            "best_prompt": self.best_prompt,
            "most_tasks_generated": self.most_tasks,
            "average_processing_time": round(self.average_processing_time, 2),
            "task_counts": {r.prompt_name: r.tasks_generated for r in self.results}
        }


class CustomImageTester:
    """Test prompts against custom images."""
    
    def __init__(self):
        """Initialize the tester."""
        setup_logging(log_level="INFO", enable_json=False)
        self.provider = None
        self.prompt_library = PromptLibrary()
        self.results: List[ImageTestResult] = []
        self.comparisons: List[PromptComparisonResult] = []
    
    def _init_provider(self):
        """Initialize AI provider."""
        if self.provider is None:
            try:
                self.provider = AIProviderFactory.create_provider(
                    "gemini",
                    api_key=config.ai.gemini_api_key,
                    model=config.ai.gemini_model
                )
                print(f"✓ Connected to {self.provider.get_provider_name()} provider")
            except Exception as e:
                print(f"✗ Failed to initialize AI provider: {e}")
                print("Make sure GEMINI_API_KEY is set in your environment")
                sys.exit(1)
        return self.provider
    
    def get_test_prompts(self, prompt_type: str = "all") -> List[Tuple[str, str]]:
        """Get prompts to test based on type."""
        if prompt_type == "all":
            return self.prompt_library.get_all_test_prompts()
        elif prompt_type == "custom":
            # Add your custom prompts here
            return [
                ("Quick Analysis", "Identify maintenance tasks in this image. Be concise."),
                ("Detailed Safety", "Analyze this image for safety hazards and maintenance needs. Focus on immediate risks."),
                ("Comprehensive", "Perform a thorough analysis of this image, identifying all visible maintenance tasks, repairs, and improvements."),
                ("Priority Focus", "Identify the top 3-5 most important maintenance tasks in this image, focusing on safety and urgency."),
            ]
        elif prompt_type == "base":
            return [("Base Prompt", self.prompt_library.get_base_prompt())]
        else:
            raise ValueError(f"Unknown prompt type: {prompt_type}")
    
    async def test_single_image(
        self, 
        image_path: str, 
        prompt_name: str, 
        prompt_text: str
    ) -> ImageTestResult:
        """Test a single prompt on a single image."""
        provider = self._init_provider()
        image_name = os.path.basename(image_path)
        
        print(f"  Testing '{prompt_name}' on {image_name}...")
        
        try:
            # Read image
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            # Analyze image
            start_time = time.time()
            response = await provider.analyze_image(image_data, prompt_text)
            processing_time = time.time() - start_time
            
            # Create result
            result = ImageTestResult(
                image_path=image_path,
                image_name=image_name,
                prompt_name=prompt_name,
                prompt_text=prompt_text,
                tasks_generated=len(response.get("tasks", [])),
                processing_time=processing_time,
                ai_response=response
            )
            
            print(f"    ✓ Generated {result.tasks_generated} tasks in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            print(f"    ✗ Error: {e}")
            return ImageTestResult(
                image_path=image_path,
                image_name=image_name,
                prompt_name=prompt_name,
                prompt_text=prompt_text,
                tasks_generated=0,
                processing_time=0.0,
                ai_response={},
                error=str(e)
            )
    
    async def test_multiple_prompts(
        self, 
        image_paths: List[str], 
        prompts: List[Tuple[str, str]]
    ) -> None:
        """Test multiple prompts on multiple images."""
        total_tests = len(image_paths) * len(prompts)
        print(f"\n🚀 Running {total_tests} tests ({len(prompts)} prompts × {len(image_paths)} images)")
        print("-" * 60)
        
        for image_path in image_paths:
            image_name = os.path.basename(image_path)
            print(f"\n📸 Testing image: {image_name}")
            
            image_results = []
            for prompt_name, prompt_text in prompts:
                result = await self.test_single_image(image_path, prompt_name, prompt_text)
                self.results.append(result)
                image_results.append(result)
            
            # Create comparison for this image
            best_prompt = max(image_results, key=lambda r: r.tasks_generated).prompt_name
            most_tasks = max(r.tasks_generated for r in image_results)
            avg_time = sum(r.processing_time for r in image_results) / len(image_results)
            
            comparison = PromptComparisonResult(
                image_path=image_path,
                image_name=image_name,
                results=image_results,
                best_prompt=best_prompt,
                most_tasks=most_tasks,
                average_processing_time=avg_time
            )
            self.comparisons.append(comparison)
    
    def display_results(self) -> None:
        """Display test results."""
        if not self.comparisons:
            print("No results to display")
            return
        
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        # Overall statistics
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r.error is None)
        total_tasks = sum(r.tasks_generated for r in self.results)
        avg_processing_time = sum(r.processing_time for r in self.results) / total_tests
        
        print("\n📈 Overall Statistics:")
        print(f"  Total tests run: {total_tests}")
        print(f"  Successful tests: {successful_tests}")
        print(f"  Total tasks generated: {total_tasks}")
        print(f"  Average processing time: {avg_processing_time:.2f}s")
        
        # Per-image results
        print("\n📸 Per-Image Results:")
        for comp in self.comparisons:
            summary = comp.get_summary()
            print(f"\n  {summary['image']}:")
            print(f"    Best prompt: {summary['best_prompt']} ({summary['most_tasks_generated']} tasks)")
            print("    Task counts by prompt:")
            for prompt, count in summary['task_counts'].items():
                print(f"      - {prompt}: {count} tasks")
        
        # Prompt performance across all images
        print("\n🏆 Prompt Performance (across all images):")
        prompt_stats = {}
        for result in self.results:
            if result.prompt_name not in prompt_stats:
                prompt_stats[result.prompt_name] = {
                    "total_tasks": 0,
                    "tests": 0,
                    "total_time": 0
                }
            stats = prompt_stats[result.prompt_name]
            stats["total_tasks"] += result.tasks_generated
            stats["tests"] += 1
            stats["total_time"] += result.processing_time
        
        for prompt_name, stats in sorted(prompt_stats.items(), 
                                       key=lambda x: x[1]["total_tasks"], 
                                       reverse=True):
            avg_tasks = stats["total_tasks"] / stats["tests"]
            avg_time = stats["total_time"] / stats["tests"]
            print(f"  {prompt_name}:")
            print(f"    Average tasks: {avg_tasks:.1f}")
            print(f"    Average time: {avg_time:.2f}s")
    
    def display_detailed_tasks(self, image_name: Optional[str] = None) -> None:
        """Display detailed task information."""
        print("\n" + "=" * 60)
        print("📋 DETAILED TASK ANALYSIS")
        print("=" * 60)
        
        results_to_show = self.results
        if image_name:
            results_to_show = [r for r in self.results if r.image_name == image_name]
        
        for result in results_to_show:
            if result.error or not result.ai_response.get("tasks"):
                continue
                
            print(f"\n📸 {result.image_name} - {result.prompt_name}")
            print(f"Generated {result.tasks_generated} tasks:")
            
            for i, task in enumerate(result.ai_response["tasks"], 1):
                print(f"\n  {i}. {task.get('title', 'Untitled')}")
                print(f"     Priority: {task.get('priority', 'unknown')}")
                print(f"     Category: {task.get('category', 'unknown')}")
                if task.get('description'):
                    desc = task['description']
                    # Wrap long descriptions
                    if len(desc) > 70:
                        desc = desc[:70] + "..."
                    print(f"     Description: {desc}")
    
    def export_results(self, output_path: str) -> None:
        """Export results to JSON file."""
        export_data = {
            "test_run": {
                "timestamp": datetime.now().isoformat(),
                "total_tests": len(self.results),
                "images_tested": len(self.comparisons),
                "prompts_tested": len(set(r.prompt_name for r in self.results))
            },
            "results": [asdict(r) for r in self.results],
            "comparisons": [
                {
                    **asdict(comp),
                    "summary": comp.get_summary()
                } for comp in self.comparisons
            ],
            "prompt_performance": self._calculate_prompt_performance()
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        print(f"\n✓ Results exported to {output_path}")
    
    def _calculate_prompt_performance(self) -> Dict[str, Any]:
        """Calculate performance metrics for each prompt."""
        prompt_stats = {}
        
        for result in self.results:
            prompt = result.prompt_name
            if prompt not in prompt_stats:
                prompt_stats[prompt] = {
                    "tests": 0,
                    "successful_tests": 0,
                    "total_tasks": 0,
                    "total_time": 0,
                    "min_tasks": float('inf'),
                    "max_tasks": 0
                }
            
            stats = prompt_stats[prompt]
            stats["tests"] += 1
            if result.error is None:
                stats["successful_tests"] += 1
                stats["total_tasks"] += result.tasks_generated
                stats["total_time"] += result.processing_time
                stats["min_tasks"] = min(stats["min_tasks"], result.tasks_generated)
                stats["max_tasks"] = max(stats["max_tasks"], result.tasks_generated)
        
        # Calculate averages
        for prompt, stats in prompt_stats.items():
            if stats["successful_tests"] > 0:
                stats["avg_tasks"] = stats["total_tasks"] / stats["successful_tests"]
                stats["avg_time"] = stats["total_time"] / stats["successful_tests"]
            else:
                stats["avg_tasks"] = 0
                stats["avg_time"] = 0
            
            # Clean up infinity values
            if stats["min_tasks"] == float('inf'):
                stats["min_tasks"] = 0
        
        return prompt_stats


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test multiple prompts against custom images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test all images with default prompts
  %(prog)s --images ../../examples/*.jpg
  
  # Test specific images with custom prompts
  %(prog)s --images ../../examples/faucet-limescale.png --prompts custom
  
  # Compare prompts and export results
  %(prog)s --compare --images ../../examples/*.jpg --output results.json
  
  # Show detailed task analysis
  %(prog)s --images ../../examples/*.jpg --detailed
        """
    )
    
    parser.add_argument(
        '--images', 
        nargs='+', 
        required=True,
        help='Image files to test (supports wildcards)'
    )
    
    parser.add_argument(
        '--prompts',
        choices=['all', 'base', 'custom'],
        default='all',
        help='Which prompts to test'
    )
    
    parser.add_argument(
        '--compare',
        action='store_true',
        help='Show comparison between prompts'
    )
    
    parser.add_argument(
        '--detailed',
        action='store_true',
        help='Show detailed task information'
    )
    
    parser.add_argument(
        '--output',
        help='Export results to JSON file'
    )
    
    parser.add_argument(
        '--filter-image',
        help='Filter detailed results to specific image'
    )
    
    args = parser.parse_args()
    
    # Expand wildcards and collect image paths
    image_paths = []
    for pattern in args.images:
        if '*' in pattern or '?' in pattern:
            # Handle wildcards
            matches = glob.glob(pattern)
            image_paths.extend(matches)
        else:
            # Direct path
            if os.path.exists(pattern):
                image_paths.append(pattern)
            else:
                print(f"Warning: File not found: {pattern}")
    
    if not image_paths:
        print("No valid image files found")
        return
    
    # Remove duplicates and sort
    image_paths = sorted(list(set(image_paths)))
    
    print(f"Found {len(image_paths)} image(s) to test")
    
    # Initialize tester
    tester = CustomImageTester()
    
    # Get prompts
    prompts = tester.get_test_prompts(args.prompts)
    
    try:
        # Run tests
        await tester.test_multiple_prompts(image_paths, prompts)
        
        # Display results
        if args.compare or not args.detailed:
            tester.display_results()
        
        if args.detailed:
            tester.display_detailed_tasks(args.filter_image)
        
        # Export if requested
        if args.output:
            tester.export_results(args.output)
    
    except KeyboardInterrupt:
        print("\n\n⚠ Operation cancelled by user")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())