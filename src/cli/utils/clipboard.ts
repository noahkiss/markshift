/**
 * Clipboard utilities for reading/writing system clipboard
 *
 * Supports multiple formats (HTML, RTF, text) with preference order.
 *
 * @packageDocumentation
 */
import Clipboard from '@crosscopy/clipboard';

/**
 * Result of reading from clipboard
 */
export interface ClipboardContent {
  /** The clipboard content */
  content: string;
  /** Detected format of the clipboard content */
  sourceFormat: 'html' | 'rtf' | 'text';
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
    return { content, sourceFormat: 'text' };
  }

  throw new Error(
    'Clipboard is empty or contains only images/files.\n' +
      'Copy some text, HTML, or RTF content first.'
  );
}

/**
 * Write content to system clipboard as plain text
 *
 * @param content - Content to write to clipboard
 */
export async function writeClipboard(content: string): Promise<void> {
  await Clipboard.setText(content);
}
