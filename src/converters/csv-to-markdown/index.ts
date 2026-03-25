/**
 * CSV/TSV to Markdown table converter
 *
 * Handles both comma-separated and tab-separated input.
 * First row is treated as the header.
 *
 * @packageDocumentation
 */
import type { ConvertOptions, ConvertResult } from '../../types/index.js';

/**
 * Parse a single CSV/TSV line into fields, handling quoted values
 */
function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Detect whether content is TSV or CSV
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] ?? '';
  if (firstLine.includes('\t')) return '\t';
  return ',';
}

export class CsvToMarkdownConverter {
  readonly sourceFormat = 'csv' as const;
  readonly targetFormat = 'markdown' as const;

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    const delimiter = detectDelimiter(input);
    const lines = input.trim().split('\n').filter((l) => l.trim() !== '');

    if (lines.length === 0) {
      return { content: '' };
    }

    const rows = lines.map((line) => parseLine(line, delimiter));

    // Normalize column count to the maximum
    const maxCols = Math.max(...rows.map((r) => r.length));
    const normalized = rows.map((r) => {
      while (r.length < maxCols) r.push('');
      return r;
    });

    const header = normalized[0]!;
    const dataRows = normalized.slice(1);

    // Escape pipe characters in cell content
    const escapeCell = (cell: string) => cell.replace(/\|/g, '\\|');

    // Build markdown table
    const headerRow = '| ' + header.map(escapeCell).join(' | ') + ' |';
    const separatorRow = '| ' + header.map(() => '---').join(' | ') + ' |';
    const bodyRows = dataRows.map((row) => '| ' + row.map(escapeCell).join(' | ') + ' |');

    const content = [headerRow, separatorRow, ...bodyRows].join('\n') + '\n';

    return { content };
  }
}
