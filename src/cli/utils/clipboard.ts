/**
 * Clipboard utilities using platform commands
 *
 * macOS: pbcopy/pbpaste for text, osascript+AppKit for HTML/RTF
 * Linux: xclip for all formats
 *
 * @packageDocumentation
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, platform } from 'node:os';

const isMac = platform() === 'darwin';

/**
 * Result of reading from clipboard
 */
export interface ClipboardContent {
  /** The clipboard content */
  content: string;
  /** Detected format of the clipboard content */
  sourceFormat: 'html' | 'rtf' | 'text';
}

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    return '';
  }
}

/** Run osascript via stdin to avoid all escaping issues */
function osascript(script: string): string {
  try {
    return execSync('osascript', {
      input: script,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    }).trim();
  } catch {
    return '';
  }
}

function readHtml(): string {
  if (isMac) {
    return osascript(`
use framework "AppKit"
set pb to current application's NSPasteboard's generalPasteboard()
set html to pb's stringForType:"public.html"
if html is missing value then
  return ""
else
  return html as text
end if
`);
  }
  return exec('xclip -selection clipboard -t text/html -o 2>/dev/null');
}

function readRtf(): string {
  if (isMac) {
    return osascript(`
use framework "AppKit"
set pb to current application's NSPasteboard's generalPasteboard()
set rtfData to pb's dataForType:"public.rtf"
if rtfData is missing value then
  return ""
else
  set rtfStr to (current application's NSString's alloc()'s initWithData:rtfData encoding:(current application's NSUTF8StringEncoding))
  if rtfStr is missing value then return ""
  return rtfStr as text
end if
`);
  }
  return exec('xclip -selection clipboard -t text/rtf -o 2>/dev/null');
}

function readText(): string {
  if (isMac) {
    return exec('pbpaste 2>/dev/null');
  }
  return exec('xclip -selection clipboard -o 2>/dev/null');
}

/**
 * Read content from system clipboard with format preference
 *
 * Checks formats in order: HTML > RTF > text
 *
 * @returns Clipboard content and detected format
 * @throws Error if clipboard is empty or contains only images/files
 */
export async function readClipboard(): Promise<ClipboardContent> {
  const html = readHtml();
  if (html.trim()) {
    return { content: html, sourceFormat: 'html' };
  }

  const rtf = readRtf();
  if (rtf.trim()) {
    return { content: rtf, sourceFormat: 'rtf' };
  }

  const text = readText();
  if (text) {
    return { content: text, sourceFormat: 'text' };
  }

  throw new Error(
    'Clipboard is empty or contains only images/files.\n' +
      'Copy some text, HTML, or RTF content first.'
  );
}

/**
 * Write content to system clipboard
 *
 * When format is 'html', sets the HTML clipboard type so rich-text apps
 * (Teams, Word, email) paste formatted content. Also sets a plain text
 * fallback for text-only apps.
 *
 * @param content - Content to write to clipboard
 * @param format - Output format: 'html' sets HTML clipboard type, 'text' (default) sets plain text
 */
export async function writeClipboard(content: string, format?: 'html' | 'text'): Promise<void> {
  if (format === 'html') {
    if (isMac) {
      // Write to temp file so osascript can read it (avoids escaping)
      const tmpFile = join(tmpdir(), `markshift-${process.pid}.html`);
      writeFileSync(tmpFile, content, 'utf-8');
      try {
        osascript(`
use framework "AppKit"
use framework "Foundation"
set htmlContent to (current application's NSString's stringWithContentsOfFile:"${tmpFile}" encoding:(current application's NSUTF8StringEncoding) |error|:(missing value))
set pb to current application's NSPasteboard's generalPasteboard()
pb's clearContents()
pb's setString:htmlContent forType:"public.html"
pb's setString:htmlContent forType:"public.utf8-plain-text"
`);
      } finally {
        try { unlinkSync(tmpFile); } catch {}
      }
    } else {
      execSync('xclip -selection clipboard -t text/html', { input: content, encoding: 'utf-8' });
    }
  } else {
    if (isMac) {
      execSync('pbcopy', { input: content, encoding: 'utf-8' });
    } else {
      execSync('xclip -selection clipboard', { input: content, encoding: 'utf-8' });
    }
  }
}
