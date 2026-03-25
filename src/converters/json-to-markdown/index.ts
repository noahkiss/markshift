/**
 * JSON array → Markdown table converter
 *
 * Converts an array of objects to a GFM markdown table.
 * Keys become headers, values become rows.
 *
 * @packageDocumentation
 */
import type { ConvertOptions, ConvertResult } from '../../types/index.js';

/**
 * Escape pipe characters and normalize cell content for markdown tables
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return str.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export class JsonToMarkdownConverter {
  readonly sourceFormat = 'json' as const;
  readonly targetFormat = 'markdown' as const;

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Handle array of objects → table
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
      return { content: this.arrayToTable(parsed as Record<string, unknown>[]) };
    }

    // Handle single object → key/value table
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { content: this.objectToTable(parsed as Record<string, unknown>) };
    }

    // For arrays of primitives, make a single-column table
    if (Array.isArray(parsed)) {
      const header = '| Value |';
      const sep = '| --- |';
      const rows = parsed.map((v) => `| ${escapeCell(v)} |`);
      return { content: [header, sep, ...rows].join('\n') + '\n' };
    }

    // Scalar — just stringify
    return { content: String(parsed) + '\n' };
  }

  private arrayToTable(items: Record<string, unknown>[]): string {
    // Collect all unique keys across all objects
    const keys = [...new Set(items.flatMap((item) => Object.keys(item)))];

    const header = '| ' + keys.join(' | ') + ' |';
    const sep = '| ' + keys.map(() => '---').join(' | ') + ' |';
    const rows = items.map(
      (item) => '| ' + keys.map((k) => escapeCell(item[k])).join(' | ') + ' |'
    );

    return [header, sep, ...rows].join('\n') + '\n';
  }

  private objectToTable(obj: Record<string, unknown>): string {
    const header = '| Key | Value |';
    const sep = '| --- | --- |';
    const rows = Object.entries(obj).map(
      ([k, v]) => `| ${escapeCell(k)} | ${escapeCell(v)} |`
    );

    return [header, sep, ...rows].join('\n') + '\n';
  }
}
