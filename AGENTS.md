# Agent Instructions for text-transform

**IMPORTANT**: Before starting any work on this project, review the project vision and architecture in README.md.

## Project Overview

text-transform is a suite of tools for converting text to and from Markdown format. This includes:
- HTML ↔ Markdown
- Rich text ↔ Markdown
- Chat formats (Teams, Slack) → Markdown
- Confluence/Jira → Markdown
- Smart processing for common websites (GitHub issues, documentation sites, etc.)
- Clipboard processing for seamless workflow integration

**Core Design Principle**: Multiple entry/exit points for maximum accessibility - agents, humans, automation tools, and integrations should all be first-class citizens.

## Architecture Components

1. **CLI Tool** - Command-line interface for batch processing and scripting
2. **Web Service** - HTTP API and web interface
3. **URL Proxy Service** - `/[url]` endpoint that fetches and converts any webpage
4. **Smart Processors** - Site-specific converters for common sources
5. **Clipboard Integration** - Direct system clipboard access for workflow automation
6. **Automation Hooks** - Alfred/Raycast workflows, iOS Shortcuts, etc.

## Development Guidelines

### Technology Stack
- Language: Go (for performance and single-binary distribution)
- Web framework: TBD (likely stdlib or chi/echo)
- Markdown library: TBD (goldmark or similar)
- HTML parsing: golang.org/x/net/html or similar
- Clipboard: golang-design/clipboard or atotto/clipboard for cross-platform support

### Code Organization
- Keep converters modular and testable
- Each format converter should be in its own package
- Smart processors should be pluggable/registerable
- Maintain high test coverage for conversion accuracy

### When Adding New Converters
1. Create a new package under `pkg/converters/`
2. Implement the standard Converter interface
3. Add comprehensive tests with example inputs/outputs
4. Register the converter in the main registry
5. Update CLI flags and web API endpoints
6. Document any format-specific quirks or limitations

### Smart Processor Guidelines
Smart processors are site-specific converters that understand the structure of common websites:
- Identify sites by URL pattern matching
- Extract main content intelligently (ignore nav, ads, etc.)
- Preserve important metadata (authors, dates, issue numbers, etc.)
- Handle pagination and multi-part content when relevant

### Conversion Quality Standards
- Preserve semantic meaning over visual appearance
- Maintain links and references accurately
- Handle edge cases gracefully (malformed HTML, mixed encodings, etc.)
- Provide options for strict vs. lenient parsing
- Include source attribution when converting from URLs

### Clipboard & Automation Integration
Clipboard processing is a core feature, not an afterthought:
- Support reading multiple clipboard formats (text, HTML, RTF) on macOS, Linux, and Windows
- Auto-detect content type and apply appropriate converter
- Provide `--copy` flag to write results back to clipboard for seamless workflows
- Design CLI output to be pipe-friendly for agent/script usage
- Keep clipboard operations fast (<100ms for typical content)
- Consider watch mode for continuous clipboard monitoring
- Provide clear error messages when clipboard access fails (permissions, etc.)

### Agent-Friendly Design
This tool should be easy for coding agents (like Claude Code) to use:
- Clear, parseable output formats (JSON mode, plain text, markdown)
- Predictable exit codes and error messages
- Support stdin/stdout for pipeline integration
- JSON output for structured data when needed (`--json` flag)
- Verbose mode for debugging agent interactions (`--verbose`)
- Progress indicators can be disabled for scripting (`--quiet`)

### Integration Points to Support
- **Alfred/Raycast**: Consider providing example workflow files in `integrations/`
- **iOS Shortcuts**: Document URL scheme and intent handling if applicable
- **Browser Extensions**: Future consideration for right-click conversion
- **API Clients**: Well-documented REST API for third-party integrations
