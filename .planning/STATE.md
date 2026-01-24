# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Seamless, reliable conversion that fits into existing workflows - no more hunting for converters or manually cleaning up formatting
**Current focus:** Phase 5 complete, standard I/O with auto-detection and JSON output

## Current Position

Phase: 5 of 9 (Standard I/O) - COMPLETE
Plan: 1 of 1 in current phase
Status: Phase complete
Last activity: 2026-01-24 - Completed 05-01-PLAN.md

Progress: [#####-----] 56% (5/9 phases, 5/9 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 7.2 min
- Total execution time: 36 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1 | 4 min | 4 min |
| 02-html-to-markdown | 1 | 6 min | 6 min |
| 03-markdown-to-html | 1 | 3 min | 3 min |
| 04-cli-framework | 1 | 9 min | 9 min |
| 05-standard-io | 1 | 14 min | 14 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 02-01 (6 min), 03-01 (3 min), 04-01 (9 min), 05-01 (14 min)
- Trend: Stable (05-01 included format detection and JSON output for all commands)

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

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed 05-01-PLAN.md (Standard I/O)
Resume file: None

Phase 5 context (from 05-01-SUMMARY.md):
- Format detection at src/cli/utils/format-detect.ts using is-html
- CLI types at src/cli/types.ts (GlobalOptions, JsonOutput, toJsonOutput)
- New convert command at src/cli/commands/convert.ts with auto-detection
- Global --json flag for all commands
- 156 total tests passing (50 new in Phase 5)

Standard I/O complete:
- `markshift convert [input] [-o output] [-t md|html]` - Auto-detect and convert
- `markshift html-to-md [input] [-o output]` - HTML to Markdown
- `markshift md-to-html [input] [-o output]` - Markdown to HTML
- All commands support `--json` for machine-readable output
- JSON output: `{ content, metadata: { sourceFormat, targetFormat, processingTimeMs, inputLength, outputLength } }`
