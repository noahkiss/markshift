/**
 * Tests for strip-formatting converter
 */
import { describe, it, expect } from 'vitest';
import { StripFormattingConverter } from '../../src/converters/strip-formatting/index.js';

describe('StripFormattingConverter', () => {
  const converter = new StripFormattingConverter();

  it('strips HTML tags', () => {
    const result = converter.convert('<p>Hello <strong>world</strong></p>');
    expect(result.content.trim()).toBe('Hello world');
  });

  it('decodes HTML entities', () => {
    const result = converter.convert('<p>A &amp; B &lt; C &gt; D</p>');
    expect(result.content.trim()).toBe('A & B < C > D');
  });

  it('removes script and style blocks', () => {
    const result = converter.convert(
      '<p>Hello</p><script>alert("x")</script><style>body{}</style><p>World</p>'
    );
    expect(result.content.trim()).toBe('Hello\nWorld');
  });

  it('converts block elements to newlines', () => {
    const result = converter.convert('<h1>Title</h1><p>Para 1</p><p>Para 2</p>');
    expect(result.content).toContain('Title\n');
    expect(result.content).toContain('Para 1\n');
  });

  it('strips markdown bold/italic', () => {
    const result = converter.convert('**bold** and *italic* and ***both***');
    expect(result.content.trim()).toBe('bold and italic and both');
  });

  it('strips markdown links, keeps text', () => {
    const result = converter.convert('[Click here](https://example.com)');
    expect(result.content.trim()).toBe('Click here');
  });

  it('strips markdown headings', () => {
    const result = converter.convert('## My Heading\n\nSome text');
    expect(result.content.trim()).toBe('My Heading\n\nSome text');
  });

  it('strips markdown list markers', () => {
    const result = converter.convert('- item 1\n- item 2\n1. item 3');
    expect(result.content).toContain('item 1');
    expect(result.content).toContain('item 2');
    expect(result.content).toContain('item 3');
    expect(result.content).not.toContain('- ');
    expect(result.content).not.toContain('1. ');
  });

  it('preserves table cell content', () => {
    const result = converter.convert('<table><tr><td>A</td><td>B</td></tr></table>');
    expect(result.content).toContain('A');
    expect(result.content).toContain('B');
  });
});
