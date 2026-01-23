# Pitfalls Research

**Domain:** Text format conversion tools (HTML, Markdown, RTF, clipboard)
**Researched:** 2026-01-22
**Confidence:** HIGH (verified with library documentation, GitHub issues, official specifications)

## Critical Pitfalls

### Pitfall 1: Nested Element Conversion Failures

**What goes wrong:**
Nested structures like code blocks inside tables, blockquotes containing code, or nested lists fail to convert correctly. The converter either loses formatting, panics, or produces garbled output.

**Why it happens:**
- HTML allows arbitrary nesting; Markdown has strict structural rules
- Converters process elements linearly without tracking parent context
- Edge cases like `<pre>` inside `<td>` aren't tested
- Markdown table cells cannot contain multi-line content

**How to avoid:**
- Build a context stack during traversal to track parent elements
- Define explicit behavior for each problematic combination (code-in-table, list-in-blockquote)
- For unsupported nesting, preserve as inline HTML rather than corrupting output
- Test with real-world HTML from Jira, Confluence, and documentation sites

**Warning signs:**
- Tests only use flat, simple HTML structures
- No test cases for code blocks in tables or nested blockquotes
- GitHub issue reports of "mangled output" for specific sites

**Phase to address:** Core conversion engine design (Phase 1-2)

**Real-world examples:**
- [JohannesKaufmann/html-to-markdown #185](https://github.com/JohannesKaufmann/html-to-markdown): "Code in table convert error"
- [JohannesKaufmann/html-to-markdown #183](https://github.com/JohannesKaufmann/html-to-markdown): "Codeblock inside Blockquote"

---

### Pitfall 2: Round-Trip Fidelity Loss Without Detection

**What goes wrong:**
Converting HTML to Markdown then back to HTML produces different output than the original. Users don't realize content was lost until much later.

**Why it happens:**
- Markdown is less expressive than HTML (no colors, merged cells, custom attributes)
- Converters silently drop unsupported features
- No warning mechanism when information is lost
- Testing focuses on "output looks right" not "output preserves meaning"

**How to avoid:**
- Classify HTML features as: fully-supported, degraded, unsupported
- Return metadata indicating what was lost during conversion
- For critical content (tables with merged cells, colored text), offer HTML passthrough mode
- Implement round-trip tests: `HTML -> MD -> HTML` should produce semantic equivalence

**Warning signs:**
- No fidelity metrics or warnings in API responses
- Users report "my formatting disappeared"
- Testing only validates one direction of conversion

**Phase to address:** Core conversion engine and API design (Phase 1-2)

**Real-world examples:**
- RTF bullets use custom symbols; Markdown only supports `-` or `1.` - deep nesting collapses
- Table colspan/rowspan cannot be represented in GFM Markdown tables
- [Wikipedia: Round-trip format conversion](https://en.wikipedia.org/wiki/Round-trip_format_conversion) documents fidelity loss patterns

---

### Pitfall 3: Malformed HTML Causing Crashes

**What goes wrong:**
Real-world HTML from websites, email clients, and rich text editors contains broken tags, unclosed elements, and invalid nesting. The parser panics or produces garbage.

**Why it happens:**
- Testing uses well-formed HTML from documentation
- Browser-parsed HTML differs from raw response HTML
- Email clients produce notoriously bad HTML
- Copy-paste from Word/Outlook includes malformed markup

**How to avoid:**
- Use Go's `golang.org/x/net/html` package which follows HTML5 error recovery
- Never assume HTML is well-formed; test with malformed input
- Catch panics at API boundaries and return errors gracefully
- Create a corpus of "broken HTML in the wild" for testing

**Warning signs:**
- Parser panics in production logs
- Tests only use hand-crafted, valid HTML
- No error recovery strategy documented

**Phase to address:** Parser foundation (Phase 1)

**Real-world examples:**
- [golang/go #27016](https://github.com/golang/go/issues/27016): `html.Parse()` panic with `<template><object>`
- [golang/go #27702](https://github.com/golang/go/issues/27702): CVE-2018-17142 malformed HTML panic
- [golang/go #1661](https://github.com/golang/go/issues/1661): Tokenizer error with JavaScript containing `<`

---

### Pitfall 4: Cross-Platform Clipboard Incompatibilities

**What goes wrong:**
Clipboard operations work on dev machine but fail in production or on other platforms. Linux users get crashes, Windows users get garbled text, macOS users lose formatting.

**Why it happens:**
- Linux X11/Wayland clipboard is fundamentally different from Windows/macOS
- Clipboard libraries require CGO and platform-specific dependencies
- Format negotiation differs: Windows CF_HTML vs macOS RTF vs X11 selections
- Testing only on one platform during development

**How to avoid:**
- Test on all three platforms from day one (use CI matrix)
- Implement graceful fallbacks when clipboard access fails
- Support multiple clipboard formats per platform (text/html, text/plain, text/rtf)
- Document required dependencies (libx11-dev on Linux, CGO requirements)

**Warning signs:**
- "Works on my Mac" during development
- No Linux or Windows testing in CI
- Clipboard library issues open for years without resolution

**Phase to address:** Clipboard integration (dedicated phase after core conversion)

**Real-world examples:**
- [golang-design/clipboard #61](https://github.com/golang-design/clipboard): "Crashing on Wayland"
- [golang-design/clipboard #71](https://github.com/golang-design/clipboard): "Clipboard crashing on macOS"
- [golang-design/clipboard #85](https://github.com/golang-design/clipboard): "Linux write waits 5s after Init failure"

---

### Pitfall 5: Whitespace and Line Break Corruption

**What goes wrong:**
Whitespace in the output is wrong: code blocks lose indentation, paragraphs merge together, or extra blank lines appear everywhere. Markdown rendering looks different from expected.

**Why it happens:**
- HTML collapses whitespace by default; Markdown treats it as significant
- `<pre>` and `<code>` blocks preserve whitespace differently
- Line break normalization varies (CR, LF, CRLF)
- Markdown requires blank lines between block elements

**How to avoid:**
- Distinguish between significant whitespace (in `<pre>`) and collapsible whitespace
- Normalize line endings early in the pipeline
- Validate output against Markdown spec requirements for block separation
- Test with whitespace-sensitive content: Python code, ASCII art, formatted tables

**Warning signs:**
- Code samples lose indentation
- Double-spaced or no-spaced output
- Tests pass but rendered Markdown looks wrong

**Phase to address:** Core conversion engine (Phase 1-2)

**Real-world examples:**
- [JohannesKaufmann/html-to-markdown #193](https://github.com/JohannesKaufmann/html-to-markdown): "Line break is \\ n \\ n"
- [Microsoft Teams strips indentation](https://techcommunity.microsoft.com/t5/microsoft-teams/why-does-teams-always-strip-indentation-when-pasting-text/td-p/2349812) when pasting

---

### Pitfall 6: Character Encoding and Entity Handling

**What goes wrong:**
Special characters appear as mojibake, emoji break, HTML entities show up raw (`&nbsp;` instead of space), or characters are double-encoded.

**Why it happens:**
- Assuming UTF-8 when source is Windows-1252 or other encoding
- Not decoding HTML entities before output
- Double-encoding already-escaped content
- Emoji (4-byte UTF-8) not handled correctly

**How to avoid:**
- Detect encoding from HTML meta tags or BOM
- Decode all HTML entities (named, decimal, hex) during parsing
- Normalize to UTF-8 NFC form for consistent output
- Test with emoji, CJK characters, RTL text, and combining diacritics

**Warning signs:**
- `&amp;` appearing in output instead of `&`
- Emoji rendering as multiple characters or question marks
- "Works in English" but fails for international content

**Phase to address:** Parser foundation (Phase 1)

**Real-world examples:**
- [Smashing Magazine: Everything About Emoji](https://www.smashingmagazine.com/2016/11/character-sets-encoding-emoji/) documents multi-byte emoji pitfalls
- `&nbsp;` is ASCII 160, not ASCII 32 - trim() won't remove it
- XML requires lowercase `x` in hex entities (`&#xA1b` not `&#XA1b`)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Regex-based HTML parsing | Quick implementation, no dependencies | Breaks on edge cases, security vulnerabilities, unmaintainable | Never for production |
| Ignoring clipboard format detection | Simpler API, faster development | Wrong conversion applied, corrupted output | Prototype only |
| Single Markdown flavor output | Less code, faster to ship | Users stuck with incompatible output (GFM vs CommonMark vs MultiMarkdown) | MVP, add flavor options later |
| Skipping content detection for URLs | Simpler pipeline | Converts nav, ads, footers as content | Never for URL proxy feature |
| Loading entire document into memory | Simpler code, no streaming complexity | OOM on large documents (>10MB HTML) | Acceptable for typical documents (<1MB) |
| Hardcoded test fixtures | Fast to write | Tests don't cover real-world edge cases | Supplement with golden files from real sites |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Microsoft Teams HTML | Assuming standard HTML | Teams uses custom clipboard format; detect `text/html` flavor and parse Teams-specific structure |
| Jira/Confluence | Using Markdown directly | Atlassian uses custom wiki markup; need bidirectional converter for Atlassian format |
| Outlook rich text | Parsing as clean HTML | Outlook HTML is notoriously bloated with Word-style markup; strip mso-* styles |
| GitHub Issues | Treating as plain HTML | GitHub uses GFM; preserve task lists, mentions, emoji shortcodes |
| Slack messages | Ignoring mrkdwn format | Slack uses custom "mrkdwn" which differs from standard Markdown |
| Web page URLs | Fetching raw HTML | JavaScript-rendered content not in initial response; may need headless browser for SPAs |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full HTML into memory | OOM errors, slow response | Stream processing for documents >1MB | >10MB documents (email attachments, exported PDFs) |
| Synchronous URL fetching | Request timeouts, thread blocking | Async fetch with configurable timeout | >5 concurrent URL conversions |
| No caching for URL content | Repeated slow fetches | Cache extracted content with TTL | High-traffic web service |
| Regex for HTML parsing | O(n^2) complexity, catastrophic backtracking | Use proper HTML parser | Complex nested HTML >100KB |
| Deep DOM recursion | Stack overflow on deeply nested HTML | Iterative traversal with explicit stack | Malicious or generated HTML with >1000 nesting levels |
| Unbound clipboard watch | CPU spin, battery drain | Polling with configurable interval or OS-level hooks | Always-on clipboard monitor |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Not sanitizing HTML output | XSS when rendered in browser | Use bluemonday or similar HTML sanitizer before display |
| Trusting clipboard content | Malicious content injection | Sanitize clipboard input before processing |
| Executing URLs without validation | SSRF attacks, internal network exposure | Whitelist allowed URL schemes (http/https), validate target |
| No size limits on input | DoS via large document | Enforce max input size (e.g., 10MB) |
| Exposing internal errors | Information disclosure | Return generic errors, log details internally |
| Following redirects blindly | Open redirect exploitation | Limit redirect count, validate redirect targets |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent information loss | User doesn't know formatting was dropped | Return warnings: "3 tables with merged cells converted to simple tables" |
| No preview before conversion | User commits to potentially wrong output | Offer preview mode for web interface |
| Cryptic error messages | User can't fix the problem | Specific errors: "Line 42: unclosed <div> tag" |
| All-or-nothing conversion | One bad element fails entire document | Convert what's possible, report failures separately |
| No undo for clipboard operations | User loses original clipboard content | Store previous clipboard content, offer restore option |
| Inconsistent output across runs | User can't trust results | Deterministic conversion with same input -> same output |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **HTML to Markdown:** Often missing table support - verify with rowspan/colspan tables
- [ ] **Table conversion:** Often missing nested tables - verify with real Confluence exports
- [ ] **Code blocks:** Often missing language detection - verify syntax hint preservation from `class="language-*"`
- [ ] **Clipboard read:** Often missing format detection - verify correct conversion of HTML vs RTF vs plain text
- [ ] **URL proxy:** Often missing content extraction - verify it strips nav/ads on news sites
- [ ] **Whitespace:** Often missing `<pre>` handling - verify Python code indentation survives
- [ ] **Entities:** Often missing numeric entities - verify `&#x1F600;` emoji decodes correctly
- [ ] **Round-trip:** Often missing semantic preservation - verify HTML->MD->HTML produces equivalent output
- [ ] **Error handling:** Often missing graceful degradation - verify malformed HTML doesn't crash
- [ ] **Cross-platform:** Often missing Linux testing - verify clipboard works on X11 and Wayland

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Nested element failures | LOW | Add context tracking, update golden tests, release patch |
| Round-trip fidelity loss | MEDIUM | Document known losses, add HTML passthrough flag, update docs |
| Malformed HTML crashes | LOW | Add panic recovery, create regression test, release patch |
| Clipboard platform bugs | HIGH | Investigate platform-specific code, may need library change or fork |
| Whitespace corruption | MEDIUM | Audit whitespace handling, add test cases, may require redesign |
| Encoding issues | MEDIUM | Add encoding detection, normalize to UTF-8, add test corpus |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Nested element failures | Phase 1: Core engine | Golden tests with nested structures pass |
| Round-trip fidelity loss | Phase 1: Core engine | Round-trip tests verify semantic equivalence |
| Malformed HTML crashes | Phase 1: Parser foundation | Fuzz testing with malformed HTML corpus |
| Cross-platform clipboard | Phase 3: Clipboard integration | CI tests on Linux, Windows, macOS |
| Whitespace corruption | Phase 1: Core engine | Golden tests with whitespace-sensitive content |
| Encoding issues | Phase 1: Parser foundation | Test corpus with international content |
| Content extraction failures | Phase 2: Smart processors | Test against real news/documentation sites |
| Performance at scale | Phase 4: Optimization | Load testing with large documents |

---

## Testing Strategy Recommendations

### Golden File Testing

Use [golden file testing](https://ieftimov.com/posts/testing-in-go-golden-files/) for conversion output validation:

1. Create `testdata/` directory with input HTML files
2. Run converter with `-update` flag to generate `.golden` files
3. Git diff shows exactly what changed in output
4. Review changes carefully during code review

**Libraries:** [sebdah/goldie](https://github.com/sebdah/goldie), [gotest.tools/golden](https://pkg.go.dev/gotest.tools/v3/golden)

### Real-World Test Corpus

Build a corpus of problematic HTML from:
- Outlook/Word exports
- Confluence/Jira exports
- News sites (NYT, BBC)
- Documentation sites (MDN, Go docs)
- GitHub issues and READMEs
- Teams/Slack message exports

### Round-Trip Verification

```
For each test case:
  1. original_html -> markdown
  2. markdown -> regenerated_html
  3. Assert semantic_equivalent(original_html, regenerated_html)
```

Use pandoc for reference: `pandoc -f html -t markdown | pandoc -f markdown -t html`

---

## Sources

**Library Documentation and Issues:**
- [JohannesKaufmann/html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown) - Go HTML to Markdown library issues
- [golang-design/clipboard](https://github.com/golang-design/clipboard) - Go cross-platform clipboard library issues
- [golang/go x/net/html issues](https://github.com/golang/go/issues?q=x%2Fnet%2Fhtml) - Go HTML parser bugs

**Specifications and Standards:**
- [RTF Specification 1.5](https://www.biblioscape.com/rtf15_spec.htm) - RTF parsing edge cases
- [Windows CF_HTML Format](https://learn.microsoft.com/en-us/windows/win32/dataxchg/html-clipboard-format) - Windows clipboard HTML format
- [Wikipedia: UTF-8](https://en.wikipedia.org/wiki/UTF-8) - Character encoding details

**Content Extraction:**
- [Arc90 Readability Algorithm](https://medium.com/@kamendamov/extracting-significant-content-from-a-web-page-using-arc90-readability-algorithm-636e2c1951e7)
- [Trafilatura Evaluation](https://trafilatura.readthedocs.io/en/latest/evaluation.html) - Content extraction comparison

**Testing Patterns:**
- [Testing in Go: Golden Files](https://ieftimov.com/posts/testing-in-go-golden-files/)
- [sebdah/goldie](https://github.com/sebdah/goldie) - Golden file testing library

**Platform-Specific Issues:**
- [Cross-platform clipboard library development](https://jtanx.github.io/2016/08/19/a-cross-platform-clipboard-library/)
- [Microsoft Teams formatting quirks](https://techcommunity.microsoft.com/t5/microsoft-teams/why-does-teams-always-strip-indentation-when-pasting-text/td-p/2349812)
- [Jira/Confluence Markdown limitations](https://community.atlassian.com/forums/Confluence-questions/Using-markdown-tables/qaq-p/578215)

---
*Pitfalls research for: text-transform (HTML/Markdown/RTF converter)*
*Researched: 2026-01-22*
