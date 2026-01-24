/**
 * RTF to HTML converter using @iarna/rtf-to-html
 *
 * This converter is an intermediate step in the RTF->HTML->Markdown pipeline.
 * It converts RTF content to HTML body fragments that can be passed to
 * HtmlToMarkdownConverter for final Markdown output.
 *
 * @packageDocumentation
 */
import { promisify } from 'node:util';
import rtfToHtml from '@iarna/rtf-to-html';
import type { ConvertOptions, ConvertResult, Format } from '../../types/index.js';

/**
 * Promisified version of rtfToHtml.fromString with options
 */
const rtfToHtmlAsync = promisify(
  (
    rtfString: string,
    options: { template?: (doc: unknown, defaults: unknown, content: string) => string },
    callback: (err: Error | null, html: string) => void
  ) => rtfToHtml.fromString(rtfString, options, callback)
);

/**
 * Converts RTF content to HTML using @iarna/rtf-to-html
 *
 * Note: This converter outputs HTML, not Markdown. Use in conjunction with
 * HtmlToMarkdownConverter for the full RTF->MD pipeline.
 *
 * Features:
 * - Preserves bold, italic, underline formatting
 * - Handles paragraph breaks
 * - Extracts body content only (no HTML wrapper)
 *
 * Not registered in the converter registry - used internally by CLI convert command.
 */
export class RtfToHtmlConverter {
  readonly sourceFormat: Format = 'rtf';
  readonly targetFormat: Format = 'html';

  /**
   * Convert RTF content to HTML
   *
   * Uses a custom template to extract only the body content,
   * avoiding the full HTML document structure.
   */
  async convert(input: string, _options?: ConvertOptions): Promise<ConvertResult> {
    const startTime = performance.now();

    // Use template to extract body content only, not full HTML document
    const html = await rtfToHtmlAsync(input, {
      template: (_doc: unknown, _defaults: unknown, content: string) => content,
    });

    const processingTimeMs = performance.now() - startTime;

    return {
      content: html,
      metadata: {
        sourceFormat: this.sourceFormat,
        targetFormat: this.targetFormat,
        processingTimeMs,
      },
    };
  }
}
