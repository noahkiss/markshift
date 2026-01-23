# Phase 3: Markdown to HTML - Research

**Researched:** 2026-01-23
**Domain:** Markdown to HTML conversion, GFM support, round-trip semantics, email/Teams compatibility
**Confidence:** HIGH

## Summary

Phase 3 implements the Markdown to HTML converter, enabling bidirectional conversion when paired with Phase 2's HTML to Markdown converter. Research confirms that **marked v17.0.1** is the optimal choice for this project due to its built-in TypeScript definitions, pure ESM support, GFM out-of-the-box, excellent performance, and simple API.

Marked requires minimal configuration for our use case: enable `gfm: true` (default) for tables, strikethrough, and task lists. The library includes built-in TypeScript types (`./lib/marked.d.ts`), eliminating the need for `@types/marked`. For output suitable for Teams/email paste, use inline styles via custom renderer rather than CSS classes.

Security note: Marked does NOT sanitize HTML by default. For user-generated content, use DOMPurify as a postprocess hook. For this project's internal conversion use case (no user input), sanitization is optional but should be documented.

**Primary recommendation:** Use marked v17.0.1 with GFM enabled, implement a MarkdownToHtmlConverter class following the existing Converter interface pattern, and add a custom renderer option for Teams/email-compatible output (inline styles, simple tags).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| marked | 17.0.1 | Markdown to HTML conversion | Built-in TypeScript types, ESM native, 36.5k stars, GFM built-in, fastest pure-JS parser |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| marked-gfm-heading-id | 4.1.3 | Add IDs to headings | When generating HTML for documentation with anchor links |
| isomorphic-dompurify | 2.x | HTML sanitization | When processing untrusted user input (XSS prevention) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| marked | markdown-it | markdown-it has better plugin ecosystem but requires @types/markdown-it, slightly more complex API |
| marked | showdown | showdown is bidirectional but slower, less maintained |
| marked | remark/rehype | remark is AST-based, more powerful but heavier, better for complex transformations |

**Installation:**
```bash
npm install marked
# No @types needed - marked includes TypeScript definitions
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── converters/
│   ├── index.ts                    # Registry and Converter interface
│   ├── html-to-markdown/           # Existing Phase 2 converter
│   └── markdown-to-html/
│       ├── index.ts                # MarkdownToHtmlConverter class
│       └── renderers/              # Optional custom renderers
│           └── email-compatible.ts # Inline-style renderer for Teams/email
```

### Pattern 1: Wrapper Converter Class
**What:** Wrap marked in a class implementing the Converter interface
**When to use:** All Markdown to HTML conversion
**Example:**
```typescript
// Source: Marked official docs, Project Converter interface from Phase 1
import { marked } from 'marked';
import type { ConvertOptions, ConvertResult, Format } from '../../types/index.js';
import type { Converter } from '../index.js';

export class MarkdownToHtmlConverter implements Converter {
  readonly sourceFormat: Format = 'markdown';
  readonly targetFormat: Format = 'html';

  constructor() {
    // Configure marked with GFM support
    marked.use({
      gfm: true,        // GitHub Flavored Markdown (tables, strikethrough, etc.)
      breaks: false,    // Don't convert \n to <br> (preserve source intent)
    });
  }

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    const startTime = performance.now();
    const content = marked.parse(input) as string;
    const processingTimeMs = performance.now() - startTime;

    return {
      content,
      metadata: {
        sourceFormat: this.sourceFormat,
        targetFormat: this.targetFormat,
        processingTimeMs,
      },
    };
  }
}
```

### Pattern 2: Custom Renderer for Teams/Email Compatibility
**What:** Override default renderer to use inline styles instead of CSS classes
**When to use:** When output must paste correctly into Teams, Outlook, or webmail
**Example:**
```typescript
// Source: Marked custom renderer docs
import { marked, Renderer } from 'marked';

const emailCompatibleRenderer: Partial<Renderer> = {
  code({ text, lang }) {
    // Use inline styles instead of class="language-X"
    return `<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>${text}</code></pre>`;
  },

  table({ header, rows }) {
    // Add inline border styles for email clients
    return `<table style="border-collapse: collapse; width: 100%;">
      <thead>${header}</thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  tablecell({ text, header, align }) {
    const tag = header ? 'th' : 'td';
    const style = `border: 1px solid #ddd; padding: 8px;${align ? ` text-align: ${align};` : ''}`;
    return `<${tag} style="${style}">${text}</${tag}>`;
  },

  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote style="border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #666;">${body}</blockquote>`;
  },
};

marked.use({ renderer: emailCompatibleRenderer });
```

### Pattern 3: Synchronous Parse (Match Existing Interface)
**What:** Use marked.parse() synchronously to match Converter interface
**When to use:** Always - our interface is synchronous
**Example:**
```typescript
// Source: Marked docs - parse returns string when not async
// marked.parse() returns string when async: false (default)
const html = marked.parse(markdown) as string;

// For async mode (not needed for our use case):
// marked.use({ async: true });
// const html = await marked.parse(markdown); // returns Promise<string>
```

### Anti-Patterns to Avoid
- **Enabling async mode:** Our Converter interface is synchronous; marked is sync by default
- **Adding CSS classes for styling:** Teams/email clients strip external CSS; use inline styles
- **Skipping security for user input:** Always sanitize with DOMPurify for untrusted content
- **Using marked.parse without type assertion:** Returns `string | Promise<string>`; cast to `string` when sync
- **Creating multiple marked instances:** Use `marked.use()` to configure the singleton

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown parsing | Regex-based parser | marked | CommonMark + GFM spec is complex; edge cases abound |
| GFM tables | Manual table parser | marked's GFM mode | Alignment, escaping, colspan handling |
| Code block language | Custom fence parser | marked's built-in | Language extraction already handled |
| HTML sanitization | Regex filtering | DOMPurify | XSS vectors are numerous and subtle |
| Strikethrough/task lists | Custom extensions | marked's GFM mode | Already included in GFM |

**Key insight:** Markdown parsing appears simple but the CommonMark spec is 600+ test cases. GFM adds tables, task lists, strikethrough, and autolinks. Marked handles all of this out of the box.

## Common Pitfalls

### Pitfall 1: XSS Vulnerability
**What goes wrong:** Malicious markdown injects `<script>` tags or `javascript:` URLs
**Why it happens:** Marked outputs raw HTML by default; markdown allows embedded HTML
**How to avoid:** For user input, wrap with DOMPurify: `DOMPurify.sanitize(marked.parse(input))`
**Warning signs:** HTML content appears in output that wasn't in markdown source

### Pitfall 2: Async/Sync Type Mismatch
**What goes wrong:** TypeScript error or runtime Promise where string expected
**Why it happens:** `marked.parse()` returns `string | Promise<string>` depending on `async` option
**How to avoid:** Keep `async: false` (default) and cast result: `marked.parse(md) as string`
**Warning signs:** TypeScript complaints about Promise type

### Pitfall 3: Teams/Email Strips Formatting
**What goes wrong:** Tables appear plain, code blocks unstyled when pasted into Teams
**Why it happens:** Email clients strip `<style>` tags and external CSS; ignore class attributes
**How to avoid:** Use custom renderer with inline `style=""` attributes
**Warning signs:** HTML looks correct in browser but loses formatting in Teams

### Pitfall 4: Round-Trip Semantic Loss
**What goes wrong:** HTML -> MD -> HTML produces different structure
**Why it happens:** Markdown is less expressive than HTML; some semantics lost in first conversion
**How to avoid:** Accept that round-trip preserves meaning, not exact structure; test key elements
**Warning signs:** Nested divs, complex tables, or custom HTML disappear

### Pitfall 5: Language Class Mismatch
**What goes wrong:** Phase 2 extracts `language-X`, Phase 3 outputs `language-Y`
**Why it happens:** Different conventions: `lang-X`, `language-X`, `hljs X`
**How to avoid:** Marked uses `language-` prefix by default (configurable via `langPrefix`); match Phase 2's extraction patterns
**Warning signs:** Syntax highlighting breaks after round-trip

### Pitfall 6: Line Break Handling
**What goes wrong:** Single newlines become `<br>` or are ignored unexpectedly
**Why it happens:** `breaks: true` converts `\n` to `<br>`; default is false
**How to avoid:** Keep `breaks: false` (default) for standard Markdown behavior
**Warning signs:** Prose paragraphs have unexpected line breaks

## Code Examples

Verified patterns from official sources:

### Basic Configuration
```typescript
// Source: Marked official documentation
import { marked } from 'marked';

// Configure once at initialization
marked.use({
  gfm: true,           // Enable GFM (tables, strikethrough, task lists)
  breaks: false,       // Don't convert \n to <br>
  pedantic: false,     // Don't try to emulate original markdown.pl bugs
});

// Parse markdown to HTML
const html = marked.parse('# Hello\n\n**bold** and *italic*') as string;
// Output: <h1>Hello</h1>\n<p><strong>bold</strong> and <em>italic</em></p>
```

### GFM Tables
```typescript
// Source: Marked GFM documentation
const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;

const html = marked.parse(markdown) as string;
// Output:
// <table>
//   <thead><tr><th>Header 1</th><th>Header 2</th></tr></thead>
//   <tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody>
// </table>
```

### Task Lists
```typescript
// Source: Marked GFM documentation
const markdown = `
- [x] Completed task
- [ ] Pending task
`;

const html = marked.parse(markdown) as string;
// Output:
// <ul>
//   <li><input checked="" disabled="" type="checkbox"> Completed task</li>
//   <li><input disabled="" type="checkbox"> Pending task</li>
// </ul>
```

### Code Blocks with Language
```typescript
// Source: Marked documentation
const markdown = '```javascript\nconst x = 1;\n```';

const html = marked.parse(markdown) as string;
// Output: <pre><code class="language-javascript">const x = 1;\n</code></pre>
```

### Security with DOMPurify
```typescript
// Source: Marked security documentation
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// Create a sanitizing postprocess hook
marked.use({
  hooks: {
    postprocess(html) {
      return DOMPurify.sanitize(html);
    }
  }
});

// Malicious input is neutralized
const html = marked.parse('<img src=x onerror=alert(1)//>');
// Output: <img src="x"> (onerror removed)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CommonJS require | ESM import | marked v4+ | Tree-shaking, modern bundlers |
| @types/marked | Built-in types | marked v4+ | No separate type package needed |
| marked.setOptions() | marked.use() | marked v4+ | Chainable, plugin-friendly API |
| Custom sanitization | DOMPurify hook | 2022+ | Standard XSS prevention pattern |

**Deprecated/outdated:**
- `marked.setOptions()`: Use `marked.use({ ... })` instead
- `@types/marked`: marked now ships with TypeScript definitions
- `highlight` option for syntax highlighting: Use marked-highlight extension instead
- `sanitize` option: Removed; use DOMPurify externally

## Open Questions

Things that couldn't be fully resolved:

1. **Email/Teams renderer scope**
   - What we know: Teams strips CSS classes and external styles; inline styles work
   - What's unclear: Exact subset of HTML/CSS that Teams supports varies by version
   - Recommendation: Test with common elements (tables, code, quotes); document known limitations

2. **Round-trip fidelity testing**
   - What we know: HTML -> MD -> HTML won't be identical but should preserve meaning
   - What's unclear: Which elements to test for semantic equivalence
   - Recommendation: Test headings, links, bold/italic, lists, tables, code blocks; accept structural differences

3. **DOMPurify inclusion**
   - What we know: Required for user-input security; optional for internal conversion
   - What's unclear: Whether to include as optional dependency or always require
   - Recommendation: Document security implications; don't include by default (internal tool use case)

## Sources

### Primary (HIGH confidence)
- `/markedjs/marked` (Context7) - API, configuration, security, custom renderers
- npm registry - Verified marked 17.0.1, built-in types at `./lib/marked.d.ts`
- [marked GitHub](https://github.com/markedjs/marked) - ESM exports, GFM support

### Secondary (MEDIUM confidence)
- [npm-compare.com](https://npm-compare.com/markdown-it,marked,remark,showdown) - Library comparison, download stats
- [Marked security docs](https://github.com/markedjs/marked/blob/master/docs/INDEX.md) - DOMPurify integration pattern

### Tertiary (LOW confidence)
- WebSearch results on Teams/email HTML compatibility - General patterns, requires testing
- WebSearch results on XSS in markdown - General security awareness

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via npm, Context7, official docs
- Architecture: HIGH - Patterns match Phase 2 and verified via marked docs
- Code examples: HIGH - Derived from Context7 and official documentation
- Pitfalls: MEDIUM - XSS well-documented; Teams compatibility needs testing
- Email/Teams renderer: LOW - Needs validation against actual Teams behavior

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - marked ecosystem is stable)
