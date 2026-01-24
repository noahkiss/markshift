/**
 * Format detection utilities for auto-detecting content type
 *
 * @packageDocumentation
 */
import isHtml from 'is-html';
import type { Format } from '../../types/index.js';

/**
 * Detect the format of the given content
 *
 * Uses the is-html library to detect HTML content. Falls back to 'markdown'
 * for non-HTML text content. RTF detection is not implemented here (Phase 7 scope).
 *
 * @param content - The content to analyze
 * @returns The detected format: 'html', 'markdown', or 'text' (for empty content)
 */
export function detectFormat(content: string): Format {
  const trimmed = content.trim();

  // Empty content is treated as plain text
  if (trimmed === '') {
    return 'text';
  }

  // Use is-html to detect HTML content
  // is-html checks for standard HTML tags and returns false for custom/unknown tags
  if (isHtml(trimmed)) {
    return 'html';
  }

  // Default to markdown for non-HTML text content
  return 'markdown';
}
