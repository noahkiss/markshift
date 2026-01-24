# Phase 10: GitHub Pages Web UI - Research

**Researched:** 2026-01-24
**Domain:** Static Web UI, Browser Bundling, GitHub Pages Deployment
**Confidence:** HIGH

## Summary

This phase involves building a client-side web UI for the markshift converter that runs entirely in the browser without a backend. The research investigated three key areas: bundling TypeScript for browser use, handling Node-only dependencies (linkedom), and GitHub Pages deployment strategies.

The existing converter modules (turndown for HTML-to-MD, marked for MD-to-HTML, @mozilla/readability for content extraction) are all browser-compatible. The main challenge is that the content extractor uses `linkedom` for DOM parsing in Node.js, but browsers have native DOM support via `DOMParser`. This requires a conditional/separate browser entry point.

For bundling, Vite is the clear choice: it uses esbuild internally for fast transpilation, handles browser/node conditional imports well, and produces optimized static output perfect for GitHub Pages. GitHub Actions with the official deploy workflow is the modern standard for deployment.

**Primary recommendation:** Use Vite in app mode (not library mode) to bundle a standalone web UI, with a separate browser-specific entry point that uses native `DOMParser` instead of linkedom.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | ^6.0.0 | Build tool and bundler | Uses esbuild for fast TypeScript transpilation, Rollup for production bundles, excellent browser targeting |
| turndown | ^7.2.2 | HTML to Markdown | Already in project, browser-compatible via UMD/ESM |
| marked | ^17.0.1 | Markdown to HTML | Already in project, browser-compatible, ESM-first |
| @mozilla/readability | ^0.6.0 | Content extraction | Already in project, works with native browser DOM |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @truto/turndown-plugin-gfm | ^1.0.2 | GFM support | Already in project, browser-compatible |
| DOMPurify | ^3.x | HTML sanitization | Required for Readability output security |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite | esbuild directly | Vite provides dev server, better DX, handles HTML entry; esbuild would require more manual setup |
| Vite | Rollup directly | Vite wraps Rollup with better defaults for web apps |
| Vanilla JS | Preact/VanJS | For this simple UI, vanilla JS is sufficient; frameworks add unnecessary complexity |

**Installation:**
```bash
npm install -D vite
npm install dompurify
npm install -D @types/dompurify
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── web/                     # Browser-specific code
│   ├── index.html          # Web UI entry point
│   ├── main.ts             # Browser entry script
│   ├── style.css           # Minimal styling
│   └── browser-converters.ts  # Browser-specific converter wrappers
├── converters/             # Existing converters (shared)
│   ├── html-to-markdown/
│   └── markdown-to-html/
└── ...

vite.config.ts              # Vite configuration for web build
```

### Pattern 1: Separate Browser Entry Point
**What:** Create a dedicated browser module that wraps the converters with browser-native DOM handling
**When to use:** When Node-only dependencies (linkedom) need browser alternatives
**Example:**
```typescript
// Source: Project-specific pattern based on Vite docs
// src/web/browser-converters.ts

import { HtmlToMarkdownConverter } from '../converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../converters/markdown-to-html/index.js';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

export const htmlToMarkdown = new HtmlToMarkdownConverter();
export const markdownToHtml = new MarkdownToHtmlConverter();

// Browser-native content extraction (replaces linkedom-based version)
export function extractContent(html: string): { title: string; content: string } | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const docClone = doc.cloneNode(true) as Document;

  const reader = new Readability(docClone, { charThreshold: 500 });
  const result = reader.parse();

  if (!result || !result.content || result.content.length < 100) {
    return null;
  }

  return {
    title: result.title || '',
    content: DOMPurify.sanitize(result.content),
  };
}
```

### Pattern 2: Vite App Mode Configuration
**What:** Configure Vite to build a standalone web application from HTML entry
**When to use:** Building static sites for GitHub Pages
**Example:**
```typescript
// Source: Vite official documentation
// vite.config.ts

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/web',
  base: '/markshift/',  // GitHub Pages subpath
  build: {
    outDir: '../../docs',  // Output to docs/ for GitHub Pages
    emptyOutDir: true,
    target: 'es2020',
  },
  resolve: {
    alias: {
      // Exclude linkedom from browser bundle - not needed
      'linkedom': resolve(__dirname, 'src/web/empty-module.ts'),
    },
  },
});
```

### Pattern 3: Alias Empty Module for Node-Only Dependencies
**What:** Replace Node-only imports with empty modules in browser builds
**When to use:** When a dependency is used in shared code but not needed in browser
**Example:**
```typescript
// Source: Vite resolve.alias documentation
// src/web/empty-module.ts
export const parseHTML = () => { throw new Error('Not available in browser'); };
export default {};
```

### Anti-Patterns to Avoid
- **Bundling linkedom for browser:** It's 200KB+ and unnecessary since browsers have native DOM
- **Using library mode for web UI:** Library mode is for npm packages; use app mode for web apps
- **Dynamic imports for core converters:** Adds complexity; static imports are sufficient for this use case

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML sanitization | Custom regex sanitizer | DOMPurify | XSS vulnerabilities are subtle; DOMPurify handles edge cases |
| DOM parsing in browser | Custom parser | Native DOMParser | Built-in, fast, standards-compliant |
| Build tooling | Custom esbuild scripts | Vite | Handles HTML entry, dev server, HMR, production optimization |
| GitHub Actions deployment | Custom scripts | actions/deploy-pages | Official, maintained, handles permissions correctly |

**Key insight:** The browser already provides DOM APIs. The converters (turndown, marked, readability) are designed to work with these native APIs. The only adaptation needed is providing the correct DOM implementation.

## Common Pitfalls

### Pitfall 1: Bundling Node-Only Dependencies
**What goes wrong:** linkedom gets bundled, causing massive bundle size or runtime errors
**Why it happens:** Vite follows import chains and includes all dependencies by default
**How to avoid:** Use resolve.alias to replace linkedom with an empty module, or restructure imports to have a clean browser entry point
**Warning signs:** Bundle size > 500KB, console errors about Node.js APIs

### Pitfall 2: Readability Modifies DOM In-Place
**What goes wrong:** Original document gets mangled when using Readability
**Why it happens:** Readability.parse() modifies the DOM to extract content
**How to avoid:** Always clone the document before passing to Readability: `document.cloneNode(true)`
**Warning signs:** Input HTML textarea content changes after extraction

### Pitfall 3: Missing DOMPurify for Readability Output
**What goes wrong:** XSS vulnerabilities when displaying extracted content
**Why it happens:** Readability extracts content but doesn't sanitize it
**How to avoid:** Always run Readability output through DOMPurify before rendering
**Warning signs:** Script tags or event handlers in output HTML

### Pitfall 4: Wrong base Path for GitHub Pages
**What goes wrong:** Assets return 404 errors when deployed
**Why it happens:** GitHub Pages serves from username.github.io/reponame/, not root
**How to avoid:** Set `base: '/markshift/'` in vite.config.ts (or appropriate repo name)
**Warning signs:** Blank page, 404 errors for JS/CSS in browser console

### Pitfall 5: CORS Issues with Content Extraction
**What goes wrong:** Users expect to paste URLs and fetch content
**Why it happens:** Browser CORS restrictions prevent cross-origin fetch
**How to avoid:** Document that content extraction only works with pasted HTML, not URLs; or use a proxy service
**Warning signs:** NetworkError or CORS errors in console

## Code Examples

Verified patterns from official sources:

### Vite Configuration for GitHub Pages
```typescript
// Source: Vite static-deploy guide
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/web',
  base: '/markshift/',
  build: {
    outDir: '../../docs',
    emptyOutDir: true,
  },
});
```

### GitHub Actions Workflow for Static Site
```yaml
# Source: GitHub Pages documentation
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build:web
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### Browser-Safe Readability Usage
```typescript
// Source: Mozilla Readability README
function extractContent(html: string): ExtractedContent | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // IMPORTANT: Clone to prevent Readability from modifying original
  const docClone = doc.cloneNode(true) as Document;

  const reader = new Readability(docClone, {
    charThreshold: 500,
    keepClasses: false,
  });

  const result = reader.parse();
  if (!result || !result.content) return null;

  return {
    title: result.title || '',
    content: DOMPurify.sanitize(result.content),
    excerpt: result.excerpt || undefined,
  };
}
```

### Marked Browser Usage (ESM)
```typescript
// Source: Marked README
import { Marked } from 'marked';

const marked = new Marked({
  gfm: true,
  breaks: false,
});

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}
```

### Turndown Browser Usage
```typescript
// Source: Turndown README
import TurndownService from 'turndown';
import { gfm } from '@truto/turndown-plugin-gfm';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});
turndown.use(gfm);

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}
```

### Minimal Vanilla JS UI Pattern
```html
<!-- Source: Modern vanilla JS best practices -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>markshift</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <main>
    <h1>markshift</h1>
    <form id="converter-form">
      <div class="input-group">
        <label for="input">Input</label>
        <textarea id="input" rows="10"></textarea>
      </div>
      <div class="controls">
        <select id="mode">
          <option value="html-to-md">HTML to Markdown</option>
          <option value="md-to-html">Markdown to HTML</option>
        </select>
        <label>
          <input type="checkbox" id="extract-content">
          Extract content first
        </label>
        <button type="submit">Convert</button>
      </div>
      <div class="output-group">
        <label for="output">Output</label>
        <textarea id="output" rows="10" readonly></textarea>
        <button type="button" id="copy-btn">Copy</button>
      </div>
    </form>
  </main>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| gh-pages branch | GitHub Actions + deploy-pages | 2022-2023 | Cleaner separation, no orphan branch needed |
| Webpack for bundling | Vite | 2021-2023 | 10-100x faster builds, better DX |
| JSDOM for browser testing | Native browser APIs | Always | JSDOM was never for browsers; use native DOMParser |
| docs/ folder deployment | GitHub Actions | 2023 | More flexible, supports build steps |

**Deprecated/outdated:**
- Committing built files to gh-pages branch: Use GitHub Actions instead
- Using Webpack for new projects: Vite is faster and simpler
- Including JSDOM/linkedom in browser bundles: Use native DOM APIs

## Open Questions

Things that couldn't be fully resolved:

1. **Repository URL for GitHub Pages**
   - What we know: User wants either noahkiss.github.io/markshift or markshift.github.io
   - What's unclear: Whether user prefers personal account or creating an organization
   - Recommendation: Default to noahkiss.github.io/markshift (simpler), document org option

2. **RTF Conversion in Browser**
   - What we know: @iarna/rtf-to-html is in the project but may have Node-only dependencies
   - What's unclear: Whether RTF conversion should be available in web UI
   - Recommendation: Defer RTF for web UI initially; focus on HTML/Markdown which are definitely browser-safe

## Sources

### Primary (HIGH confidence)
- Context7 /vitejs/vite - Library mode, build configuration, resolve.alias
- Context7 /markedjs/marked - Browser ESM usage, configuration
- Context7 /mixmark-io/turndown - Browser script inclusion, DOM node conversion
- Context7 /mozilla/readability - Browser usage with DOMParser
- GitHub Pages official documentation - Deployment configuration, GitHub Actions

### Secondary (MEDIUM confidence)
- [Vite Why Guide](https://vite.dev/guide/why) - Architecture decisions, esbuild usage
- [GitHub deploy-pages action](https://github.com/actions/deploy-pages) - Official deployment action
- [Excluding Dependencies: Bundling for Node and Browser](https://dev.to/zirkelc/excluding-dependencies-bundling-for-node-and-the-browser-34af) - Browser field patterns

### Tertiary (LOW confidence)
- Web search results on vanilla JS trends - General patterns, may vary by project

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7, proven browser compatibility
- Architecture: HIGH - Vite patterns well-documented, GitHub Actions is official method
- Pitfalls: HIGH - Based on official documentation warnings and established patterns

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, established patterns)
