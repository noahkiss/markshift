# Project Research Summary

**Project:** text-transform
**Domain:** Text format conversion tools (HTML/Markdown/RTF/Jira)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

text-transform is a bidirectional text conversion CLI tool optimized for LLM workflows. The research reveals a clear market gap: existing tools (Pandoc, Turndown, html-to-markdown) excel at conversion but lack clipboard integration, while tools with clipboard support (clipdown) are one-directional and platform-limited. The recommended approach is a Node.js/TypeScript implementation using established libraries (turndown for HTML→MD, marked for MD→HTML) with clipboardy for cross-platform clipboard access, distributed primarily via npm with optional Homebrew tap for macOS users.

The architecture centers on a pluggable converter registry pattern with format auto-detection and multiple I/O modes (stdin/stdout, files, clipboard). This enables both CLI usage and library consumption. Critical risks include cross-platform clipboard incompatibilities, nested HTML element conversion failures, and whitespace corruption. These are well-documented pitfalls with proven mitigation strategies: comprehensive golden file testing with real-world HTML, CI testing across all platforms from day one, and explicit whitespace handling rules.

The path to launch is clear: build the core conversion engine with HTML↔Markdown first, validate with real usage, then progressively add RTF support, content extraction, and platform-specific optimizations based on actual user needs rather than speculative features.

## Key Findings

### Recommended Stack

The Node.js ecosystem provides mature, battle-tested libraries for every conversion need. Node.js 22.x LTS is recommended for native Single Executable Application (SEA) support and stable ESM, though the primary distribution will be npm package for simplicity.

**Core technologies:**
- **Node.js 22.x LTS**: Runtime with SEA support if binary distribution needed
- **TypeScript 5.x**: Type safety essential for complex conversion logic
- **turndown 7.2.x**: Industry standard for HTML→Markdown (64k dependents, plugin system)
- **marked 17.x**: Fastest CommonMark parser for Markdown→HTML (21M weekly downloads)
- **clipboardy 5.x**: Cross-platform clipboard (4.3M weekly, supports macOS/Windows/Linux/Wayland)
- **commander 14.x**: CLI framework with clean subcommand syntax
- **Vitest 3.x**: 10-20x faster than Jest with simpler TypeScript config
- **tsup 8.5.x**: Zero-config bundling via esbuild

**Critical decision: Node.js vs Go**
Research assumed Go based on AGENTS.md, but the Node.js ecosystem has superior library maturity for this domain. turndown and marked are production-proven with extensive edge case handling. The trade-off is binary size (66-82MB with Node.js SEA vs ~10MB Go binary) and slightly slower startup, but the development velocity and library quality justify Node.js. Consider Go only if binary size or startup time (<50ms) become validated requirements.

### Expected Features

Users expect bidirectional conversion with clipboard integration. Competitors either do conversion well (Pandoc, Turndown) or clipboard well (clipdown), but not both.

**Must have (table stakes):**
- HTML to Markdown conversion — core value proposition
- Markdown to HTML conversion — bidirectional is key differentiator
- stdin/stdout support — essential for agent piping and CLI composition
- Basic formatting preservation — headings, lists, emphasis, links, code blocks, tables
- File input/output — alternative to clipboard
- Clear error handling — agents need parseable errors with exit codes

**Should have (competitive):**
- Clipboard read/write integration — eliminates copy-paste friction
- Auto-detect content type — reduces cognitive load (HTML vs RTF vs plain text)
- Main content extraction — strip nav/ads from web pages (Mozilla Readability algorithm)
- RTF to Markdown — process content from Word/Notes (macOS clipboard often contains RTF)
- JSON output mode — machine-readable output for agents
- Quiet mode — clean piping
- Fast execution (<100ms typical) — workflow fluency

**Defer (v2+):**
- Watch mode for clipboard — unvalidated need, high complexity
- URL proxy service — separate product, defer until CLI validates
- Smart processors for specific sites — optimization, not core
- Browser extension — different distribution model
- WYSIWYG preview — separate concern

### Architecture Approach

The architecture follows a clean separation of concerns with pluggable converters. The core engine is interface-layer agnostic, allowing both CLI and library usage.

**Major components:**
1. **CLI Layer** (commander.js) — Thin handlers that parse args and delegate to orchestrator
2. **Core Conversion Engine** — Orchestrator coordinates format detection, converter lookup, and pipeline execution
3. **Converter Registry** — Maps format pairs to converters using factory pattern
4. **Individual Converters** — Wrap libraries (turndown, marked, jira2md) with standard interface
5. **Clipboard Integration** — Platform-specific clipboard handling isolated from conversion logic

**Key architectural pattern:** All converters implement a standard interface (`convert(input, options) → ConversionResult`) enabling easy testing, format additions, and converter swapping. The orchestrator handles format detection and routing, keeping converters focused on single-responsibility conversion.

**Data flow:** Input → Format Detection → Converter Lookup → Conversion → Post-Processing → Output. Multiple I/O modes (stdin, file, clipboard) feed the same pipeline.

### Critical Pitfalls

Research identified six critical pitfalls with clear prevention strategies:

1. **Nested Element Conversion Failures** — Code blocks in tables, lists in blockquotes fail. Prevention: Build context stack during traversal, test with real Confluence/Jira exports, preserve as inline HTML when Markdown can't represent structure.

2. **Round-Trip Fidelity Loss Without Detection** — HTML→MD→HTML loses information silently. Prevention: Return metadata about what was lost, offer HTML passthrough for critical content, implement round-trip semantic equivalence tests.

3. **Malformed HTML Causing Crashes** — Real-world HTML from email clients and Word exports breaks parsers. Prevention: Use libraries with HTML5 error recovery (like turndown's domino parser), test with corpus of broken HTML, catch panics at API boundaries.

4. **Cross-Platform Clipboard Incompatibilities** — Works on Mac, crashes on Linux. Prevention: CI testing on all platforms from day one, graceful fallbacks when clipboard access fails, document platform-specific dependencies.

5. **Whitespace and Line Break Corruption** — Code blocks lose indentation, paragraphs merge. Prevention: Distinguish significant whitespace (in `<pre>`) from collapsible, normalize line endings early, validate against Markdown spec requirements.

6. **Character Encoding and Entity Handling** — Emoji breaks, HTML entities show raw. Prevention: Detect encoding from meta tags, decode all HTML entities during parsing, normalize to UTF-8 NFC, test with emoji and CJK characters.

**Testing strategy:** Golden file testing with real-world HTML corpus (Outlook exports, Confluence pages, news sites, GitHub READMEs) prevents regressions. Round-trip tests verify semantic equivalence.

## Implications for Roadmap

Based on research, the natural phase structure follows dependency order and risk mitigation:

### Phase 1: Foundation & Core Conversion
**Rationale:** Establish type system and prove core conversion quality before adding complexity. HTML↔Markdown is the highest-value feature and informs all other converters.

**Delivers:**
- TypeScript project structure with core types
- Converter interface and registry pattern
- HTML→Markdown converter (turndown wrapper)
- Markdown→HTML converter (marked wrapper)
- Format auto-detection
- Golden file test infrastructure

**Addresses:** Table stakes features (HTML↔MD, basic formatting)
**Avoids:** Malformed HTML crashes (by using turndown's robust parser), whitespace corruption (explicit handling rules), encoding issues (UTF-8 normalization)

**Research flag:** SKIP — HTML/Markdown conversion is well-documented with clear patterns.

### Phase 2: CLI & I/O Modes
**Rationale:** Validate core conversion with minimal CLI before adding clipboard complexity. stdin/stdout is simpler and enables agent workflows immediately.

**Delivers:**
- commander.js CLI with subcommands
- stdin/stdout support
- File input/output
- --quiet and --verbose modes
- Error handling with exit codes
- Help documentation

**Addresses:** Table stakes features (stdin/stdout, file I/O, error handling)
**Uses:** commander for CLI parsing

**Research flag:** SKIP — Standard CLI patterns with extensive documentation.

### Phase 3: Clipboard Integration
**Rationale:** Clipboard is the key differentiator but requires platform-specific testing. Defer until core conversion proves solid.

**Delivers:**
- clipboardy integration
- Multi-format clipboard reading (HTML, RTF, plain text)
- Format preference logic (HTML > RTF > text)
- --paste and --copy flags
- Cross-platform CI testing (macOS, Linux, Windows)

**Addresses:** Differentiator features (clipboard read/write, auto-detect)
**Avoids:** Cross-platform clipboard incompatibilities (comprehensive CI testing)

**Research flag:** NEEDS RESEARCH — Platform-specific clipboard quirks (CF_HTML on Windows, RTF on macOS, X11 vs Wayland on Linux) may require deep dive during implementation.

### Phase 4: RTF Support
**Rationale:** RTF is common on macOS clipboard but has limited library support. Two-step pipeline (RTF→HTML→Markdown) leverages existing HTML converter.

**Delivers:**
- RTF→HTML converter (using @iarna/rtf-to-html or rtf-stream-parser)
- RTF→HTML→Markdown pipeline
- RTF format detection

**Addresses:** Differentiator features (RTF support)
**Uses:** rtf-stream-parser, existing HTML→MD pipeline

**Research flag:** NEEDS RESEARCH — RTF library limitations (weak table support, formatting degradation) may require testing with real-world Word/Notes exports to determine acceptable quality threshold.

### Phase 5: Content Extraction
**Rationale:** Nice-to-have that significantly improves web content conversion. Defer until basic conversion validates.

**Delivers:**
- Mozilla Readability algorithm integration
- Main content extraction from web pages
- --extract-content flag
- Testing with news and documentation sites

**Addresses:** Differentiator features (content extraction)

**Research flag:** NEEDS RESEARCH — Readability algorithm configuration (threshold tuning, site-specific quirks) requires testing across diverse sites.

### Phase 6: Advanced Features
**Rationale:** Features that emerge from real usage patterns after launch validation.

**Delivers:**
- Jira/Confluence markup support (using jira2md)
- JSON output mode (--json flag)
- Teams-optimized HTML output
- Linux and Windows platform support

**Addresses:** Differentiator features (Jira support, JSON mode)

**Research flag:** PARTIAL — Jira2md is well-documented, but Teams HTML format may need research.

### Phase Ordering Rationale

1. **Foundation before features:** Core types and converter interface must be solid before adding converters. Changing the interface later affects all converters.

2. **Proven conversion before I/O complexity:** HTML↔Markdown quality is the product value. Validate this with tests before adding CLI, clipboard, or other I/O modes.

3. **Simple I/O before complex I/O:** stdin/stdout is straightforward and unblocks agent workflows. Clipboard has platform quirks that could derail early momentum.

4. **Clipboard before RTF:** Clipboard read/write enables the core workflow even without RTF support. RTF builds on clipboard by adding format support.

5. **Core before nice-to-have:** Content extraction and Jira support are valuable but not essential for launch. Validate core use case first.

**Dependency chain:**
- Phase 2 depends on Phase 1 (CLI needs converters)
- Phase 3 depends on Phase 1 (clipboard uses format detection)
- Phase 4 depends on Phase 1 (RTF pipeline uses HTML→MD converter)
- Phase 5 is independent (content extraction is preprocessing)
- Phase 6 depends on validated usage patterns

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Clipboard):** Platform-specific clipboard format handling, permission models, Wayland vs X11 differences
- **Phase 4 (RTF):** RTF library limitations, acceptable quality degradation, fallback to Pandoc decision criteria
- **Phase 5 (Content Extraction):** Readability algorithm tuning, site-specific extraction rules

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** TypeScript project structure is standard, converter interface is simple
- **Phase 2 (CLI):** commander.js has extensive examples, stdin/stdout is standard Node.js
- **Phase 6 (Advanced):** jira2md is well-documented, JSON output is straightforward

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | turndown, marked, clipboardy verified via official sources, npm stats, GitHub activity |
| Features | HIGH | Competitor analysis clear, LLM workflow use case validated across multiple tools |
| Architecture | HIGH | Converter pattern standard, examples from Pandoc/unified.js/rehype-remark |
| Pitfalls | HIGH | All pitfalls verified with GitHub issues, library documentation, real-world examples |

**Overall confidence:** HIGH

The research covered all critical decision points with primary sources. Stack recommendations are backed by npm download statistics, GitHub activity, and community adoption. Feature priorities derive from competitor analysis and validated LLM workflow patterns. Architecture follows proven patterns from Pandoc (Reader/Writer/AST) and unified.js (pipeline). Pitfalls are documented with specific GitHub issues and mitigation strategies.

### Gaps to Address

While confidence is high, these areas need validation during implementation:

- **RTF conversion quality:** rtf-stream-parser has limited table support. Need to test with real Word/Notes exports to determine if quality is acceptable or if Pandoc fallback is required. Validation: Phase 4 kickoff with test corpus.

- **Clipboard format priority:** Research suggests HTML > RTF > text preference, but macOS clipboard behavior with copy from Safari vs Notes may differ. Validation: Phase 3 with platform-specific testing.

- **Node.js vs Go decision:** Research assumed Go per AGENTS.md but recommended Node.js based on library ecosystem. This needs stakeholder alignment. If Go is mandatory, expect slower development and more edge case handling. Validation: Before Phase 1 kickoff.

- **Binary distribution necessity:** Research covers SEA (Single Executable Application) approach but primary distribution should be npm. Validate if binary is actually needed or if Homebrew + npm is sufficient. Validation: After v1 launch based on user feedback.

## Sources

### Primary (HIGH confidence)
- [turndown GitHub](https://github.com/mixmark-io/turndown) — HTML→Markdown converter (64k dependents, active maintenance)
- [marked npm](https://www.npmjs.com/package/marked) — Markdown→HTML parser (21M weekly downloads)
- [clipboardy GitHub](https://github.com/sindresorhus/clipboardy) — Cross-platform clipboard (2.3M projects)
- [JohannesKaufmann/html-to-markdown issues](https://github.com/JohannesKaufmann/html-to-markdown) — Real-world conversion pitfalls
- [golang-design/clipboard issues](https://github.com/golang-design/clipboard) — Cross-platform clipboard bugs
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html) — Conversion architecture patterns
- [Commander.js](https://github.com/tj/commander.js) — CLI framework patterns

### Secondary (MEDIUM confidence)
- [Jina AI Reader](https://jina.ai/reader/) — LLM workflow validation
- [Mozilla Readability](https://github.com/mozilla/readability) — Content extraction algorithm
- [clipdown](https://github.com/jhuckaby/clipdown) — Competitor analysis (clipboard + conversion)
- [rtf-stream-parser npm](https://www.npmjs.com/package/rtf-stream-parser) — RTF parsing options
- [jira2md npm](https://www.npmjs.com/package/jira2md) — Jira markup conversion

### Tertiary (LOW confidence)
- [Node.js SEA documentation](https://nodejs.org/api/single-executable-applications.html) — Binary distribution (experimental)
- [Homebrew Node formula guide](https://docs.brew.sh/Node-for-Formula-Authors) — Distribution packaging

---
*Research completed: 2026-01-22*
*Ready for roadmap: yes*
