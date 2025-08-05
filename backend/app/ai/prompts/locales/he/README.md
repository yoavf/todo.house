# Hebrew AI Prompts - Structure and Guidelines

## Overview

This directory contains Hebrew translations of AI prompts used for image analysis and task generation. The prompts are designed to generate contextually appropriate tasks for Hebrew-speaking users while maintaining the same technical accuracy as English prompts.

## Prompt Structure

### home_maintenance_analysis.txt

This prompt is used for analyzing home maintenance images and generating actionable tasks in Hebrew.

#### Key Components:

1. **System Role Definition** - Establishes the AI as a home maintenance expert
2. **Task Instructions** - Clear instructions for analyzing images and generating tasks
3. **Output Format Requirements** - Specifies required fields and data types
4. **Hebrew Examples by Category** - Comprehensive examples for different task types

#### Hebrew Language Guidelines:

- **Titles**: Keep under 50 characters, use clear and actionable Hebrew
- **Descriptions**: Provide detailed explanations in natural Hebrew
- **Categories**: Use common Hebrew terms for maintenance categories
- **Reasoning**: Explain the visual evidence in Hebrew

#### Task Categories in Hebrew:

| English | Hebrew | Usage |
|---------|--------|-------|
| Cleaning | ניקוי | General cleaning tasks |
| Repair | תיקון | Fixing broken or damaged items |
| Maintenance | תחזוקה מניעתית | Preventive maintenance |
| Safety | בטיחות | Safety-related concerns |
| Plumbing | אינסטלציה | Water and plumbing issues |
| Electricity | חשמל | Electrical work and issues |
| Appliances | מכשירי חשמל | Appliance maintenance |

#### Task Types (Technical - Keep in English):

These remain in English as they are technical identifiers:
- `interior` - Tasks inside the home
- `exterior` - Tasks outside the home  
- `electricity` - Electrical work
- `plumbing` - Plumbing tasks
- `appliances` - Appliance maintenance
- `maintenance` - General maintenance
- `repair` - Repair work

#### Priority Levels (Technical - Keep in English):

- `high` - Urgent, safety-critical tasks
- `medium` - Important but not urgent
- `low` - Nice-to-have, cosmetic improvements

## Translation Principles

### 1. Cultural Context
- Use Hebrew terms that are familiar to Israeli users
- Consider local maintenance practices and terminology
- Adapt examples to common Israeli home types and issues

### 2. Technical Accuracy
- Maintain the same level of technical detail as English prompts
- Ensure safety recommendations are clear and appropriate
- Keep technical identifiers (task_types, priorities) in English for system compatibility

### 3. Natural Language
- Use conversational, natural Hebrew
- Avoid overly formal or technical language where possible
- Ensure descriptions are clear and actionable

### 4. Consistency
- Use consistent terminology across all examples
- Maintain the same structure and format as English prompts
- Ensure all required fields are properly translated

## Example Categories Covered

The Hebrew prompt includes comprehensive examples for:

1. **ניקוי (Cleaning)** - Limescale removal, general cleaning
2. **תיקון (Repair)** - Wall cracks, structural repairs
3. **תחזוקה מניעתית (Maintenance)** - Door hinges, preventive care
4. **בטיחות (Safety)** - Smoke detectors, safety equipment
5. **אינסטלציה (Plumbing)** - Leaks, water-related issues
6. **חשמל (Electricity)** - Switches, electrical safety
7. **מכשירי חשמל (Appliances)** - Air conditioner filters, appliance maintenance

## Quality Assurance

### Testing Guidelines:
- Test prompts with various home maintenance images
- Verify Hebrew output quality and naturalness
- Ensure technical accuracy is maintained
- Check that confidence scores are appropriate

### Performance Metrics:
- Task extraction accuracy should match English prompts (≥95%)
- Hebrew text should be grammatically correct
- Categories should be appropriately assigned
- Confidence scores should reflect actual certainty

## Future Enhancements

### Planned Improvements:
- Add more specific examples for Israeli home types
- Include seasonal maintenance considerations for Israeli climate
- Add examples for common Israeli building materials and issues
- Expand appliance examples for common Israeli brands

### Maintenance:
- Regular review of Hebrew terminology for accuracy
- Updates based on user feedback and usage patterns
- Alignment with any changes to English prompts
- Performance monitoring and optimization