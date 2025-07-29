# Technical Debt & Production Improvements Tracker

> This file tracks improvements and concerns identified during MVP development that should be addressed before production deployment.

## Priority Levels
- **[P0]** - Critical: Must fix before production (security, data loss risks)
- **[P1]** - Important: Should fix for production quality
- **[P2]** - Nice-to-have: Improvements for better maintainability/performance

## Active Tracking

All technical debt and improvement items have been migrated to GitHub issues for better tracking and project management:

- **Performance Optimizations**: Issue #49 - Comprehensive performance improvements
- **Backend Code Quality**: Issue #50 - Architecture, testing, and code organization
- **Frontend & UX**: Issue #51 - Code quality, accessibility, and user experience
- **Infrastructure & DevOps**: Issue #52 - Deployment, monitoring, and operations
- **Testing Coverage**: Issue #40 - Comprehensive testing for all features
- **Error Handling**: Issue #41 - Error handling and UX improvements
- **Type Safety**: Issue #42 - Type safety fixes for mobile implementation
- **API Security**: Issue #39 - Supabase permissions and security configuration

## How to Use This File

1. **During Development**: When you identify something that should be improved but isn't critical for MVP, create a GitHub issue directly using the todo-tracker-pm agent
2. **During Reviews**: Use the todo-tracker-pm agent to convert PR feedback into properly tracked GitHub issues
3. **Planning Sessions**: Review GitHub issues with appropriate labels and priorities
4. **Priority Updates**: Adjust issue priorities in GitHub project board as business needs change

### Creating New Issues

Use the todo-tracker-pm agent or the create-issue.sh script:

```bash
echo '{
  "title": "Clear, actionable title",
  "body": "## Description\\n...\\n\\n## Acceptance Criteria\\n- [ ] ...",
  "labels": "backend,bug",
  "priority": "P1",
  "size": "S"
}' | ./.claude/scripts/create-issue.sh
```