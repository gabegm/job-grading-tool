# Contributing

Thanks for your interest in the Job Grading Tool!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<username>/job-grading-tool.git`
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`

## Project Structure

```
src/
  lib/
    components/    # Svelte components
    engine/        # Scoring engine logic
    serializers/   # JSON/CSV import/export
    types/         # TypeScript type definitions
tests/           # Vitest test suites
sample-data/     # Example CSV and JSON datasets
```

## Testing

```bash
npm test          # Run tests
npm run test:coverage  # With coverage report
```

## Code Style

- TypeScript strict mode
- Svelte 5 component API
- Tailwind CSS for styling
- No trailing whitespace
- 2-space indentation

## Pull Requests

1. Describe the change
2. Include tests for new functionality
3. Ensure all tests pass (`npm test`)
4. Update README if needed

## Reporting Issues

Use GitHub Issues with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info if UI-related
