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

## Usage

```bash
# Auto-detect format and convert
echo '<p>hello <strong>world</strong></p>' | markshift convert

# Explicit direction
markshift html-to-md < page.html > page.md
markshift md-to-html < doc.md > doc.html

# Clipboard: read, convert, write back
markshift convert --paste --copy

# Extract main content from noisy HTML (strips nav, ads, boilerplate)
markshift convert --extract-content < page.html

# JSON output for scripting
echo '**bold**' | markshift convert --json
```

### Commands

| Command | Description |
|---------|-------------|
| `convert` | Auto-detect format and convert (default) |
| `html-to-md` | HTML to Markdown |
| `md-to-html` | Markdown to HTML |

### Flags

| Flag | Description |
|------|-------------|
| `--paste` | Read input from system clipboard |
| `--copy` | Write output to system clipboard |
| `--extract-content` | Extract main content (Readability) |
| `--json` | Structured JSON output |
| `-q, --quiet` | Suppress non-essential output |
| `-V, --verbose` | Detailed processing info |

## Web UI

Try it in the browser at [noahkiss.github.io/markshift](https://noahkiss.github.io/markshift/).

## Supported Formats

- **HTML to Markdown** -- GFM tables, task lists, strikethrough, code blocks with language hints
- **Markdown to HTML** -- Full CommonMark + GFM rendering
- **RTF to Markdown** -- Via HTML intermediate (handles macOS clipboard RTF)
- **Content extraction** -- Mozilla Readability-based, with semantic table detection

## License

MIT
