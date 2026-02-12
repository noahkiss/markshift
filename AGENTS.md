# Agent Instructions for markshift

## Project Overview

markshift is a CLI tool for converting between HTML, Markdown, and rich text formats. Features:
- HTML <-> Markdown (bidirectional)
- RTF -> Markdown (via HTML intermediate)
- Content extraction (Readability-based, strips nav/ads/boilerplate)
- Clipboard integration (--paste/--copy flags)
- Web UI (GitHub Pages, client-side conversion)

**Core Design Principle**: Multiple entry/exit points for maximum accessibility - agents, humans, automation tools, and integrations should all be first-class citizens.

## Architecture

```
src/
  cli/              # Commander.js CLI (commands, I/O utils, clipboard, format detection)
  converters/       # Core conversion engines
    html-to-markdown/   # Turndown-based, GFM plugin, custom rules
    markdown-to-html/   # Marked-based rendering
    rtf-to-html/        # @iarna/rtf-to-html pipeline
    html-to-markdown/extractors/  # Readability content extraction
  types/            # Converter interface, format types, registry
  web/              # Browser entry point (Vite build -> docs/)
```

## Technology Stack
- **Language**: TypeScript (ESM)
- **Runtime**: Node.js >= 20
- **CLI**: Commander.js + @commander-js/extra-typings
- **HTML -> MD**: Turndown + turndown-plugin-gfm
- **MD -> HTML**: Marked
- **RTF -> HTML**: @iarna/rtf-to-html
- **Content extraction**: @mozilla/readability + linkedom
- **Clipboard**: @crosscopy/clipboard (multi-format: HTML, RTF, text)
- **Web build**: Vite (output to docs/ for GitHub Pages)
- **Testing**: Vitest
- **Dev runner**: tsx

## Development Guidelines

### Code Organization
- Keep converters modular and testable
- Each format converter in its own package under `src/converters/`
- Converter interface: `convert(input: string, options?: ConvertOptions) => ConvertResult`
- Registry pattern for converter lookup by format pair
- All non-data CLI output goes to stderr (stdout stays clean for piping)

### When Adding New Converters
1. Create a new directory under `src/converters/`
2. Implement the Converter interface from `src/types/`
3. Add tests with example inputs/outputs
4. Register in `src/converters/index.ts`
5. Add CLI command in `src/cli/commands/`

### Conversion Quality Standards
- Preserve semantic meaning over visual appearance
- Maintain links and references accurately
- Handle malformed HTML gracefully (no crashes)
- Preserve whitespace in code blocks exactly
- UTF-8 including emoji and CJK must render correctly

### Agent-Friendly Design
- `--json` flag for structured output (content + metadata envelope)
- `--quiet` suppresses non-essential output
- Predictable exit codes
- stdin/stdout for pipeline integration
- All info/debug output to stderr
