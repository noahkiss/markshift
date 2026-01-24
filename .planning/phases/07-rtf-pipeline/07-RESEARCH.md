# Phase 7: RTF Pipeline - Research

**Researched:** 2026-01-24
**Domain:** RTF to HTML conversion for clipboard-to-Markdown pipeline
**Confidence:** MEDIUM

## Summary

This phase implements RTF-to-Markdown conversion via an RTF-to-HTML-to-Markdown pipeline. RTF (Rich Text Format) is the primary styled text format used by macOS clipboard operations - when users copy from Apple Notes, TextEdit, Microsoft Word, or other rich text applications, the clipboard often contains RTF even when HTML is also present.

The research identified **@iarna/rtf-to-html** as the recommended library for this use case. It is a pure JavaScript implementation that converts RTF to complete HTML documents, handling paragraphs, fonts, colors, text styling (bold/italic/underline/strikethrough), alignment, and indentation. The library has ~8,000 weekly downloads and is the most widely adopted solution for general RTF-to-HTML conversion in the Node.js ecosystem.

The pipeline design is straightforward: RTF content enters the RtfToHtmlConverter, which produces HTML that is then passed to the existing HtmlToMarkdownConverter (turndown). This two-stage approach leverages our already-tested HTML-to-Markdown conversion and avoids building a custom RTF-to-Markdown parser.

**Primary recommendation:** Use @iarna/rtf-to-html (v1.1.0) for RTF-to-HTML conversion, then pipe through existing HtmlToMarkdownConverter.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @iarna/rtf-to-html | ^1.1.0 | RTF to HTML conversion | Pure JS, no native deps, 8K weekly downloads, handles macOS RTF well |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| iconv-lite | ^0.7.2 | Character encoding (optional) | Only if encoding issues arise with non-ASCII characters |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @iarna/rtf-to-html | rtf-stream-parser | rtf-stream-parser is designed for Outlook/MAPI email de-encapsulation, not general RTF. Has TypeScript support but requires iconv-lite as mandatory dependency. Better for email extraction, overkill for clipboard RTF. |
| @iarna/rtf-to-html | node-unrtf | Wrapper around native UnRTF binary. Requires system installation on macOS/Linux. Not pure JS. |
| Pipeline approach | Direct RTF-to-Markdown | Would require building custom parser. RTF spec is complex (1,600+ pages). No maintained RTF-to-MD libraries exist. |

**Installation:**
```bash
npm install @iarna/rtf-to-html
```

**Note on TypeScript:** @iarna/rtf-to-html has no TypeScript definitions. Create a declaration file:
```typescript
// src/types/rtf-to-html.d.ts
declare module '@iarna/rtf-to-html' {
  interface RtfToHtmlOptions {
    template?: (doc: unknown, defaults: unknown, content: string) => string;
    paraBreaks?: string;
    paraTag?: string;
  }

  function fromString(
    rtfString: string,
    opts: RtfToHtmlOptions | undefined,
    callback: (err: Error | null, html: string) => void
  ): void;

  function fromString(
    rtfString: string,
    callback: (err: Error | null, html: string) => void
  ): void;
}
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── converters/
│   ├── rtf-to-html/
│   │   └── index.ts           # RtfToHtmlConverter class
│   ├── html-to-markdown/
│   │   └── index.ts           # Existing (Phase 2)
│   └── index.ts               # Registry
├── types/
│   ├── index.ts               # Core types (already has 'rtf' format)
│   └── rtf-to-html.d.ts       # Type declarations for @iarna/rtf-to-html
└── cli/
    └── commands/
        └── convert.ts         # Update RTF handling
```

### Pattern 1: Pipeline Converter
**What:** Use composition to chain converters (RTF -> HTML -> Markdown)
**When to use:** When converting between formats where an intermediate format already has a working converter
**Example:**
```typescript
// Source: Existing project pattern from HtmlToMarkdownConverter
import rtfToHtml from '@iarna/rtf-to-html';
import { HtmlToMarkdownConverter } from '../html-to-markdown/index.js';
import { promisify } from 'node:util';

const rtfToHtmlFromString = promisify(rtfToHtml.fromString);

export class RtfToMarkdownConverter implements Converter {
  readonly sourceFormat: Format = 'rtf';
  readonly targetFormat: Format = 'markdown';

  private htmlToMd = new HtmlToMarkdownConverter();

  async convert(input: string, options?: ConvertOptions): Promise<ConvertResult> {
    const startTime = performance.now();

    // Step 1: RTF -> HTML
    const html = await rtfToHtmlFromString(input, {
      template: (doc, defaults, content) => content, // Extract body only
    });

    // Step 2: HTML -> Markdown (reuse existing converter)
    const mdResult = this.htmlToMd.convert(html, options);

    return {
      content: mdResult.content,
      metadata: {
        sourceFormat: 'rtf',
        targetFormat: 'markdown',
        processingTimeMs: performance.now() - startTime,
      },
    };
  }
}
```

### Pattern 2: Template Option for Body Extraction
**What:** Use custom template to extract only body content from RTF-to-HTML output
**When to use:** @iarna/rtf-to-html produces complete HTML documents by default; we only need the body content
**Example:**
```typescript
// Source: @iarna/rtf-to-html README
const html = await rtfToHtmlFromString(rtfContent, {
  template: (doc, defaults, content) => content, // Just the converted content
});
```

### Pattern 3: Async Converter Interface
**What:** Make the convert method async to handle callback-based library
**When to use:** The Converter interface currently has synchronous `convert()`, but RTF conversion is async
**Example:**
```typescript
// Option A: Keep sync interface, use synchronous wrapper
// Note: @iarna/rtf-to-html does not have a sync API, so promisify is required

// Option B: Add async support to Converter interface
export interface Converter {
  readonly sourceFormat: Format;
  readonly targetFormat: Format;
  convert(input: string, options?: ConvertOptions): ConvertResult | Promise<ConvertResult>;
}
```

### Anti-Patterns to Avoid
- **Direct RTF-to-Markdown parsing:** Don't try to parse RTF control words and emit Markdown directly. RTF is stateful and complex; HTML is a better intermediate format.
- **Ignoring the template option:** Default @iarna/rtf-to-html output includes full HTML document structure. Use template to extract just the content.
- **Synchronous blocking:** Don't use synchronous wrappers that block the event loop. The library is callback-based; use promisify.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RTF parsing | Custom parser | @iarna/rtf-to-html | RTF spec is 1,600+ pages, has complex state machine, multiple encodings, font tables |
| Character encoding | Manual decoding | iconv-lite (if needed) | Many code pages to handle (437, 850, 1252, etc.) |
| RTF-to-Markdown | Direct converter | Pipeline (RTF->HTML->MD) | No maintained libraries exist; HTML is natural intermediate format |
| Callback-to-Promise | Manual wrapper | util.promisify | Standard Node.js utility |

**Key insight:** RTF is a 30+ year old format with enormous complexity (embedded objects, multiple character encodings, bidirectional text, tables, lists). The RTF spec is over 1,600 pages. Any custom implementation will have edge cases. Use the battle-tested @iarna/rtf-to-html library.

## Common Pitfalls

### Pitfall 1: Full HTML Document Output
**What goes wrong:** @iarna/rtf-to-html outputs complete HTML documents with `<html>`, `<head>`, `<body>` tags
**Why it happens:** Library designed to produce standalone HTML documents
**How to avoid:** Use the `template` option to extract only body content
**Warning signs:** Markdown output contains HTML boilerplate, extra newlines

### Pitfall 2: Async/Sync Interface Mismatch
**What goes wrong:** Current Converter interface is synchronous, but RTF conversion is async
**Why it happens:** @iarna/rtf-to-html only provides callback-based API
**How to avoid:** Either update Converter interface to support Promise returns, or handle async internally in CLI
**Warning signs:** TypeScript errors about Promise vs non-Promise returns

### Pitfall 3: Character Encoding Issues
**What goes wrong:** Non-ASCII characters display as garbage (mojibake)
**Why it happens:** RTF can use various code pages (Windows-1252, Mac Roman, etc.)
**How to avoid:** @iarna/rtf-to-html handles common encodings via rtf-parser; add iconv-lite if issues arise
**Warning signs:** Greek, Chinese, emoji, or accented characters corrupted

### Pitfall 4: Empty Paragraph Handling
**What goes wrong:** Extra blank lines in Markdown output
**Why it happens:** RTF and HTML have different paragraph models; empty paragraphs may survive conversion
**How to avoid:** The library has "empty paragraph trimming" but test with real-world content
**Warning signs:** Double/triple blank lines in output

### Pitfall 5: macOS RTFD Bundle Format
**What goes wrong:** Conversion fails or loses images
**Why it happens:** macOS uses RTFD (RTF with embedded attachments) for images; this is a directory bundle, not a single file
**How to avoid:** For clipboard use case, this is unlikely - clipboard typically contains plain RTF string. Document this limitation.
**Warning signs:** Error when attempting to convert .rtfd files

### Pitfall 6: Microsoft Word Verbose RTF
**What goes wrong:** Slow conversion or memory issues
**Why it happens:** Word generates extremely verbose RTF (30KB+ for a few words of text)
**How to avoid:** @iarna/rtf-to-html handles this, but test with real Word content
**Warning signs:** Slow clipboard paste operations

## Code Examples

Verified patterns from official sources:

### Basic RTF to HTML Conversion
```typescript
// Source: https://github.com/iarna/rtf-to-html README
import rtfToHtml from '@iarna/rtf-to-html';
import { promisify } from 'node:util';

const rtfToHtmlAsync = promisify(rtfToHtml.fromString);

// With template to extract body only
const html = await rtfToHtmlAsync(rtfContent, {
  template: (doc, defaults, content) => content,
});
```

### Integration with Existing Pipeline
```typescript
// Source: Project pattern from convert.ts
// In CLI convert command, handle RTF format:

if (inputResult.sourceFormat === 'rtf') {
  // Convert RTF -> HTML first
  const rtfConverter = new RtfToHtmlConverter();
  const htmlResult = await rtfConverter.convert(content);
  const htmlContent = htmlResult.content;

  // Then HTML -> Markdown
  const mdConverter = new HtmlToMarkdownConverter();
  result = mdConverter.convert(htmlContent).content;
  sourceFormat = 'rtf';
}
```

### Type Declaration for @iarna/rtf-to-html
```typescript
// Source: Based on library API from GitHub README
// File: src/types/rtf-to-html.d.ts

declare module '@iarna/rtf-to-html' {
  type TemplateFunction = (
    doc: unknown,
    defaults: unknown,
    content: string
  ) => string;

  interface Options {
    template?: TemplateFunction;
    paraBreaks?: string;
    paraTag?: string;
  }

  interface RtfToHtml {
    fromString(
      rtfString: string,
      options: Options | undefined,
      callback: (err: Error | null, html: string) => void
    ): void;
    fromString(
      rtfString: string,
      callback: (err: Error | null, html: string) => void
    ): void;
  }

  const rtfToHtml: RtfToHtml;
  export = rtfToHtml;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native binary wrappers (unrtf) | Pure JS (@iarna/rtf-to-html) | ~2017 | No system dependencies, cross-platform |
| Direct RTF-to-text stripping | RTF-to-HTML with formatting | Ongoing | Preserves bold, italic, links |
| Synchronous file I/O | Promise-based async | Node.js evolution | Better performance, non-blocking |

**Deprecated/outdated:**
- node-rtf-to-html (abandoned): Use @iarna/rtf-to-html instead
- rtftohtml (old version): Superseded by @iarna scoped package
- Native wrappers like node-unrtf: Require system installation, not pure JS

## Open Questions

Things that couldn't be fully resolved:

1. **Converter Interface Async Support**
   - What we know: Current Converter interface is synchronous
   - What's unclear: Should we update interface to support Promise returns, or keep RTF converter internal?
   - Recommendation: Update Converter interface to allow `ConvertResult | Promise<ConvertResult>` return type for future extensibility

2. **RTF Detection in Files (Not Clipboard)**
   - What we know: Clipboard correctly identifies RTF format via @crosscopy/clipboard
   - What's unclear: How to detect RTF when reading from file input (not via clipboard)
   - Recommendation: Check for `{\rtf` magic bytes at start of content; add to format-detect.ts if file RTF support needed later

3. **RTFD (Apple Package) Support**
   - What we know: macOS uses RTFD for RTF with images; this is a directory bundle
   - What's unclear: Whether this is needed for clipboard use case
   - Recommendation: Out of scope for Phase 7 (clipboard RTF is plain RTF string). Document limitation.

## Sources

### Primary (HIGH confidence)
- GitHub iarna/rtf-to-html - API, usage, template option: https://github.com/iarna/rtf-to-html
- GitHub iarna/rtf-parser - Supported features, limitations: https://github.com/iarna/rtf-parser
- GitHub mazira/rtf-stream-parser - Alternative library analysis: https://github.com/mazira/rtf-stream-parser

### Secondary (MEDIUM confidence)
- npm @iarna/rtf-to-html - Version 1.1.0, ~8K weekly downloads, 1 dependency: WebSearch verified
- npm rtf-stream-parser - Version 3.8.0, TypeScript native, ~6K weekly downloads: WebSearch verified
- npm iconv-lite - Version 0.7.2, built-in TypeScript types: WebSearch verified

### Tertiary (LOW confidence)
- macOS clipboard RTF behavior - Community discussions about RTF clipboard issues: WebSearch only
- Microsoft Word RTF verbosity - Community reports about size issues: WebSearch only

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - @iarna/rtf-to-html is well-established but not in Context7; verified via GitHub/npm
- Architecture: HIGH - Pipeline pattern matches existing project structure; verified against codebase
- Pitfalls: MEDIUM - Common issues documented from library READMEs and community discussions

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable library, infrequent updates)
