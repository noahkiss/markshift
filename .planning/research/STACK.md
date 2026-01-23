# Stack Research

**Domain:** Text format conversion tools (HTML, Markdown, RTF, rich text)
**Researched:** 2026-01-22
**Confidence:** HIGH (core libraries verified via official sources)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Node.js** | 22.x LTS | Runtime | Current LTS with native SEA support, stable ESM |
| **TypeScript** | 5.x | Language | Type safety essential for complex conversion logic |
| **tsup** | 8.5.x | Build/Bundle | Zero-config bundling, esbuild-powered, outputs CJS+ESM |
| **tsx** | 4.x | Development | Run TS directly without build step during development |
| **Vitest** | 3.x | Testing | 10-20x faster than Jest, native ESM, simpler TS config |

### HTML <-> Markdown Conversion

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **turndown** | 7.2.x | HTML -> Markdown | Industry standard, 64k+ dependents, plugin system, highly customizable rules |
| **marked** | 17.x | Markdown -> HTML | 21M weekly downloads, standalone (no deps), fastest CommonMark parser |

**Why turndown over node-html-markdown:**
- turndown has 10x more GitHub stars (10k vs 250) and 5x more weekly downloads (1.5M vs 288k)
- Plugin ecosystem (turndown-plugin-gfm for tables, strikethrough)
- Extensive customization via rules API
- Better community support and documentation
- node-html-markdown is ~1.6x faster but lacks plugin system and has smaller community

Use node-html-markdown **only if** processing gigabytes of HTML where the 1.6x performance difference matters.

### RTF Processing

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **rtf-stream-parser** | 3.8.x | RTF tokenization | Actively maintained (updated 2 months ago), streaming support |
| **@iarna/rtf-to-html** | 2.x | RTF -> HTML | Built on rtf-parser, then use turndown for final Markdown |

**RTF Conversion Strategy:**
RTF -> HTML -> Markdown (two-step pipeline)

RTF libraries in Node.js are limited. Key limitations:
- No direct RTF -> Markdown converter exists
- Table support is weak/nonexistent in pure JS parsers
- Complex formatting may degrade

For high-fidelity RTF conversion, consider shelling out to Pandoc for complex documents.

### Jira/Confluence Markup

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **jira2md** | 3.x | Jira <-> Markdown | Bidirectional, most actively maintained fork |

This handles Jira wiki markup, not Atlassian Document Format (ADF). For ADF, use `@atlaskit/editor-markdown-transformer`.

### HTML Parsing (for Smart Processors)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **cheerio** | 1.x | HTML parsing/manipulation | Default choice - fast, jQuery-like API, no JS execution |
| **linkedom** | 0.18.x | DOM-like API | When you need document.querySelector style API with better perf than jsdom |
| **jsdom** | 25.x | Full DOM emulation | Only when JS execution required (rare for conversion) |

**Performance hierarchy:** cheerio > linkedom > jsdom (by significant margins)

Cheerio is ~1.7x faster than jsdom for typical parsing. Use cheerio unless you specifically need DOM APIs.

### Clipboard Integration

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **clipboardy** | 5.x | System clipboard read/write | 4.3M weekly downloads, cross-platform, actively maintained (Dec 2025) |

Clipboardy supports: macOS, Windows, Linux (X11 + Wayland), FreeBSD, WSLg

For reading HTML from clipboard (not just plain text), you may need platform-specific handling:
- macOS: `pbpaste -Prefer rtf` or native bindings
- Clipboard HTML format varies by platform

### CLI Framework

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **commander** | 14.x | CLI argument parsing | 245M weekly downloads, simpler API, smaller (174KB vs 290KB) |

**Why commander over yargs:**
- Cleaner syntax for Git-style subcommands (perfect for `text-transform html`, `text-transform jira`)
- Smaller bundle size
- Used by webpack-cli, babel-cli
- Sufficient for our validation needs

Use yargs only if you need: complex validation rules, middleware, i18n support.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **esbuild** | Underlying bundler (via tsup) | 100x faster than webpack |
| **eslint** | Linting | Use flat config (eslint.config.js) |
| **prettier** | Formatting | Integrate with eslint |
| **husky** | Git hooks | Pre-commit formatting/linting |
| **lint-staged** | Staged file linting | Only lint changed files |

## Installation

```bash
# Core dependencies
npm install turndown marked jira2md cheerio clipboardy commander

# RTF support (optional)
npm install rtf-stream-parser @iarna/rtf-to-html

# TypeScript types
npm install -D @types/turndown

# Dev dependencies
npm install -D typescript tsup tsx vitest @types/node

# Code quality
npm install -D eslint prettier husky lint-staged
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| turndown | node-html-markdown | Processing >1GB HTML daily where 1.6x speed matters |
| turndown | rehype-remark | Already using unified ecosystem (rehype/remark) |
| marked | markdown-it | Need extensive plugin ecosystem for Markdown parsing |
| commander | yargs | Need complex validation, middleware, or i18n |
| cheerio | jsdom | Need to execute JavaScript in parsed HTML |
| Vitest | Jest | React Native, or heavy existing Jest infrastructure |
| tsup | esbuild directly | Need more control over bundling (tsup is simpler) |
| clipboardy | copy-paste | Legacy projects (copy-paste less maintained) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **vercel/pkg** | Deprecated, no Node 22 support | Node.js native SEA or yao-pkg fork |
| **to-markdown** | Renamed to turndown years ago | turndown |
| **showdown** | Primarily Markdown->HTML, slower | marked (for MD->HTML) |
| **jsdom for parsing** | 3x slower than cheerio, heavy | cheerio |
| **babel-jest** | Complex TS setup, slow | Vitest with native TS |
| **@iarna/rtf-parser** | Last updated 6 years ago | rtf-stream-parser |

## Stack Patterns by Variant

**If macOS-only (initial target):**
- Clipboard: clipboardy works great
- Distribution: Homebrew formula + npm

**If cross-platform needed later:**
- Clipboard: clipboardy handles it (auto-detects Wayland vs X11)
- Consider testing on Windows with PowerShell clipboard fallbacks

**If binary distribution needed:**
- Use Node.js native SEA (Single Executable Application)
- Bundle with esbuild first (via tsup), then inject into node binary
- Binary will be ~66-82MB (Node.js included)
- Alternative: Just distribute as npm package for `npx text-transform`

**If browser support needed (web interface):**
- turndown works in browser
- marked works in browser
- cheerio does NOT work in browser (use DOMParser or linkedom)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| turndown@7.x | Node 18+ | Uses domino for HTML parsing in Node |
| clipboardy@5.x | Node 18+ | ESM-only since v4 |
| commander@14.x | Node 18+ | ESM + CJS support |
| vitest@3.x | Node 18+ | Requires Vite 5+ |
| tsup@8.x | Node 18+ | Uses esbuild 0.19+ |

**Minimum Node.js version: 18.x** (for ESM, native test runner fallback, and all dependency support)
**Recommended: Node.js 22.x LTS** (for SEA support if needed)

## Distribution Strategy

### Primary: npm Package
```bash
npm install -g text-transform
# or
npx text-transform <command>
```

### Secondary: Homebrew (macOS)
Use `homebrew-npm-noob` to auto-generate formula, or create custom formula:
```ruby
class TextTransform < Formula
  desc "Convert text to and from Markdown format"
  homepage "https://github.com/yourname/text-transform"
  url "https://registry.npmjs.org/text-transform/-/text-transform-1.0.0.tgz"
  # ... std_npm_args pattern
end
```

### Optional: Single Executable (SEA)
Only if users specifically need no-Node-required distribution.
```bash
# Bundle with tsup
npx tsup src/cli.ts --format cjs --target node22

# Create SEA config
echo '{"main":"dist/cli.cjs","output":"sea-prep.blob"}' > sea-config.json

# Generate and inject
node --experimental-sea-config sea-config.json
# ... platform-specific binary injection
```

## Project Structure

```
text-transform/
├── src/
│   ├── cli.ts              # CLI entry point (commander)
│   ├── index.ts            # Library entry point
│   ├── converters/
│   │   ├── html-to-md.ts   # turndown wrapper
│   │   ├── md-to-html.ts   # marked wrapper
│   │   ├── rtf-to-md.ts    # rtf-stream-parser + turndown
│   │   └── jira.ts         # jira2md wrapper
│   ├── processors/         # Smart processors for specific sites
│   │   ├── github.ts
│   │   └── confluence.ts
│   └── clipboard/
│       └── index.ts        # clipboardy wrapper with format detection
├── tsup.config.ts          # Bundle config
├── vitest.config.ts        # Test config
├── package.json
└── tsconfig.json
```

## Sources

- [turndown GitHub](https://github.com/mixmark-io/turndown) - v7.2.2 (Oct 2025), 64k dependents
- [clipboardy GitHub](https://github.com/sindresorhus/clipboardy) - v5.0.2 (Dec 2025), 2.3M projects
- [marked npm](https://www.npmjs.com/package/marked) - v17.0.1, 21M weekly downloads
- [node-html-markdown GitHub](https://github.com/crosstype/node-html-markdown) - v2.0.0 (Nov 2025), performance benchmarks
- [npm-compare: commander vs yargs](https://npm-compare.com/commander,yargs) - popularity and feature comparison
- [Vitest vs Jest comparison](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9) - 2025 analysis
- [tsup documentation](https://tsup.egoist.dev/) - v8.5.1, esbuild-powered bundling
- [Node.js SEA documentation](https://nodejs.org/api/single-executable-applications.html) - native binary support
- [Homebrew Node formula guide](https://docs.brew.sh/Node-for-Formula-Authors) - std_npm_args pattern
- [cheerio vs jsdom](https://www.zenrows.com/blog/jsdom-vs-cheerio) - performance benchmarks
- [rtf-stream-parser npm](https://www.npmjs.com/package/rtf-stream-parser) - v3.8.1, actively maintained
- [jira2md npm](https://www.npmjs.com/package/jira2md) - Jira markup conversion

---
*Stack research for: text-transform (text format conversion CLI)*
*Researched: 2026-01-22*
