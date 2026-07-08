/**
 * Markdown to HTML converter using marked with GFM support
 *
 * @packageDocumentation
 */
import { Marked } from 'marked';
import type { MarkedExtension } from 'marked';
import type { ConvertOptions, ConvertResult, Format } from '../../types/index.js';
import type { Converter } from '../index.js';

/**
 * User-supplied customization for MarkdownToHtmlConverter (see ~/.config/markshift/config.mjs)
 */
export interface MarkdownToHtmlUserConfig {
  /** Merged over the converter's default Marked options (same shape the Marked constructor takes) */
  options?: MarkedExtension;
  /** Passed to marked.use(), applied after the default options */
  extensions?: MarkedExtension[];
}

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

  constructor(userConfig?: MarkdownToHtmlUserConfig) {
    // Create a new marked instance with GFM configuration
    this.markedInstance = new Marked({
      gfm: true, // Enable GFM (tables, strikethrough, task lists)
      breaks: false, // Don't convert \n to <br>
      ...userConfig?.options,
    });

    if (userConfig?.extensions) {
      this.markedInstance.use(...userConfig.extensions);
    }
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
