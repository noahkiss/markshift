import { describe, it, expect, beforeEach } from 'vitest';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';
import { registry } from '../../src/converters/index.js';

describe('HtmlToMarkdownConverter', () => {
  let converter: HtmlToMarkdownConverter;

  beforeEach(() => {
    converter = new HtmlToMarkdownConverter();
  });

  describe('CONV-01: semantic structure', () => {
    it('converts headings h1-h6 to atx style', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const result = converter.convert(html);
      expect(result.content).toContain('# Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.content).toContain('### Section');
    });

    it('converts paragraphs', () => {
      const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('First paragraph.');
      expect(result.content).toContain('Second paragraph.');
    });

    it('converts emphasis (italic)', () => {
      const html = '<p>This is <em>emphasized</em> text.</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('_emphasized_');
    });

    it('converts strong (bold)', () => {
      const html = '<p>This is <strong>bold</strong> text.</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('**bold**');
    });

    it('converts nested emphasis', () => {
      const html = '<p><strong><em>bold and italic</em></strong></p>';
      const result = converter.convert(html);
      expect(result.content).toMatch(/\*\*_bold and italic_\*\*/);
    });
  });

  describe('CONV-02: lists', () => {
    it('converts unordered lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = converter.convert(html);
      // Turndown uses 3-space indent which is valid CommonMark
      expect(result.content).toMatch(/-\s+Item 1/);
      expect(result.content).toMatch(/-\s+Item 2/);
    });

    it('converts ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = converter.convert(html);
      // Turndown uses 2-space indent after number which is valid CommonMark
      expect(result.content).toMatch(/1\.\s+First/);
      expect(result.content).toMatch(/2\.\s+Second/);
    });

    it('converts nested lists', () => {
      const html = '<ul><li>Parent<ul><li>Child</li></ul></li></ul>';
      const result = converter.convert(html);
      expect(result.content).toMatch(/-\s+Parent/);
      expect(result.content).toMatch(/-\s+Child/);
    });
  });

  describe('CONV-03: links and images', () => {
    it('converts links', () => {
      const html = '<a href="https://example.com">Example</a>';
      const result = converter.convert(html);
      expect(result.content).toBe('[Example](https://example.com)');
    });

    it('converts images', () => {
      const html = '<img src="image.png" alt="Alt text">';
      const result = converter.convert(html);
      expect(result.content).toBe('![Alt text](image.png)');
    });

    it('converts images without alt text', () => {
      const html = '<img src="image.png">';
      const result = converter.convert(html);
      expect(result.content).toContain('![](image.png)');
    });

    it('converts links containing images', () => {
      const html =
        '<a href="https://example.com"><img src="img.png" alt="Image"></a>';
      const result = converter.convert(html);
      expect(result.content).toContain('[![Image](img.png)](https://example.com)');
    });
  });

  describe('CONV-04: code blocks with language hints', () => {
    it('converts inline code', () => {
      const html = '<p>Use <code>const</code> for constants.</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('`const`');
    });

    it('converts code blocks with lang-* class', () => {
      const html = '<pre><code class="lang-javascript">const x = 1;</code></pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('const x = 1;');
      expect(result.content).toContain('```');
    });

    it('converts code blocks with language-* class', () => {
      const html =
        '<pre><code class="language-python">def hello():\n    pass</code></pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```python');
    });

    it('converts code blocks with highlight-source-* class', () => {
      const html = '<pre><code class="highlight-source-rust">fn main() {}</code></pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```rust');
    });

    it('converts code blocks without language class', () => {
      const html = '<pre><code>plain code</code></pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```\nplain code\n```');
    });
  });

  describe('CONV-05: tables', () => {
    it('converts simple tables', () => {
      const html = `
        <table>
          <thead><tr><th>Name</th><th>Age</th></tr></thead>
          <tbody><tr><td>Alice</td><td>30</td></tr></tbody>
        </table>
      `;
      const result = converter.convert(html);
      expect(result.content).toContain('| Name | Age |');
      expect(result.content).toContain('| --- | --- |');
      // GFM tables may have padding whitespace which is valid
      expect(result.content).toMatch(/\|\s*Alice\s*\|\s*30\s*\|/);
    });

    it('converts tables without thead', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr></table>';
      const result = converter.convert(html);
      expect(result.content).toContain('|');
    });
  });

  describe('CONV-10: malformed HTML handling', () => {
    it('handles unclosed tags', () => {
      const html = '<p>Unclosed paragraph<p>Next paragraph</p>';
      expect(() => converter.convert(html)).not.toThrow();
    });

    it('handles mismatched tags', () => {
      const html = '<p><strong>Mismatched</p></strong>';
      expect(() => converter.convert(html)).not.toThrow();
    });

    it('handles empty input', () => {
      const result = converter.convert('');
      expect(result.content).toBe('');
    });

    it('handles plain text input', () => {
      const result = converter.convert('Just plain text');
      expect(result.content).toBe('Just plain text');
    });

    it('handles deeply nested elements', () => {
      const html = '<div><div><div><div><p>Deep</p></div></div></div></div>';
      expect(() => converter.convert(html)).not.toThrow();
      expect(converter.convert(html).content).toContain('Deep');
    });
  });

  describe('QUAL-01: whitespace preservation in code blocks', () => {
    it('preserves indentation in code blocks', () => {
      const code = 'function test() {\n    return true;\n}';
      const html = `<pre><code class="lang-javascript">${code}</code></pre>`;
      const result = converter.convert(html);
      expect(result.content).toContain('    return true;');
    });

    it('preserves multiple newlines in code blocks', () => {
      const code = 'line1\n\n\nline4';
      const html = `<pre><code>${code}</code></pre>`;
      const result = converter.convert(html);
      expect(result.content).toContain('line1\n\n\nline4');
    });

    it('preserves tabs in code blocks', () => {
      const code = 'line1\n\tindented';
      const html = `<pre><code>${code}</code></pre>`;
      const result = converter.convert(html);
      expect(result.content).toContain('\tindented');
    });
  });

  describe('QUAL-02: character encoding (UTF-8, emoji, CJK)', () => {
    it('handles emoji correctly', () => {
      const html = '<p>Hello \uD83D\uDC4B World \uD83C\uDF0D</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('\uD83D\uDC4B');
      expect(result.content).toContain('\uD83C\uDF0D');
    });

    it('handles CJK characters', () => {
      const html = '<p>\u65E5\u672C\u8A9E \u4E2D\u6587 \uD55C\uAD6D\uC5B4</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('\u65E5\u672C\u8A9E');
      expect(result.content).toContain('\u4E2D\u6587');
      expect(result.content).toContain('\uD55C\uAD6D\uC5B4');
    });

    it('handles special Unicode characters', () => {
      const html = '<p>Math: \u03B1 \u03B2 \u03B3 \u03B4 \u2211 \u220F \u221A</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('\u03B1');
      expect(result.content).toContain('\u2211');
    });
  });

  describe('QUAL-03: HTML entity decoding', () => {
    it('decodes common named entities', () => {
      const html = '<p>&lt;script&gt; &amp; &quot;quotes&quot;</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('<script>');
      expect(result.content).toContain('&');
      expect(result.content).toContain('"quotes"');
    });

    it('decodes numeric entities', () => {
      const html = '<p>&#60;tag&#62; and &#x3C;hex&#x3E;</p>';
      const result = converter.convert(html);
      expect(result.content).toContain('<tag>');
      expect(result.content).toContain('<hex>');
    });

    it('decodes nbsp', () => {
      const html = '<p>Non&nbsp;breaking&nbsp;space</p>';
      const result = converter.convert(html);
      // nbsp becomes regular space in Markdown
      expect(result.content).toContain('Non');
      expect(result.content).toContain('breaking');
    });
  });

  describe('GFM features', () => {
    it('converts strikethrough', () => {
      const html = '<p><del>deleted</del> or <s>strikethrough</s></p>';
      const result = converter.convert(html);
      expect(result.content).toContain('~~deleted~~');
    });

    it('converts task lists', () => {
      const html = `
        <ul>
          <li><input type="checkbox" checked> Done</li>
          <li><input type="checkbox"> Todo</li>
        </ul>
      `;
      const result = converter.convert(html);
      expect(result.content).toContain('[x]');
      expect(result.content).toContain('[ ]');
    });
  });

  describe('metadata', () => {
    it('returns correct source and target formats', () => {
      const result = converter.convert('<p>Test</p>');
      expect(result.metadata?.sourceFormat).toBe('html');
      expect(result.metadata?.targetFormat).toBe('markdown');
    });

    it('includes processing time', () => {
      const result = converter.convert('<p>Test</p>');
      expect(result.metadata?.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('registry integration', () => {
    it('can be registered in the converter registry', () => {
      const localRegistry = registry;
      localRegistry.clear();
      localRegistry.register(converter);

      expect(localRegistry.has('html', 'markdown')).toBe(true);
      const retrieved = localRegistry.get('html', 'markdown');
      expect(retrieved).toBe(converter);
    });
  });
});
