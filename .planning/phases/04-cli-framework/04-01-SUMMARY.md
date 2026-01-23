---
phase: 04-cli-framework
plan: 01
subsystem: cli
tags: [commander, typescript, cli, stdin, stdout]

# Dependency graph
requires:
  - phase: 02-html-to-markdown
    provides: HtmlToMarkdownConverter class
  - phase: 03-markdown-to-html
    provides: MarkdownToHtmlConverter class
provides:
  - CLI entry point (markshift command)
  - html-to-md subcommand for HTML to Markdown
  - md-to-html subcommand for Markdown to HTML
  - --quiet and --verbose global options
  - stdin/stdout and file I/O support
affects: [05-smart-processors, 06-automation]

# Tech tracking
tech-stack:
  added: [commander v14.0.2, @commander-js/extra-typings]
  patterns: [Commander.js subcommands, stderr for non-data output, exitOverride testing]

key-files:
  created:
    - src/cli/index.ts
    - src/cli/program.ts
    - src/cli/commands/html-to-md.ts
    - src/cli/commands/md-to-html.ts
    - src/cli/utils/logger.ts
    - src/cli/utils/io.ts
    - tests/cli/cli.test.ts
  modified:
    - package.json

key-decisions:
  - "@commander-js/extra-typings for TypeScript inference"
  - "GlobalOptions interface with type assertion for optsWithGlobals()"
  - "All non-data output to stderr for pipe compatibility"
  - "Commander.error() for consistent error handling with exit codes"

patterns-established:
  - "Subcommand pattern: export const xxxCommand = new Command()"
  - "Logger pattern: createLogger(quiet, verbose) with info/verbose/error"
  - "I/O pattern: readInput(path?) and writeOutput(path?, content)"
  - "Test pattern: exitOverride() with configureOutput() for CLI testing"

# Metrics
duration: 9min
completed: 2026-01-23
---

# Phase 4 Plan 1: CLI Framework Summary

**Commander.js CLI with html-to-md and md-to-html subcommands, stdin/stdout support, and quiet/verbose modes**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-23T20:57:40Z
- **Completed:** 2026-01-23T21:06:26Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Commander.js CLI framework with markshift command
- Two subcommands: html-to-md and md-to-html
- Global options: --quiet, --verbose, --version, --help
- stdin/file input and stdout/file output support
- 20 comprehensive CLI tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Commander and create CLI infrastructure** - `7e86dc2` (feat)
2. **Task 2: Implement html-to-md and md-to-html subcommands** - `cb6c195` (feat)
3. **Task 3: Add CLI tests** - `3fd8e6d` (test)

## Files Created/Modified
- `src/cli/index.ts` - CLI entry point with shebang
- `src/cli/program.ts` - Commander program with global options and subcommands
- `src/cli/commands/html-to-md.ts` - HTML to Markdown conversion subcommand
- `src/cli/commands/md-to-html.ts` - Markdown to HTML conversion subcommand
- `src/cli/utils/logger.ts` - Quiet/verbose aware logging utility
- `src/cli/utils/io.ts` - stdin/file and stdout/file I/O helpers
- `tests/cli/cli.test.ts` - 20 tests for CLI functionality
- `package.json` - Added bin config, cli script, commander dependencies

## Decisions Made
- Used @commander-js/extra-typings for better TypeScript type inference
- Created GlobalOptions interface with type assertion for optsWithGlobals() since it doesn't infer parent options
- All non-data output goes to stderr to keep stdout clean for piping
- Use Commander.error() for consistent error handling with proper exit codes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript compiler error with optsWithGlobals() not inferring parent options - resolved by creating GlobalOptions interface and using type assertion
- CLI tests for subcommand help required exitOverride on subcommand itself, not just parent - added exitOverride and configureOutput to test subcommands

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CLI framework complete with html-to-md and md-to-html subcommands
- Ready for Phase 5: Smart Processors (site-specific converters)
- CLI can be extended with additional subcommands
- Run with: `npm run cli -- <command>` or after build: `node dist/cli/index.js <command>`

---
*Phase: 04-cli-framework*
*Completed: 2026-01-23*
