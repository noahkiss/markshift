# Phase 6: Clipboard Integration - Research

**Researched:** 2026-01-23
**Domain:** Cross-platform clipboard access (macOS, Linux) with multiple format support
**Confidence:** MEDIUM

## Summary

This research investigates how to implement clipboard integration for the markshift CLI, enabling users to read from and write to the system clipboard with `--paste` and `--copy` flags. The phase requires reading multiple clipboard formats (HTML, RTF, plain text) with a preference order, and cross-platform support for macOS and Linux.

The Node.js clipboard ecosystem is fragmented. The dominant library `clipboardy` (22M+ weekly downloads) only supports plain text. For multi-format support (HTML, RTF, text), the options are: (1) use `@crosscopy/clipboard` which provides native bindings via Rust/NAPI, or (2) spawn native OS commands directly (`pbv`/`pbpaste` on macOS, `xclip`/`wl-paste` on Linux) with MIME type targeting. The `@crosscopy/clipboard` library is the most promising single-package solution, but has lower adoption (~2 years since last publish) and a known macOS bug with image change detection (not relevant to our text-focused use case).

**Primary recommendation:** Use `@crosscopy/clipboard` for its unified API supporting HTML, RTF, and text formats across platforms. Fall back to OS command spawning if native bindings prove problematic.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @crosscopy/clipboard | 0.2.8 | Read/write clipboard with HTML, RTF, text support | Only Node.js library with multi-format support via native bindings |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clipboardy | 5.0.2 | Fallback plain-text clipboard access | If @crosscopy/clipboard fails or for simple text-only operations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @crosscopy/clipboard | OS command spawning | More control, but requires maintaining platform-specific code and binary dependencies |
| @crosscopy/clipboard | clipboardy | 22M+ weekly downloads, but text-only (no HTML/RTF) |
| Native bindings | child_process spawn | Avoids native dependency compilation, but adds ~50-100ms latency per operation |

**Installation:**
```bash
npm install @crosscopy/clipboard
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli/
│   └── utils/
│       └── clipboard.ts     # Clipboard read/write utilities
├── cli/
│   └── program.ts           # Add --paste and --copy global options
```

### Pattern 1: Format Preference Chain
**What:** Read clipboard trying formats in order: HTML > RTF > plain text
**When to use:** When implementing --paste flag
**Example:**
```typescript
// Source: @crosscopy/clipboard index.d.ts
import Clipboard from '@crosscopy/clipboard';

export async function readClipboardWithPreference(): Promise<{
  content: string;
  format: 'html' | 'rtf' | 'text';
}> {
  // Check formats in preference order
  if (await Clipboard.hasHtml()) {
    return { content: await Clipboard.getHtml(), format: 'html' };
  }
  if (await Clipboard.hasRtf()) {
    return { content: await Clipboard.getRtf(), format: 'rtf' };
  }
  if (await Clipboard.hasText()) {
    return { content: await Clipboard.getText(), format: 'text' };
  }
  throw new Error('Clipboard is empty or contains unsupported format');
}
```

### Pattern 2: Clipboard Write with Format Detection
**What:** Write to clipboard as plain text (markdown output)
**When to use:** When implementing --copy flag
**Example:**
```typescript
// Source: @crosscopy/clipboard index.d.ts
import Clipboard from '@crosscopy/clipboard';

export async function writeToClipboard(content: string): Promise<void> {
  await Clipboard.setText(content);
}
```

### Pattern 3: Global Options Integration with Commander.js
**What:** Add --paste and --copy as global options inherited by all commands
**When to use:** Following existing CLI pattern from Phase 4/5
**Example:**
```typescript
// Source: Existing src/cli/program.ts pattern
const program = new Command()
  .name('markshift')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('--json', 'output results as JSON')
  .option('--paste', 'read input from system clipboard')
  .option('--copy', 'write output to system clipboard');
```

### Anti-Patterns to Avoid
- **Synchronous clipboard operations:** Always use async methods to avoid blocking the event loop
- **Ignoring format availability:** Always check `hasHtml()`, `hasRtf()`, `hasText()` before reading to provide meaningful error messages
- **Mixing input sources:** Don't allow both `--paste` and file input simultaneously - pick one or error

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-format clipboard reading | Custom OS command parsing | @crosscopy/clipboard | Handles macOS/Linux differences, MIME types, binary formats |
| Plain text clipboard | Spawning pbcopy/xclip manually | clipboardy or @crosscopy/clipboard | Cross-platform, handles Wayland vs X11 detection |
| RTF parsing from clipboard | Custom RTF parser | @crosscopy/clipboard getRtf() | RTF is complex, native bindings handle it |

**Key insight:** Clipboard access looks simple (just call pbcopy!) but has surprising complexity: multiple clipboards (PRIMARY vs CLIPBOARD on Linux), MIME type negotiation, Wayland vs X11 detection, and binary format handling.

## Common Pitfalls

### Pitfall 1: Assuming Text-Only Clipboard
**What goes wrong:** Using `clipboardy` which only supports text, losing HTML/RTF formatting
**Why it happens:** clipboardy is the most popular library (22M downloads) so it seems like the obvious choice
**How to avoid:** Use @crosscopy/clipboard which supports HTML, RTF, and text
**Warning signs:** User pastes formatted content, gets plain text output

### Pitfall 2: Linux Wayland vs X11 Detection
**What goes wrong:** Clipboard operations fail on Wayland systems when only xclip is used
**Why it happens:** Modern Linux distros (Ubuntu 22.04+, Fedora) use Wayland by default
**How to avoid:** @crosscopy/clipboard handles this automatically; if using OS commands, check `$XDG_SESSION_TYPE` and use `wl-paste`/`wl-copy` for Wayland
**Warning signs:** Works on some Linux systems but not others, `xclip` errors about display

### Pitfall 3: Missing OS Dependencies on Linux
**What goes wrong:** Clipboard operations fail with cryptic errors
**Why it happens:** Linux requires `xclip`, `xsel`, or `wl-clipboard` packages installed
**How to avoid:** Provide clear error message: "Clipboard access requires xclip (X11) or wl-clipboard (Wayland)"
**Warning signs:** "Command not found" errors in logs

### Pitfall 4: Empty Clipboard Handling
**What goes wrong:** Uncaught exception when clipboard is empty
**Why it happens:** Not checking hasText()/hasHtml()/hasRtf() before reading
**How to avoid:** Always check availability first, provide user-friendly error
**Warning signs:** Crashes when user hasn't copied anything

### Pitfall 5: Conflicting Input Sources
**What goes wrong:** Ambiguous behavior when both --paste and file input provided
**Why it happens:** Not validating mutual exclusivity of input sources
**How to avoid:** Error early: "Cannot use --paste with file input"
**Warning signs:** Unexpected input being processed

### Pitfall 6: Performance on Large Clipboard Content
**What goes wrong:** Slow operations with large images/documents in clipboard
**Why it happens:** Checking hasImage() or reading large binary data
**How to avoid:** Check text formats first (fast), avoid image checks unless needed; target <100ms per AGENTS.md
**Warning signs:** Operations taking >100ms

## Code Examples

### Reading Clipboard with Format Detection
```typescript
// Source: @crosscopy/clipboard API + project format detection pattern
import Clipboard from '@crosscopy/clipboard';
import type { Format } from '../../types/index.js';

interface ClipboardContent {
  content: string;
  sourceFormat: Format;
}

export async function readClipboard(): Promise<ClipboardContent> {
  // Check formats in preference order: HTML > RTF > text
  if (await Clipboard.hasHtml()) {
    const content = await Clipboard.getHtml();
    return { content, sourceFormat: 'html' };
  }

  if (await Clipboard.hasRtf()) {
    const content = await Clipboard.getRtf();
    return { content, sourceFormat: 'rtf' };
  }

  if (await Clipboard.hasText()) {
    const content = await Clipboard.getText();
    // Use existing format detection for text content
    return { content, sourceFormat: 'text' };
  }

  throw new Error(
    'Clipboard is empty or contains only images/files.\n' +
    'Copy some text, HTML, or RTF content first.'
  );
}
```

### Writing to Clipboard
```typescript
// Source: @crosscopy/clipboard API
import Clipboard from '@crosscopy/clipboard';

export async function writeClipboard(content: string): Promise<void> {
  await Clipboard.setText(content);
}
```

### Integrating with Existing readInput Pattern
```typescript
// Source: Existing src/cli/utils/io.ts pattern extended
import { readClipboard } from './clipboard.js';

export async function readInput(
  inputPath?: string,
  options?: { paste?: boolean }
): Promise<{ content: string; sourceFormat?: Format }> {
  // Mutual exclusivity check
  if (options?.paste && inputPath) {
    throw new Error('Cannot use --paste with file input. Choose one.');
  }

  if (options?.paste) {
    return await readClipboard();
  }

  // Existing file/stdin logic...
}
```

### Error Handling Pattern
```typescript
// Source: Project error handling patterns
export async function safeClipboardRead(): Promise<ClipboardContent> {
  try {
    return await readClipboard();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Provide helpful platform-specific guidance
    if (message.includes('xclip') || message.includes('wl-paste')) {
      throw new Error(
        'Clipboard access failed. On Linux, install:\n' +
        '  - xclip (X11): apt install xclip\n' +
        '  - wl-clipboard (Wayland): apt install wl-clipboard'
      );
    }

    throw new Error(`Failed to read clipboard: ${message}`);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xclip only | wl-clipboard for Wayland | Ubuntu 22.04 (2022) | Must support both X11 and Wayland |
| clipboardy for all | @crosscopy/clipboard for multi-format | 2023 | Enables HTML/RTF without custom code |
| pbpaste only (macOS) | pbv for multi-format | N/A | pbv provides public.html, public.rtf access |

**Deprecated/outdated:**
- `copy-paste` npm package: Maintenance issues, use clipboardy or @crosscopy/clipboard instead
- X11-only solutions: Wayland is now default on many distros

## Open Questions

1. **RTF conversion support**
   - What we know: @crosscopy/clipboard can read RTF from clipboard
   - What's unclear: Do we have an RTF-to-Markdown converter? The format-detect.ts mentions "RTF detection is not implemented here (Phase 7 scope)"
   - Recommendation: For Phase 6, detect RTF and either convert if converter exists, or warn user that RTF conversion is coming in a future phase

2. **Native binding compilation**
   - What we know: @crosscopy/clipboard uses NAPI/Rust bindings which require compilation
   - What's unclear: Will this cause issues on different Node.js versions or architectures?
   - Recommendation: Include clipboardy as fallback for text-only operations if native bindings fail

3. **Performance target verification**
   - What we know: AGENTS.md specifies <100ms for clipboard operations
   - What's unclear: Actual performance of @crosscopy/clipboard on each platform
   - Recommendation: Add performance logging in verbose mode, validate during implementation

## Sources

### Primary (HIGH confidence)
- @crosscopy/clipboard index.d.ts - Full API: `getText()`, `getHtml()`, `getRtf()`, `hasText()`, `hasHtml()`, `hasRtf()`, `setText()`, etc.
- [GitHub CrossCopy/clipboard](https://github.com/CrossCopy/clipboard) - Repository, issues, platform support
- Existing project code: src/cli/utils/io.ts, src/cli/types.ts, src/cli/program.ts

### Secondary (MEDIUM confidence)
- [clipboardy npm](https://www.npmjs.com/package/clipboardy) - 22M+ weekly downloads, text-only, v5.0.2
- [macos-pasteboard (pbv)](https://github.com/chbrown/macos-pasteboard) - macOS multi-format via public.html, public.rtf
- [xclip manpage](https://manpages.ubuntu.com/manpages/jammy/man1/xclip.1.html) - Linux X11: `-t text/html` target
- [wl-clipboard](https://github.com/bugaevc/wl-clipboard) - Wayland: `-t text/html` type option

### Tertiary (LOW confidence)
- WebSearch results for clipboard ecosystem - ecosystem overview, may be outdated
- @crosscopy/clipboard issue #6 - macOS image detection bug (not relevant to text use case)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - @crosscopy/clipboard is best option but has lower adoption than clipboardy
- Architecture: HIGH - Follows established project patterns, clear API
- Pitfalls: HIGH - Well-documented platform differences and error cases

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - clipboard APIs are stable)
