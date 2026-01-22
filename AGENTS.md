# Agent Instructions for text-transform

**IMPORTANT**: Before starting any work on this project, review the project vision and architecture in README.md.

## Project Overview

text-transform is a suite of tools for converting text to and from Markdown format. This includes:
- HTML ↔ Markdown
- Rich text ↔ Markdown
- Chat formats (Teams, Slack) → Markdown
- Confluence/Jira → Markdown
- Smart processing for common websites (GitHub issues, documentation sites, etc.)

## Architecture Components

1. **CLI Tool** - Command-line interface for batch processing and scripting
2. **Web Service** - HTTP API and web interface
3. **URL Proxy Service** - `/[url]` endpoint that fetches and converts any webpage
4. **Smart Processors** - Site-specific converters for common sources

## Development Guidelines

### Technology Stack
- Language: Go (for performance and single-binary distribution)
- Web framework: TBD (likely stdlib or chi/echo)
- Markdown library: TBD (goldmark or similar)
- HTML parsing: golang.org/x/net/html or similar

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
