# Technical Debt & Production Improvements Tracker

> This file tracks improvements and concerns identified during MVP development that should be addressed before production deployment.

## Priority Levels
- **[P0]** - Critical: Must fix before production (security, data loss risks)
- **[P1]** - Important: Should fix for production quality
- **[P2]** - Nice-to-have: Improvements for better maintainability/performance

## Image Upload Feature Improvements

### Code Quality & Architecture
- [ ] [P1] Add comprehensive integration tests for image upload workflow (currently only basic TaskList tests exist)
- [ ] [P1] Replace hardcoded TEST_USER_ID with proper authentication system (`frontend/src/lib/api.ts:59`)
- [ ] [P2] Extract file validation constants to shared config (duplicated in frontend and backend)
- [ ] [P2] Add input sanitization for filename display to prevent XSS (`frontend/src/components/ImageUpload.tsx:211`)

### Error Handling & UX
- [ ] [P1] Add retry mechanism for failed image uploads in frontend
- [ ] [P1] Implement proper loading states during task creation from analysis (`frontend/src/components/GeneratedTasksPreview.tsx:57-77`)
- [ ] [P2] Add toast notifications for better user feedback instead of inline messages
- [ ] [P2] Add image preview persistence across page refreshes

### Performance & Reliability  
- [ ] [P1] Add proper error boundary component for image upload failures
- [ ] [P2] Implement image compression preview before upload to show expected processing
- [ ] [P2] Add debouncing to prevent multiple simultaneous uploads
- [ ] [P2] Consider implementing upload progress tracking from backend

### Testing & Monitoring
- [ ] [P1] Add unit tests for ImageUpload and GeneratedTasksPreview components
- [ ] [P1] Add integration tests that verify end-to-end image analysis workflow
- [ ] [P2] Add error tracking/monitoring for AI analysis failures
- [ ] [P2] Add metrics collection for image processing success rates

### Documentation & Development
- [ ] [P2] Document AI prompt engineering approach and confidence scoring algorithm
- [ ] [P2] Add JSDoc comments to complex processing functions
- [ ] [P2] Create development setup docs for local AI provider testing

## Mobile Camera Capture - Post-MVP Improvements

### Code Quality & Robustness
- [ ] [P1] Fix type casting in ImageUpload.tsx:148 - Replace `[file] as unknown as FileList` with proper FileList construction or API refactor
- [ ] [P1] Replace setTimeout with proper async/await in CameraCapture.tsx:147-149 for camera switching to prevent race conditions
- [ ] [P2] Enhance mobile detection logic with more robust feature detection instead of user agent parsing
- [ ] [P2] Add proper cleanup for blob URLs in ImageUpload component lifecycle to prevent memory leaks

### User Experience  
- [ ] [P1] Add loading states during camera initialization to improve perceived performance
- [ ] [P2] Implement camera resolution selection based on device capabilities
- [ ] [P2] Add haptic feedback for mobile photo capture on supported devices
- [ ] [P2] Consider adding flash toggle for low-light scenarios

### Testing & Error Handling
- [ ] [P2] Add integration tests for camera switching functionality
- [ ] [P2] Add tests for mobile detection edge cases (tablets, hybrid devices)
- [ ] [P2] Test camera functionality across different mobile browsers (Safari, Chrome Mobile, Samsung Internet)

### Performance & Optimization
- [ ] [P2] Optimize canvas operations for better performance on lower-end devices
- [ ] [P2] Add image quality adjustment based on device capabilities and network conditions
- [ ] [P2] Consider implementing image compression before processing

## Backend Improvements

### Security & Authentication
- [ ] [P0] Implement proper authentication instead of X-User-Id headers
- [ ] [P0] Add rate limiting to prevent API abuse
- [ ] [P0] **VERIFY SUPABASE STORAGE BUCKET PERMISSIONS AND RLS POLICIES** - Currently using permissive policies for development. Must properly configure:
  - Storage bucket RLS policies to restrict uploads/access by authenticated users only
  - Image table RLS policies to use proper auth.uid() checks instead of `true`
  - Storage bucket MIME type restrictions and file size limits
  - Proper CORS configuration for storage bucket
- [ ] [P1] Implement CORS configuration for production domains
- [ ] [P1] Add API key management for service-to-service communication
- [ ] [P2] Implement request signing for sensitive operations

### Data Validation & Error Handling
- [ ] [P1] Add comprehensive input validation for all endpoints
- [ ] [P1] Implement proper error response schemas
- [ ] [P1] Add request/response logging with correlation IDs
- [ ] [P2] Create custom exception handlers for better error messages

### Performance & Scalability
- [ ] [P1] Add database connection pooling configuration
- [ ] [P1] Implement caching strategy (Redis/in-memory)
- [ ] [P2] Add pagination for list endpoints
- [ ] [P2] Optimize database queries with proper indexing

### Code Quality
- [ ] [P1] Add comprehensive API documentation with examples
- [ ] [P1] Implement dependency injection for better testability
- [ ] [P2] Add database migration system (Alembic)
- [ ] [P2] Create service layer to separate business logic from routes
- [ ] [P2] Refactor AI providers into separate files (providers/base.py, providers/gemini.py, providers/mock.py) for better organization
- [ ] [P2] Add maxLength validation to AI task titles once Gemini supports it in response_schema
- [ ] [P1] Improve token estimation beyond rough "length // 4" calculation - implement proper tokenizer
- [ ] [P2] Extract AI provider cost calculation constants to configuration instead of hardcoded values

## Frontend Improvements

### User Experience
- [ ] [P1] Add proper loading states for all async operations
- [ ] [P1] Implement optimistic updates for better perceived performance
- [ ] [P1] Add error boundaries for graceful error handling
- [ ] [P2] Implement keyboard shortcuts for power users
- [ ] [P2] Add accessibility improvements - aria-labels for all SVG icons (disabled in biome.json during MVP)
- [ ] [P1] Fix accessibility: Proper label-input associations for custom checkbox implementations (noLabelWithoutControl disabled in biome.json during MVP)

### Performance
- [ ] [P1] Add proper image optimization and lazy loading
- [ ] [P1] Implement code splitting for faster initial load
- [ ] [P2] Add service worker for offline functionality
- [ ] [P2] Implement virtual scrolling for large lists

### Code Quality
- [ ] [P1] Add comprehensive TypeScript types for all API responses
- [ ] [P1] Implement proper state management (Redux/Zustand)
- [ ] [P2] Add E2E tests with Playwright/Cypress
- [ ] [P2] Create component library documentation

## Infrastructure & DevOps

### Monitoring & Observability
- [ ] [P0] Add application monitoring (Sentry/Datadog)
- [ ] [P1] Implement structured logging
- [ ] [P1] Add performance monitoring and alerting
- [ ] [P2] Create dashboards for key metrics

### Deployment & CI/CD
- [ ] [P1] Add staging environment configuration
- [ ] [P1] Implement blue-green deployment strategy
- [ ] [P1] Add database backup and restore procedures
- [ ] [P2] Implement infrastructure as code (Terraform/CDK)

### Testing
- [ ] [P1] Achieve >80% test coverage for critical paths
- [ ] [P1] Add integration tests for API endpoints
- [ ] [P1] Implement load testing for performance baselines
- [ ] [P2] Add visual regression testing for UI

## Documentation

- [ ] [P1] Create API documentation with OpenAPI/Swagger
- [ ] [P1] Write deployment and operations guide
- [ ] [P1] Document architecture decisions (ADRs)
- [ ] [P2] Create developer onboarding guide
- [ ] [P2] Add troubleshooting guide for common issues

---

## How to Use This File

1. **During Development**: When you identify something that should be improved but isn't critical for MVP, add it here
2. **During Reviews**: Copy non-critical feedback from PR reviews here
3. **Planning Sessions**: Use this as input for post-MVP improvement sprints
4. **Priority Updates**: Adjust priorities as business needs change

### Adding New Items

Format: `- [ ] [Priority] Description of improvement needed`

Example:
```markdown
- [ ] [P1] Add retry logic for failed Supabase connections
```