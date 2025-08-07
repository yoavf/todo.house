# Requirements Document

## Introduction

This feature implements comprehensive user authentication for TodoHouse, replacing the current header-based user identification system with proper authentication. The system will support two modern authentication methods: Google OAuth sign-in and passwordless magic link authentication. This will provide users with secure, convenient access while maintaining the existing user-specific task isolation.

## Requirements

### Requirement 1

**User Story:** As a user, I want to sign in with my Google account, so that I can securely access my tasks without creating a new password.

#### Acceptance Criteria

1. WHEN a user clicks "Sign in with Google" THEN the system SHALL redirect them to Google's OAuth consent screen
2. WHEN a user grants permission on Google's consent screen THEN the system SHALL receive their profile information and create or update their user account
3. WHEN a user successfully authenticates with Google THEN the system SHALL create a secure session and redirect them to the main application
4. IF a user denies permission on Google's consent screen THEN the system SHALL redirect them back to the sign-in page with an appropriate error message
5. WHEN a returning Google user signs in THEN the system SHALL authenticate them using their existing account without creating duplicates

### Requirement 2

**User Story:** As a user, I want to sign in using a magic link sent to my email, so that I can access my account without remembering a password.

#### Acceptance Criteria

1. WHEN a user enters their email address and clicks "Send Magic Link" THEN the system SHALL send a secure, time-limited authentication link to their email
2. WHEN a user clicks a valid magic link THEN the system SHALL authenticate them and redirect to the main application
3. WHEN a user clicks an expired magic link THEN the system SHALL show an error message and prompt them to request a new link
4. WHEN a user clicks an already-used magic link THEN the system SHALL show an error message indicating the link has been consumed
5. WHEN a user requests a magic link for an email that doesn't exist THEN the system SHALL create a new user account and send the magic link
6. WHEN a magic link is generated THEN it SHALL expire after 15 minutes for security
7. WHEN magic link requests are made THEN the system SHALL implement rate limiting of maximum 3 requests per email address per hour OR 5 requests per sessions to prevent spam
8. WHEN magic link requests exceed the rate limit THEN the system SHALL return a generic success message but not send additional emails until the rate limit resets

### Requirement 3

**User Story:** As a user, I want my authentication session to persist indefinitely across browser sessions and devices, so that I never have to sign in again unless I explicitly sign out.

#### Acceptance Criteria

1. WHEN a user successfully authenticates THEN the system SHALL create a secure session that persists indefinitely until explicitly revoked
2. WHEN a user closes and reopens their browser THEN they SHALL remain authenticated without any time-based expiration
3. WHEN a user accesses the application after any period of inactivity THEN they SHALL still be authenticated and able to access their tasks
4. WHEN a user clicks "Sign Out" THEN their session SHALL be immediately invalidated and they SHALL be redirected to the sign-in page
5. WHEN a user signs in on multiple devices THEN they SHALL be able to remain authenticated on all devices simultaneously
6. WHEN a user is authenticated on multiple devices THEN each device SHALL maintain its own independent session without affecting others

### Requirement 4

**User Story:** As a user, I want my existing tasks to be preserved when I authenticate for the first time, so that I don't lose any work I've already done.

#### Acceptance Criteria

1. WHEN a user authenticates for the first time THEN the system SHALL migrate any tasks associated with their previous header-based user ID to their authenticated account
2. WHEN task migration occurs THEN all task properties (title, description, priority, status, snooze times) SHALL be preserved exactly
3. WHEN task migration occurs THEN all associated images and AI-generated content SHALL be preserved and linked to the new authenticated user
4. IF no tasks exist for the user's previous session THEN authentication SHALL proceed normally without migration
5. WHEN migration is complete THEN the old header-based user ID SHALL be marked as migrated to prevent duplicate migrations

### Requirement 5

**User Story:** As a developer, I want the authentication system to integrate seamlessly with the existing codebase, so that minimal changes are required to existing functionality.

#### Acceptance Criteria

1. WHEN authentication is implemented THEN all existing API endpoints SHALL continue to work with authenticated users
2. WHEN a user is authenticated THEN their user ID SHALL be available in the same format as the current header-based system
3. WHEN authentication middleware is added THEN it SHALL automatically protect all API routes except public ones (health check, auth endpoints)
4. WHEN the frontend is updated THEN it SHALL automatically redirect unauthenticated users to the sign-in page
5. WHEN authentication is complete THEN the current `NEXT_PUBLIC_TEST_USER_ID` environment variable SHALL no longer be needed for development

### Requirement 6

**User Story:** As a system administrator, I want authentication to be secure and follow best practices, so that user data is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN implementing OAuth THEN the system SHALL use the authorization code flow with PKCE for maximum security
2. WHEN storing session tokens THEN they SHALL be cryptographically secure, random, and stored with secure HTTP-only cookies
3. WHEN handling magic links THEN they SHALL contain cryptographically secure tokens that cannot be guessed
4. WHEN a user authenticates THEN their session SHALL include CSRF protection
5. WHEN authentication fails THEN error messages SHALL not reveal whether an email address exists in the system
6. WHEN implementing rate limiting THEN magic link requests SHALL be limited to prevent abuse and resource waste (max 3 requests per email per hour)
7. WHEN rate limiting is triggered THEN the system SHALL log suspicious activity for monitoring while maintaining user privacy