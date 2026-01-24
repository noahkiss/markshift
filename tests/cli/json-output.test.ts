/**
 * Tests for JSON output functionality (unit tests)
 */
import { describe, it, expect } from 'vitest';
import { toJsonOutput, type JsonOutput, type GlobalOptions } from '../../src/cli/types.js';
import { detectFormat } from '../../src/cli/utils/format-detect.js';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../../src/converters/markdown-to-html/index.js';

describe('JSON output (unit tests)', () => {
  describe('toJsonOutput helper', () => {
    it('creates valid JSON output structure', () => {
      const json = toJsonOutput('converted content', 'html', 'markdown', 10.5, 100);

      expect(json).toBeDefined();
      expect(typeof json.content).toBe('string');
      expect(typeof json.metadata).toBe('object');
    });

    it('includes all required metadata fields', () => {
      const json = toJsonOutput('content', 'html', 'markdown', 5.0, 50);

      expect(json.metadata).toHaveProperty('sourceFormat');
      expect(json.metadata).toHaveProperty('targetFormat');
      expect(json.metadata).toHaveProperty('processingTimeMs');
      expect(json.metadata).toHaveProperty('inputLength');
      expect(json.metadata).toHaveProperty('outputLength');
    });

    it('calculates outputLength correctly', () => {
      const content = 'test output';
      const json = toJsonOutput(content, 'html', 'markdown', 1.0, 20);

      expect(json.metadata.outputLength).toBe(content.length);
    });

    it('preserves source and target formats', () => {
      const json = toJsonOutput('content', 'markdown', 'html', 1.0, 10);

      expect(json.metadata.sourceFormat).toBe('markdown');
      expect(json.metadata.targetFormat).toBe('html');
    });
  });

  describe('simulated convert command with JSON output', () => {
    it('produces valid JSON for HTML input', () => {
      const input = '<p>Hello world</p>';
      const sourceFormat = detectFormat(input);
      expect(sourceFormat).toBe('html');

      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'html',
        'markdown',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.content).toBeDefined();
      expect(json.metadata.sourceFormat).toBe('html');
      expect(json.metadata.targetFormat).toBe('markdown');
    });

    it('produces valid JSON for Markdown input', () => {
      const input = '# Hello World';
      const sourceFormat = detectFormat(input);
      expect(sourceFormat).toBe('markdown');

      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'markdown',
        'html',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.content).toContain('<h1>');
      expect(json.metadata.sourceFormat).toBe('markdown');
      expect(json.metadata.targetFormat).toBe('html');
    });

    it('tracks input and output lengths correctly', () => {
      const input = '<p>Hello</p>';

      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'html',
        'markdown',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.metadata.inputLength).toBe(input.length);
      expect(json.metadata.outputLength).toBe(result.content.length);
    });
  });

  describe('simulated html-to-md with JSON output', () => {
    it('produces valid JSON structure', () => {
      const input = '<p>Hello world</p>';
      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'html',
        'markdown',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.content).toBeDefined();
      expect(json.metadata).toBeDefined();
    });

    it('has correct formats in metadata', () => {
      const input = '<strong>Bold</strong>';
      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'html',
        'markdown',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.metadata.sourceFormat).toBe('html');
      expect(json.metadata.targetFormat).toBe('markdown');
    });

    it('converts content correctly', () => {
      const input = '<strong>Bold text</strong>';
      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(input);

      expect(result.content).toContain('**Bold text**');
    });
  });

  describe('simulated md-to-html with JSON output', () => {
    it('produces valid JSON structure', () => {
      const input = '# Hello World';
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'markdown',
        'html',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.content).toBeDefined();
      expect(json.metadata).toBeDefined();
    });

    it('has correct formats in metadata', () => {
      const input = '**bold**';
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);

      const json = toJsonOutput(
        result.content,
        'markdown',
        'html',
        result.metadata?.processingTimeMs ?? 0,
        input.length
      );

      expect(json.metadata.sourceFormat).toBe('markdown');
      expect(json.metadata.targetFormat).toBe('html');
    });

    it('converts content correctly', () => {
      const input = '# Heading';
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(input);

      expect(result.content).toContain('<h1>');
      expect(result.content).toContain('Heading');
    });
  });

  describe('JSON serialization', () => {
    it('produces well-formed JSON with proper indentation', () => {
      const json = toJsonOutput('Test paragraph', 'html', 'markdown', 10.0, 30);

      // Serialize with same settings as CLI
      const output = JSON.stringify(json, null, 2);

      // Should be pretty-printed (contain newlines)
      expect(output).toContain('\n');
      // Should parse without error
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('content');
      expect(parsed).toHaveProperty('metadata');
    });

    it('properly escapes special characters in content', () => {
      const contentWithQuotes = 'Test with "quotes" and \\backslash';
      const json = toJsonOutput(contentWithQuotes, 'html', 'markdown', 1.0, 50);

      // Serialize and parse
      const output = JSON.stringify(json, null, 2);
      const parsed = JSON.parse(output);

      expect(parsed.content).toContain('quotes');
      expect(parsed.content).toContain('backslash');
    });

    it('handles newlines in content properly', () => {
      const contentWithNewlines = 'Line 1\n\nLine 2';
      const json = toJsonOutput(contentWithNewlines, 'html', 'markdown', 1.0, 30);

      // Serialize and parse
      const output = JSON.stringify(json, null, 2);
      const parsed = JSON.parse(output);

      expect(parsed.content).toContain('Line 1');
      expect(parsed.content).toContain('Line 2');
    });
  });

  describe('GlobalOptions interface', () => {
    it('supports json option', () => {
      const opts: GlobalOptions = {
        quiet: false,
        verbose: true,
        json: true,
      };

      expect(opts.json).toBe(true);
    });

    it('json option is optional', () => {
      const opts: GlobalOptions = {
        quiet: false,
        verbose: false,
      };

      expect(opts.json).toBeUndefined();
    });
  });
});
