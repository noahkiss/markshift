# Phase 4: CLI Framework - Research

**Researched:** 2026-01-23
**Domain:** Node.js CLI frameworks, argument parsing, subcommands, help generation, exit codes
**Confidence:** HIGH

## Summary

Phase 4 implements the command-line interface for markshift, providing a usable CLI with standard UX patterns including subcommands, help documentation, verbose/quiet modes, and proper exit codes. Research confirms that **Commander.js v14.0.2** is the industry-standard library for Node.js CLI applications, with approximately 238 million weekly downloads and 27,770 GitHub stars. It powers Vue CLI, Create React App, and countless other developer tools.

Commander.js provides all required features out of the box: declarative command definition, automatic help generation (`--help`), git-style subcommands, option parsing with type coercion, version display (`--version`), and robust error handling with customizable exit codes. For TypeScript projects, the companion package `@commander-js/extra-typings` provides enhanced type inference for options and action parameters.

The CLI architecture follows a simple pattern: define a root Command with global options (`--quiet`, `--verbose`), add subcommands for each conversion type (`html-to-md`, `md-to-html`), parse arguments with `.parseAsync()` for async action support, and let Commander handle help generation and error display automatically.

**Primary recommendation:** Use Commander.js v14.0.2 with @commander-js/extra-typings, implement `--quiet` to suppress non-essential output, `--verbose` for debug information, and use Commander's built-in error handling with `program.error()` for actionable error messages with proper exit codes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | 14.0.2 | CLI argument parsing, subcommands, help generation | Industry standard, 238M+ weekly downloads, powers Vue CLI/CRA, requires Node >= 20 |
| @commander-js/extra-typings | 14.0.0 | TypeScript type inference for Commander | Official companion package, infers types from option/argument definitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| picocolors | 1.1.x | Terminal colors (optional) | If colored output desired in verbose mode; lighter than chalk |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| commander | yargs | Yargs has 138M weekly downloads, more complex API, better for validation-heavy CLIs |
| commander | oclif | Oclif is enterprise-grade with plugin architecture, overkill for simple CLIs, steeper learning curve |
| commander | citty | Citty is elegant/lightweight (4 code snippets), but less ecosystem support and documentation |
| @commander-js/extra-typings | Standard commander types | Extra-typings provides better inference for .opts() and .action(), worth the extra dependency |

**Installation:**
```bash
npm install commander
npm install -D @commander-js/extra-typings
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli/
│   ├── index.ts          # Main CLI entry point with program definition
│   ├── commands/         # Subcommand handlers
│   │   ├── html-to-md.ts # html-to-md subcommand
│   │   └── md-to-html.ts # md-to-html subcommand
│   └── utils/
│       └── logger.ts     # Verbose/quiet aware logging
├── converters/           # Existing converters from Phase 2/3
├── types/                # Shared types
└── index.ts              # Library exports
```

### Pattern 1: Main CLI Entry Point
**What:** Root program with global options and subcommands
**When to use:** The main CLI file that orchestrates everything
**Example:**
```typescript
// Source: Commander.js README + extra-typings pattern
import { Command } from '@commander-js/extra-typings';
import { VERSION } from '../index.js';
import { htmlToMdCommand } from './commands/html-to-md.js';
import { mdToHtmlCommand } from './commands/md-to-html.js';

const program = new Command()
  .name('markshift')
  .description('Convert between HTML and Markdown formats')
  .version(VERSION, '-v, --version', 'display version number')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('-V, --verbose', 'show detailed processing information');

// Add subcommands
program.addCommand(htmlToMdCommand);
program.addCommand(mdToHtmlCommand);

// Parse and handle errors
export async function run(argv: string[] = process.argv): Promise<void> {
  try {
    await program.parseAsync(argv);
  } catch (error) {
    // Commander handles most errors; this catches unexpected ones
    if (!program.opts().quiet) {
      console.error('Unexpected error:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
```

### Pattern 2: Subcommand Definition
**What:** Individual command with its own options and action handler
**When to use:** Each conversion type gets its own subcommand
**Example:**
```typescript
// Source: Commander.js subcommand pattern
import { Command } from '@commander-js/extra-typings';
import { HtmlToMarkdownConverter } from '../../converters/html-to-markdown/index.js';
import { createLogger } from '../utils/logger.js';

export const htmlToMdCommand = new Command('html-to-md')
  .description('Convert HTML to Markdown')
  .argument('[input]', 'input file path (reads from stdin if omitted)')
  .option('-o, --output <file>', 'output file path (writes to stdout if omitted)')
  .action(async (input, options, command) => {
    // Access parent options for --quiet and --verbose
    const globalOpts = command.optsWithGlobals();
    const logger = createLogger(globalOpts.quiet, globalOpts.verbose);

    logger.verbose('Starting HTML to Markdown conversion');

    // Read input (file or stdin)
    const html = input ? await readFile(input) : await readStdin();
    logger.verbose(`Read ${html.length} characters of input`);

    // Convert
    const converter = new HtmlToMarkdownConverter();
    const result = converter.convert(html);

    logger.verbose(`Conversion completed in ${result.metadata?.processingTimeMs}ms`);

    // Write output (file or stdout)
    if (options.output) {
      await writeFile(options.output, result.content);
      logger.info(`Written to ${options.output}`);
    } else {
      process.stdout.write(result.content);
    }
  });
```

### Pattern 3: Verbose/Quiet Logger Utility
**What:** Logger that respects --quiet and --verbose flags
**When to use:** All output that should be suppressible
**Example:**
```typescript
// Source: Best practice pattern for CLI logging
export interface Logger {
  info(message: string): void;    // Normal output (suppressed by --quiet)
  verbose(message: string): void; // Debug output (only shown with --verbose)
  error(message: string): void;   // Errors (always shown, goes to stderr)
}

export function createLogger(quiet = false, verbose = false): Logger {
  return {
    info(message: string): void {
      if (!quiet) {
        console.error(message); // stderr for info so stdout is clean for piping
      }
    },
    verbose(message: string): void {
      if (verbose && !quiet) {
        console.error(`[verbose] ${message}`);
      }
    },
    error(message: string): void {
      console.error(message); // Always show errors
    },
  };
}
```

### Pattern 4: Stdin Reading
**What:** Read from stdin when no input file provided
**When to use:** Supporting pipe-friendly CLI operations
**Example:**
```typescript
// Source: Node.js process.stdin async iterator pattern
async function readStdin(): Promise<string> {
  // Check if stdin is a TTY (interactive terminal)
  if (process.stdin.isTTY) {
    throw new Error('No input provided. Pipe content or specify an input file.');
  }

  let data = '';
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}
```

### Pattern 5: Error Handling with Actionable Messages
**What:** Use Commander's error() method for consistent error handling
**When to use:** When conversion fails or input is invalid
**Example:**
```typescript
// Source: Commander.js error handling documentation
import { Command } from '@commander-js/extra-typings';

const command = new Command('html-to-md')
  .action(async (input, options, command) => {
    try {
      const html = await readInput(input);
      if (!html.trim()) {
        // program.error() calls process.exit with the specified code
        command.error('Input is empty. Provide HTML content to convert.', {
          exitCode: 1,
          code: 'EMPTY_INPUT',
        });
      }

      const result = converter.convert(html);
      process.stdout.write(result.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      command.error(`Conversion failed: ${message}`, {
        exitCode: 1,
        code: 'CONVERSION_ERROR',
      });
    }
  });
```

### Pattern 6: package.json bin Configuration
**What:** Configure the CLI as an executable
**When to use:** Making the package installable as a global CLI tool
**Example:**
```json
{
  "name": "markshift",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "markshift": "./dist/cli/index.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "start": "node dist/cli/index.js"
  }
}
```

### Pattern 7: CLI Entry File with Shebang
**What:** The actual CLI entry point file
**When to use:** The file referenced in package.json bin
**Example:**
```typescript
#!/usr/bin/env node
// src/cli/index.ts - CLI entry point

import { run } from './program.js';

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Anti-Patterns to Avoid
- **Using console.log for non-data output:** Use console.error for messages so stdout is clean for piping
- **Blocking stdin read in TTY mode:** Check `process.stdin.isTTY` before waiting for stdin
- **Hardcoding exit codes:** Use Commander's `program.error()` with explicit exit codes
- **Ignoring async errors:** Always use `.parseAsync()` when actions are async, handle rejections
- **Global state for verbose/quiet:** Pass logger through to functions, don't use global variables

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing | Custom argv parsing | commander | Edge cases: quoted strings, =, --, combined short opts |
| Help text generation | Manual --help handling | commander (automatic) | Maintains consistency, updates automatically with options |
| Version display | Custom --version | commander .version() | Handles -v, --version, respects exit codes |
| Subcommand routing | if/else on argv[2] | commander .command() | Handles help per subcommand, unknown command errors |
| Option type coercion | parseInt/parseFloat | commander type functions | Handles errors, edge cases, custom validators |
| Exit code management | Direct process.exit | commander .error() | Consistent error format, testable with exitOverride |

**Key insight:** CLI argument parsing has dozens of edge cases that are invisible until users hit them: quoted strings, `--option=value` vs `--option value`, combined short options (`-abc`), `--` to stop parsing, variadic arguments. Commander handles all of these correctly.

## Common Pitfalls

### Pitfall 1: stdout vs stderr Confusion
**What goes wrong:** Informational messages pollute stdout, breaking pipes
**Why it happens:** Using console.log() for progress/status messages
**How to avoid:**
- Use stdout ONLY for actual output data (the converted content)
- Use stderr for everything else: progress, verbose messages, errors
- `console.log()` -> stdout; `console.error()` -> stderr
**Warning signs:** `markshift html-to-md < input.html | wc -l` includes log messages in count

### Pitfall 2: Forgetting Async in Actions
**What goes wrong:** Process exits before file I/O completes
**Why it happens:** Using `.parse()` instead of `.parseAsync()` with async actions
**How to avoid:**
- Always use `await program.parseAsync()` when any action is async
- Mark action handlers as `async`
**Warning signs:** Truncated output, "operation completed" but file is empty

### Pitfall 3: TTY Stdin Hang
**What goes wrong:** CLI hangs waiting for input when run interactively without piped input
**Why it happens:** Attempting to read stdin when user meant to provide a file argument
**How to avoid:**
- Check `process.stdin.isTTY` before reading from stdin
- If TTY and no input file, show helpful error message
**Warning signs:** CLI appears frozen when run without arguments

### Pitfall 4: Non-Zero Exit on Success
**What goes wrong:** CI pipelines fail even on successful conversion
**Why it happens:** Throwing errors without catching, or missing return statements
**How to avoid:**
- Only call `process.exit(1)` or `program.error()` on actual failures
- Use try/catch around all I/O operations
- Verify with `echo $?` after running commands
**Warning signs:** Scripts that wrap the CLI report failures unexpectedly

### Pitfall 5: Missing Error Context
**What goes wrong:** User gets "Error: ENOENT" with no indication what file
**Why it happens:** Re-throwing errors without adding context
**How to avoid:**
- Wrap errors with context: `throw new Error(\`Failed to read input file '${path}': ${err.message}\`)`
- Include the problematic value in error messages
**Warning signs:** Users can't figure out what they did wrong from error message

### Pitfall 6: Version Mismatch
**What goes wrong:** `--version` shows wrong version or outdated
**Why it happens:** Hardcoded version string, not imported from package.json
**How to avoid:**
- Import version from package.json or a generated constant
- Ensure build process keeps version in sync
**Warning signs:** Published package shows different version than npm page

## Code Examples

Verified patterns from official sources:

### Complete CLI Setup with Commander
```typescript
// Source: Commander.js README.md
import { Command } from '@commander-js/extra-typings';

const program = new Command()
  .name('markshift')
  .description('Convert between HTML and Markdown formats')
  .version('0.0.1', '-v, --version', 'display version number')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('-V, --verbose', 'show detailed processing information');

program
  .command('html-to-md')
  .description('Convert HTML to Markdown')
  .argument('[input]', 'input file (stdin if omitted)')
  .option('-o, --output <file>', 'output file (stdout if omitted)')
  .action((input, options) => {
    console.log('Converting HTML to Markdown');
    console.log('Input:', input || 'stdin');
    console.log('Output:', options.output || 'stdout');
  });

program
  .command('md-to-html')
  .description('Convert Markdown to HTML')
  .argument('[input]', 'input file (stdin if omitted)')
  .option('-o, --output <file>', 'output file (stdout if omitted)')
  .action((input, options) => {
    console.log('Converting Markdown to HTML');
  });

await program.parseAsync();
```

### Custom Error Handling
```typescript
// Source: Commander.js error handling docs
import { Command, CommanderError } from '@commander-js/extra-typings';

const program = new Command();

// Configure custom output for errors
program.configureOutput({
  writeErr: (str) => process.stderr.write(str),
  outputError: (str, write) => {
    // Add prefix to error messages
    write(`markshift: ${str}`);
  },
});

// Override exit behavior for testing
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    // Help was displayed, exit normally
    throw err;
  }
  // Re-throw to let normal error handling proceed
  throw err;
});

try {
  await program.parseAsync();
} catch (err) {
  if (err instanceof CommanderError) {
    // Commander already displayed error message
    process.exit(err.exitCode);
  }
  throw err;
}
```

### Reading Files and Stdin
```typescript
// Source: Node.js fs/promises + process.stdin patterns
import { readFile, writeFile } from 'node:fs/promises';

async function readInput(inputPath?: string): Promise<string> {
  if (inputPath) {
    return readFile(inputPath, 'utf-8');
  }

  // Read from stdin
  if (process.stdin.isTTY) {
    throw new Error(
      'No input provided.\n' +
      'Usage: markshift html-to-md <input-file>\n' +
      '   or: cat input.html | markshift html-to-md'
    );
  }

  let data = '';
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

async function writeOutput(outputPath: string | undefined, content: string): Promise<void> {
  if (outputPath) {
    await writeFile(outputPath, content, 'utf-8');
  } else {
    process.stdout.write(content);
  }
}
```

### Testing CLI with exitOverride
```typescript
// Source: Commander.js testing patterns
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('CLI', () => {
  let program: Command;
  let output: string[];

  beforeEach(() => {
    output = [];
    program = new Command()
      .exitOverride() // Throw instead of process.exit
      .configureOutput({
        writeOut: (str) => output.push(str),
        writeErr: (str) => output.push(str),
      });
  });

  it('displays help', () => {
    expect(() => program.parse(['node', 'test', '--help'])).toThrow();
    expect(output.join('')).toContain('Usage:');
  });

  it('displays version', () => {
    program.version('1.0.0');
    expect(() => program.parse(['node', 'test', '--version'])).toThrow();
    expect(output.join('')).toContain('1.0.0');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| yargs or minimist | commander | 2020-2024 | Commander became dominant for simple-moderate CLIs |
| Manual TypeScript types | @commander-js/extra-typings | 2023 | Type inference for opts() and action params |
| CommonJS require() | ESM import | 2024-2025 | Tree-shaking, modern Node.js |
| Synchronous actions | Async actions with parseAsync() | commander 7+ | Proper handling of async operations |
| Custom help formatting | Built-in help configuration | commander 9+ | configureHelp() for customization |
| process.exit() directly | program.error() | commander 9+ | Testable, consistent error handling |

**Deprecated/outdated:**
- `require('commander')` - Use ESM `import { Command } from 'commander'`
- `.parse(process.argv)` without await - Use `await .parseAsync(process.argv)`
- Custom help option handling - Use built-in `.helpOption()` configuration
- commander v7-12 - v14 requires Node >= 20, has better TypeScript support

## Open Questions

Things that couldn't be fully resolved:

1. **Colored output in verbose mode**
   - What we know: picocolors is the lightweight choice, chalk is more feature-rich
   - What's unclear: Whether colors add value for this simple CLI
   - Recommendation: Defer to implementation; start without colors, add if useful

2. **Watch mode for continuous conversion**
   - What we know: chokidar is standard for file watching
   - What's unclear: Whether this belongs in Phase 4 or a later phase
   - Recommendation: Out of scope for Phase 4; focus on core CLI functionality

3. **JSON output mode**
   - What we know: AGENTS.md mentions `--json` flag for structured output
   - What's unclear: Whether this is needed for Phase 4 MVP
   - Recommendation: Consider for Phase 4 if simple; otherwise defer

## Sources

### Primary (HIGH confidence)
- `/tj/commander.js` (Context7) - API, options, subcommands, error handling, TypeScript
- [Commander.js GitHub](https://github.com/tj/commander.js) - v14.0.2, README documentation
- npm registry - commander 14.0.2, @commander-js/extra-typings 14.0.0, Node >= 20 requirement verified
- [Node.js Console API](https://nodejs.org/api/console.html) - stdout/stderr handling

### Secondary (MEDIUM confidence)
- [npm trends commander vs yargs vs oclif](https://npmtrends.com/commander-vs-oclif-vs-yargs) - Download statistics, ecosystem comparison
- [Node.js Exit Codes](https://www.geeksforgeeks.org/node-js/node-js-exit-codes/) - Standard exit code meanings
- [LogRocket TypeScript CLI Guide](https://blog.logrocket.com/building-typescript-cli-node-js-commander/) - Commander + TypeScript patterns

### Tertiary (LOW confidence)
- WebSearch results on CLI best practices 2026 - General patterns
- [tsx documentation](https://www.npmjs.com/package/tsx) - Shebang usage for development

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Commander.js verified via npm, Context7, GitHub; download stats confirmed
- Architecture: HIGH - Patterns from official Commander.js documentation
- Code examples: HIGH - From Context7 and official README
- Pitfalls: MEDIUM - Aggregated from multiple sources, community patterns

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - Commander.js is stable, v14 recently released)
