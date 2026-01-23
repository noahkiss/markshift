# Architecture Research

**Domain:** Text format conversion tools (HTML/Markdown/RTF/Jira)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
                              ┌─────────────────────────────────────────────────────┐
                              │               Interface Layer                        │
                              │  ┌─────────┐  ┌───────────────┐  ┌───────────────┐  │
                              │  │   CLI   │  │   Clipboard   │  │  Web Service  │  │
                              │  │(primary)│  │  Integration  │  │   (future)    │  │
                              │  └────┬────┘  └───────┬───────┘  └───────┬───────┘  │
                              │       │              │                  │          │
                              ├───────┴──────────────┴──────────────────┴──────────┤
                              │               Core Conversion Engine                │
                              │  ┌───────────────────────────────────────────────┐  │
                              │  │             Conversion Orchestrator            │  │
                              │  │   (format detection, routing, pipeline)       │  │
                              │  └─────────────────────┬─────────────────────────┘  │
                              │                        │                            │
                              │  ┌─────────────────────┴─────────────────────────┐  │
                              │  │              Converter Registry               │  │
                              │  │    (pluggable converters, bidirectional)     │  │
                              │  └─────────────────────┬─────────────────────────┘  │
                              ├────────────────────────┼────────────────────────────┤
                              │               Converter Layer                       │
                              │  ┌───────────┐ ┌───────────┐ ┌───────────┐         │
                              │  │HTML ↔ MD  │ │RTF → MD   │ │Jira ↔ MD  │  ...    │
                              │  │(turndown) │ │(custom)   │ │(jira2md)  │         │
                              │  └───────────┘ └───────────┘ └───────────┘         │
                              └─────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CLI | Parse args, route to orchestrator, handle I/O | commander.js with subcommands |
| Clipboard Integration | Read/write system clipboard formats | @crosscopy/clipboard or native |
| Conversion Orchestrator | Detect format, select converter, execute pipeline | Custom coordinator class |
| Converter Registry | Register, lookup, and instantiate converters | Map/factory pattern |
| Individual Converters | Transform source format ↔ target format | Library wrappers + custom logic |

## Recommended Project Structure

```
src/
├── cli/                     # CLI entry point and commands
│   ├── index.ts             # Main CLI entry (commander setup)
│   ├── commands/            # Subcommand handlers
│   │   ├── convert.ts       # Main conversion command
│   │   ├── detect.ts        # Format detection command
│   │   └── clipboard.ts     # Clipboard operations
│   └── options.ts           # Shared CLI options
├── core/                    # Core conversion engine
│   ├── orchestrator.ts      # Main conversion coordinator
│   ├── registry.ts          # Converter registration/lookup
│   ├── detector.ts          # Format auto-detection
│   └── types.ts             # Core interfaces and types
├── converters/              # Individual format converters
│   ├── base.ts              # Abstract converter interface
│   ├── html-markdown/       # HTML ↔ Markdown (uses turndown)
│   │   ├── index.ts
│   │   ├── to-markdown.ts
│   │   └── from-markdown.ts
│   ├── rtf-markdown/        # RTF → Markdown
│   │   └── index.ts
│   ├── jira-markdown/       # Jira ↔ Markdown (uses jira2md)
│   │   └── index.ts
│   └── index.ts             # Exports all converters
├── clipboard/               # Clipboard handling
│   ├── reader.ts            # Read from clipboard
│   ├── writer.ts            # Write to clipboard
│   └── formats.ts           # Format detection from clipboard
├── utils/                   # Shared utilities
│   ├── errors.ts            # Custom error types
│   └── logging.ts           # Logging utilities
└── index.ts                 # Library entry point
```

### Structure Rationale

- **cli/:** Isolated CLI concerns from core logic. Allows the conversion engine to be used as a library.
- **core/:** The engine that coordinates conversions. Interface layer agnostic.
- **converters/:** Each converter in its own directory. Easy to add new formats without touching other code.
- **clipboard/:** Platform-specific clipboard handling isolated from conversion logic.
- **utils/:** Shared code that doesn't belong to a specific domain.

## Architectural Patterns

### Pattern 1: Converter Interface

**What:** Define a standard interface that all converters implement, enabling pluggable format support.

**When to use:** Always. This is the foundation of extensibility.

**Trade-offs:**
- (+) Easy to add new formats
- (+) Easy to test converters in isolation
- (-) Slight abstraction overhead

**Example:**
```typescript
// core/types.ts
export interface ConversionResult {
  content: string;
  metadata?: Record<string, unknown>;
  warnings?: string[];
}

export interface ConverterOptions {
  strict?: boolean;
  preserveWhitespace?: boolean;
  [key: string]: unknown;
}

export interface Converter {
  /** Unique identifier for this converter */
  id: string;

  /** Source format (e.g., 'html', 'rtf', 'jira') */
  from: string;

  /** Target format (e.g., 'markdown') */
  to: string;

  /** Convert content from source to target format */
  convert(input: string, options?: ConverterOptions): Promise<ConversionResult>;

  /** Check if this converter can handle the input */
  canHandle?(input: string): boolean;
}

// For bidirectional converters
export interface BidirectionalConverter extends Converter {
  /** Reverse conversion (target → source) */
  reverse(input: string, options?: ConverterOptions): Promise<ConversionResult>;
}
```

### Pattern 2: Converter Registry

**What:** Central registry that maps format pairs to converters, enabling dynamic converter lookup.

**When to use:** When you have multiple converters and need to route based on format.

**Trade-offs:**
- (+) Decouples format detection from conversion
- (+) Easy to swap implementations
- (-) Indirection can make debugging harder

**Example:**
```typescript
// core/registry.ts
export class ConverterRegistry {
  private converters = new Map<string, Converter>();

  register(converter: Converter): void {
    const key = this.makeKey(converter.from, converter.to);
    this.converters.set(key, converter);
  }

  get(from: string, to: string): Converter | undefined {
    return this.converters.get(this.makeKey(from, to));
  }

  getAll(): Converter[] {
    return Array.from(this.converters.values());
  }

  private makeKey(from: string, to: string): string {
    return `${from}->${to}`;
  }
}

// Usage
const registry = new ConverterRegistry();
registry.register(new HtmlToMarkdownConverter());
registry.register(new JiraToMarkdownConverter());
```

### Pattern 3: Pipe-Based Data Flow

**What:** Process data through stdin/stdout, enabling Unix-style piping.

**When to use:** For CLI tools that need to integrate with other tools.

**Trade-offs:**
- (+) Composable with other CLI tools
- (+) Memory efficient for large content
- (-) Error handling is trickier with streams

**Example:**
```typescript
// cli/commands/convert.ts
export async function convertCommand(options: ConvertOptions): Promise<void> {
  // Read from stdin or file
  const input = options.input
    ? await readFile(options.input, 'utf-8')
    : await readStdin();

  // Convert
  const result = await orchestrator.convert(input, {
    from: options.from,
    to: options.to,
  });

  // Write to stdout or file
  if (options.output) {
    await writeFile(options.output, result.content);
  } else {
    process.stdout.write(result.content);
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
```

### Pattern 4: Format Auto-Detection

**What:** Automatically detect input format based on content patterns.

**When to use:** When the user hasn't specified input format explicitly.

**Trade-offs:**
- (+) Better UX, less flags to specify
- (-) Detection can be wrong for ambiguous content
- (-) Adds complexity

**Example:**
```typescript
// core/detector.ts
export function detectFormat(content: string): string | null {
  // HTML detection (tag presence)
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return 'html';
  }

  // RTF detection (header)
  if (content.startsWith('{\\rtf')) {
    return 'rtf';
  }

  // Jira detection (common patterns)
  if (/\{code[:\}]|\{quote\}|h[1-6]\.\s/.test(content)) {
    return 'jira';
  }

  // Markdown detection (common patterns)
  if (/^#{1,6}\s|^\*\s|\*\*.*\*\*|^\[.*\]\(.*\)/m.test(content)) {
    return 'markdown';
  }

  return null; // Unknown
}
```

## Data Flow

### Conversion Flow

```
[Input Source]
     │
     ▼
┌─────────────────┐
│ Format Detection│ ← Auto-detect or explicit --from flag
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Converter Lookup│ ← Registry finds appropriate converter
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Conversion    │ ← Converter transforms content
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Post-Process   │ ← Optional: cleanup, formatting
└────────┬────────┘
         │
         ▼
[Output Destination]
```

### Clipboard Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Clipboard Read Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  System Clipboard                                               │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                            │
│  │ Read All Types  │ ← Check HTML, RTF, plain text              │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ Select Richest  │ ← Prefer HTML > RTF > plain text           │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │    Convert      │ ← Use appropriate converter                │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  [Markdown Output to stdout or --copy back to clipboard]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **CLI Conversion:** stdin/file → detect → convert → stdout/file
2. **Clipboard Paste:** clipboard → detect → convert → stdout or clipboard
3. **Library Usage:** string → orchestrator.convert() → ConversionResult

## Build Order Dependencies

The architecture suggests this implementation order:

```
Phase 1: Foundation
├── core/types.ts         (Converter interface, types)
├── core/registry.ts      (Basic registry)
└── converters/base.ts    (Abstract base class)

Phase 2: First Converter
├── converters/html-markdown/  (Using turndown)
├── core/orchestrator.ts       (Basic orchestration)
└── CLI skeleton               (Basic commander setup)

Phase 3: Full CLI
├── cli/ complete
├── Format detection
├── stdin/stdout support
└── JSON output mode

Phase 4: Clipboard
├── clipboard/reader.ts
├── clipboard/writer.ts
└── CLI --clipboard, --copy flags

Phase 5: Additional Converters
├── converters/jira-markdown/  (Using jira2md)
├── converters/rtf-markdown/
└── Extend registry

Phase 6: Polish
├── Error handling refinement
├── Verbose/quiet modes
└── Integration tests
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user CLI | Current architecture is perfect. No changes needed. |
| Web service (100-1k req/s) | Add request queuing. Consider worker threads for CPU-intensive conversions. |
| High volume service | Consider WebAssembly for hot path conversions (turndown has WASM options). |

### Scaling Priorities

1. **First bottleneck:** Large HTML documents with complex nesting. Solution: streaming conversion or chunking.
2. **Second bottleneck:** Memory usage with many concurrent conversions. Solution: worker pool pattern.

## Anti-Patterns

### Anti-Pattern 1: God Converter

**What people do:** Put all conversion logic in one massive file/class.
**Why it's wrong:** Becomes unmaintainable. Can't test formats in isolation. Adding new formats is painful.
**Do this instead:** One converter per format pair. Share common logic through utilities or base class.

### Anti-Pattern 2: Tight CLI Coupling

**What people do:** Put conversion logic directly in CLI command handlers.
**Why it's wrong:** Can't use as a library. Can't test without CLI parsing. Can't add web service later.
**Do this instead:** CLI handlers are thin. They parse args and delegate to orchestrator/core.

### Anti-Pattern 3: Synchronous Clipboard

**What people do:** Block on clipboard operations in the main thread.
**Why it's wrong:** Clipboard operations can hang. User experience degrades.
**Do this instead:** Make clipboard operations async with timeouts.

### Anti-Pattern 4: Format Detection in Converters

**What people do:** Have each converter try to detect if it can handle the input.
**Why it's wrong:** Leads to inconsistent detection. Multiple converters may claim the same input.
**Do this instead:** Centralized format detection before converter selection.

### Anti-Pattern 5: Swallowing Conversion Warnings

**What people do:** Ignore or drop warnings from underlying libraries (e.g., turndown's escape warnings).
**Why it's wrong:** Users don't know about potential issues. Silent data loss.
**Do this instead:** Collect warnings in ConversionResult and surface them (especially in verbose mode).

## Integration Points

### External Libraries

| Library | Integration Pattern | Notes |
|---------|---------------------|-------|
| turndown | Instantiate TurndownService, configure rules | Use plugins for extended HTML support |
| jira2md | Direct function calls | Bidirectional: toMarkdown(), toJira() |
| commander.js | Program builder pattern | Use .command() for subcommands |
| @crosscopy/clipboard | Async read/write | HTML support built-in, RTF requires platform checks |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI ↔ Core | Function calls via Orchestrator | Keep CLI layer thin |
| Core ↔ Converters | Converter interface | All converters implement same interface |
| Clipboard ↔ Core | Content + format type | Clipboard returns content with detected format |

## Technology Decisions

Based on research, these are the recommended libraries:

| Component | Recommended | Rationale |
|-----------|-------------|-----------|
| CLI framework | commander.js | Widely used, TypeScript support, subcommand support |
| HTML→Markdown | turndown | Industry standard, plugin system, actively maintained |
| Jira↔Markdown | jira2md | Bidirectional, battle-tested |
| RTF→HTML | rtf.js or custom | Limited options; may need RTF→HTML→Markdown pipeline |
| Clipboard | @crosscopy/clipboard | HTML format support, cross-platform |
| Markdown parsing | unified/remark | If we need Markdown→X, unified ecosystem is best |

## Sources

- [Pandoc Architecture](https://deepwiki.com/jgm/pandoc) - Reader/Writer/AST pattern (HIGH confidence)
- [Turndown GitHub](https://github.com/mixmark-io/turndown) - Rule-based conversion (HIGH confidence)
- [unified.js](https://github.com/unifiedjs/unified) - Pipeline architecture (HIGH confidence)
- [rehype-remark](https://github.com/rehypejs/rehype-remark) - HAST→MDAST transformation (HIGH confidence)
- [Commander.js](https://github.com/tj/commander.js) - CLI structure (HIGH confidence)
- [jira2md](https://www.npmjs.com/package/jira2md) - Jira conversion (HIGH confidence)
- [Converter Pattern](https://java-design-patterns.com/patterns/converter/) - Generic converter interface (MEDIUM confidence)
- [@crosscopy/clipboard](https://github.com/CrossCopy/clipboard) - Clipboard with HTML support (MEDIUM confidence)

---
*Architecture research for: text-transform (multi-format text converter)*
*Researched: 2026-01-22*
