# Phase 8: Content Extraction - Research

**Researched:** 2026-01-24
**Domain:** HTML content extraction, semantic table detection
**Confidence:** HIGH

## Summary

Content extraction for web pages is a well-solved problem with Mozilla's Readability.js being the industry standard. This is the same algorithm that powers Firefox's Reader View. The library reliably strips navigation, sidebars, headers, footers, and ads while preserving the main article content.

For semantic table detection (converting div-based fake tables to markdown tables), this is a more specialized problem without off-the-shelf solutions. The approach requires custom heuristics to detect grid/flex layouts that represent tabular data structures.

**Primary recommendation:** Use `@mozilla/readability` with `linkedom` (faster, lighter than jsdom) for content extraction. Implement custom turndown rules for semantic table detection using CSS computed style analysis.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mozilla/readability | 0.6.0 | Extract main content from web pages | Powers Firefox Reader View, battle-tested |
| linkedom | 0.18.12 | DOM parsing for Node.js | 3x faster, 3x less memory than jsdom |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsdom | 27.4.0 | Full DOM implementation | When 100% standards compliance needed |
| @types/jsdom | 27.0.0 | TypeScript types for jsdom | If using jsdom instead of linkedom |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| linkedom | jsdom | jsdom is slower (15s vs 2.6ms for some ops) but 100% spec-compliant |
| @mozilla/readability | Custom extraction | Readability is battle-tested; custom would be maintenance burden |

**Installation:**
```bash
npm install @mozilla/readability linkedom
```

**Note:** @mozilla/readability now includes built-in TypeScript types (index.d.ts), so `@types/mozilla-readability` is no longer needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── converters/
│   └── html-to-markdown/
│       ├── index.ts              # Main converter (existing)
│       ├── rules/
│       │   ├── code-language.ts  # Existing rule
│       │   └── semantic-table.ts # NEW: Div table detection
│       └── extractors/
│           └── content.ts        # NEW: Readability wrapper
├── cli/
│   └── commands/
│       └── convert.ts            # Add --extract-content flag
└── types/
    └── index.ts                  # Add extraction options
```

### Pattern 1: Content Extraction Pipeline
**What:** Two-stage pipeline - extract content first, then convert to markdown
**When to use:** When `--extract-content` flag is passed
**Example:**
```typescript
// Source: @mozilla/readability README + linkedom docs
import { Readability, isProbablyReaderable } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

interface ExtractedContent {
  title: string;
  content: string;  // HTML of main content
  textContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  publishedTime: string | null;
}

export function extractContent(html: string, url?: string): ExtractedContent | null {
  const { document } = parseHTML(html);

  // Optional: Check if content is suitable for extraction
  if (!isProbablyReaderable(document)) {
    return null;  // Or return original content
  }

  const reader = new Readability(document, {
    charThreshold: 500,  // Minimum characters for valid article
    keepClasses: false,  // Strip classes for cleaner output
  });

  const article = reader.parse();
  if (!article) return null;

  return {
    title: article.title,
    content: article.content,
    textContent: article.textContent,
    excerpt: article.excerpt,
    byline: article.byline,
    siteName: article.siteName,
    publishedTime: article.publishedTime,
  };
}
```

### Pattern 2: Semantic Table Detection
**What:** Detect div-based layouts that represent tabular data
**When to use:** When converting divs with display:table/grid/flex that form table-like structures
**Example:**
```typescript
// Custom turndown rule for semantic table detection
import TurndownService from 'turndown';

interface TableCell {
  content: string;
  isHeader: boolean;
}

interface DetectedTable {
  rows: TableCell[][];
  hasHeader: boolean;
}

function detectSemanticTable(node: HTMLElement): DetectedTable | null {
  const style = getComputedStyle(node);
  const display = style.display;

  // Check for CSS table layout
  if (display === 'table' || display === 'inline-table') {
    return parseTableDisplay(node);
  }

  // Check for grid layout with uniform structure
  if (display === 'grid' || display === 'inline-grid') {
    return parseGridAsTable(node);
  }

  // Check for flex layout with row-like children
  if (display === 'flex' || display === 'inline-flex') {
    if (style.flexDirection === 'column') {
      return parseFlexAsTable(node);
    }
  }

  // Check for role="table" ARIA attributes
  if (node.getAttribute('role') === 'table') {
    return parseAriaTable(node);
  }

  return null;
}

// Add as turndown rule
function addSemanticTableRule(turndown: TurndownService): void {
  turndown.addRule('semanticTable', {
    filter: function(node, options) {
      if (node.nodeName !== 'DIV') return false;
      const detected = detectSemanticTable(node as HTMLElement);
      return detected !== null && detected.rows.length > 1;
    },
    replacement: function(content, node, options) {
      const table = detectSemanticTable(node as HTMLElement);
      if (!table) return content;
      return renderMarkdownTable(table);
    }
  });
}
```

### Pattern 3: CLI Integration
**What:** Add `--extract-content` flag to convert command
**When to use:** User wants to strip boilerplate from web pages
**Example:**
```typescript
// In cli/commands/convert.ts
export const convertCommand = new Command('convert')
  .description('Auto-detect format and convert')
  .argument('[input]', 'input file path')
  .option('-o, --output <file>', 'output file path')
  .option('-t, --to <format>', 'target format: md or html')
  .option('--extract-content', 'extract main content, strip nav/ads')
  .action(async (input, options, command) => {
    // ... read input ...

    let contentToConvert = content;

    if (options.extractContent && sourceFormat === 'html') {
      const extracted = extractContent(content);
      if (extracted) {
        contentToConvert = extracted.content;
        logger.verbose(`Extracted: "${extracted.title}"`);
      } else {
        logger.verbose('Content extraction failed, using original');
      }
    }

    // ... continue with conversion ...
  });
```

### Anti-Patterns to Avoid
- **Running Readability on non-HTML:** Only extract content when source is HTML
- **Ignoring isProbablyReaderable:** Check first to avoid wasted processing on non-article pages
- **Using jsdom for simple parsing:** linkedom is 3x faster and uses 3x less memory
- **Hand-rolling content extraction:** Readability handles edge cases (lazy images, ads, etc.)
- **Assuming all divs with grid/flex are tables:** Need uniform row/column structure

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Strip nav/ads from pages | Custom selectors | @mozilla/readability | Handles 1000s of edge cases from Firefox |
| DOM parsing in Node.js | Custom parsing | linkedom or jsdom | Full DOM API, handles malformed HTML |
| Table rendering in markdown | Manual string concat | Turndown GFM plugin | Already handles alignment, escaping |
| Check if page has article | Content length heuristic | isProbablyReaderable() | Uses proven scoring algorithm |

**Key insight:** Content extraction looks simple ("just find the main content div") but has enormous edge cases: ads injected mid-content, lazy-loaded images, paywalls, cookie banners, social widgets, etc. Readability handles all of these.

## Common Pitfalls

### Pitfall 1: Readability Modifies the DOM
**What goes wrong:** Original document is mutated, affecting subsequent operations
**Why it happens:** Readability's algorithm removes and rearranges nodes in place
**How to avoid:** Clone the document before parsing: `document.cloneNode(true)`
**Warning signs:** Unexpected content missing, nodes showing as removed

### Pitfall 2: Missing URL Context
**What goes wrong:** Relative URLs in extracted content are broken
**Why it happens:** Readability needs base URL to resolve relative links
**How to avoid:** Always pass URL when creating DOM: `parseHTML(html)` then set `document.location`
**Warning signs:** Links starting with `/` or `./` in output

### Pitfall 3: linkedom vs jsdom Compatibility
**What goes wrong:** Code works in jsdom but fails in linkedom
**Why it happens:** linkedom prioritizes speed over 100% spec compliance
**How to avoid:** Test with linkedom; fall back to jsdom only if needed
**Warning signs:** Missing methods, different behavior on edge cases

### Pitfall 4: Semantic Table False Positives
**What goes wrong:** Non-tabular grid layouts converted to tables
**Why it happens:** CSS grid/flex used for general layout, not just tables
**How to avoid:** Require uniform row structure, minimum row count (2+)
**Warning signs:** Navigation menus, card layouts becoming tables

### Pitfall 5: Script Injection from Untrusted HTML
**What goes wrong:** Malicious scripts in content output
**Why it happens:** Readability preserves some HTML in output
**How to avoid:** Use DOMPurify or CSP headers on output
**Warning signs:** `<script>` or event handlers in content property

## Code Examples

Verified patterns from official sources:

### Basic Readability Usage with linkedom
```typescript
// Source: @mozilla/readability README + linkedom docs
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

const html = await fetchPage(url);
const { document } = parseHTML(html);

const reader = new Readability(document);
const article = reader.parse();

if (article) {
  console.log('Title:', article.title);
  console.log('Content HTML:', article.content);
  console.log('Plain text:', article.textContent);
  console.log('Excerpt:', article.excerpt);
}
```

### Readability Configuration Options
```typescript
// Source: @mozilla/readability README
const reader = new Readability(document, {
  debug: false,              // Enable logging
  maxElemsToParse: 0,        // 0 = unlimited
  nbTopCandidates: 5,        // Top candidates to consider
  charThreshold: 500,        // Minimum chars for valid article
  classesToPreserve: ['highlight', 'code'],  // Keep these classes
  keepClasses: false,        // Strip all other classes
  disableJSONLD: false,      // Parse JSON-LD metadata
  serializer: (el) => el.innerHTML,  // Custom content serializer
});
```

### Check if Document is Suitable for Extraction
```typescript
// Source: @mozilla/readability README
import { isProbablyReaderable } from '@mozilla/readability';

if (isProbablyReaderable(document, {
  minContentLength: 140,  // Minimum content length
  minScore: 20,           // Minimum cumulative score
})) {
  const article = new Readability(document).parse();
}
```

### Turndown Remove Rule for Boilerplate
```typescript
// Source: turndown documentation
// Alternative approach: strip elements before Readability
turndownService.remove(['nav', 'aside', 'footer', 'header']);

// Remove by class
turndownService.remove(function(node) {
  return node.classList?.contains('advertisement') ||
         node.classList?.contains('sidebar') ||
         node.getAttribute('role') === 'navigation';
});
```

### Custom Turndown Rule for Div Tables
```typescript
// Source: turndown documentation (adapted)
turndownService.addRule('divTable', {
  filter: function(node, options) {
    if (node.nodeName !== 'DIV') return false;

    // Check for ARIA table role
    if (node.getAttribute('role') === 'table') return true;

    // Check for display:table CSS
    const style = node.getAttribute('style') || '';
    if (style.includes('display:') && style.includes('table')) return true;

    // Check for data-table attribute (common pattern)
    if (node.hasAttribute('data-table')) return true;

    return false;
  },
  replacement: function(content, node, options) {
    const rows = node.querySelectorAll('[role="row"], [data-row]');
    if (rows.length < 2) return content;

    let markdown = '\n\n';
    rows.forEach((row, i) => {
      const cells = row.querySelectorAll('[role="cell"], [role="columnheader"], [data-cell]');
      cells.forEach(cell => {
        markdown += '| ' + cell.textContent.trim() + ' ';
      });
      markdown += '|\n';

      // Add separator after first row (header)
      if (i === 0) {
        cells.forEach(() => markdown += '| --- ');
        markdown += '|\n';
      }
    });

    return markdown + '\n\n';
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jsdom only | linkedom preferred | ~2021 | 3x faster, 3x less memory |
| @types/mozilla-readability | Built-in types | v0.5.0+ | One less dependency |
| Custom extraction heuristics | Readability.js | Stable since 2015 | Industry standard |

**Deprecated/outdated:**
- `@types/mozilla-readability`: No longer needed, types now bundled
- Heavy jsdom usage for simple parsing: linkedom handles most cases

## Open Questions

Things that couldn't be fully resolved:

1. **Computed style access in linkedom**
   - What we know: linkedom has `getComputedStyle` but may not support all CSS
   - What's unclear: How well does it handle display:table/grid detection?
   - Recommendation: Test with real-world examples; may need jsdom for style computation

2. **Semantic table heuristics accuracy**
   - What we know: No standard algorithm exists; must build custom
   - What's unclear: What row/column uniformity thresholds work best?
   - Recommendation: Start conservative (high thresholds), tune based on real usage

3. **Performance impact of content extraction**
   - What we know: Readability is fast, linkedom is fast
   - What's unclear: Combined pipeline performance on large documents
   - Recommendation: Benchmark with real pages; add timing to verbose output

## Sources

### Primary (HIGH confidence)
- Context7 `/mozilla/readability` - API, configuration, usage patterns
- Context7 `/webreflection/linkedom` - DOM parsing, parseHTML API
- Context7 `/mixmark-io/turndown` - Custom rules, remove/filter API
- Context7 `/jsdom/jsdom` - JSDOM constructor, fragment creation

### Secondary (MEDIUM confidence)
- [npm @mozilla/readability](https://www.npmjs.com/package/@mozilla/readability) - Version 0.6.0 confirmed
- [GitHub mozilla/readability README](https://github.com/mozilla/readability) - Security considerations
- [LinkeDOM vs JSDOM benchmarks](https://webreflection.medium.com/linkedom-a-jsdom-alternative-53dd8f699311) - Performance claims

### Tertiary (LOW confidence)
- [PowerMapper table detection](https://www.powermapper.com/blog/layout-tables-vs-data-tables/) - Browser heuristics for layout vs data tables
- [table-header-detective](https://github.com/lyleunderwood/table-header-detective) - Header row detection heuristics (not directly applicable but informative)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @mozilla/readability is the clear industry standard
- Architecture: HIGH - Integration patterns are well-documented
- Content extraction: HIGH - Readability API is stable and well-typed
- Semantic table detection: MEDIUM - Custom implementation required, no standard solution

**Research date:** 2026-01-24
**Valid until:** 60 days (libraries are stable, low churn)
