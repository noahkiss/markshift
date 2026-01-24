/**
 * HTML to Markdown subcommand
 *
 * @packageDocumentation
 */
import { Command } from '@commander-js/extra-typings';
import { HtmlToMarkdownConverter } from '../../converters/html-to-markdown/index.js';
import { createLogger } from '../utils/logger.js';
import { readInput, writeOutput } from '../utils/io.js';
import type { GlobalOptions } from '../types.js';
import { toJsonOutput } from '../types.js';

/**
 * html-to-md subcommand - Convert HTML to Markdown
 */
export const htmlToMdCommand = new Command('html-to-md')
  .description('Convert HTML to Markdown')
  .argument('[input]', 'input file path (reads from stdin if omitted)')
  .option('-o, --output <file>', 'output file path (writes to stdout if omitted)')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    // JSON mode suppresses log output
    const logger = createLogger(globalOpts.quiet || globalOpts.json, globalOpts.verbose);

    try {
      const startTime = performance.now();
      logger.verbose('Starting HTML to Markdown conversion');

      const inputResult = await readInput(input, { paste: globalOpts.paste });

      // Check for RTF content from clipboard
      if (inputResult.sourceFormat === 'rtf') {
        throw new Error("RTF content detected. Use 'convert' command or wait for Phase 7.");
      }

      const html = inputResult.content;
      const inputLength = html.length;
      logger.verbose(`Read ${inputLength} characters of input`);

      const converter = new HtmlToMarkdownConverter();
      const result = converter.convert(html);

      const processingTimeMs = performance.now() - startTime;
      logger.verbose(`Converted in ${processingTimeMs.toFixed(2)}ms`);

      // Output result
      if (globalOpts.json) {
        const jsonOutput = toJsonOutput(
          result.content,
          'html',
          'markdown',
          processingTimeMs,
          inputLength
        );
        process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
      } else {
        await writeOutput(options.output, result.content, { copy: globalOpts.copy });
        if (options.output) {
          logger.info(`Written to ${options.output}`);
        } else if (globalOpts.copy) {
          logger.info('Copied to clipboard');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      command.error(`Conversion failed: ${message}`, { exitCode: 1 });
    }
  });
