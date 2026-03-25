/**
 * Tests for JSON → Markdown table converter
 */
import { describe, it, expect } from 'vitest';
import { JsonToMarkdownConverter } from '../../src/converters/json-to-markdown/index.js';

describe('JsonToMarkdownConverter', () => {
  const converter = new JsonToMarkdownConverter();

  it('converts array of objects to markdown table', () => {
    const json = JSON.stringify([
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' },
    ]);
    const result = converter.convert(json);

    expect(result.content).toBe(
      '| name | age | city |\n' +
        '| --- | --- | --- |\n' +
        '| Alice | 30 | NYC |\n' +
        '| Bob | 25 | LA |\n'
    );
  });

  it('handles objects with different keys (union of all keys)', () => {
    const json = JSON.stringify([
      { a: 1, b: 2 },
      { b: 3, c: 4 },
    ]);
    const result = converter.convert(json);

    expect(result.content).toContain('| a | b | c |');
    expect(result.content).toContain('| 1 | 2 |  |');
    expect(result.content).toContain('|  | 3 | 4 |');
  });

  it('converts single object to key/value table', () => {
    const json = JSON.stringify({ name: 'Alice', age: 30 });
    const result = converter.convert(json);

    expect(result.content).toBe(
      '| Key | Value |\n' +
        '| --- | --- |\n' +
        '| name | Alice |\n' +
        '| age | 30 |\n'
    );
  });

  it('converts array of primitives to single-column table', () => {
    const json = JSON.stringify([1, 2, 3]);
    const result = converter.convert(json);

    expect(result.content).toContain('| Value |');
    expect(result.content).toContain('| 1 |');
  });

  it('handles null and undefined values', () => {
    const json = JSON.stringify([{ a: null, b: 'ok' }]);
    const result = converter.convert(json);

    expect(result.content).toContain('|  | ok |');
  });

  it('handles nested objects by stringifying', () => {
    const json = JSON.stringify([{ name: 'Alice', meta: { x: 1 } }]);
    const result = converter.convert(json);

    expect(result.content).toContain('{"x":1}');
  });

  it('escapes pipe characters in values', () => {
    const json = JSON.stringify([{ formula: 'a|b' }]);
    const result = converter.convert(json);

    expect(result.content).toContain('a\\|b');
  });

  it('throws on invalid JSON', () => {
    expect(() => converter.convert('not json')).toThrow('Invalid JSON');
  });
});
