# Design Document

## Overview

The enhanced task list will transform the current static task display into a dynamic, interactive interface using React Native's gesture handling and animation capabilities. The design leverages existing dependencies (react-native-gesture-handler, react-native-reanimated, expo-haptics) to implement drag-and-drop reordering, swipe gestures, and smooth animations while maintaining the app's current visual design language.

## Architecture

### Component Hierarchy
```
TaskList (Enhanced)
├── DraggableTaskCard (New)
│   ├── SwipeableTaskCard (New)
│   │   └── TaskCard (Enhanced)
│   └── DragHandle (New)
├── SnoozeModal (New)
└── SnoozedTasksSection (New)
```

### State Management Extensions
The existing Zustand store will be extended with new capabilities:
- Task ordering persistence
- Snooze functionality with timestamps
- Due date handling
- Drag state management

### Key Libraries Integration
- **react-native-gesture-handler**: Pan gestures for drag/drop and swipe actions
- **react-native-reanimated**: Smooth animations and layout transitions
- **expo-haptics**: Tactile feedback for user interactions
- **@react-native-async-storage/async-storage**: Persist task order and snooze data

## Integration with Existing Components

### FAB Integration
The enhanced task list must maintain compatibility with the existing FAB (Floating Action Button) component:
- New tasks created via FAB will automatically receive proper order values
- Success animations will work correctly with the enhanced layout
- The FAB's modal presentations will not interfere with gesture interactions

### Inline Editing Compatibility
The existing InlineTextEdit component will be preserved:
- Inline editing will be temporarily disabled during drag operations
- Task title and location editing will remain unchanged
- Enhanced task cards will wrap the existing TaskCard component

### Camera/AI Integration
Tasks created through camera analysis will integrate seamlessly:
- AI-generated tasks will receive proper order values for drag and drop
- The success animation will work correctly with the enhanced interface
- All existing camera functionality will be preserved

## Components and Interfaces

### Enhanced Task Interface
```typescript
interface Task {
  id: string;
  title: string;
  location?: string;
  createdAt: Date;
  completed: boolean;
  // New fields
  dueDate?: Date;
  snoozeUntil?: Date;
  order: number; // For custom ordering
}

interface TaskStore {
  // Existing methods...
  // New methods
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  snoozeTask: (id: string, duration: SnoozeDuration) => void;
  unsnoozeTask: (id: string) => void;
  setDueDate: (id: string, dueDate?: Date) => void;
  getActiveTasks: () => Task[];
  getSnoozedTasks: () => Task[];
}

type SnoozeDuration = '1hour' | '3hours' | 'tomorrow' | 'nextweek';
```

### DraggableTaskCard Component
```typescript
interface DraggableTaskCardProps {
  task: Task;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  isDragActive: boolean;
}
```

**Key Features:**
- Long press gesture recognition (500ms threshold)
- Visual elevation and scaling during drag
- Haptic feedback on drag start/end
- Smooth position interpolation
- Drop zone detection and visual feedback

### SwipeableTaskCard Component
```typescript
interface SwipeableTaskCardProps {
  task: Task;
  onDelete: () => void;
  onSnooze: () => void;
  onToggleComplete: () => void;
}
```

**Key Features:**
- Left swipe reveals delete and snooze actions
- Right swipe reveals completion toggle
- Configurable swipe thresholds (30% for reveal, 70% for auto-action)
- Spring animations for action button reveal
- Auto-close on outside tap or new swipe

### SnoozeModal Component
```typescript
interface SnoozeModalProps {
  visible: boolean;
  onSelect: (duration: SnoozeDuration) => void;
  onCancel: () => void;
}
```

**Key Features:**
- Bottom sheet presentation using @gorhom/bottom-sheet
- Quick duration selection with visual time indicators
- Haptic feedback on selection
- Accessibility support with proper labels

## Data Models

### Task Ordering System
Tasks will maintain an `order` field for custom positioning:
- New tasks get `order = Date.now()` (appear at top)
- Drag operations update order values to maintain position
- Efficient reordering algorithm to minimize database updates

### Snooze Implementation
```typescript
interface SnoozeData {
  taskId: string;
  snoozeUntil: Date;
  originalOrder: number; // Restore position when unsnoozing
}
```

### Due Date Handling
- Optional field maintaining backward compatibility
- Smart sorting: due dates first (by urgency), then by order/creation date
- Visual indicators for overdue, due today, and upcoming tasks

## Error Handling

### Gesture Conflicts
- Prevent simultaneous drag and swipe operations
- Cancel active gestures when app backgrounds
- Handle gesture interruptions gracefully

### Data Persistence
- Optimistic updates with rollback on failure
- Batch order updates to reduce AsyncStorage writes
- Validate snooze dates and handle timezone changes

### Performance Considerations
- Limit simultaneous animations to prevent jank
- Use `getItemLayout` for FlatList optimization
- Implement gesture state cleanup on unmount

## Testing Strategy

### Unit Tests
- Task store methods for reordering, snoozing, due dates
- Date calculation utilities for snooze durations
- Task filtering and sorting logic

### Integration Tests
- Gesture recognition and response
- Animation completion and state consistency
- Data persistence across app lifecycle

### Visual Regression Tests
- Drag and drop visual states
- Swipe action reveal animations
- Task card layouts with various data combinations

### Accessibility Tests
- Screen reader compatibility for all interactive elements
- Keyboard navigation support where applicable
- Reduced motion respect for animations
- Voice control compatibility for all enhanced features
- Alternative interaction methods for users who cannot use gestures

## Animation Specifications

### Drag and Drop
- **Drag Start**: Scale to 1.05, elevate with shadow, haptic light
- **Drag Active**: Follow finger with spring physics (damping: 0.8)
- **Drop**: Scale back to 1.0, settle to position, haptic medium
- **Other Tasks**: Smooth Y-translation with stagger (100ms delay)

### Swipe Actions
- **Reveal**: Elastic ease-out (duration: 300ms)
- **Auto-action**: Quick snap (duration: 150ms)
- **Close**: Spring animation (tension: 100, friction: 8)

### Task State Changes
- **Complete**: Fade opacity to 0.6, strikethrough animation
- **Snooze**: Slide out right with fade (duration: 400ms)
- **Unsnooze**: Slide in from right with bounce (duration: 500ms)

## Performance Optimizations

### Rendering
- Use `React.memo` for TaskCard to prevent unnecessary re-renders
- Implement `getItemLayout` for FlatList when order is stable
- Lazy load snooze modal component

### Gesture Handling
- Use `runOnJS` sparingly to minimize bridge calls
- Batch gesture updates using `worklet` functions
- Implement gesture cancellation for better responsiveness

### Memory Management
- Clean up animation listeners on component unmount
- Use weak references for gesture handlers where possible
- Implement proper cleanup for snooze timers

## Migration Strategy

### Data Migration
- Add new fields to existing tasks with default values
- Assign order values based on creation date for existing tasks
- Maintain backward compatibility with current task structure

### Feature Rollout
- Phase 1: Basic drag and drop without persistence
- Phase 2: Add swipe gestures and snooze functionality
- Phase 3: Due date features and advanced animations
- Phase 4: Performance optimizations and polish