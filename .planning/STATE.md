# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Seamless, reliable conversion that fits into existing workflows - no more hunting for converters or manually cleaning up formatting
**Current focus:** All v1 phases complete, milestone ready for audit

## Current Position

Phase: 9 of 9 (Platform & Distribution) - COMPLETE
Plan: 1 of 1 in current phase
Status: Milestone complete
Last activity: 2026-01-24 - Completed 09-01-PLAN.md

Progress: [##########] 100% (9/9 phases, 9/9 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 7.2 min
- Total execution time: 65 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1 | 4 min | 4 min |
| 02-html-to-markdown | 1 | 6 min | 6 min |
| 03-markdown-to-html | 1 | 3 min | 3 min |
| 04-cli-framework | 1 | 9 min | 9 min |
| 05-standard-io | 1 | 14 min | 14 min |
| 06-clipboard-integration | 1 | 6 min | 6 min |
| 07-rtf-pipeline | 1 | 10 min | 10 min |
| 08-content-extraction | 1 | 8 min | 8 min |
| 09-platform-distribution | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 05-01 (14 min), 06-01 (6 min), 07-01 (10 min), 08-01 (8 min), 09-01 (5 min)
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
| @iarna/rtf-to-html for RTF | 07-01 | Pure JS, ~8K downloads, handles macOS RTF |
| Pipeline pattern RTF->HTML->MD | 07-01 | Leverage existing HtmlToMarkdownConverter |
| Async converter for RTF | 07-01 | Library uses callback API, needs Promise |
| RTF magic bytes detection | 07-01 | Check {\rtf prefix in format-detect.ts |
| Skip isProbablyReaderable() | 08-01 | Doesn't work with linkedom; validate parse result instead |
| 100 char content threshold | 08-01 | Minimum chars for valid extraction |
| Try-catch for malformed HTML | 08-01 | Graceful handling returns null |
| npm registry tarball | 09-01 | Smaller than GitHub tarball, pre-transpiled |
| std_npm_args helper | 09-01 | Handles cache, prefix, edge cases automatically |
| Placeholder SHA256 | 09-01 | Can't compute until package is published |

### Pending Todos

1. **verify-platform-distribution.md** - npm publish, SHA256 update, brew install test
2. **verify-clipboard-integration.md** - Phase 6 clipboard testing on fresh system

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed all v1 phases (milestone complete)
Resume file: None

Phase 9 context (from 09-01-SUMMARY.md):
- package.json has all npm publish metadata
- Homebrew formula at ~/develop/homebrew-tap/Formula/markshift.rb
- Formula uses std_npm_args, depends on node
- Linux X11 caveats documented
- 209 total tests passing (unchanged from Phase 8)

Milestone complete:
- All 9 phases executed successfully
- 32/32 v1 requirements complete
- Deferred human verification tracked in todos:
  - Platform distribution (npm publish + brew install)
  - Clipboard integration (fresh system test)
