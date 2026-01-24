# Roadmap: text-transform

## Overview

text-transform delivers a CLI tool for bidirectional HTML/Markdown conversion with clipboard integration. The journey moves from core conversion engine (the foundational value) through CLI interface and I/O modes, then adds clipboard and RTF support for seamless workflow integration, finishing with content extraction and cross-platform distribution. Each phase delivers a complete, testable capability that builds toward the goal of invisible format conversion in daily workflows.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - TypeScript project structure, core types, converter interface
- [x] **Phase 2: HTML to Markdown** - Primary conversion path with full HTML element support
- [x] **Phase 3: Markdown to HTML** - Bidirectional conversion capability
- [x] **Phase 4: CLI Framework** - Command-line interface with subcommands and help
- [x] **Phase 5: Standard I/O** - stdin/stdout support with format detection
- [x] **Phase 6: Clipboard Integration** - Read/write system clipboard with format preference
- [x] **Phase 7: RTF Pipeline** - RTF to Markdown via HTML intermediate
- [x] **Phase 8: Content Extraction** - Clean main content extraction from web pages
- [ ] **Phase 9: Platform & Distribution** - Cross-platform support and Homebrew tap

## Phase Details

### Phase 1: Foundation
**Goal**: Establish project structure and core abstractions that all converters will use
**Depends on**: Nothing (first phase)
**Requirements**: QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. TypeScript project compiles with strict mode enabled
  2. Converter interface is defined with standard signature
  3. Converter registry can register and lookup converters by format pair
  4. Unit tests run and pass via npm test
  5. Project structure follows package organization from research (src/converters/, src/cli/, etc.)
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md - TypeScript project setup and core interface definitions

### Phase 2: HTML to Markdown
**Goal**: Convert HTML to clean, semantic Markdown
**Depends on**: Phase 1
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, CONV-10, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. User can convert HTML with headings, paragraphs, and emphasis to equivalent Markdown
  2. User can convert HTML lists (ordered and unordered, nested) to Markdown
  3. User can convert HTML links and images to Markdown syntax
  4. User can convert HTML code blocks and inline code to Markdown with language hints preserved
  5. User can convert HTML tables to Markdown tables
  6. Malformed HTML does not crash the converter (graceful handling)
  7. Whitespace in code blocks is preserved exactly
  8. UTF-8 characters including emoji and CJK render correctly
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md - HTML to Markdown converter with turndown, GFM support, and custom language extraction

### Phase 3: Markdown to HTML
**Goal**: Convert Markdown back to HTML for platforms that need HTML input
**Depends on**: Phase 1
**Requirements**: CONV-06
**Success Criteria** (what must be TRUE):
  1. User can convert Markdown to valid HTML
  2. Round-trip conversion (HTML->MD->HTML) preserves semantic meaning
  3. Output HTML is suitable for pasting into Teams or email
**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md - Markdown to HTML converter with marked and GFM support

### Phase 4: CLI Framework
**Goal**: Provide a usable command-line interface with standard UX patterns
**Depends on**: Phase 2, Phase 3
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06
**Success Criteria** (what must be TRUE):
  1. User can run `markshift --help` and see clear usage instructions
  2. User can run subcommands for conversion (e.g., `markshift html-to-md`)
  3. --quiet mode suppresses all non-essential output
  4. --verbose mode shows detailed processing information
  5. Exit code 0 on success, non-zero with descriptive message on error
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md - CLI framework with Commander.js, subcommands, and verbose/quiet modes

### Phase 5: Standard I/O
**Goal**: Enable pipeline usage with stdin/stdout and format auto-detection
**Depends on**: Phase 4
**Requirements**: IO-01, IO-02, IO-06, CONV-07
**Success Criteria** (what must be TRUE):
  1. User can pipe HTML via stdin and receive Markdown on stdout
  2. User can pipe Markdown via stdin and receive HTML on stdout
  3. Format is auto-detected when not explicitly specified
  4. --json flag outputs structured result with metadata
**Plans**: 1 plan

Plans:
- [x] 05-01-PLAN.md — Format detection, convert command, and JSON output

### Phase 6: Clipboard Integration
**Goal**: Read from and write to system clipboard for seamless workflow
**Depends on**: Phase 5
**Requirements**: IO-03, IO-04, IO-05, PLAT-01, PLAT-03
**Success Criteria** (what must be TRUE):
  1. User can read content from clipboard using --paste flag
  2. User can write conversion result to clipboard using --copy flag
  3. Multiple clipboard formats are read with preference order (HTML > RTF > text)
  4. Clipboard operations work on macOS
  5. Clipboard operations work on Linux
**Plans**: 1 plan

Plans:
- [x] 06-01-PLAN.md — Clipboard utilities and --paste/--copy global options

### Phase 7: RTF Pipeline
**Goal**: Convert RTF content (common in macOS clipboard) to Markdown
**Depends on**: Phase 2, Phase 6
**Requirements**: CONV-08
**Success Criteria** (what must be TRUE):
  1. User can convert RTF content to Markdown
  2. RTF from macOS Notes/Word pastes convert correctly
  3. RTF is processed via RTF->HTML->Markdown pipeline
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md — RTF to HTML converter and CLI pipeline integration

### Phase 8: Content Extraction
**Goal**: Extract main content from web pages, stripping navigation and ads
**Depends on**: Phase 2
**Requirements**: CLI-07, CONV-09
**Success Criteria** (what must be TRUE):
  1. User can use --extract-content flag to get main article content
  2. Navigation, ads, and boilerplate are stripped from output
  3. Semantic div-based structures are converted to proper Markdown tables
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md — Content extraction with Readability, semantic table detection, CLI flag

### Phase 9: Platform & Distribution
**Goal**: Cross-platform availability and easy installation via Homebrew
**Depends on**: Phase 6
**Requirements**: PLAT-02, PLAT-04
**Success Criteria** (what must be TRUE):
  1. Tool runs correctly on Linux
  2. User can install via `brew install` from custom tap
  3. Homebrew formula handles dependencies correctly
**Plans**: TBD

Plans:
- [ ] 09-01: Homebrew tap and cross-platform validation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2026-01-23 |
| 2. HTML to Markdown | 1/1 | Complete | 2026-01-23 |
| 3. Markdown to HTML | 1/1 | Complete | 2026-01-23 |
| 4. CLI Framework | 1/1 | Complete | 2026-01-23 |
| 5. Standard I/O | 1/1 | Complete | 2026-01-23 |
| 6. Clipboard Integration | 1/1 | Complete | 2026-01-24 |
| 7. RTF Pipeline | 1/1 | Complete | 2026-01-24 |
| 8. Content Extraction | 1/1 | Complete | 2026-01-24 |
| 9. Platform & Distribution | 0/1 | Not started | - |

---
*Roadmap created: 2026-01-22*
*Depth: comprehensive (9 phases)*
*Total v1 requirements: 32*
