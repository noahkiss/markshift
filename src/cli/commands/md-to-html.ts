/**
 * Markdown to HTML subcommand
 *
 * @packageDocumentation
 */
import { Command } from '@commander-js/extra-typings';
import { MarkdownToHtmlConverter } from '../../converters/markdown-to-html/index.js';
import { createLogger } from '../utils/logger.js';
import { readInput, writeOutput } from '../utils/io.js';

/** Global options from parent command */
interface GlobalOptions {
  quiet?: boolean;
  verbose?: boolean;
}

/**
 * md-to-html subcommand - Convert Markdown to HTML
 */
export const mdToHtmlCommand = new Command('md-to-html')
  .description('Convert Markdown to HTML')
  .argument('[input]', 'input file path (reads from stdin if omitted)')
  .option('-o, --output <file>', 'output file path (writes to stdout if omitted)')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    const logger = createLogger(globalOpts.quiet, globalOpts.verbose);

    try {
      logger.verbose('Starting Markdown to HTML conversion');
      const markdown = await readInput(input);
      logger.verbose(`Read ${markdown.length} characters of input`);

      const converter = new MarkdownToHtmlConverter();
      const result = converter.convert(markdown);

      logger.verbose(`Converted in ${result.metadata?.processingTimeMs?.toFixed(2)}ms`);
      await writeOutput(options.output, result.content);

      if (options.output) {
        logger.info(`Written to ${options.output}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      command.error(`Conversion failed: ${message}`, { exitCode: 1 });
    }
  });
