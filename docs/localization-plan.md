# TodoHouse Localization Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing Hebrew localization in TodoHouse, enabling the app to serve Hebrew-speaking users during the MVP phase. The implementation follows a phased approach prioritizing quick wins while maintaining scalability for future languages.

## Goals

- **Primary**: Enable full Hebrew UI for MVP launch
- **Secondary**: Establish scalable i18n infrastructure for future languages
- **Technical**: Maintain performance and code quality during localization

## Architecture Decisions

### Frontend: Next.js App Router + next-intl

**Why next-intl:**
- Built specifically for Next.js App Router (v12-15)
- Excellent TypeScript support with type-safe translations
- Active development with 708K+ weekly downloads
- Server Component compatible

**Implementation approach:**
- URL-based locale switching (`/he/tasks` vs `/en/tasks`)
- Co-located translation files (`messages/en.json`, `messages/he.json`)
- Middleware-based locale detection

### Backend: FastAPI + python-babel

**Leveraging existing infrastructure:**
- Already using Babel for date formatting
- Extend to handle message catalogs
- Header-based locale detection (already implemented)

### AI Prompts: Locale-Aware PromptService

**Smart architecture reuse:**
- Extend existing `PromptService` class
- Locale-specific prompt directories
- Fallback mechanism for robustness

## Implementation Phases

### Phase 0: Pre-Implementation Setup (Day 1 Morning)

**RTL Support Configuration:**
```bash
pnpm install rtl-detect --save
```

**TypeScript Setup:**
```typescript
// types/next-intl.d.ts
import en from '../messages/en.json';
type Messages = typeof en;
declare global {
  interface IntlMessages extends Messages {}
}
```

**Routing Configuration:**
```typescript
// src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'he'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});
```

### Phase 1: Infrastructure Implementation (Day 1)

#### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend && pnpm install next-intl rtl-detect
   ```

2. **Create middleware:**
   ```typescript
   // frontend/src/middleware.ts
   import createMiddleware from 'next-intl/middleware';
   import {routing} from './i18n/routing';
   
   export default createMiddleware(routing);
   
   export const config = {
     matcher: ['/', '/(he|en)/:path*']
   };
   ```

3. **Update root layout for RTL:**
   ```typescript
   // frontend/src/app/[locale]/layout.tsx
   import {notFound} from 'next/navigation';
   import {NextIntlClientProvider} from 'next-intl';
   import {getLangDir} from 'rtl-detect';
   
   export default async function LocaleLayout({
     children,
     params: {locale}
   }: {
     children: React.ReactNode;
     params: {locale: string};
   }) {
     const messages = await import(`../../messages/${locale}.json`);
     const direction = getLangDir(locale);
     
     return (
       <html lang={locale} dir={direction}>
         <body>
           <NextIntlClientProvider messages={messages.default}>
             {children}
           </NextIntlClientProvider>
         </body>
       </html>
     );
   }
   ```

#### Backend Enhancement

1. **Extend PromptService:**
   ```python
   # backend/app/ai/prompt_service.py
   @lru_cache(maxsize=128)
   def get_prompt(self, prompt_name: str, locale: str = "en") -> str:
       """Load a prompt by name with locale support."""
       # Try locale-specific prompt first
       locale_path = os.path.join(
           self.prompts_dir, "locales", locale, f"{prompt_name}.txt"
       )
       if os.path.exists(locale_path):
           return self._load_prompt_file(locale_path)
       
       # Fall back to default
       return self._load_prompt_file(
           os.path.join(self.prompts_dir, f"{prompt_name}.txt")
       )
   ```

2. **Create prompt directory structure:**
   ```
   backend/app/ai/prompts/
   ├── locales/
   │   ├── en/
   │   │   └── home_maintenance_analysis.txt
   │   └── he/
   │       └── home_maintenance_analysis.txt
   └── home_maintenance_analysis.txt (fallback)
   ```

### Phase 2: Content Translation (Day 2-3)

#### Frontend Messages Structure

**Create translation files:**

```json
// frontend/messages/en.json
{
  "common": {
    "delete": "Delete Task",
    "cancel": "Cancel",
    "confirm": "Do it",
    "snooze": "Snooze",
    "unsnooze": "Unsnooze"
  },
  "dialogs": {
    "deleteConfirm": "Are you sure you want to delete \"{title}\"?",
    "deleteDescription": "This action cannot be undone."
  },
  "time": {
    "tomorrow": "Tomorrow",
    "thisWeekend": "This weekend",
    "nextWeek": "Next week",
    "later": "Later"
  },
  "errors": {
    "generic": "Something went wrong",
    "network": "Network error. Please try again."
  }
}
```

```json
// frontend/messages/he.json
{
  "common": {
    "delete": "מחק משימה",
    "cancel": "ביטול",
    "confirm": "בצע",
    "snooze": "דחה",
    "unsnooze": "בטל דחייה"
  },
  "dialogs": {
    "deleteConfirm": "האם אתה בטוח שברצונך למחוק את \"{title}\"?",
    "deleteDescription": "פעולה זו אינה ניתנת לביטול."
  },
  "time": {
    "tomorrow": "מחר",
    "thisWeekend": "סוף השבוע",
    "nextWeek": "שבוע הבא",
    "later": "מאוחר יותר"
  },
  "errors": {
    "generic": "משהו השתבש",
    "network": "שגיאת רשת. אנא נסה שוב."
  }
}
```

#### Component Updates

```typescript
// Example: TaskItem.tsx
import {useTranslations} from 'next-intl';

export function TaskItem({task}: {task: Task}) {
  const t = useTranslations();
  
  return (
    <div>
      {/* ... */}
      <button>{t('common.delete')}</button>
    </div>
  );
}
```

#### AI Prompt Translation Strategy

**Hybrid Approach (Recommended for MVP):**

```text
// backend/app/ai/prompts/locales/he/home_maintenance_analysis.txt
You are a home maintenance expert analyzing an image to identify maintenance tasks.

[Keep technical instructions in English for accuracy]

דוגמאות למשימות:
- ניקוי: "נקה את המזגן" - הסרת אבק ולכלוך מפילטרים
- תיקון: "תקן את הברז הדולף" - החלפת אטמים או תיקון נזילה
- בטיחות: "החלף גלאי עשן" - וודא שגלאי העשן תקינים

[Continue with English technical specifications...]
```

### Phase 3: Testing & Optimization (Day 4)

#### Testing Infrastructure

1. **Create A/B test for prompt effectiveness:**
   ```python
   # backend/app/ai/image_processing.py
   async def process_with_ab_test(
       self, image: bytes, user_id: str, locale: str
   ) -> dict:
       # A/B test: 50% Hebrew prompts, 50% English
       use_hebrew = hash(user_id) % 2 == 0 and locale == "he"
       prompt_locale = "he" if use_hebrew else "en"
       
       # Track metrics
       self.metrics.track_prompt_usage(prompt_locale, user_id)
       
       # Process with selected prompt
       return await self.process(image, prompt_locale)
   ```

2. **RTL Layout Testing:**
   - Verify all UI components mirror correctly
   - Test swipe gestures in RTL mode
   - Validate form inputs and text alignment

3. **Performance Testing:**
   - Measure bundle size impact
   - Test dynamic vs static rendering performance
   - Validate translation loading speed

### Phase 4: Deployment Preparation (Day 5)

#### Monitoring Setup

```python
# backend/app/monitoring/i18n_metrics.py
class I18nMetrics:
    def track_ai_task_extraction(
        self, locale: str, success: bool, confidence: float
    ):
        """Track AI task extraction success by locale"""
        # Implementation for tracking metrics
        
    def track_ui_locale_usage(self, locale: str, user_id: str):
        """Track which locales users are selecting"""
        # Implementation for usage tracking
```

#### Documentation

1. **Translation Guidelines:**
   - Key naming conventions
   - Hebrew style guide
   - Technical term handling

2. **Developer Documentation:**
   - How to add new translations
   - Testing localized features
   - Debugging RTL issues

## Technical Considerations

### RTL Support Checklist

- [ ] HTML dir attribute set correctly
- [ ] Tailwind RTL utilities configured
- [ ] Logical CSS properties used (marginInlineStart vs marginLeft)
- [ ] Icons and directional elements flipped
- [ ] Swipe gestures reversed for RTL
- [ ] Form inputs aligned correctly

### Performance Optimizations

1. **Code Splitting:**
   ```typescript
   // Lazy load Hebrew messages
   const messages = locale === 'he' 
     ? await import('./messages/he.json')
     : await import('./messages/en.json');
   ```

2. **Static Rendering Workaround:**
   ```typescript
   // In each page/layout
   import {setRequestLocale} from 'next-intl/server';
   
   export default function Page({params: {locale}}) {
     setRequestLocale(locale);
     // ... rest of component
   }
   ```

### Bundle Size Considerations

- next-intl: ~18-19KB gzipped
- rtl-detect: ~2KB
- Hebrew messages: ~5-10KB (estimated)
- **Total impact**: ~25-30KB for Hebrew users

## Risk Mitigation

### AI Prompt Performance

**Risk**: Hebrew prompts may reduce task extraction accuracy

**Mitigation:**
1. Start with hybrid prompts (English instructions, Hebrew examples)
2. A/B test thoroughly before full migration
3. Maintain fallback to English prompts
4. Monitor extraction success rates per locale

### Technical Debt

**Accepted for MVP:**
- Dynamic rendering (optimize post-launch)
- Manual RTL handling in some components
- English-only AI prompts initially

**Not Acceptable:**
- Missing translations for core UI
- Broken RTL layouts
- Locale detection failures

## Success Metrics

1. **Technical Metrics:**
   - 100% UI string coverage in Hebrew
   - <50ms translation loading time
   - <5% reduction in AI task extraction accuracy

2. **User Metrics:**
   - Hebrew locale adoption rate
   - User retention by locale
   - Task creation success rate by language

## Timeline Summary

- **Day 1**: Infrastructure setup (RTL, TypeScript, routing)
- **Day 2**: Frontend i18n implementation
- **Day 3**: Backend localization + AI prompt structure
- **Day 4**: Hebrew translations + testing
- **Day 5**: Performance optimization + deployment prep

**Total Duration**: 5 days (adjusted from original 3-4 day estimate)

## Future Roadmap

1. **Post-MVP Optimizations:**
   - Enable static rendering with next-intl
   - Optimize bundle splitting
   - Full Hebrew AI prompts

2. **Additional Languages:**
   - Arabic (RTL experience transfers)
   - Russian, Spanish (high demand)
   - Framework supports 100+ languages

3. **Enhanced Features:**
   - Locale-specific date/time formatting
   - Cultural adaptations (workweek differences)
   - Regional task categories

## Conclusion

This localization plan provides a robust foundation for Hebrew support while maintaining flexibility for future expansion. The phased approach ensures quick MVP delivery while the architecture decisions support long-term scalability.

The hybrid AI prompt strategy balances immediate Hebrew UI availability with maintaining high-quality task extraction, allowing data-driven migration to full Hebrew prompts post-launch.