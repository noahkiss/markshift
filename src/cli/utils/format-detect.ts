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
 * Check if content looks like CSV or TSV (tabular data)
 *
 * Requires at least 2 lines with consistent delimiter counts.
 * TSV is checked first (tab-separated), then CSV (comma-separated).
 */
function isCsv(content: string): boolean {
  const lines = content.trim().split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) return false;

  // Check for TSV (tabs) - common from Excel clipboard
  const tabCounts = lines.map((l) => (l.match(/\t/g) || []).length);
  if (tabCounts[0]! > 0 && tabCounts.every((c) => c === tabCounts[0])) return true;

  // Check for CSV (commas) - count unquoted commas per line
  const commaCounts = lines.map((l) => countUnquotedDelimiters(l, ','));
  if (commaCounts[0]! > 0 && commaCounts.every((c) => c === commaCounts[0])) return true;

  return false;
}

/**
 * Count delimiters that aren't inside quoted fields
 */
function countUnquotedDelimiters(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      count++;
    }
  }
  return count;
}

/**
 * Detect the format of the given content
 *
 * Uses magic bytes to detect RTF, is-html library to detect HTML content,
 * structural analysis for CSV/TSV.
 * Falls back to 'markdown' for non-HTML text content.
 *
 * @param content - The content to analyze
 * @returns The detected format: 'html', 'markdown', 'rtf', 'csv', or 'text' (for empty content)
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
  if (isHtml(trimmed)) {
    return 'html';
  }

  // Check for JSON (arrays/objects that could be tabular data)
  if (isJson(trimmed)) {
    return 'json';
  }

  // Check for CSV/TSV before falling back to markdown
  if (isCsv(trimmed)) {
    return 'csv';
  }

  // Default to markdown for non-HTML text content
  return 'markdown';
}

/**
 * Check if content looks like a JSON array or object
 */
function isJson(content: string): boolean {
  if (!(content.startsWith('[') || content.startsWith('{'))) return false;
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}
