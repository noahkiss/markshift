# text-transform

## What This Is

A comprehensive suite of tools for converting text to and from Markdown format, designed to streamline workflows where content moves between different platforms (web pages, Teams, email, Jira) and LLM processing. Eliminates the need for juggling random web converters and manual copy-paste editing.

## Core Value

Seamless, reliable conversion that fits into existing workflows. When moving content between tools and LLMs, the conversion process should be invisible - no more hunting for converters or manually cleaning up formatting.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Convert HTML to Markdown with semantic structure preserved (headings, lists, links, emphasis, tables, code blocks)
- [ ] Convert Markdown to HTML with basic formatting support (suitable for Teams, email)
- [ ] Convert rich text/RTF to Markdown (clipboard processing)
- [ ] Convert between Jira format and Markdown (bidirectional)
- [ ] CLI tool that can read from and write to clipboard
- [ ] Cross-platform clipboard support (macOS primary, Linux/Windows secondary)
- [ ] Installable via Homebrew custom tap
- [ ] Auto-detect content type from clipboard (HTML, RTF, plain text)
- [ ] Clean extraction of main content from web pages (strip navigation, ads, boilerplate)

### Out of Scope

- Real-time collaboration features — This is a conversion tool, not a collaborative editor
- Content storage or hosting — Conversions are ephemeral, no database or file management
- Authentication or user accounts — Local tool for individual use
- Pixel-perfect layout preservation — Semantic meaning matters, exact visual layout doesn't
- Native Alfred/Raycast plugins for v1 — CLI integration via hotkeys is sufficient initially
- Advanced editing features for v1 — Focus on conversion quality, not WYSIWYG editing
- Smart processors for specific sites (GitHub, Confluence) for v1 — Nice to have, not critical
- Web service or URL proxy for v1 — CLI solves immediate need
- Watch mode for continuous clipboard monitoring for v1 — Manual trigger is acceptable initially

## Context

**Primary Use Case**: Daily work workflow where content constantly moves between platforms:
1. Extract content from web pages/Teams/email → convert to Markdown → process with LLM
2. Take LLM output in Markdown → convert to HTML/Jira format → paste into Teams/email/Jira

**Current Pain Points**:
- Using random online converters (unreliable, inconsistent quality)
- Manual copy-paste and editing (time-consuming, error-prone)
- Pasting raw HTML into LLMs (wastes context with unnecessary markup)
- No reliable go-to tool for these conversions

**Markdown as Interchange Format**: Markdown is the cleanest format for LLM input/output, so the tool acts as a universal translator with Markdown at the center.

**Platform Focus**: macOS is the primary development and usage environment (work and home machine).

## Constraints

- **Platform**: macOS first — This is where daily usage happens. Linux/Windows support is secondary.
- **Distribution**: Homebrew installable via custom tap — Standard macOS package management approach.
- **Tech Stack**: Flexible, but likely JavaScript/TypeScript — Leverage existing ecosystem (turndown for HTML→Markdown, markdown-it for Markdown→HTML, etc.) rather than building from scratch.
- **Quality over Perfection**: Semantic meaning and readability matter more than pixel-perfect conversion. Clean, friendly-looking Markdown is the goal.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI-first with clipboard flags | External tools (Raycast, Alfred) can call CLI commands via hotkeys; simpler than building native integrations | — Pending |
| Leverage existing libraries (turndown, etc.) | Don't reinvent the wheel; focus on integration and workflow rather than core conversion algorithms | — Pending |
| macOS-only for v1 | Solves immediate need; cross-platform adds complexity that can wait | — Pending |
| Semantic conversion over pixel-perfect | Use case is LLM processing and basic formatting, not document preservation | — Pending |

---
*Last updated: 2026-01-22 after initialization*
