# markshift

Convert between HTML, Markdown, and rich text formats. CLI tool with clipboard integration and content extraction.

## Install

```bash
brew install noahkiss/tap/markshift
```

Or run from source:

```bash
git clone https://github.com/noahkiss/markshift.git
cd markshift
npm install && npm run build
npm link  # makes `markshift` available globally
```

Requires Node.js 20+.

## Quick Start

```bash
# Auto-detect format and convert
echo '<p>hello <strong>world</strong></p>' | markshift convert

# Explicit direction
markshift html-to-md page.html -o page.md
markshift md-to-html doc.md -o doc.html
```

## Commands

### `convert` -- Auto-detect and convert

The `convert` command detects whether input is HTML, Markdown, or RTF and converts to the opposite format (HTML/RTF to Markdown, Markdown to HTML).

```bash
# From stdin
echo '<h1>Title</h1><p>Body text</p>' | markshift convert

# From file
markshift convert page.html -o page.md

# Force target format (skip auto-detection)
markshift convert notes.txt -t md
markshift convert notes.txt -t html

# Extract main content from a full web page (strips nav, ads, sidebars)
curl -s https://example.com | markshift convert --extract-content
```

### `html-to-md` -- HTML to Markdown

Converts HTML to GitHub-Flavored Markdown. Supports tables, task lists, strikethrough, and fenced code blocks with language detection.

```bash
markshift html-to-md page.html
markshift html-to-md page.html -o output.md
cat page.html | markshift html-to-md
```

### `md-to-html` -- Markdown to HTML

Renders Markdown to HTML (CommonMark + GFM). Output is suitable for pasting into email clients, Teams, or web editors.

```bash
markshift md-to-html README.md
markshift md-to-html doc.md -o doc.html
echo '**bold** and _italic_' | markshift md-to-html
```

## Input / Output

Every command accepts input three ways and writes output three ways:

| Input | Usage |
|-------|-------|
| File argument | `markshift convert page.html` |
| stdin | `cat page.html \| markshift convert` |
| Clipboard | `markshift convert --paste` |

| Output | Usage |
|--------|-------|
| stdout (default) | `markshift convert page.html` |
| File | `markshift convert page.html -o out.md` |
| Clipboard | `markshift convert page.html --copy` |

`--paste` and `--copy` can be combined for a full clipboard round-trip:

```bash
# Copy HTML from a browser, run this, paste Markdown into your editor
markshift convert --paste --copy
```

When reading from the clipboard with `--paste`, markshift checks for content in this order: HTML > RTF > plain text. This means copying rich text from Word, Notes, or a browser gives you the best conversion automatically.

## Content Extraction

The `--extract-content` flag (on the `convert` command) uses Mozilla's Readability algorithm to pull the main article content from a web page, stripping navigation, ads, sidebars, and boilerplate.

```bash
# Pipe a saved web page through extraction
markshift convert --extract-content < saved-page.html

# Combine with curl to convert a URL to clean Markdown
curl -s https://example.com/article | markshift convert --extract-content
```

## JSON Output

The `--json` flag outputs a structured envelope with the converted content and metadata, useful for scripting and agent integration:

```bash
echo '**hello**' | markshift convert --json
```

```json
{
  "content": "<p><strong>hello</strong></p>\n",
  "metadata": {
    "sourceFormat": "markdown",
    "targetFormat": "html",
    "processingTimeMs": 1.23,
    "inputLength": 9,
    "outputLength": 28
  }
}
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--paste` | Read input from system clipboard (HTML > RTF > text) |
| `--copy` | Write converted output to system clipboard |
| `--json` | Structured JSON output with content and metadata |
| `-q, --quiet` | Suppress all non-essential output |
| `-V, --verbose` | Show detailed processing information (to stderr) |
| `-v, --version` | Display version number |

All informational output (verbose, status messages) goes to stderr, keeping stdout clean for piping.

## Supported Conversions

| From | To | Notes |
|------|----|-------|
| HTML | Markdown | GFM tables, task lists, strikethrough, fenced code with language hints |
| Markdown | HTML | CommonMark + GFM (tables, strikethrough, task lists, autolinks) |
| RTF | Markdown | Via RTF -> HTML -> Markdown pipeline. Handles macOS clipboard RTF from Word, Notes, etc. |
| Web page HTML | Markdown | With `--extract-content`: Readability-based extraction + semantic table detection |

## Web UI

A browser-based version is available at [noahkiss.github.io/markshift](https://noahkiss.github.io/markshift/). All conversion happens client-side -- no data is sent to any server.

## License

MIT
