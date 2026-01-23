/**
 * Markdown to HTML converter using marked with GFM support
 *
 * @packageDocumentation
 */
import { Marked } from 'marked';
import type { ConvertOptions, ConvertResult, Format } from '../../types/index.js';
import type { Converter } from '../index.js';

/**
 * Converts Markdown to HTML using marked with GFM extensions
 *
 * Features:
 * - GFM tables, strikethrough, task lists
 * - Fenced code blocks with language-* class prefix
 * - Configurable line break handling
 */
export class MarkdownToHtmlConverter implements Converter {
  readonly sourceFormat: Format = 'markdown';
  readonly targetFormat: Format = 'html';

  private markedInstance: Marked;

  constructor() {
    // Create a new marked instance with GFM configuration
    this.markedInstance = new Marked({
      gfm: true, // Enable GFM (tables, strikethrough, task lists)
      breaks: false, // Don't convert \n to <br>
    });
  }

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    const startTime = performance.now();

    // marked.parse returns string in sync mode (default)
    const content = this.markedInstance.parse(input) as string;

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
