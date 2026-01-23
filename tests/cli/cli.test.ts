/**
 * CLI tests using Commander's exitOverride for testability
 *
 * @packageDocumentation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command, CommanderError } from '@commander-js/extra-typings';
import { VERSION } from '../../src/index.js';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../../src/converters/markdown-to-html/index.js';
import { htmlToMdCommand } from '../../src/cli/commands/html-to-md.js';
import { mdToHtmlCommand } from '../../src/cli/commands/md-to-html.js';
import { createLogger } from '../../src/cli/utils/logger.js';

describe('CLI', () => {
  let output: string[];
  let errors: string[];

  beforeEach(() => {
    output = [];
    errors = [];
  });

  /**
   * Create a test program with standard configuration
   */
  function createTestProgram() {
    return new Command()
      .name('markshift')
      .description('Convert between HTML and Markdown formats')
      .version(VERSION, '-v, --version', 'display version number')
      .option('-q, --quiet', 'suppress all non-essential output')
      .option('-V, --verbose', 'show detailed processing information')
      .exitOverride()
      .configureOutput({
        writeOut: (str) => output.push(str),
        writeErr: (str) => errors.push(str),
      });
  }

  describe('Help display', () => {
    it('displays help with --help', () => {
      const program = createTestProgram();

      expect(() => {
        program.parse(['node', 'markshift', '--help']);
      }).toThrow(CommanderError);

      const helpOutput = output.join('');
      expect(helpOutput).toContain('Usage:');
      expect(helpOutput).toContain('markshift');
      expect(helpOutput).toContain('Convert between HTML and Markdown formats');
    });

    it('displays global options in help', () => {
      const program = createTestProgram();

      expect(() => {
        program.parse(['node', 'markshift', '--help']);
      }).toThrow(CommanderError);

      const helpOutput = output.join('');
      expect(helpOutput).toContain('--quiet');
      expect(helpOutput).toContain('--verbose');
      expect(helpOutput).toContain('--version');
    });
  });

  describe('Version display', () => {
    it('displays version with --version', () => {
      const program = createTestProgram();

      expect(() => {
        program.parse(['node', 'markshift', '--version']);
      }).toThrow(CommanderError);

      expect(output.join('')).toContain(VERSION);
    });

    it('displays version with -v', () => {
      const program = createTestProgram();

      expect(() => {
        program.parse(['node', 'markshift', '-v']);
      }).toThrow(CommanderError);

      expect(output.join('')).toContain(VERSION);
    });
  });

  describe('Subcommand registration', () => {
    it('displays subcommands in help', () => {
      const program = createTestProgram();
      program.addCommand(htmlToMdCommand);
      program.addCommand(mdToHtmlCommand);

      expect(() => {
        program.parse(['node', 'markshift', '--help']);
      }).toThrow(CommanderError);

      const helpOutput = output.join('');
      expect(helpOutput).toContain('html-to-md');
      expect(helpOutput).toContain('md-to-html');
    });

    it('displays html-to-md help', () => {
      const program = createTestProgram();
      const subCmd = new Command('html-to-md')
        .description('Convert HTML to Markdown')
        .argument('[input]', 'input file path')
        .option('-o, --output <file>', 'output file path')
        .exitOverride()
        .configureOutput({
          writeOut: (str) => output.push(str),
          writeErr: (str) => errors.push(str),
        });
      program.addCommand(subCmd);

      expect(() => {
        program.parse(['node', 'markshift', 'html-to-md', '--help']);
      }).toThrow(CommanderError);

      const helpOutput = output.join('');
      expect(helpOutput).toContain('html-to-md');
      expect(helpOutput).toContain('Convert HTML to Markdown');
      expect(helpOutput).toContain('--output');
    });

    it('displays md-to-html help', () => {
      const program = createTestProgram();
      const subCmd = new Command('md-to-html')
        .description('Convert Markdown to HTML')
        .argument('[input]', 'input file path')
        .option('-o, --output <file>', 'output file path')
        .exitOverride()
        .configureOutput({
          writeOut: (str) => output.push(str),
          writeErr: (str) => errors.push(str),
        });
      program.addCommand(subCmd);

      expect(() => {
        program.parse(['node', 'markshift', 'md-to-html', '--help']);
      }).toThrow(CommanderError);

      const helpOutput = output.join('');
      expect(helpOutput).toContain('md-to-html');
      expect(helpOutput).toContain('Convert Markdown to HTML');
      expect(helpOutput).toContain('--output');
    });
  });

  describe('Unknown command error', () => {
    it('shows error for unknown command', () => {
      const program = createTestProgram();
      // Add subcommands to enable unknown command detection
      program.addCommand(
        new Command('html-to-md').description('Convert HTML to Markdown')
      );
      program.addCommand(
        new Command('md-to-html').description('Convert Markdown to HTML')
      );

      expect(() => {
        program.parse(['node', 'markshift', 'unknown-command']);
      }).toThrow(CommanderError);

      const errorOutput = errors.join('');
      expect(errorOutput).toContain('unknown command');
    });
  });
});

describe('Logger utility', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('info() writes to stderr by default', () => {
    const logger = createLogger();
    logger.info('test message');
    expect(consoleSpy).toHaveBeenCalledWith('test message');
  });

  it('info() is suppressed by quiet mode', () => {
    const logger = createLogger(true, false);
    logger.info('test message');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('verbose() only writes when verbose is enabled', () => {
    const logger = createLogger(false, false);
    logger.verbose('test message');
    expect(consoleSpy).not.toHaveBeenCalled();

    const verboseLogger = createLogger(false, true);
    verboseLogger.verbose('test message');
    expect(consoleSpy).toHaveBeenCalledWith('[verbose] test message');
  });

  it('verbose() is suppressed by quiet mode even when verbose enabled', () => {
    const logger = createLogger(true, true);
    logger.verbose('test message');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('error() always writes', () => {
    const quietLogger = createLogger(true, false);
    quietLogger.error('error message');
    expect(consoleSpy).toHaveBeenCalledWith('error message');
  });
});

describe('Converter integration', () => {
  describe('HTML to Markdown', () => {
    it('converts HTML to Markdown', () => {
      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert('<h1>Test</h1>');
      expect(result.content).toBe('# Test');
    });

    it('converts complex HTML', () => {
      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert('<h1>Hello</h1><p>World</p>');
      expect(result.content).toContain('# Hello');
      expect(result.content).toContain('World');
    });
  });

  describe('Markdown to HTML', () => {
    it('converts Markdown to HTML', () => {
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert('# Test');
      expect(result.content).toContain('<h1>Test</h1>');
    });

    it('converts complex Markdown', () => {
      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert('# Hello\n\nWorld');
      expect(result.content).toContain('<h1>Hello</h1>');
      expect(result.content).toContain('<p>World</p>');
    });
  });
});

describe('I/O utilities', () => {
  // Note: Full stdin testing is complex in Node.js testing environments.
  // These tests focus on file I/O and error handling.

  it('readInput throws helpful error in TTY mode without input', async () => {
    // This test validates the error message format
    const { readInput } = await import('../../src/cli/utils/io.js');

    // Mock stdin.isTTY to be true
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', {
      value: true,
      configurable: true,
    });

    try {
      await expect(readInput()).rejects.toThrow('No input provided');
    } finally {
      Object.defineProperty(process.stdin, 'isTTY', {
        value: originalIsTTY,
        configurable: true,
      });
    }
  });

  it('readInput throws with file context on error', async () => {
    const { readInput } = await import('../../src/cli/utils/io.js');
    await expect(readInput('nonexistent.html')).rejects.toThrow(
      "Failed to read file 'nonexistent.html'"
    );
  });

  it('writeOutput throws with file context on error', async () => {
    const { writeOutput } = await import('../../src/cli/utils/io.js');
    // Try to write to a directory path, which should fail
    await expect(writeOutput('/nonexistent/path/file.txt', 'content')).rejects.toThrow(
      "Failed to write file '/nonexistent/path/file.txt'"
    );
  });
});

// Import afterEach for the Logger tests
import { afterEach } from 'vitest';
