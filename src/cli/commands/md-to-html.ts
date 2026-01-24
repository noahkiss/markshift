/**
 * Markdown to HTML subcommand
 *
 * @packageDocumentation
 */
import { Command } from '@commander-js/extra-typings';
import { MarkdownToHtmlConverter } from '../../converters/markdown-to-html/index.js';
import { createLogger } from '../utils/logger.js';
import { readInput, writeOutput } from '../utils/io.js';
import type { GlobalOptions } from '../types.js';
import { toJsonOutput } from '../types.js';

/**
 * md-to-html subcommand - Convert Markdown to HTML
 */
export const mdToHtmlCommand = new Command('md-to-html')
  .description('Convert Markdown to HTML')
  .argument('[input]', 'input file path (reads from stdin if omitted)')
  .option('-o, --output <file>', 'output file path (writes to stdout if omitted)')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    // JSON mode suppresses log output
    const logger = createLogger(globalOpts.quiet || globalOpts.json, globalOpts.verbose);

    try {
      const startTime = performance.now();
      logger.verbose('Starting Markdown to HTML conversion');

      const markdown = await readInput(input);
      const inputLength = markdown.length;
      logger.verbose(`Read ${inputLength} characters of input`);

      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(markdown);

      const processingTimeMs = performance.now() - startTime;
      logger.verbose(`Converted in ${processingTimeMs.toFixed(2)}ms`);

      // Output result
      if (globalOpts.json) {
        const jsonOutput = toJsonOutput(
          result.content,
          'markdown',
          'html',
          processingTimeMs,
          inputLength
        );
        process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
      } else {
        await writeOutput(options.output, result.content);
        if (options.output) {
          logger.info(`Written to ${options.output}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      command.error(`Conversion failed: ${message}`, { exitCode: 1 });
    }
  });
