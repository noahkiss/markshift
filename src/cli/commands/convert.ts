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
import { extractContent } from '../../converters/html-to-markdown/extractors/content.js';
import { MarkdownToHtmlConverter } from '../../converters/markdown-to-html/index.js';
import { RtfToHtmlConverter } from '../../converters/rtf-to-html/index.js';
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
  .option('--extract-content', 'extract main content from HTML (strip nav/ads/boilerplate)')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    // JSON mode suppresses log output
    const logger = createLogger(globalOpts.quiet || globalOpts.json, globalOpts.verbose);

    try {
      const startTime = performance.now();
      logger.verbose('Starting auto-detect conversion');

      const inputResult = await readInput(input, { paste: globalOpts.paste });
      const content = inputResult.content;
      const inputLength = content.length;
      logger.verbose(`Read ${inputLength} characters of input`);

      // Detect source format (use clipboard format if available, otherwise detect from content)
      let sourceFormat: 'html' | 'markdown' | 'rtf';
      if (inputResult.sourceFormat) {
        // From clipboard - use the format directly, but for 'text' format run content detection
        if (inputResult.sourceFormat === 'text') {
          const detected = detectFormat(content);
          sourceFormat = detected === 'html' ? 'html' : detected === 'rtf' ? 'rtf' : 'markdown';
        } else {
          sourceFormat = inputResult.sourceFormat;
        }
      } else {
        // From file or stdin - detect from content
        const detected = detectFormat(content);
        sourceFormat = detected === 'html' ? 'html' : detected === 'rtf' ? 'rtf' : 'markdown';
      }
      logger.verbose(`Detected format: ${sourceFormat}`);

      // Extract content if requested (HTML only)
      let contentToConvert = content;
      if (globalOpts.extractContent && sourceFormat === 'html') {
        logger.verbose('Extracting main content...');
        const extracted = extractContent(content);
        if (extracted) {
          contentToConvert = extracted.content;
          logger.verbose(`Extracted: "${extracted.title}" (${extracted.content.length} chars)`);
        } else {
          logger.verbose('Content extraction returned null, using original HTML');
        }
      } else if (globalOpts.extractContent && sourceFormat !== 'html') {
        logger.verbose('--extract-content ignored: source is not HTML');
      }

      // Handle RTF via pipeline (RTF -> HTML -> Markdown)
      let result: string;
      let targetFormat: 'md' | 'html';

      if (sourceFormat === 'rtf') {
        logger.verbose('Converting via RTF->HTML->Markdown pipeline');
        const rtfConverter = new RtfToHtmlConverter();
        const htmlResult = await rtfConverter.convert(content);

        // Apply content extraction to intermediate HTML if requested
        let htmlToConvert = htmlResult.content;
        if (globalOpts.extractContent) {
          logger.verbose('Extracting main content from RTF->HTML result...');
          const extracted = extractContent(htmlResult.content);
          if (extracted) {
            htmlToConvert = extracted.content;
            logger.verbose(`Extracted: "${extracted.title}" (${extracted.content.length} chars)`);
          } else {
            logger.verbose('Content extraction returned null, using full HTML');
          }
        }

        const mdConverter = new HtmlToMarkdownConverter();
        result = mdConverter.convert(htmlToConvert).content;
        targetFormat = 'md';
      } else {
        // Determine target format
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
        if (targetFormat === 'md') {
          const converter = new HtmlToMarkdownConverter();
          result = converter.convert(contentToConvert).content;
        } else {
          const converter = new MarkdownToHtmlConverter();
          result = converter.convert(contentToConvert).content;
        }
      }

      const processingTimeMs = performance.now() - startTime;
      logger.verbose(`Converted in ${processingTimeMs.toFixed(2)}ms`);

      // Output result
      if (globalOpts.json) {
        const sourceFormatName = sourceFormat === 'rtf' ? 'rtf' : sourceFormat === 'html' ? 'html' : 'markdown';
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
        await writeOutput(options.output, result, { copy: globalOpts.copy });
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
