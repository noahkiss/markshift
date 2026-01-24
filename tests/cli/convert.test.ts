/**
 * Tests for the convert command with auto-detection (unit tests)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command, CommanderError } from '@commander-js/extra-typings';
import { detectFormat } from '../../src/cli/utils/format-detect.js';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../../src/converters/markdown-to-html/index.js';

describe('convert command logic (unit tests)', () => {
  describe('format detection + conversion flow', () => {
    it('detects HTML and converts to Markdown', () => {
      const input = '<p>Hello world</p>';
      const format = detectFormat(input);
      expect(format).toBe('html');

      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('Hello world');
    });

    it('detects Markdown and converts to HTML', () => {
      const input = '# Hello World';
      const format = detectFormat(input);
      expect(format).toBe('markdown');

      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('<h1>');
      expect(result.content).toContain('Hello World');
    });

    it('handles bold text conversion from Markdown to HTML', () => {
      const input = '**bold text**';
      const format = detectFormat(input);
      expect(format).toBe('markdown');

      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('<strong>');
      expect(result.content).toContain('bold text');
    });

    it('handles link conversion from HTML to Markdown', () => {
      const input = '<a href="https://example.com">Link text</a>';
      const format = detectFormat(input);
      expect(format).toBe('html');

      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('[Link text]');
      expect(result.content).toContain('(https://example.com)');
    });
  });

  describe('explicit target format override', () => {
    it('converts HTML to Markdown when --to md is specified', () => {
      const input = '<p>Test content</p>';
      // Regardless of detection, when --to md is specified, use HTML->MD converter
      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('Test content');
      expect(result.content).not.toContain('<p>');
    });

    it('converts Markdown to HTML when --to html is specified', () => {
      const input = '# Test heading';
      // Regardless of detection, when --to html is specified, use MD->HTML converter
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('<h1>');
      expect(result.content).toContain('Test heading');
    });
  });

  describe('edge cases', () => {
    it('handles empty input (detected as text)', () => {
      const format = detectFormat('');
      expect(format).toBe('text');

      // Text input to HTML converter produces empty output
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert('');
      expect(result.content).toBe('');
    });

    it('handles complex HTML with multiple elements', () => {
      const input = '<div><p>Hello</p><p>World</p></div>';
      const format = detectFormat(input);
      expect(format).toBe('html');

      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('Hello');
      expect(result.content).toContain('World');
    });

    it('handles complex Markdown with multiple elements', () => {
      const input = `# Title

Paragraph here.

- Item 1
- Item 2
`;
      const format = detectFormat(input);
      expect(format).toBe('markdown');

      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);
      expect(result.content).toContain('<h1>');
      expect(result.content).toContain('<li>');
    });
  });

  describe('help text (command structure)', () => {
    it('convert command has correct description and options', async () => {
      // Import the actual command to verify its structure
      const { convertCommand } = await import('../../src/cli/commands/convert.js');

      expect(convertCommand.name()).toBe('convert');
      expect(convertCommand.description()).toContain('Auto-detect');

      // Check options exist
      const options = convertCommand.options.map((o: { long?: string }) => o.long);
      expect(options).toContain('--output');
      expect(options).toContain('--to');
    });
  });
});
