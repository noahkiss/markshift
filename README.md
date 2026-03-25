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

The `convert` command detects whether input is HTML, Markdown, RTF, CSV/TSV, or JSON and converts to the appropriate format.

```bash
# From stdin
echo '<h1>Title</h1><p>Body text</p>' | markshift convert

# From file
markshift convert page.html -o page.md

# Force target format
markshift convert notes.txt --to md
markshift convert notes.txt --to html
markshift convert data.md --to csv

# Fetch a URL and convert to Markdown
markshift convert --url https://example.com/article

# Extract main content from a full web page (strips nav, ads, sidebars)
curl -s https://example.com | markshift convert --extract-content

# Clean messy HTML (Excel, web) via round-trip
markshift convert --paste --copy --to html

# Wrap clipboard code in a fenced block with language detection
markshift convert --paste --copy --to code

# Strip all formatting to plain text
markshift convert --paste --copy --to text
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
| HTML | Markdown | GFM tables, task lists, strikethrough, fenced code with language hints, Confluence support |
| Markdown | HTML | CommonMark + GFM (tables, strikethrough, task lists, autolinks). Writes HTML clipboard type for rich text pasting |
| RTF | Markdown | Via RTF -> HTML -> Markdown pipeline. Handles macOS clipboard RTF from Word, Notes, etc. |
| CSV/TSV | Markdown | Auto-detects delimiter (tabs vs commas), handles quoted fields |
| JSON | Markdown | Arrays of objects -> table, single objects -> key/value table |
| Markdown | CSV | Extracts first GFM table, outputs CSV with proper quoting |
| HTML | HTML | Round-trip cleanup (`--to html`): cleans messy Excel/web HTML |
| Any | Plain text | `--to text`: strips all HTML tags and Markdown formatting |
| Any | Code block | `--to code`: wraps in fenced markdown with auto-detected language |
| Web page HTML | Markdown | With `--extract-content`: Readability-based extraction + semantic table detection |
| URL | Markdown | With `--url`: fetches page and extracts content |

### Confluence Support

Confluence HTML (both rendered pages copied from the browser and storage format XML from the API) is handled automatically. Panels become blockquotes, status lozenges become inline code, code blocks preserve language hints, and TOC macros are stripped.

## Raycast Integration

Raycast scripts are included in `scripts/raycast/` for one-keystroke clipboard conversion on macOS.

### Setup

1. Install markshift (`brew install noahkiss/tap/markshift` or standalone bundle)
2. In Raycast, go to Extensions > Script Commands > Add Script Directory
3. Point it to the `scripts/raycast/` folder (or copy the scripts to your own script directory)

### Included Scripts

| Script | Hotkey suggestion | What it does |
|--------|-------------------|--------------|
| **Convert Clipboard** | `⌥⇧V` | Auto-detect format and convert (rich text -> markdown, markdown -> HTML, CSV -> table) |
| **Table to CSV** | `⌥⇧C` | Convert a markdown table in clipboard to CSV |
| **Clean & Paste Rich** | `⌥⇧H` | Clean messy HTML (from Excel, web) into paste-ready rich text |

Each script runs silently -- it reads your clipboard, converts, and writes the result back. Just paste after.

## Standalone Bundle

For a single-file CLI with no dependencies (beyond Node.js):

```bash
# Build to a custom location
node build-bundle.mjs ~/bin/markshift

# Or use the npm script
npm run build:install  # builds to ~/bin/markshift
```

The bundle is ~1.9MB and works anywhere with Node.js 20+.

## Web UI

A browser-based version is available at [noahkiss.github.io/markshift](https://noahkiss.github.io/markshift/). All conversion happens client-side -- no data is sent to any server.

## License

MIT
