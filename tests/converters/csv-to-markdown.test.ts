/**
 * Tests for CSV/TSV to Markdown table converter
 */
import { describe, it, expect } from 'vitest';
import { CsvToMarkdownConverter } from '../../src/converters/csv-to-markdown/index.js';

describe('CsvToMarkdownConverter', () => {
  const converter = new CsvToMarkdownConverter();

  it('converts simple CSV to markdown table', () => {
    const csv = 'Name,Age,City\nAlice,30,NYC\nBob,25,LA\n';
    const result = converter.convert(csv);

    expect(result.content).toBe(
      '| Name | Age | City |\n' +
      '| --- | --- | --- |\n' +
      '| Alice | 30 | NYC |\n' +
      '| Bob | 25 | LA |\n'
    );
  });

  it('converts TSV (tab-separated) to markdown table', () => {
    const tsv = 'Name\tAge\tCity\nAlice\t30\tNYC\nBob\t25\tLA\n';
    const result = converter.convert(tsv);

    expect(result.content).toBe(
      '| Name | Age | City |\n' +
      '| --- | --- | --- |\n' +
      '| Alice | 30 | NYC |\n' +
      '| Bob | 25 | LA |\n'
    );
  });

  it('handles quoted CSV fields with commas', () => {
    const csv = 'Name,Location\n"Smith, John","New York, NY"\n';
    const result = converter.convert(csv);

    expect(result.content).toBe(
      '| Name | Location |\n' +
      '| --- | --- |\n' +
      '| Smith, John | New York, NY |\n'
    );
  });

  it('handles quoted fields with escaped quotes', () => {
    const csv = 'Name,Quote\nAlice,"She said ""hello"""\n';
    const result = converter.convert(csv);

    expect(result.content).toContain('She said "hello"');
  });

  it('escapes pipe characters in cell values', () => {
    const csv = 'Name,Formula\nAlice,a|b\n';
    const result = converter.convert(csv);

    expect(result.content).toContain('a\\|b');
  });

  it('handles empty input', () => {
    const result = converter.convert('');
    expect(result.content).toBe('');
  });

  it('handles single header row with no data', () => {
    const csv = 'Name,Age\n';
    const result = converter.convert(csv);

    expect(result.content).toBe(
      '| Name | Age |\n' +
      '| --- | --- |\n'
    );
  });

  it('normalizes uneven column counts', () => {
    const csv = 'A,B,C\n1,2\n3,4,5\n';
    const result = converter.convert(csv);

    // Row with 2 cols should get padded to 3
    expect(result.content).toContain('| 1 | 2 |  |');
  });

  it('trims whitespace from cells', () => {
    const csv = ' Name , Age \n Alice , 30 \n';
    const result = converter.convert(csv);

    expect(result.content).toContain('| Name | Age |');
    expect(result.content).toContain('| Alice | 30 |');
  });
});
