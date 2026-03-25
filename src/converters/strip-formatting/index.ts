/**
 * Strip formatting converter
 *
 * Removes all HTML/rich text formatting, returns plain text.
 *
 * @packageDocumentation
 */
import type { ConvertOptions, ConvertResult } from '../../types/index.js';

/**
 * Strip HTML tags and decode common entities
 */
function stripHtml(html: string): string {
  return html
    // Remove script/style blocks entirely
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Replace <br> and block-level tags with newlines
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<\/th>/gi, '\t')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    // Clean up whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Strip markdown formatting
 */
function stripMarkdown(md: string): string {
  return md
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images, keep alt text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove blockquote markers
    .replace(/^>\s?/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove code block fences
    .replace(/^```[^\n]*$/gm, '')
    .trim();
}

export class StripFormattingConverter {
  readonly sourceFormat = 'html' as const;
  readonly targetFormat = 'text' as const;

  convert(input: string, _options?: ConvertOptions): ConvertResult {
    // Detect if input is HTML or markdown
    if (input.includes('<') && (input.includes('</') || input.includes('/>'))) {
      return { content: stripHtml(input) + '\n' };
    }
    return { content: stripMarkdown(input) + '\n' };
  }
}
