/**
 * Tests for semantic/ARIA table conversion
 */
import { describe, test, expect } from 'vitest';
import { HtmlToMarkdownConverter } from '../../../src/converters/html-to-markdown/index.js';

describe('semantic table rule', () => {
  const converter = new HtmlToMarkdownConverter();

  test('converts role="table" div to markdown table', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="columnheader">Name</div>
          <div role="columnheader">Age</div>
        </div>
        <div role="row">
          <div role="cell">Alice</div>
          <div role="cell">30</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    expect(result.content).toContain('| Name | Age |');
    expect(result.content).toContain('| --- | --- |');
    expect(result.content).toContain('| Alice | 30 |');
  });

  test('converts role="row" and role="cell" structure', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="cell">Header 1</div>
          <div role="cell">Header 2</div>
        </div>
        <div role="row">
          <div role="cell">Data 1</div>
          <div role="cell">Data 2</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    expect(result.content).toContain('| Header 1 | Header 2 |');
    expect(result.content).toContain('| Data 1 | Data 2 |');
  });

  test('handles role="columnheader" for header cells', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="columnheader">Product</div>
          <div role="columnheader">Price</div>
          <div role="columnheader">Qty</div>
        </div>
        <div role="row">
          <div role="cell">Widget</div>
          <div role="cell">$10</div>
          <div role="cell">5</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    expect(result.content).toContain('| Product | Price | Qty |');
    expect(result.content).toContain('| --- | --- | --- |');
    expect(result.content).toContain('| Widget | $10 | 5 |');
  });

  test('ignores divs without table role (no false positives)', () => {
    const html = `
      <div class="container">
        <div class="row">
          <div class="col">Item 1</div>
          <div class="col">Item 2</div>
        </div>
        <div class="row">
          <div class="col">Item 3</div>
          <div class="col">Item 4</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    // Should NOT contain table syntax
    expect(result.content).not.toContain('| --- |');
    // Should contain the text content
    expect(result.content).toContain('Item 1');
  });

  test('ignores single-row structures (minimum 2 rows required)', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="cell">Only one row</div>
          <div role="cell">No data rows</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    // Should NOT contain table syntax (only 1 row)
    expect(result.content).not.toContain('| --- |');
    // Should still contain the text
    expect(result.content).toContain('Only one row');
  });

  test('preserves cell text content', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="columnheader">Column A</div>
          <div role="columnheader">Column B</div>
        </div>
        <div role="row">
          <div role="cell">Special content: 123</div>
          <div role="cell">More data here!</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    expect(result.content).toContain('Special content: 123');
    expect(result.content).toContain('More data here!');
  });

  test('handles data-table/data-row/data-cell attributes', () => {
    const html = `
      <div data-table>
        <div data-row>
          <div data-cell>H1</div>
          <div data-cell>H2</div>
        </div>
        <div data-row>
          <div data-cell>V1</div>
          <div data-cell>V2</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    expect(result.content).toContain('| H1 | H2 |');
    expect(result.content).toContain('| V1 | V2 |');
  });

  test('handles multiple data rows', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="columnheader">ID</div>
          <div role="columnheader">Name</div>
        </div>
        <div role="row">
          <div role="cell">1</div>
          <div role="cell">Alice</div>
        </div>
        <div role="row">
          <div role="cell">2</div>
          <div role="cell">Bob</div>
        </div>
        <div role="row">
          <div role="cell">3</div>
          <div role="cell">Charlie</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    expect(result.content).toContain('| ID | Name |');
    expect(result.content).toContain('| 1 | Alice |');
    expect(result.content).toContain('| 2 | Bob |');
    expect(result.content).toContain('| 3 | Charlie |');
  });

  test('escapes pipe characters in cell content', () => {
    const html = `
      <div role="table">
        <div role="row">
          <div role="columnheader">Pattern</div>
          <div role="columnheader">Meaning</div>
        </div>
        <div role="row">
          <div role="cell">a | b</div>
          <div role="cell">a or b</div>
        </div>
      </div>
    `;

    const result = converter.convert(html);

    // Pipe should be escaped
    expect(result.content).toContain('a \\| b');
    expect(result.content).toContain('a or b');
  });
});
