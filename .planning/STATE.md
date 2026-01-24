# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Seamless, reliable conversion that fits into existing workflows - no more hunting for converters or manually cleaning up formatting
**Current focus:** Phase 7 complete, RTF to Markdown pipeline via @iarna/rtf-to-html

## Current Position

Phase: 7 of 9 (RTF Pipeline) - COMPLETE
Plan: 1 of 1 in current phase
Status: Phase complete
Last activity: 2026-01-24 - Completed 07-01-PLAN.md

Progress: [#######---] 78% (7/9 phases, 7/9 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 7.4 min
- Total execution time: 52 min

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

**Recent Trend:**
- Last 5 plans: 03-01 (3 min), 04-01 (9 min), 05-01 (14 min), 06-01 (6 min), 07-01 (10 min)
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

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed 07-01-PLAN.md (RTF Pipeline)
Resume file: None

Phase 7 context (from 07-01-SUMMARY.md):
- RtfToHtmlConverter at src/converters/rtf-to-html/index.ts
- TypeScript declarations at src/types/rtf-to-html.d.ts
- RTF detection via {\rtf magic bytes in format-detect.ts
- Pipeline: RTF -> HTML -> Markdown (using existing HtmlToMarkdownConverter)
- 192 total tests passing (23 new in Phase 7)

RTF conversion complete:
- `markshift convert --paste` - RTF clipboard content converts to Markdown
- `echo '{\rtf1...}' | markshift convert` - RTF stdin converts to Markdown
- Bold, italic, underline formatting preserved through pipeline
- JSON output includes sourceFormat='rtf' for RTF input
