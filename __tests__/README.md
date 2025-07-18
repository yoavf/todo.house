# Testing Setup for todo.house

This project now includes a comprehensive testing framework using Jest and React Native Testing Library.

## Overview

The testing setup includes:
- **Jest** as the test runner
- **React Native Testing Library** for component testing
- **TypeScript** support for tests
- **Mocking utilities** for Expo modules and external dependencies

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run specific test file
pnpm test -- __tests__/basic.test.ts
```

## Test Structure

```
__tests__/
├── basic.test.ts                    # Basic Jest functionality tests
├── components/                      # Component tests
├── store/
│   └── taskStore-simple.test.ts    # Store functionality tests
├── utils/
│   └── dateUtils-simple.test.ts    # Utility function tests
└── README.md                       # This file
```

## Configuration Files

- `jest.config.js` - Main Jest configuration
- `jest-setup.js` - Test environment setup
- `babel.config.js` - Babel configuration with TypeScript support
- `__mocks__/expo-localization.js` - Mock for Expo localization module

## Writing Tests

### Basic Test Example
```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Store Testing
```typescript
import { useTaskStore } from '../../store/taskStore';

describe('TaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [] });
  });

  it('should add a task', () => {
    const store = useTaskStore.getState();
    const taskId = store.add({ title: 'Test', completed: false });
    
    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test');
  });
});
```

## Mocking

The test setup includes mocks for common Expo modules and external dependencies:
- `@react-native-async-storage/async-storage`
- `expo-localization`

To add more mocks, create files in the `__mocks__` directory or use `jest.mock()` in your test files.

## Test Coverage

Coverage reports are generated in the `coverage/` directory when running `pnpm test:coverage`. The coverage includes:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

Coverage is collected from:
- `app/**/*.{ts,tsx}`
- `components/**/*.{ts,tsx}`
- `store/**/*.{ts,tsx}`
- `utils/**/*.{ts,tsx}`

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and assertion phases
4. **Mock External Dependencies**: Mock external modules and APIs for reliable tests
5. **Test Edge Cases**: Include tests for error conditions and edge cases

## Troubleshooting

### Common Issues

1. **Module not found errors**: Add appropriate mocks in `__mocks__/` or update `moduleNameMapper` in `jest.config.js`
2. **Transform errors**: Update `transformIgnorePatterns` in `jest.config.js` to include problematic packages
3. **React Native compatibility**: Use `react-native-web` mapping for React Native components in web testing environment

### Adding Component Tests

For complex component testing that requires React Native components, consider:
1. Creating simplified unit tests for component logic
2. Using integration tests for user interactions
3. Mocking complex dependencies like cameras, gesture handlers, etc.

## Next Steps

The current setup provides a solid foundation for testing. You can extend it by:
1. Adding more component tests with proper React Native mocking
2. Creating integration tests for complex user flows
3. Adding snapshot testing for UI components
4. Setting up continuous integration to run tests automatically