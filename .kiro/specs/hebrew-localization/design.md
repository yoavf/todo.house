# Design Document

## Overview

The Hebrew localization feature implements a comprehensive internationalization (i18n) solution for TodoHouse using next-intl for the frontend and python-babel for the backend. The design prioritizes performance, maintainability, and user experience while establishing a scalable foundation for future language additions.

## Architecture

### Frontend Architecture: Next.js App Router + next-intl

**Core Technology Stack:**. 
- **next-intl**: Primary i18n library chosen for its Next.js App Router compatibility, TypeScript support, and active maintenance
- **rtl-detect**: Automatic RTL detection and HTML direction setting
- **Header-based locale detection**: Accept-Language header parsing with future user setting override
- **Single URL structure**: No locale-specific URLs, maintaining clean routing

### Backend Architecture: FastAPI + Extended PromptService

**Locale Detection:**
- Header-based locale detection using existing `Accept-Language` header parsing
- Fallback chain: URL locale → Header locale → Default (en)

**AI Prompt Localization:**
- Extended `PromptService` class with locale-aware prompt loading
- Directory structure supporting locale-specific prompts with fallbacks
- Hybrid prompt strategy: English technical instructions with Hebrew examples

### Database Considerations

**No Schema Changes Required:**
- Existing UUID-based user identification supports locale preferences
- Task content remains in user's input language (not translated)
- Locale preference can be stored in user session or browser storage

## Components and Interfaces

### Frontend Components

#### 1. Locale Detection Service
```typescript
// src/lib/locale-detection.ts
export function detectLocale(request: Request): string {
  // Parse Accept-Language header
  // Future: Check user setting override
  // Fallback to 'en'
}
```

**Responsibilities:**
- Parse Accept-Language header for locale preference
- Provide fallback to English for unsupported locales
- Prepare for future user setting integration
- Set locale context for downstream components

#### 2. Localized Layout Component
```typescript
// src/app/layout.tsx
interface RootLayoutProps {
  children: React.ReactNode;
}
```

**Responsibilities:**
- Detect locale from Accept-Language header
- Load locale-specific message bundles dynamically
- Set HTML direction (LTR/RTL) based on detected locale
- Provide NextIntlClientProvider context
- Handle invalid locale fallbacks

#### 3. Translation Hook Integration
```typescript
// Usage in components
const t = useTranslations();
const deleteText = t('common.delete');
const confirmMessage = t('dialogs.deleteConfirm', { title: task.title });
```

**Features:**
- Type-safe translation keys
- Parameter interpolation support
- Namespace organization for better maintainability

#### 4. RTL-Aware UI Components

**Button Components:**
- Automatic icon mirroring for directional elements
- Proper spacing adjustments for RTL text
- Consistent interaction patterns

**Form Components:**
- Input field alignment (right-aligned for Hebrew)
- Label positioning adjustments
- Validation message positioning

**Navigation Components:**
- Menu slide direction reversal
- Breadcrumb arrow direction
- Tab navigation order

### Backend Components

#### 1. Enhanced PromptService
```python
class PromptService:
    def get_prompt(self, prompt_name: str, locale: str = "en") -> str:
        """Load locale-specific prompt with fallback."""
```

**Features:**
- Locale-specific prompt directory structure
- LRU caching for performance
- Metrics tracking for prompt effectiveness

#### 2. Locale-Aware Image Processing
```python
class ImageProcessor:
    async def analyze_image(
        self, image: bytes, user_id: str, locale: str = "en"
    ) -> List[Task]:
```

**Responsibilities:**
- Accept locale parameter from API requests
- Pass locale to PromptService for appropriate prompt selection
- Track success metrics by locale
- Handle fallback scenarios gracefully

#### 3. API Endpoint Modifications

**Header Processing:**
- Extract `Accept-Language` header from requests
- Parse locale preference with quality values
- Default to 'en' for unsupported locales

**Response Localization:**
- Error messages remain in English (technical)
- User-facing validation messages use locale-aware formatting
- Date/time formatting respects locale conventions

## Data Models

### Translation Message Structure
```json
{
  "common": {
    "delete": "Delete Task",
    "cancel": "Cancel",
    "confirm": "Do it"
  },
  "dialogs": {
    "deleteConfirm": "Are you sure you want to delete \"{title}\"?"
  },
  "time": {
    "tomorrow": "Tomorrow",
    "thisWeekend": "This weekend"
  },
  "tasks": {
    "priority": {
      "low": "Low",
      "medium": "Medium", 
      "high": "High"
    },
    "status": {
      "active": "Active",
      "snoozed": "Snoozed",
      "completed": "Completed"
    }
  }
}
```

### Prompt Directory Structure
```
backend/app/ai/prompts/
├── locales/
│   ├── en/
│   │   └── home_maintenance_analysis.txt
│   └── he/
│       └── home_maintenance_analysis.txt
└── home_maintenance_analysis.txt (fallback)
```

### Locale Configuration
```typescript
// src/i18n/config.ts
export const supportedLocales = ['en', 'he'] as const;
export const defaultLocale = 'en';
export type Locale = typeof supportedLocales[number];

export function parseAcceptLanguage(header: string): Locale {
  // Parse Accept-Language header and return supported locale
}
```

## Error Handling

### Frontend Error Scenarios

**Missing Translation Keys:**
- Fallback to English translation
- Log warning for missing keys in development
- Display key name as last resort

**Invalid Locale Detection:**
- Fallback to default locale (English) without URL changes
- Maintain current page state
- Log unsupported locale attempts

**RTL Layout Issues:**
- Graceful degradation to LTR layout
- Component-level RTL detection
- CSS logical properties for automatic handling

### Backend Error Scenarios

**Prompt Loading Failures:**
- Error logging with locale context
- Maintain service availability

**AI Processing Errors:**
- Retry with English prompts if Hebrew fails
- Track failure rates by locale
- Preserve user experience

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Translation key coverage verification
- RTL component rendering tests
- Locale detection logic validation
- Message interpolation accuracy

**Integration Tests:**
- End-to-end locale switching flows
- RTL layout visual regression tests
- Performance impact measurement
- Bundle size validation



### Backend Testing

**Unit Tests:**
- PromptService locale resolution
- Fallback mechanism validation
- Locale header parsing accuracy
- AI prompt effectiveness comparison

**Integration Tests:**
- Full image analysis workflow with Hebrew prompts
- API response localization
- Performance benchmarking by locale



## Performance Considerations

### Bundle Size Optimization

**Code Splitting:**
- Locale-specific message bundles loaded on demand
- Dynamic imports for translation files
- Tree-shaking of unused translations

**Estimated Impact:**
- next-intl: ~18KB gzipped
- rtl-detect: ~2KB
- Hebrew messages: ~8KB
- **Total**: ~28KB additional for Hebrew users

### Runtime Performance

**Translation Loading:**
- LRU cache for frequently used translations
- Preload critical translations during app initialization
- Lazy load secondary translations

**RTL Rendering:**
- CSS logical properties for automatic RTL handling
- Minimal JavaScript for direction detection
- Hardware-accelerated CSS transforms for mirroring

### Caching Strategy

**Browser Caching:**
- Long-term caching for translation files
- Version-based cache invalidation
- Service worker integration for offline support

**Server Caching:**
- Prompt template caching with locale keys
- AI response caching by image hash and locale
- CDN integration for translation file delivery

## Security Considerations

### Input Validation

**Locale Parameter Validation:**
- Whitelist supported locales
- Sanitize locale strings to prevent injection
- Validate locale format against expected patterns

**Translation Content Security:**
- Escape HTML in translation values
- Validate translation file integrity
- Prevent XSS through malicious translations

### Privacy Considerations

**Locale Preference Storage:**
- Client-side storage for locale preferences
- No server-side tracking of language choices
- GDPR compliance for EU users

## Deployment Strategy

### Phased Rollout

**Phase 1: Infrastructure**
- Deploy Accept-Language header detection
- Enable locale detection without Hebrew content
- Monitor for locale detection accuracy

**Phase 2: Frontend Localization**
- Deploy Hebrew translations and RTL support
- Enable language switching functionality
- Test Hebrew interface functionality

**Phase 3: Backend Enhancement**
- Deploy enhanced PromptService
- Enable Hebrew AI prompts for users
- Monitor AI processing success rates

**Phase 4: Full Rollout**
- Enable Hebrew localization for all users
- Monitor performance and error rates
- Collect user feedback and usage metrics

### Monitoring and Metrics

**Performance Metrics:**
- Translation loading time by locale
- Bundle size impact measurement
- RTL rendering performance
- AI processing success rates by locale

**Usage Metrics:**
- Locale selection distribution
- User retention by language preference
- Feature adoption in Hebrew interface
- Task creation success rates by locale

**Error Monitoring:**
- Translation loading failures
- RTL layout rendering issues
- AI prompt processing errors
- Locale detection edge cases

This design provides a robust foundation for Hebrew localization while maintaining performance and establishing patterns for future language additions. The architecture balances immediate MVP needs with long-term scalability requirements.