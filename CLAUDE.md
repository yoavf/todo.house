# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile app called "todo.house" built with Expo that allows users to manage household tasks. The app features AI-powered task creation through camera analysis, where users can take pictures of household areas and the app will automatically suggest relevant tasks.

## Key Technologies

- **React Native** with Expo (~53.0.17)
- **Expo Router** for file-based navigation
- **Zustand** for state management
- **TypeScript** with strict mode
- **AI SDK** (@ai-sdk/openai) for image analysis
- **React Hook Form** for form handling
- **Zod** for schema validation
- **AsyncStorage** for local data persistence

## Development Commands

```bash
# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Linting
npm run lint

```

## Project Structure

```
app/                    # Expo Router pages
├── _layout.tsx        # Root layout with navigation and providers
├── index.tsx          # Home screen with task list
└── camera.tsx         # Camera screen for AI task creation

components/            # Reusable UI components
├── FAB.tsx           # Floating action button
├── TaskCard.tsx      # Individual task display
├── TaskList.tsx      # Task list container
├── InlineTextEdit.tsx # Inline text editing
├── LocationPicker.tsx # Location selection
├── SuccessAnimation.tsx # Success feedback
└── index.ts          # Component exports

store/
└── taskStore.ts      # Zustand store for task management

types/
└── Task.ts          # Task interface definition

utils/
├── aiAnalysis.ts    # OpenAI integration for image analysis
├── demoData.ts      # Demo task data
└── testAI.ts        # AI testing utilities
```

## Architecture Notes

### State Management

- Uses Zustand for global state management
- TaskStore handles all task CRUD operations
- AsyncStorage integration for persistence
- Hydration pattern for loading persisted state

### Navigation

- Expo Router with Stack navigation
- File-based routing system
- Modal presentation for camera screen
- Type-safe navigation with TypeScript

### AI Integration

- OpenAI GPT-4 Vision for image analysis
- Structured output using Zod schemas
- Confidence scoring for task suggestions
- Error handling for network/API issues

### Task Management

- Simple Task interface with id, title, location, completion status
- Date-based sorting (incomplete first, then by creation date)
- Inline editing capabilities
- Location-based organization

## Environment Variables

The app requires OpenAI API configuration:

- `EXPO_PUBLIC_OPENAI_API_KEY` - OpenAI API key for image analysis

## Testing

The app includes debug utilities:

- Test AI button in header for OpenAI integration testing
- Test Env button for environment diagnostics
- Demo data generation for development

## Development Notes

- Uses React Native's new architecture (newArchEnabled: true)
- Camera permissions required for AI task creation
- Base64 image processing for OpenAI API
- Styled with inline StyleSheet.create patterns
- AsyncStorage for cross-platform persistence

## Key Components

- **TaskStore**: Central state management with persistence
- **Camera Integration**: Full-screen camera with AI analysis
- **Task UI**: Card-based task display with inline editing
- **Success Animation**: User feedback for task creation
- **FAB**: Main action button for task creation options

## Coding Guidelines

- When refactoring code, do not add a comment that says "new xxx". The end state of the code is what matters, no one reading the code would know what was there before, and I certainly don't care. Only add comments when they're important for understanding the code, or - where appropriate - to create semantic separation between differen sections of the code. So: no useless comments!
