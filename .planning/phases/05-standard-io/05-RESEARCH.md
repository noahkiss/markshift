# Phase 5: Standard I/O - Research

**Researched:** 2026-01-23
**Domain:** stdin/stdout pipeline support, format auto-detection, JSON structured output
**Confidence:** HIGH

## Summary

Phase 5 enables markshift to function as a proper Unix-style pipeline tool. The existing CLI infrastructure (Commander.js, I/O utilities at `src/cli/utils/io.ts`, logger with stderr separation) provides a solid foundation. This phase adds: (1) format auto-detection to determine whether stdin contains HTML or Markdown, (2) a `--json` flag for structured machine-readable output, and (3) completing the stdin/stdout pipeline integration.

The key technical challenge is **format auto-detection** (CONV-07). HTML can be reliably detected via pattern matching for common HTML tags, while Markdown detection is best handled as "not HTML" since Markdown is valid plain text by design. The lightweight `is-html` npm package (by sindresorhus) provides battle-tested heuristics for HTML detection without heavy DOM parsing overhead.

For JSON output (IO-06), the established pattern is a `--json` flag that outputs a structured object containing the converted content plus metadata (source format, target format, processing time). All informational logging must be suppressed when `--json` is active to keep stdout clean for parsing.

**Primary recommendation:** Implement format detection using `is-html` package for HTML detection (fallback to Markdown), add a `--json` global flag that wraps converter results in a structured JSON envelope, and add a `convert` root command that auto-detects format and routes to the appropriate converter.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| is-html | 3.x | HTML content detection | sindresorhus ecosystem, lightweight, no DOM parsing, 113+ npm dependents |
| (existing) commander | 14.0.2 | CLI with global --json flag | Already installed, pattern supports global options |
| (existing) Node.js streams | native | stdin/stdout handling | Already implemented in io.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | - | - | Existing stack covers all needs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| is-html | Custom regex | is-html handles edge cases (deprecated tags, partial docs), well-tested |
| is-html | DOMParser/jsdom | Overkill for detection only, adds ~1MB dependency, slower |
| is-html | file-type/magika | Designed for binary files/MIME types, not plain text content heuristics |

**Installation:**
```bash
npm install is-html
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli/
│   ├── commands/
│   │   ├── html-to-md.ts    # Existing
│   │   ├── md-to-html.ts    # Existing
│   │   └── convert.ts       # NEW: auto-detect command
│   ├── utils/
│   │   ├── io.ts            # Existing (stdin/stdout)
│   │   ├── logger.ts        # Existing
│   │   └── format-detect.ts # NEW: format detection
│   ├── types.ts             # NEW: JSON output types
│   ├── index.ts             # Existing entry point
│   └── program.ts           # Add --json global option
└── types/
    └── index.ts             # Existing types
```

### Pattern 1: Format Detection Module
**What:** Module that inspects content and returns detected format
**When to use:** When user doesn't specify input format explicitly
**Example:**
```typescript
// Source: is-html package + practical heuristics
import isHtml from 'is-html';
import type { Format } from '../../types/index.js';

/**
 * Detects whether content is HTML, Markdown, or plain text
 *
 * Strategy:
 * 1. Check for HTML using is-html (handles common tags, doctype)
 * 2. If not HTML, assume Markdown (Markdown is valid plain text)
 *
 * Note: RTF detection deferred to Phase 7
 */
export function detectFormat(content: string): Format {
  // Trim and check for empty content
  const trimmed = content.trim();
  if (!trimmed) {
    return 'text';
  }

  // Check for HTML - is-html uses regex heuristics for known tags
  if (isHtml(trimmed)) {
    return 'html';
  }

  // Default to markdown (markdown is valid plain text)
  return 'markdown';
}
```

### Pattern 2: JSON Output Envelope
**What:** Standardized JSON structure for --json output
**When to use:** When --json flag is provided
**Example:**
```typescript
// Source: oclif JSON patterns + GitHub CLI conventions
/**
 * JSON output structure for machine-readable results
 */
export interface JsonOutput {
  /** The converted content */
  content: string;
  /** Metadata about the conversion */
  metadata: {
    /** Detected or specified source format */
    sourceFormat: string;
    /** Target format of conversion */
    targetFormat: string;
    /** Processing time in milliseconds */
    processingTimeMs: number;
    /** Input character count */
    inputLength: number;
    /** Output character count */
    outputLength: number;
  };
}

/**
 * Wraps a ConvertResult into JSON output format
 */
export function toJsonOutput(
  result: ConvertResult,
  inputLength: number
): JsonOutput {
  return {
    content: result.content,
    metadata: {
      sourceFormat: result.metadata?.sourceFormat ?? 'unknown',
      targetFormat: result.metadata?.targetFormat ?? 'unknown',
      processingTimeMs: result.metadata?.processingTimeMs ?? 0,
      inputLength,
      outputLength: result.content.length,
    },
  };
}
```

### Pattern 3: Auto-Detect Convert Command
**What:** Root-level convert command that auto-detects input format
**When to use:** Primary command for pipeline usage
**Example:**
```typescript
// Source: Commander.js patterns from Phase 4 research
import { Command } from '@commander-js/extra-typings';
import { detectFormat } from '../utils/format-detect.js';
import { readInput, writeOutput } from '../utils/io.js';
import { createLogger } from '../utils/logger.js';
import { HtmlToMarkdownConverter } from '../../converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../../converters/markdown-to-html/index.js';
import { toJsonOutput } from '../types.js';

interface GlobalOptions {
  quiet?: boolean;
  verbose?: boolean;
  json?: boolean;
}

export const convertCommand = new Command('convert')
  .description('Auto-detect format and convert (HTML->MD or MD->HTML)')
  .argument('[input]', 'input file (stdin if omitted)')
  .option('-o, --output <file>', 'output file (stdout if omitted)')
  .option('-t, --to <format>', 'target format: md or html')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    const logger = createLogger(globalOpts.quiet, globalOpts.verbose);

    try {
      const content = await readInput(input);
      const detectedFormat = detectFormat(content);

      logger.verbose(`Detected format: ${detectedFormat}`);

      // Determine target format
      let targetFormat = options.to;
      if (!targetFormat) {
        targetFormat = detectedFormat === 'html' ? 'md' : 'html';
        logger.verbose(`Auto-selected target: ${targetFormat}`);
      }

      // Select converter
      const converter = detectedFormat === 'html'
        ? new HtmlToMarkdownConverter()
        : new MarkdownToHtmlConverter();

      const result = converter.convert(content);

      // Output
      if (globalOpts.json) {
        const jsonOutput = toJsonOutput(result, content.length);
        process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
      } else {
        await writeOutput(options.output, result.content);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      command.error(`Conversion failed: ${message}`, { exitCode: 1 });
    }
  });
```

### Pattern 4: Global JSON Flag
**What:** Adding --json as a global option
**When to use:** In program.ts for all commands
**Example:**
```typescript
// Source: Commander.js global options pattern
const program = new Command()
  .name('markshift')
  .description('Convert between HTML and Markdown formats')
  .version(VERSION, '-v, --version', 'display version number')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('-V, --verbose', 'show detailed processing information')
  .option('--json', 'output results as JSON (for machine parsing)');
```

### Pattern 5: Conditional Logger for JSON Mode
**What:** Logger that respects both --quiet and --json flags
**When to use:** All subcommand actions
**Example:**
```typescript
// When --json is active, treat it like --quiet for logging purposes
// JSON output should be clean - no mixing log messages with JSON
const isQuiet = globalOpts.quiet || globalOpts.json;
const logger = createLogger(isQuiet, globalOpts.verbose);
```

### Anti-Patterns to Avoid
- **Mixing console.log with JSON output:** When --json is active, ALL stdout must be valid JSON; use logger (stderr) for messages
- **Complex format detection heuristics:** Don't try to distinguish "rich Markdown" from "plain text" - treat all non-HTML as Markdown
- **Parsing HTML to detect it:** is-html uses regex which is sufficient; DOM parsing is overkill for detection
- **Changing exit codes for --json:** Exit codes should be the same whether or not --json is used
- **Nested JSON output:** Keep the JSON structure flat with content and metadata at top level

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML detection | Custom regex for `<html>`, `<div>`, etc. | is-html | Handles DOCTYPE, partial documents, doesn't false-positive on custom XML tags |
| Markdown detection | Regex for `#`, `**`, `[]()` | "Not HTML" fallback | Markdown is valid plain text; any non-HTML text converts fine as Markdown |
| stdin reading | Custom readline loops | Existing io.ts readInput | Already handles TTY detection, encoding, async iteration |
| JSON serialization | Manual string building | JSON.stringify | Handles escaping, null values, nested objects correctly |
| stdout writing | console.log() | process.stdout.write() | console.log adds newline; stdout.write is explicit |

**Key insight:** Format detection for conversion is a binary decision: "Is this HTML?" If yes, convert HTML->MD. If no, convert MD->HTML. Trying to detect Markdown specifically adds complexity without value since any text converts successfully as Markdown.

## Common Pitfalls

### Pitfall 1: console.log in JSON Mode
**What goes wrong:** JSON output is unparseable due to mixed log messages
**Why it happens:** Using console.log for progress messages instead of stderr
**How to avoid:**
- Use logger (which writes to stderr) for all non-data output
- When --json is active, suppress logger output like --quiet
- Only process.stdout.write for the final JSON result
**Warning signs:** `markshift convert < input.html --json | jq` fails with parse error

### Pitfall 2: Detecting Markdown Instead of HTML
**What goes wrong:** Unnecessary complexity, false positives/negatives
**Why it happens:** Thinking you need to positively identify both formats
**How to avoid:**
- Only detect HTML (with is-html)
- Everything else is treated as Markdown
- Markdown is text; any text is valid Markdown input
**Warning signs:** "Unable to detect format" errors when input is plain text

### Pitfall 3: JSON Output Without Newline
**What goes wrong:** When piped, next shell prompt appears on same line
**Why it happens:** Forgetting trailing newline after JSON
**How to avoid:**
- Always append `\n` after JSON.stringify output
- Use `process.stdout.write(JSON.stringify(output) + '\n')`
**Warning signs:** Terminal prompt appears on same line as JSON output

### Pitfall 4: Different Exit Codes for JSON Mode
**What goes wrong:** Scripts checking exit codes behave differently with --json
**Why it happens:** Special-casing error handling for JSON output
**How to avoid:**
- Exit code 0 for success, non-zero for failure, regardless of --json
- Error details go in stderr (not wrapped in JSON)
- Successful conversion: JSON to stdout, exit 0
- Failed conversion: error to stderr, exit 1
**Warning signs:** `markshift convert < bad.html --json; echo $?` returns different code than without --json

### Pitfall 5: Attempting RTF Detection in Phase 5
**What goes wrong:** Scope creep, RTF requires different handling
**Why it happens:** CONV-07 mentions RTF, but Phase 5 requirements scope to HTML/Markdown
**How to avoid:**
- Phase 5: HTML vs Markdown/text detection only
- RTF detection is Phase 7 (CONV-08) scope
- Document the limitation: "RTF detection not yet implemented"
**Warning signs:** Trying to add RTF parsing dependencies in this phase

### Pitfall 6: Breaking Existing Subcommands
**What goes wrong:** html-to-md and md-to-html stop working correctly with --json
**Why it happens:** Not adding --json support to existing commands
**How to avoid:**
- Add --json handling to ALL commands, not just the new convert command
- Existing commands should respect the global --json flag
- Test all three commands with and without --json
**Warning signs:** `markshift html-to-md --json` outputs raw text, not JSON

## Code Examples

Verified patterns from official sources:

### is-html Usage
```typescript
// Source: https://github.com/sindresorhus/is-html
import isHtml from 'is-html';

isHtml('<p>hello</p>');         // true
isHtml('<cake>lie</cake>');     // false (not a real HTML tag)
isHtml('hello world');          // false
isHtml('<!doctype html>');      // true
```

### Complete JSON Output Handling
```typescript
// Source: oclif JSON pattern + CLI best practices
interface ConversionJsonOutput {
  content: string;
  metadata: {
    sourceFormat: string;
    targetFormat: string;
    processingTimeMs: number;
    inputLength: number;
    outputLength: number;
  };
}

async function handleConversion(
  input: string | undefined,
  options: { output?: string },
  globalOpts: { quiet?: boolean; verbose?: boolean; json?: boolean },
  command: Command
): Promise<void> {
  // Suppress logging in JSON mode
  const logger = createLogger(
    globalOpts.quiet || globalOpts.json,
    globalOpts.verbose
  );

  try {
    const content = await readInput(input);
    const format = detectFormat(content);

    logger.verbose(`Detected: ${format}, length: ${content.length}`);

    const converter = format === 'html'
      ? new HtmlToMarkdownConverter()
      : new MarkdownToHtmlConverter();

    const result = converter.convert(content);

    if (globalOpts.json) {
      const output: ConversionJsonOutput = {
        content: result.content,
        metadata: {
          sourceFormat: format,
          targetFormat: format === 'html' ? 'markdown' : 'html',
          processingTimeMs: result.metadata?.processingTimeMs ?? 0,
          inputLength: content.length,
          outputLength: result.content.length,
        },
      };
      process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    } else {
      await writeOutput(options.output, result.content);
      if (options.output) {
        logger.info(`Written to ${options.output}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Error always goes to stderr, even in JSON mode
    command.error(`Conversion failed: ${message}`, { exitCode: 1 });
  }
}
```

### stdin Pipeline Test Commands
```bash
# Test HTML to Markdown via stdin
echo '<p>Hello <strong>world</strong></p>' | markshift convert

# Test with explicit format
echo '# Hello' | markshift convert --to html

# Test JSON output
echo '<p>test</p>' | markshift convert --json

# Parse JSON with jq
echo '<p>test</p>' | markshift convert --json | jq '.metadata'

# Test existing subcommands with --json
echo '<p>test</p>' | markshift html-to-md --json
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| --output-format flag | --json boolean flag | 2024-2025 | Simpler UX, clearer intent |
| Complex format detection | is-html + fallback | 2020+ | "HTML or not" is sufficient for conversion |
| Separate detect command | Auto-detect in convert | 2024+ | Better UX, fewer commands to learn |
| Exit codes differ for JSON | Consistent exit codes | Always | Scripts work the same with/without --json |

**Deprecated/outdated:**
- `--format json` - Prefer `--json` boolean flag (simpler, more common)
- DOM-based HTML detection - Overkill for detection; is-html regex is sufficient
- Multiple output format flags - Just `--json` for machine-readable; human is default

## Open Questions

Things that couldn't be fully resolved:

1. **Default command behavior**
   - What we know: Many CLIs have a default action when no subcommand given
   - What's unclear: Should `markshift < input` default to `convert` behavior?
   - Recommendation: Keep explicit subcommands for now; add default later if requested

2. **JSON error output format**
   - What we know: Success case outputs structured JSON
   - What's unclear: Should errors also be JSON when --json is active?
   - Recommendation: Errors to stderr as text (consistent with Unix conventions); let exit code signal failure

3. **JSON indentation**
   - What we know: `JSON.stringify(obj, null, 2)` is readable
   - What's unclear: Some tools prefer compact JSON for parsing
   - Recommendation: Use 2-space indentation by default; it's still valid JSON

## Sources

### Primary (HIGH confidence)
- [is-html GitHub](https://github.com/sindresorhus/is-html) - HTML detection heuristics, API
- [oclif JSON docs](https://oclif.io/docs/json/) - enableJsonFlag pattern, output structure
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - JSON output, stdin/stdout patterns
- `/tj/commander.js` (Context7) - Global options, optsWithGlobals(), custom option parsing
- Existing codebase - io.ts, logger.ts, program.ts patterns

### Secondary (MEDIUM confidence)
- [GitHub CLI Manual](https://cli.github.com/manual/gh_help_formatting) - --json flag conventions
- [LogRocket stdin/stdout guide](https://blog.logrocket.com/using-stdout-stdin-stderr-node-js/) - Node.js stream patterns
- WebSearch: CLI JSON output best practices 2026

### Tertiary (LOW confidence)
- WebSearch: Format detection heuristics (general patterns, not Node.js specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - is-html verified via GitHub/npm, existing stack verified in codebase
- Architecture: HIGH - Patterns from existing codebase + verified CLI best practices
- Code examples: HIGH - Based on is-html docs, oclif patterns, Commander.js Context7
- Pitfalls: MEDIUM - Aggregated from CLI best practices, some from general experience

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable patterns, no breaking changes expected)
