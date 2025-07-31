# Product Overview

todo.house is a modern task management application that allows users to create, manage, and organize their todos with features like priority levels, status tracking, and snoozing capabilities.

## 🚧 Current Phase: MVP Development

**Status**: Building core functionality first, polish later
**Approach**: Ship fast, iterate based on feedback
**Technical Debt**: Tracked in `/docs/todos.md` for post-MVP improvements

## Core Features (MVP)
- Task creation with title, description, and priority levels (low, medium, high)
- Task status management (active, snoozed, completed)
- Task snoozing with datetime scheduling
- Real-time task updates and management
- User-specific task isolation
- AI-powered task generation from uploaded images
- Task type categorization (interior, exterior, electricity, plumbing, etc.)

## Future Features (Post-MVP)
Features tracked in `/docs/todos.md` with priority levels:
- [P0] Critical bugs and security issues
- [P1] Important features and major UX improvements
- [P2] Nice-to-have enhancements and optimizations

## Architecture
Full-stack application with:
- **Frontend**: Next.js React application with TypeScript
- **Backend**: FastAPI Python API with Pydantic models
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Storage**: Supabase Storage for image uploads
- **AI Integration**: Google Gemini for image analysis and task generation
- **Authentication**: Header-based user identification (auth coming post-MVP)

## Target Users
Individuals and teams looking for a clean, efficient task management solution with modern web technologies.

## Development Philosophy
- **Speed over perfection**: Get features working, refine later
- **User feedback driven**: Ship MVP fast, iterate based on real usage
- **Technical debt is OK**: Track it, don't let it block shipping