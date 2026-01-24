---
phase: 08-content-extraction
plan: 01
subsystem: converters
tags: [readability, linkedom, content-extraction, aria-tables, turndown]

# Dependency graph
requires:
  - phase: 02-html-to-markdown
    provides: HtmlToMarkdownConverter with turndown rules pattern
  - phase: 04-cli-framework
    provides: CLI command structure with options
provides:
  - Content extraction via Mozilla Readability for clean article content
  - Semantic table turndown rule for ARIA/div-based tables
  - --extract-content CLI flag for HTML stripping
affects: [09-web-service, smart-processors, url-proxy]

# Tech tracking
tech-stack:
  added: [@mozilla/readability, linkedom]
  patterns: [content extractor module, turndown custom rule for non-standard elements]

key-files:
  created:
    - src/converters/html-to-markdown/extractors/content.ts
    - src/converters/html-to-markdown/rules/semantic-table.ts
    - tests/converters/html-to-markdown/content-extraction.test.ts
    - tests/converters/html-to-markdown/semantic-table.test.ts
  modified:
    - src/converters/html-to-markdown/index.ts
    - src/cli/commands/convert.ts
    - src/cli/types.ts
    - package.json

key-decisions:
  - "Skip isProbablyReaderable() check - doesn't work well with linkedom's DOM"
  - "Minimum 100 chars content threshold for extraction success"
  - "Try-catch wrapping for malformed HTML graceful handling"

patterns-established:
  - "Content extractor pattern: extractors/ directory under converter"
  - "Semantic table pattern: detect via role/data-* attributes, convert to MD table"

# Metrics
duration: 8min
completed: 2026-01-24
---

# Phase 8 Plan 1: Content Extraction Summary

**Mozilla Readability content extraction with linkedom DOM parsing, plus ARIA semantic table conversion to Markdown**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-24T08:14:14Z
- **Completed:** 2026-01-24T08:22:30Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Content extraction using @mozilla/readability strips navigation, ads, and boilerplate from web pages
- Semantic table rule converts div-based ARIA tables (role="table", data-table) to Markdown tables
- --extract-content CLI flag integrates extraction into convert command
- 17 new tests (8 content extraction, 9 semantic tables) - 209 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create content extractor** - `8ad6b9c` (feat)
2. **Task 2: Create semantic table turndown rule and integrate into converter** - `fd2d54c` (feat)
3. **Task 3: Add --extract-content flag to CLI convert command** - `0042542` (feat)

## Files Created/Modified
- `src/converters/html-to-markdown/extractors/content.ts` - Readability wrapper with ExtractedContent interface
- `src/converters/html-to-markdown/rules/semantic-table.ts` - Turndown rule for div-based ARIA tables
- `src/converters/html-to-markdown/index.ts` - Integrated semantic table rule
- `src/cli/commands/convert.ts` - Added --extract-content flag and extraction logic
- `src/cli/types.ts` - Added extractContent to GlobalOptions
- `tests/converters/html-to-markdown/content-extraction.test.ts` - 8 tests for extraction
- `tests/converters/html-to-markdown/semantic-table.test.ts` - 9 tests for semantic tables

## Decisions Made
- **Skipped isProbablyReaderable():** The function doesn't work reliably with linkedom's DOM implementation; instead we try extraction and check result quality
- **100 char minimum:** Content must be at least 100 characters to be considered valid extraction
- **Try-catch for malformed HTML:** Gracefully returns null instead of throwing on parse errors
- **Pipe character escaping:** Cell content with | is escaped as \| in table output

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **isProbablyReaderable() returns false with linkedom:** The Readability check function doesn't work well with linkedom's DOM implementation, but Readability.parse() works fine. Solved by skipping the pre-check and validating the parse result instead.
- **Test HTML too short:** Initial tests had articles too short for content threshold. Added more paragraphs to test fixtures.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Content extraction ready for use by web service and URL proxy
- Semantic tables will help convert common web page patterns
- Ready for Phase 9: Web Service

---
*Phase: 08-content-extraction*
*Completed: 2026-01-24*
