---
phase: 02-html-to-markdown
plan: 01
subsystem: converters
tags: [turndown, gfm, html-to-markdown, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Converter interface, ConverterRegistry, Format types
provides:
  - HtmlToMarkdownConverter class with turndown
  - Custom code language extraction rule
  - GFM support (tables, strikethrough, task lists)
  - Comprehensive test suite (38 tests)
affects: [03-smart-processors, clipboard-processing, web-service]

# Tech tracking
tech-stack:
  added: [turndown@7.2.2, "@truto/turndown-plugin-gfm@1.0.2", "@types/turndown@5.0.6"]
  patterns: [custom turndown rules, DomNode interface for domino DOM types]

key-files:
  created:
    - src/converters/html-to-markdown/index.ts
    - src/converters/html-to-markdown/rules/code-language.ts
    - tests/converters/html-to-markdown.test.ts
  modified:
    - package.json
    - src/index.ts

key-decisions:
  - "Used DomNode interface for turndown's domino types instead of browser DOM globals"
  - "Flexible test assertions for whitespace (regex patterns) since turndown spacing is valid CommonMark"

patterns-established:
  - "Converter implementation: wrap external library, expose via Converter interface"
  - "Custom rule organization: rules/ subdirectory under converter"

# Metrics
duration: 6min
completed: 2026-01-23
---

# Phase 2 Plan 1: HTML to Markdown Converter Summary

**Turndown-based HTML to Markdown converter with GFM tables/strikethrough, custom code block language extraction from class attributes (lang-*, language-*, highlight-source-*), and 38-test coverage**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-23T14:29:00Z
- **Completed:** 2026-01-23T14:31:31Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- HtmlToMarkdownConverter implementing Converter interface with turndown v7.2.2
- Custom code-language rule extracting language hints from class attributes (lang-*, language-*, highlight-source-*, hljs patterns)
- GFM support via @truto/turndown-plugin-gfm for tables, strikethrough, and task lists
- Comprehensive test suite covering all CONV and QUAL requirements (38 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install turndown dependencies** - `1e3d9d6` (chore)
2. **Task 2: Implement HtmlToMarkdownConverter** - `e3c3255` (feat)
3. **Task 3: Create comprehensive test suite** - `159d170` (test)

## Files Created/Modified

- `src/converters/html-to-markdown/index.ts` - HtmlToMarkdownConverter class implementing Converter interface
- `src/converters/html-to-markdown/rules/code-language.ts` - Custom turndown rule for language extraction
- `tests/converters/html-to-markdown.test.ts` - 38 tests covering CONV-01 through CONV-05, CONV-10, QUAL-01 through QUAL-03
- `package.json` - Added turndown, @truto/turndown-plugin-gfm, @types/turndown
- `src/index.ts` - Export HtmlToMarkdownConverter

## Decisions Made

1. **DomNode interface for turndown types** - Created minimal DomNode interface instead of using browser DOM globals (Element) since turndown uses @mixmark-io/domino in Node.js environment. This avoids TypeScript errors while being compatible with domino's DOM implementation.

2. **Flexible whitespace assertions in tests** - Used regex patterns (`/-\s+Item/`) instead of exact string matching for list tests since turndown uses 3-space list indent which is valid CommonMark. Tests verify correct Markdown structure rather than specific whitespace counts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript Element type not found error**
- **Found during:** Task 2 (HtmlToMarkdownConverter implementation)
- **Issue:** TypeScript error "Cannot find name 'Element'" in code-language.ts - Element is a browser DOM global not available in Node.js
- **Fix:** Created DomNode interface with minimal required properties (nodeName, firstChild, parentElement, className, textContent)
- **Files modified:** src/converters/html-to-markdown/rules/code-language.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** e3c3255 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed test assertions for turndown whitespace**
- **Found during:** Task 3 (Test suite creation)
- **Issue:** 4 tests failing due to exact whitespace matching - turndown uses 3-space indent for lists and trailing space in table cells
- **Fix:** Changed assertions from exact string to regex patterns that accept variable whitespace
- **Files modified:** tests/converters/html-to-markdown.test.ts
- **Verification:** All 46 tests pass
- **Committed in:** 159d170 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs)
**Impact on plan:** Both fixes necessary for correct TypeScript compilation and test accuracy. No scope creep.

## Issues Encountered

None - plan executed as expected after auto-fixes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HTML to Markdown converter complete and tested
- Ready for smart processor development (Phase 3) that will use this converter
- Converter registered in exports, available via `import { HtmlToMarkdownConverter } from 'markshift'`

---
*Phase: 02-html-to-markdown*
*Completed: 2026-01-23*
