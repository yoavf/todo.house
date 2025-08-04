# Implementation Plan

- [x] 1. Set up frontend internationalization infrastructure
  - Install next-intl and rtl-detect dependencies in frontend package
  - Create locale configuration with supported locales (en, he) and default locale
  - Implement Accept-Language header parsing utility function
  - Create TypeScript types for locale handling
  - _Requirements: 2.1, 5.4_

- [x] 2. Implement locale detection and context setup
  - Create locale detection service that parses Accept-Language header
  - Implement root layout component with dynamic locale detection
  - Set up NextIntlClientProvider with locale-specific message loading
  - Configure HTML direction (LTR/RTL) based on detected locale
  - Add fallback handling for unsupported locales
  - _Requirements: 2.1, 2.5, 1.3_

- [x] 3. Create translation message structure and English baseline
  - Create messages directory structure for translation files
  - Define comprehensive English translation file with all UI strings
  - Organize translations into logical namespaces (common, dialogs, time, tasks, errors)
  - Set up TypeScript interface for type-safe translation keys
  - Create translation loading utilities with proper error handling
  - _Requirements: 5.1, 5.5_

- [ ] 4. Implement Hebrew translations and RTL support
  - Create complete Hebrew translation file with all UI strings
  - Configure Tailwind CSS for RTL support with logical properties
  - Implement RTL-aware component styling and layout adjustments
  - Add Hebrew font support and text rendering optimizations
  - Test and fix directional UI elements (icons, buttons, navigation)
  - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 3.3, 3.6_

- [ ] 5. Update all frontend components to use translations
  - Replace hardcoded strings in task components with translation hooks
  - Update dialog components to use localized confirmation messages
  - Implement localized time-related text (tomorrow, this weekend, etc.)
  - Add localized error messages throughout the application
  - Update form components with proper RTL input alignment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [ ] 6. Enhance backend PromptService for locale support
  - Extend existing PromptService class to accept locale parameter
  - Create locale-specific prompt directory structure in backend
  - Implement prompt loading logic with locale-specific file resolution
  - Add LRU caching for locale-specific prompts
  - Create unit tests for locale-aware prompt loading
  - _Requirements: 4.1, 4.2_

- [ ] 7. Create Hebrew AI prompts for image analysis
  - Translate existing home maintenance analysis prompts to Hebrew
  - Implement hybrid prompt strategy with English technical instructions and Hebrew examples
  - Create Hebrew task examples for different categories (interior, exterior, etc.)
  - Test prompt effectiveness with sample images
  - Document Hebrew prompt structure and guidelines
  - _Requirements: 4.1, 4.2_

- [ ] 8. Update API endpoints to handle locale detection
  - Modify image analysis endpoint to extract locale from Accept-Language header
  - Pass locale parameter to enhanced PromptService
  - Update task-related endpoints to respect user locale
  - Add locale information to API response logging
  - Create integration tests for locale-aware API endpoints
  - _Requirements: 4.1, 4.5_

- [ ] 9. Implement performance optimizations
  - Set up dynamic loading for locale-specific translation bundles
  - Implement translation caching strategy for improved loading times
  - Optimize bundle size by code-splitting translation files
  - Add lazy loading for Hebrew-specific resources
  - Measure and validate performance impact stays within requirements
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Add monitoring and metrics tracking
  - Implement locale usage tracking for user preferences
  - Add AI processing success rate monitoring by locale
  - Create performance monitoring for translation loading times
  - Set up error tracking for locale-specific issues
  - Add logging for locale detection and fallback scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Create comprehensive test suite
  - Write unit tests for locale detection and translation loading
  - Create integration tests for RTL layout rendering
  - Test Hebrew AI prompt functionality with real image analysis
  - Add performance tests to validate loading time requirements
  - Create visual regression tests for RTL component layouts
  - _Requirements: 4.4, 5.5, 7.2, 7.3_

- [ ] 12. Final integration and deployment preparation
  - Test complete Hebrew localization workflow end-to-end
  - Validate all UI strings are properly translated and displayed
  - Verify RTL layout works correctly across all components
  - Test locale detection accuracy with various Accept-Language headers
  - Prepare deployment configuration for production rollout
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1_