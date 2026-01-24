---
phase: 06-clipboard-integration
plan: 01
subsystem: cli
tags: [clipboard, crosscopy, io, stdin, stdout]

# Dependency graph
requires:
  - phase: 05-standard-io
    provides: readInput/writeOutput I/O utilities, GlobalOptions type, CLI commands
provides:
  - Clipboard read/write utilities (readClipboard, writeClipboard)
  - --paste global flag for clipboard input
  - --copy global flag for clipboard output
  - Multi-format clipboard reading (HTML > RTF > text preference)
affects: [07-rtf-conversion, 08-web-service]

# Tech tracking
tech-stack:
  added: ["@crosscopy/clipboard"]
  patterns: [format-preference-chain, mutual-exclusivity-validation]

key-files:
  created:
    - src/cli/utils/clipboard.ts
    - tests/cli/clipboard.test.ts
    - tests/cli/io.test.ts
  modified:
    - src/cli/types.ts
    - src/cli/program.ts
    - src/cli/utils/io.ts
    - src/cli/commands/convert.ts
    - src/cli/commands/html-to-md.ts
    - src/cli/commands/md-to-html.ts
    - package.json

key-decisions:
  - "@crosscopy/clipboard for multi-format clipboard access"
  - "ReadInputResult interface to carry sourceFormat from clipboard"
  - "Mutual exclusivity enforcement via early error throws"

patterns-established:
  - "Format preference chain: HTML > RTF > text when reading clipboard"
  - "Mutual exclusivity: --paste cannot combine with file input, --copy cannot combine with file output"
  - "RTF detection with deferred conversion warning"

# Metrics
duration: 6min
completed: 2026-01-24
---

# Phase 6 Plan 01: Clipboard Integration Summary

**Cross-platform clipboard read/write with @crosscopy/clipboard, multi-format detection (HTML > RTF > text), and --paste/--copy global flags on all CLI commands**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-24T05:10:00Z
- **Completed:** 2026-01-24T05:16:14Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Installed @crosscopy/clipboard for cross-platform clipboard access
- Created clipboard utilities with HTML > RTF > text preference order
- Added --paste and --copy global CLI options
- Updated all commands (convert, html-to-md, md-to-html) with clipboard support
- Enforced mutual exclusivity (--paste vs file, --copy vs file)
- Added RTF detection with Phase 7 warning message
- 169 total tests passing (13 new in Phase 6)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @crosscopy/clipboard and create clipboard utilities** - `a86d003` (feat)
2. **Task 2: Add --paste and --copy global options to CLI** - `0fe90a6` (feat)

## Files Created/Modified

- `src/cli/utils/clipboard.ts` - Clipboard read/write utilities with format detection
- `tests/cli/clipboard.test.ts` - Tests for clipboard module with mocked @crosscopy/clipboard
- `tests/cli/io.test.ts` - Tests for I/O integration with clipboard options
- `src/cli/types.ts` - Added paste/copy to GlobalOptions interface
- `src/cli/program.ts` - Added --paste and --copy global options
- `src/cli/utils/io.ts` - Added ReadInputOptions/WriteOutputOptions with clipboard integration
- `src/cli/commands/convert.ts` - Updated with clipboard support and RTF handling
- `src/cli/commands/html-to-md.ts` - Updated with clipboard support and RTF error
- `src/cli/commands/md-to-html.ts` - Updated with clipboard support and RTF error
- `package.json` - Added @crosscopy/clipboard dependency

## Decisions Made

- Used @crosscopy/clipboard over clipboardy for multi-format support (HTML, RTF, text)
- Created ReadInputResult interface to carry sourceFormat from clipboard reads
- For RTF on html-to-md/md-to-html: throw error directing to convert command or Phase 7
- For RTF on convert: log warning and treat as plain text

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Clipboard integration complete with full test coverage
- RTF detection works, but RTF-to-Markdown conversion deferred to Phase 7
- All success criteria met:
  - [x] @crosscopy/clipboard installed and working
  - [x] readClipboard() reads with HTML > RTF > text preference
  - [x] writeClipboard() writes to system clipboard
  - [x] --paste flag reads from clipboard on all commands
  - [x] --copy flag writes to clipboard on all commands
  - [x] Mutual exclusivity enforced (--paste vs file, --copy vs file)
  - [x] RTF detection works with appropriate messaging
  - [x] All tests pass (169 total)

---
*Phase: 06-clipboard-integration*
*Completed: 2026-01-24*
