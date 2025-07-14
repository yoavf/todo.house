# Implementation Plan

- [ ] 1. Extend Task interface and store with new fields
  - Add order, dueDate, and snoozeUntil fields to Task interface
  - Update TaskStore with reordering, snoozing, and due date methods
  - Implement data migration for existing tasks to add order field
  - Write unit tests for new store methods
  - _Requirements: 3.1, 4.1, 5.1, 7.2, 8.3_

- [ ] 2. Create core gesture handling utilities
  - [ ] 2.1 Implement drag gesture detection and state management
    - Create useDragGesture hook with long press detection
    - Implement drag state management with Reanimated shared values
    - Add haptic feedback integration for drag start/end events
    - Write tests for gesture state transitions
    - _Requirements: 1.1, 1.4, 6.1, 6.4, 8.5_

  - [ ] 2.2 Implement swipe gesture recognition system
    - Create useSwipeGesture hook for left/right swipe detection
    - Add swipe threshold configuration and auto-action logic
    - Implement gesture conflict resolution between drag and swipe
    - Write tests for swipe gesture recognition and thresholds
    - _Requirements: 2.1, 2.2, 2.3, 6.2_

- [ ] 3. Build SwipeableTaskCard component
  - [ ] 3.1 Create swipe action reveal animations
    - Implement left swipe to reveal delete and snooze buttons
    - Create right swipe to reveal completion toggle action
    - Add spring animations for smooth action button reveal/hide
    - Write tests for swipe animation states
    - _Requirements: 2.1, 2.2, 6.2_

  - [ ] 3.2 Implement swipe action handlers and auto-close
    - Add action button press handlers with haptic feedback
    - Implement auto-close on outside tap or new swipe gesture
    - Handle completed task swipe action limitations
    - Write integration tests for swipe actions
    - _Requirements: 2.3, 2.4, 2.5, 6.4_

- [ ] 4. Create DraggableTaskCard component
  - [ ] 4.1 Implement drag visual feedback and positioning
    - Add drag state visual indicators (scale, elevation, shadow)
    - Implement finger-following positioning with spring physics
    - Create drop zone detection and visual feedback system
    - Write tests for drag visual state changes
    - _Requirements: 1.1, 1.2, 6.1, 6.3_

  - [ ] 4.2 Build task reordering logic and animations
    - Implement task position calculation and reordering algorithm
    - Add smooth animations for other tasks during drag operations
    - Create drop completion with position settling animation
    - Write tests for reordering logic and position calculations
    - _Requirements: 1.3, 1.5, 6.3_

- [ ] 5. Implement snooze functionality
  - [ ] 5.1 Create SnoozeModal component with duration selection
    - Build bottom sheet modal using @gorhom/bottom-sheet
    - Add duration selection buttons (1 hour, 3 hours, tomorrow, next week)
    - Implement snooze duration calculation utilities
    - Write tests for snooze duration calculations
    - _Requirements: 3.1, 3.2_

  - [ ] 5.2 Implement snooze state management and task filtering
    - Add snooze/unsnooze methods to task store
    - Implement task filtering to hide snoozed tasks from main list
    - Create automatic unsnoozing when snooze period expires
    - Write tests for snooze state management and filtering
    - _Requirements: 3.2, 3.3, 3.5_

  - [ ] 5.3 Build snoozed tasks display section
    - Create SnoozedTasksSection component to show snoozed tasks
    - Add remaining snooze time display and manual unsnooze option
    - Implement visual indicator for recently unsnoozed tasks
    - Write tests for snoozed tasks display and interactions
    - _Requirements: 3.4, 3.5_

- [ ] 6. Add due date functionality
  - [ ] 6.1 Create due date picker and management
    - Add optional due date picker to task creation/editing flow
    - Implement due date setting and clearing functionality
    - Create due date display with human-readable formatting
    - Write tests for due date picker and formatting
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 6.2 Implement due date visual indicators and sorting
    - Add overdue and due today visual indicators to task cards
    - Implement task sorting with due dates prioritized
    - Create urgency-based color coding and icons
    - Write tests for due date sorting and visual indicators
    - _Requirements: 4.2, 4.3, 4.4, 5.5_

- [ ] 7. Enhance TaskList component with new features
  - [ ] 7.1 Integrate draggable and swipeable task cards
    - Replace existing TaskCard usage with DraggableTaskCard wrapper
    - Add drag state management to TaskList component
    - Implement gesture conflict prevention during filtering/search
    - Write integration tests for enhanced task list interactions
    - _Requirements: 1.1, 1.2, 7.4, 8.2_

  - [ ] 7.2 Add task reordering persistence and optimization
    - Implement efficient task reordering with minimal database writes
    - Add optimistic updates with rollback on persistence failure
    - Create batch order updates to reduce AsyncStorage operations
    - Write tests for reordering persistence and error handling
    - _Requirements: 1.3, 7.1_

- [ ] 8. Implement accessibility and performance optimizations
  - [ ] 8.1 Add accessibility support for gesture interactions
    - Implement screen reader compatibility for all interactive elements
    - Add proper accessibility labels and hints for gesture actions
    - Create keyboard navigation support where applicable
    - Write accessibility tests for enhanced interactions
    - _Requirements: 6.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 8.2 Optimize rendering and animation performance
    - Add React.memo to TaskCard to prevent unnecessary re-renders
    - Implement FlatList getItemLayout for stable ordering performance
    - Add animation cleanup and memory management
    - Write performance tests and benchmarks for gesture interactions
    - _Requirements: 6.3, 6.5_

- [ ] 9. Handle edge cases and error scenarios
  - [ ] 9.1 Implement gesture cancellation and cleanup
    - Add proper gesture cancellation when app backgrounds
    - Implement cleanup for interrupted drag operations
    - Handle gesture conflicts and state recovery
    - Write tests for edge case scenarios and error recovery
    - _Requirements: 1.4, 7.5_

  - [ ] 9.2 Add data validation and migration safety
    - Implement validation for task order and snooze date values
    - Add safe data migration with fallback for corrupted data
    - Handle timezone changes for snooze functionality
    - Write tests for data validation and migration scenarios
    - _Requirements: 7.1, 7.2_

- [ ] 10. Integration testing and polish
  - [ ] 10.1 Test integration with existing task creation flow
    - Verify new tasks integrate properly with enhanced task list
    - Test camera/AI analysis task creation with new features
    - Test FAB integration with enhanced task list
    - Ensure success animation works with enhanced layout
    - Ensure empty state messaging works with enhanced interface
    - Write end-to-end tests for complete task lifecycle
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.4_

  - [ ] 10.2 Final polish and animation refinements
    - Fine-tune animation timing and easing curves
    - Add final haptic feedback polish and consistency
    - Implement reduced motion accessibility compliance
    - Conduct final testing across different device sizes and orientations
    - _Requirements: 6.1, 6.2, 6.4, 6.5_