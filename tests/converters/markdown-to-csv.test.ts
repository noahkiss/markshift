/**
 * Tests for Markdown table to CSV converter
 */
import { describe, it, expect } from 'vitest';
import { MarkdownToCsvConverter } from '../../src/converters/markdown-to-csv/index.js';

describe('MarkdownToCsvConverter', () => {
  const converter = new MarkdownToCsvConverter();

  it('converts simple markdown table to CSV', () => {
    const md =
      '| Name | Age | City |\n' +
      '| --- | --- | --- |\n' +
      '| Alice | 30 | NYC |\n' +
      '| Bob | 25 | LA |\n';
    const result = converter.convert(md);

    expect(result.content).toBe('Name,Age,City\nAlice,30,NYC\nBob,25,LA\n');
  });

  it('quotes fields that contain commas', () => {
    const md =
      '| Name | Location |\n' +
      '| --- | --- |\n' +
      '| Alice | New York, NY |\n';
    const result = converter.convert(md);

    expect(result.content).toBe('Name,Location\nAlice,"New York, NY"\n');
  });

  it('escapes quotes in fields', () => {
    const md =
      '| Name | Quote |\n' +
      '| --- | --- |\n' +
      '| Alice | She said "hello" |\n';
    const result = converter.convert(md);

    expect(result.content).toContain('"She said ""hello"""');
  });

  it('extracts first table from mixed markdown content', () => {
    const md =
      '# My Document\n\nSome text before.\n\n' +
      '| A | B |\n| --- | --- |\n| 1 | 2 |\n\n' +
      'Some text after.\n';
    const result = converter.convert(md);

    expect(result.content).toBe('A,B\n1,2\n');
  });

  it('handles alignment markers in separator row', () => {
    const md =
      '| Left | Center | Right |\n' +
      '| :--- | :---: | ---: |\n' +
      '| a | b | c |\n';
    const result = converter.convert(md);

    expect(result.content).toBe('Left,Center,Right\na,b,c\n');
  });

  it('throws error when no table found', () => {
    expect(() => converter.convert('# Just a heading\n\nSome text.')).toThrow(
      'No markdown table found'
    );
  });

  it('handles single row table (header only)', () => {
    const md = '| A | B |\n| --- | --- |\n';
    const result = converter.convert(md);

    expect(result.content).toBe('A,B\n');
  });
});
