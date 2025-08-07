# Implementation Plan

- [ ] 1. Set up authentication database schema and models
  - Create Alembic migration for new authentication tables (sessions, magic_links, rate_limits)
  - Add new columns to users table (google_id, name, avatar_url, email_verified)
  - Update SQLAlchemy User model with new authentication fields
  - Create SQLAlchemy models for Session, MagicLink, and RateLimit tables
  - _Requirements: 5.2, 5.3, 6.2_

- [ ] 2. Implement core authentication service layer
- [ ] 2.1 Create authentication service with session management
  - Implement AuthService class with session creation, validation, and revocation methods
  - Add cryptographically secure session token generation using secrets module
  - Create database operations for session CRUD with proper error handling
  - Write unit tests for all AuthService methods with mocked database
  - _Requirements: 3.1, 3.2, 3.4, 6.2_

- [ ] 2.2 Implement magic link functionality
  - Create magic link token generation with secure random tokens
  - Implement magic link verification with expiration and single-use validation
  - Add database operations for magic link storage and cleanup
  - Write unit tests for magic link generation and verification logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.3_

- [ ] 2.3 Implement dual rate limiting system
  - Create RateLimiter class with email-based and session-based rate limiting
  - Implement sliding window rate limiting algorithm with database persistence
  - Add automatic cleanup of expired rate limit entries
  - Write unit tests for rate limiting logic with various scenarios
  - _Requirements: 2.7, 2.8, 6.6_

- [ ] 3. Implement Google OAuth integration
- [ ] 3.1 Set up OAuth configuration and handlers
  - Install and configure authlib for Google OAuth 2.0 with PKCE
  - Create GoogleOAuthHandler class with authorization URL generation
  - Implement OAuth callback handling with state validation
  - Add Google user info retrieval and token exchange functionality
  - Write unit tests for OAuth handler with mocked Google API responses
  - _Requirements: 1.1, 1.2, 1.4, 6.1, 6.4_

- [ ] 3.2 Create OAuth API endpoints
  - Implement /auth/google/login endpoint for OAuth initiation
  - Create /auth/google/callback endpoint for OAuth completion
  - Add proper error handling for OAuth failures and state mismatches
  - Write integration tests for complete OAuth flow
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 4. Implement email service for magic links
- [ ] 4.1 Set up email service with template system
  - Install and configure email provider (Resend or SendGrid)
  - Create EmailService class with magic link email sending
  - Implement HTML email templates using Jinja2 for magic links
  - Add email delivery error handling and retry logic
  - Write unit tests for email service with mocked email provider
  - _Requirements: 2.1, 2.5_

- [ ] 4.2 Create magic link API endpoints
  - Implement /auth/magic-link endpoint for magic link generation
  - Create /auth/verify endpoint for magic link verification
  - Add rate limiting middleware to magic link endpoints
  - Write integration tests for magic link email flow
  - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8_

- [ ] 5. Implement authentication middleware and session handling
- [ ] 5.1 Create authentication middleware for FastAPI
  - Implement middleware to extract and validate session tokens from cookies
  - Add user context injection for authenticated requests
  - Create dependency for protecting routes that require authentication
  - Write unit tests for middleware with various authentication scenarios
  - _Requirements: 5.2, 5.3, 6.2_

- [ ] 5.2 Update existing API endpoints with authentication
  - Replace X-User-Id header dependency with authenticated user dependency
  - Update all task, image, and location endpoints to use authenticated user
  - Ensure backward compatibility during migration period
  - Write integration tests for all updated endpoints
  - _Requirements: 5.1, 5.2_

- [ ] 6. Implement user data migration system
- [ ] 6.1 Create migration service for existing users
  - Implement service to migrate tasks from header-based user IDs to authenticated users
  - Add migration for images and locations associated with old user IDs
  - Create migration tracking to prevent duplicate migrations
  - Write unit tests for migration logic with test data
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 6.2 Create migration API endpoint and process
  - Implement /auth/migrate endpoint for triggering user data migration
  - Add migration status tracking and progress reporting
  - Create background job for processing large migrations
  - Write integration tests for complete migration flow
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Implement frontend authentication context and state management
- [ ] 7.1 Create authentication context and hooks
  - Implement AuthContext with user state, loading states, and auth methods
  - Create useAuth hook for accessing authentication state throughout app
  - Add automatic session validation and refresh on app load
  - Write unit tests for authentication context state management
  - _Requirements: 3.1, 3.2, 3.6_

- [ ] 7.2 Implement authentication API client methods
  - Update API client to handle session-based authentication with cookies
  - Add methods for Google OAuth initiation and magic link requests
  - Implement automatic token refresh and error handling
  - Write unit tests for API client authentication methods
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 8. Create authentication UI components and pages
- [ ] 8.1 Build sign-in page with Google and magic link options
  - Create responsive sign-in page with Google OAuth button
  - Implement magic link email input form with validation
  - Add loading states and error handling for both authentication methods
  - Write unit tests for sign-in page interactions and form validation
  - _Requirements: 1.1, 2.1_

- [ ] 8.2 Create magic link confirmation and verification pages
  - Build magic link sent confirmation page with resend functionality
  - Create magic link verification page for handling email link clicks
  - Add error handling for expired or invalid magic links
  - Write unit tests for magic link pages and error scenarios
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 9. Implement route protection and session management
- [ ] 9.1 Create protected route wrapper component
  - Implement ProtectedRoute component that redirects unauthenticated users
  - Add loading states while checking authentication status
  - Create fallback UI for authentication failures
  - Write unit tests for route protection logic
  - _Requirements: 3.3, 5.4_

- [ ] 9.2 Update app routing with authentication guards
  - Wrap main application routes with ProtectedRoute component
  - Update app layout to handle authenticated and unauthenticated states
  - Add sign-out functionality with session cleanup
  - Write integration tests for complete authentication flow
  - _Requirements: 3.4, 3.6, 5.4_

- [ ] 10. Add comprehensive error handling and user feedback
- [ ] 10.1 Implement authentication error handling system
  - Create standardized error response format for authentication failures
  - Add user-friendly error messages for common authentication scenarios
  - Implement retry logic for transient authentication errors
  - Write unit tests for error handling with various failure scenarios
  - _Requirements: 1.4, 2.3, 2.4_

- [ ] 10.2 Add rate limiting feedback and security logging
  - Implement rate limiting feedback with countdown timers for users
  - Add security event logging for authentication attempts and failures
  - Create monitoring dashboard for authentication metrics
  - Write integration tests for rate limiting and security logging
  - _Requirements: 2.8, 6.7_

- [ ] 11. Write comprehensive test coverage for authentication system
- [ ] 11.1 Create backend integration tests for complete auth flows
  - Write integration tests for Google OAuth complete flow
  - Create integration tests for magic link generation and verification
  - Add integration tests for session management and persistence
  - Test user migration flow with real database operations
  - _Requirements: All requirements_

- [ ] 11.2 Create frontend integration tests for authentication
  - Write end-to-end tests for Google OAuth sign-in flow
  - Create integration tests for magic link authentication flow
  - Add tests for session persistence across page reloads
  - Test route protection and authentication state management
  - _Requirements: All requirements_

- [ ] 12. Deploy and configure authentication system
- [ ] 12.1 Set up production authentication configuration
  - Configure Google OAuth credentials for production environment
  - Set up email service provider with production API keys
  - Configure secure session cookie settings for production
  - Add environment variables for all authentication settings
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12.2 Implement monitoring and cleanup jobs
  - Create scheduled job for cleaning up expired sessions and magic links
  - Add monitoring and alerting for authentication failure rates
  - Implement health checks for external authentication dependencies
  - Create documentation for authentication system maintenance
  - _Requirements: 6.7_