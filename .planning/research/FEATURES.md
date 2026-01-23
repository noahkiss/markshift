# Feature Research

**Domain:** Text format conversion tools (HTML/Markdown/RTF/Jira)
**Researched:** 2026-01-22
**Confidence:** HIGH (multiple sources verified, ecosystem well-established)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | LLM Workflow Relevance | Notes |
|---------|--------------|------------|----------------------|-------|
| HTML to Markdown conversion | Core promise of the tool | MEDIUM | HIGH - Primary input path for web content | Pandoc, Turndown, html-to-markdown all do this |
| Markdown to HTML conversion | Bidirectional conversion expected | LOW | HIGH - Primary output path for Teams/email | markdown-it, goldmark, commonmark parsers |
| stdin/stdout support | Standard CLI convention | LOW | HIGH - Essential for agent piping | Every serious CLI tool supports this |
| File input/output | Alternative to clipboard | LOW | MEDIUM - Batch processing | `tool input.html > output.md` |
| Basic formatting preservation | Headings, lists, emphasis, links | MEDIUM | HIGH - Structure matters for LLM context | All converters do this |
| Code block handling | Common in technical content | LOW | HIGH - Code snippets in docs | Must preserve language hints for syntax highlighting |
| Table conversion | Tables are everywhere | MEDIUM | MEDIUM - LLMs handle markdown tables well | GFM tables are standard target |
| Link preservation | Links are fundamental | LOW | MEDIUM - Source attribution matters | Absolute vs relative URL handling |
| Error handling with clear messages | Users need to know what went wrong | LOW | HIGH - Agents need parseable errors | Exit codes + stderr messages |
| Help/usage documentation | Standard CLI expectation | LOW | MEDIUM - Self-documenting for agents | `--help`, man pages |
| Version flag | Debugging and compatibility | LOW | LOW | `--version` |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable for the LLM workflow use case.

| Feature | Value Proposition | Complexity | LLM Workflow Relevance | Notes |
|---------|-------------------|------------|----------------------|-------|
| Clipboard read/write integration | Eliminates copy-paste friction; workflow is "copy, run tool, paste" | MEDIUM | HIGH - Core workflow enabler | clipdown, md2cb show demand; cross-platform is tricky |
| Auto-detect content type | User doesn't need to specify input format | MEDIUM | HIGH - Reduces cognitive load | Detect HTML vs RTF vs plain text from clipboard |
| Main content extraction (readability) | Strip nav/ads/boilerplate from web pages | HIGH | HIGH - Clean input = better LLM context | Mozilla Readability algorithm; Jina Reader does this |
| RTF to Markdown | Process content from Word, Notes, etc. | MEDIUM | HIGH - Common source format | macOS clipboard often contains RTF |
| Jira/Confluence markup support | Enterprise workflow integration | MEDIUM | HIGH - Common enterprise platforms | Bidirectional conversion needed |
| JSON output mode | Machine-readable output for agents | LOW | HIGH - Agent integration | `--json` flag with metadata |
| Quiet mode | Suppress progress for piping | LOW | HIGH - Clean piping | `--quiet` flag |
| Teams HTML format output | Direct paste into Teams works | LOW | HIGH - Primary output destination | Teams accepts HTML, renders it as rich text |
| Semantic over visual conversion | Meaningful structure, not pixel-perfect | LOW | HIGH - LLMs care about meaning | Design principle, not feature |
| Fast execution (<100ms typical) | Feels instant in workflow | MEDIUM | MEDIUM - Workflow fluency | Go or native binaries excel here |
| Single binary distribution | Easy installation, no runtime deps | MEDIUM | LOW - Deployment convenience | Go advantage; Homebrew tap simplifies |
| Custom element handling | Extend for specific use cases | MEDIUM | LOW - Power user feature | Plugin system or rules API |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems or are out of scope for this tool.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Pixel-perfect layout preservation | "I want it to look exactly the same" | Markdown can't represent all HTML layouts; creates bloated output with inline styles | Focus on semantic conversion; document this limitation clearly |
| Real-time watch mode (v1) | "Monitor clipboard continuously" | Complexity, battery drain, permission issues; rarely needed | Manual trigger is sufficient; add watch mode post-v1 if validated |
| GUI application | "Not everyone uses CLI" | Scope creep; many GUI tools exist | CLI with clipboard flags enables hotkey workflows (Raycast/Alfred) |
| Browser extension (v1) | "Right-click to convert" | Separate codebase, maintenance burden, security review | URL fetch mode + bookmarklet can approximate this |
| Built-in HTTP fetching (v1) | "Just give it a URL" | Scope creep; many tools do this well (curl, wget, jina reader) | Pipe from curl: `curl URL \| tool --from html` |
| WYSIWYG preview | "Show me what it looks like" | Scope creep; not a conversion concern | Use separate markdown preview tool |
| Multiple output files | "Convert this directory" | Batch processing complexity | Shell scripting: `for f in *.html; do tool $f > ${f%.html}.md; done` |
| PDF conversion | "PDFs are documents too" | Requires OCR/complex extraction; separate domain | Recommend markitdown, marker, or MinerU for PDF |
| Image OCR/extraction | "Extract text from images" | Complex ML dependency; separate tool | Recommend dedicated OCR tools |
| Collaborative editing | "Multiple people editing" | Entirely different product category | Out of scope |
| Cloud storage | "Save my conversions" | Adds infrastructure, auth, complexity | Ephemeral conversions; use filesystem |
| Syntax highlighting in output | "Make code pretty" | Not Markdown's job; rendering concern | Output includes language hints; renderer handles highlighting |
| Merge table cells | "My table has merged cells" | Markdown doesn't support colspan/rowspan | Document limitation; output closest approximation |
| Preserve custom CSS classes | "Keep my styling" | Markdown is format-agnostic; classes don't transfer | Use keepClasses option if converting back to same context |

## Feature Dependencies

```
[Clipboard Read]
    |
    v
[Auto-detect Content Type]
    |
    +---> [HTML to Markdown] ---> [Main Content Extraction (optional)]
    |
    +---> [RTF to Markdown]
    |
    +---> [Plain Text passthrough]
    |
    v
[Output Formatting]
    |
    +---> [stdout]
    +---> [Clipboard Write]
    +---> [File output]
    +---> [JSON mode]

[Markdown to HTML]
    |
    +---> [Teams-friendly HTML]
    +---> [Email-friendly HTML]
    +---> [Generic HTML]

[Jira Markup] <--bidirectional--> [Markdown]
```

### Dependency Notes

- **Auto-detect requires Clipboard Read:** Can't detect format without reading clipboard first
- **Main Content Extraction enhances HTML to Markdown:** Optional preprocessing step; can be flag-controlled
- **Teams HTML is a flavor of Markdown to HTML:** Same core conversion with Teams-specific output tuning
- **JSON mode is orthogonal:** Can wrap any conversion output in JSON structure
- **Jira is independent pipeline:** Separate from HTML/RTF; needs own parser and generator

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate the core LLM workflow use case.

- [x] **HTML to Markdown conversion** -- Core input path; uses established library (turndown or html-to-markdown)
- [x] **Markdown to HTML conversion** -- Core output path; uses established library (goldmark or markdown-it)
- [x] **stdin/stdout support** -- Essential for piping and agent integration
- [x] **Clipboard read (--paste flag)** -- Read from system clipboard
- [x] **Clipboard write (--copy flag)** -- Write result to clipboard
- [x] **Auto-detect HTML vs plain text** -- Basic content type detection
- [x] **macOS support** -- Primary platform
- [x] **Homebrew tap installation** -- Standard distribution method
- [x] **--quiet mode** -- Clean output for piping
- [x] **Clear error messages** -- Parseable errors for agents

### Add After Validation (v1.x)

Features to add once core is working and validated with real usage.

- [ ] **RTF to Markdown** -- Trigger: Users frequently copying from Word/Notes
- [ ] **Main content extraction (readability)** -- Trigger: Users complaining about nav/boilerplate in output
- [ ] **Jira/Confluence support** -- Trigger: Enterprise users requesting
- [ ] **JSON output mode** -- Trigger: Agent integration patterns emerge
- [ ] **Linux support** -- Trigger: Users requesting
- [ ] **Windows support** -- Trigger: Users requesting

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Watch mode for clipboard** -- Defer: Unvalidated need; complexity high
- [ ] **URL proxy service** -- Defer: CLI solves immediate need; web service is separate product
- [ ] **Smart processors for specific sites** -- Defer: Generic conversion works; site-specific is optimization
- [ ] **Browser extension** -- Defer: Different distribution, maintenance, and review process
- [ ] **Plugin/rules API** -- Defer: Core converters should handle common cases

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| HTML to Markdown | HIGH | MEDIUM | P1 | v1 |
| Markdown to HTML | HIGH | LOW | P1 | v1 |
| stdin/stdout | HIGH | LOW | P1 | v1 |
| Clipboard read | HIGH | MEDIUM | P1 | v1 |
| Clipboard write | HIGH | MEDIUM | P1 | v1 |
| Auto-detect content type | MEDIUM | LOW | P1 | v1 |
| --quiet mode | MEDIUM | LOW | P1 | v1 |
| Error handling | MEDIUM | LOW | P1 | v1 |
| Table conversion | MEDIUM | MEDIUM | P1 | v1 |
| Code block handling | MEDIUM | LOW | P1 | v1 |
| RTF to Markdown | MEDIUM | MEDIUM | P2 | v1.1 |
| Main content extraction | HIGH | HIGH | P2 | v1.1 |
| Jira markup support | MEDIUM | MEDIUM | P2 | v1.2 |
| JSON output mode | LOW | LOW | P2 | v1.1 |
| Teams-optimized HTML | MEDIUM | LOW | P2 | v1.1 |
| Linux support | LOW | MEDIUM | P2 | v1.2 |
| Windows support | LOW | HIGH | P3 | v2 |
| Watch mode | LOW | HIGH | P3 | v2+ |
| URL proxy service | LOW | HIGH | P3 | v2+ |
| Smart processors | LOW | HIGH | P3 | v2+ |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when validated
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Pandoc | Turndown | html-to-markdown (Go) | Jina Reader | clipdown | Our Approach |
|---------|--------|----------|----------------------|-------------|----------|--------------|
| HTML to Markdown | Yes (many formats) | Yes (focused) | Yes (focused) | Yes (via API) | Yes | Use established library |
| Markdown to HTML | Yes | No | No | No | No | Add as core feature |
| Clipboard integration | No | No | No | No | Yes (macOS only) | Core feature |
| Bidirectional | Yes | No | No | No | No | Yes - key differentiator |
| Content extraction | No | No | Optional | Yes (core feature) | No | v1.1 via readability |
| Jira support | Yes | No | No | No | No | v1.2 |
| RTF support | Yes | No | No | No | No | v1.1 |
| JSON output | No | No | No | Yes | No | v1.1 |
| CLI | Yes | Node CLI | Yes | curl/API | Yes | Yes |
| Single binary | No (Haskell) | No (Node) | Yes | N/A (SaaS) | No (Node) | Yes if Go |
| LLM workflow focus | No | No | No | Yes | No | Yes - core positioning |

### Key Insights from Competitors

1. **Pandoc** is the swiss-army knife but has no clipboard integration and is complex to install/use
2. **Turndown** is the gold standard for HTML-to-Markdown quality but is one-directional and needs Node
3. **html-to-markdown (Go)** offers single-binary but is also one-directional
4. **Jina Reader** is LLM-focused but is API-only (no local processing)
5. **clipdown** has clipboard integration but is macOS-only Node app, one-directional

**Our opportunity:** Combine clipboard integration + bidirectional conversion + LLM workflow focus + single binary distribution. No single tool does all of these.

## Sources

### Primary (HIGH confidence)
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html) - Comprehensive feature reference
- [JohannesKaufmann/html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown) - Go library documentation
- [Turndown (mixmark-io)](https://github.com/mixmark-io/turndown) - JavaScript converter reference
- [Mozilla Readability](https://github.com/mozilla/readability) - Content extraction algorithm

### Secondary (MEDIUM confidence)
- [Jina AI Reader](https://jina.ai/reader/) - LLM-focused conversion service
- [clipdown](https://github.com/jhuckaby/clipdown) - macOS clipboard-to-markdown tool
- [md2cb](https://github.com/oderwat/md2cb) - Markdown-to-clipboard tool
- [CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - CLI design patterns
- [Microsoft Teams Markdown Support](https://support.microsoft.com/en-us/office/use-markdown-formatting-in-microsoft-teams) - Teams formatting reference

### Ecosystem Discovery (verified patterns)
- [html-to-markdown edge cases](https://html-to-markdown.com/edge-cases) - Common conversion problems
- [NanoNets llm-data-converter](https://github.com/NanoNets/llm-data-converter) - LLM-ready conversion patterns
- [MarkItDown](https://realpython.com/python-markitdown/) - Microsoft's document-to-markdown approach

---
*Feature research for: text format conversion tools (HTML/Markdown/RTF/Jira)*
*Researched: 2026-01-22*
*LLM workflow focus validated across multiple tools and use cases*
