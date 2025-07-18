# AGENTS.md / CLAUDE.md / copilot-instructions.md

This file provides guidance to AI coding agents when working with code in this repository.

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
- **Jest** with React Native Testing Library for testing

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

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

```

## Project Structure

```
app/                    # Expo Router pages
├── _layout.tsx        # Root layout with navigation and providers
├── index.tsx          # Home screen with task list
├── camera.tsx         # Camera screen for AI task creation
└── api/               # API routes
    └── analyze-image+api.ts  # AI image analysis endpoint

components/            # Reusable UI components
├── FAB.tsx           # Floating action button
├── TaskCard.tsx      # Base task display component
├── SwipeableTaskCard.tsx # Task card with swipe actions
├── DraggableTaskCard.tsx # Task card with drag reordering
├── TaskList.tsx      # Task list container
├── InlineTextEdit.tsx # Inline text editing
├── LocationPicker.tsx # Location selection
├── SnoozeActionSheet.tsx # Snooze duration picker
├── SuccessAnimation.tsx # Success feedback
└── index.ts          # Component exports

store/
└── taskStore.ts      # Zustand store for task management

types/
└── Task.ts          # Task interface definition

utils/
├── aiAnalysis.ts    # Legacy OpenAI integration (deprecated)
├── apiClient.ts     # API client for image analysis
├── demoData.ts      # Demo task data
└── testAI.ts        # AI testing utilities

__tests__/               # Test files
├── basic.test.ts        # Basic Jest functionality tests
├── components/          # Component tests
├── store/               # Store tests
│   └── taskStore-simple.test.ts
├── utils/               # Utility tests
│   └── dateUtils-simple.test.ts
└── README.md           # Testing documentation

.github/workflows/       # CI/CD workflows
├── claude.yml          # Claude Code integration
└── test.yml           # Automated testing on PRs
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

- OpenAI GPT-4 Vision for image analysis via API route
- Structured output using Zod schemas
- Confidence scoring for task suggestions
- Error handling for network/API issues
- Server-side processing for security

### Task Management

- Enhanced Task interface with id, title, location, completion status, due dates, snooze functionality, and manual ordering
- Smart sorting (incomplete first, then by due date, then by manual order)
- Inline editing capabilities with haptic feedback
- Location-based organization
- Swipe actions for quick task actions (complete, snooze, delete)
- Drag and drop reordering following React Native Gesture Handler best practices

### Gesture Components

- **TaskCard**: Base component for task display and editing
- **SwipeableTaskCard**: Adds swipe gestures using `Gesture.Pan()` directly in component
- **DraggableTaskCard**: Adds drag reordering using `Gesture.LongPress()` + `Gesture.Pan()` with `Gesture.Simultaneous()`
- **Clean Architecture**: Gestures implemented directly in components following React Native Gesture Handler best practices, not abstracted into custom hooks

## Environment Variables

The app requires OpenAI API configuration:

- `OPENAI_API_KEY` - OpenAI API key for image analysis (server-side only)

## Testing

The project includes comprehensive testing setup:

- **Jest** as the test runner with jest-expo preset
- **React Native Testing Library** (v13.2.0) for component testing
- **Unit tests** for store functionality and utilities
- **Mocking** for Expo modules and external dependencies
- **Coverage reporting** with lcov output
- **Automated testing** via GitHub Actions CI/CD
- **Centralized logger** with environment-aware logging (disabled in tests)

### Test Configuration

- Uses `jest-expo` preset for proper React Native/Expo support
- Custom mocks for Expo winter runtime globals
- Comprehensive `transformIgnorePatterns` for package compatibility
- Logger automatically disabled in test environment via `NODE_ENV=test`

### Running Tests

```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

Debug utilities:
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
- **API Routes**: Server-side AI processing endpoints
- **Task UI**: Card-based task display with inline editing
- **Success Animation**: User feedback for task creation
- **FAB**: Main action button for task creation options

## Coding Guidelines

- When refactoring code, do not add a comment that says "new xxx". The end state of the code is what matters, no one reading the code would know what was there before, and I certainly don't care. Only add comments when they're important for understanding the code, or - where appropriate - to create semantic separation between differen sections of the code. So: no useless comments!

## Package and Dependency Guidelines

- Always opt to use well-known stable up-to-date packages rather than reinventing the wheel

## CI/CD & Quality Assurance

### GitHub Actions Workflows

The project uses automated workflows for quality assurance:

1. **Test Workflow** (`.github/workflows/test.yml`)
   - Triggers on PRs to `main` and pushes to `main`
   - Runs Jest tests, linting, and coverage reporting
   - Uses latest GitHub Actions (v4) with npm caching
   - Node.js 20 with npm for fast, reliable builds

2. **Claude Code Integration** (`.github/workflows/claude.yml`)
   - AI-assisted code review and development
   - Triggered by `@claude` mentions in issues/PRs

### Quality Gates

All PRs must pass:
- ✅ Jest test suite (16+ tests covering utilities and store)
- ✅ Expo linting (TypeScript + React hooks rules)
- ✅ Coverage reporting (tracked but non-blocking)

### Testing Requirements

When adding new features:
- Write unit tests for utility functions
- Add store tests for Zustand state changes
- Mock external dependencies (Expo modules, AsyncStorage)
- Update test documentation in `__tests__/README.md`

## Workflow Guidelines

- Always start work on a new issue in a new branch from `main`
- Keep pull requests concise with a maximum of 10 atomic commits (if more than that, suggest creating more than one PR)
- Ensure all tests pass before requesting review
- All PRs are automatically tested via GitHub Actions
