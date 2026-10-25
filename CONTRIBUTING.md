# Contributing to CelebriteAI

## Development Setup
1. Clone the repo
2. `npm install`
3. `npm run dev`

## Running Tests
`npm test` — runs 38+ Vitest tests

## Code Style
- TypeScript strict mode
- Functional components with hooks
- Props typed with interfaces
- All interactive elements must have aria-label or visible text

## Architecture
- `src/components/` — React UI components
- `src/services/` — AI/heuristic engine
- `src/hooks/` — Custom React hooks
- `src/types/` — TypeScript interfaces
- `src/utils/` — Pure utility functions
- `src/test/` — Vitest test suites
