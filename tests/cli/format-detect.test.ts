/**
 * Tests for format detection utility
 */
import { describe, it, expect } from 'vitest';
import { detectFormat } from '../../src/cli/utils/format-detect.js';

describe('detectFormat', () => {
  describe('HTML detection', () => {
    it('detects simple paragraph HTML', () => {
      expect(detectFormat('<p>hello</p>')).toBe('html');
    });

    it('detects div elements', () => {
      expect(detectFormat('<div>content</div>')).toBe('html');
    });

    it('detects doctype declarations', () => {
      expect(detectFormat('<!doctype html>')).toBe('html');
    });

    it('detects full HTML documents', () => {
      expect(detectFormat('<html><body>test</body></html>')).toBe('html');
    });

    it('detects HTML with multiple tags', () => {
      expect(detectFormat('<div><p>Hello <strong>world</strong></p></div>')).toBe('html');
    });

    it('detects HTML with attributes', () => {
      expect(detectFormat('<a href="https://example.com">Link</a>')).toBe('html');
    });

    it('detects self-closing tags', () => {
      expect(detectFormat('<br/><hr/>')).toBe('html');
    });

    it('detects HTML with newlines', () => {
      expect(detectFormat('<div>\n  <p>Hello</p>\n</div>')).toBe('html');
    });
  });

  describe('Markdown detection (fallback)', () => {
    it('detects headings as markdown', () => {
      expect(detectFormat('# Heading')).toBe('markdown');
    });

    it('detects bold text as markdown', () => {
      expect(detectFormat('**bold**')).toBe('markdown');
    });

    it('detects links as markdown', () => {
      expect(detectFormat('[link](url)')).toBe('markdown');
    });

    it('detects plain text as markdown', () => {
      expect(detectFormat('Hello world')).toBe('markdown');
    });

    it('detects multi-line markdown', () => {
      const markdown = `# Title

Some paragraph text.

- List item 1
- List item 2
`;
      expect(detectFormat(markdown)).toBe('markdown');
    });

    it('detects code blocks as markdown', () => {
      expect(detectFormat('```js\nconst x = 1;\n```')).toBe('markdown');
    });

    it('detects blockquotes as markdown', () => {
      expect(detectFormat('> This is a quote')).toBe('markdown');
    });
  });

  describe('Edge cases', () => {
    it('returns text for empty string', () => {
      expect(detectFormat('')).toBe('text');
    });

    it('returns text for whitespace only', () => {
      expect(detectFormat('   ')).toBe('text');
      expect(detectFormat('\n\n')).toBe('text');
      expect(detectFormat('\t\t')).toBe('text');
    });

    it('does NOT detect custom/unknown tags as HTML', () => {
      // is-html only recognizes standard HTML tags
      expect(detectFormat('<cake>lie</cake>')).toBe('markdown');
      expect(detectFormat('<custom-element>content</custom-element>')).toBe('markdown');
    });

    it('handles text that looks like HTML but is not', () => {
      // Angle brackets in plain text (not valid HTML tags)
      expect(detectFormat('5 < 10 and 10 > 5')).toBe('markdown');
    });

    it('handles content with leading/trailing whitespace', () => {
      expect(detectFormat('  <p>hello</p>  ')).toBe('html');
      expect(detectFormat('  # Heading  ')).toBe('markdown');
    });
  });

  describe('Mixed content', () => {
    it('detects HTML when mixed with text', () => {
      expect(detectFormat('Some text <p>paragraph</p> more text')).toBe('html');
    });

    it('treats markdown with angle brackets as markdown', () => {
      // This is a markdown description with literal angle brackets
      expect(detectFormat('Use `<T>` for generics')).toBe('markdown');
    });
  });
});
