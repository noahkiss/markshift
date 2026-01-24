# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Seamless, reliable conversion that fits into existing workflows - no more hunting for converters or manually cleaning up formatting
**Current focus:** Phase 6 complete, clipboard integration with --paste and --copy flags

## Current Position

Phase: 6 of 9 (Clipboard Integration) - COMPLETE
Plan: 1 of 1 in current phase
Status: Phase complete
Last activity: 2026-01-24 - Completed 06-01-PLAN.md

Progress: [######----] 67% (6/9 phases, 6/9 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 7.0 min
- Total execution time: 42 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1 | 4 min | 4 min |
| 02-html-to-markdown | 1 | 6 min | 6 min |
| 03-markdown-to-html | 1 | 3 min | 3 min |
| 04-cli-framework | 1 | 9 min | 9 min |
| 05-standard-io | 1 | 14 min | 14 min |
| 06-clipboard-integration | 1 | 6 min | 6 min |

**Recent Trend:**
- Last 5 plans: 02-01 (6 min), 03-01 (3 min), 04-01 (9 min), 05-01 (14 min), 06-01 (6 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Phase | Rationale |
|----------|-------|-----------|
| ESM over CommonJS | 01-01 | Modern tooling, better tree-shaking |
| Vitest over Jest | 01-01 | TypeScript-native, faster |
| tsx over ts-node | 01-01 | 25x faster startup |
| Simple Map registry | 01-01 | No DI frameworks needed |
| Sync converter interface | 01-01 | I/O happens outside converters |
| DomNode interface for turndown | 02-01 | Avoids browser DOM globals in Node.js |
| Flexible whitespace tests | 02-01 | Turndown spacing is valid CommonMark |
| Marked class instantiation | 03-01 | Configurable instance without global state |
| Commander.js for CLI | 04-01 | Industry standard, 238M+ weekly downloads |
| All non-data output to stderr | 04-01 | Keeps stdout clean for piping |
| GlobalOptions type assertion | 04-01 | optsWithGlobals() doesn't infer parent options |
| is-html for format detection | 05-01 | Standard HTML tags only, security-conscious |
| JSON envelope structure | 05-01 | content + metadata for machine-readable output |
| Centralized GlobalOptions | 05-01 | Shared types in src/cli/types.ts |
| @crosscopy/clipboard for multi-format | 06-01 | Supports HTML, RTF, text - clipboardy is text-only |
| ReadInputResult interface | 06-01 | Carry sourceFormat from clipboard reads |
| Mutual exclusivity enforcement | 06-01 | --paste/--copy cannot combine with file I/O |

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed 06-01-PLAN.md (Clipboard Integration)
Resume file: None

Phase 6 context (from 06-01-SUMMARY.md):
- Clipboard utilities at src/cli/utils/clipboard.ts (readClipboard, writeClipboard)
- Updated GlobalOptions with paste/copy flags
- Format preference chain: HTML > RTF > text
- RTF detection with warning (conversion in Phase 7)
- 169 total tests passing (13 new in Phase 6)

Clipboard integration complete:
- `markshift convert --paste` - Read from clipboard, auto-detect format
- `markshift convert --copy` - Write result to clipboard
- All commands support --paste and --copy global flags
- Mutual exclusivity: --paste cannot combine with file input, --copy cannot combine with file output
- Multi-format clipboard reading with HTML > RTF > text preference
