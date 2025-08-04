# Product Overview

**TodoHouse** is a modern task management application that allows users to create, manage, and organize their todos with features like priority levels, status tracking, and snoozing capabilities.

## 🚧 Current Phase: MVP Development

**Status**: Building core functionality first, polish later
**Approach**: Ship fast, iterate based on feedback
**Technical Debt**: Tracked as GitHub issues using the `todo-tracker-pm` agent

### MVP Development Philosophy
- **Speed over perfection**: Get features working first, polish later
- **Aim for full coverage**: Write complete unit tests for every feature
- **Feature scope**: Implement requested functionality only - nice-to-haves should be tracked using the `todo-tracker-pm` agent as [P2] items
- **Some technical debt is OK**: Confirm with the user when a refactor seems costly - the user will direct whether to refactor or accept technical debt

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
- **Learning-focused**: Master Python deeply through practical backend development
- **Clean architecture**: Proper separation of concerns with type safety
- **Database-agnostic**: Backend works with any PostgreSQL instance

## Development Goals
- Learn Python deeply through practical backend development
- Master SQLAlchemy ORM patterns with async/await
- Build database-agnostic backend (works with any PostgreSQL)
- Implement clean architecture with proper separation of concerns
- Build a production-ready monorepo structure
- Focus on clean code patterns and type safety