# Development Guidelines

## Critical Rules (NEVER BYPASS)

### Pre-commit Hooks
- **NEVER bypass pre-commit hooks**: Every commit that modifies Python files automatically triggers:
  1. **Ruff**: Python linting and formatting checks
  2. **MyPy**: Static type checking  
  3. **Unit Tests**: All unit tests must pass before commit
- **If stuck**: Ask the user for guidance, never skip the hooks
- **Enforced via**: husky and lint-staged configuration in `package.json`

### Testing Requirements
- **Backend tests are mandatory**: Every new endpoint and business logic must have tests
- **Frontend tests are mandatory**: All components and functionality must be tested
- **Test structure**: Use `@pytest.mark.unit` and `@pytest.mark.integration` markers
- **Test isolation**: Each test gets unique user ID for data separation

## Code Quality Standards

### Comments and Documentation
- **Never add comments for perfectly self-explanatory code**
- **Comments should explain the "why" when it's not obvious, not document development history**
- **When refactoring**: Do not leave comments about what was changed or what was there before
- **Commit messages**: Do not include ghost fixes - if you introduced and fixed a bug since the last commit, don't mention it

### Python Development
- **Always use an opportunity to teach the user about Python**
- **Use libraries when possible instead of reinventing the wheel**
- **Follow async/await patterns with SQLAlchemy**
- **Maintain type safety with Pydantic models**

### Frontend Development
- **Use shadcn components whenever possible, with Tailwind**
- **Maintain TypeScript type safety throughout**
- **Follow Next.js App Router patterns**

## Database Guidelines

### Design Principles
- **UUIDs for all IDs**: Using PostgreSQL UUID type for user_id, image_id, etc. for security and scalability
- **String-based Enums**: Storing enums (priority, status, source) as strings rather than PostgreSQL enum types for flexibility
- **Standard Audit Columns**: All tables have `created_at` and `updated_at` timestamps
- **JSON for Arrays**: Using JSON type for arrays to avoid complexity of normalized junction tables

### Migration Management
- **SQLite fallback**: Ensure migrations work with SQLite for CI/tests
- **Always test migrations**: Run `uv run alembic upgrade head` after creating new migrations

## Environment Setup

### Virtual Environment
- **Location**: Single virtual environment at `/todohouse/.venv`
- **Python version**: 3.13+
- **Package manager**: `uv` (ultrafast Python package manager)
- **Important**: Always use the root-level venv when working with backend code

### Configuration Files
- **Backend**: `.env` for development, `.env.test` for testing
- **Frontend**: `.env.local` for configuration
- **Never commit secrets**: Use `.env.example` templates

## MVP Phase Approach

### Priority System
- **[P0]**: Critical security/breaking issues
- **[P1]**: Important functionality, major UX issues, missing tests  
- **[P2]**: Nice-to-haves, optimizations, minor enhancements

### Technical Debt Management
- **Use `todo-tracker-pm` agent**: Track all technical debt as GitHub issues
- **Confirm with user**: When a refactor seems costly, ask user whether to refactor or accept technical debt
- **Document deferrals**: Any skipped features or optimizations should be tracked with appropriate priority

### Development Memory
- **Speed over perfection**: Get features working first, polish later
- **Complete test coverage**: Write tests for all new functionality
- **Feature scope**: Implement requested functionality only - nice-to-haves go to backlog
- **Learning focus**: Use development as opportunity to master Python and modern web patterns
- **NEVER BYPASS PRE-COMMIT HOOKS**