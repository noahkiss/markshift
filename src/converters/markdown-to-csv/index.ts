/**
 * Markdown table to CSV converter
 *
 * Extracts the first GFM table from markdown content and outputs CSV.
 *
 * @packageDocumentation
 */
import type { ConvertOptions, ConvertResult } from '../../types/index.js';

/**
 * Escape a field for CSV output - quote if it contains commas, quotes, or newlines
 */
function csvEscape(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

/**
 * Parse a markdown table row into cells
 */
function parseTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * Check if a line is a GFM table separator (e.g. | --- | --- |)
 */
function isSeparatorRow(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line.trim());
}

export class MarkdownToCsvConverter {
  readonly sourceFormat = 'markdown' as const;
  readonly targetFormat = 'csv' as const;

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    const lines = input.split('\n');

    // Find the first table in the markdown
    const tableLines: string[] = [];
    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (!isSeparatorRow(trimmed)) {
          tableLines.push(trimmed);
        }
        inTable = true;
      } else if (inTable) {
        // End of table
        break;
      }
    }

    if (tableLines.length === 0) {
      throw new Error('No markdown table found in input');
    }

    const rows = tableLines.map(parseTableRow);
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';

    return { content: csv };
  }
}
