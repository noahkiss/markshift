# text-transform

A comprehensive suite of tools for converting text to and from Markdown format.

## Vision

text-transform aims to be the universal translator for text content, making it easy to:
- Convert web pages to clean, readable Markdown
- Extract conversations from chat platforms (Slack, Teams) into archivable Markdown
- Transform Confluence pages and Jira issues into portable documentation
- Convert between rich text formats and Markdown
- Process any webpage intelligently through a simple URL proxy
- Transform clipboard content on-the-fly for seamless workflows

**Design Philosophy**: Maximum accessibility through multiple entry and exit points - CLI, web service, clipboard, automation tools, and API integrations.

## Features (Planned)

### 🖥️ CLI Tool
```bash
# Convert a webpage to markdown
text-transform url https://example.com/article -o article.md

# Convert HTML file to markdown
text-transform html input.html -o output.md

# Convert markdown to HTML
text-transform markdown input.md -o output.html

# Process with smart detection
text-transform smart https://github.com/user/repo/issues/123

# Process clipboard content (reads from clipboard, outputs markdown)
text-transform clipboard

# Process clipboard and copy result back to clipboard
text-transform clipboard --copy

# Process clipboard with specific processor
text-transform clipboard --smart github
```

### 📋 Clipboard & Integration Support
- **Direct clipboard processing**: Read from and write to system clipboard
- **Alfred/Raycast workflows**: Trigger conversions via hotkeys or keywords
- **iOS Shortcuts**: Share sheet integration for mobile workflows
- **Automation-friendly**: Designed for scripting and agent integration
- **Watch mode**: Monitor clipboard for automatic conversions
- **Format detection**: Automatically detect and process HTML, RTF, or URLs in clipboard

### 🌐 Web Service
- Simple web interface for one-off conversions
- REST API for integration with other tools
- URL proxy endpoint: `https://mydomain.com/[https://target-site.com/page]`

### 🎯 Smart Processors
Site-specific processors that understand the structure of common platforms:
- **GitHub**: Issues, PRs, discussions, README files
- **Confluence**: Pages, spaces, attachments
- **Jira**: Issues, comments, project pages
- **Stack Overflow**: Questions and answers
- **Medium/Substack**: Articles with proper attribution
- **Reddit**: Threads and comments
- **Documentation sites**: Intelligent content extraction

### 🔄 Supported Conversions
- HTML → Markdown
- Markdown → HTML
- Rich Text (RTF) → Markdown
- Slack export → Markdown
- Teams chat → Markdown
- Confluence → Markdown
- Jira → Markdown
- Email (MIME) → Markdown

## Architecture

```
text-transform/
├── cmd/
│   ├── cli/          # Command-line interface
│   └── server/       # Web service
├── pkg/
│   ├── converters/   # Format converters
│   │   ├── html/
│   │   ├── markdown/
│   │   ├── slack/
│   │   └── ...
│   ├── smart/        # Smart processors for specific sites
│   │   ├── github/
│   │   ├── confluence/
│   │   └── ...
│   ├── clipboard/    # Clipboard handling (cross-platform)
│   ├── fetcher/      # URL fetching and preprocessing
│   └── registry/     # Converter registration and discovery
├── internal/
│   └── ...           # Internal packages
└── web/
    └── ...           # Web UI assets
```

## Development Status

🚧 **Early Development** - This project is currently in the bootstrap phase.

## Getting Started

*(Coming soon)*

## Contributing

*(Coming soon)*

## License

*(To be determined)*
