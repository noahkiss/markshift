/**
 * Format detection utilities for auto-detecting content type
 *
 * @packageDocumentation
 */
import isHtml from 'is-html';
import type { Format } from '../../types/index.js';

/**
 * Check if content looks like RTF
 *
 * RTF files begin with `{\rtf` followed by version number.
 */
function isRtf(content: string): boolean {
  return content.startsWith('{\\rtf');
}

/**
 * Detect the format of the given content
 *
 * Uses magic bytes to detect RTF, is-html library to detect HTML content.
 * Falls back to 'markdown' for non-HTML text content.
 *
 * @param content - The content to analyze
 * @returns The detected format: 'html', 'markdown', 'rtf', or 'text' (for empty content)
 */
export function detectFormat(content: string): Format {
  const trimmed = content.trim();

  // Empty content is treated as plain text
  if (trimmed === '') {
    return 'text';
  }

  // Check for RTF magic bytes first
  if (isRtf(trimmed)) {
    return 'rtf';
  }

  // Use is-html to detect HTML content
  // is-html checks for standard HTML tags and returns false for custom/unknown tags
  if (isHtml(trimmed)) {
    return 'html';
  }

  // Default to markdown for non-HTML text content
  return 'markdown';
}
