# GitHub Actions Workflows

## Backend Tests (`backend-tests.yml`)

Runs on every push and pull request that affects the backend code.

### What it does:
- Sets up Python 3.13 environment
- Installs dependencies using `uv`
- Runs linting with `ruff`
- Runs type checking with `mypy`
- Runs all tests with `pytest`
- Generates code coverage reports

### Environment Variables:
- `DATABASE_URL`: Uses SQLite in-memory for CI tests
- `SUPABASE_URL`: Mock URL for storage tests
- `SUPABASE_KEY`: Mock key for storage tests
- `GEMINI_API_KEY`: Optional - uses mock if not set in secrets

### Required GitHub Secrets:
- `GEMINI_API_KEY` (optional): For running AI provider tests

## Frontend Tests (`frontend-tests.yml`)

Runs tests for the Next.js frontend application.

## Code Review (`claude-code-review.yml`)

Automated PR review using Claude AI during MVP phase.

### Features:
- Identifies critical issues only during MVP
- Creates GitHub issues for non-critical improvements
- Uses priority levels: [P0] Critical, [P1] Important, [P2] Nice-to-have
- Skips PRs with `[skip-review]` or `[WIP]` in title

## Setting up CI/CD

1. No additional setup needed for basic tests
2. Optionally add `GEMINI_API_KEY` to repository secrets for AI tests
3. Tests use SQLite in-memory database - no external database needed
4. Storage tests use mocked Supabase client