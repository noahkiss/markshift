/**
 * Tests for the convert command with auto-detection (unit tests)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command, CommanderError } from '@commander-js/extra-typings';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectFormat } from '../../src/cli/utils/format-detect.js';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../../src/converters/markdown-to-html/index.js';
import { convert, convertCommand } from '../../src/cli/commands/convert.js';
import { createDefaultRegistry } from '../../src/converters/index.js';
import { loadUserConfig } from '../../src/cli/config.js';
import { setUserConfig } from '../../src/cli/config-state.js';
import { createLogger } from '../../src/cli/utils/logger.js';
import type { GlobalOptions } from '../../src/cli/types.js';

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

  describe('convert() pivot-through-markdown pipeline', () => {
    const logger = createLogger(true, false);
    const opts: GlobalOptions = {};

    it('converts csv --to html (previously ignored target, returned markdown)', async () => {
      const result = await convert('name,cmd\nfoo,bar\n', 'csv', 'html', opts, logger);
      expect(result).toContain('<table>');
      expect(result).toContain('<td>foo</td>');
    });

    it('converts json --to html (previously ignored target, returned markdown)', async () => {
      const result = await convert('[{"name":"foo","cmd":"bar"}]', 'json', 'html', opts, logger);
      expect(result).toContain('<table>');
      expect(result).toContain('<td>foo</td>');
    });

    it('converts rtf --to csv (previously ignored target, returned markdown)', async () => {
      // Minimal RTF fixture with no table — the pivot correctly reaches
      // MarkdownToCsvConverter, which then throws for lack of tabular data.
      // Before the fix this would have silently returned markdown instead.
      const rtf = '{\\rtf1\\ansi Hello \\b bold\\b0}';
      await expect(convert(rtf, 'rtf', 'csv', opts, logger)).rejects.toThrow(
        'No markdown table found'
      );
    });

    it('converts markdown --to md as a passthrough (previously fell through to HTML)', async () => {
      const md = '# Title\n\nSome text.\n';
      const result = await convert(md, 'markdown', 'md', opts, logger);
      expect(result).toBe(md);
    });
  });

  describe('convert() honors registry overrides (user config)', () => {
    const logger = createLogger(true, false);
    const opts: GlobalOptions = {};

    it('uses a direct user-registered converter for the exact pair instead of pivoting', async () => {
      const reg = createDefaultRegistry();
      reg.register(
        {
          sourceFormat: 'csv',
          targetFormat: 'html',
          convert: (input: string) => ({ content: `CUSTOM:${input}` }),
        },
        { override: true }
      );

      const result = await convert('a,b\n1,2\n', 'csv', 'html', opts, logger, reg);
      expect(result).toBe('CUSTOM:a,b\n1,2\n');
    });

    it('honors a user override for a built-in hop pair during a multi-step pivot', async () => {
      // rtf --to md pivots via rtf->html then html->markdown; overriding the
      // html->markdown pair should affect that internal hop even though the
      // requested pair itself (rtf->markdown) was never overridden.
      const reg = createDefaultRegistry();
      reg.register(
        {
          sourceFormat: 'html',
          targetFormat: 'markdown',
          convert: (input: string) => ({ content: `OVERRIDDEN(${input.length} chars)` }),
        },
        { override: true }
      );

      const rtf = '{\\rtf1\\ansi Hello \\b bold\\b0}';
      const result = await convert(rtf, 'rtf', 'md', opts, logger, reg);
      expect(result).toMatch(/^OVERRIDDEN\(\d+ chars\)$/);
    });
  });

  describe('--json with -o (B6)', () => {
    function createTestProgram() {
      return new Command()
        .name('markshift')
        .option('-q, --quiet')
        .option('-V, --verbose')
        .option('--json')
        .option('--paste')
        .option('--copy')
        .exitOverride()
        .configureOutput({ writeOut: () => {}, writeErr: () => {} });
    }

    it('writes the serialized JSON document to the output file instead of discarding it', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'markshift-test-'));
      try {
        const inputFile = join(dir, 'input.html');
        const outputFile = join(dir, 'output.json');
        await writeFile(inputFile, '<p>Hello</p>', 'utf-8');

        const program = createTestProgram();
        program.addCommand(convertCommand);
        await program.parseAsync([
          'node',
          'markshift',
          '--json',
          'convert',
          inputFile,
          '-o',
          outputFile,
        ]);

        const written = await readFile(outputFile, 'utf-8');
        const parsed = JSON.parse(written);
        expect(parsed.content).toContain('Hello');
        expect(parsed.metadata.sourceFormat).toBe('html');
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });

  describe('end-to-end: user config wired through the CLI', () => {
    // Mirrors program.ts's own preAction hook, but injects a plain import()
    // for loadUserConfig — see tests/cli/config.test.ts for why the real
    // (esbuild-safe) import path can't run inside Vitest's VM.
    function createTestProgram() {
      const testProgram = new Command()
        .name('markshift')
        .option('-q, --quiet')
        .option('-V, --verbose')
        .option('--json')
        .option('--paste')
        .option('--copy')
        .exitOverride()
        .configureOutput({ writeOut: () => {}, writeErr: () => {} });
      testProgram.hook('preAction', async () => {
        setUserConfig(await loadUserConfig((p) => import(p)));
      });
      return testProgram;
    }

    it('honors a config file loaded via MARKSHIFT_CONFIG (breaks: true -> <br>)', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'markshift-e2e-'));
      try {
        const configPath = join(dir, 'config.mjs');
        await writeFile(
          configPath,
          "export default { markdownToHtml: { options: { breaks: true } } };\n",
          'utf-8'
        );
        process.env.MARKSHIFT_CONFIG = configPath;

        const inputFile = join(dir, 'input.md');
        await writeFile(inputFile, 'line one\nline two\n', 'utf-8');
        const outputFile = join(dir, 'output.html');

        const testProgram = createTestProgram();
        testProgram.addCommand(convertCommand);
        await testProgram.parseAsync(['node', 'markshift', 'convert', inputFile, '-o', outputFile]);

        const written = await readFile(outputFile, 'utf-8');
        expect(written).toContain('<br>');
      } finally {
        delete process.env.MARKSHIFT_CONFIG;
        setUserConfig(undefined);
        await rm(dir, { recursive: true, force: true });
      }
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
