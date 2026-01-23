# Requirements: text-transform

**Defined:** 2026-01-22
**Core Value:** Seamless, reliable conversion that fits into existing workflows - no more hunting for converters or manually cleaning up formatting

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Conversion - Core

- [x] **CONV-01**: Convert HTML to Markdown preserving semantic structure (headings, paragraphs, emphasis)
- [x] **CONV-02**: Convert HTML lists (ordered and unordered) to Markdown
- [x] **CONV-03**: Convert HTML links and images to Markdown
- [x] **CONV-04**: Convert HTML code blocks to Markdown with language hints preserved
- [x] **CONV-05**: Convert HTML tables to Markdown tables
- [x] **CONV-06**: Convert Markdown to HTML (bidirectional conversion)
- [ ] **CONV-07**: Auto-detect input format (HTML vs plain text vs RTF)
- [ ] **CONV-08**: Convert RTF to Markdown via RTF->HTML->Markdown pipeline
- [ ] **CONV-09**: Semantic table detection - convert div-based fake tables to markdown tables
- [x] **CONV-10**: Handle malformed HTML gracefully without crashes

### Input/Output

- [ ] **IO-01**: Read input from stdin
- [ ] **IO-02**: Write output to stdout
- [ ] **IO-03**: Read from system clipboard (--paste flag)
- [ ] **IO-04**: Write to system clipboard (--copy flag)
- [ ] **IO-05**: Read multiple clipboard formats with preference (HTML > RTF > plain text)
- [ ] **IO-06**: Output JSON format (--json flag) for machine-readable results

### CLI

- [x] **CLI-01**: Command-line interface with clear subcommands
- [x] **CLI-02**: Help documentation (--help)
- [x] **CLI-03**: Quiet mode for clean piping (--quiet)
- [x] **CLI-04**: Verbose mode for debugging (--verbose)
- [x] **CLI-05**: Error messages with actionable guidance
- [x] **CLI-06**: Proper exit codes (0 for success, non-zero for errors)
- [ ] **CLI-07**: Content extraction flag to strip nav/ads from web pages (--extract-content)

### Platform Support

- [ ] **PLAT-01**: macOS support (primary platform)
- [ ] **PLAT-02**: Linux support (Homebrew works on Linux)
- [ ] **PLAT-03**: Cross-platform clipboard handling (macOS, Linux)
- [ ] **PLAT-04**: Homebrew installation via custom tap

### Quality

- [x] **QUAL-01**: Preserve whitespace in code blocks and preformatted text
- [x] **QUAL-02**: Handle character encoding correctly (UTF-8, emoji, CJK characters)
- [x] **QUAL-03**: Decode HTML entities during conversion
- [x] **QUAL-04**: Fast execution (<100ms for typical documents)
- [x] **QUAL-05**: Semantic meaning preserved over visual appearance

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Format Support

- **EXT-01**: Jira markup bidirectional conversion
- **EXT-02**: Confluence markup conversion
- **EXT-03**: File input/output (--input, --output flags)

### Platform Support

- **PLAT-10**: Windows support
- **PLAT-11**: npm global installation (npm install -g)
- **PLAT-12**: Direct binary download from GitHub releases

### Advanced Features

- **ADV-01**: Watch mode for continuous clipboard monitoring
- **ADV-02**: URL proxy service (fetch and convert from URL)
- **ADV-03**: Smart processors for specific sites (GitHub, Confluence, Stack Overflow)
- **ADV-04**: Browser extension
- **ADV-05**: Alfred/Raycast native plugins

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration | This is a conversion tool, not a collaborative editor |
| Content storage/hosting | Conversions are ephemeral, no database or file management |
| Authentication/user accounts | Local tool for individual use |
| Pixel-perfect layout preservation | Semantic meaning matters, exact visual layout doesn't (Markdown has limitations) |
| WYSIWYG preview/editor | Focus on conversion quality, not editing experience |
| Windows support (v1) | macOS/Linux first; Windows is locked down in user's work environment anyway |
| Native npm distribution (v1) | Homebrew is preferred installation method |
| Direct binary downloads (v1) | Homebrew handles distribution |
| File I/O via flags (v1) | stdin/stdout and clipboard are sufficient; shell redirection works |
| Round-trip pixel-perfect fidelity | Markdown cannot express colspan/rowspan, colors, custom CSS - this is acceptable |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONV-01 | Phase 2 | Complete |
| CONV-02 | Phase 2 | Complete |
| CONV-03 | Phase 2 | Complete |
| CONV-04 | Phase 2 | Complete |
| CONV-05 | Phase 2 | Complete |
| CONV-06 | Phase 3 | Complete |
| CONV-07 | Phase 5 | Pending |
| CONV-08 | Phase 7 | Pending |
| CONV-09 | Phase 8 | Pending |
| CONV-10 | Phase 2 | Complete |
| IO-01 | Phase 5 | Pending |
| IO-02 | Phase 5 | Pending |
| IO-03 | Phase 6 | Pending |
| IO-04 | Phase 6 | Pending |
| IO-05 | Phase 6 | Pending |
| IO-06 | Phase 5 | Pending |
| CLI-01 | Phase 4 | Complete |
| CLI-02 | Phase 4 | Complete |
| CLI-03 | Phase 4 | Complete |
| CLI-04 | Phase 4 | Complete |
| CLI-05 | Phase 4 | Complete |
| CLI-06 | Phase 4 | Complete |
| CLI-07 | Phase 8 | Pending |
| PLAT-01 | Phase 6 | Pending |
| PLAT-02 | Phase 9 | Pending |
| PLAT-03 | Phase 6 | Pending |
| PLAT-04 | Phase 9 | Pending |
| QUAL-01 | Phase 2 | Complete |
| QUAL-02 | Phase 2 | Complete |
| QUAL-03 | Phase 2 | Complete |
| QUAL-04 | Phase 1 | Complete |
| QUAL-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-23 after Phase 4 completion*
