# Phase 2: HTML to Markdown - Research

**Researched:** 2026-01-23
**Domain:** HTML to Markdown conversion, DOM parsing, GFM tables, code block handling
**Confidence:** HIGH

## Summary

Phase 2 implements the HTML to Markdown converter, the core transformation engine for markshift. Research confirms that **turndown v7.2.2** is the industry-standard library for this task, with 1,277 dependent packages and active maintenance (last release October 2025). Turndown v7+ uses a custom `@mixmark-io/domino` DOM parser instead of JSDOM, eliminating security risks from script execution.

For GFM table support and strikethrough, use **@truto/turndown-plugin-gfm v1.0.2**, an ESM-only fork with 20x performance improvements for table conversion and robust edge case handling. The plugin includes tables, strikethrough, task lists, and highlighted code block plugins.

The converter must implement custom rules for extracting code block language hints from HTML class attributes (e.g., `lang-javascript`, `language-python`, `highlight-source-js`). Turndown's options handle most requirements out-of-box, but whitespace in code blocks requires using `node.textContent` rather than the converted `content` parameter.

**Primary recommendation:** Use turndown v7.2.2 with @truto/turndown-plugin-gfm v1.0.2, implement a custom rule for language extraction from code blocks, and wrap the converter to match the existing Converter interface.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turndown | 7.2.2 | HTML to Markdown conversion | Industry standard, 1277+ dependents, active maintenance, uses safe domino parser |
| @truto/turndown-plugin-gfm | 1.0.2 | GFM tables, strikethrough, task lists | ESM-only, 20x faster tables, modern tooling, TypeScript declarations |
| @types/turndown | 5.0.6 | TypeScript type definitions | DefinitelyTyped maintained, matches turndown API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| html-entities | 2.6.0 | HTML entity decode/encode | Only if turndown's built-in handling is insufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| turndown | node-html-markdown | Faster (1.57x), but less ecosystem support, fewer plugins, smaller community |
| @truto/turndown-plugin-gfm | @joplin/turndown-plugin-gfm | Joplin fork has different focus, slower table conversion, CJS format |
| domino (built-in) | JSDOM | JSDOM is spec-compliant but slower, security risk (script execution), heavier |

**Installation:**
```bash
npm install turndown @truto/turndown-plugin-gfm
npm install -D @types/turndown
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── converters/
│   ├── index.ts              # Registry and Converter interface
│   ├── html-to-markdown/
│   │   ├── index.ts          # HtmlToMarkdownConverter class
│   │   ├── rules/            # Custom turndown rules
│   │   │   └── code-language.ts  # Language extraction rule
│   │   └── options.ts        # Configuration mapping
```

### Pattern 1: Wrapper Converter Class
**What:** Wrap turndown in a class implementing the Converter interface
**When to use:** All HTML to Markdown conversion
**Example:**
```typescript
// Source: Project Converter interface from Phase 1
import TurndownService from 'turndown';
import { gfm } from '@truto/turndown-plugin-gfm';
import type { Converter, ConvertOptions, ConvertResult, Format } from '../types/index.js';

export class HtmlToMarkdownConverter implements Converter {
  readonly sourceFormat: Format = 'html';
  readonly targetFormat: Format = 'markdown';

  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '_',
      strongDelimiter: '**',
      bulletListMarker: '-',
    });

    // Add GFM support (tables, strikethrough, task lists)
    this.turndown.use(gfm);

    // Add custom rules for language extraction
    this.addCodeLanguageRule();
  }

  convert(input: string, options?: ConvertOptions): ConvertResult {
    const startTime = performance.now();
    const content = this.turndown.turndown(input);
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

  private addCodeLanguageRule(): void {
    // Implementation in Pattern 2
  }
}
```

### Pattern 2: Code Language Extraction Rule
**What:** Custom turndown rule to extract language from HTML class attributes
**When to use:** When converting code blocks to preserve syntax highlighting hints
**Example:**
```typescript
// Source: Derived from GitHub issue #192, Stack Overflow plugin pattern
// Common class patterns: lang-js, language-javascript, highlight-source-python
const languagePatterns = [
  /\blang(?:uage)?-([a-z0-9]+)\b/i,      // lang-js, language-javascript
  /\bhighlight-source-([a-z0-9]+)\b/i,   // GitHub style
  /\bhljs\s+([a-z0-9]+)\b/i,             // highlight.js style
];

function extractLanguage(node: HTMLElement): string {
  const className = node.className || '';
  // Check the code element first, then pre parent
  const targets = [node, node.parentElement].filter(Boolean);

  for (const target of targets) {
    const classes = (target as HTMLElement).className || '';
    for (const pattern of languagePatterns) {
      const match = classes.match(pattern);
      if (match) return match[1].toLowerCase();
    }
  }
  return '';
}

// Add as turndown rule
this.turndown.addRule('fencedCodeBlock', {
  filter: (node, options) => {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    );
  },
  replacement: (content, node, options) => {
    const codeNode = node.firstChild as HTMLElement;
    const language = extractLanguage(codeNode);
    const fence = options.fence || '```';
    // Use textContent to preserve whitespace exactly
    const code = codeNode.textContent || '';

    return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
  },
});
```

### Pattern 3: Test Structure with Input/Output Fixtures
**What:** Table-driven tests with HTML input and expected Markdown output
**When to use:** All converter tests
**Example:**
```typescript
// Source: Vitest patterns + showdown.js test approach
import { describe, it, expect } from 'vitest';
import { HtmlToMarkdownConverter } from './index.js';

const converter = new HtmlToMarkdownConverter();

const fixtures = [
  {
    name: 'simple paragraph',
    html: '<p>Hello world</p>',
    markdown: 'Hello world',
  },
  {
    name: 'heading levels',
    html: '<h1>Title</h1><h2>Subtitle</h2>',
    markdown: '# Title\n\n## Subtitle',
  },
  {
    name: 'code block with language',
    html: '<pre><code class="lang-javascript">const x = 1;</code></pre>',
    markdown: '```javascript\nconst x = 1;\n```',
  },
  // More fixtures...
];

describe('HtmlToMarkdownConverter', () => {
  describe.each(fixtures)('$name', ({ html, markdown }) => {
    it('converts correctly', () => {
      const result = converter.convert(html);
      expect(result.content.trim()).toBe(markdown);
    });
  });
});
```

### Anti-Patterns to Avoid
- **Using JSDOM manually:** Turndown v7+ includes domino; don't add JSDOM as a dependency
- **Regex-based HTML parsing:** Never parse HTML with regex; always use DOM parsing
- **Modifying turndown content parameter in code rules:** Use `node.textContent` for exact whitespace preservation
- **Single global turndown instance:** Create per-request or use instance per converter for thread safety

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML to Markdown | Custom regex/parser | turndown | 100+ edge cases for tags, nesting, whitespace |
| GFM tables | Custom table parser | @truto/turndown-plugin-gfm | colspan, rowspan, escaping, malformed HTML |
| HTML entity decoding | Manual entity map | Built-in to turndown/domino | 2000+ named entities, numeric entities |
| DOM parsing in Node | Custom parser | turndown's built-in domino | Handles malformed HTML gracefully |
| Strikethrough syntax | Custom rule | @truto/turndown-plugin-gfm | Handles del, s, strike tags |
| Task lists | Custom checkbox rule | @truto/turndown-plugin-gfm | Converts input[type=checkbox] correctly |

**Key insight:** HTML is far more complex than it appears. Turndown handles hundreds of edge cases: nested inline elements, whitespace normalization, block vs inline context, void elements, and more. Custom solutions will fail on real-world HTML.

## Common Pitfalls

### Pitfall 1: Losing Whitespace in Code Blocks
**What goes wrong:** Code blocks lose indentation or newlines
**Why it happens:** Using the `content` parameter (already processed) instead of `node.textContent`
**How to avoid:** In custom code block rules, always use `node.firstChild.textContent` to get raw code
**Warning signs:** Python code loses indentation, multi-line code becomes single line

### Pitfall 2: Missing Language Hints
**What goes wrong:** `<pre><code class="language-python">` becomes just ` ``` ` without `python`
**Why it happens:** Turndown's default rules don't extract language from class attributes
**How to avoid:** Add custom rule with `addRule()` that extracts language from common patterns (lang-*, language-*, highlight-source-*)
**Warning signs:** All code blocks have no language identifier in output

### Pitfall 3: Malformed HTML Crashes
**What goes wrong:** Converter throws on invalid HTML
**Why it happens:** Assuming input is always valid HTML
**How to avoid:** Turndown's domino parser handles malformed HTML gracefully; no extra handling needed. Wrap convert() in try-catch for unexpected edge cases only.
**Warning signs:** Crashes on real-world content from websites

### Pitfall 4: Table Alignment Lost
**What goes wrong:** Table column alignment (left/center/right) not preserved
**Why it happens:** Using basic turndown without GFM plugin
**How to avoid:** Use @truto/turndown-plugin-gfm's tables plugin which handles alignment
**Warning signs:** All table columns left-aligned regardless of source

### Pitfall 5: HTML Entities Doubled
**What goes wrong:** `&amp;` becomes `&amp;amp;` or `&`
**Why it happens:** Decoding entities then passing to turndown which decodes again
**How to avoid:** Let turndown handle entity decoding; pass raw HTML string
**Warning signs:** `&lt;` appearing in output, or `<` where `&lt;` should be

### Pitfall 6: Emoji/CJK Rendering Issues
**What goes wrong:** Emoji appear as `?` or CJK characters corrupted
**Why it happens:** Encoding mismatch or incorrect string handling
**How to avoid:** Ensure UTF-8 throughout: input string, output string, file I/O
**Warning signs:** Characters appearing as replacement characters (U+FFFD)

## Code Examples

Verified patterns from official sources:

### Basic Turndown Configuration
```typescript
// Source: turndown README.md, Context7 documentation
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',           // # style headings (not === underlines)
  codeBlockStyle: 'fenced',      // ``` blocks (not indented)
  fence: '```',                  // fence character
  emDelimiter: '_',              // _italic_
  strongDelimiter: '**',         // **bold**
  bulletListMarker: '-',         // - list items
  linkStyle: 'inlined',          // [text](url)
  linkReferenceStyle: 'full',    // [text][id] with [id]: url
});
```

### Adding GFM Plugin
```typescript
// Source: @truto/turndown-plugin-gfm documentation
import TurndownService from 'turndown';
import { gfm, tables, strikethrough, taskListItems } from '@truto/turndown-plugin-gfm';

const turndownService = new TurndownService();

// Use all GFM features
turndownService.use(gfm);

// Or use individually
// turndownService.use(tables);
// turndownService.use(strikethrough);
// turndownService.use(taskListItems);
```

### Custom Rule for Keeping HTML Elements
```typescript
// Source: turndown README.md - keeping specific elements as HTML
turndownService.keep(['iframe', 'video', 'audio']);

// Or with function filter
turndownService.addRule('keepDivWithData', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.hasAttribute('data-widget');
  },
  replacement: (content, node) => {
    return node.outerHTML;
  },
});
```

### Handling Pre-Formatted Text Correctly
```typescript
// Source: GitHub issue #192, verified pattern
turndownService.addRule('preserveCodeWhitespace', {
  filter: (node, options) => {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE'
    );
  },
  replacement: (content, node, options) => {
    const fence = options.fence || '```';
    // Key: Use textContent, not content parameter
    const codeNode = node.querySelector('code') || node;
    const code = codeNode.textContent || '';
    const language = extractLanguage(codeNode as HTMLElement);

    return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
  },
});
```

### Error Handling Wrapper
```typescript
// Source: Best practices from GitHub issue discussions
export class HtmlToMarkdownConverter implements Converter {
  convert(input: string, options?: ConvertOptions): ConvertResult {
    try {
      const content = this.turndown.turndown(input);
      return { content, metadata: { sourceFormat: 'html', targetFormat: 'markdown' } };
    } catch (error) {
      // Turndown/domino handles most malformed HTML gracefully
      // This catches truly pathological cases
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: '',
        metadata: {
          sourceFormat: 'html',
          targetFormat: 'markdown',
          error: `Conversion failed: ${message}`,
        },
      };
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSDOM for DOM parsing | @mixmark-io/domino | Turndown v7 (2024) | Faster, secure (no script execution) |
| @joplin/turndown-plugin-gfm | @truto/turndown-plugin-gfm | 2025 | 20x faster tables, ESM-only, better edge cases |
| Manual table rules | GFM plugin | 2020+ | Proper colspan/rowspan, alignment support |
| he/html-entities for decode | Built-in domino | Turndown v7 | No extra dependency needed |
| CommonJS imports | ESM imports | 2024-2025 | Tree-shaking, modern tooling |

**Deprecated/outdated:**
- turndown v6 and below: Uses JSDOM with script execution risk
- @domchristie/turndown-plugin-gfm: Original unmaintained; use @truto fork
- Manual table conversion rules: GFM plugin handles all edge cases
- node-html-markdown: Less ecosystem support, fewer plugins

## Open Questions

Things that couldn't be fully resolved:

1. **Language class pattern coverage**
   - What we know: Common patterns are `lang-*`, `language-*`, `highlight-source-*`, `hljs *`
   - What's unclear: Full list of patterns used by all highlighting libraries
   - Recommendation: Start with common patterns, extend as needed based on real-world testing

2. **ConvertOptions mapping to turndown**
   - What we know: Current ConvertOptions has `semantic` and `rules` properties
   - What's unclear: Whether to expose all turndown options or abstract them
   - Recommendation: Keep minimal public options, use sensible defaults, allow `rules` for advanced use

3. **Error metadata structure**
   - What we know: ConvertResult has optional metadata
   - What's unclear: Best structure for error information
   - Recommendation: Add optional `error?: string` to metadata for partial failure cases

## Sources

### Primary (HIGH confidence)
- `/mixmark-io/turndown` (Context7) - API, options, rules, security documentation
- [turndown GitHub](https://github.com/mixmark-io/turndown) - v7.2.2, domino parser details
- [@truto/turndown-plugin-gfm GitHub](https://github.com/trutohq/turndown-plugin-gfm) - ESM plugin, table handling
- npm registry - Current versions verified: turndown 7.2.2, @truto/turndown-plugin-gfm 1.0.2, @types/turndown 5.0.6

### Secondary (MEDIUM confidence)
- [GitHub issue #192](https://github.com/domchristie/turndown/issues/192) - Code block whitespace handling patterns
- [Stack Overflow plugin pattern](https://favr.dev/opensource/2023/a-turndown-plugin-parsing-stack-overflow-html-answers/) - Language extraction regex
- [npm-compare.com](https://npm-compare.com/markdown-it,marked,node-html-markdown,showdown,turndown) - Library comparison

### Tertiary (LOW confidence)
- WebSearch results on HTML/Markdown edge cases - General patterns, used for pitfall identification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Versions verified via npm, library stability confirmed via GitHub
- Architecture: HIGH - Patterns verified via Context7 turndown documentation
- Code examples: HIGH - Derived from official docs and verified GitHub issues
- Pitfalls: MEDIUM - Aggregated from multiple sources, not all officially documented

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable ecosystem, turndown v7 is mature)
