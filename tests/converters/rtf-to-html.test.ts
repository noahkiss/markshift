import { describe, it, expect, beforeEach } from 'vitest';
import { RtfToHtmlConverter } from '../../src/converters/rtf-to-html/index.js';

describe('RtfToHtmlConverter', () => {
  let converter: RtfToHtmlConverter;

  beforeEach(() => {
    converter = new RtfToHtmlConverter();
  });

  describe('basic RTF structure', () => {
    it('converts simple text', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Hello World\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('Hello World');
    });

    it('converts bold text with \\b toggle', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard This is \\b bold\\b0  text.\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('<strong>bold</strong>');
    });

    it('converts italic text with \\i toggle', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard This is \\i italic\\i0  text.\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('<em>italic</em>');
    });

    it('converts combined bold and italic', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard \\b\\i bold italic\\i0\\b0  normal.\\par}';
      const result = await converter.convert(rtf);
      // Library outputs <em><strong>text</strong></em> (order may vary)
      expect(result.content).toContain('<strong>bold italic</strong>');
      expect(result.content).toContain('<em>');
    });

    it('converts underline text', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard This is \\ul underline\\ul0  text.\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('<u>underline</u>');
    });
  });

  describe('paragraph handling', () => {
    it('converts multiple paragraphs', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard First paragraph.\\par Second paragraph.\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('First paragraph');
      expect(result.content).toContain('Second paragraph');
      // Should have paragraph tags
      expect(result.content).toContain('<p>');
    });

    it('handles paragraph breaks correctly', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Line one\\par\\par Line two after blank.\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('Line one');
      expect(result.content).toContain('Line two after blank');
    });
  });

  describe('metadata', () => {
    it('returns sourceFormat as rtf', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Test.\\par}';
      const result = await converter.convert(rtf);
      expect(result.metadata?.sourceFormat).toBe('rtf');
    });

    it('returns targetFormat as html', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Test.\\par}';
      const result = await converter.convert(rtf);
      expect(result.metadata?.targetFormat).toBe('html');
    });

    it('includes processingTimeMs >= 0', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Test.\\par}';
      const result = await converter.convert(rtf);
      expect(result.metadata?.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('handles minimal RTF', async () => {
      const rtf = '{\\rtf1}';
      const result = await converter.convert(rtf);
      // Should not throw, may produce empty content
      expect(result.content).toBeDefined();
    });

    it('handles RTF with font table', async () => {
      const rtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\pard\\f0 Text with font.\\par}`;
      const result = await converter.convert(rtf);
      expect(result.content).toContain('Text with font');
    });

    it('handles RTF with color table', async () => {
      const rtf = `{\\rtf1\\ansi\\deff0 {\\colortbl ;\\red255\\green0\\blue0;}
\\pard\\cf1 Red text.\\par}`;
      const result = await converter.convert(rtf);
      expect(result.content).toContain('Red text');
    });

    it('handles special characters', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Test & escape.\\par}';
      const result = await converter.convert(rtf);
      expect(result.content).toContain('Test');
      expect(result.content).toContain('escape');
    });
  });

  describe('template option', () => {
    it('extracts body content only (no full HTML document)', async () => {
      const rtf = '{\\rtf1\\ansi\\deff0 \\pard Simple content.\\par}';
      const result = await converter.convert(rtf);
      // Should NOT contain DOCTYPE, html, head, body tags from full document
      expect(result.content).not.toContain('<!DOCTYPE');
      expect(result.content).not.toContain('<html>');
      expect(result.content).not.toContain('<head>');
      expect(result.content).not.toContain('<body>');
    });
  });

  describe('real-world RTF samples', () => {
    it('converts RTF with font and color tables', async () => {
      // RTF with font and color tables (common from word processors)
      const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue255;}
\\pard\\f0 Hello \\b bold\\b0  text.\\par
}`;
      const result = await converter.convert(rtf);
      expect(result.content).toContain('Hello');
      expect(result.content).toContain('<strong>bold</strong>');
    });

    it('converts RTF with mixed formatting', async () => {
      const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\pard This has \\b bold\\b0 , \\i italic\\i0 , and \\ul underline\\ul0  text.\\par
}`;
      const result = await converter.convert(rtf);
      expect(result.content).toContain('<strong>bold</strong>');
      expect(result.content).toContain('<em>italic</em>');
      expect(result.content).toContain('<u>underline</u>');
    });
  });
});
