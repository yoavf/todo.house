# Requirements Document

## Introduction

This feature enhances the existing task list in the home maintenance app with modern mobile interactions including drag-and-drop reordering, swipe gestures for quick actions, and improved date handling. The goal is to create a more intuitive and efficient task management experience while maintaining the app's core philosophy that tasks don't have due dates by default.

## Requirements

### Requirement 1

**User Story:** As a user, I want to reorder my tasks by dragging and dropping them, so that I can prioritize tasks based on my current needs and preferences.

#### Acceptance Criteria

1. WHEN a user long-presses on a task card THEN the system SHALL enter drag mode with visual feedback
2. WHEN a user drags a task card THEN the system SHALL show a visual indicator of the drag state and potential drop zones
3. WHEN a user drops a task card in a new position THEN the system SHALL reorder the task list and persist the new order
4. WHEN a user cancels a drag operation THEN the system SHALL return the task to its original position
5. IF a task is being dragged THEN other tasks SHALL animate smoothly to make space for the dragged item

### Requirement 2

**User Story:** As a user, I want to swipe tasks to reveal quick actions, so that I can efficiently manage tasks without opening additional menus or dialogs.

#### Acceptance Criteria

1. WHEN a user swipes left on a task card THEN the system SHALL reveal action buttons (delete, snooze)
2. WHEN a user swipes right on a task card THEN the system SHALL reveal completion toggle action
3. WHEN a user taps outside a swiped task or swipes another task THEN the system SHALL close any open swipe actions
4. WHEN a user performs a swipe action THEN the system SHALL execute the action and close the swipe interface
5. IF a task is completed THEN swipe actions SHALL be limited to delete and unmark as complete

### Requirement 3

**User Story:** As a user, I want to snooze tasks to a later time, so that I can temporarily hide tasks that aren't immediately relevant without losing them.

#### Acceptance Criteria

1. WHEN a user selects snooze on a task THEN the system SHALL present snooze duration options (1 hour, 3 hours, tomorrow, next week)
2. WHEN a task is snoozed THEN the system SHALL hide it from the main task list until the snooze period expires
3. WHEN a snoozed task's time expires THEN the system SHALL return it to the main task list with a visual indicator
4. WHEN a user views snoozed tasks THEN the system SHALL show them in a separate section with remaining snooze time
5. IF a user wants to unsnooze a task early THEN the system SHALL allow manual unsnoozing from the snoozed tasks view

### Requirement 4

**User Story:** As a user, I want to see when tasks were created and when they're due (if applicable), so that I can better understand task context and urgency.

#### Acceptance Criteria

1. WHEN displaying a task THEN the system SHALL show the creation date in a human-readable format
2. WHEN a task has a due date THEN the system SHALL display it prominently with appropriate urgency indicators
3. WHEN a task is overdue THEN the system SHALL highlight it with visual cues (color, icon)
4. WHEN a task is due today THEN the system SHALL mark it with a "due today" indicator
5. IF no due date is set THEN the system SHALL only show the creation date without due date information

### Requirement 5

**User Story:** As a user, I want to optionally add due dates to specific tasks, so that I can track time-sensitive maintenance items while keeping the default behavior of no due dates.

#### Acceptance Criteria

1. WHEN creating or editing a task THEN the system SHALL provide an optional due date picker
2. WHEN no due date is selected THEN the system SHALL maintain the current behavior of date-free tasks
3. WHEN a due date is set THEN the system SHALL store and display it appropriately
4. WHEN a user wants to remove a due date THEN the system SHALL allow clearing it back to no due date
5. IF a task has a due date THEN the system SHALL sort tasks with due dates before those without (within each completion status)

### Requirement 6

**User Story:** As a user, I want smooth animations and haptic feedback during interactions, so that the app feels responsive and provides clear feedback for my actions.

#### Acceptance Criteria

1. WHEN performing drag and drop operations THEN the system SHALL provide haptic feedback at key interaction points
2. WHEN swiping tasks THEN the system SHALL animate the reveal and hide of action buttons smoothly
3. WHEN reordering tasks THEN other tasks SHALL animate to their new positions with smooth transitions
4. WHEN completing actions THEN the system SHALL provide appropriate haptic feedback (light for completion, medium for snooze, strong for delete)
5. IF animations are disabled system-wide THEN the system SHALL respect accessibility settings and reduce motion

### Requirement 7

**User Story:** As a user, I want the enhanced task list to work seamlessly with the existing task creation flow, so that new tasks integrate properly with the improved interface.

#### Acceptance Criteria

1. WHEN a new task is created via camera/AI analysis THEN the system SHALL add it to the task list maintaining the current visual feedback
2. WHEN tasks are added THEN they SHALL appear at the top of the list by default but be moveable via drag and drop
3. WHEN the task list is empty THEN the system SHALL maintain the current empty state messaging
4. WHEN tasks are filtered or searched THEN drag and drop SHALL be disabled to prevent confusion
5. IF the app is backgrounded during a drag operation THEN the system SHALL cancel the drag and return tasks to original positions

### Requirement 8

**User Story:** As a user, I want the enhanced task list to maintain compatibility with existing task creation methods, so that I can continue using the FAB and inline editing features seamlessly.

#### Acceptance Criteria

1. WHEN using the FAB to create new tasks THEN the system SHALL integrate with the enhanced task list without breaking existing functionality
2. WHEN editing tasks inline THEN the system SHALL preserve the current inline editing capabilities
3. WHEN adding tasks through any method THEN they SHALL automatically get proper order values for drag and drop
4. WHEN the success animation plays THEN it SHALL work correctly with the enhanced task list layout
5. IF tasks are being dragged THEN inline editing SHALL be temporarily disabled to prevent conflicts

### Requirement 9

**User Story:** As a user with accessibility needs, I want the enhanced task list to be fully accessible, so that I can use all features regardless of my abilities.

#### Acceptance Criteria

1. WHEN using screen readers THEN all interactive elements SHALL have proper accessibility labels and hints
2. WHEN gesture interactions are not available THEN alternative methods SHALL be provided for all actions
3. WHEN reduced motion is enabled THEN the system SHALL respect accessibility settings and minimize animations
4. WHEN using voice control THEN all enhanced features SHALL be accessible through voice commands
5. IF keyboard navigation is available THEN all interactive elements SHALL be reachable via keyboard