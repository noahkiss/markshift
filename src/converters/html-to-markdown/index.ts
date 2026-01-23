/**
 * HTML to Markdown converter using turndown with GFM support
 *
 * @packageDocumentation
 */
import TurndownService from 'turndown';
import { gfm } from '@truto/turndown-plugin-gfm';
import type { ConvertOptions, ConvertResult, Format } from '../../types/index.js';
import type { Converter } from '../index.js';
import { addCodeLanguageRule } from './rules/code-language.js';

/**
 * Converts HTML to Markdown using turndown with GFM plugin
 *
 * Features:
 * - ATX-style headings (# H1, ## H2, etc.)
 * - Fenced code blocks with language extraction
 * - GFM tables, strikethrough, task lists
 * - Handles malformed HTML gracefully via domino parser
 */
export class HtmlToMarkdownConverter implements Converter {
  readonly sourceFormat: Format = 'html';
  readonly targetFormat: Format = 'markdown';

  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx', // # style headings
      codeBlockStyle: 'fenced', // ``` blocks
      fence: '```',
      emDelimiter: '_', // _italic_
      strongDelimiter: '**', // **bold**
      bulletListMarker: '-', // - list items
      linkStyle: 'inlined', // [text](url)
    });

    // Add GFM support (tables, strikethrough, task lists)
    this.turndown.use(gfm);

    // Add custom rule for language extraction from code blocks
    // Must be added AFTER gfm to override default code block handling
    addCodeLanguageRule(this.turndown);
  }

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    const startTime = performance.now();

    // Turndown's domino parser handles malformed HTML gracefully
    const content = this.turndown.turndown(input);

    const processingTimeMs = performance.now() - startTime;

    return {
      content,
      metadata: {
        sourceFormat: this.sourceFormat,
        targetFormat: this.targetFormat,
        processingTimeMs,
      },
    };
  }
}
