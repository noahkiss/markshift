import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownToHtmlConverter } from '../../src/converters/markdown-to-html/index.js';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';
import { registry } from '../../src/converters/index.js';

describe('MarkdownToHtmlConverter', () => {
  let converter: MarkdownToHtmlConverter;

  beforeEach(() => {
    converter = new MarkdownToHtmlConverter();
  });

  describe('basic conversion', () => {
    it('converts headings h1-h6', () => {
      const md = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6';
      const result = converter.convert(md);
      expect(result.content).toContain('<h1>H1</h1>');
      expect(result.content).toContain('<h2>H2</h2>');
      expect(result.content).toContain('<h3>H3</h3>');
      expect(result.content).toContain('<h4>H4</h4>');
      expect(result.content).toContain('<h5>H5</h5>');
      expect(result.content).toContain('<h6>H6</h6>');
    });

    it('converts paragraphs', () => {
      const md = 'First paragraph.\n\nSecond paragraph.';
      const result = converter.convert(md);
      expect(result.content).toContain('<p>First paragraph.</p>');
      expect(result.content).toContain('<p>Second paragraph.</p>');
    });

    it('converts bold text', () => {
      const md = 'This is **bold** text.';
      const result = converter.convert(md);
      expect(result.content).toContain('<strong>bold</strong>');
    });

    it('converts italic text with asterisks', () => {
      const md = 'This is *italic* text.';
      const result = converter.convert(md);
      expect(result.content).toContain('<em>italic</em>');
    });

    it('converts italic text with underscores', () => {
      const md = 'This is _italic_ text.';
      const result = converter.convert(md);
      expect(result.content).toContain('<em>italic</em>');
    });

    it('converts links', () => {
      const md = '[Example](https://example.com)';
      const result = converter.convert(md);
      expect(result.content).toContain('<a href="https://example.com">Example</a>');
    });

    it('converts images', () => {
      const md = '![Alt text](image.png)';
      const result = converter.convert(md);
      expect(result.content).toContain('<img src="image.png" alt="Alt text"');
    });

    it('converts blockquotes', () => {
      const md = '> This is a quote';
      const result = converter.convert(md);
      expect(result.content).toContain('<blockquote>');
      expect(result.content).toContain('This is a quote');
    });

    it('converts horizontal rules', () => {
      const md = '---';
      const result = converter.convert(md);
      expect(result.content).toContain('<hr');
    });
  });

  describe('GFM features', () => {
    it('converts tables', () => {
      const md = `| Name | Age |
| --- | --- |
| Alice | 30 |
| Bob | 25 |`;
      const result = converter.convert(md);
      expect(result.content).toContain('<table>');
      expect(result.content).toContain('<thead>');
      expect(result.content).toContain('<tbody>');
      expect(result.content).toContain('<th>Name</th>');
      expect(result.content).toContain('<th>Age</th>');
      expect(result.content).toContain('<td>Alice</td>');
      expect(result.content).toContain('<td>30</td>');
    });

    it('converts strikethrough', () => {
      const md = '~~deleted~~';
      const result = converter.convert(md);
      expect(result.content).toContain('<del>deleted</del>');
    });

    it('converts task lists with checked items', () => {
      const md = '- [x] Done task';
      const result = converter.convert(md);
      expect(result.content).toContain('<input');
      expect(result.content).toContain('checked');
      expect(result.content).toContain('type="checkbox"');
    });

    it('converts task lists with unchecked items', () => {
      const md = '- [ ] Todo task';
      const result = converter.convert(md);
      expect(result.content).toContain('<input');
      expect(result.content).toContain('type="checkbox"');
      expect(result.content).not.toMatch(/<input[^>]*checked[^>]*>.*Todo task/);
    });

    it('converts autolinks', () => {
      const md = 'Visit https://example.com for more.';
      const result = converter.convert(md);
      expect(result.content).toContain('<a href="https://example.com">');
    });
  });

  describe('code blocks', () => {
    it('converts fenced code blocks without language', () => {
      const md = '```\nconst x = 1;\n```';
      const result = converter.convert(md);
      expect(result.content).toContain('<pre>');
      expect(result.content).toContain('<code>');
      expect(result.content).toContain('const x = 1;');
    });

    it('converts fenced code blocks with language class', () => {
      const md = '```javascript\nconst x = 1;\n```';
      const result = converter.convert(md);
      expect(result.content).toContain('<code class="language-javascript">');
      expect(result.content).toContain('const x = 1;');
    });

    it('converts fenced code blocks with various languages', () => {
      const languages = ['python', 'typescript', 'rust', 'go', 'java'];
      for (const lang of languages) {
        const md = `\`\`\`${lang}\ncode\n\`\`\``;
        const result = converter.convert(md);
        expect(result.content).toContain(`class="language-${lang}"`);
      }
    });

    it('converts inline code', () => {
      const md = 'Use `const` for constants.';
      const result = converter.convert(md);
      expect(result.content).toContain('<code>const</code>');
    });

    it('preserves whitespace in code blocks', () => {
      const md = '```\nline1\n    indented\n```';
      const result = converter.convert(md);
      expect(result.content).toContain('    indented');
    });
  });

  describe('lists', () => {
    it('converts unordered lists', () => {
      const md = '- Item 1\n- Item 2\n- Item 3';
      const result = converter.convert(md);
      expect(result.content).toContain('<ul>');
      expect(result.content).toContain('<li>Item 1</li>');
      expect(result.content).toContain('<li>Item 2</li>');
      expect(result.content).toContain('<li>Item 3</li>');
      expect(result.content).toContain('</ul>');
    });

    it('converts ordered lists', () => {
      const md = '1. First\n2. Second\n3. Third';
      const result = converter.convert(md);
      expect(result.content).toContain('<ol>');
      expect(result.content).toContain('<li>First</li>');
      expect(result.content).toContain('<li>Second</li>');
      expect(result.content).toContain('<li>Third</li>');
      expect(result.content).toContain('</ol>');
    });

    it('converts nested lists', () => {
      const md = '- Parent\n  - Child\n  - Child 2';
      const result = converter.convert(md);
      expect(result.content).toContain('<ul>');
      expect(result.content).toContain('Parent');
      expect(result.content).toContain('Child');
      // Should have nested ul
      expect(result.content.match(/<ul>/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('converts mixed nested lists', () => {
      const md = '1. Ordered\n   - Unordered child';
      const result = converter.convert(md);
      expect(result.content).toContain('<ol>');
      expect(result.content).toContain('<ul>');
    });
  });

  describe('round-trip semantic preservation', () => {
    let htmlToMd: HtmlToMarkdownConverter;

    beforeEach(() => {
      htmlToMd = new HtmlToMarkdownConverter();
    });

    it('preserves headings through round-trip', () => {
      const originalHtml = '<h1>Title</h1><h2>Subtitle</h2>';
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<h1>');
      expect(finalHtml).toContain('Title');
      expect(finalHtml).toContain('<h2>');
      expect(finalHtml).toContain('Subtitle');
    });

    it('preserves bold/italic through round-trip', () => {
      const originalHtml = '<p><strong>bold</strong> and <em>italic</em></p>';
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<strong>bold</strong>');
      expect(finalHtml).toContain('<em>italic</em>');
    });

    it('preserves links through round-trip', () => {
      const originalHtml = '<a href="https://example.com">Example</a>';
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<a href="https://example.com">');
      expect(finalHtml).toContain('Example');
    });

    it('preserves unordered lists through round-trip', () => {
      const originalHtml = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<ul>');
      expect(finalHtml).toContain('<li>');
      expect(finalHtml).toContain('Item 1');
      expect(finalHtml).toContain('Item 2');
    });

    it('preserves ordered lists through round-trip', () => {
      const originalHtml = '<ol><li>First</li><li>Second</li></ol>';
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<ol>');
      expect(finalHtml).toContain('<li>');
      expect(finalHtml).toContain('First');
      expect(finalHtml).toContain('Second');
    });

    it('preserves code blocks with language through round-trip', () => {
      const originalHtml = '<pre><code class="language-javascript">const x = 1;</code></pre>';
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<pre>');
      expect(finalHtml).toContain('<code');
      expect(finalHtml).toContain('language-javascript');
      expect(finalHtml).toContain('const x = 1;');
    });

    it('preserves tables through round-trip', () => {
      const originalHtml = `
        <table>
          <thead><tr><th>Name</th><th>Age</th></tr></thead>
          <tbody><tr><td>Alice</td><td>30</td></tr></tbody>
        </table>
      `;
      const markdown = htmlToMd.convert(originalHtml).content;
      const finalHtml = converter.convert(markdown).content;

      expect(finalHtml).toContain('<table>');
      expect(finalHtml).toContain('<th>Name</th>');
      expect(finalHtml).toContain('<td>Alice</td>');
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      const result = converter.convert('');
      expect(result.content).toBe('');
    });

    it('handles whitespace-only input', () => {
      const result = converter.convert('   \n\n   ');
      // marked may return empty or whitespace
      expect(result.content.trim()).toBe('');
    });

    it('handles plain text without markdown', () => {
      const result = converter.convert('Just plain text');
      expect(result.content).toContain('Just plain text');
    });

    it('handles special characters', () => {
      const md = '< > & " \'';
      const result = converter.convert(md);
      // HTML entities should be escaped
      expect(result.content).toContain('&lt;');
      expect(result.content).toContain('&gt;');
      expect(result.content).toContain('&amp;');
    });

    it('handles unicode characters', () => {
      const md = '# Hello World';
      const result = converter.convert(md);
      expect(result.content).toContain('Hello');
      expect(result.content).toContain('World');
    });

    it('handles emoji', () => {
      const md = 'Hello World';
      const result = converter.convert(md);
      expect(result.content).toContain('Hello');
      expect(result.content).toContain('World');
    });
  });

  describe('metadata', () => {
    it('returns correct source format', () => {
      const result = converter.convert('# Test');
      expect(result.metadata?.sourceFormat).toBe('markdown');
    });

    it('returns correct target format', () => {
      const result = converter.convert('# Test');
      expect(result.metadata?.targetFormat).toBe('html');
    });

    it('includes processing time', () => {
      const result = converter.convert('# Test');
      expect(result.metadata?.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('registry integration', () => {
    it('can be registered in the converter registry', () => {
      const localRegistry = registry;
      localRegistry.clear();
      localRegistry.register(converter);

      expect(localRegistry.has('markdown', 'html')).toBe(true);
      const retrieved = localRegistry.get('markdown', 'html');
      expect(retrieved).toBe(converter);
    });
  });
});
