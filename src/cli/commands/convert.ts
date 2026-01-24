/**
 * Auto-detect convert command
 *
 * @packageDocumentation
 */
import { Command } from '@commander-js/extra-typings';
import { detectFormat } from '../utils/format-detect.js';
import { readInput, writeOutput } from '../utils/io.js';
import { createLogger } from '../utils/logger.js';
import { HtmlToMarkdownConverter } from '../../converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../../converters/markdown-to-html/index.js';
import type { GlobalOptions } from '../types.js';
import { toJsonOutput } from '../types.js';

/**
 * convert command - Auto-detect format and convert
 */
export const convertCommand = new Command('convert')
  .description('Auto-detect format and convert (HTML to Markdown or Markdown to HTML)')
  .argument('[input]', 'input file path (reads from stdin if omitted)')
  .option('-o, --output <file>', 'output file path (writes to stdout if omitted)')
  .option('-t, --to <format>', 'target format: md or html (auto-select if omitted)')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    // JSON mode suppresses log output
    const logger = createLogger(globalOpts.quiet || globalOpts.json, globalOpts.verbose);

    try {
      const startTime = performance.now();
      logger.verbose('Starting auto-detect conversion');

      const content = await readInput(input);
      const inputLength = content.length;
      logger.verbose(`Read ${inputLength} characters of input`);

      // Detect source format
      const sourceFormat = detectFormat(content);
      logger.verbose(`Detected format: ${sourceFormat}`);

      // Determine target format
      let targetFormat: 'md' | 'html';
      if (options.to) {
        if (options.to !== 'md' && options.to !== 'html') {
          command.error(`Invalid target format: ${options.to}. Use 'md' or 'html'.`, { exitCode: 1 });
          return; // unreachable, but needed for type narrowing
        }
        targetFormat = options.to;
      } else {
        // Auto-select: html -> md, markdown -> html
        targetFormat = sourceFormat === 'html' ? 'md' : 'html';
      }
      logger.verbose(`Target format: ${targetFormat}`);

      // Convert based on target format
      let result: string;
      if (targetFormat === 'md') {
        const converter = new HtmlToMarkdownConverter();
        result = converter.convert(content).content;
      } else {
        const converter = new MarkdownToHtmlConverter();
        result = converter.convert(content).content;
      }

      const processingTimeMs = performance.now() - startTime;
      logger.verbose(`Converted in ${processingTimeMs.toFixed(2)}ms`);

      // Output result
      if (globalOpts.json) {
        const sourceFormatName = sourceFormat === 'html' ? 'html' : 'markdown';
        const targetFormatName = targetFormat === 'md' ? 'markdown' : 'html';
        const jsonOutput = toJsonOutput(
          result,
          sourceFormatName,
          targetFormatName,
          processingTimeMs,
          inputLength
        );
        process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
      } else {
        await writeOutput(options.output, result);
        if (options.output) {
          logger.info(`Written to ${options.output}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      command.error(`Conversion failed: ${message}`, { exitCode: 1 });
    }
  });
