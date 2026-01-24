# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Seamless, reliable conversion that fits into existing workflows - no more hunting for converters or manually cleaning up formatting
**Current focus:** Phase 10 - GitHub Pages Web UI

## Current Position

Phase: 10 of 10 (GitHub Pages Web UI) - IN PROGRESS
Plan: 1 of 2 in current phase
Status: Plan 10-01 complete
Last activity: 2026-01-24 - Completed 10-01-PLAN.md

Progress: [##########] 91% (10/11 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 7.6 min
- Total execution time: 76 min

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
| 10-github-pages-web-ui | 1 | 11 min | 11 min |

**Recent Trend:**
- Last 5 plans: 06-01 (6 min), 07-01 (10 min), 08-01 (8 min), 09-01 (5 min), 10-01 (11 min)
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
| Separate web tsconfig | 10-01 | DOM types needed for browser code, excluded from Node build |
| Empty module alias for linkedom | 10-01 | Browser uses native DOMParser, linkedom is Node-only |

### Pending Todos

1. **verify-platform-distribution.md** - npm publish, SHA256 update, brew install test
2. **verify-clipboard-integration.md** - Phase 6 clipboard testing on fresh system

### Roadmap Evolution

- Phase 10 added: GitHub Pages Web UI (browser-based conversion interface)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24T18:27:15Z
Stopped at: Completed 10-01-PLAN.md
Resume file: .planning/phases/10-github-pages-web-ui/10-02-PLAN.md

Phase 10 context:
- Plan 10-01 complete: Vite build tooling and browser converters
- Next: Plan 10-02 - Web UI implementation with index.html and conversion interface
- Browser converters ready: htmlToMarkdown, markdownToHtml, extractContent
- Build output configured to docs/ for GitHub Pages

Previous phases (1-9) complete:
- 209 total tests passing
- 32/32 original requirements complete
- 3 new WEB requirements added for Phase 10
- Deferred human verification tracked in todos
