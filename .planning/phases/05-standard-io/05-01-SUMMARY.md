---
phase: 05-standard-io
plan: 01
subsystem: cli
tags: [stdin, stdout, json, format-detection, is-html, piping]

# Dependency graph
requires:
  - phase: 04-cli-framework
    provides: CLI program structure with html-to-md and md-to-html commands
provides:
  - Format auto-detection via is-html library
  - New convert command with auto-detection
  - Global --json flag for machine-readable output
  - JSON output structure with content and metadata
affects: [06-error-handling, 07-rtf-support, 08-clipboard]

# Tech tracking
tech-stack:
  added: [is-html]
  patterns: [format-detection, json-output-envelope, performance-timing]

key-files:
  created:
    - src/cli/utils/format-detect.ts
    - src/cli/types.ts
    - src/cli/commands/convert.ts
    - tests/cli/format-detect.test.ts
    - tests/cli/convert.test.ts
    - tests/cli/json-output.test.ts
  modified:
    - package.json
    - src/cli/program.ts
    - src/cli/commands/html-to-md.ts
    - src/cli/commands/md-to-html.ts

key-decisions:
  - "is-html library for HTML detection (standard tags only, rejects custom tags)"
  - "JSON envelope with content + metadata structure"
  - "toJsonOutput helper for consistent JSON generation"
  - "performance.now() for accurate timing measurement"
  - "JSON mode suppresses logger output"

patterns-established:
  - "Format detection pattern: detectFormat() returns Format type"
  - "JSON output envelope: { content, metadata: { sourceFormat, targetFormat, processingTimeMs, inputLength, outputLength } }"
  - "GlobalOptions type centralized in src/cli/types.ts"

# Metrics
duration: 14min
completed: 2026-01-24
---

# Phase 5 Plan 1: Standard I/O Summary

**stdin/stdout piping with auto-detection via is-html, new convert command, and --json output for all commands**

## Performance

- **Duration:** 14 min
- **Started:** 2026-01-24T00:44:51Z
- **Completed:** 2026-01-24T00:58:29Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Format detection using is-html library (detects standard HTML tags)
- New `convert` command auto-detects format and converts in the appropriate direction
- Global `--json` flag produces structured JSON output with content and metadata
- All three commands (convert, html-to-md, md-to-html) support --json flag
- 50 new tests (22 format-detect, 10 convert, 18 json-output)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install is-html and create format detection module** - `4f5c4dc` (feat)
2. **Task 2: Add JSON output types and global --json flag** - `389822d` (feat)
3. **Task 3: Create convert command and update existing commands** - `7582aae` (feat)

## Files Created/Modified
- `src/cli/utils/format-detect.ts` - detectFormat() using is-html
- `src/cli/types.ts` - GlobalOptions, JsonOutput, toJsonOutput()
- `src/cli/commands/convert.ts` - Auto-detect convert command
- `src/cli/program.ts` - Added --json global flag and convert command
- `src/cli/commands/html-to-md.ts` - Added --json support
- `src/cli/commands/md-to-html.ts` - Added --json support
- `tests/cli/format-detect.test.ts` - 22 format detection tests
- `tests/cli/convert.test.ts` - 10 convert command unit tests
- `tests/cli/json-output.test.ts` - 18 JSON output tests

## Decisions Made
- **is-html for detection**: Standard HTML tag recognition, rejects custom/unknown tags like `<cake>` (security-conscious)
- **JSON envelope structure**: `{ content: string, metadata: { sourceFormat, targetFormat, processingTimeMs, inputLength, outputLength } }`
- **Centralized GlobalOptions**: Moved from local interfaces in each command to shared `src/cli/types.ts`
- **JSON mode suppresses logs**: Logger receives `quiet || json` to prevent mixing JSON with log output
- **Unit tests over subprocess tests**: Avoided slow subprocess integration tests in favor of fast unit tests testing the logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial attempt at subprocess integration tests caused 5-second timeouts per test (npx tsx startup time)
- Resolved by rewriting tests as unit tests that directly test format detection, conversion, and JSON output logic

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Standard I/O complete, ready for Phase 6 (Error Handling & Diagnostics)
- JSON output ready for agent integration
- Format detection ready for RTF extension in Phase 7

---
*Phase: 05-standard-io*
*Completed: 2026-01-24*
