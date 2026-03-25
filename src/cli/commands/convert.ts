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
import { CsvToMarkdownConverter } from '../../converters/csv-to-markdown/index.js';
import { MarkdownToCsvConverter } from '../../converters/markdown-to-csv/index.js';
import { JsonToMarkdownConverter } from '../../converters/json-to-markdown/index.js';
import { StripFormattingConverter } from '../../converters/strip-formatting/index.js';
import { wrapCodeBlock } from '../../converters/code-block/index.js';
import type { GlobalOptions } from '../types.js';
import { toJsonOutput } from '../types.js';

type TargetFormat = 'md' | 'html' | 'csv' | 'text' | 'code';
type SourceFormat = 'html' | 'markdown' | 'rtf' | 'csv' | 'json';
const VALID_TARGETS: TargetFormat[] = ['md', 'html', 'csv', 'text', 'code'];

/**
 * convert command - Auto-detect format and convert
 */
export const convertCommand = new Command('convert')
  .description(
    'Auto-detect input format and convert.\n\n' +
      'Detects HTML, Markdown, RTF, CSV/TSV, or JSON and converts.\n' +
      'HTML/RTF → Markdown, Markdown → HTML, CSV/JSON → Markdown table.\n' +
      'Use -t to override target format.\n\n' +
      'Target formats: md, html, csv, text (strip formatting), code (wrap in fenced block)\n\n' +
      'Examples:\n' +
      "  echo '<p>hello</p>' | markshift convert\n" +
      '  markshift convert --paste --copy\n' +
      '  markshift convert --paste --copy --to text\n' +
      '  markshift convert --paste --copy --to code\n' +
      '  markshift convert --url https://example.com'
  )
  .argument('[input]', 'input file path (reads from stdin if omitted)')
  .option('-o, --output <file>', 'output file path (writes to stdout if omitted)')
  .option('-t, --to <format>', 'target format: md, html, csv, text, code (auto-detected if omitted)')
  .option('--extract-content', 'extract main article content, stripping nav/ads/boilerplate')
  .option('--url <url>', 'fetch URL content and convert to markdown')
  .action(async (input, options, command) => {
    const globalOpts = command.optsWithGlobals() as GlobalOptions;
    const logger = createLogger(globalOpts.quiet || globalOpts.json, globalOpts.verbose);

    try {
      const startTime = performance.now();
      logger.verbose('Starting auto-detect conversion');

      let content: string;
      let inputLength: number;
      let sourceFormat: SourceFormat;

      // Handle --url flag
      if (options.url) {
        logger.verbose(`Fetching URL: ${options.url}`);
        const res = await fetch(options.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        content = await res.text();
        inputLength = content.length;
        sourceFormat = 'html';
        logger.verbose(`Fetched ${inputLength} characters`);

        // Always extract content for URLs unless explicitly targeting html
        if (options.to !== 'html') {
          const extracted = extractContent(content);
          if (extracted) {
            content = extracted.content;
            logger.verbose(`Extracted: "${extracted.title}" (${extracted.content.length} chars)`);
          }
        }
      } else {
        const inputResult = await readInput(input, { paste: globalOpts.paste });
        content = inputResult.content;
        inputLength = content.length;
        logger.verbose(`Read ${inputLength} characters of input`);

        // Detect source format
        if (inputResult.sourceFormat && inputResult.sourceFormat !== 'text') {
          sourceFormat = inputResult.sourceFormat;
        } else {
          const detected = detectFormat(content);
          sourceFormat =
            detected === 'json'
              ? 'json'
              : detected === 'csv'
                ? 'csv'
                : detected === 'html'
                  ? 'html'
                  : detected === 'rtf'
                    ? 'rtf'
                    : 'markdown';
        }
      }
      logger.verbose(`Detected format: ${sourceFormat}`);

      // Extract content if requested (HTML only)
      if (globalOpts.extractContent && sourceFormat === 'html' && !options.url) {
        logger.verbose('Extracting main content...');
        const extracted = extractContent(content);
        if (extracted) {
          content = extracted.content;
          logger.verbose(`Extracted: "${extracted.title}" (${extracted.content.length} chars)`);
        } else {
          logger.verbose('Content extraction returned null, using original HTML');
        }
      }

      // Determine target format
      let targetFormat: TargetFormat;
      if (options.to) {
        if (!VALID_TARGETS.includes(options.to as TargetFormat)) {
          command.error(
            `Invalid target format: ${options.to}. Use: ${VALID_TARGETS.join(', ')}`,
            { exitCode: 1 }
          );
          return;
        }
        targetFormat = options.to as TargetFormat;
      } else {
        // Auto-select based on source
        switch (sourceFormat) {
          case 'html':
          case 'rtf':
          case 'csv':
          case 'json':
            targetFormat = 'md';
            break;
          case 'markdown':
            targetFormat = 'html';
            break;
        }
      }
      logger.verbose(`Target format: ${targetFormat}`);

      // Convert
      const result = await convert(content, sourceFormat, targetFormat, globalOpts, logger);

      const processingTimeMs = performance.now() - startTime;
      logger.verbose(`Converted in ${processingTimeMs.toFixed(2)}ms`);

      // Output
      const sourceFormatName = sourceFormat;
      const targetFormatName =
        targetFormat === 'md' ? 'markdown' : targetFormat === 'code' ? 'markdown' : targetFormat;

      if (globalOpts.json) {
        const jsonOutput = toJsonOutput(
          result,
          sourceFormatName,
          targetFormatName,
          processingTimeMs,
          inputLength
        );
        process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
      } else {
        const outputFormat = targetFormat === 'html' ? ('html' as const) : ('text' as const);
        await writeOutput(options.output, result, { copy: globalOpts.copy, outputFormat });
        if (options.output) {
          logger.info(`Written to ${options.output}`);
        } else if (globalOpts.copy) {
          logger.info(
            `Copied to clipboard${outputFormat === 'html' ? ' (as rich text)' : ''}`
          );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      command.error(`Conversion failed: ${message}`, { exitCode: 1 });
    }
  });

async function convert(
  content: string,
  source: SourceFormat,
  target: TargetFormat,
  opts: GlobalOptions,
  logger: ReturnType<typeof createLogger>
): Promise<string> {
  // Strip formatting — works on any input
  if (target === 'text') {
    return new StripFormattingConverter().convert(content).content;
  }

  // Wrap in code block — works on any input
  if (target === 'code') {
    return wrapCodeBlock(content);
  }

  // Source-specific pipelines
  switch (source) {
    case 'rtf': {
      logger.verbose('Converting via RTF->HTML->Markdown pipeline');
      const rtfConverter = new RtfToHtmlConverter();
      const htmlResult = await rtfConverter.convert(content);
      let html = htmlResult.content;
      if (opts.extractContent) {
        const extracted = extractContent(html);
        if (extracted) html = extracted.content;
      }
      return new HtmlToMarkdownConverter().convert(html).content;
    }

    case 'csv':
      return new CsvToMarkdownConverter().convert(content).content;

    case 'json':
      return new JsonToMarkdownConverter().convert(content).content;

    case 'html': {
      if (target === 'csv') {
        // HTML -> MD -> CSV (extract table)
        const md = new HtmlToMarkdownConverter().convert(content).content;
        return new MarkdownToCsvConverter().convert(md).content;
      }
      if (target === 'html') {
        // Round-trip to clean messy HTML (e.g. Excel)
        logger.verbose('Round-tripping HTML through Markdown for cleanup');
        const md = new HtmlToMarkdownConverter().convert(content).content;
        return new MarkdownToHtmlConverter().convert(md).content;
      }
      return new HtmlToMarkdownConverter().convert(content).content;
    }

    case 'markdown': {
      if (target === 'csv') {
        return new MarkdownToCsvConverter().convert(content).content;
      }
      return new MarkdownToHtmlConverter().convert(content).content;
    }
  }
}
